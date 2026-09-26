/* 세션별 기본기 연습: 기타 · 베이스 · 키보드 · 드럼 · 보컬
   /technique (세션 고르기) · /technique/:inst (루틴 · 연습 목록 · 참고 교재) · /technique/:inst/:id (따라 치기) */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, chips, select } = GH.ui; const N = GH.notes;
  const RH = { '2': { d: 2, ko: '2분음표', n: 0.5 }, '4': { d: 1, ko: '4분음표', n: 1 }, '8': { d: 0.5, ko: '8분음표', n: 2 }, '8t': { d: 1 / 3, ko: '셋잇단', n: 3 }, '16': { d: 0.25, ko: '16분음표', n: 4 } };
  const PPB = { 0.5: 36, 1: 36, 2: 46, 3: 60, 4: 76 };           /* TAB 박당 px: 음이 많을수록 넓게 */
  const FRET_RANGE = { 'chroma-shift': [1, 9], stretch: [4, 12], 'b-simandl': [1, 9] };
  const VOICE_KEY = 'gh.tech.voice';
  const STD = () => GH.voicings.STD, BASS = () => GH.data.techBassTuning;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const instOf = id => GH.data.techInst.find(x => x.id === id);
  const byId = id => GH.data.technique.find(x => x.id === id);
  const catOf = id => GH.data.techCats.find(c => c.id === id);
  const routineOf = id => GH.data.techRoutines.find(r => r.id === id);
  const exHref = (ex, q) => GH.router.href('/technique/' + ex.inst + '/' + ex.id, q);
  const nOf = rh => (RH[rh] || RH['8']).n;
  const scaleTempo = (bpm, from, to) => clamp(Math.round(bpm * nOf(from) / nOf(to)), 30, 240);
  const SOLFA = ['도', '도♯', '레', '미♭', '미', '파', '파♯', '솔', '솔♯', '라', '시♭', '시'];   /* 이동도 */
  const START_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const PLUCK_KO = { d: '⊓ 다운', u: 'V 업', i: 'i 검지', m: 'm 중지' };
  const RULES = {
    guitar: ['힘을 빼요. 소리가 날 만큼만 누르면 충분해요.', '템포는 틀리지 않고 칠 수 있는 만큼만. 자꾸 틀리면 5~10 BPM 내려요.', '손이 아프거나 저리면 바로 멈추고 쉬어요. 짧게 자주가 길게 한 번보다 좋아요.'],
    bass: ['굳은살이 생길 때까지는 10분씩 나눠서 연습해요.', '오른손은 검지 · 중지 교대를 끝까지 지켜요. 한 손가락만 쓰는 습관이 가장 흔한 실수예요.', '손목이 꺾이지 않게 스트랩 높이를 맞추세요.'],
    keys: ['의자 높이는 팔꿈치가 건반과 같은 높이가 되게.', '손목과 어깨에 힘을 빼고, 손가락 끝으로 건반 바닥까지 눌러요.', '한 손씩 → 양손, 느리게 → 빠르게. 틀린 곳만 떼어 반복해도 좋아요.'],
    drums: ['귀를 보호하세요. 실제 드럼은 이어플러그를 끼고 연습해요.', '스틱은 30% 힘으로 가볍게 쥐고, 튀어 오르는 힘을 이용해요.', '연습 패드나 쿠션 위에서도 루디먼트는 똑같이 연습할 수 있어요.'],
    vocal: ['물을 조금씩 마시며, 목이 따갑거나 쉬면 바로 멈춰요.', '큰 소리보다 편한 소리. 높은 음은 억지로 밀어 올리지 않아요.', '연습 끝에는 허밍으로 낮은 음까지 내려오며 목을 풀어요 (쿨다운).']
  };

  /* ---- 마지막으로 쓴 템포 · 펼친 분류 (이 브라우저에만, 점수나 기록은 남기지 않는다) ---- */
  const TEMPO_KEY = 'gh.tech.tempo', OPEN_KEY = 'gh.tech.open';
  const loadJSON = k => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } };
  const saveJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };
  const savedVoice = () => { try { return localStorage.getItem(VOICE_KEY); } catch (e) { return null; } };

  /* ---- 옵션 ---- */
  function rhOptions(ex) {
    if (ex.fixed || ex.inst === 'vocal') return null;
    if (ex.inst === 'drums') return ex.rhs || null;
    if (ex.inst === 'keys') return ex.cat === 'k-chord' || ex.cat === 'k-voice' ? ['2', '4'] : ['4', '8', '8t', '16'];
    return ['4', '8', '8t', '16'];
  }
  function options(ex, qy) {
    const o = Object.assign({}, ex.opts); const int = v => parseInt(v, 10);
    if (o.fret != null && isFinite(int(qy.fret))) { const r = FRET_RANGE[ex.id] || [1, 12]; o.fret = clamp(int(qy.fret), r[0], r[1]); }
    if (o.string != null && /^[1-6]$/.test(qy.string || '')) o.string = clamp(int(qy.string), 1, ex.inst === 'bass' ? 4 : 6);
    if (o.key != null && qy.key) { if (o.keys) { if (o.keys.includes(qy.key)) o.key = qy.key; } else if (N.pcOf(qy.key) != null) o.key = N.normalize(qy.key); }
    if (o.box != null && /^[1-5]$/.test(qy.box || '')) o.box = int(qy.box);
    if (o.pos != null && /^[1-7]$/.test(qy.pos || '')) o.pos = int(qy.pos);
    if (o.perm != null && GH.data.techAllPerms.includes(qy.perm)) o.perm = qy.perm;
    if (o.pickStart != null && (qy.pick === 'd' || qy.pick === 'u')) o.pickStart = qy.pick;
    if (o.pluck != null && (qy.pick === 'i' || qy.pick === 'm')) o.pluck = qy.pick;
    if (o.hands != null && /^(rh|lh|both)$/.test(qy.hands || '')) o.hands = qy.hands;
    if (o.oct != null && /^[12]$/.test(qy.oct || '')) o.oct = int(qy.oct);
    if (o.mode != null && /^(major|minor)$/.test(qy.mode || '')) o.mode = qy.mode;
    if (o.kick != null && GH.data.techKickVariants[qy.kick]) o.kick = qy.kick;
    if (o.q != null && ['maj', 'min', 'maj7', 'm7', '7', 'm7b5'].includes(qy.q)) o.q = qy.q;
    if (ex.inst === 'vocal') {
      const V = GH.data.techVoices; const sv = savedVoice();
      o.voice = V[qy.voice] ? qy.voice : V[sv] ? sv : o.voice;
      if (/^[0-8]$/.test(qy.steps || '')) o.steps = int(qy.steps);
      /* 가사: fixed 고정도 (기본) · solfa 이동도 · vowel 모음 */
      if (o.syl != null) o.syl = /^(fixed|solfa|vowel)$/.test(qy.syl || '') ? qy.syl : N.solfa.get() === 'movable' ? 'solfa' : 'fixed';
      o.start = START_KEYS.includes(qy.start) ? qy.start : 'C';
      o.guides = ex.gen(o).some(n => n.gdeg != null) ? ['line', 'mine', 'off'] : ['mine', 'off'];   /* 다른 선율이 있는 화음 연습이면 그 선율을 피아노가 친다 */
      o.guide = o.guides.includes(qy.guide) ? qy.guide : o.guides[0];
    }
    const rhs = rhOptions(ex); o.rh = rhs && rhs.includes(qy.rh) ? qy.rh : ex.rh || '4';
    return o;
  }

  /* ---- 악기별: 연습 → 재생 순서(seq) · 악보 · 악기 그림 · 소리 ---- */
  function guitarPreset() { const p = GH.state.get().instrument; return ['steel', 'nylon', 'electric'].includes(p) ? p : 'steel'; }
  function buildFretted(ex, o) {
    const tun = ex.inst === 'bass' ? BASS() : STD(); const NS = tun.length;
    const d = RH[o.rh].d; let alt = 0;
    const first = ex.inst === 'bass' ? (o.pluck === 'm' ? 1 : 0) : (o.pickStart === 'u' ? 1 : 0);
    const marks = ex.inst === 'bass' ? ['i', 'm'] : ['d', 'u'];
    let at = 0;
    const notes = ex.gen(o).map(n => {
      const e = { at, d: ex.fixed && n.d ? n.d : d, s: n.s, f: n.f, fg: n.fg, t: n.t || null, x: !!n.x, label: n.label || null, midi: tun[NS - n.s] + n.f };
      if (n.pk) e.pk = n.pk; else if (!e.t) { e.pk = marks[(first + alt) % 2]; alt++; }
      at += e.d; return e;
    });
    return { kind: 'fretted', tun, NS, seq: notes, notes };
  }
  function buildKeys(ex, o) {
    const g = ex.gen(o); const d = RH[o.rh].d;
    const stamp = list => { let at = 0; return list.map(n => { const e = Object.assign({}, n, { d: ex.fixed ? n.d : d, at }); at += e.d; return e; }); };
    const rh = stamp(g.rh || []), lh = stamp(g.lh || []);
    const map = new Map();
    rh.concat(lh).forEach(n => { const k = Math.round(n.at * 1000); if (!map.has(k)) map.set(k, { at: n.at, notes: [] }); map.get(k).notes.push(Object.assign({ hand: rh.includes(n) ? 'r' : 'l' }, n)); });
    const seq = Array.from(map.values()).sort((a, b) => a.at - b.at);
    const end = Math.max(0, ...rh.concat(lh).map(n => n.at + n.d));
    seq.forEach((s, i) => { s.d = (i + 1 < seq.length ? seq[i + 1].at : end) - s.at; });
    return { kind: 'keys', seq, rh, lh };
  }
  function buildDrums(ex, o) {
    const g = ex.gen(o);
    const seq = g.slots.map((s, i) => Object.assign({}, s, { at: i * g.grid, d: g.grid }));
    return { kind: 'drums', seq, grid: g.grid };
  }
  /* 보컬: 시작 키의 으뜸음을 음역 안에 두고(음역 기준음 -2 ~ +9), 반복마다 반음씩 옮긴다.
     음이름 철자는 그 키의 계이름(이동도)에서 정해서, 악보 · 소리 · 가사가 늘 같은 음을 가리키게 한다 */
  const SYL_DEG = { '도': 0, '레': 1, '미': 2, '파': 3, '솔': 4, '라': 5, '시': 6 };
  const vocalTonic = (V, start) => { const low = V.root - 2; return low + N.mod(N.pcOf(start) - low, 12); };
  const vocalKey = (start, tr) => tr ? N.niceName(N.pcOf(start) + tr) : start;
  const movableOf = n => (n.sol || SOLFA[N.mod(n.deg, 12)]).replace(/#/g, '♯');
  function spellDeg(key, deg, syl) {
    const pc = N.mod(N.pcOf(key) + deg, 12); const off = SYL_DEG[(syl || SOLFA[N.mod(deg, 12)]).charAt(0)];
    if (off == null) return N.noteName(pc, 'sharp');
    const name = N.spellLetter(N.LETTERS[(N.LETTERS.indexOf(N.parseNote(key).letter) + off) % 7], pc);
    /* 반음 올리고 내린 음(도♯ · 솔♭ …)이 F♭ · C♭ · E♯ · B♯ · 겹임시표가 되면 읽기 쉬운 이름으로 */
    if (/[♯♭#]/.test(syl || '') && /^(Fb|Cb|E#|B#)$|##|bb/.test(name)) return N.noteName(pc, /♭/.test(syl) ? 'flat' : 'sharp');
    return name;
  }
  function vocalLabels(B, o, tr) {
    const key = vocalKey(o.start, tr);
    return B.seq.map(n => {
      if (n.rest) return {};
      const name = spellDeg(key, n.deg, movableOf(n));
      return { name, gname: n.gdeg != null ? spellDeg(key, n.gdeg, null) : null,
        syl: n.own || (o.syl === 'vowel' ? '아' : o.syl === 'solfa' ? movableOf(n) : N.solfa.fixed(name)) };
    });
  }
  function buildVocal(ex, o) {
    const V = GH.data.techVoices[o.voice]; const T = vocalTonic(V, o.start); let at = 0;
    const seq = ex.gen(o).map((n, i) => {
      const e = Object.assign({}, n, { at, i, own: n.syl || null });   /* own: 연습이 정한 가사 (모음 · 리듬 읽기) */
      if (!n.rest) { e.midi = T + n.deg; e.gmidi = n.gdeg != null ? T + n.gdeg : null; }
      at += n.d; return e;
    });
    const steps = o.steps || 0; const trs = [];
    for (let k = 0; k <= steps; k++) trs.push(k);
    for (let k = steps - 1; k >= 1; k--) trs.push(k);
    const B = { kind: 'vocal', seq, V, T, trs };
    vocalLabels(B, o, 0).forEach((L, i) => Object.assign(seq[i], L));
    B.keyOf = tr => vocalKey(o.start, tr);
    return B;
  }
  function build(ex, o) {
    if (ex.inst === 'keys') return buildKeys(ex, o);
    if (ex.inst === 'drums') return buildDrums(ex, o);
    if (ex.inst === 'vocal') return buildVocal(ex, o);
    return buildFretted(ex, o);
  }
  const totalBeats = B => Math.round((B.seq.length ? B.seq[B.seq.length - 1].at + B.seq[B.seq.length - 1].d : 0) * 1000) / 1000;
  function soundFor(ex, B, o) {
    const A = GH.audio;
    if (B.kind === 'fretted' && ex.inst === 'bass') return (ev, t, dur) => A.bass(ev.midi, t, ev.x ? 0.06 : dur * 0.92, { gain: ev.x ? 0.35 : ev.pk === 'P' ? 1.1 : 1 });
    if (B.kind === 'fretted') { const pre = guitarPreset(); return (ev, t, dur) => A.pluck(ev.midi, t, ev.x ? 0.05 : dur * 0.95, { gain: ev.t ? 0.6 : 0.85, preset: pre }); }
    if (B.kind === 'keys') return (ev, t, dur, pass, beat) => ev.notes.forEach(n => n.m.forEach(m => A.pluck(m, t, n.d * beat * 0.96, { preset: 'piano', gain: n.hand === 'l' ? 0.62 : 0.78 })));
    if (B.kind === 'drums') return (ev, t) => ev.hits.forEach(x => A.drum(x.k, t, x.v != null ? 0.15 + x.v * 0.9 : x.ghost ? 0.22 : x.acc ? 1.05 : 0.72));
    return (ev, t, dur, pass, beat) => {
      const tr = B.trs[pass % B.trs.length];
      if (ev.i === 0) { const r = B.T + tr - 12; [r, r + 4, r + 7].forEach(m => A.pluck(m, t, Math.min(2, totalBeats(B)) * beat, { preset: 'piano', gain: 0.4 })); }
      if (ev.rest || o.guide === 'off') return;
      const m = o.guide === 'line' && ev.gmidi != null ? ev.gmidi : ev.midi;
      A.pluck(m + tr, t, (ev.stacc ? 0.4 : 0.95) * dur, { preset: 'piano', gain: 0.62 });
    };
  }

  /* ---- 악보 ---- */
  function sheetFor(ex, B, width, o, tr) {
    if (!GH.render.sheet) return null;
    const pref = o.key ? GH.state.pref(o.key.replace(/m$/, '')) : 'sharp';
    if (B.kind === 'fretted') return GH.render.sheet({ kind: 'line', clef: ex.inst === 'bass' ? 'bass' : 'treble', written: 12, width, pref, events: B.notes.map(n => ({ at: n.at, d: n.d, m: [n.midi], x: n.x, fg: n.fg > 0 || typeof n.fg === 'string' ? String(n.fg) : '' })) });
    if (B.kind === 'keys') { const ev = n => ({ at: n.at, d: n.d, m: n.m, fg: (n.fg || []).join('') }); return GH.render.sheet({ kind: 'grand', width, pref, rh: B.rh.map(ev), lh: B.lh.map(ev) }); }
    if (B.kind === 'drums') return GH.render.sheet({ kind: 'drum', width, slots: B.seq, handsOnly: !!ex.handsOnly });
    /* 보컬: 지금 키(반음 tr)로 적는다. 피아노가 다른 선율을 치면 그 음은 회색으로 함께 */
    tr = tr || 0; const L = vocalLabels(B, o, tr); const line = o.guide === 'line';
    return GH.render.sheet({ kind: 'line', clef: B.V.clef, written: B.V.clef === 'treble8vb' ? 12 : 0, width, pref: 'sharp', events: B.seq.map((n, i) => {
      if (n.rest) return { at: n.at, d: n.d, m: null };
      const g = line && n.gmidi != null;
      return { at: n.at, d: n.d, m: g ? [n.midi + tr, n.gmidi + tr] : [n.midi + tr], names: g ? [L[i].name, L[i].gname] : [L[i].name], soft: g ? [n.gmidi + tr] : null, lyric: L[i].syl, stacc: n.stacc };
    }) });
  }
  /* 기타 · 베이스 TAB: 화면 너비에 맞춰 1~4마디씩 끊는다 */
  function tabRows(notes, rh, width, NS) {
    const ppb = PPB[RH[rh].n];
    const perRow = clamp(Math.floor((width || 700) / (4 * ppb * 0.9)), 1, 4);
    const rows = []; let cur = null;
    notes.forEach((ev, i) => {
      const row = Math.floor(Math.floor(ev.at / 4 + 1e-6) / perRow);
      if (!cur || cur.row !== row) { cur = { row, start: i, notes: [] }; rows.push(cur); }
      cur.notes.push(ev);
    });
    const fullW = 34 + perRow * 4 * ppb + 24;
    const wrap = h('div', { class: 'tech-tab' });
    rows.forEach(r => {
      r.tab = GH.render.tab({ notes: r.notes }, { ppb, barStart: r.row * perRow, strings: NS });
      const W = r.tab.el.viewBox.baseVal.width;
      r.tab.el.style.minWidth = '0'; r.tab.el.style.width = Math.min(100, W / fullW * 100).toFixed(2) + '%';
      r.el = h('div', { class: 'tech-tab-row' }, r.tab.el); wrap.appendChild(r.el);
    });
    return { el: wrap, highlight(i) { rows.forEach(r => r.tab.highlight(i >= r.start && i < r.start + r.notes.length ? i - r.start : -1)); } };
  }
  /* ---- 악기 그림 ---- */
  function viewFor(ex, B) {
    if (B.kind === 'fretted') {
      const seen = new Set();
      const fbNotes = B.notes.filter(n => !n.x).filter(n => { const k = n.s + ':' + n.f; if (seen.has(k)) return false; seen.add(k); return true; })
        .map(n => n.label && !/[↑↓]/.test(n.label) ? { s: n.s, f: n.f, label: n.label, cls: N.ivClass(n.label) } : { s: n.s, f: n.f, label: n.fg > 0 ? n.fg : '0', cls: 'iv-s' });
      const fr = B.notes.map(n => n.f); const lo = Math.min(...fr), hi = Math.max(...fr); const from = lo <= 1 ? 0 : lo - 1;
      const fb = GH.render.fretboard({ notes: fbNotes, tuning: B.tun, capo: 0, from, to: Math.min(22, Math.max(hi + 1, from + 5)), labelMode: 'degree', pref: 'sharp', sound: ex.inst === 'bass' ? m => GH.audio.bass(m, GH.audio.now(), 1.2, {}) : null });
      return { el: fb.el, highlight: ev => fb.highlightMany(ev ? [[ev.s, ev.f]] : []), note: ex.opts.key ? '색은 도수(빨강이 루트), 점 안의 글자도 도수예요.' : '점 안의 숫자가 왼손 손가락 번호예요.' };
    }
    if (B.kind === 'keys') {
      const all = B.rh.concat(B.lh); const ms = [].concat(...all.map(n => n.m));
      const lo = Math.min(...ms), hi = Math.max(...ms);
      const from = lo - N.mod(lo, 12), to = hi + (11 - N.mod(hi, 12));
      const onMidi = {};
      B.lh.forEach(n => n.m.forEach((m, i) => { if (!onMidi[m]) onMidi[m] = { label: n.fg ? n.fg[i] : '', cls: 'hand-l' }; }));
      B.rh.forEach(n => n.m.forEach((m, i) => { if (!onMidi[m] || onMidi[m].cls === 'hand-l') onMidi[m] = { label: n.fg ? n.fg[i] : '', cls: 'hand-r' }; }));
      const el = GH.render.piano({ from, to, onMidi, preset: 'piano' });
      return { el: h('div', { class: 'tech-piano' }, el), highlight: ev => el.highlightMany(ev ? [].concat(...ev.notes.map(n => n.m)) : []), note: '노란 건반은 오른손, 파란 건반은 왼손. 숫자는 처음 누를 때의 손가락 번호예요.' };
    }
    if (B.kind === 'drums') {
      const kit = GH.render.drumkit(ex.handsOnly ? { only: ['snare'] } : {});
      return { el: h('div', { class: 'tech-kit' + (ex.handsOnly ? ' pad' : '') }, kit.el), highlight: ev => kit.highlight(ev ? ev.hits.map(x => ({ k: x.k, st: ev.st })) : []), note: ex.handsOnly ? '손만 쓰는 연습이라 스네어(연습 패드)만 써요. 칠 때마다 R · L 이 떠요. 그림을 누르면 소리가 나요.' : '치는 곳이 빛나고 스티킹(R 오른손 · L 왼손 · K 킥)이 떠요. 그림을 누르면 그 소리가 나요.' };
    }
    return null;
  }

  /* ---- 루틴 타이머 (페이지를 다시 그려도 이어진다) ---- */
  const timer = { key: null, left: 0, total: 0, iv: 0, el: null, btn: null, onEnd: null };
  const fmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  function paintTimer() {
    if (timer.el) timer.el.textContent = timer.left > 0 ? fmt(timer.left) : '끝!';
    if (timer.btn) timer.btn.textContent = timer.iv ? '일시정지' : timer.left > 0 && timer.left < timer.total ? '이어서' : timer.left > 0 ? '타이머 시작' : '다시';
    if (timer.el && timer.el.parentNode) timer.el.parentNode.classList.toggle('done', timer.left <= 0);
  }
  function stopTimer() { if (timer.iv) { clearInterval(timer.iv); timer.iv = 0; } paintTimer(); }
  function toggleTimer() {
    if (timer.iv) { stopTimer(); return; }
    if (timer.left <= 0) timer.left = timer.total;
    timer.iv = setInterval(() => {
      timer.left = Math.max(0, timer.left - 1);
      if (!timer.left) { stopTimer(); if (GH.audio && GH.audio.context()) { const t = GH.audio.now() + .05; GH.audio.click(t, true); GH.audio.click(t + .18, true); } if (timer.onEnd) timer.onEnd(); }
      paintTimer();
    }, 1000);
    paintTimer();
  }
  GH.events.on('route', r => { if (!r || !/^\/technique/.test(r.path)) { stopTimer(); timer.key = null; } });
  function sessionsOrder() {
    const sel = GH.guide && GH.guide.sessions ? GH.guide.sessions() : [];
    return GH.data.techInst.slice().sort((a, b) => { const x = sel.indexOf(a.id), y = sel.indexOf(b.id); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); });
  }
  function suggestedRoutine(inst, qy) {
    const own = GH.data.techRoutines.filter(r => r.inst === inst);
    if (own.some(r => r.id === qy.r)) return qy.r;
    const G = GH.guide; const lv = G && G.profile().level ? G.LEVELS.findIndex(l => l.id === G.profile().level) : 0;
    return own[lv >= 4 ? 2 : lv >= 2 ? 1 : 0].id;
  }
  const instChips = cur => h('div', { class: 'tech-inst-chips' }, sessionsOrder().map(s => h('a', { class: 'chip' + (s.id === cur ? ' active' : ''), href: '#/technique/' + s.id, 'aria-current': s.id === cur ? 'page' : null }, GH.icon(s.icon), s.ko)));

  /* ============ 세션 고르기 ============ */
  GH.pages['/technique'] = {
    title: '기본기 연습',
    render(el) {
      const sel = GH.guide && GH.guide.sessions ? GH.guide.sessions() : [];
      el.appendChild(h('h1', null, '세션별 기본기 연습'));
      el.appendChild(h('p', { class: 'muted' }, '가장 기초부터 응용까지, 악보와 악기 그림을 보며 메트로놈에 맞춰 따라 해요. 스피드 트레이너로 템포를 조금씩 올려요. 마지막으로 쓴 템포는 기억해 두었다가 다음에 이어서 시작해요.'));
      el.appendChild(h('div', { class: 'grid cols-3 tech-insts' }, sessionsOrder().map(s => {
        const n = GH.data.technique.filter(e => e.inst === s.id).length;
        return h('a', { class: 'card link tech-inst', href: '#/technique/' + s.id },
          h('span', { class: 'tech-inst-ic', 'aria-hidden': 'true' }, GH.icon(s.icon)),
          h('div', { class: 'tech-inst-body' }, h('div', { class: 'row', style: 'gap:6px' }, h('b', { class: 'title' }, s.ko), sel.includes(s.id) ? h('span', { class: 'badge accent' }, '내 세션') : null),
            h('div', { class: 'desc' }, s.desc), h('div', { class: 'tech-inst-meta' }, n + '가지 연습 · ' + s.view)));
      })));
      el.appendChild(h('div', { class: 'callout' }, h('b', null, '어떻게 연습하나요?'),
        h('ol', { class: 'tech-method' }, h('li', null, '루틴을 고르면 연습을 순서대로, 정해진 시간만큼 안내해요.'), h('li', null, '▶ 시작을 누르면 4박을 센 뒤 메트로놈과 함께 소리가 나고, 악보와 악기 그림에 지금 칠 음이 표시돼요.'), h('li', null, '스피드 트레이너를 켜면 몇 번 반복할 때마다 템포가 자동으로 올라가요.'), h('li', null, '틀리지 않고 칠 수 있는 템포에서 멈추고, 다음 날 그 템포부터 이어서 올려요.'))));
    }
  };

  /* ============ 세션별 목록 · 루틴 ============ */
  GH.pages['/technique/:inst'] = {
    title: '기본기 연습',
    render(el, params) {
      const I = instOf(params.inst); const qy = params.query || {};
      if (!I) { el.appendChild(GH.ui.empty('그런 세션이 없습니다.')); el.appendChild(h('p', null, h('a', { href: '#/technique' }, '세션 고르기로'))); return; }
      const only = params.only || null;                       /* 일부 분류만 (드럼 › 루디먼트 · 그루브 페이지) */
      el.appendChild(h('div', { class: 'breadcrumb' }, h('a', { href: '#/' + I.id }, I.ko), ' › ', only ? params.title : '기본기 연습'));
      el.appendChild(h('h1', null, only ? params.title : I.ko + ' 기본기'));
      if (!only) el.appendChild(instChips(I.id));
      el.appendChild(h('p', { class: 'muted' }, only ? params.desc : I.desc + '. 매일 10~20분, 느린 템포에서 정확하게 → 익숙해지면 조금씩 빠르게.'));
      if (!only) {
      /* 오늘의 루틴 */
      const rid = suggestedRoutine(I.id, qy); const R = routineOf(rid);
      const rChips = chips({ options: GH.data.techRoutines.filter(r => r.inst === I.id).map(r => ({ value: r.id, label: r.ko + ' ' + r.min + '분' })), value: rid, onChange: v => GH.router.go('/technique/' + I.id, { r: v }) });
      el.appendChild(h('div', { class: 'card tech-routine' },
        h('div', { class: 'tech-routine-head' }, h('span', { class: 'eyebrow' }, 'TODAY'), h('h2', null, '오늘의 루틴')),
        rChips, h('p', { class: 'muted' }, R.desc),
        h('ol', { class: 'tech-steps' }, R.steps.map(([id, min], i) => { const ex = byId(id); return h('li', null, h('a', { href: exHref(ex, { routine: rid, step: i + 1 }) }, h('span', { class: 'tech-step-title' }, ex.ko), h('span', { class: 'tech-step-meta' }, min + '분'))); })),
        h('a', { class: 'btn primary', href: exHref(byId(R.steps[0][0]), { routine: rid, step: 1 }) }, GH.icon('play'), '루틴 시작')));
      el.appendChild(h('div', { class: 'callout tech-rules' }, h('b', null, '다치지 않고 늘리려면'), h('ul', null, RULES[I.id].map(x => h('li', null, x)))));
      }
      /* 분류별 연습: 접었다 폈다 */
      const cats = GH.data.techCats.filter(c => c.inst === I.id && (!only || only.includes(c.id)));
      const openAll = loadJSON(OPEN_KEY); const opened = only ? cats.map(c => c.id) : openAll[I.id] || [cats[0] && cats[0].id];
      const remember = () => { if (only) return; openAll[I.id] = Array.from(el.querySelectorAll('details.tech-cat')).filter(d => d.open).map(d => d.dataset.cat); saveJSON(OPEN_KEY, openAll); };
      const total = GH.data.technique.filter(e => e.inst === I.id && cats.some(c => c.id === e.cat)).length;
      el.appendChild(h('div', { class: 'tech-cats-bar' }, h('h2', null, '연습 목록 ', h('span', { class: 'muted' }, total + '가지')),
        h('div', { class: 'row', style: 'gap:6px' }, h('button', { class: 'btn small', type: 'button', onclick: () => { el.querySelectorAll('details.tech-cat').forEach(d => { d.open = true; }); remember(); } }, '모두 펼치기'), h('button', { class: 'btn small', type: 'button', onclick: () => { el.querySelectorAll('details.tech-cat').forEach(d => { d.open = false; }); remember(); } }, '모두 접기'))));
      cats.forEach(c => {
        const list = GH.data.technique.filter(e => e.cat === c.id).sort((a, b) => a.level - b.level);
        const lv = list.map(e => e.level); const range = GH.ui.LEVELS[Math.min(...lv)].dyn + (Math.max(...lv) !== Math.min(...lv) ? ' ~ ' + GH.ui.LEVELS[Math.max(...lv)].dyn : '');
        const d = h('details', { class: 'tech-cat', 'data-cat': c.id, open: opened.includes(c.id) ? '' : null },
          h('summary', { class: 'tech-cat-head' }, h('span', { class: 'tech-cat-ic', 'aria-hidden': 'true' }, GH.icon(c.icon)), h('span', { class: 'tech-cat-title' }, h('b', null, c.ko), h('small', null, list.length + '가지 · ' + range)), h('span', { class: 'tech-cat-en', 'aria-hidden': 'true' }, c.en), h('span', { class: 'tech-cat-chev', 'aria-hidden': 'true' }, GH.icon('arrow'))),
          h('p', { class: 'muted' }, c.desc),
          h('div', { class: 'grid cols-3' }, list.map(ex => h('a', { class: 'card link tech-card', href: exHref(ex) },
            h('div', { class: 'row', style: 'gap:6px' }, GH.ui.level(ex.level), ex.rh && rhOptions(ex) ? h('span', { class: 'badge' }, RH[ex.rh].ko) : null),
            h('div', { class: 'title' }, ex.ko), h('div', { class: 'desc' }, ex.goal)))));
        d.addEventListener('toggle', remember);
        el.appendChild(d);
      });
    }
  };

  /* 드럼 › 루디먼트 · 그루브 (분류만 모은 페이지) */
  GH.pages['/drums/rudiments'] = { title: '루디먼트 · 스틱 컨트롤', render(el, p) { GH.pages['/technique/:inst'].render(el, { inst: 'drums', query: p.query || {}, only: ['d-rud', 'd-ctrl'], title: '루디먼트 · 스틱 컨트롤', desc: '스네어(또는 연습 패드) 하나로 하는 손 연습. 국제 표준 루디먼트와 액센트 · 탭 컨트롤, 셈여림.' }); } };
  GH.pages['/drums/grooves'] = { title: '그루브 · 필인', render(el, p) { GH.pages['/technique/:inst'].render(el, { inst: 'drums', query: p.query || {}, only: ['d-groove', 'd-fill'], title: '그루브 · 필인', desc: '8비트 · 16비트 · 셔플 · 스윙 · 보사노바 같은 장르 그루브와 필인 · 손발 독립 연습. 드럼 보표와 킷 그림으로 따라 쳐요.' }); } };

  GH.pages['/drums/chops'] = { title: '찹 · 컴비네이션', render(el, p) { GH.pages['/technique/:inst'].render(el, { inst: 'drums', query: p.query || {}, only: ['d-chop', 'd-combo'], title: '찹 · 컴비네이션', desc: '빠른 손 패턴(찹)과 손 · 킥을 한 줄로 잇는 조합(컴비네이션). 짧은 버스트와 3 · 4 · 6음 조합에서 시작해 탐을 도는 필까지.' }); } };

  /* ============ 연습 화면 ============ */
  const play = { metronome: true, loop: true, countIn: true, trainer: false, every: 2, step: 4, view: 'both' };
  const tempos = loadJSON(TEMPO_KEY);                         /* 연습 id → { bpm, rh, max } (마지막으로 쓴 템포에서 다시 시작) */
  GH.pages['/technique/:inst/:id'] = {
    title: '기본기 연습',
    staff: true,
    render(el, params) {
      const qy = params.query || {}; const A = GH.app;
      const ex = byId(params.id);
      if (!ex || ex.inst !== params.inst) { el.appendChild(GH.ui.empty('연습을 찾을 수 없습니다.')); el.appendChild(h('p', null, h('a', { href: '#/technique' }, '기본기 연습 목록으로'))); return; }
      const I = instOf(ex.inst); const cat = catOf(ex.cat); const o = options(ex, qy);
      const B = build(ex, o); const beats = totalBeats(B);
      const tbase = ex.inst === 'vocal' || !rhOptions(ex) ? (ex.rh || '4') : ex.rh;
      let t = tempos[ex.id];
      if (!t) t = tempos[ex.id] = { bpm: scaleTempo(ex.tempo[0], tbase, o.rh), rh: o.rh, max: scaleTempo(ex.tempo[1], tbase, o.rh) };
      if (t.rh !== o.rh) { t.bpm = scaleTempo(t.bpm, t.rh, o.rh); t.max = scaleTempo(t.max, t.rh, o.rh); t.rh = o.rh; }
      const goalLo = scaleTempo(ex.tempo[0], tbase, o.rh), goalHi = scaleTempo(ex.tempo[1], tbase, o.rh);
      const keep = {}; ['routine', 'step', 'fret', 'string', 'key', 'box', 'pos', 'perm', 'pick', 'rh', 'hands', 'oct', 'mode', 'kick', 'voice', 'steps', 'syl', 'guide', 'start', 'q'].forEach(k => { if (qy[k] != null) keep[k] = qy[k]; });
      const setQ = patch => GH.router.go('/technique/' + ex.inst + '/' + ex.id, Object.assign({}, keep, patch));

      el.appendChild(h('div', { class: 'breadcrumb' }, h('a', { href: '#/technique' }, '기본기 연습'), ' › ', h('a', { href: '#/technique/' + I.id }, I.ko), ' › ', cat.ko));
      el.appendChild(h('h1', null, ex.ko));
      el.appendChild(h('div', { class: 'row' }, GH.ui.level(ex.level), GH.ui.badge(I.ko + ' · ' + cat.ko, 'accent'), GH.ui.badge(goalLo === goalHi ? goalLo + ' BPM' : '권장 ' + goalLo + ' → ' + goalHi + ' BPM'), rhOptions(ex) ? GH.ui.badge(RH[o.rh].ko) : null));

      /* 루틴 막대 */
      const R = routineOf(qy.routine);
      const si = R ? clamp((parseInt(qy.step, 10) || (R.steps.findIndex(s => s[0] === ex.id) + 1) || 1) - 1, 0, R.steps.length - 1) : -1;
      if (R && R.steps[si][0] === ex.id) {
        const min = R.steps[si][1]; const key = R.id + ':' + si;
        if (timer.key !== key) { stopTimer(); timer.key = key; timer.total = timer.left = min * 60; }
        const nextStep = R.steps[si + 1];
        const nextA = nextStep ? h('a', { class: 'btn small primary', href: exHref(byId(nextStep[0]), { routine: R.id, step: si + 2 }) }, '다음: ' + byId(nextStep[0]).ko + ' →') : h('a', { class: 'btn small primary', href: '#/technique/' + I.id + '?r=' + R.id }, '루틴 끝! 목록으로');
        timer.el = h('b', { class: 'tech-timer-left' }); timer.btn = h('button', { class: 'btn small', type: 'button', onclick: toggleTimer });
        timer.onEnd = () => { nextA.classList.add('pulse'); };
        el.appendChild(h('div', { class: 'tech-routine-bar' },
          h('div', { class: 'tech-routine-where' }, h('span', { class: 'eyebrow' }, I.ko + ' ' + R.ko + ' · ' + (si + 1) + ' / ' + R.steps.length), h('span', { class: 'tech-dots', 'aria-hidden': 'true' }, R.steps.map((_, i) => h('i', { class: i < si ? 'done' : i === si ? 'now' : '' })))),
          h('div', { class: 'tech-timer' }, GH.icon('metronome'), timer.el, h('span', { class: 'muted' }, ' / ' + min + '분')),
          h('div', { class: 'row', style: 'gap:6px' }, timer.btn, nextA)));
        paintTimer();
      }

      el.appendChild(h('p', { class: 'lead' }, ex.goal));
      const legend = ex.inst === 'guitar' ? '손가락 번호: 1 검지 · 2 중지 · 3 약지 · 4 새끼 · ⊓ 다운 · V 업 피킹'
        : ex.inst === 'bass' ? '왼손 손가락: 1 검지 · 2 중지 · 3 약지 · 4 새끼 · 오른손: i 검지 · m 중지 (슬랩은 T 엄지 · P 팝)'
          : ex.inst === 'keys' ? '손가락 번호: 1 엄지 · 2 검지 · 3 중지 · 4 약지 · 5 새끼'
            : ex.inst === 'drums' ? '스티킹: R 오른손 · L 왼손 · K 킥 · > 액센트 · ( ) 고스트 노트' : (o.syl === 'solfa' ? '가사 줄은 계이름(이동도: 지금 키의 으뜸음 = 도)이에요.' : o.syl === 'vowel' ? '가사 줄은 부를 모음이에요.' : '가사 줄은 계이름(고정도: 적힌 음 그대로, C = 도)이에요.') + ' 반복할 때마다 반음씩 옮겨 부르고, 악보도 그 키로 바뀌어요.' + (o.start !== 'C' && o.syl !== 'vowel' ? ' 설명에 적힌 도 · 레 · 미는 C 에서 시작할 때의 이름이에요 (1 · 2 · 3번 음).' : '');
      el.appendChild(h('div', { class: 'tech-how' }, h('h2', null, '이렇게 해요'), h('ol', null, ex.how.map(x => h('li', null, x))), h('p', { class: 'muted tech-fingers' }, legend)));

      /* 연습 설정 */
      const setBar = h('div', { class: 'toolbar tech-opts' });
      const lab = (label, ctl) => setBar.appendChild(h('label', null, label, ctl));
      if (o.perm != null) setBar.appendChild(h('div', { class: 'tech-perm' }, h('span', { class: 'tech-lab' }, '손가락 순서'), chips({ options: GH.data.techPerms.map(p => ({ value: p, label: p.split('').join('-') })), value: o.perm, onChange: v => setQ({ perm: v }) })));
      if (o.kick != null) setBar.appendChild(h('div', { class: 'tech-perm' }, h('span', { class: 'tech-lab' }, '킥 모양'), chips({ options: Object.entries(GH.data.techKickVariants).map(([v, l]) => ({ value: v, label: l })), value: o.kick, onChange: v => setQ({ kick: v }) })));
      if (o.key != null) lab('키', o.keys ? select({ options: o.keys.map(k => ({ value: k, label: N.pretty(k) })), value: o.key, onChange: v => setQ({ key: v }) }) : A.rootSelect(o.key, v => setQ({ key: v })));
      if (o.q != null) lab('코드', select({ options: [['maj', '메이저'], ['min', '마이너'], ['maj7', 'maj7'], ['m7', 'm7'], ['7', '7 (도미넌트)'], ['m7b5', 'm7b5 (하프 디미니시드)']].map(([v, l]) => ({ value: v, label: l })), value: o.q, onChange: v => setQ({ q: v }) }));
      if (o.mode != null) lab('장조 · 단조', select({ options: [{ value: 'major', label: '메이저 (장조)' }, { value: 'minor', label: '마이너 (단조)' }], value: o.mode, onChange: v => setQ({ mode: v }) }));
      if (o.box != null) lab('박스', select({ options: [1, 2, 3, 4, 5].map(b => ({ value: b, label: b + '번 박스' })), value: o.box, onChange: v => setQ({ box: v }) }));
      if (o.pos != null) lab('포지션', select({ options: [1, 2, 3, 4, 5, 6, 7].map(b => ({ value: b, label: b + '번 포지션' })), value: o.pos, onChange: v => setQ({ pos: v }) }));
      if (o.fret != null) { const r = FRET_RANGE[ex.id] || [1, 12]; lab('시작 프렛', GH.ui.numberInput({ value: o.fret, min: r[0], max: r[1], suffix: '프렛', label: '시작 프렛', onChange: v => setQ({ fret: v }) })); }
      if (o.string != null) lab('줄', select({ options: Array.from({ length: ex.inst === 'bass' ? 4 : 6 }, (_, i) => ({ value: i + 1, label: (i + 1) + '번 줄' })), value: o.string, onChange: v => setQ({ string: v }) }));
      if (o.pickStart != null) lab('피킹 시작', select({ options: [{ value: 'd', label: '다운 ⊓ (바깥쪽 피킹)' }, { value: 'u', label: '업 V (안쪽 피킹)' }], value: o.pickStart, onChange: v => setQ({ pick: v }) }));
      if (o.pluck != null) lab('오른손 시작', select({ options: [{ value: 'i', label: 'i 검지부터' }, { value: 'm', label: 'm 중지부터' }], value: o.pluck, onChange: v => setQ({ pick: v }) }));
      if (o.hands != null) lab('손', select({ options: [{ value: 'rh', label: '오른손만' }, { value: 'lh', label: '왼손만' }, { value: 'both', label: '양손' }], value: o.hands, onChange: v => setQ({ hands: v }) }));
      if (o.oct != null) lab('범위', select({ options: [{ value: 1, label: '1옥타브' }, { value: 2, label: '2옥타브 (원래 하논)' }], value: o.oct, onChange: v => setQ({ oct: v }) }));
      if (ex.inst === 'vocal') {
        lab('음역', select({ options: Object.entries(GH.data.techVoices).map(([v, V]) => ({ value: v, label: V.ko })), value: o.voice, onChange: v => { try { localStorage.setItem(VOICE_KEY, v); } catch (e) { /* ignore */ } setQ({ voice: v }); } }));
        lab('시작 키', select({ options: START_KEYS.map(k => ({ value: k, label: N.pretty(k) + ' 메이저' })), value: o.start, onChange: v => setQ({ start: v }) }));
        lab('반음씩 올리기', GH.ui.numberInput({ value: o.steps, min: 0, max: 8, suffix: '번', label: '반음씩 올리는 횟수', onChange: v => setQ({ steps: v }) }));
        if (o.syl != null) lab('가사', select({ options: [{ value: 'fixed', label: '계이름 · 고정도 (C = 도)' }, { value: 'solfa', label: '계이름 · 이동도 (으뜸음 = 도)' }, { value: 'vowel', label: '모음 "아"' }], value: o.syl, onChange: v => { if (v !== 'vowel') N.solfa.set(v === 'solfa' ? 'movable' : 'fixed'); setQ({ syl: v }); } }));
        const below = B.seq.some(n => n.gmidi != null && n.gmidi < n.midi);
        const GUIDE_KO = { line: (below ? '아래' : '위') + ' 선율 (화음 연습)', mine: '내 음 치기', off: '끄기 (첫 화음만)' };
        lab('피아노 가이드', select({ options: o.guides.map(v => ({ value: v, label: GUIDE_KO[v] })), value: o.guide, onChange: v => setQ({ guide: v }) }));
      }
      const rhs = rhOptions(ex);
      if (rhs) lab('리듬', select({ options: rhs.map(k => ({ value: k, label: RH[k].ko + (k === ex.rh ? ' (기본)' : '') })), value: o.rh, onChange: v => setQ({ rh: v === ex.rh ? null : v }) }));
      if (setBar.childNodes.length) el.appendChild(setBar);

      /* 따라 치기 */
      const width = Math.min(1100, el.clientWidth || 700);
      let sheet = sheetFor(ex, B, width, o), shownTr = 0;
      /* 보컬: 반복마다 키가 바뀌면 악보도 그 키로 다시 적는다 */
      const keyCap = B.kind === 'vocal' ? h('p', { class: 'tech-keycap' }) : null;
      const paintKey = tr => { if (!keyCap) return; keyCap.textContent = '악보 · 가사: ' + N.pretty(B.keyOf(tr)) + ' 메이저' + (tr ? ' (처음 키에서 반음 +' + tr + ')' : ' (처음 키)'); };
      const showKey = tr => { if (B.kind !== 'vocal' || tr === shownTr) return; shownTr = tr; sheet = sheetFor(ex, B, width, o, tr); paintNotation(); };
      const tabR = B.kind === 'fretted' ? tabRows(B.notes, o.rh, width, B.NS) : null;
      const view = viewFor(ex, B);
      const status = h('div', { class: 'tech-status', role: 'status', 'aria-live': 'polite' }, '▶ 시작을 누르면 “하나 둘 셋 넷” 뒤에 시작해요.');
      const keepTempo = () => saveJSON(TEMPO_KEY, tempos);
      const tempoIn = GH.ui.rangeNumber({ value: t.bpm, min: 30, max: 240, suffix: 'BPM', label: '템포', onInput: v => { t.bpm = v; keepTempo(); } });
      const gap = Math.round((Math.ceil(beats / 4 - 1e-6) * 4 - beats) * 1000) / 1000;
      const keyTxt = tr => N.pretty(B.keyOf(tr)) + ' 메이저' + (tr ? ' (반음 +' + tr + ')' : ' (처음 키)');
      const start = () => {
        GH.player.playSeq(B.seq, {
          tempo: t.bpm, loop: play.loop || play.trainer || (B.kind === 'vocal' && B.trs.length > 1), loopGap: gap, metronome: play.metronome, countIn: play.countIn ? 4 : 0,
          sound: soundFor(ex, B, o),
          onCount: k => { status.textContent = ['하나', '둘', '셋', '넷'][k] || ''; status.classList.add('count'); },
          onPass: (n, tp) => { showKey(B.kind === 'vocal' ? B.trs[n % B.trs.length] : 0); status.classList.remove('count'); status.textContent = '지금 ' + tp + ' BPM · ' + (n + 1) + '번째' + (B.kind === 'vocal' ? ' · ' + keyTxt(B.trs[n % B.trs.length]) : '') + (play.trainer ? ' · 스피드 트레이너 ' + t.max + ' BPM까지' : ''); tempoIn.setValue(tp); },
          nextTempo: n => { if (play.trainer && n % play.every === 0) t.bpm = Math.min(t.max, t.bpm + play.step); return t.bpm; },
          onNote: (i, ev) => {
            if (sheet) sheet.highlight(i < 0 || !ev ? null : ev.at);
            if (tabR) tabR.highlight(i);
            if (view) view.highlight(i < 0 ? null : ev);
          },
          onStop: () => { showKey(0); status.classList.remove('count'); status.textContent = '멈췄어요. 편하게 됐다면 템포를 조금 올려 보세요.'; keepTempo(); }
        });
      };
      const chk = (label, key, extra) => h('label', { class: 'tech-chk' }, h('input', { type: 'checkbox', checked: play[key], onchange: e => { play[key] = e.target.checked; if (extra) extra(); } }), label);
      const trainerBox = h('div', { class: 'tech-trainer', hidden: !play.trainer },
        GH.ui.numberInput({ value: play.every, min: 1, max: 16, suffix: '번', label: '반복 횟수', onChange: v => { play.every = v; } }), h('span', null, '반복마다'),
        GH.ui.numberInput({ value: play.step, min: 1, max: 20, suffix: 'BPM', label: '올릴 템포', onChange: v => { play.step = v; } }), h('span', null, '씩 올려서'),
        GH.ui.numberInput({ value: t.max, min: 30, max: 240, suffix: 'BPM', label: '목표 템포', onChange: v => { t.max = v; } }), h('span', null, '까지'));
      const noteBox = h('div', { class: 'tech-notation' });
      const paintNotation = () => {
        GH.ui.clear(noteBox);
        if (keyCap) { paintKey(shownTr); noteBox.appendChild(keyCap); }
        const showSheet = !tabR || play.view !== 'tab', showTab = tabR && play.view !== 'staff';
        if (showSheet) noteBox.appendChild(sheet ? h('div', { class: 'tech-sheet' }, sheet.el) : h('p', { class: 'muted tech-sheet' }, GH.render.hasVexFlow && GH.render.hasVexFlow() ? '악보를 그릴 수 없습니다.' : '악보는 VexFlow 라이브러리를 인터넷에서 불러오는 중이에요. 잠시 뒤 나타나요.'));
        if (showTab) noteBox.appendChild(tabR.el);
      };
      paintNotation();
      el.appendChild(section('따라 하기',
        h('div', { class: 'toolbar tech-play' }, A.playBtn('▶ 시작', start, 'primary'), A.stopBtn(), h('label', { class: 'tech-tempo' }, '템포', tempoIn)),
        h('div', { class: 'toolbar tech-play-opts' }, chk('메트로놈', 'metronome'), chk('반복', 'loop'), chk('시작 전 4박 세기', 'countIn'), chk('스피드 트레이너', 'trainer', () => { trainerBox.hidden = !play.trainer; }),
          tabR ? h('label', null, '보기', select({ options: [{ value: 'both', label: '오선 + TAB' }, { value: 'staff', label: '오선만' }, { value: 'tab', label: 'TAB만' }], value: play.view, onChange: v => { play.view = v; paintNotation(); } })) : null),
        trainerBox, status, noteBox,
        h('p', { class: 'muted tech-note' }, B.kind === 'fretted' ? '오선의 음은 실제 소리보다 한 옥타브 높게 적는 ' + (ex.inst === 'bass' ? '베이스' : '기타') + ' 표기 관례를 따라요. TAB 숫자는 누를 프렛, 위의 작은 글자는 손가락 · 피킹.' + (ex.inst === 'bass' ? ' x 는 데드 노트.' : '') : B.kind === 'drums' ? (ex.handsOnly ? '스네어 한 가지 소리만 적었어요. 음표 아래 글자가 스티킹(R 오른손 · L 왼손), > 는 액센트예요.' : '드럼 보표: 맨 위 x 크래시 · 그 아래 x 하이햇 · 라이드, 가운데 칸 스네어, 아래 킥, 맨 아래 x 는 하이햇 페달.') : B.kind === 'keys' ? '위는 오른손(높은음자리표), 아래는 왼손(낮은음자리표). 음표 위 숫자는 손가락 번호.' : '반복할 때마다 피아노 화음이 새 키를 먼저 알려 주고, 악보와 가사도 그 키로 바뀌어요.' + (o.guide === 'line' ? ' 회색 음표는 피아노가 치는 선율, 검은 음표가 내가 부를 음이에요.' : ''))));
      if (view) el.appendChild(section(B.kind === 'keys' ? '건반' : B.kind === 'drums' ? (ex.handsOnly ? '스네어' : '드럼 킷') : '지판', view.el, h('p', { class: 'muted' }, view.note)));

      el.appendChild(section('도움말', h('ul', { class: 'tech-tips' }, ex.tips.map(x => h('li', null, x)))));
      const same = GH.data.technique.filter(e => e.cat === ex.cat && e.id !== ex.id);
      const extra = ex.inst === 'guitar' && (ex.cat === 'pent' || ex.id === 'pent-legato') ? [h('a', { href: A.scaleHref('minor_pent', o.key || 'A') }, '스케일 포지션에서 박스 보기')] : [];
      el.appendChild(section('다음에 해 볼 것', h('div', { class: 'toc' }, same.map(e => h('a', { href: exHref(e) }, e.ko)).concat(extra, [h('a', { href: '#/technique/' + I.id }, I.ko + ' 기본기 목록'), h('a', { href: '#/rhythm' }, '메트로놈 · 리듬 연습')]))));
    }
  };
  GH.technique = { build, options, rhOptions, RH, soundFor, sheetFor, viewFor, vocalLabels };
})();
