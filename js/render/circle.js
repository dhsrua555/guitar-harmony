/* 5도권 SVG */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { svg } = GH.ui; const N = GH.notes; const mod = N.mod;
  GH.render = GH.render || {};
  const MAJORS = ['C', 'G', 'D', 'A', 'E', 'B', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F'];
  const MAJORS_ALT = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'];
  const MINORS = ['Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'Ebm', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm'];
  /* opts: {key, mode: 'major'|'minor', onSelect(root, mode), pref, highlightDiatonic} */
  function circle(opts) {
    opts = opts || {};
    const S = 420, cx = S / 2, cy = S / 2, R1 = 200, R2 = 140, R3 = 84;
    const el = svg('svg', { class: 'circle', viewBox: `0 0 ${S} ${S}` });
    const keyPc = N.pcOf(opts.key || 'C');
    const mode = opts.mode || 'major';
    const tonicPc = mode === 'minor' ? mod(keyPc + 3, 12) : keyPc; /* 메이저 기준 위치 */
    const pref = opts.pref || 'sharp';
    function seg(i, rIn, rOut, cls, onClick, label) {
      const a0 = (i - 0.5) * 30 - 90, a1 = (i + 0.5) * 30 - 90;
      const p = (r, a) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
      const [x0, y0] = p(rOut, a0), [x1, y1] = p(rOut, a1), [x2, y2] = p(rIn, a1), [x3, y3] = p(rIn, a0);
      const d = `M${x0},${y0} A${rOut},${rOut} 0 0 1 ${x1},${y1} L${x2},${y2} A${rIn},${rIn} 0 0 0 ${x3},${y3} Z`;
      const activate = e => {
        if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        if (e.type === 'keydown') e.preventDefault();
        onClick();
      };
      return svg('path', { class: 'seg ' + cls, d, onclick: activate, onkeydown: activate, tabindex: 0, role: 'button', 'aria-label': label });
    }
    for (let i = 0; i < 12; i++) {
      const majPc = mod(i * 7, 12);
      const majName = pref === 'flat' || i >= 6 ? MAJORS[i] : MAJORS_ALT[i];
      const minName = MINORS[i];
      const isKey = majPc === tonicPc;
      const dia = [mod(tonicPc + 5, 12), mod(tonicPc + 7, 12)].includes(majPc);
      const outer = seg(i, R2, R1, (isKey && mode === 'major' ? 'active' : dia && opts.highlightDiatonic !== false ? 'diatonic' : ''), () => opts.onSelect && opts.onSelect(N.rootFor(majName, pref), 'major'), N.pretty(majName) + ' 메이저 선택');
      const inner = seg(i, R3, R2, (isKey && mode === 'minor' ? 'active' : (isKey || dia) && opts.highlightDiatonic !== false ? 'diatonic' : ''), () => opts.onSelect && opts.onSelect(N.rootFor(minName.replace('m', ''), pref), 'minor'), N.pretty(minName) + ' 마이너 선택');
      el.appendChild(outer); el.appendChild(inner);
      const ang = (i * 30 - 90) * Math.PI / 180;
      const rm = (R1 + R2) / 2, rn = (R2 + R3) / 2;
      el.appendChild(svg('text', { class: (isKey && mode === 'major') ? 'on' : '', x: cx + rm * Math.cos(ang), y: cy + rm * Math.sin(ang), style: 'font-size:17px' }, N.pretty(majName)));
      el.appendChild(svg('text', { class: 'minor ' + ((isKey && mode === 'minor') ? 'on' : ''), x: cx + rn * Math.cos(ang), y: cy + rn * Math.sin(ang) }, N.pretty(minName)));
      /* 조표 */
      const sig = i === 0 ? '' : i <= 6 ? '♯' + i : '♭' + (12 - i);
      el.appendChild(svg('text', { x: cx + (R1 + 14) * Math.cos(ang), y: cy + (R1 + 14) * Math.sin(ang), style: 'font-size:10px;fill:var(--fg-muted)' }, i === 6 ? '♯6/♭6' : sig));
    }
    const ks = GH.scales.keySignature(opts.key || 'C', mode === 'minor');
    el.appendChild(svg('text', { class: 'center-text', x: cx, y: cy - 10, style: 'font-size:18px;font-weight:800' }, N.pretty(opts.key || 'C') + (mode === 'minor' ? 'm' : '')));
    el.appendChild(svg('text', { class: 'center-text', x: cx, y: cy + 12, style: 'font-size:12px;fill:var(--fg-muted)' }, '조표 ' + ks.text));
    return el;
  }
  GH.render.circle = circle;
})();
