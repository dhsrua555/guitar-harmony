/* 연습 › 이어 트레이닝 (음감 퀴즈) */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, tabs, select } = GH.ui; const N = GH.notes;
  const rand = n => Math.floor(Math.random() * n);
  const pick = arr => arr[rand(arr.length)];

  const DEGREES = [['1', '도'], ['2', '레'], ['3', '미'], ['4', '파'], ['5', '솔'], ['6', '라'], ['7', '시']];
  const MAJOR_SEMIS = [0, 2, 4, 5, 7, 9, 11];
  const IVS_ALL = ['b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7', '8'];
  const IV_SETS = {
    scale: { ko: '스케일 음정 (장2 · 장3 · 완4 · 완5 · 장6 · 장7 · 옥타브)', list: ['2', '3', '4', '5', '6', '7', '8'] },
    small: { ko: '반음 단위 작은 음정 (단2 · 장2 · 단3 · 장3)', list: ['b2', '2', 'b3', '3'] },
    perfect: { ko: '완전 음정과 트라이톤 (완4 · 증4 · 완5 · 옥타브)', list: ['4', '#4', '5', '8'] },
    all: { ko: '반음 포함 전부 (12개)', list: IVS_ALL }
  };
  const TRIADS = ['maj', 'min', 'dim', 'aug', 'sus4'];
  const SEVENTHS = ['maj7', '7', 'm7', 'm7b5', 'dim7', 'mMaj7'];
  const MODES = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'];
  const PROGS = ['I-IV-V', 'I-V-vi-IV', 'ii-V-I', 'I-vi-IV-V', 'i-VII-VI-VII', 'andalusian', 'I-bVII-IV', 'blues12'];
  const ROOT_POOLS = { basic: { ko: 'I · IV · V (기본 3코드)', degs: [0, 3, 4] }, main: { ko: 'I · ii · IV · V · vi', degs: [0, 1, 3, 4, 5] }, all: { ko: '다이어토닉 7개 전부', degs: [0, 1, 2, 3, 4, 5, 6] } };
  const DIR_KO = { asc: '상행', desc: '하행', harm: '동시' };
  const TAB_LIST = [{ id: 'degree', label: '계이름' }, { id: 'interval', label: '음정' }, { id: 'root', label: '진행 근음' }, { id: 'chord', label: '코드 퀄리티' }, { id: 'mode', label: '모드' }, { id: 'prog', label: '코드 진행' }];

  const state = {
    tab: 'degree',
    settings: { degree: { keyMode: 'fixed', ref: 'scale', range: '1' }, interval: { dir: 'asc', set: 'scale' }, root: { len: '1', pool: 'basic', ref: 'cadence', sevenths: '0' }, chord: { set: 'triads' }, mode: {}, prog: {} },
    scores: {}, key: null, refDone: false, current: null, answered: false, lastPick: null, lastOk: false, picks: []
  };
  const score = tab => state.scores[tab] || (state.scores[tab] = { ok: 0, total: 0, streak: 0, best: 0 });
  const ivSemi = iv => iv === '8' ? 12 : N.ivSemi(iv);
  const ivLabel = iv => iv + ' ' + N.intervalKo(iv === '8' ? '1' : iv).replace('완전1도', '옥타브') + ' · ' + ivSemi(iv) + '반음';
  const pretty = (m, pref) => N.pretty(N.midiName(m, pref || 'sharp'));
  const btn = (label, fn) => h('button', { class: 'btn small', type: 'button', onclick: fn }, label);
  const prog = id => GH.data.progressions.find(p => p.id === id);
  const chordMidis = (root, qId) => GH.chords.getQuality(qId).intervals.map(iv => root + N.ivSemi(iv));
  const tonicOf = keyPc => 48 + keyPc - (keyPc >= 9 ? 12 : 0);

  /* ---- 소리: 절대 시간 시퀀서. events: [{at(초), midis, dur, gain, strum, bass}] ---- */
  function playSequence(events) {
    GH.player.stop();
    const A = GH.audio; if (!A.context()) return;
    const t0 = A.now() + 0.06;
    events.forEach(ev => {
      const strum = ev.strum == null ? 0.028 : ev.strum;
      ev.midis.forEach((m, i) => A.pluck(m, t0 + ev.at + i * strum, ev.dur, { gain: ev.gain == null ? 0.85 : ev.gain }));
      if (ev.bass != null) A.bass(ev.bass, t0 + ev.at, ev.dur, { gain: 0.9 });
    });
  }
  const noteEvents = (midis, step, dur, at) => midis.map((m, i) => ({ at: (at || 0) + i * step, midis: [m], dur: dur || step, gain: 0.95 }));
  const arpThenBlock = (midis, step) => noteEvents(midis, step, step * 2).concat([{ at: midis.length * step + 0.3, midis, dur: 2, gain: 0.9 }]);
  function cadenceEvents(keyName, at) {
    const chords = ['I', 'IV', 'V7', 'I'].map(r => GH.chords.romanToChord(r, keyName, 'major')).filter(Boolean);
    const evs = []; let t = at || 0;
    GH.app.toPlayable(chords).forEach((c, i) => { const dur = i === 3 ? 1.1 : 0.72; evs.push({ at: t, midis: c.midi, bass: c.bass - 12, dur: dur - 0.06, gain: 0.7 }); t += dur; });
    return { events: evs, end: t };
  }
  function scaleRefEvents(tonic, at) {
    const midis = MAJOR_SEMIS.concat([12]).map(s => tonic + s);
    return { events: noteEvents(midis, 0.3, 0.32, at || 0), end: (at || 0) + midis.length * 0.3 + 0.2 };
  }
  function intervalEvents(root, semi, dir) {
    if (dir === 'harm') return [{ at: 0, midis: [root, root + semi], dur: 1.8, gain: 0.9, strum: 0 }];
    const a = dir === 'desc' ? root + semi : root, b = dir === 'desc' ? root : root + semi;
    return [{ at: 0, midis: [a], dur: 0.75, gain: 0.95 }, { at: 0.7, midis: [b], dur: 1.3, gain: 0.95 }];
  }
  const scaleEvents = (root, id) => noteEvents(GH.scales.get(id).intervals.map(iv => root + N.ivSemi(iv)).concat([root + 12]), 0.34, 0.36);
  function playProg(id, key) {
    const chords = GH.app.progressionChords(prog(id), key).slice(0, 8);
    GH.player.playProgression(GH.app.toPlayable(chords), { tempo: 120, style: 'ballad' });
  }
  /* 계이름/근음 퀴즈의 기준음 이벤트 */
  function refEvents(mode, keyName, tonic) {
    const evs = []; let t = 0;
    if (mode === 'cadence' || mode === 'both' || (mode === 'newkey' && !state.refDone)) { const cad = cadenceEvents(keyName, t); evs.push(...cad.events); t = cad.end + 0.35; }
    if (mode === 'scale' || mode === 'both') { const sc = scaleRefEvents(tonic, t); evs.push(...sc.events); t = sc.end + 0.25; }
    state.refDone = true;
    return { events: evs, end: t };
  }
  const REF_OPTIONS = [{ value: 'scale', label: '스케일(도–레–미–파–솔–라–시–도)' }, { value: 'cadence', label: '케이던스(종지: I–IV–V7–I)' }, { value: 'both', label: '케이던스 + 스케일' }, { value: 'newkey', label: '키가 바뀔 때만 케이던스' }, { value: 'none', label: '기준음 없이' }];
  function ensureKey(keyMode) { if (state.key == null || keyMode === 'random') { state.key = rand(12); state.refDone = false; } }
  const keyLabel = () => N.pretty(N.niceName(state.key || 0)) + ' 메이저';

  /* ---- 퀴즈 정의 ---- */
  const QUIZZES = {
    degree: {
      title: '메이저 스케일 계이름 맞추기',
      prompt: '먼저 키의 기준이 되는 스케일 또는 케이던스를 들려준 뒤 음 하나를 연주합니다. 그 음이 몇 번째 계이름(도·레·미…)인지 고르세요.',
      make() {
        const s = state.settings.degree; ensureKey(s.keyMode);
        const tonic = tonicOf(state.key);
        const deg = rand(7); const oct = s.range === '2' ? rand(2) : 0;
        const keyName = N.niceName(state.key);
        return { answer: String(deg + 1), options: DEGREES.map(d => d[0]), label: v => v + ' ' + DEGREES[Number(v) - 1][1], midi: tonic + MAJOR_SEMIS[deg] + 12 * oct, tonic, keyName, noteName: N.spell(keyName, String(deg + 1)) };
      },
      play(c) {
        const ref = refEvents(state.settings.degree.ref, c.keyName, c.tonic);
        playSequence(ref.events.concat([{ at: ref.end + 0.2, midis: [c.midi], dur: 1.6, gain: 1 }]));
      },
      extra: c => [
        { label: '▶ 스케일만', fn: () => playSequence(scaleRefEvents(c.tonic).events) },
        { label: '▶ 케이던스만', fn: () => playSequence(cadenceEvents(c.keyName).events) },
        { label: '▶ 음만 다시', fn: () => playSequence([{ at: 0, midis: [c.midi], dur: 1.6, gain: 1 }]) }
      ],
      settings: box => [
        h('label', null, '키', select({ options: [{ value: 'fixed', label: '고정 (지금: ' + keyLabel() + ')' }, { value: 'random', label: '문제마다 바꾸기' }], value: state.settings.degree.keyMode, onChange: v => { state.settings.degree.keyMode = v; refresh(box); } })),
        btn('키 바꾸기', () => { state.key = N.mod(state.key + 1 + rand(11), 12); state.refDone = false; refresh(box); }),
        h('label', null, '기준 듣기', select({ options: REF_OPTIONS, value: state.settings.degree.ref, onChange: v => { state.settings.degree.ref = v; refresh(box); } })),
        h('label', null, '범위', select({ options: [{ value: '1', label: '한 옥타브' }, { value: '2', label: '두 옥타브' }], value: state.settings.degree.range, onChange: v => { state.settings.degree.range = v; refresh(box); } }))
      ],
      explain: c => {
        const octUp = c.midi - c.tonic >= 12 ? 12 : 0;
        return [h('span', null, '정답: ', h('b', null, c.answer + ' ' + DEGREES[Number(c.answer) - 1][1]), ' · 음이름 ' + N.pretty(c.noteName) + ' (' + N.pretty(c.keyName) + ' 메이저)'),
          btn('▶ 도에서 정답까지 스케일로', () => playSequence(noteEvents(MAJOR_SEMIS.slice(0, Number(c.answer)).map(s => c.tonic + s + octUp), 0.3, 0.32).concat([{ at: Number(c.answer) * 0.3 + 0.2, midis: [c.midi], dur: 1.2, gain: 1 }]))),
          btn('▶ 토닉 → 정답 음', () => playSequence([{ at: 0, midis: [c.tonic], dur: 0.8, gain: 0.9 }, { at: 0.85, midis: [c.midi], dur: 1.4, gain: 1 }])),
          state.lastOk ? null : btn('▶ 내가 고른 ' + DEGREES[Number(state.lastPick) - 1][1], () => playSequence([{ at: 0, midis: [c.tonic], dur: 0.8, gain: 0.9 }, { at: 0.85, midis: [c.tonic + MAJOR_SEMIS[Number(state.lastPick) - 1] + octUp], dur: 1.4, gain: 1 }]))];
      },
      tips: ['스케일을 듣고 "도"를 마음속에 붙잡은 뒤, 들린 음을 도에서부터 계단을 올라가며 찾아보세요. 도(1)와 솔(5)은 안정적이고, 시(7)는 도로, 파(4)는 미로 끌리는 느낌이 있습니다.', '익숙해지면 기준을 "케이던스"로, 그다음 "키가 바뀔 때만"으로 줄이고, 마지막에는 "기준음 없이" 연습합니다. 범위를 두 옥타브로 넓히면 옥타브가 달라도 같은 계이름임을 듣는 연습이 됩니다.'],
      links: [['#/theory/scales/ionian', '메이저 스케일 화성학 →'], ['#/theory/progressions/I-IV-V', 'I – IV – V 진행 →']]
    },
    interval: {
      title: '음정 맞히기',
      prompt: '두 음을 들려줍니다. 두 음 사이의 음정을 고르세요. 범위를 "스케일 음정"으로 두면 메이저 스케일 안의 음정만, "반음 포함 전부"로 두면 12개 모두 나옵니다.',
      make() {
        const s = state.settings.interval; const set = IV_SETS[s.set] || IV_SETS.scale;
        const iv = pick(set.list); const root = 50 + rand(12); const dir = s.dir === 'random' ? pick(['asc', 'desc', 'harm']) : s.dir;
        return { answer: iv, options: set.list, label: ivLabel, root, dir };
      },
      play(c) { playSequence(intervalEvents(c.root, ivSemi(c.answer), c.dir)); },
      settings: box => [
        h('label', null, '범위', select({ options: Object.entries(IV_SETS).map(([v, o]) => ({ value: v, label: o.ko })), value: state.settings.interval.set, onChange: v => { state.settings.interval.set = v; refresh(box); } })),
        h('label', null, '방향', select({ options: [{ value: 'asc', label: '상행 (낮은 음 → 높은 음)' }, { value: 'desc', label: '하행 (높은 음 → 낮은 음)' }, { value: 'harm', label: '동시 (화음)' }, { value: 'random', label: '무작위' }], value: state.settings.interval.dir, onChange: v => { state.settings.interval.dir = v; refresh(box); } }))],
      explain: c => {
        const semi = ivSemi(c.answer); const lo = c.root, hi = c.root + semi;
        const chroma = []; for (let k = 0; k <= semi; k++) chroma.push(lo + k);
        const inScale = MAJOR_SEMIS.concat([12]).filter(s => s <= semi).map(s => lo + s);
        return [h('span', null, '정답: ', h('b', null, ivLabel(c.answer)), ' · ' + pretty(lo) + ' → ' + pretty(hi) + ' (' + DIR_KO[c.dir] + ')'),
          btn('▶ 정답 듣기', () => playSequence(intervalEvents(c.root, semi, c.dir))),
          btn('▶ 반음으로 세기 (' + semi + ')', () => playSequence(noteEvents(chroma, 0.22, 0.24))),
          MAJOR_SEMIS.includes(semi % 12) || semi === 12 ? btn('▶ 스케일로 세기', () => playSequence(noteEvents(inScale, 0.3, 0.32))) : null,
          state.lastOk ? null : btn('▶ 내가 고른 ' + ivLabel(state.lastPick).split(' · ')[0], () => playSequence(intervalEvents(c.root, ivSemi(state.lastPick), c.dir)))];
      },
      tips: ['음정 페이지의 "기억할 곡"을 활용하세요. 완전5도는 Star Wars, 장6도는 My Bonnie, 트라이톤은 The Simpsons, 단2도는 죠스.', '헷갈리면 "반음으로 세기"로 두 음 사이를 반음씩 올라가며 개수를 세고, "스케일로 세기"로 도레미 계단을 밟아 보세요. 상행이 익숙해지면 하행과 동시(화음)로 바꿔 보세요.'],
      links: [['#/theory/intervals', '음정표 →']]
    },
    root: {
      title: '코드 진행 듣고 근음을 계이름으로',
      prompt: '키의 기준을 들려준 뒤 코드 진행을 연주합니다. 각 코드의 근음이 몇 번째 계이름인지 순서대로 고르세요. 예: C 키에서 F–G–C면 파–솔–도입니다.',
      make() {
        const s = state.settings.root; ensureKey('fixed');
        const keyName = N.niceName(state.key); const tonic = tonicOf(state.key);
        const n = Number(s.len); const pool = (ROOT_POOLS[s.pool] || ROOT_POOLS.basic).degs;
        const degs = []; for (let i = 0; i < n; i++) { let d; do { d = pick(pool); } while (i > 0 && d === degs[i - 1] && pool.length > 1); degs.push(d); }
        const dia = GH.chords.diatonic(keyName, 'ionian', s.sevenths === '1');
        const chords = degs.map(d => Object.assign(dia[d].chord, { roman: dia[d].roman, fn: dia[d].fn, beats: 4 }));
        const playable = GH.app.toPlayable(chords);
        return { answer: degs.map(d => String(d + 1)).join('-'), multi: n, options: DEGREES.map(d => d[0]), label: v => v + ' ' + DEGREES[Number(v) - 1][1], degs, chords, playable, keyName, tonic };
      },
      play(c) {
        const ref = refEvents(state.settings.root.ref, c.keyName, c.tonic);
        const evs = ref.events.slice(); let t = ref.end + 0.25;
        c.playable.forEach((p, i) => { const dur = i === c.playable.length - 1 ? 1.4 : 0.95; evs.push({ at: t, midis: p.midi, bass: p.bass - 12, dur: dur - 0.08, gain: 0.8 }); t += dur; });
        playSequence(evs);
      },
      extra: c => [
        { label: '▶ 진행만 다시', fn: () => { const evs = []; let t = 0; c.playable.forEach((p, i) => { const dur = i === c.playable.length - 1 ? 1.4 : 0.95; evs.push({ at: t, midis: p.midi, bass: p.bass - 12, dur: dur - 0.08, gain: 0.8 }); t += dur; }); playSequence(evs); } },
        { label: '▶ 스케일 (기준)', fn: () => playSequence(scaleRefEvents(c.tonic).events) }
      ],
      settings: box => [
        h('label', null, '코드 수', select({ options: [{ value: '1', label: '코드 1개' }, { value: '2', label: '2개' }, { value: '3', label: '3개' }, { value: '4', label: '4개 진행' }], value: state.settings.root.len, onChange: v => { state.settings.root.len = v; refresh(box); } })),
        h('label', null, '코드 범위', select({ options: Object.entries(ROOT_POOLS).map(([v, o]) => ({ value: v, label: o.ko })), value: state.settings.root.pool, onChange: v => { state.settings.root.pool = v; refresh(box); } })),
        h('label', null, '기준 듣기', select({ options: REF_OPTIONS, value: state.settings.root.ref, onChange: v => { state.settings.root.ref = v; refresh(box); } })),
        h('label', null, select({ options: [{ value: '0', label: '3화음' }, { value: '1', label: '7화음' }], value: state.settings.root.sevenths, onChange: v => { state.settings.root.sevenths = v; refresh(box); } })),
        h('span', { class: 'muted' }, keyLabel()), btn('키 바꾸기', () => { state.key = N.mod(state.key + 1 + rand(11), 12); state.refDone = false; refresh(box); })
      ],
      explain: c => {
        const picks = (state.lastPick || '').split('-');
        return [h('span', null, '정답: ', h('b', null, c.degs.map(d => DEGREES[d][1]).join(' – ')), ' · ', c.chords.map((ch, i) => [i ? ' – ' : '', h('a', { href: GH.app.chordHref(ch.root, ch.qId) }, ch.symbol), h('span', { class: 'muted' }, ' (' + ch.roman + ')')])),
          btn('▶ 근음만 (베이스)', () => playSequence(c.degs.map((d, i) => ({ at: i * 0.7, midis: [c.tonic + MAJOR_SEMIS[d]], dur: 0.65, gain: 1 })))),
          btn('▶ 도 → 각 근음', () => playSequence(c.degs.flatMap((d, i) => [{ at: i * 1.3, midis: [c.tonic], dur: 0.5, gain: 0.8 }, { at: i * 1.3 + 0.55, midis: [c.tonic + MAJOR_SEMIS[d]], dur: 0.7, gain: 1 }]))),
          state.lastOk ? null : btn('▶ 내가 고른 ' + picks.map(p => DEGREES[Number(p) - 1] ? DEGREES[Number(p) - 1][1] : '?').join('–'), () => playSequence(picks.map((p, i) => ({ at: i * 0.7, midis: [c.tonic + MAJOR_SEMIS[(Number(p) - 1 + 7) % 7]], dur: 0.65, gain: 1 }))))];
      },
      tips: ['코드가 바뀔 때 베이스(가장 낮은 음)를 따라가며 "도"에서 얼마나 떨어졌는지 들으세요. 도(I)는 집, 파(IV)는 밝게 떠오르는 느낌, 솔(V)은 집으로 돌아가려는 긴장입니다.', '처음엔 코드 1개, I · IV · V 로 시작하고, 맞히는 비율이 80%를 넘으면 코드 수와 범위를 늘리세요. 코드 진행 페이지의 기능(T · S · D) 색깔과 같이 보면 빨리 익숙해집니다.'],
      links: [['#/theory/chords?tab=diatonic', '다이어토닉 코드 →'], ['#/theory/progressions', '코드 진행과 기능 →']]
    },
    chord: {
      title: '코드 퀄리티 맞히기',
      prompt: '코드 하나를 들려줍니다. 어떤 코드 퀄리티인지 고르세요.',
      make() { const s = state.settings.chord.set; const pool = s === 'triads' ? TRIADS : s === 'sevenths' ? SEVENTHS : TRIADS.concat(SEVENTHS); const qId = pick(pool); const root = 48 + rand(12); return { answer: qId, options: pool, label: v => { const q = GH.chords.getQuality(v); return q.ko + ' (' + (q.sym || 'maj') + ')'; }, root, midis: chordMidis(root, qId), rootName: N.noteName(root % 12, 'sharp') }; },
      play(c) { playSequence([{ at: 0, midis: c.midis, dur: 2.2, gain: 0.9 }]); },
      extra: c => [{ label: '▶ 아르페지오로', fn: () => playSequence(arpThenBlock(c.midis, 0.45)) }],
      settings: box => [h('label', null, '범위', select({ options: [{ value: 'triads', label: '3화음 (maj · m · dim · aug · sus4)' }, { value: 'sevenths', label: '7화음 (maj7 · 7 · m7 · m7b5 · dim7 · mMaj7)' }, { value: 'all', label: '전부' }], value: state.settings.chord.set, onChange: v => { state.settings.chord.set = v; refresh(box); } }))],
      explain: c => [h('span', null, '정답: ', h('b', null, GH.chords.getQuality(c.answer).ko), ' · ' + GH.chords.symbol(c.rootName, c.answer)),
        btn('▶ 정답 듣기', () => playSequence([{ at: 0, midis: c.midis, dur: 2.2, gain: 0.9 }])),
        state.lastOk ? null : btn('▶ 내가 고른 ' + GH.chords.symbol(c.rootName, state.lastPick), () => playSequence([{ at: 0, midis: chordMidis(c.root, state.lastPick), dur: 2.2, gain: 0.9 }])),
        h('a', { class: 'btn small', href: GH.app.chordHref(c.rootName, c.answer) }, '코드 상세 →')],
      tips: ['먼저 메이저와 마이너를 구분하고, 다음으로 7음의 유무와 5도가 감5도 또는 증5도로 변형됐는지 들어 보세요.', '틀렸을 때 "내가 고른 코드"와 정답을 같은 근음에서 번갈아 들으면 차이가 분명해집니다.'],
      links: [['#/theory/chords?tab=types', '코드 퀄리티 목록 →']]
    },
    mode: {
      title: '모드 맞추기',
      prompt: '같은 으뜸음에서 스케일을 상행으로 들려줍니다. 어느 모드인지 고르세요. 3음이 장3도인지 단3도인지 먼저 듣고 특징음을 찾아보세요.',
      make() { const id = pick(MODES); const root = 48 + rand(12); return { answer: id, options: MODES, label: v => GH.scales.get(v).ko, root, rootName: N.noteName(root % 12, 'sharp') }; },
      play(c) { playSequence(scaleEvents(c.root, c.answer)); },
      explain: c => [h('span', null, '정답: ', h('b', null, GH.scales.get(c.answer).ko), ' · 특징음 ' + (GH.scales.get(c.answer).characteristic.join(', ') || '–')),
        btn('▶ 정답 듣기', () => playSequence(scaleEvents(c.root, c.answer))),
        state.lastOk ? null : btn('▶ 내가 고른 ' + GH.scales.get(state.lastPick).ko.split(' ')[0], () => playSequence(scaleEvents(c.root, state.lastPick))),
        h('a', { class: 'btn small', href: GH.app.modeHref(c.answer, c.rootName) }, '모드 페이지 →')],
      tips: ['3음이 장3도인지 단3도인지로 메이저 계열(아이오니안, 리디안, 믹솔리디안)과 마이너 계열(도리안, 에올리안, 프리지안, 로크리안)을 나눈 뒤 특징음(#4, b7, 6, b6, b2, b5)을 찾습니다.'],
      links: [['#/theory/modes?tab=parallel', '모드 평행 비교표 →']]
    },
    prog: {
      title: '코드 진행 맞추기',
      prompt: '진행의 처음 4~8개 코드를 들려줍니다. 어떤 진행인지 고르세요.',
      make() { const id = pick(PROGS); const key = N.niceName(rand(12)); return { answer: id, options: PROGS, label: v => prog(v).ko + ' (' + prog(v).en + ')', key }; },
      play(c) { playProg(c.answer, c.key); },
      explain: c => [h('span', null, '정답: ', h('b', null, prog(c.answer).ko), ' · ' + N.pretty(c.key) + ' 키'),
        btn('▶ 정답 듣기', () => playProg(c.answer, c.key)),
        state.lastOk ? null : btn('▶ 내가 고른 ' + prog(state.lastPick).ko, () => playProg(state.lastPick, c.key)),
        h('a', { class: 'btn small', href: GH.app.progHref(c.answer, c.key) }, '진행 페이지 →'), h('a', { class: 'btn small', href: GH.app.backingHref(c.answer, c.key) }, '백킹 트랙 →')],
      tips: ['첫 코드가 메이저인지 마이너인지, 그리고 몇 번째 코드에서 마이너로 떨어지는지를 들으면 절반은 맞힐 수 있습니다.'],
      links: [['#/theory/progressions', '코드 진행 목록 →']]
    }
  };

  /* ---- 진행 ---- */
  function newQuestion() {
    state.current = Object.assign(QUIZZES[state.tab].make(), { tab: state.tab });
    state.answered = false; state.lastPick = null; state.lastOk = false; state.picks = [];
  }
  function refresh(box) { newQuestion(); renderQuiz(box); }
  function finish(box, v) {
    const c = state.current; const sc = score(state.tab);
    state.answered = true; state.lastPick = v; state.lastOk = v === c.answer;
    sc.total++;
    if (state.lastOk) { sc.ok++; sc.streak++; sc.best = Math.max(sc.best, sc.streak); } else sc.streak = 0;
    renderQuiz(box);
    const nb = box.querySelector('.quiz-next'); if (nb) nb.focus({ preventScroll: true });
  }
  function answer(box, v) {
    if (state.answered) return;
    const c = state.current;
    if (c.multi && c.multi > 1) {
      state.picks.push(v);
      if (state.picks.length < c.multi) { renderQuiz(box); return; }
      finish(box, state.picks.join('-'));
    } else finish(box, v);
  }
  const keyHint = i => i < 9 ? String(i + 1) : String.fromCharCode(56 + i); /* 10번째부터 A, B, C */

  function renderQuiz(box) {
    GH.ui.clear(box);
    const Q = QUIZZES[state.tab]; const sc = score(state.tab);
    if (!state.current || state.current.tab !== state.tab) newQuestion();
    const c = state.current;
    const card = h('div', { class: 'card quiz' });
    card.appendChild(h('h2', { class: 'quiz-title' }, Q.title));
    card.appendChild(h('p', { class: 'muted', style: 'margin:0 0 10px' }, Q.prompt));
    const settingsNodes = Q.settings ? Q.settings(box) : [];
    if (settingsNodes.length) card.appendChild(h('div', { class: 'toolbar', style: 'margin:0 0 12px' }, settingsNodes));
    const playBtn = h('button', { class: 'btn primary quiz-play', type: 'button', onclick: () => Q.play(c) }, '▶ 문제 듣기');
    const nextBtn = h('button', { class: 'btn quiz-next', type: 'button', onclick: () => {
      refresh(box);
      setTimeout(() => { QUIZZES[state.tab].play(state.current); const pb = box.querySelector('.quiz-play'); if (pb) pb.focus({ preventScroll: true }); }, 60);
    } }, '다음 문제 →');
    const extras = (Q.extra ? Q.extra(c) : []).map(b => btn(b.label, b.fn));
    card.appendChild(h('div', { class: 'row', style: 'margin-bottom:10px' }, playBtn, extras, GH.app.stopBtn(), nextBtn,
      h('span', { class: 'quiz-score' }, '점수 ', h('b', null, sc.ok + ' / ' + sc.total), sc.total ? ' (' + Math.round(100 * sc.ok / sc.total) + '%)' : '', ' · 연속 ' + sc.streak + ' · 최고 ' + sc.best),
      btn('점수 초기화', () => { state.scores[state.tab] = null; renderQuiz(box); })));
    /* 순서 답 슬롯 */
    if (c.multi && c.multi > 1) {
      const answers = state.answered ? c.answer.split('-') : null; const picks = state.answered ? state.lastPick.split('-') : state.picks;
      const slots = h('div', { class: 'quiz-slots' });
      for (let i = 0; i < c.multi; i++) {
        const p = picks[i]; const cls = 'slot' + (p ? ' filled' : '') + (answers ? (p === answers[i] ? ' ok' : ' bad') : '') + (!state.answered && i === picks.length ? ' next' : '');
        slots.appendChild(h('span', { class: cls }, h('small', null, (i + 1) + '번째'), p ? DEGREES[Number(p) - 1][1] : '?', answers && p !== answers[i] ? h('small', { class: 'fix' }, '→ ' + DEGREES[Number(answers[i]) - 1][1]) : null));
      }
      if (!state.answered && picks.length) slots.appendChild(btn('← 지우기', () => { state.picks.pop(); renderQuiz(box); }));
      card.appendChild(slots);
    }
    const feedback = h('div', { class: 'quiz-feedback' + (state.answered ? (state.lastOk ? ' ok' : ' bad') : ''), 'aria-live': 'polite' });
    if (state.answered) feedback.appendChild(h('div', { class: 'row' }, h('b', { style: 'font-size:1.02rem' }, state.lastOk ? '정답!' : '아쉽다.'), Q.explain(c)));
    else feedback.appendChild(h('span', { class: 'muted' }, c.multi > 1 ? '▶ 문제 듣기를 누른 뒤 코드 순서대로 근음의 계이름을 고르세요. 키보드: 숫자 = 답, Space = 다시 듣기, Enter = 다음 문제.' : '▶ 문제 듣기를 누른 뒤 답을 고르세요. 키보드: 숫자 = 답 고르기, Space = 다시 듣기, Enter = 다음 문제.'));
    card.appendChild(feedback);
    const opts = h('div', { class: 'quiz-opts' });
    const answerSet = state.answered ? new Set(c.answer.split('-')) : null; const pickSet = state.answered ? new Set(state.lastPick.split('-')) : null;
    c.options.forEach((v, i) => {
      const cls = 'btn' + (state.answered ? (answerSet.has(v) ? ' correct' : (pickSet.has(v) ? ' wrong' : '')) : '');
      opts.appendChild(h('button', { class: cls, type: 'button', disabled: state.answered, onclick: () => answer(box, v) }, h('span', { class: 'key', 'aria-hidden': 'true' }, keyHint(i)), c.label(v)));
    });
    card.appendChild(opts);
    box.appendChild(card);
  }

  /* ---- 키보드 ---- */
  let keyHandler = null;
  function bindKeys(box) {
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
    keyHandler = e => {
      if (!document.body.contains(box)) { document.removeEventListener('keydown', keyHandler); keyHandler = null; return; }
      const ae = document.activeElement; const tag = ae ? ae.tagName : '';
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) return;
      const c = state.current; if (!c) return;
      let idx = -1;
      if (/^[1-9]$/.test(e.key)) idx = Number(e.key) - 1;
      else if (/^[a-cA-C]$/.test(e.key)) idx = 9 + e.key.toUpperCase().charCodeAt(0) - 65;
      if (idx >= 0) { if (idx < c.options.length && !state.answered) { e.preventDefault(); answer(box, c.options[idx]); } return; }
      if (e.key === 'Backspace' && c.multi > 1 && !state.answered && state.picks.length) { e.preventDefault(); state.picks.pop(); renderQuiz(box); return; }
      if (tag === 'BUTTON' || tag === 'A') return;
      if (e.key === ' ') { e.preventDefault(); QUIZZES[state.tab].play(c); }
      else if (e.key === 'Enter' && state.answered) { e.preventDefault(); const nb = box.querySelector('.quiz-next'); if (nb) nb.click(); }
    };
    document.addEventListener('keydown', keyHandler);
  }

  GH.pages['/ear'] = {
    title: '이어 트레이닝',
    render(el, params) {
      const qy = params.query || {};
      if (qy.tab && QUIZZES[qy.tab]) state.tab = qy.tab;
      el.appendChild(h('h1', null, '이어 트레이닝'));
      el.appendChild(h('p', { class: 'muted' }, '듣고 맞히는 음감 퀴즈입니다. 계이름과 진행 근음은 조성 안에서 음의 위치를 듣는 상대음감 훈련이고, 음정 · 코드 퀄리티 · 모드 · 진행은 서로 다른 소리의 성격을 구분하는 연습입니다. 틀리면 정답과 내가 고른 답을 번갈아 들어 보세요.'));
      el.appendChild(tabs(TAB_LIST, state.tab, id => GH.router.go('/ear', { tab: id })));
      const box = h('div'); el.appendChild(box);
      renderQuiz(box);
      const Q = QUIZZES[state.tab];
      el.appendChild(section('연습 팁', h('ul', { class: 'plain' }, Q.tips.map(t => h('li', null, t))), h('div', { class: 'toc' }, (Q.links || []).map(([href, label]) => h('a', { href }, label)))));
      bindKeys(box);
    }
  };
})();
