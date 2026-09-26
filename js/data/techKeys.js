/* 기본기 연습 · 키보드 (피아노). 하논 1번 음형(저작권 만료)을 빼면 교재 · 입시 전통의 연습 방식을 참고해 새로 적은 연습
   gen(o) → { rh: [{m:[midi…], fg:[손가락…], d?}], lh: [...] }  d 가 없으면 리듬 설정을 따른다 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  GH.data = GH.data || {};
  const MAJOR = [0, 2, 4, 5, 7, 9, 11];
  const N = () => GH.notes;
  const pcOf = k => N().pcOf(k || 'C');
  /* 오른손 으뜸음: C4 ~ B4, 왼손은 한 옥타브 아래 */
  const rhRoot = k => 60 + pcOf(k);
  const stepMidi = (root, step) => root + MAJOR[((step % 7) + 7) % 7] + 12 * Math.floor(step / 7);
  const one = (m, f, d) => ({ m: [m], fg: [f], d });
  const chord = (ms, fs, d) => ({ m: ms, fg: fs, d });
  /* 손 고르기: 한 손만이면 다른 손은 비운다 */
  const hands = (o, rh, lh) => ({ rh: o.hands === 'lh' ? [] : rh, lh: o.hands === 'rh' ? [] : lh });

  /* 2옥타브 메이저 스케일 표준 운지 */
  const SCALE_FG = {
    rh: { C: [1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4, 5], F: [1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 4] },
    lh: { C: [5, 4, 3, 2, 1, 3, 2, 1, 4, 3, 2, 1, 3, 2, 1] }
  };
  const CATS = [
    { id: 'k-finger', inst: 'keys', ko: '손가락 · 하논', en: 'FINGERS', icon: 'piano', desc: '다섯 손가락 자리에서 시작해 하논과 반음계로 다섯 손가락의 힘과 고르기를 맞춰요.' },
    { id: 'k-scale', inst: 'keys', ko: '스케일 · 아르페지오', en: 'SCALE · ARPEGGIO', icon: 'scale', desc: '엄지 넘기기와 손가락 교차로 2옥타브를 끊김 없이. 음대 입시의 기본 과제예요.' },
    { id: 'k-chord', inst: 'keys', ko: '코드 · 케이던스', en: 'CHORDS', icon: 'chord', desc: '코드 전위, I–IV–V–I 케이던스, 재즈 ii–V–I 보이싱으로 손 모양을 가깝게 잇는 법을 익혀요.' },
    { id: 'k-indep', inst: 'keys', ko: '양손 독립', en: 'INDEPENDENCE', icon: 'harmony', desc: '왼손 반주와 오른손 선율을 따로 움직여요.' }
  ];
  const EX = [
    { id: 'k-five', cat: 'k-finger', level: 1, ko: '다섯 손가락 자리 (1-2-3-4-5)', rh: '4', tempo: [60, 120], opts: { key: 'C', hands: 'rh', keys: ['C', 'G', 'D', 'F'] },
      goal: '한 손가락이 한 건반씩 맡는 다섯 손가락 자리. 도-레-미-파-솔을 올라갔다 내려와요.',
      how: ['손가락 번호: 1 엄지 · 2 검지 · 3 중지 · 4 약지 · 5 새끼.', '손 모양은 달걀을 쥔 듯 둥글게, 손가락 끝으로 건반을 눌러요.', '오른손이 익숙해지면 왼손, 그다음 양손으로.'],
      tips: ['손목은 건반과 같은 높이로, 위아래로 흔들리지 않게.', '4번 손가락이 누를 때 5번이 따라 들리지 않는지 보세요.'],
      gen: o => { const r = rhRoot(o.key), l = r - 12; const deg = [0, 1, 2, 3, 4, 3, 2, 1]; return hands(o, deg.map((s, i) => one(stepMidi(r, s), [1, 2, 3, 4, 5, 4, 3, 2][i])), deg.map((s, i) => one(stepMidi(l, s), [5, 4, 3, 2, 1, 2, 3, 4][i]))); } },
    { id: 'k-hanon', cat: 'k-finger', level: 2, ko: '하논 1번 음형', rh: '16', tempo: [60, 108], opts: { key: 'C', hands: 'both', oct: 1, keys: ['C', 'G', 'D', 'F', 'Bb'] },
      goal: '도-미-파-솔-라-솔-파-미 모양을 한 음씩 올려 가며 치는 하논 1번. 다섯 손가락이 같은 힘으로 또렷하게 나오게 하는 고전 연습이에요.',
      how: ['양손은 한 옥타브 떨어져 같은 음을 쳐요.', '올라갈 때 오른손 1-2-3-4-5-4-3-2, 왼손 5-4-3-2-1-2-3-4.', '꼭대기에서 모양을 거꾸로 뒤집어 내려와요.'],
      tips: ['하논이 권한 대로 60에서 시작해 108까지, 조금씩 템포를 올려요 (스피드 트레이너).', '손가락을 높이 들어 또박또박 치는 연습과 가볍게 치는 연습을 번갈아 하면 좋아요.'],
      gen: o => {
        const r = rhRoot(o.key), l = r - 12; const n = o.oct === 2 ? 14 : 7;
        const upPat = [0, 2, 3, 4, 5, 4, 3, 2], dnPat = [0, -2, -3, -4, -5, -4, -3, -2];
        const R = [], L = [];
        for (let g = 0; g < n; g++) upPat.forEach((p, i) => { R.push(one(stepMidi(r, g + p), [1, 2, 3, 4, 5, 4, 3, 2][i])); L.push(one(stepMidi(l, g + p), [5, 4, 3, 2, 1, 2, 3, 4][i])); });
        for (let g = 0; g < n; g++) { const top = n + 4 - g; dnPat.forEach((p, i) => { R.push(one(stepMidi(r, top + p), [5, 4, 3, 2, 1, 2, 3, 4][i])); L.push(one(stepMidi(l, top + p), [1, 2, 3, 4, 5, 4, 3, 2][i])); }); }
        return hands(o, R, L);
      } },
    { id: 'k-scale', cat: 'k-scale', level: 2, ko: '메이저 스케일 2옥타브 (엄지 넘기기)', rh: '8', tempo: [60, 120], opts: { key: 'C', hands: 'rh', keys: ['C', 'G', 'D', 'A', 'E', 'F'] },
      goal: '엄지를 3 · 4번 손가락 밑으로 넘기며 2옥타브를 끊김 없이. 음대 · 예고 입시에서 전 조를 치는 기본 과제예요.',
      how: ['오른손 C · G · D · A · E: 1-2-3 / 1-2-3-4 반복, 맨 위는 5. F 는 1-2-3-4 / 1-2-3.', '왼손: 5-4-3-2-1 / 3-2-1 / 4-3-2-1 / 3-2-1.', '엄지는 미리 다음 건반 쪽으로 움직여 두어 손목이 튀지 않게 해요.'],
      tips: ['엄지 넘기는 곳에서 소리가 끊기거나 커지지 않는지 들어 보세요.', '한 손씩 익힌 뒤 양손으로. 양손은 서로 넘기는 자리가 달라 처음엔 어려워요.'],
      gen: o => {
        const r = rhRoot(o.key), l = r - 12; const k = N().normalize(o.key || 'C'); const rf = SCALE_FG.rh[k === 'F' ? 'F' : 'C'], lf = SCALE_FG.lh.C;
        const up = s => Array.from({ length: 15 }, (_, i) => stepMidi(s, i));
        const R = up(r).map((m, i) => one(m, rf[i])), L = up(l).map((m, i) => one(m, lf[i]));
        return hands(o, R.concat(R.slice(0, -1).reverse()), L.concat(L.slice(0, -1).reverse()));
      } },
    { id: 'k-inv', cat: 'k-chord', level: 2, ko: '트라이어드 전위 (기본 · 1전위 · 2전위)', rh: '4', tempo: [60, 120], opts: { key: 'C', hands: 'rh', keys: ['C', 'G', 'D', 'F', 'A', 'E'] },
      goal: '같은 코드를 기본형 → 1전위 → 2전위 → 한 옥타브 위 기본형으로 올라갔다 내려와요. 코드를 가깝게 잇는 모든 반주의 바탕이에요.',
      how: ['오른손: 기본형 1-3-5, 1전위 1-2-5, 2전위 1-3-5.', '왼손: 기본형 5-3-1, 1전위 5-3-1, 2전위 5-2-1.'],
      tips: ['세 음이 한꺼번에 같은 크기로 울리게. 손가락을 미리 모양대로 벌려 두고 손 전체로 눌러요.'],
      gen: o => {
        const r = rhRoot(o.key), l = r - 12; const shapes = [[0, 4, 7], [4, 7, 12], [7, 12, 16], [12, 16, 19]]; const rf = [[1, 3, 5], [1, 2, 5], [1, 3, 5], [1, 3, 5]], lf = [[5, 3, 1], [5, 3, 1], [5, 2, 1], [5, 3, 1]];
        const idx = [0, 1, 2, 3, 2, 1, 0];
        return hands(o, idx.map(i => chord(shapes[i].map(x => x + r), rf[i])), idx.map(i => chord(shapes[i].map(x => x + l), lf[i])));
      } },
    { id: 'k-cadence', cat: 'k-chord', level: 3, ko: '케이던스 I–IV–V–I (가까운 자리)', rh: '2', tempo: [60, 110], opts: { key: 'C', hands: 'both', mode: 'major' },
      goal: '오른손은 가까운 전위로 I – IV – V – I, 왼손은 베이스 음. 입시 · 반주에서 가장 먼저 익히는 케이던스(마침꼴)예요.',
      how: ['오른손: I 기본형(1-3-5) → IV 2전위(1-2-5) → V 1전위(1-2-5) → I 기본형. 음이 거의 움직이지 않아요.', '왼손: 으뜸음 → 버금딸림음 → 딸림음 → 으뜸음을 5번 손가락으로.', '마이너로 바꾸면 V 에 이끔음(반음 올린 7음)이 들어가요.'],
      tips: ['공통음(두 코드에 같이 있는 음)은 손가락을 떼지 않고 이어서 누르는 느낌으로.', '12키 모두 익히면 어떤 곡의 반주도 시작할 수 있어요.'],
      gen: o => {
        const r = rhRoot(o.key); const minor = o.mode === 'minor'; const t = minor ? 3 : 4, s6 = minor ? 8 : 9;
        const R = [chord([r, r + t, r + 7], [1, 3, 5]), chord([r, r + 5, r + s6], [1, 2, 5]), chord([r - 1, r + 2, r + 7], [1, 2, 5]), chord([r, r + t, r + 7], [1, 3, 5])];
        const b = r - 12; const L = [one(b, 5), one(b - 7, 5), one(b - 5, 5), one(b, 5)];
        return hands(o, R, L);
      } },
    { id: 'k-arp', cat: 'k-scale', level: 3, ko: '트라이어드 아르페지오 2옥타브', rh: '16', tempo: [60, 110], opts: { key: 'C', hands: 'rh', keys: ['C', 'F', 'G', 'Am', 'Dm', 'Em'] },
      goal: '코드 음(1-3-5)을 두 옥타브에 걸쳐 펼쳐 쳐요. 엄지를 넘기는 거리가 스케일보다 멀어 손목 이동이 중요해요.',
      how: ['오른손 올라갈 때 1-2-3-1-2-3-5, 왼손 5-4-2-1-4-2-1.', '내려올 때는 손가락 순서를 거꾸로.'],
      tips: ['엄지를 넘길 때 팔꿈치를 살짝 옆으로 열어 손 전체를 옮기면 소리가 끊기지 않아요.'],
      gen: o => {
        const key = o.key || 'C'; const minor = /m$/.test(key); const r = rhRoot(key.replace(/m$/, '')), l = r - 12;
        const tones = [0, minor ? 3 : 4, 7, 12, 12 + (minor ? 3 : 4), 19, 24];
        const R = tones.map((t, i) => one(r + t, [1, 2, 3, 1, 2, 3, 5][i])), L = tones.map((t, i) => one(l + t, [5, 4, 2, 1, 4, 2, 1][i]));
        const Rd = R.slice(0, -1).reverse().map((n, i) => one(n.m[0], [3, 2, 1, 3, 2, 1][i])), Ld = L.slice(0, -1).reverse().map((n, i) => one(n.m[0], [2, 4, 1, 2, 4, 5][i]));
        return hands(o, R.concat(Rd), L.concat(Ld));
      } },
    { id: 'k-chrom', cat: 'k-finger', level: 4, ko: '반음계 (크로매틱 스케일 운지)', rh: '16', tempo: [60, 110], opts: { hands: 'rh' },
      goal: '검은 건반은 3번, 흰 건반은 1번 손가락. 반음씩 2옥타브를 고르게 올라갔다 내려와요.',
      how: ['오른손: 미-파 · 시-도 처럼 흰 건반이 이어지는 곳만 1-2.', '왼손: 미-파 · 시-도 에서 2-1.'],
      tips: ['손은 검은 건반 쪽으로 조금 들어가 있어야 3번이 편해요.', '엄지가 흰 건반을 칠 때마다 소리가 커지지 않게 조심하세요.'],
      gen: o => {
        const R = [], L = []; const rf = { 0: 2, 1: 3, 2: 1, 3: 3, 4: 1, 5: 2, 6: 3, 7: 1, 8: 3, 9: 1, 10: 3, 11: 1 }, lf = { 0: 1, 1: 3, 2: 1, 3: 3, 4: 2, 5: 1, 6: 3, 7: 1, 8: 3, 9: 1, 10: 3, 11: 2 };
        for (let i = 0; i <= 24; i++) { R.push(one(60 + i, i === 0 ? 1 : rf[i % 12])); L.push(one(48 + i, lf[i % 12])); }
        const Rd = R.slice(1, -1).reverse(), Ld = L.slice(1, -1).reverse();
        return hands(o, R.concat(Rd), L.concat(Ld));
      } },
    { id: 'k-251', cat: 'k-chord', level: 4, ko: '재즈 ii–V–I 보이싱 (왼손 루트 · 오른손 3 · 7)', rh: '2', tempo: [60, 140], opts: { key: 'C', hands: 'both', keys: ['C', 'F', 'Bb', 'Eb', 'G', 'D'] },
      goal: '오른손은 3음 · 7음(가이드톤)에 색채음을 얹고, 왼손은 루트. 음이 반음 · 온음씩만 움직이는 재즈 보이스 리딩이에요.',
      how: ['Dm7: F-C-E (b3 · b7 · 9) → G7: F-B-E (b7 · 3 · 13) → Cmaj7: E-B-D (3 · 7 · 9).', '오른손은 거의 제자리에서 한두 음만 옮겨요.', '왼손은 코드의 루트를 낮게.'],
      tips: ['G7 에서 Cmaj7 으로 갈 때 F → E 가 반음 내려가는 소리(7 → 3 해결)를 들어 보세요.', '익숙해지면 템포를 올리고 2 · 4박에 짧게 끊어 쳐 보세요.'],
      gen: o => {
        const sh = N().mod(pcOf(o.key), 12); const t = sh > 6 ? sh - 12 : sh;
        const R = [chord([65, 72, 76].map(x => x + t), [1, 4, 5], 2), chord([65, 71, 76].map(x => x + t), [1, 3, 5], 2), chord([64, 71, 74].map(x => x + t), [1, 4, 5], 4)];
        const L = [one(50 + t, 5, 2), one(43 + t, 5, 2), one(48 + t, 5, 4)];
        return hands(o, R, L);
      }, fixed: true },
    { id: 'k-alberti', cat: 'k-indep', level: 5, ko: '알베르티 베이스 + 오른손 선율', rh: '8', tempo: [60, 120], opts: { key: 'C', hands: 'both' },
      goal: '왼손은 도-솔-미-솔 알베르티 베이스(8분음표), 오른손은 4분음표 선율. 고전 소나타에서 온 양손 독립 연습이에요.',
      how: ['왼손: 5-1-3-1 손가락으로 아래 음 · 위 음 · 가운데 음 · 위 음.', '오른손: 코드 음을 이어 부르듯 레가토로.', '왼손을 먼저 혼자 익히고, 오른손을 얹어요.'],
      tips: ['왼손 소리가 오른손보다 작아야 선율이 들려요. 왼손은 가볍게.'],
      gen: o => {
        const sh = N().mod(pcOf(o.key), 12); const t = sh > 6 ? sh - 12 : sh;
        const alb = (a, b, c) => [one(a + t, 5, .5), one(c + t, 1, .5), one(b + t, 3, .5), one(c + t, 1, .5), one(a + t, 5, .5), one(c + t, 1, .5), one(b + t, 3, .5), one(c + t, 1, .5)];
        const L = [].concat(alb(48, 52, 55), alb(48, 53, 57), alb(47, 50, 55), alb(48, 52, 55));
        const mel = [[64, 1], [67, 2], [72, 5], [67, 2], [65, 1], [69, 3], [72, 5], [69, 3], [62, 1], [67, 3], [71, 5], [67, 3]];
        const R = mel.map(([m, f]) => one(m + t, f, 1)).concat([one(64 + t, 1, 1), one(67 + t, 3, 1), one(72 + t, 5, 2)]);
        return hands(o, R, L);
      }, fixed: true }
  ];
  /* ---- 더 많은 키보드 연습 ---- */
  const nameOf = (k, deg) => N().noteName(N().mod(pcOf(k) + deg, 12), GH.state.pref(k));
  const chordOf = (k, deg, q) => GH.chords.buildChord(nameOf(k, deg), q);
  const pickV = (c, level, re) => { const L = GH.instView.keysVoicings(c, level).list; return L.find(v => re.test(v.name)) || L[0]; };
  /* 가장 가까운 전위 고르기 (보이스 리딩) */
  function nearest(c, prev) {
    const L = GH.instView.keysVoicings(c, 'basic').list.filter(v => /기본형|전위/.test(v.name));
    if (!prev) return L[0];
    const cost = v => v.rh.reduce((a, m, i) => a + Math.abs(m - (prev.rh[i] != null ? prev.rh[i] : prev.rh[prev.rh.length - 1])), 0);
    return L.slice().sort((a, b) => cost(a) - cost(b))[0];
  }
  const fingersFor = ms => ms.length === 3 ? [1, 3, 5] : ms.length === 4 ? [1, 2, 3, 5] : ms.length === 2 ? [1, 4] : ms.map((_, i) => Math.min(5, i + 1));
  const lhFingers = ms => ms.length === 1 ? [5] : ms.length === 2 ? [5, 1] : ms.length === 3 ? [5, 3, 1] : [5, 4, 2, 1].slice(0, ms.length);
  const progVoicings = (o, degs, pick) => { let prev = null; return degs.map(([d, q]) => { const c = chordOf(o.key, d, q); const v = pick(c, prev); prev = v; return v; }); };
  /* 오른손이 없는 보이싱(셸 · 루트리스)은 그 박을 쉼표로 */
  const toHands = (o, vs) => hands(o, vs.some(v => v.rh.length) ? vs.map(v => v.rh.length ? chord(v.rh, fingersFor(v.rh)) : { m: [], fg: [], rest: true }) : [], vs.map(v => chord(v.lh, lhFingers(v.lh))));
  CATS.push({ id: 'k-voice', inst: 'keys', ko: '코드 보이싱', en: 'VOICINGS', icon: 'stack', desc: '진행 위에서 보이싱을 가깝게 잇는 연습. 팝 반주형부터 셸 · 루트리스 · 드롭 2 · 쿼탈 · 어퍼 스트럭처까지.' });
  EX.push(
    /* 코드 보이싱 */
    { id: 'k-v-inv', cat: 'k-voice', level: 2, ko: '전위로 진행 잇기 (I–V–vi–IV)', rh: '2', tempo: [60, 110], opts: { key: 'C', hands: 'both' },
      goal: '팝 4코드 진행을 오른손이 가장 가까운 전위로 이어 쳐요. 손이 거의 움직이지 않고 공통음은 제자리에 남아요.',
      how: ['오른손: 앞 코드와 겹치는 음은 그대로 두고, 다른 음만 가까이 옮겨요.', '왼손: 코드 루트를 낮게.'],
      tips: ['손 모양을 바꾸는 게 아니라 손가락 한두 개만 옮긴다는 느낌으로.'],
      gen: o => toHands(o, progVoicings(o, [[0, 'maj'], [7, 'maj'], [9, 'min'], [5, 'maj']], (c, prev) => nearest(c, prev))) },
    { id: 'k-v-pop', cat: 'k-voice', level: 2, ko: '팝 반주형 (왼손 옥타브 + 오른손 코드)', rh: '2', tempo: [60, 110], opts: { key: 'C', hands: 'both' },
      goal: '왼손은 루트 옥타브, 오른손은 맨 위 음이 A4~E5 근처인 코드. 발라드 · 팝 반주의 가장 흔한 모양으로 I–vi–IV–V 를 쳐요.',
      how: ['왼손 5-1 옥타브, 오른손 1-3-5 또는 1-2-5.', '오른손 맨 위 음(탑 노트)이 노래처럼 이어지게.'],
      tips: ['왼손 옥타브를 너무 크게 치면 소리가 탁해져요. 오른손보다 살짝 작게.'],
      gen: o => toHands(o, [[0, 'maj'], [9, 'min'], [5, 'maj'], [7, 'maj']].map(([d, q]) => pickV(chordOf(o.key, d, q), 'basic', /팝/))) },
    { id: 'k-v-7th', cat: 'k-voice', level: 3, ko: '세븐 코드 기본 보이싱 (ii–V–I–vi)', rh: '2', tempo: [60, 110], opts: { key: 'C', hands: 'both' },
      goal: '왼손 루트 + 오른손 세븐 코드(가까운 전위)로 ii–V–I–vi. 재즈 · R&B 반주의 기본 손 모양이에요.',
      how: ['오른손 네 음을 가장 가까운 전위로 이어요.', '왼손은 루트 한 음.'],
      tips: ['G7 → Cmaj7 에서 F → E (7음 → 3음) 가 반음 내려가는 소리를 들어 보세요.'],
      gen: o => toHands(o, progVoicings(o, [[2, 'm7'], [7, '7'], [0, 'maj7'], [9, 'm7']], (c, prev) => nearest(c, prev))) },
    { id: 'k-v-shell', cat: 'k-voice', level: 3, ko: '셸 보이싱 (왼손 1-7 · 1-10)', rh: '2', tempo: [60, 120], opts: { key: 'C', hands: 'lh' },
      goal: '왼손으로 루트와 7음(또는 10도 3음)만 짚는 셸 보이싱. ii 는 1-7, V 는 1-10, I 은 1-7 로 번갈아 쓰면 손이 거의 움직이지 않아요.',
      how: ['오른손은 쉬거나 멜로디를 쳐도 돼요.', '1-7 과 1-10 을 번갈아 써요.'],
      tips: ['손이 작으면 1-10 대신 1-3 을 가까이 짚어도 괜찮아요.'],
      gen: o => toHands(o, [[2, 'm7', /1-7/], [7, '7', /1-10/], [0, 'maj7', /1-7/], [0, 'maj7', /1-10/]].map(([d, q, re]) => pickV(chordOf(o.key, d, q), 'advanced', re))) },
    { id: 'k-v-drop2', cat: 'k-voice', level: 4, ko: '드롭 2 보이싱 (양손으로 나누기)', rh: '2', tempo: [60, 110], opts: { key: 'C', hands: 'both' },
      goal: '4음 클로즈 코드의 위에서 두 번째 음을 한 옥타브 내려 왼손으로. 음 사이가 넓어져 빅밴드 · 재즈 편곡처럼 맑게 울려요.',
      how: ['왼손: 내린 음 + 루트, 오른손: 3음 · 7음.', 'ii–V–I–I 을 이어 쳐요.'],
      tips: ['양손 네 음이 한 덩어리로 들리게 동시에 눌러요.'],
      gen: o => toHands(o, [[2, 'm7'], [7, '7'], [0, 'maj7'], [0, 'maj7']].map(([d, q]) => pickV(chordOf(o.key, d, q), 'advanced', /드롭 2/))) },
    { id: 'k-v-rootless', cat: 'k-voice', level: 5, ko: '루트리스 A · B형 (ii–V–I, 4키 순환)', rh: '2', tempo: [60, 120], opts: { hands: 'lh' },
      goal: '빌 에반스식 루트리스 보이싱으로 C → F → B♭ → E♭ 키의 ii–V–I 을 돌아요. ii 는 A형, V 는 B형, I 은 A형.',
      how: ['왼손 네 음을 가운데 도 근처에서. 루트는 베이스가 친다고 생각해요.', 'V 의 13 · 9 가 I 의 5 · 9 로 이어지는 소리를 들어요.'],
      tips: ['키가 바뀌어도 손 모양(A · B)은 같아요. 모양을 옮기는 연습이에요.'],
      gen: o => { const vs = []; ['C', 'F', 'Bb', 'Eb'].forEach(k => [[2, 'm7', /A형/], [7, '7', /B형/], [0, 'maj7', /A형/]].forEach(([d, q, re]) => vs.push(pickV(chordOf(k, d, q), 'advanced', re)))); return toHands(o, vs); } },
    { id: 'k-v-quartal', cat: 'k-voice', level: 4, ko: '쿼탈 보이싱 (So What · 도리안 뱀프)', rh: '2', tempo: [60, 110], opts: { key: 'D', hands: 'both' },
      goal: '4도 · 4도 · 4도 · 3도로 쌓은 모달 재즈 보이싱으로 Dm7 – Em7 도리안 뱀프를 쳐요 (마일스 데이비스 〈So What〉 식).',
      how: ['왼손 세 음(4도 쌓기), 오른손 두 음.', '같은 모양을 온음 위로 옮겼다 돌아와요.'],
      tips: ['코드 이름보다 “모양”으로 기억하면 쉬워요.'],
      gen: o => { const k = (o.key || 'D').replace(/m$/, ''); const vs = [[0, 'm7'], [2, 'm7'], [0, 'm7'], [2, 'm7']].map(([d, q]) => pickV(GH.chords.buildChord(nameOf(k, d), q), 'advanced', /쿼탈/)); return toHands(o, vs); } },
    { id: 'k-v-ust', cat: 'k-voice', level: 5, ko: '어퍼 스트럭처 (V7 위 II 트라이어드)', rh: '2', tempo: [60, 110], opts: { key: 'C', hands: 'both' },
      goal: 'ii–V–I 의 V7 에서 왼손 3 · 7(트라이톤) 위에 한 음 위 메이저 트라이어드를 얹어 9 · #11 · 13 의 화려한 소리를 내요.',
      how: ['ii 와 I 은 루트리스 A형, V 만 어퍼 스트럭처.', 'V 의 오른손 트라이어드가 I 로 해결되는 소리를 들어요.'],
      tips: ['어퍼 스트럭처는 강한 색이라 곡의 끝이나 클라이맥스에서 한 번씩.'],
      gen: o => toHands(o, [pickV(chordOf(o.key, 2, 'm7'), 'advanced', /A형/), pickV(chordOf(o.key, 7, '7'), 'advanced', /어퍼/), pickV(chordOf(o.key, 0, 'maj7'), 'advanced', /A형/), pickV(chordOf(o.key, 0, 'maj7'), 'advanced', /A형/)]) },
    /* 손가락 · 스케일 · 반주 */
    { id: 'k-trill', cat: 'k-finger', level: 2, ko: '트릴 (1-2 · 2-3 · 3-4 · 4-5)', rh: '16', tempo: [60, 120], opts: { key: 'C', hands: 'rh' },
      goal: '이웃한 두 손가락으로 두 음을 빠르게 번갈아요. 약한 4 · 5번 손가락의 힘을 고르게 만들어요.',
      how: ['손가락 쌍마다 16분음표 여덟 개.', '손목은 가만히, 손가락만 움직여요.'],
      tips: ['4-5 트릴이 가장 어려워요. 소리가 고를 때까지 템포를 낮춰요.'],
      gen: o => { const r = rhRoot(o.key), l = r - 12; const R = [], L = []; [[0, 1, 1, 2], [1, 2, 2, 3], [2, 3, 3, 4], [3, 4, 4, 5]].forEach(([a, b, fa, fb]) => { for (let k = 0; k < 4; k++) { R.push(one(stepMidi(r, a), fa), one(stepMidi(r, b), fb)); L.push(one(stepMidi(l, 4 - a), fa), one(stepMidi(l, 4 - b), fb)); } }); return hands(o, R, L); } },
    { id: 'k-broken', cat: 'k-chord', level: 2, ko: '분산화음 반주 (I–IV–V–I)', rh: '4', tempo: [60, 120], opts: { key: 'C', hands: 'both' }, fixed: true,
      goal: '오른손은 코드 음을 1-3-5-3 으로 풀어 8분음표로, 왼손은 루트를 2분음표로. 동요 · 발라드 반주의 기본형이에요.',
      how: ['오른손 운지: 기본형 1-3-5-3, 2전위 1-2-5-2, 1전위 1-2-5-2.', '왼손은 코드가 바뀔 때만 움직여요.'],
      tips: ['오른손 첫 음(박 첫머리)을 조금 또렷하게.'],
      gen: o => { const r = rhRoot(o.key); const sets = [[[r, r + 4, r + 7], [1, 3, 5]], [[r, r + 5, r + 9], [1, 2, 5]], [[r - 1, r + 2, r + 7], [1, 2, 5]], [[r, r + 4, r + 7], [1, 3, 5]]]; const R = [], L = []; const b = r - 12, bass = [b, b - 7, b - 5, b];
        sets.forEach(([ms, fs], i) => { for (let k = 0; k < 2; k++) [0, 1, 2, 1].forEach(j => R.push(one(ms[j], fs[j], 0.5))); L.push(one(bass[i], 5, 2), one(bass[i], 5, 2)); }); return hands(o, R, L); } },
    { id: 'k-contrary', cat: 'k-scale', level: 3, ko: '반진행 스케일 (양손 반대 방향)', rh: '8', tempo: [60, 110], opts: { key: 'C', hands: 'both', keys: ['C', 'G', 'D', 'A', 'E'] },
      goal: '같은 음에서 출발해 오른손은 올라가고 왼손은 내려가요. 양손 엄지가 같은 순간에 넘어가서 손가락 번호가 거울처럼 맞아요. 입시 스케일 과제에 자주 나와요.',
      how: ['오른손 1-2-3-1-2-3-4-5, 왼손 1-2-3-1-2-3-4-5 (반대 방향).', '한 옥타브 벌어졌다가 다시 가운데로 모여요.'],
      tips: ['엄지가 동시에 넘어가는지 손을 보며 천천히.'],
      gen: o => { const r = rhRoot(o.key); const f = [1, 2, 3, 1, 2, 3, 4, 5]; const up = [0, 1, 2, 3, 4, 5, 6, 7].map(i => stepMidi(r, i)), dn = [0, 1, 2, 3, 4, 5, 6, 7].map(i => stepMidi(r, -i));
        const R = up.map((m, i) => one(m, f[i])).concat(up.slice(0, -1).reverse().map((m, i) => one(m, f[6 - i]))), L = dn.map((m, i) => one(m, f[i])).concat(dn.slice(0, -1).reverse().map((m, i) => one(m, f[6 - i]))); return hands(o, R, L); } },
    { id: 'k-minor', cat: 'k-scale', level: 3, ko: '화성 단음계 (하모닉 마이너)', rh: '8', tempo: [60, 120], opts: { key: 'Am', hands: 'rh', keys: ['Am', 'Dm', 'Em'] },
      goal: '7음을 반음 올린 하모닉 마이너. 6음과 7음 사이가 넓어(증2도) 동양적인 색이 나요. 흰 건반 마이너는 C 와 같은 운지예요.',
      how: ['오른손 1-2-3-1-2-3-4-5, 왼손 5-4-3-2-1-3-2-1.', '6 → 7 의 넓은 간격을 손가락을 벌려 부드럽게.'],
      tips: ['A · D · E 하모닉 마이너의 이끔음은 G# · C# · D# 이에요.'],
      gen: o => { const k = (o.key || 'Am').replace(/m$/, ''); const r = rhRoot(k), l = r - 12; const HM = [0, 2, 3, 5, 7, 8, 11, 12]; const rf = [1, 2, 3, 1, 2, 3, 4, 5], lf = [5, 4, 3, 2, 1, 3, 2, 1];
        const R = HM.map((x, i) => one(r + x, rf[i])), L = HM.map((x, i) => one(l + x, lf[i])); return hands(o, R.concat(R.slice(0, -1).reverse()), L.concat(L.slice(0, -1).reverse())); } },
    { id: 'k-octaves', cat: 'k-finger', level: 3, ko: '옥타브 스케일 (1-5 · 검은 건반 1-4)', rh: '8', tempo: [50, 100], opts: { key: 'C', hands: 'rh', keys: ['C', 'G', 'D', 'F'] },
      goal: '엄지와 새끼로 옥타브를 짚고 스케일을 올라갔다 내려와요. 손목을 가볍게 튕기는 옥타브 주법의 기초예요.',
      how: ['흰 건반은 1-5, 검은 건반은 1-4.', '손목을 살짝 들었다 떨어뜨리듯, 팔 힘은 빼고.'],
      tips: ['손이 작아 옥타브가 힘들면 템포를 낮추고, 아프면 바로 쉬어요.'],
      gen: o => { const r = rhRoot(o.key); const R = []; for (let i = 0; i <= 7; i++) { const m = stepMidi(r, i); const black = [1, 3, 6, 8, 10].includes(m % 12); R.push(chord([m, m + 12], [1, black ? 4 : 5])); } const L = R.map(n => chord(n.m.map(x => x - 24), [5, 1])); return hands(o, R.concat(R.slice(0, -1).reverse()), L.concat(L.slice(0, -1).reverse())); } },
    { id: 'k-pop-comp', cat: 'k-indep', level: 2, ko: '8비트 반주 (왼손 루트 · 오른손 8분 코드)', rh: '8', tempo: [70, 120], opts: { key: 'C', hands: 'both' }, fixed: true,
      goal: '왼손은 2분음표 루트, 오른손은 8분음표로 코드를 콕콕. I–V–vi–IV 팝 진행의 밴드 반주예요.',
      how: ['오른손은 가까운 전위(C · G/B · Am · F/C)로 손목을 가볍게.', '박 첫머리(1 · 3박)에 살짝 힘을 줘요.'],
      tips: ['오른손 코드를 너무 길게 누르지 말고 짧게 끊으면 리듬이 살아요.'],
      gen: o => { const r = rhRoot(o.key); const vs = [[r, r + 4, r + 7], [r - 1, r + 2, r + 7], [r, r + 4, r + 9], [r, r + 5, r + 9]]; const roots = [0, 7, 9, 5].map(d => r - 12 + d - (d > 6 ? 12 : 0)); const R = [], L = [];
        vs.forEach((v, i) => { for (let k = 0; k < 8; k++) R.push(chord(v, [1, 3, 5], 0.5)); L.push(one(roots[i], 5, 2), one(roots[i], 5, 2)); }); return hands(o, R, L); } },
    { id: 'k-ballad', cat: 'k-indep', level: 3, ko: '발라드 분산 반주 (왼손 1-5-8-10)', rh: '8', tempo: [60, 100], opts: { key: 'C', hands: 'both' }, fixed: true,
      goal: '왼손이 루트-5도-옥타브-10도(3음)를 8분음표로 펼치고, 오른손은 코드를 길게. 발라드 · CCM 반주에서 가장 많이 쓰는 모양이에요.',
      how: ['왼손: 1 → 5 → 8 → 10 → 8 → 5 … 손을 넓게 벌려요.', '오른손은 코드를 온음표로 누르고 페달을 쓴다고 생각해요.'],
      tips: ['왼손 10도가 멀면 3음을 한 옥타브 아래(1-5-8-3)로 바꿔도 좋아요.'],
      gen: o => { const r = rhRoot(o.key); const prog = [[0, 4], [7, 4], [9, 3], [5, 4]]; const R = [], L = [];
        prog.forEach(([d, t]) => { const b = r - 24 + d; const pat = [0, 7, 12, 12 + t, 12, 7, 0, 7]; pat.forEach((x, i) => L.push(one(b + x, [5, 2, 1, 1, 1, 2, 5, 2][i], 0.5))); const top = r + d - (d > 6 ? 12 : 0); R.push(chord([top, top + t, top + 7].map(x => x < 57 ? x + 12 : x).sort((a, c) => a - c), [1, 3, 5], 4)); }); return hands(o, R, L); } },
    { id: 'k-circle', cat: 'k-chord', level: 4, ko: '5도권 케이던스 (C → G → D → A)', rh: '2', tempo: [60, 110], opts: { hands: 'both' },
      goal: 'I–IV–V–I 케이던스를 C → G → D → A 키로 옮겨 가며 쳐요. 조가 바뀌어도 같은 손 모양이 나오는 게 목표예요.',
      how: ['키마다 오른손 I 기본형 → IV 2전위 → V 1전위 → I 기본형.', '다음 키의 I 은 앞 키의 V 와 같은 코드예요.'],
      tips: ['조표(샵 개수)가 하나씩 늘어나는 걸 느껴 보세요.'],
      gen: o => { const R = [], L = []; ['C', 'G', 'D', 'A'].forEach(k => { const g = EX.find(e => e.id === 'k-cadence').gen({ key: k, hands: 'both', mode: 'major' }); R.push(...g.rh.map(n => Object.assign({}, n, { d: undefined }))); L.push(...g.lh.map(n => Object.assign({}, n, { d: undefined }))); }); return hands(o, R, L); } },
    { id: 'k-stride', cat: 'k-indep', level: 5, ko: '스트라이드 · 붐칙 왼손', rh: '4', tempo: [60, 140], opts: { key: 'C', hands: 'lh' },
      goal: '왼손이 1 · 3박에 낮은 베이스, 2 · 4박에 가운데 코드를 번갈아 치는 스트라이드(붐칙). 래그타임 · 스윙 피아노의 왼손이에요.',
      how: ['1박 루트(낮게) → 2박 코드 → 3박 5음(낮게) → 4박 코드.', '왼손이 크게 뛰어요. 코드 자리를 눈으로 먼저 보고 손을 보내요.'],
      tips: ['처음엔 베이스와 코드 사이를 한 옥타브만 뛰게 가까이 해도 돼요.'],
      gen: o => { const r = rhRoot(o.key); const L = []; [[0, 'maj'], [5, 'maj'], [7, 'maj'], [0, 'maj']].forEach(([d]) => { const root = r - 24 + d; const ch = [root + 12 + 4, root + 12 + 7, root + 24].map(x => x > 64 ? x - 12 : x).sort((a, b) => a - b); L.push(one(root, 5), chord(ch, [3, 2, 1]), one(root - 5 >= 28 ? root - 5 : root + 7, 5), chord(ch, [3, 2, 1])); }); return hands(o, [], L); } }
  );
  EX.forEach(e => { e.inst = 'keys'; });
  const ROUTINES = [
    { id: 'k-easy', inst: 'keys', ko: '입문 루틴', min: 10, desc: '다섯 손가락 → 하논 1번 → 전위 → 스케일 한 손씩.', steps: [['k-five', 2], ['k-hanon', 3], ['k-inv', 2], ['k-scale', 3]] },
    { id: 'k-mid', inst: 'keys', ko: '중급 루틴', min: 15, desc: '입시 기본 세트: 스케일 · 아르페지오 · 케이던스.', steps: [['k-hanon', 3], ['k-scale', 4], ['k-arp', 4], ['k-cadence', 4]] },
    { id: 'k-hard', inst: 'keys', ko: '고급 루틴', min: 20, desc: '반음계 · 재즈 보이싱 · 양손 독립까지.', steps: [['k-hanon', 3], ['k-chrom', 4], ['k-arp', 4], ['k-251', 4], ['k-alberti', 5]] }
  ];
  GH.data.techCats = (GH.data.techCats || []).concat(CATS);
  GH.data.technique = (GH.data.technique || []).concat(EX);
  GH.data.techRoutines = (GH.data.techRoutines || []).concat(ROUTINES);
})();
