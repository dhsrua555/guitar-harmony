/* 멜로디 → 코드 · 격자 입력: 멜로디를 리듬째 격자에 찍으면
   ① 키를 추정하고 ② 코드 진행 후보를 순위별로 추천하고 ③ 고른 진행 안에서 더할 수 있는 음과 ④ 멜로디 화음을 보여 주며 ⑤ 모두 함께 재생한다 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, select, chips } = GH.ui; const N = GH.notes; const mod = N.mod;
  const SVG = 'http://www.w3.org/2000/svg';
  const KEY = 'gh.mgrid.v1';
  const MODES = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'];
  const EXAMPLES = {
    twinkle: { ko: '반짝반짝 작은 별', bars: 4, res: 2, notes: [[0, 2, 60], [2, 2, 60], [4, 2, 67], [6, 2, 67], [8, 2, 69], [10, 2, 69], [12, 4, 67], [16, 2, 65], [18, 2, 65], [20, 2, 64], [22, 2, 64], [24, 2, 62], [26, 2, 62], [28, 4, 60]] },
    joy: { ko: '환희의 송가 (베토벤)', bars: 4, res: 2, notes: [[0, 2, 64], [2, 2, 64], [4, 2, 65], [6, 2, 67], [8, 2, 67], [10, 2, 65], [12, 2, 64], [14, 2, 62], [16, 2, 60], [18, 2, 60], [20, 2, 62], [22, 2, 64], [24, 3, 64], [27, 1, 62], [28, 4, 62]] },
    pop: { ko: '팝 발라드 풍 (예시)', bars: 4, res: 2, notes: [[0, 3, 64], [3, 1, 62], [4, 2, 64], [6, 2, 67], [8, 4, 69], [12, 2, 67], [14, 2, 64], [16, 3, 65], [19, 1, 64], [20, 2, 62], [22, 2, 60], [24, 2, 62], [26, 2, 64], [28, 4, 60]] }
  };
  const VOICE_KO = { up3: '3도 위', down3: '3도 아래', down6: '6도 아래', chord: '코드톤 아래 (코드에 맞춰)' };
  const VOICE_CLS = { up3: 'v1', down3: 'v2', down6: 'v3', chord: 'v4' };

  let st = null;
  function fresh() { return { bars: 4, res: 2, len: 2, low: 60, notes: EXAMPLES.twinkle.notes.map(([s, l, m]) => ({ s, l, m })), key: 'auto', hr: 1, sevenths: false, pick: 0, voices: { up3: true, down3: false, down6: false, chord: false }, parts: { melody: true, harmony: true, chords: true, bass: true }, comp: 'pad', tempo: 88, loop: true, metronome: false, hints: true }; }
  function load() { if (st) return st; st = fresh(); try { const raw = JSON.parse(localStorage.getItem(KEY)); if (raw && Array.isArray(raw.notes)) Object.assign(st, raw, { pick: 0 }); } catch (e) { /* ignore */ } return st; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* ignore */ } }
  const spb = () => st.res * 4;                             /* 한 마디 칸 수 */
  const total = () => st.bars * spb();
  const high = () => st.low + 24;
  const sorted = () => st.notes.slice().sort((a, b) => a.s - b.s);

  /* ---- 분석: 키 ---- */
  function guessKeys(notes) {
    const out = [];
    for (let k = 0; k < 12; k++) {
      const sc = new Set(GH.chords.MAJOR_DEG.map(d => mod(k + d, 12))); let s = 0;
      notes.forEach(n => { const w = n.l * (n.s % spb() === 0 ? 1.6 : n.s % st.res === 0 ? 1.15 : 1); s += (sc.has(mod(n.m, 12)) ? 1 : -1.3) * w; });
      if (notes.length) { const last = mod(notes[notes.length - 1].m, 12), first = mod(notes[0].m, 12); if (last === k) s += 3; else if (last === mod(k + 4, 12) || last === mod(k + 7, 12)) s += 1; if (first === k || first === mod(k + 7, 12) || first === mod(k + 4, 12)) s += 0.8; }
      out.push({ pc: k, score: s });
    }
    return out.sort((a, b) => b.score - a.score);
  }
  /* ---- 분석: 코드 진행 후보 ---- */
  const T = () => GH.melodyTheory;
  function segScores(notes, cands) {
    const L = spb() / st.hr, n = st.bars * st.hr; const segs = [];
    for (let i = 0; i < n; i++) {
      const a = i * L, b = a + L;
      const inSeg = notes.filter(x => x.s < b && x.s + x.l > a).map(x => ({ x, w: (Math.min(b, x.s + x.l) - Math.max(a, x.s)) * (x.s === a ? 1.7 : x.s >= a && (x.s - a) % (2 * st.res) === 0 ? 1.25 : 1) }));
      const W = inSeg.reduce((t, y) => t + y.w, 0);
      segs.push({ a, b, notes: inSeg.map(y => y.x), scores: cands.map(c => { const pen = (c.kind === 'borrowed' ? 0.35 : 0) + (/dim|m7b5/.test(c.qId) ? 0.3 : 0); /* 스케일 밖 · vii° 는 덜 쓰이는 코드 */ return W ? inSeg.reduce((t, y) => t + y.w * T().judgeNote(c, mod(y.x.m, 12)).w, 0) / W - pen : -pen - (c.kind === 'borrowed' ? 0.05 : 0); }) });
    }
    return segs;
  }
  const baseRoman = c => (c.roman || '').replace(/[^IViv]/g, '').toUpperCase();
  function trans(p, c) {
    let s = 0; const f = p.fn + c.fn;
    s += { TS: 0.25, SD: 0.3, DT: 0.45, TD: 0.1, DS: -0.25, ST: 0.1, TT: 0, SS: 0, DD: 0 }[f] || 0;
    if (p.symbol === c.symbol) s -= 0.35;
    const iv = mod(c.rootPc - p.rootPc, 12);
    if (iv === 5) s += 0.25; else if (iv === 2 || iv === 10) s += 0.05;
    return s;
  }
  const PATTERNS = [['I', 'V', 'VI', 'IV', 'I–V–vi–IV (팝 4코드)'], ['VI', 'IV', 'I', 'V', 'vi–IV–I–V'], ['I', 'VI', 'IV', 'V', 'I–vi–IV–V (50년대 진행)'], ['II', 'V', 'I', null, 'ii–V–I'], ['I', 'IV', 'V', 'I', 'I–IV–V–I'], ['IV', 'V', 'III', 'VI', 'IV–V–iii–vi (J-POP 진행)']];
  function progressions(notes, keyName) {
    const cands = T().candidates(keyName, st.sevenths);
    const segs = segScores(notes, cands); const n = segs.length;
    let beam = cands.map((c, i) => ({ seq: [i], score: segs[0].scores[i] * 1.2 + (baseRoman(c) === 'I' && c.fn === 'T' ? 0.5 : baseRoman(c) === 'VI' ? 0.15 : 0) }));
    for (let k = 1; k < n; k++) {
      const next = [];
      beam.forEach(b => cands.forEach((c, i) => { next.push({ seq: b.seq.concat(i), score: b.score + segs[k].scores[i] * 1.2 + trans(cands[b.seq[b.seq.length - 1]], c) }); }));
      next.sort((x, y) => y.score - x.score); beam = next.slice(0, 80);
    }
    beam.forEach(b => {
      const cs = b.seq.map(i => cands[i]); const last = cs[cs.length - 1];
      if (baseRoman(last) === 'I' && last.fn === 'T') b.score += 0.8; else if (last.fn === 'D') b.score += 0.15;
      const rs = cs.map(baseRoman); b.tags = [];
      PATTERNS.forEach(([a, bb, c, d, ko]) => { for (let i = 0; i + 2 < rs.length; i++) if (rs[i] === a && rs[i + 1] === bb && rs[i + 2] === c && (d == null || rs[i + 3] === d)) { b.score += 0.25; if (!b.tags.includes(ko)) b.tags.push(ko); } });
      if (cs.length > 1 && cs[cs.length - 2].fn === 'D' && baseRoman(last) === 'I') b.tags.unshift('마지막 V → I 완전 종지');
      else if (last.fn === 'S' && baseRoman(last) !== 'I' && cs.length > 1 && baseRoman(cs[cs.length - 1]) === 'I') b.tags.unshift('IV → I 변격 종지');
      const bor = cs.filter(c => c.kind === 'borrowed'); if (bor.length) b.tags.push('스케일 밖 코드 ' + bor.map(c => c.roman).join(' · '));
    });
    beam.sort((x, y) => y.score - x.score);
    const seen = new Set(); const out = [];
    for (const b of beam) { const key = b.seq.join(','); if (seen.has(key)) continue; seen.add(key); out.push(b); if (out.length >= 5) break; }
    return out.map(b => {
      const chords = b.seq.map(i => Object.assign({}, cands[i], { beats: 4 / st.hr }));
      /* 강박(구간 첫 칸) 음이 코드톤인 비율 · 평균 어울림 */
      let strong = 0, strongCT = 0, fit = 0;
      segs.forEach((sg, k) => { fit += sg.scores[b.seq[k]]; sg.notes.forEach(x => { if (x.s === sg.a || (x.s - sg.a) % (2 * st.res) === 0 && x.s >= sg.a) { strong++; if (chords[k].pcs.includes(mod(x.m, 12))) strongCT++; } }); });
      const pct = Math.round(Math.max(0, Math.min(1, (fit / n + 0.25) / 1.25)) * 100);
      return { chords, segs, score: b.score, pct, strongPct: strong ? Math.round(strongCT / strong * 100) : null, tags: b.tags };
    });
  }
  /* ---- 화음 (멜로디 아래 · 위) ---- */
  function harmonyVoices(notes, keyName, prog) {
    const ms = notes.map(n => n.m);
    const cfg = { up3: { mode: 'diatonic', size: '3', dir: 1 }, down3: { mode: 'diatonic', size: '3', dir: -1 }, down6: { mode: 'diatonic', size: '6', dir: -1 } };
    const out = {};
    const B = GH.harmony.build(ms, keyName, 'ionian', ['up3', 'down3', 'down6'].map(k => cfg[k]));
    ['up3', 'down3', 'down6'].forEach((k, i) => { out[k] = B.voices[i].map(v => v.midi); });
    out.chord = notes.map(n => {
      const seg = Math.floor(n.s / (spb() / st.hr)); const c = prog && prog.chords[Math.min(seg, prog.chords.length - 1)];
      if (!c) return null;
      for (let m = n.m - 3; m >= n.m - 9; m--) if (c.pcs.includes(mod(m, 12)) && mod(m, 12) !== mod(n.m, 12)) return m;
      return null;
    });
    return out;
  }
  const activeVoices = () => Object.keys(VOICE_KO).filter(k => st.voices[k]);
  /* 코드마다 더할 수 있는 음 */
  function chordRoom(c, keyName) {
    const keyPc = N.pcOf(keyName);
    const pref = GH.state.pref(keyName);
    const nm = pc => N.pretty(N.noteName(pc, pref));
    const tones = c.pcs.map(nm);
    const ten = (c.quality.tensions || []).map(t => ({ t, pc: mod(c.rootPc + N.ivSemi(t), 12) })).filter(x => !c.pcs.includes(x.pc));
    const avoid = (c.quality.avoid || []).map(t => ({ t, pc: mod(c.rootPc + N.ivSemi(t), 12) }));
    const scalePcs = GH.phrase.chordScalePcs(c, keyPc, 'major');
    const inKey = c.pcs.every(p => GH.chords.MAJOR_DEG.map(d => mod(keyPc + d, 12)).includes(p));
    const degree = GH.chords.MAJOR_DEG.findIndex(d => mod(keyPc + d, 12) === c.rootPc);
    const scaleName = inKey && degree >= 0 ? GH.scales.get(MODES[degree]).ko : ((GH.scales.forChord(c.qId)[0] || {}).scale || {}).ko || '';
    return { tones, tensions: ten.map(x => x.t + ' (' + nm(x.pc) + ')'), tensionPcs: ten.map(x => x.pc), avoid: avoid.map(x => x.t + ' (' + nm(x.pc) + ')'), scale: scalePcs.map(nm), scaleName };
  }

  /* ---- 격자 그리기 ---- */
  function svgEl(tag, attrs, text) { const e = document.createElementNS(SVG, tag); Object.keys(attrs || {}).forEach(k => { if (attrs[k] != null) e.setAttribute(k, attrs[k]); }); if (text != null) e.textContent = text; return e; }
  function gridView(keyName, prog, harm, onCommit) {
    const CW = st.res === 4 ? 20 : 28, RH = 18, LW = 46, TOP = 30;
    const rows = []; for (let m = high(); m >= st.low; m--) rows.push(m);
    const W = LW + total() * CW + 2, H = TOP + rows.length * RH + 2;
    const svg = svgEl('svg', { class: 'mgrid', viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'grid', 'aria-label': '멜로디 격자. 칸을 누르면 음이 들어가고, 음을 다시 누르면 지워집니다.' });
    const keyPcs = new Set(GH.chords.MAJOR_DEG.map(d => mod(N.pcOf(keyName) + d, 12)));
    const yOf = m => TOP + (high() - m) * RH, xOf = s => LW + s * CW;
    const pref = GH.state.pref(keyName);
    const draw = () => {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      rows.forEach(m => {
        const black = [1, 3, 6, 8, 10].includes(mod(m, 12));
        svg.appendChild(svgEl('rect', { class: 'mg-row' + (black ? ' black' : '') + (keyPcs.has(mod(m, 12)) ? ' inkey' : '') + (mod(m, 12) === N.pcOf(keyName) ? ' tonic' : ''), x: LW, y: yOf(m), width: total() * CW, height: RH }));
        const lab = svgEl('text', { class: 'mg-lab' + (mod(m, 12) === 0 ? ' c' : ''), x: LW - 6, y: yOf(m) + RH / 2 }, N.pretty(N.midiName(m, pref)));
        lab.addEventListener('click', () => { if (GH.audio.context()) GH.audio.pluck(m, GH.audio.now(), 0.8, { preset: 'piano' }); });
        svg.appendChild(lab);
      });
      /* 고른 진행: 코드톤 · 텐션 칸 힌트 */
      if (prog && st.hints) prog.chords.forEach((c, k) => {
        const a = k * spb() / st.hr, len = spb() / st.hr; const room = chordRoom(c, keyName);
        rows.forEach(m => { const pc = mod(m, 12); const cls = c.pcs.includes(pc) ? 'ct' : room.tensionPcs.includes(pc) ? 'tn' : null; if (cls) svg.appendChild(svgEl('rect', { class: 'mg-hint ' + cls, x: xOf(a), y: yOf(m) + 1, width: len * CW, height: RH - 2 })); });
      });
      for (let s = 0; s <= total(); s++) svg.appendChild(svgEl('line', { class: 'mg-v' + (s % spb() === 0 ? ' bar' : s % st.res === 0 ? ' beat' : ''), x1: xOf(s), y1: TOP, x2: xOf(s), y2: H - 2 }));
      /* 위 줄: 마디 번호 · 코드 */
      for (let b = 0; b < st.bars; b++) svg.appendChild(svgEl('text', { class: 'mg-bar', x: xOf(b * spb()) + 4, y: 11 }, b + 1));
      if (prog) prog.chords.forEach((c, k) => svg.appendChild(svgEl('text', { class: 'mg-chord', x: xOf(k * spb() / st.hr) + 4, y: 25 }, c.symbol)));
      /* 화음 */
      const ns = sorted();
      activeVoices().forEach(v => ns.forEach((n, i) => { const m = harm[v] && harm[v][i]; if (m == null || m > high() || m < st.low) return; svg.appendChild(svgEl('rect', { class: 'mg-harm ' + VOICE_CLS[v], x: xOf(n.s) + 2, y: yOf(m) + 3, width: n.l * CW - 4, height: RH - 6, rx: 4 })); }));
      /* 멜로디 */
      ns.forEach(n => {
        if (n.m > high() || n.m < st.low) return;
        const g = svgEl('g', { class: 'mg-note' });
        g.appendChild(svgEl('rect', { x: xOf(n.s) + 1, y: yOf(n.m) + 1, width: n.l * CW - 2, height: RH - 2, rx: 5 }));
        if (n.l * CW > 22) g.appendChild(svgEl('text', { x: xOf(n.s) + 5, y: yOf(n.m) + RH / 2 }, N.pretty(N.noteName(mod(n.m, 12), pref))));
        svg.appendChild(g);
      });
      svg.appendChild(play.line = svgEl('line', { class: 'mg-play', x1: -10, y1: TOP - 4, x2: -10, y2: H - 2 }));
    };
    const play = { line: null };
    draw();
    /* 입력: 빈 칸을 누르면 음, 음을 누르면 지우기. 마우스는 끌어서 길이 조절 */
    const cellAt = e => { const r = svg.getBoundingClientRect(); const sx = W / r.width, sy = H / r.height; const x = (e.clientX - r.left) * sx, y = (e.clientY - r.top) * sy; return { s: Math.floor((x - LW) / CW), m: high() - Math.floor((y - TOP) / RH), inGrid: x >= LW && y >= TOP }; };
    const trim = keep => { st.notes = st.notes.filter(o => o === keep || o.s + o.l <= keep.s || o.s >= keep.s + keep.l); };
    let drag = null, lastType = 'mouse';
    /* 마우스는 누르는 순간 · 끌기, 터치는 스크롤과 헷갈리지 않게 탭(click)으로 */
    const act = (e, mouse) => {
      const c = cellAt(e); if (!c.inGrid || c.s < 0 || c.s >= total() || c.m < st.low || c.m > high()) return;
      const hit = st.notes.find(o => o.m === c.m && c.s >= o.s && c.s < o.s + o.l);
      if (hit) { st.notes = st.notes.filter(o => o !== hit); draw(); onCommit(); return; }
      const n = { s: c.s, l: Math.min(st.len, total() - c.s), m: c.m }; st.notes.push(n); trim(n); draw();
      if (GH.audio.context()) GH.audio.pluck(c.m, GH.audio.now(), 0.5, { preset: 'piano', gain: 0.8 });
      if (mouse) { drag = n; try { svg.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } } else onCommit();
    };
    svg.addEventListener('pointerdown', e => { lastType = e.pointerType || 'mouse'; if (lastType === 'mouse' && e.button === 0) act(e, true); });
    svg.addEventListener('click', e => { if (lastType !== 'mouse') act(e, false); });
    svg.addEventListener('pointermove', e => { if (!drag) return; const c = cellAt(e); const l = Math.max(1, Math.min(total() - drag.s, c.s - drag.s + 1)); if (l !== drag.l) { drag.l = l; trim(drag); draw(); } });
    const end = () => { if (drag) { drag = null; onCommit(); } };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    return { el: h('div', { class: 'mgrid-scroll' }, svg), setPlay: s => { if (!play.line) return; const x = s == null || s < 0 ? -10 : xOf(s); play.line.setAttribute('x1', x); play.line.setAttribute('x2', x); } };
  }

  /* ---- 재생 ---- */
  function voicingOf(c) {
    const pcs = c.pcs; const out = []; let m = 52;                /* E3 위로 가까이 쌓기 */
    pcs.forEach(pc => { let x = m + mod(pc - m, 12); out.push(x); m = x + 1; });
    return out.map(x => x > 71 ? x - 12 : x).sort((a, b) => a - b);
  }
  function start(prog, harm, hooks) {
    const steps = []; const d = 1 / st.res; const ns = sorted(); const L = spb() / st.hr;
    for (let i = 0; i < total(); i++) steps.push({ d, i });
    const A = GH.audio;
    GH.player.playSeq(steps, {
      tempo: st.tempo, loop: st.loop, metronome: st.metronome, countIn: 0,
      sound: (ev, t, dur) => {
        ns.forEach((n, k) => {
          if (n.s !== ev.i) return;
          if (st.parts.melody) A.pluck(n.m, t, n.l * dur * 0.95, { preset: 'piano', gain: 0.95 });
          if (st.parts.harmony) activeVoices().forEach(v => { const m = harm[v] && harm[v][k]; if (m != null) A.pluck(m, t, n.l * dur * 0.95, { preset: 'piano', gain: 0.5 }); });
        });
        if (prog && ev.i % L === 0) {
          const c = prog.chords[ev.i / L]; if (!c) return;
          const segDur = L * dur;
          if (st.parts.chords) { const vs = voicingOf(c); if (st.comp === 'pad') vs.forEach((m, j) => A.pluck(m, t + j * 0.02, segDur * 0.98, { preset: 'piano', gain: 0.42 })); else for (let b = 0; b < 4 / st.hr; b++) vs.forEach((m, j) => A.pluck(m, t + b * st.res * dur + j * 0.015, st.res * dur * 0.8, { preset: 'piano', gain: b === 0 ? 0.46 : 0.34 })); }
          if (st.parts.bass) A.bass(28 + mod(c.rootPc - 4, 12), t, segDur * 0.95, { gain: 0.9 });
        }
      },
      onNote: (i, ev) => { hooks.onStep(i < 0 || !ev ? null : ev.i); },
      onStop: () => hooks.onStep(null)
    });
  }

  /* ---- 화면 ---- */
  function render(el) {
    load(); const A = GH.app; const rerender = () => GH.router.rerender();
    const commit = () => { save(); rerender(); };
    const ns = sorted();
    const guesses = guessKeys(ns);
    const keyPc = st.key === 'auto' ? (guesses[0] ? guesses[0].pc : 0) : N.pcOf(st.key);
    const keyName = st.key === 'auto' ? N.niceName(keyPc) : N.normalize(st.key);
    const pref = GH.state.pref(keyName);
    const progs = ns.length ? progressions(ns, keyName) : [];
    if (st.pick >= progs.length) st.pick = 0;
    const prog = progs[st.pick] || null;
    const harm = prog ? harmonyVoices(ns, keyName, prog) : {};

    /* 1. 격자 */
    const lenChips = chips({ options: [{ value: 1, label: st.res === 4 ? '16분' : '8분' }, { value: 2, label: st.res === 4 ? '8분' : '4분' }, { value: st.res === 4 ? 4 : 3, label: st.res === 4 ? '4분' : '점4분' }, { value: st.res * 2, label: '2분' }, { value: st.res * 4, label: '온음표' }], value: st.len, onChange: v => { st.len = v; save(); } });
    const grid = gridView(keyName, prog, harm, commit);
    el.appendChild(section('1. 격자에 멜로디 찍기',
      h('p', { class: 'muted' }, '칸을 누르면 음이 들어가요 (아래에서 고른 길이). 음을 다시 누르면 지워지고, 컴퓨터에서는 누른 채 오른쪽으로 끌면 길이가 늘어나요. 왼쪽 음 이름을 누르면 소리를 들을 수 있어요.'),
      h('div', { class: 'toolbar mg-tools' },
        h('div', { class: 'mg-len' }, h('span', { class: 'tech-lab' }, '찍을 음 길이'), lenChips),
        h('label', null, '마디', select({ options: [2, 4, 8].map(b => ({ value: b, label: b + '마디' })), value: st.bars, onChange: v => { st.bars = Number(v); st.notes = st.notes.filter(n => n.s < total()).map(n => Object.assign(n, { l: Math.min(n.l, total() - n.s) })); commit(); } })),
        h('label', null, '칸', select({ options: [{ value: 2, label: '8분음표 칸' }, { value: 4, label: '16분음표 칸' }], value: st.res, onChange: v => { const r = Number(v); const f = r / st.res; st.notes = st.notes.map(n => ({ s: Math.round(n.s * f), l: Math.max(1, Math.round(n.l * f)), m: n.m })); st.len = Math.max(1, Math.round(st.len * f)); st.res = r; commit(); } })),
        h('label', null, '음역', select({ options: [{ value: 48, label: 'C3 – C5 (낮게)' }, { value: 55, label: 'G3 – G5' }, { value: 60, label: 'C4 – C6 (높게)' }], value: st.low, onChange: v => { st.low = Number(v); commit(); } })),
        h('label', null, '예시', select({ options: [{ value: '', label: '불러오기…' }].concat(Object.entries(EXAMPLES).map(([k, x]) => ({ value: k, label: x.ko }))), value: '', onChange: v => { const x = EXAMPLES[v]; if (!x) return; st.bars = x.bars; st.res = x.res; st.notes = x.notes.map(([s, l, m]) => ({ s, l, m })); st.pick = 0; commit(); } })),
        h('button', { class: 'btn small', type: 'button', onclick: () => { if (!st.notes.length || confirm('격자의 음을 모두 지울까요?')) { st.notes = []; commit(); } } }, '모두 지우기')),
      grid.el,
      prog ? h('label', { class: 'tech-chk mg-hintchk' }, h('input', { type: 'checkbox', checked: st.hints, onchange: e => { st.hints = e.target.checked; commit(); } }), '고른 코드 진행의 코드톤(초록) · 텐션(파랑) 칸을 격자에 표시') : null));
    if (!ns.length) { el.appendChild(GH.ui.empty('격자에 음을 찍으면 어울리는 코드 진행을 추천해 드려요.')); return; }

    /* 2. 키 · 진행 후보 */
    const keySel = select({ options: [{ value: 'auto', label: '자동 추정 (' + N.pretty(N.niceName(guesses[0].pc)) + ' 메이저)' }].concat(N.rootList(pref).map(r => ({ value: r, label: N.pretty(r) + ' 메이저' }))), value: st.key, onChange: v => { st.key = v; st.pick = 0; commit(); } });
    const rel = N.pretty(N.noteName(mod(keyPc + 9, 12), pref)) + ' 마이너';
    const list = h('ol', { class: 'mg-progs' }, progs.map((p, i) => h('li', { class: 'mg-prog' + (i === st.pick ? ' active' : '') },
      h('button', { class: 'mg-prog-pick', type: 'button', 'aria-pressed': i === st.pick ? 'true' : 'false', onclick: () => { st.pick = i; commit(); } },
        h('span', { class: 'mg-rank' }, (i + 1) + '위'),
        h('span', { class: 'mg-prog-chords' }, p.chords.map(c => h('span', { class: 'mg-pc ' + A.fnClass(c.fn) }, h('b', null, c.symbol), h('small', null, c.roman)))),
        h('span', { class: 'mg-fit', title: '멜로디 음이 코드톤 · 텐션으로 들어가는 정도' }, '멜로디 일치 ' + p.pct + '%')),
      h('div', { class: 'mg-prog-meta' }, p.strongPct != null ? h('span', { class: 'badge' }, '강박 음 코드톤 ' + p.strongPct + '%') : null, p.tags.map(t => h('span', { class: 'badge' }, t)),
        h('button', { class: 'btn small', type: 'button', onclick: () => { st.pick = i; save(); start(p, harmonyVoices(ns, keyName, p), { onStep: s => grid.setPlay(s) }); } }, '▶ 이 진행으로 듣기')))));
    el.appendChild(section('2. 어울리는 코드 진행 추천',
      h('div', { class: 'toolbar' }, h('label', null, '키', keySel), h('span', { class: 'muted' }, '나란한조: ' + rel),
        h('label', null, '코드 바꾸기', select({ options: [{ value: 1, label: '한 마디에 하나' }, { value: 2, label: '한 마디에 둘 (2박씩)' }], value: st.hr, onChange: v => { st.hr = Number(v); st.pick = 0; commit(); } })),
        h('label', { class: 'tech-chk' }, h('input', { type: 'checkbox', checked: st.sevenths, onchange: e => { st.sevenths = e.target.checked; st.pick = 0; commit(); } }), '세븐 코드로')),
      h('p', { class: 'muted' }, '길게 끄는 음과 마디 첫 박(강박)의 음이 코드톤이 되는 코드를 먼저 고르고, 토닉 → 서브도미넌트 → 도미넌트 → 토닉 흐름과 자주 쓰는 진행 모양, 끝의 종지까지 따져 순위를 매겼어요. 그래서 멜로디 일치가 조금 낮아도 흐름이 자연스러운 진행이 위에 올 수 있어요. 진행을 누르면 아래에 자세히 나와요.'),
      list));

    /* 3. 고른 진행: 음 판정 · 더할 수 있는 음 */
    const rows = prog.chords.map((c, k) => {
      const room = chordRoom(c, keyName); const sg = prog.segs[k];
      const judged = sg.notes.map(x => { const j = GH.melodyTheory.judgeNote(c, mod(x.m, 12)); return h('span', { class: 'pill ' + j.cls, title: j.text }, N.pretty(N.noteName(mod(x.m, 12), pref)) + ' ' + j.iv); });
      return h('div', { class: 'mg-room' },
        h('div', { class: 'mg-room-head' }, h('span', { class: 'mg-bar-no' }, (st.hr === 1 ? (k + 1) + '마디' : (Math.floor(k / 2) + 1) + '마디 ' + (k % 2 ? '뒤' : '앞'))), h('a', { class: 'mg-room-chord', href: A.chordHref(c.root, c.qId) }, c.symbol), h('span', { class: A.fnClass(c.fn) }, c.roman + ' · ' + (GH.chords.FN_KO[c.fn] || ''))),
        h('div', { class: 'mg-room-line' }, h('span', { class: 'tech-lab' }, '멜로디'), judged.length ? judged : h('span', { class: 'muted' }, '(쉼)')),
        h('div', { class: 'mg-room-line' }, h('span', { class: 'tech-lab' }, '코드톤'), room.tones.map(x => h('span', { class: 'pill iv-1' }, x))),
        room.tensions.length ? h('div', { class: 'mg-room-line' }, h('span', { class: 'tech-lab' }, '텐션 (더하면 색이 짙어져요)'), room.tensions.map(x => h('span', { class: 'pill iv-t' }, x))) : null,
        room.avoid.length ? h('div', { class: 'mg-room-line' }, h('span', { class: 'tech-lab' }, '길게 쓰면 부딪히는 음'), room.avoid.map(x => h('span', { class: 'pill iv-x' }, x))) : null,
        h('div', { class: 'mg-room-line' }, h('span', { class: 'tech-lab' }, '쓸 수 있는 스케일' + (room.scaleName ? ' · ' + room.scaleName : '')), h('span', { class: 'muted' }, room.scale.join(' '))));
    });
    el.appendChild(section('3. 이 진행 안에서 쓸 수 있는 음',
      h('p', { class: 'muted' }, '코드톤은 언제 써도 안정적이고, 텐션은 색채를 더해요. 멜로디를 바꾸거나 필(fill)을 넣을 때는 스케일 음을 쓰면 돼요. 격자의 초록 · 파랑 칸이 같은 정보예요.'),
      A.chordStrip(prog.chords, { link: true }),
      h('div', { class: 'mg-rooms' }, rows)));

    /* 4. 화음 + 재생 */
    const voiceChips = chips({ multi: true, options: Object.keys(VOICE_KO).map(k => ({ value: k, label: VOICE_KO[k] })), value: activeVoices(), onChange: v => { Object.keys(VOICE_KO).forEach(k => { st.voices[k] = v.includes(k); }); commit(); } });
    const partChk = (k, label) => h('label', { class: 'tech-chk' }, h('input', { type: 'checkbox', checked: st.parts[k], onchange: e => { st.parts[k] = e.target.checked; save(); } }), label);
    const tempoIn = GH.ui.rangeNumber({ value: st.tempo, min: 40, max: 200, suffix: 'BPM', label: '템포', onInput: v => { st.tempo = v; save(); } });
    let sheetBox = null;
    if (GH.render.sheet) {
      const L = spb() / st.hr; const vs = activeVoices();
      const events = []; const d = 1 / st.res;
      ns.forEach((n, i) => { const segStart = n.s % L === 0 ? prog.chords[n.s / L] : null; events.push({ at: n.s * d, d: n.l * d, m: [n.m].concat(vs.map(v => harm[v] && harm[v][i]).filter(x => x != null)), fg: segStart ? segStart.symbol : '' }); });
      /* 쉼으로 시작하는 구간에도 코드 이름을 적는다 */
      prog.chords.forEach((c, k) => { const at = k * L * d; if (!events.some(e => Math.abs(e.at - at) < 1e-6) && !events.some(e => e.at < at && e.at + e.d > at + 1e-6)) events.push({ at, d: Math.min(L * d, ...events.filter(e => e.at > at).map(e => e.at - at).concat([L * d])), m: null, fg: c.symbol }); });
      events.sort((a, b) => a.at - b.at);
      const sh = GH.render.sheet({ kind: 'line', clef: st.low < 55 ? 'treble8vb' : 'treble', written: st.low < 55 ? 12 : 0, width: Math.min(1100, el.clientWidth || 800), pref, events, chordAbove: true });
      sheetBox = sh ? h('div', { class: 'tech-sheet' }, sh.el) : h('p', { class: 'muted' }, '악보는 VexFlow 를 불러오는 중이에요.');
    }
    el.appendChild(section('4. 화음 넣고 함께 듣기',
      h('div', { class: 'mg-voices' }, h('span', { class: 'tech-lab' }, '멜로디에 얹을 화음 (여러 개 가능)'), voiceChips),
      h('p', { class: 'muted' }, '3도 · 6도는 키의 스케일 안에서 평행하게 움직이는 화음, "코드톤 아래"는 그 박의 코드 음 가운데 멜로디 바로 아래의 음이에요. 격자에 색 테두리로 표시돼요.'),
      h('div', { class: 'toolbar' },
        A.playBtn('▶ 모두 재생', () => start(prog, harm, { onStep: s => grid.setPlay(s) }), 'primary'), A.stopBtn(),
        h('label', { class: 'tech-tempo' }, '템포', tempoIn),
        h('label', null, '반주', select({ options: [{ value: 'pad', label: '길게 (패드)' }, { value: 'beat', label: '4분음표로' }], value: st.comp, onChange: v => { st.comp = v; save(); } }))),
      h('div', { class: 'toolbar tech-play-opts' }, partChk('melody', '멜로디'), partChk('harmony', '화음'), partChk('chords', '코드'), partChk('bass', '베이스'),
        h('label', { class: 'tech-chk' }, h('input', { type: 'checkbox', checked: st.loop, onchange: e => { st.loop = e.target.checked; save(); } }), '반복'),
        h('label', { class: 'tech-chk' }, h('input', { type: 'checkbox', checked: st.metronome, onchange: e => { st.metronome = e.target.checked; save(); } }), '메트로놈')),
      sheetBox,
      h('div', { class: 'row', style: 'gap:8px;margin-top:10px' },
        h('a', { class: 'btn small', href: GH.router.href('/backing', { chords: prog.chords.map(c => c.symbol).join(' | '), key: keyName }) }, '이 진행으로 백킹 트랙 →'),
        h('a', { class: 'btn small', href: GH.router.href('/tools/harmony', { notes: ns.map(n => N.midiName(n.m, pref)).join(' '), key: keyName }) }, '화음 쌓기에서 더 보기 →'))));
  }
  GH.melodyGrid = { render, guessKeys, progressions: (notes, key) => { load(); return progressions(notes, key); }, state: () => load(), EXAMPLES };
})();
