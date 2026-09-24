/* SVG 프렛보드 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, svg } = GH.ui; const N = GH.notes; const mod = N.mod;
  GH.render = GH.render || {};

  /* opts: { tuning, from, to, lefty, pcMap{pc:{label,cls}}, notes[{s,f,label,cls,ghost,dim}], filter(s,f,pc)->'dim'|'hide'|null,
            window[lo,hi], onClick(s,f,midi), capo, labelMode('degree'|'name'), pref, showStringNames } */
  function fretboard(opts) {
    opts = opts || {};
    const st = GH.state ? GH.state.get() : {};
    const tuning = opts.tuning || (GH.state ? GH.state.tuningMidi() : [40, 45, 50, 55, 59, 64]);
    const lefty = opts.lefty != null ? opts.lefty : !!st.lefty;
    const from = opts.from || 0, to = opts.to || 22;
    const capo = opts.capo != null ? Number(opts.capo) || 0 : Number(st.capo) || 0;
    const nFrets = to - from;
    const FW = 62, LEFT = 46, RIGHT = 14, TOP = 14, SH = 24, BOTTOM = 26;
    const W = LEFT + nFrets * FW + RIGHT + (from === 0 ? 20 : 0), H = TOP + 5 * SH + BOTTOM;
    const el = svg('svg', { class: 'fretboard', viewBox: `0 0 ${W} ${H}`, width: W, height: H });
    const openX = LEFT - 8;
    const nutX = from === 0 ? LEFT + 20 : LEFT;
    const fretX = f => nutX + (f - from) * FW;           /* 프렛 선 위치 (프렛 번호 f 의 오른쪽 선) */
    const noteX = f => f === 0 ? openX : fretX(f) - FW / 2;
    const mx = x => lefty ? W - x : x;
    const sy = s => TOP + (s - 1) * SH;                     /* s=1 (높은 E) 위 */
    /* 보드 */
    const boardA = Math.min(nutX, fretX(to)), boardB = Math.max(nutX, fretX(to));
    el.appendChild(svg('rect', { class: 'board', x: Math.min(mx(boardA), mx(boardB)), y: TOP - 8, width: boardB - boardA, height: 5 * SH + 16, rx: 3 }));
    /* 인레이 */
    [3, 5, 7, 9, 12, 15, 17, 19, 21, 24].forEach(f => {
      if (f <= from || f > to) return;
      const x = mx(noteX(f)); const cy = TOP + 2.5 * SH;
      if (f % 12 === 0) { el.appendChild(svg('circle', { class: 'inlay', cx: x, cy: cy - SH, r: 5 })); el.appendChild(svg('circle', { class: 'inlay', cx: x, cy: cy + SH, r: 5 })); }
      else el.appendChild(svg('circle', { class: 'inlay', cx: x, cy, r: 5 }));
    });
    /* 프렛 */
    for (let f = from; f <= to; f++) {
      const x = mx(fretX(f));
      if (f === 0) el.appendChild(svg('line', { class: 'nut', x1: x, y1: TOP - 6, x2: x, y2: TOP + 5 * SH + 6 }));
      else el.appendChild(svg('line', { class: 'fret', x1: x, y1: TOP - 8, x2: x, y2: TOP + 5 * SH + 8 }));
      if (f > 0) el.appendChild(svg('text', { class: 'fretnum', x: mx(noteX(f)), y: H - 6 }, f));
    }
    /* 카포 */
    if (capo > from && capo <= to) {
      const capoA = fretX(capo) - 6, capoB = fretX(capo);
      el.appendChild(svg('rect', { x: Math.min(mx(capoA), mx(capoB)), y: TOP - 10, width: 6, height: 5 * SH + 20, rx: 3, fill: 'var(--accent)', opacity: .82 }));
    }
    /* 줄 */
    for (let s = 1; s <= 6; s++) {
      el.appendChild(svg('line', { class: 'string', x1: mx(nutX), y1: sy(s), x2: mx(fretX(to)), y2: sy(s), 'stroke-width': 0.9 + (s - 1) * 0.35 }));
      if (opts.showStringNames !== false) el.appendChild(svg('text', { class: 'stringname', x: lefty ? W - 12 : 12, y: sy(s), 'text-anchor': lefty ? 'start' : 'end' }, N.noteName(tuning[6 - s] % 12, opts.pref || 'sharp')));
    }
    /* 윈도우 */
    if (opts.window) {
      const [lo, hi] = opts.window; const a = Math.max(lo, from), b = Math.min(hi, to);
      if (b >= a) {
        const x1 = a === 0 ? openX - 8 : fretX(a - 1) + 2, x2 = fretX(b) - 2;
        el.appendChild(svg('rect', { class: 'window', x: mx(Math.min(x1, x2)) - (lefty ? Math.abs(x2 - x1) : 0), y: TOP - 11, width: Math.abs(x2 - x1), height: 5 * SH + 22, rx: 6 }));
      }
    }
    /* 클릭 영역: 어디를 눌러도 그 음이 울린다. onClick 이 있으면 (코드 파인더) 함께 호출 */
    const playable = opts.playable !== false;
    const flash = (s, f) => { const g = noteEls[s + ':' + f]; if (g) { g.classList.remove('hit'); void g.getBBox(); g.classList.add('hit'); setTimeout(() => g.classList.remove('hit'), 420); } else { const midi = tuning[6 - s] + f; const tmp = dot(s, f, N.noteName(midi % 12, opts.pref || 'sharp'), 'iv-1', { ghost: true }); tmp.classList.add('hit', 'temp'); setTimeout(() => { if (tmp.parentNode) tmp.parentNode.removeChild(tmp); delete noteEls[s + ':' + f]; }, 480); } };
    if (opts.onClick || playable) {
      for (let s = 1; s <= 6; s++) for (let f = from; f <= to; f++) {
        if (f < capo) continue;
        const midi = tuning[6 - s] + f;
        const activate = e => {
          if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
          if (e.type === 'keydown') e.preventDefault();
          if (playable && GH.audio) { GH.audio.pluck(midi, GH.audio.now(), 1.4, { gain: 0.9 }); flash(s, f); }
          if (opts.onClick) opts.onClick(s, f, midi);
        };
        el.appendChild(svg('rect', { class: 'fret-hit', x: mx(noteX(f)) - FW / 2 + 2, y: sy(s) - SH / 2, width: FW - 4, height: SH, fill: 'transparent', style: 'cursor:pointer', tabindex: opts.onClick ? 0 : null, role: opts.onClick ? 'button' : null, 'aria-label': opts.onClick ? s + '번 줄 ' + f + '프렛 ' + N.pretty(N.noteName(midi % 12, opts.pref || 'sharp')) : null, onclick: activate, onkeydown: opts.onClick ? activate : null }));
      }
    }
    /* 음 */
    const noteEls = {};
    const notesLayer = svg('g', { class: 'notes', style: (opts.onClick || playable) ? 'pointer-events:none' : '' });
    el.appendChild(notesLayer);
    function dot(s, f, label, cls, extra) {
      extra = extra || {};
      const g = svg('g', { class: 'note ' + (cls || 'iv-s') + (extra.dim ? ' dim' : '') + (extra.ghost ? ' ghost' : '') + (extra.clickable ? ' clickable' : ''), 'data-key': s + ':' + f });
      const x = mx(noteX(f)), y = sy(s);
      g.appendChild(svg('circle', { cx: x, cy: y, r: f === 0 ? 8 : 10 }));
      g.appendChild(svg('text', { x, y: y + 0.5 }, label == null ? '' : String(label)));
      if (extra.title) g.appendChild(svg('title', null, extra.title));
      notesLayer.appendChild(g); noteEls[s + ':' + f] = g; return g;
    }
    const labelOf = (pc, midi, iv) => {
      const mode = opts.labelMode || st.labelMode || 'degree';
      if (mode === 'name') return N.noteName(pc, opts.pref || 'sharp');
      return iv;
    };
    if (opts.pcMap) {
      for (let s = 1; s <= 6; s++) for (let f = from; f <= to; f++) {
        if (f < capo) continue;
        const midi = tuning[6 - s] + f; const pc = mod(midi, 12);
        const info = opts.pcMap[pc]; if (!info) continue;
        let state = opts.filter ? opts.filter(s, f, pc, midi) : null;
        if (state === 'hide') continue;
        dot(s, f, labelOf(pc, midi, info.label), info.cls || N.ivClass(info.label), { dim: state === 'dim', ghost: info.ghost, title: N.noteName(pc, opts.pref || 'sharp') + ' · ' + info.label });
      }
    }
    (opts.notes || []).forEach(n => {
      if (n.f < from || n.f > to || n.f < capo) return;
      const midi = tuning[6 - n.s] + n.f; const pc = mod(midi, 12);
      dot(n.s, n.f, n.label != null ? (opts.labelMode === 'name' || (!opts.labelMode && st.labelMode === 'name') ? N.noteName(pc, opts.pref || 'sharp') : n.label) : N.noteName(pc, opts.pref || 'sharp'), n.cls || 'iv-s', { dim: n.dim, ghost: n.ghost, title: N.noteName(pc, opts.pref || 'sharp') + (n.label ? ' · ' + n.label : '') });
    });
    let currentEls = [];
    const wrap = h('div', {
      class: 'fretboard-scroll ' + (nFrets > 8 ? 'wide' : 'compact'),
      style: nFrets > 8 ? '--fb-min:' + Math.round(W * 0.62) + 'px' : null,
      role: 'region',
      tabindex: nFrets > 8 ? 0 : null,
      'aria-label': nFrets > 8 ? '기타 지판. 좌우로 스크롤할 수 있습니다.' : '기타 지판'
    }, el);
    return {
      el: wrap,
      svg: el,
      highlight(s, f) {
        this.highlightMany(s == null ? [] : [[s, f]]);
      },
      highlightMany(pairs) {
        currentEls.forEach(node => node.classList.remove('current'));
        currentEls = [];
        (pairs || []).forEach(([s, f]) => {
          let g = noteEls[s + ':' + f];
          if (!g) { const midi = tuning[6 - s] + f; g = dot(s, f, N.noteName(midi % 12, opts.pref || 'sharp'), 'iv-1', {}); }
          g.classList.add('current'); currentEls.push(g);
        });
      }
    };
  }
  GH.render.fretboard = fretboard;
})();
