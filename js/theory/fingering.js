/* 운지 계산: 음 하나 / 두 음(더블스탑)을 지판에 배치하고, 이동이 가장 적은 시퀀스를 DP로 고른다.
   줄 번호: tuning 배열 인덱스 i (0 = 6번줄, 가장 낮은 줄), 지판 표기용 줄 번호 s = 6 - i.
   튜닝과 카포는 GH.state 에서 읽으므로 G–B 줄 차이나 변칙 튜닝을 따로 다루지 않아도 된다. */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};

  function defaults(opts) {
    opts = Object.assign({}, opts || {});
    const st = GH.state ? GH.state.get() : {};
    if (!opts.tuning) opts.tuning = GH.state ? GH.state.tuningMidi() : [40, 45, 50, 55, 59, 64];
    if (opts.capo == null) opts.capo = Number(st.capo) || 0;
    if (opts.maxFret == null) opts.maxFret = 15;
    if (opts.allowOpen == null) opts.allowOpen = true;
    return opts;
  }
  const playable = (f, o) => f >= o.capo && f <= o.maxFret && (o.allowOpen || f > o.capo);
  const isOpen = (f, o) => f === o.capo;

  /* ---- 음 하나 ---- */
  function noteCandidates(midi, opts) {
    const o = defaults(opts); const out = [];
    o.tuning.forEach((open, i) => { const f = midi - open; if (playable(f, o)) out.push({ s: 6 - i, i, f, midi }); });
    return out;
  }
  /* midis → [{s, f} | null]. opts.window = [lo, hi] 선호 프렛 범위 */
  function single(midis, opts) {
    const o = defaults(opts);
    const win = o.window || null;
    const winCost = f => !win || isOpen(f, o) ? 0 : f < win[0] ? (win[0] - f) * 1.4 : f > win[1] ? (f - win[1]) * 1.4 : 0;
    const move = (a, b) => {
      let c = 0.28 * Math.abs(a.i - b.i);
      if (!isOpen(a.f, o) && !isOpen(b.f, o)) { const d = Math.abs(a.f - b.f); c += d + Math.max(0, d - 3) * 2; }
      else c += 0.6;
      return c;
    };
    return dp(midis.map(m => m == null ? [] : noteCandidates(m, o)), c => winCost(c.f) + 0.03 * c.f, move, c => winCost(c.f));
  }

  /* ---- 두 음 ---- */
  /* 음정 번호(3, 6, 8 …) 와 규칙으로 허용할 줄 간격. auto: 2~5도는 인접 줄, 6~8도는 한 줄 건너, 그 이상은 1~2줄 건너 */
  function gapsFor(num, rule) {
    if (rule === 'adjacent') return [1];
    if (rule === 'skip') return [2];
    if (rule === 'any') return [1, 2, 3];
    if (num <= 5) return [1];
    if (num <= 8) return [2];
    return [2, 3];
  }
  /* lo/hi midi 를 낮은 음은 낮은 줄, 높은 음은 높은 줄에 놓는 모든 방법. 두 음 모두 눌러야 하면 프렛 차이 3 이하 */
  function pairCandidates(lo, hi, opts) {
    const o = defaults(opts); const out = [];
    const num = opts && opts.num ? opts.num : (hi - lo <= 7 ? 3 : 6);
    const collect = gaps => {
      for (let i = 0; i < o.tuning.length; i++) gaps.forEach(g => {
        const j = i + g; if (j >= o.tuning.length) return;
        const fL = lo - o.tuning[i], fH = hi - o.tuning[j];
        if (!playable(fL, o) || !playable(fH, o)) return;
        const fretted = [fL, fH].filter(f => !isOpen(f, o));
        const span = fretted.length === 2 ? Math.abs(fL - fH) : 0;
        if (span > 3) return;
        const pos = fretted.length ? fretted.reduce((a, b) => a + b, 0) / fretted.length : o.capo;
        out.push({ ns: [[6 - j, fH], [6 - i, fL]], i, j, gap: g, pos, span, midis: [lo, hi] });
      });
    };
    collect(gapsFor(num, o.gap));
    if (!out.length && o.gap !== 'any' && o.fallback !== false) { collect([1, 2, 3]); out.forEach(c => { c.fallback = true; }); }
    return out;
  }
  /* list: [[lo, hi] | null] → [후보 | null] */
  function pairs(list, opts) {
    const o = defaults(opts);
    const cands = list.map(p => p ? pairCandidates(Math.min(p[0], p[1]), Math.max(p[0], p[1]), Object.assign({}, o, { num: p[2] })) : []);
    const move = (a, b) => Math.abs(a.pos - b.pos) + 0.45 * Math.abs(a.i - b.i) + 0.15 * b.span + (b.fallback ? 1.5 : 0);
    return dp(cands, c => 0.04 * c.pos + 0.15 * c.span + (c.fallback ? 1.5 : 0), move, () => 0);
  }

  /* 후보 목록의 최단 경로. 후보가 없는 칸은 null 이며 앞뒤를 끊는다 */
  function dp(cands, startCost, move, stepCost) {
    const out = new Array(cands.length).fill(null);
    let seg = [];
    const flush = () => {
      if (!seg.length) return;
      const table = seg.map(() => []);
      seg.forEach((k, si) => cands[k].forEach((c, ci) => {
        if (si === 0) { table[0][ci] = { cost: startCost(c), prev: -1 }; return; }
        let best = Infinity, bp = -1;
        cands[seg[si - 1]].forEach((p, pi) => { const v = table[si - 1][pi].cost + move(p, c) + stepCost(c); if (v < best) { best = v; bp = pi; } });
        table[si][ci] = { cost: best, prev: bp };
      }));
      let last = table[seg.length - 1]; let bi = 0;
      last.forEach((t, ci) => { if (t.cost < last[bi].cost) bi = ci; });
      for (let si = seg.length - 1; si >= 0; si--) { out[seg[si]] = cands[seg[si]][bi]; bi = table[si][bi].prev; }
      seg = [];
    };
    cands.forEach((list, k) => { if (list.length) seg.push(k); else flush(); });
    flush();
    return out;
  }

  GH.fingering = { noteCandidates, single, gapsFor, pairCandidates, pairs };
})();
