/* 드럼 킷 그림 (손그림 선): 연주 중 치는 곳이 빛나고 스티킹(R · L)이 뜬다. 누르면 그 소리가 난다
   → { el, highlight(hits:[{k, st}]) } */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { svg } = GH.ui; const S = () => GH.sketch;
  GH.render = GH.render || {};
  /* [종류, 이름, x, y, 반지름, 심벌 여부] */
  const PADS = [
    ['crash', '크래시', 76, 52, 36, true], ['ride', '라이드', 312, 58, 40, true], ['hat', '하이햇', 48, 134, 30, true],
    ['tom1', '하이 탐', 160, 84, 24], ['tom2', '미드 탐', 224, 84, 26], ['snare', '스네어', 124, 166, 31], ['tom3', '플로어 탐', 298, 166, 34],
    ['kick', '킥 (베이스 드럼)', 208, 176, 44], ['pedal', '하이햇 페달', 48, 222, 16]
  ];
  const ALIAS = { hatopen: 'hat', rim: 'snare' };
  function drumkit(opts) {
    opts = opts || {};
    const W = 370, H = 250;
    const el = svg('svg', { class: 'drumkit', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': '드럼 킷' });
    const pads = {};
    const order = ['kick', 'crash', 'ride', 'hat', 'pedal', 'tom3', 'tom1', 'tom2', 'snare'];
    order.forEach(id => {
      const [k, name, x, y, r, cym] = PADS.find(p => p[0] === id);
      const ry = k === 'kick' ? r * 0.94 : cym ? r * 0.62 : r * 0.8;
      const g = svg('g', { class: 'kit-pad ' + (cym ? 'cym' : 'drum') + ' kit-' + k, 'data-k': k, tabindex: 0, role: 'button', 'aria-label': name + ' 소리 듣기' });
      if (k === 'pedal') {
        g.appendChild(svg('rect', { class: 'kit-fill', x: x - 16, y: y - 9, width: 32, height: 18, rx: 5 }));
        g.appendChild(S().path(S().rect(x - 16, y - 9, 32, 18, { passes: 2, bow: 0.6 }), 'kit-ink'));
      } else {
        if (!cym && k !== 'kick') g.appendChild(S().path(S().blob(x + 2, y + ry * 0.35, r, ry, { points: 14, wobble: 0.03 }), 'kit-shell'));
        g.appendChild(S().path(S().blob(x, y, r, ry, { points: 16, wobble: 0.025 }), 'kit-fill'));
        g.appendChild(S().path(S().ellipse(x + 0.6, y - 0.4, r + 0.5, ry + 0.4, { points: 16, wobble: 0.02 }), 'kit-ink'));
        if (cym) g.appendChild(S().path(S().ellipse(x, y, r * 0.18, ry * 0.18, { points: 8 }), 'kit-ink thin'));
        else g.appendChild(S().path(S().ellipse(x, y, r * 0.78, ry * 0.78, { points: 14, wobble: 0.02 }), 'kit-ink thin'));
      }
      g.appendChild(svg('text', { class: 'kit-name', x, y: k === 'pedal' ? y + 24 : y + ry + (cym ? 13 : 14) }, name));
      const hand = svg('text', { class: 'kit-hand', x, y: y + 5 }, '');
      g.appendChild(hand);
      const play = e => { if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return; if (e.type === 'keydown') e.preventDefault(); if (GH.audio && GH.audio.context()) GH.audio.drum(k, GH.audio.now() + 0.01, 0.9); flash(k); };
      g.addEventListener('click', play); g.addEventListener('keydown', play);
      el.appendChild(g); pads[k] = { g, hand };
    });
    S().grain(el, W, H);
    function flash(k) { const p = pads[k]; if (!p) return; p.g.classList.remove('hit'); void p.g.getBBox(); p.g.classList.add('hit'); }
    let cur = [];
    return {
      el,
      highlight(hits) {
        cur.forEach(p => { p.g.classList.remove('cur'); p.hand.textContent = ''; }); cur = [];
        (hits || []).forEach(h => { const p = pads[ALIAS[h.k] || h.k]; if (!p) return; p.g.classList.add('cur'); flash(ALIAS[h.k] || h.k); if (h.st) p.hand.textContent = h.st; if (h.k === 'hatopen') p.hand.textContent = (h.st || '') + ' o'; cur.push(p); });
      }
    };
  }
  GH.render.drumkit = drumkit;
})();
