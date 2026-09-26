/* 기본기 연습 점검: 소리 · 악보 · 가사(계이름) · 도수 라벨이 같은 음을 가리키는지 모든 연습 × 설정으로 확인한다.
   index.html 에서 VexFlow 를 불러온 뒤 GH_AUDIT() 를 부르면 { runs, bad: [...] } 를 돌려준다 (dev 전용) */
window.GH_AUDIT = function () {
  const T = GH.technique, N = GH.notes, LS = N.LETTER_SEMIS;
  const bad = []; let runs = 0;
  const keyMidi = k => { const [nm, oct] = k.split('/'); const acc = nm.slice(1); return (parseInt(oct, 10) + 1) * 12 + LS[nm[0].toUpperCase()] + (acc.match(/#/g) || []).length - (acc.match(/b/g) || []).length; };
  const keyName = k => { const nm = k.split('/')[0]; return nm[0].toUpperCase() + nm.slice(1); };
  const at3 = x => Math.round(x * 1000);
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  /* 소리: 오디오를 가로채 각 음에서 실제로 누르는 음을 모은다 */
  const A0 = GH.audio; let rec = [];
  const stub = Object.assign(Object.create(A0), { pluck: (m, t, d, o) => rec.push({ m, gain: o && o.gain }), bass: m => rec.push({ m }), drum: () => {}, now: () => 0 });
  function sounded(ex, B, o, pass) {
    GH.audio = stub;
    try {
      const snd = T.soundFor(ex, B, o); const by = new Map();
      B.seq.forEach(ev => { rec = []; snd(ev, ev.at, ev.d, pass, 1); by.set(at3(ev.at), rec.filter(r => !(B.kind === 'vocal' && r.gain === 0.4)).map(r => r.m)); });
      return by;
    } finally { GH.audio = A0; }
  }
  function check(ex, o, label) {
    const B = T.build(ex, o); if (B.kind === 'drums') return;
    const off = B.kind === 'fretted' ? 12 : B.kind === 'vocal' && B.V.clef === 'treble8vb' ? 12 : 0;
    const trs = B.kind === 'vocal' ? Array.from(new Set(B.trs)) : [0];
    trs.forEach(tr => {
      runs++;
      const where = ex.id + ' ' + label + (tr ? ' +' + tr : '');
      const pass = B.kind === 'vocal' ? B.trs.indexOf(tr) : 0;
      const snd = sounded(ex, B, o, pass);
      if (B.kind === 'vocal') B.seq.forEach(n => { const a = snd.get(at3(n.at)); if (!n.rest && !a.includes(n.midi + tr)) a.push(n.midi + tr); });   /* 악보 = 피아노가 치는 음 + 내가 부를 음 */
      const sh = T.sheetFor(ex, B, 1000, o, tr); if (!sh) { bad.push(where + ': 악보 없음'); return; }
      /* 0) 꼬리 묶음: 음높이 음표는 한 묶음 안에서 기둥 방향이 같고, 기둥이 너무 짧지 않다 */
      (sh.beams || []).forEach((g, bi) => {
        if (!g.every(x => x.auto)) return;
        if (g.some(x => x.dir !== g[0].dir)) bad.push(where + ': 빔 ' + bi + ' 기둥 방향이 섞임');
        const short = g.filter(x => !(x.len >= 20)); if (short.length) bad.push(where + ': 빔 ' + bi + ' 기둥이 짧음 ' + short.map(x => x.len && x.len.toFixed(1)).join(','));
      });
      const wr = new Map(); sh.notes.forEach(n => { const k = at3(n.at); if (!wr.has(k)) wr.set(k, []); n.keys.forEach(x => { if (!/\/x/.test(x)) wr.get(k).push(keyMidi(x) - off); }); });
      /* 1) 소리 = 악보 (같은 시각에 같은 음들) */
      snd.forEach((ms, k) => {
        const w = (wr.get(k) || []).slice().sort((a, b) => a - b), s = ms.slice().sort((a, b) => a - b);
        const isX = B.kind === 'fretted' && B.seq.some(n => at3(n.at) === k && n.x);
        if (!isX && !same(w, s)) bad.push(where + ' @' + k / 1000 + ': 소리 ' + s.join(',') + ' ≠ 악보 ' + w.join(','));
      });
      wr.forEach((w, k) => { if (!snd.has(k)) bad.push(where + ' @' + k / 1000 + ': 악보에만 있는 음 ' + w.join(',')); });
      /* 2) 보컬 가사 = 적힌 음 */
      if (B.kind === 'vocal') {
        const L = T.vocalLabels(B, o, tr);
        B.seq.forEach((n, i) => {
          if (n.rest) return;
          const ks = (sh.notes.find(x => at3(x.at) === at3(n.at)) || { keys: [] }).keys;
          const k = ks.find(x => keyMidi(x) - off === n.midi + tr);
          if (!k) { bad.push(where + ' #' + i + ': 부를 음이 악보에 없음'); return; }
          if (N.pcOf(keyName(k)) !== N.mod(n.midi + tr, 12) || keyName(k) !== L[i].name) bad.push(where + ' #' + i + ': 철자 ' + keyName(k) + ' vs ' + L[i].name);
          if (n.own) return;
          if (o.syl === 'fixed' && L[i].syl !== N.koName(keyName(k))) bad.push(where + ' #' + i + ': 고정도 가사 ' + L[i].syl + ' ≠ ' + N.koName(keyName(k)));
          if (o.syl === 'solfa') {
            const base = { '도': 0, '레': 2, '미': 4, '파': 5, '솔': 7, '라': 9, '시': 11 }[L[i].syl.charAt(0)];
            const acc = (L[i].syl.match(/♯|#/g) || []).length - (L[i].syl.match(/♭/g) || []).length;
            if (N.mod(base + acc, 12) !== N.mod(n.midi + tr - (B.T + tr), 12)) bad.push(where + ' #' + i + ': 이동도 가사 ' + L[i].syl + ' 가 으뜸음에서 ' + N.mod(n.midi - B.T, 12) + '반음');
          }
        });
      }
      /* 3) 기타 · 베이스 도수 라벨 = 키에서의 음 */
      if (B.kind === 'fretted' && o.key) B.notes.forEach((n, i) => {
        if (!n.label || !N.INTERVALS[n.label]) return;
        /* 도수는 키 기준이거나, 진행 위 연습이면 그 코드 루트 기준 → 라벨이 가리키는 루트가 키 안의 음이어야 한다 */
        const kp = N.pcOf(o.key.replace(/m$/, '')), root = N.mod(n.midi - N.ivPc(n.label), 12);
        const inKey = GH.scales.pcs(kp, 'ionian').concat(GH.scales.pcs(kp, 'aeolian')).includes(root);
        if (!inKey) bad.push(where + ' #' + i + ': 도수 ' + n.label + ' 이 가리키는 루트 ' + N.noteName(root) + ' 가 키 밖 (' + N.midiName(n.midi) + ')');
      });
    });
  }
  GH.data.technique.forEach(ex => {
    if (ex.inst === 'drums') return;
    const rhs = T.rhOptions(ex) || [null];
    rhs.forEach(rh => check(ex, T.options(ex, rh ? { rh } : {}), rh ? 'rh ' + rh : '기본'));
    if (ex.opts.key != null) ['F', 'Bb', 'E', 'F#'].forEach(k => { const o = T.options(ex, { key: k }); if (o.key === k) check(ex, o, 'key ' + k); });
    if (ex.inst === 'vocal') {
      Object.keys(GH.data.techVoices).forEach(voice => ['C', 'G', 'F#', 'Bb', 'Eb'].forEach(start => {
        const base = T.options(ex, { voice, start });
        base.guides.forEach(guide => (ex.opts.syl != null ? ['fixed', 'solfa', 'vowel'] : [null]).forEach(syl => {
          const q = { voice, start, guide, steps: String(Math.max(ex.opts.steps || 0, 2)) }; if (syl) q.syl = syl;
          check(ex, T.options(ex, q), [voice, start, guide, syl || ''].join('/'));
        }));
      }));
    }
  });
  return { runs, bad };
};
