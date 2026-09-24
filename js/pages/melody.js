/* 연습 › 멜로디 → 코드 찾기 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, table, select, callout, notice } = GH.ui; const N = GH.notes; const mod = N.mod;
  const state = { notes: [60, 62, 64, 65, 67], key: 'auto', input: 'piano', text: '', sevenths: false, groupSize: 2, fromParam: null, keyParam: null };
  const FN = ['T', 'S', 'T', 'S', 'D', 'T', 'D'];

  /* 키 추정: 멜로디 음이 메이저 스케일에 얼마나 들어가는지 + 첫/끝 음 가중치 */
  function guessKeys(midis) {
    if (!midis.length) return [];
    const pcs = midis.map(m => mod(m, 12));
    const out = [];
    for (let k = 0; k < 12; k++) {
      const sc = new Set(GH.chords.MAJOR_DEG.map(d => mod(k + d, 12)));
      let s = 0; pcs.forEach(p => { s += sc.has(p) ? 1 : -1.2; });
      const last = pcs[pcs.length - 1], first = pcs[0];
      if (last === k) s += 1.5; else if (last === mod(k + 7, 12) || last === mod(k + 4, 12)) s += 0.5;
      if (first === k || first === mod(k + 7, 12) || first === mod(k + 4, 12)) s += 0.4;
      out.push({ pc: k, score: s });
    }
    out.sort((a, b) => b.score - a.score);
    return out;
  }
  /* 코드 후보에 대해 멜로디 음 판정: 코드톤 1, 텐션 0.55, 어보이드 -0.6, 스케일 밖 -0.4 */
  function judgeNote(c, pc) {
    const lm = N.labelMap(c.rootPc, c.quality.intervals); const iv = lm[pc];
    if (iv) return { w: 1, iv, cls: N.ivClass(iv), text: '코드톤' };
    const rel = N.intervalName(c.rootPc, pc); let tens = N.tensionIv(rel);
    if (rel === 'b3' && c.quality.family === 'dominant') tens = '#9';
    const avoid = c.quality.avoid.includes(rel) || c.quality.avoid.includes(N.simpleIv(rel));
    if (avoid) return { w: -0.6, iv: tens, cls: 'iv-x', text: '어보이드 노트' };
    if (c.quality.tensions.includes(tens)) return { w: 0.55, iv: tens, cls: 'iv-t', text: '텐션' };
    const semiAbove = c.pcs.some(p => mod(pc - p, 12) === 1);
    return { w: semiAbove ? -0.3 : 0.2, iv: tens, cls: semiAbove ? 'iv-x' : 'iv-t', text: semiAbove ? '단9도 마찰 가능' : '경과음' };
  }
  function candidates(keyName, sevenths) {
    const dia = GH.chords.diatonic(keyName, 'ionian', sevenths).map(d => Object.assign(d.chord, { roman: d.roman, fn: d.fn, kind: 'dia' }));
    const extra = [['bVII', 'S'], ['iv', 'S'], ['bVI', 'S'], ['bIII', 'T'], ['V7/V', 'D'], ['V7/vi', 'D'], ['V7/ii', 'D'], ['V7/IV', 'D']].map(([r, fn]) => { const c = GH.chords.romanToChord(r, keyName, 'major'); return c ? Object.assign(c, { roman: r, fn, kind: 'borrowed' }) : null; }).filter(Boolean);
    return dia.concat(extra);
  }
  function scoreChord(c, midis) {
    let s = 0; const parts = midis.map(m => { const j = judgeNote(c, mod(m, 12)); s += j.w; return j; });
    if (c.kind === 'borrowed') s -= 0.9;
    return { score: s / Math.max(1, midis.length), parts };
  }
  /* 자동 하모나이즈: 그룹마다 최고 점수 코드, 기능 흐름(T→S→D→T)과 마지막 I 선호 */
  function harmonize(midis, keyName, groupSize, sevenths) {
    const cands = candidates(keyName, sevenths).filter(c => c.kind === 'dia');
    const groups = []; for (let i = 0; i < midis.length; i += groupSize) groups.push(midis.slice(i, i + groupSize));
    const out = []; let prevFn = null;
    groups.forEach((g, gi) => {
      let best = null;
      cands.forEach(c => {
        let s = scoreChord(c, g).score;
        if (gi === groups.length - 1 && c.roman.replace(/[^IViv]/g, '') === 'I' && c.fn === 'T') s += 0.6;
        if (gi === 0 && c.fn === 'T') s += 0.25;
        if (prevFn === 'D' && c.fn === 'T') s += 0.3;
        if (prevFn === 'S' && c.fn === 'D') s += 0.2;
        if (prevFn === 'D' && c.fn === 'S') s -= 0.2;
        if (out.length && out[out.length - 1].symbol === c.symbol) s -= 0.15;
        if (best == null || s > best.s) best = { s, c };
      });
      const c = Object.assign({}, best.c, { beats: 4, notes: best.c.notes, pcs: best.c.pcs, quality: best.c.quality });
      out.push(c); prevFn = c.fn;
    });
    return { chords: out, groups };
  }
  function playMelody(midis, chords, groupSize) {
    const A = GH.audio; if (!A.context()) return;
    GH.player.stop();
    const t0 = A.now() + 0.08; const step = 0.55;
    midis.forEach((m, i) => A.pluck(m + 12, t0 + i * step, step * 1.2, { gain: 1, bus: 'melody' }));
    if (chords) {
      const playable = GH.app.toPlayable(chords);
      playable.forEach((p, gi) => { const at = t0 + gi * groupSize * step; p.midi.forEach((mm, k) => A.pluck(mm, at + k * 0.025, groupSize * step * 0.98, { gain: 0.55, bus: 'chords' })); A.bass(p.bass - 12, at, groupSize * step * 0.95, { gain: 0.8 }); });
    }
  }
  function parseText(text) {
    const out = []; const bad = []; let oct = 4;
    text.split(/[\s,]+/).filter(Boolean).forEach(tok => {
      const m = /^([A-Ga-g](?:#|b|♯|♭)?)(\d)?$/.exec(tok);
      if (!m) { bad.push(tok); return; }
      if (m[2]) oct = Number(m[2]);
      const pc = N.pcOf(m[1]); if (pc == null) { bad.push(tok); return; }
      out.push((oct + 1) * 12 + pc);
    });
    return { midis: out, bad };
  }

  GH.pages['/tools/melody'] = {
    title: '멜로디 → 코드',
    render(el, params) {
      const A = GH.app; const qy = params.query || {};
      if (qy.notes && qy.notes !== state.fromParam) { state.fromParam = qy.notes; const r = parseText(qy.notes); if (r.midis.length) state.notes = r.midis; }
      if (qy.key && qy.key !== state.keyParam) { state.keyParam = qy.key; state.key = qy.key; }
      const guesses = guessKeys(state.notes);
      const keyPc = state.key === 'auto' ? (guesses[0] ? guesses[0].pc : N.pcOf(A.key())) : N.pcOf(state.key);
      const keyName = state.key === 'auto' ? N.niceName(keyPc) : N.normalize(state.key);
      const pref = A.pref(keyName);
      el.appendChild(h('h1', null, '멜로디 → 코드 찾기'));
      el.appendChild(h('p', { class: 'muted' }, '멜로디 음을 넣으면 가능한 조성을 분석하고 함께 사용할 코드 후보를 제안합니다. 음별 후보를 비교하거나 자동으로 코드를 붙여 들어 볼 수 있습니다.'));

      /* ---- 입력 ---- */
      const rerender = () => GH.router.rerender();
      const seq = h('div', { class: 'melody-seq' });
      const redrawSeq = () => {
        GH.ui.clear(seq);
        if (!state.notes.length) seq.appendChild(h('span', { class: 'muted' }, '건반이나 지판을 눌러 멜로디를 넣으세요.'));
        state.notes.forEach((m, i) => seq.appendChild(h('button', { class: 'pill iv-s mnote', type: 'button', title: '누르면 삭제', onclick: () => { state.notes.splice(i, 1); rerender(); } }, N.pretty(N.midiName(m, pref)))));
      };
      redrawSeq();
      const add = m => { if (state.notes.length >= 32) return; state.notes.push(m); rerender(); };
      const textInput = h('input', { type: 'text', placeholder: '예: C D E F G A B C5 (옥타브 숫자는 선택)', value: state.text, style: 'flex:1 1 260px', onkeydown: e => { if (e.key === 'Enter') applyText(); } });
      const applyText = () => { const r = parseText(textInput.value); if (r.bad.length) { alert('읽을 수 없는 음: ' + r.bad.join(', ')); return; } state.notes = r.midis; state.text = ''; rerender(); };
      el.appendChild(h('div', { class: 'toolbar' },
        h('label', null, '입력', select({ options: [{ value: 'piano', label: '피아노 건반' }, { value: 'fret', label: '기타 지판' }, { value: 'text', label: '글자로 (C D E …)' }], value: state.input, onChange: v => { state.input = v; rerender(); } })),
        h('label', null, '키', select({ options: [{ value: 'auto', label: '자동 추정' }].concat(N.rootList(pref).map(r => ({ value: r, label: N.pretty(r) + ' 메이저' }))), value: state.key, onChange: v => { state.key = v; rerender(); } })),
        h('label', null, h('input', { type: 'checkbox', checked: state.sevenths, onchange: e => { state.sevenths = e.target.checked; rerender(); } }), '7화음으로'),
        A.playBtn('▶ 멜로디 듣기', () => playMelody(state.notes), 'primary'), A.stopBtn(),
        A.playBtn('마지막 음 지우기', () => { state.notes.pop(); rerender(); }), A.playBtn('전부 지우기', () => { state.notes = []; rerender(); })));
      if (state.input === 'piano') el.appendChild(h('div', { class: 'card', style: 'padding:12px' }, GH.render.piano({ from: 48, to: 79, pref, on: (() => { const on = {}; state.notes.forEach(m => { on[mod(m, 12)] = { label: N.noteName(mod(m, 12), pref), cls: 'iv-s' }; }); return on; })(), onClick: add }), h('p', { class: 'muted', style: 'margin:8px 0 0;font-size:.82rem' }, '건반을 누르면 소리가 나며 멜로디 끝에 추가됩니다.')));
      else if (state.input === 'fret') el.appendChild(h('div', null, GH.render.fretboard({ pref, to: 15, labelMode: 'name', onClick: (s, f, midi) => add(midi) }).el));
      else el.appendChild(h('div', { class: 'toolbar' }, textInput, h('button', { class: 'btn small', type: 'button', onclick: applyText }, '적용')));
      el.appendChild(h('div', { class: 'card', style: 'margin-top:10px' }, h('div', { class: 'row' }, h('b', null, '멜로디'), seq)));
      if (!state.notes.length) { el.appendChild(GH.ui.empty('멜로디를 넣으면 코드를 제안합니다.')); return; }

      /* ---- 키 ---- */
      const keyRow = h('div', { class: 'row' }, guesses.slice(0, 4).map((g, i) => h('button', { class: 'btn small' + (g.pc === keyPc ? ' active' : ''), type: 'button', onclick: () => { state.key = N.niceName(g.pc); rerender(); } }, N.pretty(N.niceName(g.pc)) + ' 메이저' + (i === 0 ? ' (분석 1위)' : ''))));
      el.appendChild(section('가능한 조성', h('p', { class: 'muted' }, '입력한 음을 많이 포함하는 장음계와 그 나란한단조의 후보입니다. 리듬, 강세와 종지를 분석하지 않으므로 실제 조성은 달라질 수 있습니다. 기준으로 사용할 장조를 선택하세요.'), keyRow));

      /* ---- 전체 코드 순위 ---- */
      const cands = candidates(keyName, state.sevenths);
      const ranked = cands.map(c => Object.assign({ c }, scoreChord(c, state.notes))).sort((a, b) => b.score - a.score);
      el.appendChild(section('멜로디 전체의 코드 후보', h('p', { class: 'muted' }, '멜로디 음이 코드톤과 텐션으로 얼마나 포함되는지 계산한 참고 순위입니다. 실제 선택에는 음의 길이, 강박, 코드 기능과 앞뒤 진행도 중요합니다. 재생 버튼으로 코드와 멜로디를 함께 비교해 보세요.'),
        table(['코드', '기능', '멜로디 음 판정', '일치도', ''], ranked.slice(0, 8).map(r => [h('a', { href: A.chordHref(r.c.root, r.c.qId), style: 'font-weight:700' }, r.c.symbol + ' '), h('span', null, h('span', { class: A.fnClass(r.c.fn) }, r.c.roman), r.c.kind === 'borrowed' ? h('span', { class: 'muted' }, ' (비다이어토닉)') : null), h('span', { class: 'note-list' }, r.parts.map((p, i) => h('span', { class: 'pill ' + p.cls, title: p.text }, N.pretty(N.midiName(state.notes[i], pref)).replace(/\d/g, '') + ' ' + p.iv))), Math.round(r.score * 100) / 100, A.playBtn('▶', () => playMelody(state.notes, [Object.assign({}, r.c, { beats: 4 })], state.notes.length))]))));

      /* ---- 자동 하모나이즈 ---- */
      const H = harmonize(state.notes, keyName, state.groupSize, state.sevenths);
      const strip = A.chordStrip(H.chords, { link: true });
      el.appendChild(section('자동 코드 붙이기 (Auto-harmonize)', h('div', { class: 'toolbar' },
        h('label', null, '코드당 멜로디 음 수', select({ options: [1, 2, 3, 4].map(n => ({ value: n, label: n + '음' })), value: state.groupSize, onChange: v => { state.groupSize = Number(v); rerender(); } })),
        A.playBtn('▶ 멜로디 + 코드', () => playMelody(state.notes, H.chords, state.groupSize), 'primary'), A.stopBtn(),
        h('a', { class: 'btn small', href: GH.router.href('/backing', { chords: H.chords.map(c => c.symbol).join(' | '), key: keyName }) }, '백킹 트랙으로 →')),
        strip,
        h('div', { class: 'melody-groups' }, H.groups.map((g, i) => h('div', { class: 'mgroup' }, h('div', { class: 'mgroup-chord ' + A.fnClass(H.chords[i].fn) }, H.chords[i].symbol), h('div', { class: 'note-list' }, g.map(m => { const j = judgeNote(H.chords[i], mod(m, 12)); return h('span', { class: 'pill ' + j.cls, title: j.text }, N.pretty(N.midiName(m, pref)).replace(/\d/g, '') + ' ' + j.iv); }))))),
        h('p', { class: 'muted' }, '규칙: 각 묶음에서 코드톤이 가장 많은 다이어토닉 코드를 고르고, 토닉 → 서브도미넌트 → 도미넌트 → 토닉 흐름과 마지막 I 코드를 선호합니다. 결과는 출발점일 뿐이니 마음에 드는 코드로 바꿔 보세요.')));

      /* ---- 음마다 ---- */
      const dia = cands.filter(c => c.kind === 'dia');
      el.appendChild(A.deep('음별 코드 후보 (직접 고르기)', h('p', { class: 'muted' }, '각 멜로디 음을 구성음이나 텐션으로 포함하는 다이어토닉 코드입니다. 버튼을 눌러 코드와 멜로디 음을 함께 비교해 보세요.'),
        table(['멜로디 음', '구성음으로 포함하는 코드', '텐션으로 사용할 수 있는 코드'], state.notes.map(m => { const pc = mod(m, 12); const has = dia.filter(c => c.pcs.includes(pc)); const tens = dia.filter(c => !c.pcs.includes(pc) && judgeNote(c, pc).w > 0.5); return [h('b', null, N.pretty(N.midiName(m, pref))), h('span', { class: 'row', style: 'gap:6px' }, has.map(c => h('button', { class: 'btn small', type: 'button', onclick: () => playMelody([m], [Object.assign({}, c, { beats: 4 })], 1) }, c.symbol, h('span', { class: 'muted', style: 'margin-left:4px' }, c.roman)))), h('span', { class: 'muted' }, tens.map(c => c.symbol).join(', ') || '–')]; }))));
      el.appendChild(callout(h('b', null, '멜로디와 코드의 관계. '), '멜로디 음이 코드톤이면 안정적으로 들릴 가능성이 높고, 9나 13 같은 텐션은 색채를 더합니다. 구조적인 코드톤과 단9도를 이루는 음은 길게 유지하거나 강박에 둘 때 보이싱을 확인하세요. 어보이드 노트도 짧은 경과음이나 어프로치 노트로 사용할 수 있습니다.'));
    }
  };
})();
