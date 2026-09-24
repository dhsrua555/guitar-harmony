/* 기타 › 솔로 프레이즈 만들기 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, select, table, callout } = GH.ui; const N = GH.notes; const P = GH.phrase;

  const PROGS = ['ii-V-I', 'ii-V-i', 'I-vi-ii-V', 'I-V-vi-IV', 'I-IV-V', 'blues12'];
  const POSITIONS = { low: { ko: '낮은 포지션 (0~5프렛)', win: [0, 5] }, mid: { ko: '가운데 (5~9프렛)', win: [5, 9] }, high: { ko: '높은 포지션 (8~13프렛)', win: [8, 13] } };
  const TECHNIQUES = [
    { id: 'target', title: '코드톤 타겟팅', cfg: { target: 'auto', approach: 'none', filler: 'arpeggio' },
      text: '솔로의 뼈대입니다. 코드가 바뀌는 강박(1박)에 그 코드의 3음이나 7음을 놓으면 반주 없이도 진행이 들립니다. 3음과 7음은 코드의 성격을 정하는 음이라 "가이드 톤"이라고 부릅니다.' },
    { id: 'chromatic', title: '반음 어프로치', cfg: { target: 'auto', approach: 'below', filler: 'scale' },
      text: '타겟 바로 앞 약박에 반음 아래(또는 위) 음을 두고 미끄러지듯 도착합니다. 스케일 밖 음이어도 곧바로 코드톤으로 풀리기 때문에 긴장이 자연스럽게 해소됩니다.' },
    { id: 'scaleAp', title: '스케일 어프로치', cfg: { target: 'auto', approach: 'scaleAbove', filler: 'scale' },
      text: '다음 코드의 스케일 안에서 한 칸 위나 아래 음으로 다가갑니다. 반음 어프로치보다 부드럽고 팝·록 솔로에 잘 어울립니다.' },
    { id: 'enclosure', title: '인클로저', cfg: { target: 'auto', approach: 'enclosure', filler: 'scale' },
      text: '타겟을 위아래에서 감싼 뒤 도착합니다. 스케일 위 음 → 반음 아래 음 → 타겟 순서가 가장 흔하며, 비밥 라인의 대표적인 소리입니다.' },
    { id: 'encChrom', title: '크로매틱 인클로저', cfg: { target: 'auto', approach: 'enclosureChrom', filler: 'scale' },
      text: '위아래 모두 반음으로 감쌉니다. 긴장이 더 크고 재즈다운 색이 진해집니다.' },
    { id: 'double', title: '더블 크로매틱 어프로치', cfg: { target: 'auto', approach: 'doubleBelow', filler: 'arpeggio' },
      text: '반음 두 개를 연달아 밟아 타겟에 도착합니다. 두 음이 모두 약박에 오도록 박자를 맞추면 스케일 밖 음이 잘 들리지 않고 흐름만 남습니다.' },
    { id: 'passing', title: '패싱 노트', cfg: { target: 'auto', approach: 'below', filler: 'passing' },
      text: '스케일 음 사이의 온음 간격을 반음으로 채워 지나갑니다. 약박에 두면 8분음표 라인에서 코드톤이 강박에 계속 걸리게 됩니다 (비밥 스케일의 원리).' },
    { id: 'neighbor', title: '이웃음', cfg: { target: 'auto', approach: 'none', filler: 'neighbor' },
      text: '타겟에서 한 칸 위로 갔다 돌아오고, 반음 아래로 갔다 돌아옵니다. 음을 많이 쓰지 않고도 멜로디가 살아 움직이는 느낌을 줍니다.' }
  ];
  const state = { prog: 'ii-V-I', key: null, target: 'auto', approach: 'enclosure', filler: 'scale', pos: 'mid', tempo: 110, swing: true, backing: true, lastDemo: null };

  function context(key, progId) {
    const p = GH.data.progressions.find(x => x.id === progId) || GH.data.progressions.find(x => x.id === 'ii-V-I');
    const chords = GH.app.progressionChords(p, key);
    return { p, chords };
  }
  function makeLine(chords, key, mode, cfg, pos) {
    const tuning = GH.state.tuningMidi(); const win = POSITIONS[pos].win; const capo = Number(GH.state.get().capo) || 0;
    const lo = tuning[1] + Math.max(win[0], capo), hi = tuning[5] + win[1];
    const line = P.build(chords, Object.assign({ key, mode, lo, hi, start: Math.round((lo + hi) / 2) + 2 }, cfg));
    const frets = GH.fingering.single(line.map(n => n.midi), { tuning, capo, window: win, maxFret: 22 });
    const lick = { key, tempo: state.tempo, feel: state.swing ? 'swing' : 'straight', notes: line.map((n, i) => frets[i] ? Object.assign({ s: frets[i].s, f: frets[i].f, d: n.d }, n.ch ? { ch: n.ch } : {}) : Object.assign({ rest: true, d: n.d }, n.ch ? { ch: n.ch } : {})) };
    return { line, frets, lick, tuning };
  }
  /* 라인 재생 + (선택) 코드 반주 */
  function play(out, chords, onNote) {
    const A = GH.audio;
    GH.player.playLick(out.lick, {
      tempo: state.tempo, tuning: out.tuning, onNote,
      onStart: (t0, beat) => {
        if (!state.backing) return;
        const playable = GH.app.toPlayable(chords); let at = t0;
        playable.forEach((c, i) => { const d = (chords[i].beats || 4) * beat; c.midi.forEach((m, k) => A.pluck(m, at + k * 0.012, d * 0.95, { gain: 0.3 })); A.bass(c.bass - 12, at, d * 0.9, { gain: 0.55 }); at += d; });
      }
    });
  }
  const roleTag = r => h('span', { class: 'role-tag role-' + r, title: P.ROLES[r].desc }, P.ROLES[r].en);

  GH.pages['/guitar/phrasing'] = {
    title: '솔로 프레이즈 만들기',
    staff: true,
    render(el) {
      const A = GH.app; const key = state.key || A.key(); const pref = A.pref(key);
      const rerender = () => GH.router.rerender();
      const ctx = context(key, state.prog); const mode = ctx.p.mode;
      el.appendChild(h('h1', null, '솔로 프레이즈 만들기'));
      el.appendChild(h('p', { class: 'muted' }, '좋은 솔로는 코드톤을 강박에 두고, 그 사이를 어프로치 노트·인클로저·패싱 노트로 잇는 데서 시작합니다. 아래 기법을 하나씩 들어 본 뒤, 빌더에서 진행과 기법을 골라 나만의 라인을 만들어 보세요. 모든 예제는 지금 키로 만들어집니다.'));
      el.appendChild(h('div', { class: 'legend role-legend' }, Object.keys(P.ROLES).map(r => h('span', null, roleTag(r), P.ROLES[r].ko))));

      /* ---- 기법 카드 ---- */
      const demo = context(key, 'ii-V-I');
      const grid = h('div', { class: 'grid cols-2 technique-grid' });
      TECHNIQUES.forEach((t, idx) => {
        const out = makeLine(demo.chords, key, 'major', t.cfg, state.pos);
        const seq = h('div', { class: 'phrase-seq' });
        let chordIdx = -1;
        out.line.forEach((n, i) => {
          if (n.ci !== chordIdx) { chordIdx = n.ci; seq.appendChild(h('span', { class: 'phrase-chord' }, demo.chords[n.ci].symbol)); }
          seq.appendChild(h('span', { class: 'phrase-note role-' + n.role, 'data-i': i, title: P.ROLES[n.role].ko + ' · ' + n.iv }, h('b', null, N.pretty(N.noteName(n.midi % 12, pref))), h('small', null, n.iv)));
        });
        const hl = i => seq.querySelectorAll('.phrase-note').forEach(e => e.classList.toggle('current', Number(e.dataset.i) === i));
        grid.appendChild(h('div', { class: 'card technique' },
          h('div', { class: 'row', style: 'justify-content:space-between' }, h('h3', { style: 'margin:0' }, String(idx + 1).padStart(2, '0') + ' ' + t.title), A.playBtn('▶ 듣기', () => play(out, demo.chords, i => hl(i)))),
          h('p', null, t.text), seq,
          h('button', { class: 'btn small', type: 'button', onclick: () => { Object.assign(state, t.cfg); state.prog = 'ii-V-I'; rerender(); setTimeout(() => { const b = document.getElementById('phrase-builder'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); } }, '빌더에서 열기 →')));
      });
      el.appendChild(section('기법 한눈에 보기 (' + N.pretty(key) + ' 키 ii – V – I)', grid));

      /* ---- 빌더 ---- */
      const out = makeLine(ctx.chords, key, mode, { target: state.target, approach: state.approach, filler: state.filler }, state.pos);
      const builder = section('프레이즈 빌더');
      builder.id = 'phrase-builder';
      builder.appendChild(h('div', { class: 'toolbar' },
        h('label', null, '진행', select({ options: PROGS.map(id => GH.data.progressions.find(p => p.id === id)).filter(Boolean).map(p => ({ value: p.id, label: p.ko })), value: state.prog, onChange: v => { state.prog = v; rerender(); } })),
        h('label', null, '키', A.rootSelect(key, v => { state.key = v; rerender(); })),
        h('label', null, '타겟', select({ options: Object.entries(P.TARGETS).map(([v, l]) => ({ value: v, label: l })), value: state.target, onChange: v => { state.target = v; rerender(); } })),
        h('label', null, '어프로치', select({ options: Object.entries(P.APPROACHES).map(([v, o]) => ({ value: v, label: o.ko })), value: state.approach, onChange: v => { state.approach = v; rerender(); } })),
        h('label', null, '사이 채우기', select({ options: Object.entries(P.FILLERS).map(([v, l]) => ({ value: v, label: l })), value: state.filler, onChange: v => { state.filler = v; rerender(); } })),
        h('label', null, '포지션', select({ options: Object.entries(POSITIONS).map(([v, o]) => ({ value: v, label: o.ko })), value: state.pos, onChange: v => { state.pos = v; rerender(); } }))));
      const tab = GH.render.tab(out.lick);
      const fbNotes = []; const seen = new Set();
      out.frets.forEach((f, i) => { if (!f) return; const k = f.s + ':' + f.f; if (seen.has(k)) return; seen.add(k); const n = out.line[i]; fbNotes.push({ s: f.s, f: f.f, label: n.iv, cls: n.role === 'target' || n.role === 'ct' ? N.ivClass(n.iv) : 'iv-s' }); });
      const used = out.frets.filter(Boolean).map(f => f.f);
      const fb = GH.render.fretboard({ notes: fbNotes, pref, from: used.length ? Math.max(0, Math.min(...used) - 1) : 0, to: used.length ? Math.max(Math.min(...used) + 5, Math.max(...used) + 1) : 12, labelMode: 'degree' });
      const rows = out.line.map((n, i) => ({ class: '', cells: [i + 1, h('b', null, N.pretty(N.noteName(n.midi % 12, pref))), ctx.chords[n.ci].symbol, h('span', { class: 'pill ' + N.ivClass(n.iv) }, n.iv), h('span', null, roleTag(n.role), ' ', P.ROLES[n.role].ko), out.frets[i] ? out.frets[i].s + '번 줄 ' + out.frets[i].f + '프렛' : '–'] }));
      const noteTable = table(['#', '음', '코드', '도수', '역할', '자리'], rows);
      const hl = i => { tab.highlight(i); const f = out.frets[i]; fb.highlight(f ? f.s : null, f ? f.f : null); noteTable.querySelectorAll('tbody tr').forEach((tr, k) => tr.classList.toggle('hl', k === i)); };
      builder.appendChild(h('div', { class: 'toolbar' },
        A.playBtn('▶ 라인 듣기', () => play(out, ctx.chords, hl), 'primary'), A.stopBtn(),
        h('label', null, '템포', GH.ui.rangeNumber({ value: state.tempo, min: 40, max: 240, suffix: 'BPM', label: '템포', onInput: v => { state.tempo = v; out.lick.tempo = v; } })),
        h('label', null, h('input', { type: 'checkbox', checked: state.swing, onchange: e => { state.swing = e.target.checked; out.lick.feel = state.swing ? 'swing' : 'straight'; } }), '스윙'),
        h('label', null, h('input', { type: 'checkbox', checked: state.backing, onchange: e => { state.backing = e.target.checked; } }), '코드 반주')));
      builder.appendChild(A.chordStrip(ctx.chords, { link: true }));
      builder.appendChild(h('h3', null, 'TAB'));
      builder.appendChild(h('div', { style: 'overflow-x:auto' }, tab.el));
      const staff = GH.render.staff(out.lick, { pref, tuning: out.tuning, width: Math.min(1100, el.clientWidth || 1000), style: GH.render.feelMark(state.tempo, state.swing ? 'swing' : 'straight') });
      if (staff) { builder.appendChild(h('h3', null, '오선')); builder.appendChild(staff); }
      builder.appendChild(h('h3', null, '지판'));
      builder.appendChild(fb.el);
      builder.appendChild(A.deep('음마다 분석 보기', noteTable));
      el.appendChild(builder);

      el.appendChild(callout(h('b', null, '연습 순서. '), '1) 타겟만 온음표로 치며 코드가 바뀔 때 가장 가까운 3음·7음으로 옮겨 가기 → 2) 타겟 앞에 반음 어프로치 하나 붙이기 → 3) 인클로저로 바꾸기 → 4) 사이를 스케일과 패싱 노트로 채워 8분음표 라인 완성. 만든 라인은 백킹 트랙 위에서 반복해 보고, 마음에 드는 조각은 릭처럼 12키로 옮겨 연습하세요.'));
      el.appendChild(h('div', { class: 'toc' },
        h('a', { href: A.backingHref(state.prog, key) }, '이 진행으로 백킹 트랙 →'),
        h('a', { href: '#/guitar/triads' }, '아르페지오로 코드톤 익히기 →'),
        h('a', { href: '#/guitar/licks?genre=jazz' }, '실제 릭에서 찾아보기 →')));
    }
  };
})();
