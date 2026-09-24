/* 기초 코스: 레슨 한 장에 개념 하나. 읽기 → 듣고 눌러 보기 → 기타로 해 보기 → 확인 문제.
   레슨 내용은 js/data/lessons.js, 진행 기록은 localStorage 'gh.course.v1' */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, clear, select, callout } = GH.ui; const N = GH.notes;
  const KEY = 'gh.course.v1';

  let store = { done: {} };
  try { const raw = JSON.parse(localStorage.getItem(KEY)); if (raw && raw.done) store = raw; } catch (e) { /* ignore */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* ignore */ } };

  const INDEX = [];
  (GH.data.course || []).forEach(ch => ch.lessons.forEach((l, i) => INDEX.push({ ch, l, i })));
  const find = id => INDEX.findIndex(x => x.l.id === id);
  const isDone = id => !!store.done[id];
  const chapterDone = ch => ch.lessons.filter(l => isDone(l.id)).length;
  const nextLesson = () => { const x = INDEX.find(x => !isDone(x.l.id)); return x ? x.l : null; };
  const href = id => '#/learn/' + id;
  /* 장을 모두 마치면 맞춤 가이드의 미션도 완료로 */
  function syncGuide() {
    if (!GH.guide) return;
    GH.data.course.forEach(ch => { const id = 'course-' + ch.id; if (ch.lessons.every(l => isDone(l.id)) && !GH.guide.isDone(id)) GH.guide.toggleDone(id, true); });
  }
  function setDone(id, on) {
    if (on === false) delete store.done[id]; else if (!store.done[id]) store.done[id] = Date.now(); else return;
    save(); syncGuide(); GH.events.emit('course', store);
  }
  const rich = text => String(text).split('**').map((part, i) => i % 2 ? h('b', null, part) : part);
  const pad = n => String(n).padStart(2, '0');

  /* ---- 소리 ---- */
  const STD = [40, 45, 50, 55, 59, 64]; /* 6번 줄 → 1번 줄 */
  const openMidi = s => STD[6 - s];
  const one = m => { GH.player.stop(); GH.audio.pluck(m, GH.audio.now() + 0.02, 1.5, { gain: 0.9 }); };
  const seq = (ms, tempo) => GH.player.playNotes(ms, { tempo: tempo || 96 });
  const together = ms => GH.player.playChord(ms);
  const chordOf = (r, q) => GH.chords.buildChord(r, q);
  const voicingOf = (r, q) => GH.voicings.forChord(r, q, ['open'])[0] || GH.voicings.representative(r, q);
  const chordMidi = (r, q) => { const v = voicingOf(r, q); return v ? v.midi.filter(m => m != null) : chordOf(r, q).notes.map(n => 48 + n.pc); };
  const playRQ = (r, q, arp) => GH.player.playChord(chordMidi(r, q), { arpeggio: !!arp });
  function playProg(list, style, tempo) {
    const cs = list.map(([r, q]) => Object.assign(chordOf(r, q), { beats: 4 }));
    return GH.player.playProgression(GH.app.toPlayable(cs, cs.map(c => voicingOf(c.root, c.qId))), { tempo: tempo || 92, style: style || 'ballad' });
  }
  const btn = (label, fn, cls) => h('button', { class: 'btn small ' + (cls || ''), type: 'button', onclick: fn }, label);
  const stopBtn = () => btn('■ 정지', () => { GH.player.stop(); if (GH.rhythm) GH.rhythm.stop(); });
  const scroll = fb => (fb && fb.el) || fb; /* fretboard() 는 스크롤 상자까지 만들어 {el} 로 돌려준다 */
  const nameOf = (pc, pref) => N.pretty(N.noteName(pc, pref || 'sharp'));
  const LETTER_KO = { C: '도', D: '레', E: '미', F: '파', G: '솔', A: '라', B: '시' };
  const NATURAL = [0, 2, 4, 5, 7, 9, 11];
  const MAJOR = [['1', 0], ['2', 2], ['3', 4], ['4', 5], ['5', 7], ['6', 9], ['7', 11]];
  const scaleNames = root => MAJOR.map(([iv]) => N.spell(root, iv));

  /* ---- 레슨 위젯 ---- */
  const WIDGETS = {
    /* 건반: 흰 건반 이름 (sharps 면 검은 건반 이름도) */
    keys(w) {
      const on = {};
      NATURAL.forEach(pc => { on[pc] = { label: N.noteName(pc), cls: 'plain' }; });
      if (w.sharps) [1, 3, 6, 8, 10].forEach(pc => { on[pc] = { label: '', cls: 'iv-t' }; });
      const wrap = h('div', { class: 'lesson-stack' }, h('div', { class: 'lesson-piano' }, GH.render.piano({ from: w.from || 60, to: w.to || 72, on })));
      if (!w.sharps) wrap.appendChild(h('div', { class: 'lesson-pills' }, NATURAL.map(pc => { const n = N.noteName(pc); return h('button', { class: 'pill lesson-pill', type: 'button', onclick: () => one(60 + pc) }, h('b', null, n), ' ' + LETTER_KO[n]); })));
      else wrap.appendChild(h('div', { class: 'lesson-pills' }, [1, 3, 6, 8, 10].map(pc => h('button', { class: 'pill lesson-pill iv-t', type: 'button', onclick: () => one(60 + pc) }, nameOf(pc, 'sharp') + ' = ' + nameOf(pc, 'flat')))));
      wrap.appendChild(h('p', { class: 'muted small' }, w.sharps ? '검은 건반은 두 가지 이름을 가집니다. 버튼을 눌러 소리를 들어 보세요.' : '건반이나 버튼을 누르면 소리가 납니다.'));
      return wrap;
    },
    /* 한 줄만: 반음 / 온음 */
    string(w) {
      const s = w.s || 1, to = w.to || 12; const open = openMidi(s); const notes = [];
      for (let f = 0; f <= to; f++) { const pc = (open + f) % 12; const nat = NATURAL.includes(pc); notes.push({ s, f, label: nat ? N.noteName(pc) : '·', cls: nat ? 'iv-3' : 'iv-x' }); }
      return h('div', { class: 'lesson-stack' }, scroll(GH.render.fretboard({ from: 0, to, notes, showStringNames: true })),
        h('p', { class: 'muted small' }, s + '번 줄. 파란 음이 C D E F G A B, 점은 그 사이의 # · b 음입니다. E–F, B–C 만 바로 옆 칸이에요. 지판을 누르면 소리가 납니다.'));
    },
    openStrings() {
      const names = ['E', 'A', 'D', 'G', 'B', 'E'];
      const notes = [6, 5, 4, 3, 2, 1].map((s, i) => ({ s, f: 0, label: names[i], cls: 'iv-3' }));
      return h('div', { class: 'lesson-stack' },
        h('div', { class: 'lesson-pills' }, [6, 5, 4, 3, 2, 1].map((s, i) => h('button', { class: 'btn small', type: 'button', onclick: () => one(openMidi(s)) }, s + '번 줄 · ' + names[i])), btn('▶ 모두 치기', () => together(STD), 'primary')),
        scroll(GH.render.fretboard({ from: 0, to: 5, notes, showStringNames: true })));
    },
    fretNotes(w) {
      const to = w.to || 12; const notes = [];
      (w.strings || [6, 5]).forEach(s => { const open = openMidi(s); for (let f = 0; f <= to; f++) { const pc = (open + f) % 12; if (NATURAL.includes(pc)) notes.push({ s, f, label: N.noteName(pc), cls: s === 6 ? 'iv-3' : 'iv-5' }); } });
      return h('div', { class: 'lesson-stack' }, scroll(GH.render.fretboard({ from: 0, to, notes, showStringNames: true })),
        GH.ui.legend([{ cls: 'iv-3', label: '6번 줄' }, { cls: 'iv-5', label: '5번 줄' }]),
        h('p', { class: 'muted small' }, '# · b 음은 빼고 C D E F G A B 만 표시했습니다. 누르면 소리가 납니다.'));
    },
    /* 인터벌 목록: 따로 · 같이 듣기, 고른 인터벌을 5번 줄 위에 표시 */
    interval(w) {
      const root = 48; /* C3: 5번 줄 3프렛 */
      const fbBox = h('div');
      const draw = semis => {
        clear(fbBox);
        const notes = [{ s: 5, f: 3, label: 'C', cls: 'iv-1' }];
        if (semis) notes.push({ s: 5, f: 3 + semis, label: nameOf((root + semis) % 12, 'flat'), cls: 'iv-3' });
        const fb = scroll(GH.render.fretboard({ from: 0, to: 15, notes, showStringNames: true }));
        fbBox.appendChild(fb);
        /* 좁은 화면: 고른 음이 보이게 가로로 밀어 둔다 */
        requestAnimationFrame(() => { if (fb.scrollWidth > fb.clientWidth) fb.scrollLeft = Math.max(0, (3 + semis / 2 + 1) / 16.5 * fb.scrollWidth - fb.clientWidth / 2); });
      };
      const rows = h('div', { class: 'iv-rows' });
      w.list.forEach(([name, semis, sub], i) => {
        const row = h('div', { class: 'iv-row' + (i === 0 ? ' active' : '') },
          h('div', { class: 'iv-name' }, h('b', null, name), h('span', { class: 'muted' }, sub)),
          h('span', { class: 'badge' }, '반음 ' + semis),
          h('div', { class: 'iv-btns' },
            btn('따로 ▶', () => { pick(); seq([root + 12, root + 12 + semis], 80); }),
            btn('같이 ▶', () => { pick(); together([root + 12, root + 12 + semis]); })));
        const pick = () => { rows.querySelectorAll('.iv-row').forEach(r => r.classList.toggle('active', r === row)); draw(semis); };
        row.addEventListener('click', e => { if (!e.target.closest('button')) pick(); });
        rows.appendChild(row);
      });
      draw(w.list[0][1]);
      const out = h('div', { class: 'lesson-stack' }, rows);
      if (w.extra) out.appendChild(h('div', { class: 'lesson-pills' }, w.extra.map(([label, ms]) => btn('▶ ' + label, () => together(ms), 'primary'))));
      out.appendChild(fbBox);
      out.appendChild(h('p', { class: 'muted small' }, '지판: 빨간 C(5번 줄 3프렛)에서 고른 인터벌까지. 같은 줄에서는 반음 수 = 프렛 칸 수입니다.'));
      return out;
    },
    triad(w) {
      const c = chordOf(w.root, w.q); const base = 60;
      const lab = iv => iv === '1' ? 'R' : iv.replace('b', '♭');
      const midis = c.notes.map(n => base + N.mod(n.pc - c.rootPc, 12));
      const onMidi = {}; midis.forEach((m, i) => { onMidi[m] = { label: lab(c.notes[i].iv), cls: c.notes[i].cls }; });
      const v = voicingOf(w.root, w.q);
      const ko = { '1': '루트', '3': '3도', 'b3': '3도', '5': '5도' };
      return h('div', { class: 'lesson-stack' },
        h('div', { class: 'lesson-piano' }, GH.render.piano({ from: 60, to: 72, onMidi })),
        h('div', { class: 'lesson-pills' }, c.notes.map((n, i) => h('button', { class: 'pill lesson-pill ' + n.cls, type: 'button', onclick: () => one(midis[i]) }, (ko[n.iv] || n.iv) + ' · ' + N.pretty(n.name))),
          btn('따로 ▶', () => seq(midis, 90)), btn('같이 ▶', () => together(midis), 'primary')),
        v ? h('div', { class: 'lesson-diagram' }, GH.render.chordCard(v, { labelMode: 'iv', meta: false }), h('p', { class: 'muted small' }, '기타로 잡은 ' + c.symbol + '. R · 3 · 5 가 여러 줄에 겹쳐 있어요.')) : null);
    },
    majorMinor(w) {
      const grid = h('div', { class: 'mm-grid' });
      w.pairs.forEach(([r, q1, q2]) => {
        const a = chordOf(r, q1), b = chordOf(r, q2);
        const t1 = a.notes.find(n => n.iv === '3'), t2 = b.notes.find(n => n.iv === 'b3');
        const card = (c, q) => { const v = voicingOf(r, q); return h('div', { class: 'mm-one' }, v ? GH.render.chordCard(v, { labelMode: 'iv', meta: false }) : btn('▶ ' + c.symbol, () => playRQ(r, q))); };
        grid.appendChild(h('div', { class: 'mm-pair card' }, h('div', { class: 'row', style: 'gap:10px;justify-content:center' }, card(a, q1), card(b, q2)),
          h('p', { class: 'muted small', style: 'text-align:center' }, '3도: ' + (t1 ? N.pretty(t1.name) : '') + ' → ' + (t2 ? N.pretty(t2.name) : '') + ' (반음 내림)')));
      });
      return h('div', { class: 'lesson-stack' }, grid);
    },
    chords(w) {
      const pref = 'sharp';
      return h('div', { class: 'grid diagrams lesson-chords' }, w.list.map(([r, q]) => {
        const v = voicingOf(r, q); const c = chordOf(r, q);
        return h('div', { class: 'lesson-chord' }, v ? GH.render.chordCard(v, { labelMode: 'finger', meta: false, pref }) : btn('▶ ' + c.symbol, () => playRQ(r, q)));
      }));
    },
    symbols(w) {
      const rows = w.list.map(([q, read, feel]) => {
        const c = chordOf(w.root, q);
        return [h('b', { class: 'symbol-mid' }, c.symbol), read, h('span', { class: 'sym-notes' }, c.notes.map(n => h('span', { class: 'fn-' + (n.iv === '1' ? 'D' : 'X') }, N.pretty(n.name)))), feel, btn('▶', () => playRQ(w.root, q))];
      });
      return GH.ui.table(['심벌', '읽는 법', '구성음', '느낌', ''], rows);
    },
    metronome(w) {
      let ctl = null; let tempo = w.tempo || 70;
      const dots = h('div', { class: 'beat-dots lesson-dots' }, [0, 1, 2, 3].map(i => h('span', { class: 'beat-dot' + (i === 0 ? ' accent' : '') }, String(i + 1))));
      const light = b => dots.querySelectorAll('.beat-dot').forEach((d, i) => d.classList.toggle('on', i === b));
      const go = h('button', { class: 'btn primary', type: 'button' }, '▶ 시작');
      const set = on => { go.textContent = on ? '■ 멈춤' : '▶ 시작'; go.classList.toggle('playing', on); };
      go.addEventListener('click', () => {
        if (ctl && GH.rhythm.current() === ctl) { GH.rhythm.stop(); ctl = null; set(false); light(-1); return; }
        GH.player.stop();
        ctl = GH.rhythm.metronome({ tempo, beats: 4, onTick: (b, k) => { if (k === 0) light(b); }, onStop: () => { set(false); light(-1); } });
        set(!!ctl);
      });
      const bpm = GH.ui.rangeNumber({ value: tempo, min: 40, max: 200, suffix: 'BPM', label: '템포', onInput: v => { tempo = v; if (ctl) ctl.tempo = v; } });
      return h('div', { class: 'lesson-stack' }, h('div', { class: 'row', style: 'gap:14px;flex-wrap:wrap;align-items:center' }, go, h('label', null, '템포 ', bpm)), dots);
    },
    rhythm(w) {
      return h('div', { class: 'rhythm-rows' }, w.list.map(([label, p]) => {
        const mini = GH.render.rhythmMini ? GH.render.rhythmMini(p) : null;
        /* 좁은 칸에서도 잘리지 않게: 고정 크기 악보를 칸 너비에 맞춰 줄인다 */
        const sv = mini && mini.querySelector && mini.querySelector('svg');
        if (sv) { const W = parseFloat(sv.getAttribute('width')) || 250, H = parseFloat(sv.getAttribute('height')) || 80; if (!sv.getAttribute('viewBox')) sv.setAttribute('viewBox', '0 0 ' + W + ' ' + H); sv.removeAttribute('width'); sv.removeAttribute('height'); sv.style.width = '100%'; sv.style.height = 'auto'; }
        return h('div', { class: 'rhythm-row' }, h('b', null, label), mini || h('code', null, p),
          btn('▶ 듣기', () => { GH.player.stop(); GH.rhythm.playPattern(GH.rhythm.parse(p), { tempo: 80, countIn: 1, click: true }); }));
      }));
    },
    strum(w) {
      const chords = w.chords.map(([r, q]) => Object.assign(chordOf(r, q), { beats: 4 }));
      const names = chords.map(c => c.symbol).join(' – ');
      return h('div', { class: 'strum-rows' }, w.ids.map(id => {
        const S = GH.data.strums.find(x => x.id === id); if (!S) return null;
        const slots = S.p.trim().split(/\s+/);
        const cells = slots.map((x, i) => h('span', { class: 'ls-slot' + (x === '-' ? ' rest' : '') + (i % (S.grid / 4) === 0 ? ' beat' : '') }, x === '-' ? '·' : x));
        const box = h('div', { class: 'ls-slots', style: 'grid-template-columns:repeat(' + slots.length + ',minmax(0,1fr))' }, cells);
        const lightSlot = k => cells.forEach((c, i) => c.classList.toggle('on', i === k));
        return h('div', { class: 'strum-row card' }, h('div', { class: 'row', style: 'gap:10px;justify-content:space-between;flex-wrap:wrap' }, h('b', null, S.ko),
          h('div', { class: 'row', style: 'gap:6px' }, btn('▶ ' + names, () => { GH.player.stop(); GH.rhythm.playStrum(S, chords, { tempo: Math.max(60, S.tempo - 10), metronome: true, onSlot: k => lightSlot(k), onStop: () => lightSlot(-1) }); }, 'primary'), stopBtn())),
          box, h('p', { class: 'muted small' }, S.desc));
      }));
    },
    scale(w) {
      const box = h('div'); let root = w.roots[0];
      const draw = () => {
        clear(box);
        const names = scaleNames(root).concat([root]);
        const base = root === 'C' ? 60 : 55;
        const midis = MAJOR.map(([, s]) => base + s).concat([base + 12]);
        const steps = ['온', '온', '반', '온', '온', '온', '반'];
        const line = h('div', { class: 'scale-line' });
        names.forEach((n, i) => { line.appendChild(h('button', { class: 'pill lesson-pill' + (i === 0 || i === 7 ? ' iv-1' : ''), type: 'button', onclick: () => one(midis[i]) }, N.pretty(n))); if (i < 7) line.appendChild(h('span', { class: 'scale-step' + (steps[i] === '반' ? ' half' : '') }, steps[i])); });
        const s = root === 'C' ? 5 : 6; const startF = 3;
        const notes = MAJOR.map(([, st], i) => ({ s, f: startF + st, label: N.pretty(names[i]), cls: i === 0 ? 'iv-1' : 'iv-3' })).concat([{ s, f: startF + 12, label: N.pretty(root), cls: 'iv-1' }]);
        box.appendChild(h('div', { class: 'lesson-stack' }, line,
          h('div', { class: 'lesson-pills' }, btn('▶ 올라가기', () => seq(midis, 110), 'primary'), btn('▶ 내려가기', () => seq(midis.slice().reverse(), 110))),
          scroll(GH.render.fretboard({ from: 0, to: 15, notes, showStringNames: true })),
          h('p', { class: 'muted small' }, s + '번 줄 한 줄로 친 ' + N.pretty(root) + ' 메이저 스케일. 반음 자리는 프렛 한 칸, 온음 자리는 두 칸입니다.')));
      };
      draw();
      const pick = h('div', { class: 'seg' }, w.roots.map(r => h('button', { class: 'btn small' + (r === root ? ' primary' : ''), type: 'button', onclick: e => { root = r; e.currentTarget.parentNode.querySelectorAll('.btn').forEach(b => b.classList.toggle('primary', b === e.currentTarget)); draw(); } }, N.pretty(r) + ' 메이저')));
      return h('div', { class: 'lesson-stack' }, pick, box);
    },
    key(w) {
      const box = h('div'); let key = w.keys[0];
      const draw = () => {
        clear(box);
        const names = scaleNames(key); const rootPc = N.pcOf(key);
        const base = rootPc >= 5 ? 48 + rootPc : 60 + rootPc; /* F3 ~ E4 사이에서 시작 */
        const midis = MAJOR.map(([, s]) => base + s);
        const on = {}; names.forEach((n, i) => { on[N.pcOf(n)] = { label: i === 0 ? 'T' : String(i + 1), cls: i === 0 ? 'iv-1' : 'iv-3' }; });
        box.appendChild(h('div', { class: 'lesson-stack' },
          h('div', { class: 'lesson-pills' }, names.map((n, i) => h('span', { class: 'pill ' + (i === 0 ? 'iv-1' : 'iv-s') }, N.pretty(n) + (i === 0 ? ' 토닉' : '')))),
          h('div', { class: 'lesson-piano' }, GH.render.piano({ from: 48, to: 72, on })),
          h('div', { class: 'lesson-pills' },
            btn('▶ 스케일 (토닉에서 끝)', () => seq(midis.concat([base + 12]), 110), 'primary'),
            btn('▶ 시에서 멈추기', () => seq(midis, 110)),
            btn('▶ 토닉 코드 ' + GH.chords.symbol(key, 'maj'), () => playRQ(key, 'maj')))));
      };
      draw();
      const sel = select({ options: w.keys.map(k => ({ value: k, label: N.pretty(k) + ' 메이저 키' })), value: key, onChange: v => { key = v; draw(); } });
      return h('div', { class: 'lesson-stack' }, h('label', null, '키 ', sel), box);
    },
    diatonic(w) {
      const box = h('div'); let key = w.keys[0];
      const ROMAN = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']; const Q = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim']; const FN = ['T', 'S', 'T', 'S', 'D', 'T', 'D'];
      const draw = () => {
        clear(box);
        const roots = scaleNames(key);
        const list = roots.map((r, i) => ({ r, q: Q[i], c: chordOf(r, Q[i]) }));
        box.appendChild(h('div', { class: 'dia-grid' }, list.map((x, i) => h('button', { class: 'dia-cell ' + GH.app.fnClass(FN[i]), type: 'button', onclick: () => playRQ(x.r, x.q) },
          h('span', { class: 'roman' }, ROMAN[i]), h('b', null, x.c.symbol), h('span', { class: 'muted small' }, (i + 1) + '도 · ' + (Q[i] === 'maj' ? '메이저' : Q[i] === 'min' ? '마이너' : '디미니시'))))));
        box.appendChild(h('div', { class: 'lesson-pills' }, btn('▶ 1도부터 차례로', () => playProg(list.map(x => [x.r, x.q]), 'ballad', 120), 'primary'), stopBtn()));
      };
      draw();
      const sel = select({ options: w.keys.map(k => ({ value: k, label: N.pretty(k) + ' 메이저 키' })), value: key, onChange: v => { key = v; draw(); } });
      return h('div', { class: 'lesson-stack' }, h('label', null, '키 ', sel), box, h('p', { class: 'muted small' }, '칸을 누르면 그 코드가 울립니다. 대문자 로마 숫자는 메이저, 소문자는 마이너 코드예요.'));
    },
    pent() {
      const pos = [[6, 5], [6, 8], [5, 5], [5, 7], [4, 5], [4, 7], [3, 5], [3, 7], [2, 5], [2, 8], [1, 5], [1, 8]];
      const midis = pos.map(([s, f]) => openMidi(s) + f);
      const notes = pos.map(([s, f], i) => { const pc = midis[i] % 12; return { s, f, label: N.noteName(pc), cls: pc === 9 ? 'iv-1' : 'iv-3' }; });
      return h('div', { class: 'lesson-stack' }, scroll(GH.render.fretboard({ from: 3, to: 10, notes, showStringNames: true })),
        h('div', { class: 'lesson-pills' }, btn('▶ 올라가기', () => seq(midis, 120), 'primary'), btn('▶ 내려가기', () => seq(midis.slice().reverse(), 120)), stopBtn()),
        GH.ui.legend([{ cls: 'iv-1', label: '루트 A' }, { cls: 'iv-3', label: 'C · D · E · G' }]));
    },
    function(w) {
      return h('div', { class: 'fn-rows' }, w.items.map(([label, list, fn]) => h('div', { class: 'fn-row' },
        h('span', { class: 'fn ' + GH.app.fnClass(fn) }, fn), h('b', null, label),
        h('span', { class: 'muted' }, list.map(([r, q]) => GH.chords.symbol(r, q)).join(' → ')),
        btn('▶ 듣기', () => playProg(list, 'ballad', 84), 'primary'))));
    },
    progression(w) {
      return h('div', { class: 'grid cols-2 lesson-progs' }, w.items.map(it => {
        const cs = it.chords.map(([r, q]) => chordOf(r, q));
        return h('div', { class: 'card' }, h('div', { class: 'title' }, it.title), h('p', { class: 'muted small' }, it.sub),
          h('div', { class: 'prog-strip' }, cs.map((c, i) => h('div', { class: 'prog-cell' }, h('div', { class: 'roman' }, it.roman[i]), h('div', { class: 'chord' }, c.symbol)))),
          h('div', { class: 'lesson-pills' }, btn('▶ 듣기', () => playProg(it.chords, it.style, it.style === 'swing' ? 112 : 92), 'primary'), stopBtn(),
            it.backing ? h('a', { class: 'btn small', href: GH.router.href('/backing', { id: it.backing[0], key: it.backing[1], style: it.style }) }, 'MR로 연습하기 →') : null));
      }));
    },
    jam(w) {
      return h('div', { class: 'grid cols-2' }, w.links.map(x => h('a', { class: 'card link jam-card', href: GH.router.href('/backing', { id: x.href[0], key: x.href[1], style: x.href[2] }) },
        h('span', { class: 'eyebrow' }, 'BACKING TRACK'), h('div', { class: 'title' }, x.title), h('p', { class: 'muted' }, x.desc), h('span', { class: 'btn small primary' }, '▶ MR 열기'))));
    }
  };

  /* ---- 확인 문제 ---- */
  function shuffle(a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  function quizBox(l, onCorrect) {
    const q = l.quiz; if (!q) return null;
    const fb = h('div', { class: 'quiz-feedback', 'aria-live': 'polite', hidden: true });
    const opts = h('div', { class: 'quiz-opts lesson-quiz-opts' });
    const listen = () => {
      const p = q.play; if (!p) return;
      if (p.notes) (p.together ? together(p.notes) : seq(p.notes, 90));
      else if (p.chord) playRQ(p.chord[0], p.chord[1]);
      else if (p.prog) playProg(p.prog, 'ballad', 84);
    };
    shuffle(q.options.map((_, i) => i)).forEach(i => {
      const b = h('button', { class: 'btn', type: 'button' }, q.options[i]);
      b.addEventListener('click', () => {
        fb.hidden = false;
        if (i === q.answer) {
          b.classList.add('correct'); opts.querySelectorAll('.btn').forEach(x => { x.disabled = true; });
          clear(fb).appendChild(h('span', null, h('b', null, '정답! '), q.why));
          onCorrect();
        } else {
          b.classList.add('wrong'); b.disabled = true;
          clear(fb).appendChild(h('span', null, h('b', null, '아쉬워요. '), '다른 답을 골라 보세요.' + (q.play ? ' 한 번 더 들어 봐도 좋아요.' : '')));
        }
      });
      opts.appendChild(b);
    });
    return h('div', null, h('p', { class: 'quiz-q' }, q.q), q.play ? h('div', { class: 'lesson-pills' }, btn('▶ 문제 듣기', listen, 'primary')) : null, opts, fb);
  }

  /* ---- 레슨 페이지 ---- */
  function renderLesson(el, params) {
    const k = find(params.id);
    if (k < 0) { el.appendChild(h('h1', null, '레슨을 찾을 수 없어요')); el.appendChild(h('p', null, h('a', { href: '#/learn' }, '기초 코스 목록으로'))); return; }
    const { ch, l, i } = INDEX[k];
    const prev = INDEX[k - 1], next = INDEX[k + 1];
    el.classList.add('lesson-page');
    el.appendChild(h('nav', { class: 'lesson-crumb', 'aria-label': '레슨 위치' }, h('a', { href: '#/learn' }, '기초 코스'), h('span', { 'aria-hidden': 'true' }, '/'), h('span', null, ch.n + '장 ' + ch.title)));
    el.appendChild(h('ol', { class: 'lesson-steps', 'aria-label': ch.title + ' 레슨' }, ch.lessons.map((x, j) => h('li', { class: (j === i ? 'current' : '') + (isDone(x.id) ? ' done' : '') },
      h('a', { href: href(x.id), 'aria-current': j === i ? 'page' : null, title: x.title }, h('span', { class: 'n' }, isDone(x.id) ? '✓' : String(j + 1)), h('span', { class: 't' }, x.title.split(':')[0]))))));
    el.appendChild(h('header', { class: 'lesson-head' },
      h('span', { class: 'eyebrow' }, 'LESSON ' + pad(k + 1) + ' · ' + ch.en),
      h('h1', null, l.title), h('p', { class: 'lesson-lead' }, l.lead)));
    el.appendChild(h('div', { class: 'lesson-body' }, l.body.map(p => h('p', null, rich(p)))));
    if (l.widget && WIDGETS[l.widget.type]) el.appendChild(h('section', { class: 'lesson-box lesson-widget' }, h('h2', null, h('span', { class: 'lesson-ic', 'aria-hidden': 'true' }, GH.icon('headphones')), '듣고 눌러 보기'), WIDGETS[l.widget.type](l.widget)));
    if (l.try) el.appendChild(h('section', { class: 'lesson-box lesson-try' }, h('h2', null, h('span', { class: 'lesson-ic', 'aria-hidden': 'true' }, GH.icon('guitar')), '기타로 해 보기'), h('ol', null, l.try.map(t => h('li', null, rich(t))))));
    if (l.remember) el.appendChild(h('div', { class: 'lesson-remember' }, h('b', null, '꼭 기억하기'), h('p', null, rich(l.remember))));
    if (l.terms) el.appendChild(h('section', { class: 'lesson-terms-box' }, h('h2', null, '이 레슨의 용어'),
      h('dl', { class: 'lesson-terms' }, l.terms.map(([ko, en, d]) => h('div', null, h('dt', null, ko, h('span', { class: 'en' }, en)), h('dd', null, d))))));
    const doneNote = h('p', { class: 'muted small lesson-done-note' });
    const markBtn = h('button', { class: 'btn small ghost', type: 'button' });
    const refresh = () => {
      const d = isDone(l.id);
      doneNote.textContent = d ? '이 레슨을 마쳤어요. 다음 레슨으로 넘어가세요.' : '문제를 맞히면 레슨 완료로 기록됩니다.';
      markBtn.textContent = d ? '완료 표시 지우기' : '문제 건너뛰고 완료로 표시';
      el.querySelectorAll('.lesson-steps li')[i].classList.toggle('done', d);
      const n = el.querySelectorAll('.lesson-steps li .n')[i]; if (n) n.textContent = d ? '✓' : String(i + 1);
    };
    markBtn.addEventListener('click', () => { setDone(l.id, !isDone(l.id)); refresh(); });
    if (l.quiz) el.appendChild(h('section', { class: 'lesson-box lesson-quiz' }, h('h2', null, h('span', { class: 'lesson-ic', 'aria-hidden': 'true' }, GH.icon('check')), '확인 문제'), quizBox(l, () => { setDone(l.id); refresh(); }), h('div', { class: 'row', style: 'gap:10px;align-items:center;flex-wrap:wrap' }, doneNote, markBtn)));
    refresh();
    if (l.more) el.appendChild(h('div', { class: 'lesson-more' }, h('span', { class: 'muted' }, '더 알아보기 '), h('div', { class: 'toc' }, l.more.map(([hr, label]) => h('a', { href: hr }, label)))));
    const lastOfCh = i === ch.lessons.length - 1;
    el.appendChild(h('nav', { class: 'lesson-nav', 'aria-label': '이전 · 다음 레슨' },
      prev ? h('a', { class: 'lesson-prev', href: href(prev.l.id) }, h('small', null, '← 이전'), h('span', null, prev.l.title)) : h('a', { class: 'lesson-prev', href: '#/learn' }, h('small', null, '←'), h('span', null, '코스 목록')),
      next ? h('a', { class: 'lesson-next', href: href(next.l.id) }, h('small', null, lastOfCh ? '다음 장 · ' + next.ch.n + '장 ' + next.ch.title + ' →' : '다음 →'), h('span', null, next.l.title))
        : h('a', { class: 'lesson-next', href: '#/learn' }, h('small', null, '기초 코스 끝 →'), h('span', null, '다음 단계 로드맵 보기'))));
  }
  GH.pages['/learn/:id'] = { title: '기초 코스', staff: true, render: renderLesson };

  /* ---- 코스 목록 (배우기 페이지 위쪽) ---- */
  function overview() {
    const total = INDEX.length, done = INDEX.filter(x => isDone(x.l.id)).length;
    const nx = nextLesson();
    const wrap = h('section', { class: 'section course-overview' });
    wrap.appendChild(h('div', { class: 'display-head compact' }, h('span', { class: 'en' }, 'BEGINNER COURSE'), h('h2', null, '기초 코스'),
      h('p', null, '레슨 한 장에 개념 하나. 읽고, 듣고, 눌러 보고, 기타로 쳐 본 뒤 짧은 문제로 확인합니다. 음악을 처음 배운다면 1장부터 순서대로 따라오세요.')));
    wrap.appendChild(h('div', { class: 'course-resume card' },
      h('div', null, h('b', null, done ? '진행 ' + done + ' / ' + total + ' 레슨' : '총 ' + total + '개 레슨 · 한 레슨 5~10분'),
        h('div', { class: 'course-bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': done }, h('i', { style: 'width:' + Math.round(done / total * 100) + '%' }))),
      nx ? h('a', { class: 'btn primary', href: href(nx.id) }, (done ? '이어서 하기: ' : '첫 레슨 시작: ') + nx.title.split(':')[0] + ' →') : h('span', { class: 'badge' }, '기초 코스를 모두 마쳤어요!')));
    wrap.appendChild(h('div', { class: 'grid cols-3 course-chapters' }, GH.data.course.map(ch => {
      const d = chapterDone(ch);
      return h('article', { class: 'card course-ch' + (d === ch.lessons.length ? ' complete' : '') },
        h('div', { class: 'course-ch-top' }, h('span', { class: 'course-ch-n', 'aria-hidden': 'true' }, pad(ch.n)), h('span', { class: 'muted small' }, d + ' / ' + ch.lessons.length)),
        h('h3', null, ch.title), h('p', { class: 'muted small' }, ch.desc),
        h('ol', { class: 'course-lessons' }, ch.lessons.map(x => h('li', { class: isDone(x.id) ? 'done' : '' }, h('a', { href: href(x.id) }, h('span', { class: 'chk', 'aria-hidden': 'true' }, isDone(x.id) ? '✓' : ''), x.title.split(':')[0])))));
    })));
    return wrap;
  }
  /* 레퍼런스 페이지 위쪽의 안내: 처음 배우는 사람에게 해당 레슨을 먼저 권한다 (기초 이론을 아는 수준이면 숨김) */
  function hint(lessonId) {
    const k = find(lessonId); if (k < 0) return null;
    const { ch, l } = INDEX[k];
    const prof = GH.guide && GH.guide.profile ? GH.guide.profile() : null;
    if (prof && ['theory', 'player', 'advanced'].includes(prof.level)) return null;
    if (ch.lessons.every(x => isDone(x.id))) return null;
    return h('div', { class: 'course-hint' }, h('span', { class: 'lesson-ic', 'aria-hidden': 'true' }, GH.icon('learn')),
      h('p', null, h('b', null, '처음이라면 '), '이 페이지는 전체를 모아 둔 자료실이에요. 기초 코스 ' + ch.n + '장 「' + ch.title + '」에서 한 장씩 먼저 익히면 훨씬 쉬워요.'),
      h('a', { class: 'btn small primary', href: href(l.id) }, l.title.split(':')[0] + ' 레슨 →'));
  }
  function resetCourse() { store = { done: {} }; save(); GH.events.emit('course', store); }
  GH.course = { overview, hint, next: nextLesson, isDone, setDone, reset: resetCourse, lessons: () => INDEX.map(x => x.l), chapters: () => GH.data.course, WIDGETS };
})();
