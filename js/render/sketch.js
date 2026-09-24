/* 손그림 선: 조금 휘고, 끝이 살짝 삐져나오고, 두 번 겹쳐 긋는다. 좌표로 씨앗을 정하므로 다시 그려도 같은 모양이 나온다 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { svg } = GH.ui;

  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function seedOf() { let h = 2166136261; for (let i = 0; i < arguments.length; i++) { h ^= Math.round(arguments[i] * 10) | 0; h = Math.imul(h, 16777619); } return h >>> 0; }
  const r1 = v => Math.round(v * 10) / 10;

  /* 직선 → 살짝 흔들린 곡선 (passes 번 겹쳐 그음). o: {passes, bow, jitter, overshoot, seed} */
  function line(x1, y1, x2, y2, o) {
    o = o || {};
    const rand = rng(o.seed != null ? o.seed : seedOf(x1, y1, x2, y2, 7));
    const len = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / len, uy = (y2 - y1) / len, nx = -uy, ny = ux;
    const passes = o.passes || 2, j = o.jitter == null ? 0.7 : o.jitter, over = o.overshoot == null ? 1.4 : o.overshoot;
    const amp = (o.bow == null ? 1 : o.bow) * Math.min(2.4, 0.35 + len * 0.01);
    let d = '';
    for (let p = 0; p < passes; p++) {
      const ax = x1 - ux * over * rand() + (rand() - 0.5) * j, ay = y1 - uy * over * rand() + (rand() - 0.5) * j;
      const bx = x2 + ux * over * rand() + (rand() - 0.5) * j, by = y2 + uy * over * rand() + (rand() - 0.5) * j;
      const b1 = (rand() - 0.5) * 2 * amp, b2 = (rand() - 0.5) * 2 * amp;
      const c1x = ax + (bx - ax) * 0.33 + nx * b1, c1y = ay + (by - ay) * 0.33 + ny * b1;
      const c2x = ax + (bx - ax) * 0.67 + nx * b2, c2y = ay + (by - ay) * 0.67 + ny * b2;
      d += 'M' + r1(ax) + ' ' + r1(ay) + 'C' + r1(c1x) + ' ' + r1(c1y) + ' ' + r1(c2x) + ' ' + r1(c2y) + ' ' + r1(bx) + ' ' + r1(by);
    }
    return d;
  }
  /* 점들 → 부드러운 곡선 (캣멀-롬) */
  function curve(pts, closed) {
    const n = pts.length; if (n < 2) return '';
    const P = i => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let d = 'M' + r1(pts[0][0]) + ' ' + r1(pts[0][1]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      d += 'C' + r1(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + r1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + r1(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + r1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + r1(p2[0]) + ' ' + r1(p2[1]);
    }
    return d + (closed ? 'Z' : '');
  }
  /* 손으로 그린 동그라미: 한 바퀴를 조금 넘겨 그린다 (닫히지 않은 선). o: {overshoot, wobble, points, seed} */
  function ellipse(cx, cy, rx, ry, o) {
    o = o || {};
    const rand = rng(o.seed != null ? o.seed : seedOf(cx, cy, rx, ry, 3));
    const n = o.points || Math.max(7, Math.round((rx + ry) / 3)), start = rand() * Math.PI * 2;
    const sweep = Math.PI * 2 * (1 + (o.overshoot == null ? 0.1 : o.overshoot) * (0.5 + rand()));
    const wob = o.wobble == null ? 0.08 : o.wobble, pts = [];
    for (let i = 0; i <= n; i++) {
      const a = start + sweep * i / n, k = 1 + (rand() - 0.5) * wob + (i / n) * wob * 0.6;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return curve(pts, false);
  }
  /* 채움용 닫힌 얼룩 (살짝 찌그러진 원) */
  function blob(cx, cy, rx, ry, o) {
    o = o || {};
    const rand = rng(o.seed != null ? o.seed : seedOf(cx, cy, rx, ry, 11));
    const n = o.points || 8, start = rand() * Math.PI, wob = o.wobble == null ? 0.07 : o.wobble, pts = [];
    for (let i = 0; i < n; i++) { const a = start + Math.PI * 2 * i / n, k = 1 + (rand() - 0.5) * wob * 2; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return curve(pts, true);
  }
  /* 네모: 네 변을 따로 그어 모서리가 조금씩 삐져나온다 */
  function rect(x, y, w, h, o) {
    o = o || {};
    const s = o.seed != null ? o.seed : seedOf(x, y, w, h, 5), q = Object.assign({}, o);
    return [[x, y, x + w, y], [x + w, y, x + w, y + h], [x + w, y + h, x, y + h], [x, y + h, x, y]].map((l, i) => line(l[0], l[1], l[2], l[3], Object.assign(q, { seed: s + i * 101 }))).join('');
  }
  /* 빗금 (명암): 사각형 안을 기울어진 선으로 채운다 */
  function hatch(x, y, w, h, o) {
    o = o || {};
    const gap = o.gap || 4, rand = rng(o.seed != null ? o.seed : seedOf(x, y, w, h, 9));
    let d = '';
    for (let c = -h; c < w; c += gap) {
      /* x - x0 - (y - y0) = c 인 선을 사각형으로 자른다 (45°) */
      const x0 = x + Math.max(c, 0), y0 = y + Math.max(-c, 0);
      const len = Math.min(w - Math.max(c, 0), h - Math.max(-c, 0));
      if (len <= 1) continue;
      const jx = (rand() - 0.5) * 0.8;
      d += 'M' + r1(x0 + jx) + ' ' + r1(y0) + 'L' + r1(x0 + len + jx) + ' ' + r1(y0 + len);
    }
    return d;
  }
  /* 원 안 빗금 (구의 그림자처럼 한쪽만) */
  function hatchCircle(cx, cy, r, o) {
    o = o || {};
    const gap = o.gap || 5, from = o.from == null ? 0.15 : o.from; let d = '';
    for (let c = -r; c <= r; c += gap) {
      if ((c + r) / (2 * r) < from) continue;
      const half = Math.sqrt(Math.max(0, r * r - c * c)) * 0.94; if (half < 2) continue;
      /* 기울기 -45° 방향의 현 */
      const px = cx + c * Math.SQRT1_2, py = cy + c * Math.SQRT1_2;
      d += 'M' + r1(px - half * Math.SQRT1_2) + ' ' + r1(py + half * Math.SQRT1_2) + 'L' + r1(px + half * Math.SQRT1_2) + ' ' + r1(py - half * Math.SQRT1_2);
    }
    return d;
  }
  /* 인쇄 종이 같은 알갱이 한 겹 (그림 맨 위에 곱하기로) */
  function grain(el, w, h, o) {
    o = o || {};
    const attrs = { class: 'sk-grain', fill: 'url(#gh-grain-pat)', 'pointer-events': 'none' };
    if (o.circle) el.appendChild(svg('circle', Object.assign(attrs, { cx: o.circle[0], cy: o.circle[1], r: o.circle[2] })));
    else el.appendChild(svg('rect', Object.assign(attrs, { x: o.x || 0, y: o.y || 0, width: w, height: h })));
  }
  const path = (d, cls, extra) => svg('path', Object.assign({ d, class: cls }, extra || {}));

  GH.sketch = { line, ellipse, blob, rect, hatch, hatchCircle, curve, grain, path, rng, seedOf };
})();
