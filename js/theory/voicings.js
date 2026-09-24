/* 보이싱: 손 정의 폼 적용 + 드롭 2/3, 트라이어드, 쿼탈 자동 생성 + 보이스 리딩 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const N = GH.notes; const mod = N.mod;
  const STD = [40, 45, 50, 55, 59, 64]; /* 6번줄 → 1번줄 (폼은 스탠다드 튜닝 기준) */
  const MAX_FRET = 17;

  function inversionOf(bassIv) {
    if (!bassIv) return null;
    if (bassIv === '1') return 0;
    if (/^(b3|3|b4|4|2)$/.test(bassIv)) return 1;
    if (/^(b5|5|#5)$/.test(bassIv)) return 2;
    if (/^(bb7|b7|7|6)$/.test(bassIv)) return 3;
    return null;
  }
  const INV_KO = ['기본위치', '1전위', '2전위', '3전위'];

  /* frets 배열 → 보이싱 객체 */
  function make(rootName, qId, frets, opts) {
    const q = GH.chords.getQuality(qId); if (!q) return null;
    const rootPc = N.pcOf(rootName);
    const lm = N.labelMap(rootPc, q.intervals);
    const chordPcs = new Set(q.intervals.map(iv => mod(rootPc + N.ivSemi(iv), 12)));
    const midi = frets.map((f, i) => f == null ? null : STD[i] + f);
    const labels = midi.map(m => m == null ? null : (lm[mod(m, 12)] || N.intervalName(rootPc, mod(m, 12))));
    const played = midi.filter(m => m != null);
    if (played.length < 2) return null;
    const valid = played.every(m => chordPcs.has(mod(m, 12)));
    const sounding = frets.map((f, i) => f == null ? null : i).filter(i => i != null);
    const bassIdx = sounding[0], topIdx = sounding[sounding.length - 1];
    const fr = played.map((m, k) => frets[sounding[k]]);
    const nonzero = fr.filter(f => f > 0);
    const baseFret = nonzero.length ? Math.min(...nonzero) : 1;
    const v = Object.assign({
      root: rootName, qId, symbol: GH.chords.symbol(rootName, qId), frets, midi, labels, valid,
      bassIv: labels[bassIdx], topIv: labels[topIdx], inversion: inversionOf(labels[bassIdx]),
      baseFret, maxFret: Math.max(...fr), span: nonzero.length ? Math.max(...nonzero) - Math.min(...nonzero) : 0,
      strings: sounding.map(i => 6 - i), rootless: !played.some(m => mod(m, 12) === rootPc), fingers: null, type: 'custom', name: ''
    }, opts || {});
    v.inversionKo = v.inversion == null ? (v.rootless ? '루트리스 (Rootless)' : '') : INV_KO[v.inversion];
    v.id = qId + ':' + frets.map(f => f == null ? 'x' : f).join('-');
    return v;
  }

  /* 손 정의 폼을 루트에 맞게 이동 */
  function fromShape(shape, rootName) {
    const rootPc = N.pcOf(rootName);
    if (!shape.movable) {
      if (N.pcOf(shape.root) !== rootPc) return null;
      return make(rootName, shape.q, shape.frets.slice(), { fingers: shape.fingers, type: shape.type, name: shape.name, shape, barre: !!shape.barre });
    }
    const idx = 6 - shape.anchor.s;
    const anchorPc = mod(rootPc + N.ivSemi(shape.anchor.iv), 12);
    const openPc = STD[idx] % 12;
    const anchorFret = mod(anchorPc - openPc, 12);
    let shift = anchorFret - shape.frets[idx];
    let frets = shape.frets.map(f => f == null ? null : f + shift);
    const min = Math.min(...frets.filter(f => f != null));
    if (min < 0) frets = frets.map(f => f == null ? null : f + 12);
    const max = Math.max(...frets.filter(f => f != null));
    if (max > MAX_FRET) return null;
    return make(rootName, shape.q, frets, { fingers: shape.fingers, type: shape.type, name: shape.name, shape, barre: !!shape.barre });
  }
  function shapesFor(rootName, qId, types) {
    const out = [];
    GH.data.voicingShapes.forEach(sh => {
      if (sh.q !== qId) return;
      if (types && !types.includes(sh.type)) return;
      const v = fromShape(sh, rootName);
      if (v && v.valid) out.push(v);
      else if (v && !v.valid) console.warn('보이싱 폼 검증 실패', sh.name, sh.q, v.labels);
    });
    return out;
  }

  /* ---- 자동 생성 ---- */
  function chordSemis(qId) { return GH.chords.getQuality(qId).intervals.map(N.ivSemi).sort((a, b) => a - b); }
  /* 상대 반음 목록을 주어진 줄 세트(낮은 줄 → 높은 줄 인덱스)에 배치 */
  function placeOnStrings(bassPc, rel, stringIdx, maxSpan) {
    const out = [];
    bassPc = mod(bassPc, 12);
    for (let f0 = 0; f0 <= MAX_FRET; f0++) {
      if (mod(STD[stringIdx[0]] + f0, 12) !== bassPc) continue;
      const frets = [null, null, null, null, null, null];
      let ok = true; const m0 = STD[stringIdx[0]] + f0; frets[stringIdx[0]] = f0;
      for (let k = 1; k < rel.length; k++) {
        const m = m0 + (rel[k] - rel[0]);
        const f = m - STD[stringIdx[k]];
        if (f < 0 || f > MAX_FRET) { ok = false; break; }
        frets[stringIdx[k]] = f;
      }
      if (!ok) continue;
      const fr = frets.filter(f => f != null);
      const lo = Math.min(...fr), hi = Math.max(...fr);
      if (hi - lo > maxSpan) continue;
      out.push(frets);
    }
    return out;
  }
  function rotate(semis, inv) { return semis.slice(inv).concat(semis.slice(0, inv).map(x => x + 12)); }
  function relFrom(notes) { const s = notes.slice().sort((a, b) => a - b); const base = s[0]; return s.map(x => x - base); }

  const ADJ4 = [[0, 1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 5]];
  const SKIP4 = [[0, 2, 3, 4], [1, 3, 4, 5]];
  const ADJ3 = [[0, 1, 2], [1, 2, 3], [2, 3, 4], [3, 4, 5]];
  const SPREAD3 = [[0, 2, 3], [1, 3, 4], [2, 4, 5], [0, 1, 3], [1, 2, 4], [2, 3, 5]];
  const ALL4 = [];
  for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) for (let c = b + 1; c < 6; c++) for (let d = c + 1; d < 6; d++) ALL4.push([a, b, c, d]);

  function generate(rootName, qId, kind, opts) {
    opts = opts || {};
    const rootPc = N.pcOf(rootName);
    const semis = chordSemis(qId);
    const out = [];
    const seen = new Set();
    const push = (frets, extra) => {
      const v = make(rootName, qId, frets, extra);
      if (!v || !v.valid || seen.has(v.id)) return; seen.add(v.id);
      /* 이름은 실제 베이스 음 기준 인버전으로 (드롭 2 의 "2전위 클로즈"는 루트가 베이스에 온다) */
      v.name = ((extra && extra.kindLabel) || '') + ' ' + (v.inversion != null ? INV_KO[v.inversion] : v.inversionKo);
      out.push(v);
    };
    const sets = { drop2: ADJ4, drop3: SKIP4, drop24: ALL4, triad: ADJ3, spread: SPREAD3 }[kind] || ADJ4;
    const maxSpan = kind === 'drop24' ? 5 : kind === 'spread' ? 5 : 5;
    if (kind === 'triad' || kind === 'spread') {
      if (semis.length < 3) return out;
      const tri = semis.slice(0, 3);
      for (let inv = 0; inv < 3; inv++) {
        const close = rotate(tri, inv);
        let notes = close.slice();
        if (kind === 'spread') notes[1] -= 12;
        const rel = relFrom(notes); const bassPc = rootPc + Math.min(...notes);
        sets.forEach(set => placeOnStrings(bassPc, rel, set, maxSpan).forEach(frets => push(frets, { type: kind, kindLabel: kind === 'triad' ? '클로즈' : '스프레드', strSet: set.map(i => 6 - i).join('-'), invIndex: inv })));
      }
      return out;
    }
    if (semis.length < 4) return out;
    const four = semis.length === 4 ? semis : pickFour(qId, semis);
    for (let inv = 0; inv < 4; inv++) {
      const close = rotate(four, inv);
      let notes = close.slice();
      if (kind === 'drop2') notes[2] -= 12;
      else if (kind === 'drop3') notes[1] -= 12;
      else if (kind === 'drop24') { notes[2] -= 12; notes[0] -= 12; }
      const rel = relFrom(notes); const bassPc = rootPc + Math.min(...notes);
      sets.forEach(set => placeOnStrings(bassPc, rel, set, maxSpan).forEach(frets => push(frets, { type: kind, kindLabel: GH.data.voicingTypes[kind], strSet: set.map(i => 6 - i).join('-'), invIndex: inv })));
    }
    return out;
  }
  /* 5음 이상 코드는 4음으로 축약 (5음 생략, 그다음 루트 생략) */
  function pickFour(qId, semis) {
    const q = GH.chords.getQuality(qId);
    let ivs = q.intervals.slice();
    const drop = ['5', '1', '9', '11'];
    for (const d of drop) { if (ivs.length <= 4) break; if (ivs.includes(d)) ivs = ivs.filter(x => x !== d); }
    return ivs.slice(0, 4).map(N.ivSemi).sort((a, b) => a - b);
  }
  /* 스케일 기반 쿼탈 보이싱 (다이어토닉 4도 쌓기) */
  function quartal(rootName, scaleId, size) {
    const rootPc = N.pcOf(rootName);
    const sc = GH.scales.get(scaleId);
    const semis = sc.intervals.map(N.ivSemi);
    const lm = GH.scales.labelMap(rootPc, scaleId);
    const out = []; const seen = new Set();
    const sets = size === 4 ? ADJ4 : ADJ3;
    for (let d = 0; d < semis.length; d++) {
      const notes = [];
      for (let k = 0; k < size; k++) { const deg = d + 3 * k; notes.push(semis[deg % semis.length] + 12 * Math.floor(deg / semis.length)); }
      const rel = notes.map(x => x - notes[0]);
      const bassPc = mod(rootPc + notes[0], 12);
      sets.forEach(set => placeOnStrings(bassPc, rel, set, 4).forEach(frets => {
        const id = frets.map(f => f == null ? 'x' : f).join('-'); if (seen.has(id)) return; seen.add(id);
        const midi = frets.map((f, i) => f == null ? null : STD[i] + f);
        const labels = midi.map(m => m == null ? null : lm[mod(m, 12)]);
        const fr = midi.filter(m => m != null).map((m, k) => frets[set[k]]);
        out.push({ root: rootName, qId: null, symbol: N.pretty(rootName) + ' ' + sc.ko + ' 쿼탈', frets, midi, labels, valid: true, type: 'quartal', name: labels.filter(Boolean).join('-'), baseFret: Math.min(...fr.filter(f => f > 0).concat([Math.max(...fr)])), strSet: set.map(i => 6 - i).join('-'), id: 'q:' + id, fingers: null, inversionKo: '' });
      }));
    }
    return out;
  }

  /* 코드에 대한 모든 보이싱 (타입 필터) */
  function forChord(rootName, qId, types) {
    const all = [];
    const want = t => !types || types.includes(t);
    ['open', 'caged', 'power', 'shell', 'jazz', 'quartal'].forEach(t => { if (want(t)) all.push(...shapesFor(rootName, qId, [t])); });
    ['drop2', 'drop3', 'drop24', 'triad', 'spread'].forEach(t => { if (want(t)) all.push(...generate(rootName, qId, t)); });
    return all;
  }

  /* 보이스 리딩: 코드 목록에 대해 이동이 최소인 보이싱 시퀀스 (DP) */
  function voiceLead(chords, opts) {
    opts = opts || {};
    const kind = opts.kind || 'drop2';
    const strSet = opts.strSet || '5-4-3-2';
    const cands = chords.map(c => {
      let list = [];
      if (kind === 'shell') list = shapesFor(c.root, c.qId, ['shell']);
      else if (kind === 'caged') list = shapesFor(c.root, c.qId, ['caged', 'open']);
      else list = generate(c.root, c.qId, kind).filter(v => v.strSet === strSet);
      if (!list.length) list = generate(c.root, c.qId, 'drop2');
      if (!list.length) list = shapesFor(c.root, c.qId);
      if (!list.length) list = forChord(c.root, c.qId);
      return list.filter(v => v.maxFret <= 14);
    });
    if (cands.some(l => !l.length)) return chords.map((c, i) => cands[i][0] || null);
    const cost = (a, b) => {
      const ca = a.midi.filter(m => m != null), cb = b.midi.filter(m => m != null);
      const avgA = ca.reduce((x, y) => x + y, 0) / ca.length, avgB = cb.reduce((x, y) => x + y, 0) / cb.length;
      const topA = ca[ca.length - 1], topB = cb[cb.length - 1];
      return Math.abs(a.baseFret - b.baseFret) + Math.abs(avgA - avgB) * 0.4 + Math.abs(topA - topB) * 0.6;
    };
    const dp = cands.map(l => l.map(() => ({ c: 0, p: -1 })));
    cands[0].forEach((v, j) => { dp[0][j].c = Math.abs(v.baseFret - (opts.nearFret || 5)) * 0.3; });
    for (let i = 1; i < cands.length; i++) {
      cands[i].forEach((v, j) => {
        let best = Infinity, bp = -1;
        cands[i - 1].forEach((u, k) => { const c = dp[i - 1][k].c + cost(u, v); if (c < best) { best = c; bp = k; } });
        dp[i][j] = { c: best, p: bp };
      });
    }
    const last = dp[cands.length - 1];
    let j = 0; last.forEach((d, k) => { if (d.c < last[j].c) j = k; });
    const seq = [];
    for (let i = cands.length - 1; i >= 0; i--) { seq.unshift(cands[i][j]); j = dp[i][j].p; }
    return seq;
  }
  /* 재생용: 코드 → 대표 보이싱 */
  function representative(rootName, qId) {
    const list = shapesFor(rootName, qId, ['caged', 'open', 'jazz', 'shell']).filter(v => v.maxFret <= 12);
    if (list.length) { list.sort((a, b) => (b.strings.length - a.strings.length) || (a.baseFret - b.baseFret)); return list[0]; }
    const g = generate(rootName, qId, 'drop2').filter(v => v.strSet === '5-4-3-2' || v.strSet === '6-5-4-3');
    if (g.length) return g[0];
    const t = generate(rootName, qId, 'triad');
    return t[0] || null;
  }
  /* 프렛 → pc 클릭용: 코드 파인더 */
  function identifyFrets(frets, pref, tuning) {
    const openMidi = Array.isArray(tuning) && tuning.length === frets.length ? tuning : STD;
    const midi = frets.map((f, i) => f == null ? null : openMidi[i] + f).filter(m => m != null);
    const bassPc = midi.length ? Math.min(...midi) % 12 : null;
    return GH.chords.identifyAll(midi.map(m => m % 12), pref).map(r => Object.assign(r, { bassPc }));
  }

  GH.voicings = { STD, make, fromShape, shapesFor, generate, quartal, forChord, voiceLead, representative, identifyFrets, INV_KO };
})();
