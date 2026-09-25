/* 자체 TAB 렌더러 (SVG, 손그림 선) */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { svg } = GH.ui; const S = () => GH.sketch;
  GH.render = GH.render || {};
  const TECH_KO = { h: 'H', p: 'P', '/': 'sl.', '\\': 'sl.', b: 'bend', '~': 'vib.' };
  /* lick: {notes:[...]}, opts: {ppb (박당 px), transpose, barStart (마디 번호 시작), strings (줄 수, 기본 6)} → {el, highlight(i)}
     음 이벤트에 fg(손가락 번호) · pk('d' 다운 | 'u' 업)가 있으면 TAB 위에 적는다 */
  function tab(lick, opts) {
    opts = opts || {};
    const NS = opts.strings || 6;                     /* 줄 수 (기타 6 · 베이스 4) */
    const hasFg = lick.notes.some(e => e.fg > 0 || typeof e.fg === 'string'), hasPick = lick.notes.some(e => e.pk);
    const isTrip = e => Math.abs(e.d - 1 / 3) < 1e-3, hasTrip = lick.notes.some(isTrip);
    const PPB = opts.ppb || 52, LEFT = 34, TOP = 30 + (hasFg && hasPick ? 12 : 0), LH = 13, BOT = 34 + (hasTrip ? 10 : 0);
    const tr = opts.transpose || 0;
    const total = lick.notes.reduce((a, e) => a + e.d, 0);
    const W = LEFT + total * PPB + 24, H = TOP + (NS - 1) * LH + BOT;
    const el = svg('svg', { class: 'tab', viewBox: `0 0 ${W} ${H}`, width: W, height: H, style: 'min-width:' + Math.min(W, 900) + 'px' });
    const sy = s => TOP + (s - 1) * LH;
    let ld = ''; for (let s = 1; s <= NS; s++) ld += S().line(LEFT, sy(s), W - 10, sy(s), { passes: 1, bow: 1, overshoot: 0.4, jitter: 0.3 });
    el.appendChild(S().path(ld, 'line'));
    el.appendChild(svg('text', { class: 'tabclef', x: 14, y: sy(1 + (NS - 1) * .2) }, 'T'));
    el.appendChild(svg('text', { class: 'tabclef', x: 14, y: sy(1 + (NS - 1) * .5) }, 'A'));
    el.appendChild(svg('text', { class: 'tabclef', x: 14, y: sy(1 + (NS - 1) * .8) }, 'B'));
    const bars = Math.ceil(total / 4 - 1e-6);
    for (let b = 0; b <= bars; b++) {
      const x = LEFT + Math.min(b * 4, total) * PPB;
      el.appendChild(S().path(S().line(x, sy(1), x, sy(NS), { passes: 2, bow: 0.6, overshoot: 0.8 }), 'bar'));
      if (b < bars) el.appendChild(svg('text', { x: x + 6, y: sy(NS) + 12, style: 'font-size:8px;fill:var(--fg-muted);text-anchor:start' }, b + 1 + (opts.barStart || 0)));
    }
    const items = [];
    let pos = 0; let prev = null;
    lick.notes.forEach((ev, i) => {
      const x = LEFT + pos * PPB + 10;
      const g = svg('g', { class: 'ev', 'data-idx': i });
      if (ev.ch) el.appendChild(svg('text', { class: 'chordname', x: x - 6, y: TOP - 18 }, ev.ch));
      if (ev.rest) {
        g.appendChild(svg('rect', { x: x - 4, y: sy((NS + 1) / 2) - 3, width: 8, height: 6, fill: 'var(--fg-muted)', opacity: .6, rx: 1 }));
      } else {
        const pairs = ev.ns ? ev.ns : [[ev.s, ev.f]];
        pairs.forEach(([s, f]) => {
          const bendTxt = ev.t === 'b' ? (ev.bend === 1 ? '½' : ev.bend === 3 ? '1½' : 'full') : null;
          g.appendChild(svg('text', { class: 'fret' + (ev.x ? ' dead' : ''), x, y: sy(s) }, ev.x ? 'x' : f + tr));
          if (bendTxt) {
            g.appendChild(svg('path', { d: `M${x + 7},${sy(s) - 2} Q${x + 16},${sy(s) - 4} ${x + 16},${sy(1) - 12}`, class: 'arc' }));
            g.appendChild(svg('path', { d: `M${x + 12},${sy(1) - 8} L${x + 16},${sy(1) - 14} L${x + 20},${sy(1) - 8}`, fill: 'none', stroke: 'var(--fg-muted)' }));
            g.appendChild(svg('text', { class: 'tech', x: x + 16, y: sy(1) - 20 }, bendTxt));
          }
        });
        if (ev.fg > 0 || typeof ev.fg === 'string') g.appendChild(svg('text', { class: 'finger', x, y: TOP - 9 }, ev.fg));
        if (ev.pk) {
          const py = TOP - (hasFg ? 21 : 9);
          if (ev.pk === 'd' || ev.pk === 'u') g.appendChild(svg('path', { class: 'pick', d: ev.pk === 'd' ? `M${x - 3.5},${py + 3.5} V${py - 3} H${x + 3.5} V${py + 3.5}` : `M${x - 3.5},${py - 3.5} L${x},${py + 3.5} L${x + 3.5},${py - 3.5}` }));
          else g.appendChild(svg('text', { class: 'pick-txt', x, y: py }, ev.pk));     /* 베이스 i · m, 슬랩 T · P */
        }
        const topS = Math.min(...pairs.map(p => p[0]));
        if (prev && (ev.t === 'h' || ev.t === 'p') && !prev.rest) {
          const px = prev.x; const ys = sy(topS) - 8;
          g.appendChild(svg('path', { class: 'arc', d: `M${px + 4},${ys} Q${(px + x) / 2},${ys - 10} ${x - 4},${ys}` }));
          g.appendChild(svg('text', { class: 'tech', x: (px + x) / 2, y: ys - 8 }, TECH_KO[ev.t]));
        } else if (prev && (ev.t === '/' || ev.t === '\\') && !prev.rest) {
          const px = prev.x; const y = sy(topS);
          const up = ev.t === '/';
          g.appendChild(S().path(S().line(px + 7, y + (up ? 4 : -4), x - 7, y + (up ? -4 : 4), { passes: 1, overshoot: 0.4 }), 'slide'));
        } else if (ev.t === '~') {
          const y = sy(topS) - 9;
          let d = `M${x + 7},${y}`; for (let k = 0; k < 4; k++) d += ` q3,-3 6,0 q3,3 6,0`;
          g.appendChild(svg('path', { class: 'arc', d }));
        }
        /* 리듬 스템 */
        const yb = sy(NS) + 4;
        g.appendChild(S().path(S().line(x, yb, x, yb + 12, { passes: 1, overshoot: 0.4, jitter: 0.5 }), 'stem'));
        const flags = ev.d <= 0.25 ? 2 : ev.d <= 0.5 || ev.d === 0.75 ? 1 : 0;
        for (let k = 0; k < flags; k++) g.appendChild(svg('path', { d: `M${x},${yb + 12 - k * 4} q6,-2 6,-8`, fill: 'none', stroke: 'var(--fg)', 'stroke-width': 1.2 }));
        if (ev.d === 0.75 || ev.d === 1.5 || ev.d === 3) g.appendChild(svg('circle', { cx: x + 5, cy: yb + 12, r: 1.4, fill: 'var(--fg)' }));
        if (ev.d >= 2) g.appendChild(svg('circle', { cx: x, cy: yb + 15, r: 2.5, fill: 'none', stroke: 'var(--fg)' }));
        if (isTrip(ev) && Math.abs(pos - Math.round(pos)) < 1e-3) g.appendChild(svg('text', { class: 'trip', x: x + PPB / 3, y: yb + 24 }, '3'));
      }
      el.appendChild(g);
      items.push(g);
      prev = { x, rest: ev.rest };
      pos += ev.d;
    });
    S().grain(el, W, H);
    let cur = null;
    return {
      el,
      highlight(i) {
        if (cur) cur.querySelectorAll('.fret').forEach(t => t.classList.remove('current'));
        cur = null;
        if (i == null || i < 0) return;
        cur = items[i]; if (cur) cur.querySelectorAll('.fret').forEach(t => t.classList.add('current'));
      }
    };
  }
  GH.render.tab = tab;
})();
