/* 기타 › 더블스탑 (스케일 패턴) + 화음 페이지에서 쓰는 더블스탑 보기 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, select, notice, callout } = GH.ui; const N = GH.notes;

  const GAP_OPTIONS = [{ value: 'auto', label: '자동 (3·4도는 인접 줄, 6도·옥타브는 한 줄 건너)' }, { value: 'adjacent', label: '인접 줄만' }, { value: 'skip', label: '한 줄 건너서만' }, { value: 'any', label: '제한 없음' }];
  const FRET_OPTIONS = [12, 15, 17, 19, 22].map(n => ({ value: n, label: n + '프렛까지' }));

  /* steps: [{lo: midi, hi: midi, num, labels: [위 음 라벨, 아래 음 라벨], iv}] 한 칸 = 한 박
     cfg: {gap, allowOpen, maxFret, tempo, pref, title}. 반환: 요소 */
  function view(steps, cfg) {
    const tuning = GH.state.tuningMidi(); const capo = Number(GH.state.get().capo) || 0;
    /* 줄을 정해 둔 칸(fixed)은 그대로, 나머지는 DP 로 고른다 */
    const path = steps.every(s => s && s.fixed) ? steps.map(s => ({ ns: s.fixed }))
      : GH.fingering.pairs(steps.map(s => s ? [s.lo, s.hi, s.num] : null), { tuning, capo, gap: cfg.gap, allowOpen: cfg.allowOpen, maxFret: cfg.maxFret });
    const box = h('div', { class: 'ds-view' });
    const missing = path.filter((p, i) => steps[i] && !p).length;
    const fallback = path.filter(p => p && p.fallback).length;
    if (missing) box.appendChild(notice(missing + '개 음은 지금 설정(줄 규칙, 최대 프렛, 개방현)으로 잡을 수 없어 쉼표로 표시했습니다. 최대 프렛을 늘리거나 줄 규칙을 바꿔 보세요.'));
    if (fallback) box.appendChild(h('p', { class: 'muted', style: 'font-size:.84rem' }, fallback + '개 음은 선택한 줄 간격으로는 잡을 수 없어 다른 줄 간격으로 배치했습니다.'));
    const tempo = () => (typeof cfg.tempo === 'function' ? cfg.tempo() : cfg.tempo) || 90;
    const lick = { key: 'C', tempo: tempo(), notes: path.map((p, i) => p ? { ns: p.ns, d: 1 } : { rest: true, d: 1 }) };
    const tab = GH.render.tab(lick);
    /* 지판: 쓰인 자리만, 두 음 모두 */
    const used = path.filter(Boolean);
    const frets = [].concat(...used.map(p => p.ns.map(n => n[1])));
    const from = frets.length ? Math.max(0, Math.min(...frets) - 1) : 0;
    const to = frets.length ? Math.min(24, Math.max(from + 5, Math.max(...frets) + 1)) : 12;
    const seen = new Set(); const fbNotes = [];
    path.forEach((p, i) => { if (!p) return; p.ns.forEach(([s, f], k) => { const key = s + ':' + f; if (seen.has(key)) return; seen.add(key); fbNotes.push({ s, f, label: steps[i].labels ? steps[i].labels[k] : null, cls: k === 0 ? 'iv-3' : 'iv-5' }); }); });
    const fb = GH.render.fretboard({ notes: fbNotes, pref: cfg.pref, from, to, tuning, capo, labelMode: 'degree' });
    const play = () => GH.player.playLick(lick, { tempo: tempo(), tuning, onNote: (i, ev) => { tab.highlight(i); fb.highlightMany(i >= 0 && ev && ev.ns ? ev.ns : []); } });
    box.appendChild(h('div', { class: 'row', style: 'margin:6px 0 10px' }, GH.app.playBtn('▶ 더블스탑 듣기', play, 'primary'), GH.app.stopBtn(), capo ? h('span', { class: 'muted', style: 'font-size:.84rem' }, '카포 ' + capo + '프렛 기준. TAB 숫자는 실제 프렛 번호입니다.') : null));
    box.appendChild(h('div', { style: 'overflow-x:auto' }, tab.el));
    box.appendChild(h('div', { style: 'margin-top:10px' }, fb.el));
    box.appendChild(h('div', { class: 'legend', style: 'margin-top:6px' }, h('span', { class: 'iv-3' }, h('span', { class: 'sw' }), '위 음 (높은 줄)'), h('span', { class: 'iv-5' }, h('span', { class: 'sw' }), '아래 음 (낮은 줄)')));
    const staff = GH.render.staff(lick, { pref: cfg.pref, tuning, width: 1000 });
    if (staff) box.appendChild(h('div', { style: 'margin-top:10px' }, h('p', { class: 'muted', style: 'font-size:.82rem;margin:0 0 4px' }, '오선 (기타 악보 관례대로 실음보다 한 옥타브 높게 적음)'), staff));
    box.path = path;
    return box;
  }

  /* 한 줄 쌍을 따라 스케일 순서대로 올라가는 패턴 */
  function scalePattern(keyRoot, scaleId, size, lowerString, upperString, o) {
    const tuning = GH.state.tuningMidi(); const capo = Number(GH.state.get().capo) || 0;
    const i = 6 - lowerString, j = 6 - upperString;
    const pcs = new Set(GH.scales.pcs(N.pcOf(keyRoot), scaleId));
    const lows = [];
    for (let f = capo; f <= o.maxFret; f++) { if (!o.allowOpen && f === capo) continue; const m = tuning[i] + f; if (pcs.has(N.mod(m, 12))) lows.push(m); }
    const res = GH.harmony.build(lows, keyRoot, scaleId, [{ mode: 'diatonic', size, dir: 1 }]);
    const steps = [];
    res.melody.forEach((m, k) => {
      const v = res.voices[0][k]; const fL = m.midi - tuning[i], fH = v.midi - tuning[j];
      if (fH < capo || fH > o.maxFret || (!o.allowOpen && fH === capo)) return;
      const fretted = [fL, fH].filter(f => f !== capo);
      if (fretted.length === 2 && Math.abs(fL - fH) > 3) return;
      steps.push({ lo: m.midi, hi: v.midi, num: v.iv ? v.iv.num : Number(size), labels: [N.pretty(v.name), N.pretty(m.name)], iv: v.iv, loName: m.name, hiName: v.name, degree: m.label, fixed: [[upperString, fH], [lowerString, fL]] });
    });
    return steps;
  }

  const state = { key: null, scale: 'ionian', size: '3', pair: null, maxFret: 15, allowOpen: true, dir: 'ascdesc', tempo: 100 };
  const PAIRS = { 1: ['1-2', '2-3', '3-4', '4-5', '5-6'], 2: ['1-3', '2-4', '3-5', '4-6'] };
  const DEFAULT_PAIR = { 3: '2-3', 4: '2-3', 6: '1-3', 8: '2-4' };
  const STRING_NAMES = ['', '1번(높은 E)', '2번(B)', '3번(G)', '4번(D)', '5번(A)', '6번(낮은 E)'];

  GH.pages['/guitar/doublestops'] = {
    title: '더블스탑',
    staff: true,
    render(el) {
      const A = GH.app; const key = state.key || A.key(); const pref = A.pref(key);
      const rerender = () => GH.router.rerender();
      const gapKind = Number(state.size) >= 6 ? 2 : 1;
      if (!state.pair || !PAIRS[gapKind].includes(state.pair)) state.pair = DEFAULT_PAIR[state.size];
      const [upper, lower] = state.pair.split('-').map(Number);
      el.appendChild(h('h1', null, '더블스탑'));
      el.appendChild(h('p', { class: 'muted' }, '두 줄을 함께 눌러 두 음을 동시에 내는 연주법입니다. 키와 스케일, 음정, 줄 쌍을 고르면 스케일 순서대로 지판을 따라 올라가는 패턴을 만들어 줍니다. 3도와 6도는 멜로디를 두껍게 만드는 가장 흔한 더블스탑입니다.'));
      el.appendChild(h('div', { class: 'toolbar' },
        h('label', null, '키', A.rootSelect(key, v => { state.key = v; rerender(); })),
        h('label', null, '스케일', A.scaleSelect(state.scale, v => { state.scale = v; rerender(); }, s => s.intervals.length === 7)),
        h('label', null, '음정', select({ options: [['3', '3도'], ['4', '4도'], ['6', '6도'], ['8', '옥타브']].map(([v, l]) => ({ value: v, label: l })), value: state.size, onChange: v => { state.size = v; state.pair = null; rerender(); } })),
        h('label', null, '줄 쌍', select({ options: PAIRS[gapKind].map(p => { const [u, l] = p.split('-'); return { value: p, label: STRING_NAMES[u] + ' + ' + STRING_NAMES[l] }; }), value: state.pair, onChange: v => { state.pair = v; rerender(); } })),
        h('label', null, '최대', GH.ui.numberInput({ value: state.maxFret, min: 4, max: 24, suffix: '프렛까지', label: '쓸 수 있는 가장 높은 프렛', onChange: v => { state.maxFret = v; rerender(); } })),
        h('label', null, h('input', { type: 'checkbox', checked: state.allowOpen, onchange: e => { state.allowOpen = e.target.checked; rerender(); } }), '개방현 허용'),
        h('label', null, '순서', select({ options: [{ value: 'asc', label: '올라가기' }, { value: 'desc', label: '내려가기' }, { value: 'ascdesc', label: '올라갔다 내려오기' }], value: state.dir, onChange: v => { state.dir = v; rerender(); } })),
        h('label', null, '템포', GH.ui.rangeNumber({ value: state.tempo, min: 40, max: 220, suffix: 'BPM', label: '템포', onInput: v => { state.tempo = v; } }))));
      const base = scalePattern(key, state.scale, state.size, lower, upper, state);
      if (!base.length) { el.appendChild(GH.ui.empty('이 줄 쌍과 프렛 범위에서는 만들 수 있는 더블스탑이 없습니다. 줄 쌍이나 최대 프렛을 바꿔 보세요.')); return; }
      const seq = state.dir === 'desc' ? base.slice().reverse() : state.dir === 'ascdesc' ? base.concat(base.slice(0, -1).reverse()) : base;
      /* 줄 쌍을 고정했으므로 운지는 그대로 쓰고, 보기 요소만 공용 함수로 */
      const v = view(seq.map(s => Object.assign({}, s)), { gap: gapKind === 1 ? 'adjacent' : 'skip', allowOpen: state.allowOpen, maxFret: state.maxFret, tempo: () => state.tempo, pref });
      const ivRow = h('div', { class: 'ds-ivs' }, base.map(s => h('span', { class: 'ds-iv', title: s.iv ? s.iv.ko : '' }, h('b', null, N.pretty(s.hiName)), h('b', null, N.pretty(s.loName)), h('small', null, s.iv ? s.iv.en : ''))));
      el.appendChild(section(STRING_NAMES[upper] + ' + ' + STRING_NAMES[lower] + ' · ' + N.pretty(key) + ' ' + GH.scales.get(state.scale).ko.split(' (')[0] + ' ' + { 3: '3도', 4: '4도', 6: '6도', 8: '옥타브' }[state.size],
        h('p', { class: 'muted' }, '위 칸은 높은 줄의 음, 아래 칸은 낮은 줄의 음입니다. 장·단 음정이 스케일에 따라 바뀌는 것을 들어 보세요.'), ivRow, v));
      el.appendChild(callout(h('b', null, '연습 방법. '), '먼저 메트로놈 60~80에서 한 박에 한 쌍씩 올라가고 내려오세요. 익숙해지면 두 줄을 번갈아 치는 트레몰로, 한 음 위에서 슬라이드로 들어가는 소리, 그리고 3도 패턴 위에 코드를 떠올리며 즉흥으로 이어 보세요. 3도는 컨트리와 소울, 6도는 R&B와 블루스 발라드, 옥타브는 재즈(웨스 몽고메리) 스타일에서 자주 씁니다.'));
      el.appendChild(h('div', { class: 'toc' }, h('a', { href: '#/tools/harmony' }, '멜로디에 화음을 쌓아 더블스탑으로 바꾸기 →'), h('a', { href: A.scaleHref(state.scale, key) }, '이 스케일 포지션 →')));
    }
  };
  GH.doublestops = { view, scalePattern, GAP_OPTIONS, FRET_OPTIONS };
})();
