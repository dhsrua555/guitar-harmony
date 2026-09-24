/* SVG 피아노 건반 (손그림 선) */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { svg } = GH.ui; const N = GH.notes; const mod = N.mod; const S = () => GH.sketch;
  GH.render = GH.render || {};
  const BLACK = new Set([1, 3, 6, 8, 10]);
  /* opts: {from: midi, to: midi, on: {pc: {label, cls}} 또는 onMidi: {midi:{label,cls}}, pref, onClick(midi)} */
  function piano(opts) {
    opts = opts || {};
    const from = opts.from || 48, to = opts.to || 72;
    const WW = 22, WH = 70, BW = 14, BH = 42;
    let whites = 0; for (let m = from; m <= to; m++) if (!BLACK.has(mod(m, 12))) whites++;
    const W = whites * WW + 2, H = WH + 2;
    const el = svg('svg', { class: 'piano', viewBox: `0 0 ${W} ${H}`, width: W, height: H });
    const info = m => (opts.onMidi && opts.onMidi[m]) || (opts.on && opts.on[mod(m, 12)]) || null;
    const playable = opts.playable !== false; const clickable = playable || !!opts.onClick;
    const flash = g => { g.classList.remove('hit'); void g.getBBox(); g.classList.add('hit'); setTimeout(() => g.classList.remove('hit'), 380); };
    let x = 1; const xs = {};
    for (let m = from; m <= to; m++) {
      if (BLACK.has(mod(m, 12))) continue;
      const i = info(m);
      const activate = e => { if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return; if (e.type === 'keydown') e.preventDefault(); if (playable && GH.audio) { GH.audio.pluck(m, GH.audio.now(), 1.4, { gain: 0.9 }); flash(g); } if (opts.onClick) opts.onClick(m); };
      const g = svg('g', { class: i ? (i.cls || 'iv-s') : '', onclick: clickable ? activate : null, onkeydown: opts.onClick ? activate : null, tabindex: opts.onClick ? 0 : null, role: opts.onClick ? 'button' : null, 'aria-label': opts.onClick ? N.pretty(N.midiName(m, opts.pref || 'sharp')) : null, style: clickable ? 'cursor:pointer' : '' });
      g.appendChild(svg('rect', { class: 'white' + (i ? ' on' : ''), x, y: 1, width: WW, height: WH, rx: 2 }));
      g.appendChild(S().path(S().rect(x + 0.4, 1.2, WW - 0.8, WH - 0.6, { passes: 1, bow: 0.5, overshoot: 0.8 }), 'sk-key'));
      if (i) g.appendChild(svg('text', { class: 'onkey', x: x + WW / 2, y: WH - 6 }, i.label));
      else if (mod(m, 12) === 0) g.appendChild(svg('text', { x: x + WW / 2, y: WH - 6, style: 'fill:#999' }, 'C' + (Math.floor(m / 12) - 1)));
      el.appendChild(g); xs[m] = x; x += WW;
    }
    for (let m = from; m <= to; m++) {
      if (!BLACK.has(mod(m, 12))) continue;
      const left = xs[m - 1]; if (left == null) continue;
      const bx = left + WW - BW / 2;
      const i = info(m);
      const activate = e => { if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return; if (e.type === 'keydown') e.preventDefault(); if (playable && GH.audio) { GH.audio.pluck(m, GH.audio.now(), 1.4, { gain: 0.9 }); flash(g); } if (opts.onClick) opts.onClick(m); };
      const g = svg('g', { class: i ? (i.cls || 'iv-s') : '', onclick: clickable ? activate : null, onkeydown: opts.onClick ? activate : null, tabindex: opts.onClick ? 0 : null, role: opts.onClick ? 'button' : null, 'aria-label': opts.onClick ? N.pretty(N.midiName(m, opts.pref || 'sharp')) : null, style: clickable ? 'cursor:pointer' : '' });
      g.appendChild(svg('rect', { class: 'black' + (i ? ' on' : ''), x: bx, y: 1, width: BW, height: BH, rx: 2 }));
      if (!i) g.appendChild(S().path(S().hatch(bx + 2, 3, BW - 4, BH - 6, { gap: 3.2 }), 'sk-hatch'));
      g.appendChild(S().path(S().rect(bx, 1, BW, BH, { passes: 1, bow: 0.4, overshoot: 0.6 }), 'sk-key'));
      if (i) g.appendChild(svg('text', { class: 'onblack', x: bx + BW / 2, y: BH - 6 }, i.label));
      el.appendChild(g);
    }
    S().grain(el, W, H);
    return el;
  }
  GH.render.piano = piano;
})();
