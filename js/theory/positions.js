/* 스케일 포지션: CAGED, 3NPS, 펜타토닉 박스(2NPS) */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const N = GH.notes; const mod = N.mod;
  const MAXF = 19;
  const STANDARD_OFFSETS = [0, 5, 10, 15, 19, 24];

  function tuning() { return GH.state ? GH.state.tuningMidi() : [40, 45, 50, 55, 59, 64]; }
  function supportsCaged(tun) {
    tun = tun || tuning();
    return Array.isArray(tun) && tun.length === 6 && tun.every((midi, i) => midi - tun[0] === STANDARD_OFFSETS[i]);
  }

  /* 윈도우 안의 스케일 음 */
  function inWindow(rootPc, scaleId, lo, hi, tun) {
    tun = tun || tuning();
    const pcs = new Set(GH.scales.pcs(rootPc, scaleId));
    const lm = GH.scales.labelMap(rootPc, scaleId);
    const notes = [];
    for (let i = 0; i < tun.length; i++) for (let f = Math.max(0, lo); f <= hi; f++) {
      const m = tun[i] + f; const pc = mod(m, 12);
      if (pcs.has(pc)) notes.push({ s: tun.length - i, f, midi: m, pc, label: lm[pc] });
    }
    return notes;
  }
  /* n notes per string: 6번줄 f0 부터 상행 */
  function nps(rootPc, scaleId, n, f0, tun) {
    tun = tun || tuning();
    const pcs = new Set(GH.scales.pcs(rootPc, scaleId));
    const lm = GH.scales.labelMap(rootPc, scaleId);
    const seq = [];
    const NS = tun.length;                       /* 줄 수 (기타 6 · 베이스 4) */
    for (let m = tun[0] + f0; m < tun[NS - 1] + MAXF + 12 && seq.length < NS * n; m++) if (pcs.has(mod(m, 12))) seq.push(m);
    const notes = [];
    for (let i = 0; i < NS; i++) for (let k = 0; k < n; k++) {
      const m = seq[i * n + k]; if (m == null) return null;
      const f = m - tun[i]; if (f < 0 || f > MAXF + 3) return null;
      notes.push({ s: NS - i, f, midi: m, pc: mod(m, 12), label: lm[mod(m, 12)] });
    }
    return notes;
  }
  function startFrets(rootPc, scaleId, tun) {
    tun = tun || tuning();
    const pcs = GH.scales.pcs(rootPc, scaleId);
    const out = [];
    for (let f = 0; f < 12; f++) if (pcs.includes(mod(tun[0] + f, 12))) out.push(f);
    return out;
  }
  function npsPositions(rootPc, scaleId, n, tun) {
    tun = tun || tuning();
    const lm = GH.scales.labelMap(rootPc, scaleId);
    const list = [];
    startFrets(rootPc, scaleId, tun).forEach(f0 => {
      let notes = nps(rootPc, scaleId, n, f0, tun);
      if (!notes) return;
      const fr = notes.map(x => x.f);
      const startLabel = lm[mod(tun[0] + f0, 12)];
      list.push({ id: 'p' + f0, name: '포지션 (시작 ' + startLabel + ', ' + f0 + '프렛)', lo: Math.min(...fr), hi: Math.max(...fr), notes, startLabel });
    });
    /* 루트에서 시작하는 포지션을 1번으로 */
    const ri = list.findIndex(p => p.startLabel === '1');
    const ordered = ri >= 0 ? list.slice(ri).concat(list.slice(0, ri)) : list;
    ordered.forEach((p, i) => { p.name = (i + 1) + '번 포지션 (시작음 ' + p.startLabel + ', ' + p.lo + '프렛)'; });
    return ordered;
  }
  /* CAGED 5 윈도우 (7음 스케일) */
  function caged(rootPc, scaleId, tun) {
    tun = tun || tuning();
    const r6 = mod(rootPc - tun[0], 12);
    const defs = [['E폼', -1, 2], ['D폼', 2, 5], ['C폼', 4, 7], ['A폼', 6, 9], ['G폼', 9, 12]];
    const list = defs.map(([name, a, b]) => {
      let lo = r6 + a, hi = r6 + b;
      while (lo < 0) { lo += 12; hi += 12; }
      while (lo >= 12) { lo -= 12; hi -= 12; }
      const notes = inWindow(rootPc, scaleId, lo, hi, tun);
      return { id: name, name: name + ' (' + Math.max(0, lo) + '~' + hi + '프렛)', lo: Math.max(0, lo), hi, notes };
    });
    list.sort((a, b) => a.lo - b.lo);
    return list;
  }
  function systemsFor(scaleId, tun) {
    const n = GH.scales.get(scaleId).intervals.length;
    if (n === 5) return [{ id: 'boxes', label: '박스 포지션 (2음/줄)' }, { id: 'all', label: '지판 전체' }];
    if (n === 7) {
      const systems = [];
      if (supportsCaged(tun)) systems.push({ id: 'caged', label: 'CAGED 포지션' });
      systems.push({ id: '3nps', label: '3NPS(줄당 3음) 포지션' }, { id: 'all', label: '지판 전체' });
      return systems;
    }
    return [{ id: '3nps', label: '3NPS(줄당 3음) 포지션' }, { id: 'all', label: '지판 전체' }];
  }
  function positions(rootPc, scaleId, system, tun) {
    if (system === 'caged') return caged(rootPc, scaleId, tun);
    if (system === 'boxes') return npsPositions(rootPc, scaleId, 2, tun);
    if (system === '3nps') return npsPositions(rootPc, scaleId, 3, tun);
    return [];
  }
  /* 연습 패턴: 포지션 음 배열을 패턴에 따라 재배열 */
  function pattern(notes, kind) {
    const asc = notes.slice().sort((a, b) => a.midi - b.midi);
    if (kind === 'asc') return asc;
    if (kind === 'desc') return asc.slice().reverse();
    if (kind === 'ascdesc') return asc.concat(asc.slice(0, -1).reverse());
    if (kind === 'thirds') { const out = []; for (let i = 0; i + 2 < asc.length; i++) { out.push(asc[i], asc[i + 2]); } return out; }
    if (kind === 'fours') { const out = []; for (let i = 0; i + 3 < asc.length; i++) { out.push(asc[i], asc[i + 1], asc[i + 2], asc[i + 3]); } return out; }
    if (kind === 'triads') { const out = []; for (let i = 0; i + 4 < asc.length; i++) { out.push(asc[i], asc[i + 2], asc[i + 4]); } return out; }
    return asc;
  }
  GH.positions = { inWindow, nps, npsPositions, caged, systemsFor, positions, pattern, startFrets, supportsCaged };
})();
