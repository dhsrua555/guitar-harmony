/* SVG 코드 다이어그램 (손그림 선) */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { svg } = GH.ui; const N = GH.notes; const S = () => GH.sketch;
  GH.render = GH.render || {};

  /* v: 보이싱 {frets, fingers, labels, symbol, name, baseFret, barre}
     opts: {labelMode: 'finger'|'iv'|'name', title, sub, lefty, pref, frets(표시 프렛 수)} */
  function chordDiagram(v, opts) {
    opts = opts || {};
    const st = GH.state ? GH.state.get() : {};
    const lefty = opts.lefty != null ? opts.lefty : !!st.lefty;
    const labelMode = opts.labelMode || 'iv';
    const played = v.frets.filter(f => f != null);
    const nonzero = played.filter(f => f > 0);
    const maxF = played.length ? Math.max(...played) : 4;
    let base = nonzero.length ? Math.min(...nonzero) : 1;
    const span = nonzero.length ? maxF - base + 1 : 1;
    let nFr = Math.max(opts.frets || 4, span);
    if (maxF <= nFr && base <= 2) base = 1; /* 낮은 포지션은 너트부터 */
    else if (base > 1 && maxF - base + 1 < nFr) { /* 그대로 */ }
    const showNut = base === 1;
    const W = 118, CW = 16, CH = 18, LEFT = 22, TOP = opts.title === false ? 22 : 46, BOT = 16;
    const H = TOP + nFr * CH + BOT;
    const el = svg('svg', { class: 'chord', viewBox: `0 0 ${W} ${H}`, width: W, height: H });
    const sx = i => LEFT + (lefty ? (5 - i) : i) * CW;   /* i: 0=6번줄 */
    const fy = k => TOP + k * CH;                            /* k 번째 프렛 선 */
    if (opts.title !== false) {
      el.appendChild(svg('text', { class: 'title', x: W / 2, y: 11 }, opts.title != null ? opts.title : (v.symbol || '')));
      const sub = opts.sub != null ? opts.sub : (v.name || '');
      if (sub) el.appendChild(svg('text', { class: 'sub', x: W / 2, y: 24 }, sub));
    }
    const grid = svg('g', { class: 'grid' });
    let gd = '';
    for (let k = 0; k <= nFr; k++) gd += S().line(Math.min(sx(0), sx(5)), fy(k), Math.max(sx(0), sx(5)), fy(k), { passes: 1, bow: 0.6 });
    for (let i = 0; i < 6; i++) gd += S().line(sx(i), fy(0), sx(i), fy(nFr), { passes: 1, bow: 0.8 });
    grid.appendChild(S().path(gd, 'sk-grid'));
    el.appendChild(grid);
    if (showNut) el.appendChild(S().path(S().line(Math.min(sx(0), sx(5)) - 1, fy(0), Math.max(sx(0), sx(5)) + 1, fy(0), { passes: 3, jitter: 1 }), 'nut'));
    else el.appendChild(svg('text', { class: 'basefret', x: lefty ? W - 8 : sx(0) - 20, y: fy(0) + CH / 2, style: 'text-anchor:' + (lefty ? 'end' : 'start') }, base + 'fr'));
    /* 바레 */
    if (v.barre && v.fingers) {
      const ones = v.frets.map((f, i) => f != null && v.fingers[i] === 1 ? i : null).filter(i => i != null);
      if (ones.length >= 2) {
        const f = v.frets[ones[0]];
        const k = f - base + (showNut ? 1 : 1);
        const y = fy(k) - CH / 2;
        const lo = Math.min(...ones), hi = Math.max(...ones);
        el.appendChild(S().path(S().line(Math.min(sx(lo), sx(hi)), y, Math.max(sx(lo), sx(hi)), y, { passes: 2, bow: 0.5, overshoot: 0.3, jitter: 0.6 }), 'barre'));
      }
    }
    v.frets.forEach((f, i) => {
      const x = sx(i);
      if (f == null) { el.appendChild(S().path(S().line(x - 3.5, fy(0) - 11.5, x + 3.5, fy(0) - 4.5, { passes: 1, overshoot: 0.6 }) + S().line(x + 3.5, fy(0) - 11.5, x - 3.5, fy(0) - 4.5, { passes: 1, overshoot: 0.6 }), 'mute')); return; }
      if (f === 0) {
        const og = svg('g', { class: 'openg', style: 'cursor:pointer', onclick: () => { if (GH.audio) GH.audio.pluck(GH.voicings.STD[i], GH.audio.now(), 1.4, { gain: 0.9 }); } });
        og.appendChild(svg('circle', { cx: x, cy: fy(0) - 8, r: 7, fill: 'transparent' }));
        og.appendChild(S().path(S().ellipse(x, fy(0) - 8, 4.5, 4.3), 'dot open'));
        el.appendChild(og);
      }
      const cls = v.labels && v.labels[i] ? N.ivClass(v.labels[i]) : 'iv-s';
      if (f > 0) {
        const k = f - base + 1; const y = fy(k) - CH / 2;
        const midi = GH.voicings.STD[i] + f;
        const g = svg('g', { class: cls + ' dotg', style: 'cursor:pointer', onclick: () => { if (GH.audio) GH.audio.pluck(midi, GH.audio.now(), 1.4, { gain: 0.9 }); } });
        g.appendChild(S().path(S().blob(x, y, 7, 6.7), 'dot'));
        g.appendChild(S().path(S().ellipse(x + 0.6, y - 0.5, 7.3, 7), 'ink'));
        let label = '';
        if (labelMode === 'finger') label = v.fingers && v.fingers[i] ? v.fingers[i] : '';
        else if (labelMode === 'name') label = N.noteName((GH.voicings.STD[i] + f) % 12, opts.pref || 'sharp');
        else label = v.labels ? v.labels[i] : '';
        g.appendChild(svg('text', { class: 'dot-label', x, y: y + 0.5 }, label));
        el.appendChild(g);
      } else if (f === 0 && labelMode !== 'finger') {
        const label = labelMode === 'name' ? N.noteName(GH.voicings.STD[i] % 12, opts.pref || 'sharp') : (v.labels ? v.labels[i] : '');
        el.appendChild(svg('text', { class: 'mark', x, y: fy(nFr) + 9, style: 'font-size:8px' }, label));
      }
    });
    return el;
  }
  /* 카드 (다이어그램 + 메타 + 재생) */
  function chordCard(v, opts) {
    opts = opts || {};
    const { h } = GH.ui;
    const card = h('div', { class: 'diagram-card' });
    card.appendChild(chordDiagram(v, opts));
    const meta = [];
    if (opts.meta !== false) {
      if (v.strSet) meta.push(v.strSet + '줄');
      if (v.inversionKo) meta.push(v.inversionKo);
      if (v.topIv) meta.push('탑 ' + v.topIv);
      if (v.rootless) meta.push('루트 생략');
    }
    if (meta.length) card.appendChild(h('div', { class: 'meta' }, meta.join(' · ')));
    if (opts.play !== false) card.appendChild(h('div', { class: 'play' }, h('button', { class: 'play-btn', type: 'button', onclick: () => GH.player.playVoicing(v, { arpeggio: opts.arpeggio }) }, '▶ 듣기')));
    return card;
  }
  GH.render.chordDiagram = chordDiagram;
  GH.render.chordCard = chordCard;
})();
