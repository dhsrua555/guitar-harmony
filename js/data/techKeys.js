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
    { id: 'k-chord', inst: 'keys', ko: '코드 · 카덴스', en: 'CHORDS', icon: 'chord', desc: '코드 전위, I–IV–V–I 카덴스, 재즈 ii–V–I 보이싱으로 손 모양을 가깝게 잇는 법을 익혀요.' },
    { id: 'k-indep', inst: 'keys', ko: '양손 독립', en: 'INDEPENDENCE', icon: 'harmony', desc: '왼손 반주와 오른손 선율을 따로 움직여요.' }
  ];
  const EX = [
    { id: 'k-five', cat: 'k-finger', level: 1, ko: '다섯 손가락 자리 (1-2-3-4-5)', rh: '4', tempo: [60, 120], opts: { key: 'C', hands: 'rh', keys: ['C', 'G', 'D', 'F'] },
      goal: '한 손가락이 한 건반씩 맡는 다섯 손가락 자리. 도-레-미-파-솔을 올라갔다 내려와요.',
      how: ['손가락 번호: 1 엄지 · 2 검지 · 3 중지 · 4 약지 · 5 새끼.', '손 모양은 달걀을 쥔 듯 둥글게, 손가락 끝으로 건반을 눌러요.', '오른손이 익숙해지면 왼손, 그다음 양손으로.'],
      tips: ['손목은 건반과 같은 높이로, 위아래로 흔들리지 않게.', '4번 손가락이 누를 때 5번이 따라 들리지 않는지 보세요.'],
      src: 'Ferdinand Beyer 《바이엘 피아노 교본》 다섯 손가락 연습',
      gen: o => { const r = rhRoot(o.key), l = r - 12; const deg = [0, 1, 2, 3, 4, 3, 2, 1]; return hands(o, deg.map((s, i) => one(stepMidi(r, s), [1, 2, 3, 4, 5, 4, 3, 2][i])), deg.map((s, i) => one(stepMidi(l, s), [5, 4, 3, 2, 1, 2, 3, 4][i]))); } },
    { id: 'k-hanon', cat: 'k-finger', level: 2, ko: '하논 1번 음형', rh: '16', tempo: [60, 108], opts: { key: 'C', hands: 'both', oct: 1, keys: ['C', 'G', 'D', 'F', 'Bb'] },
      goal: '도-미-파-솔-라-솔-파-미 모양을 한 음씩 올려 가며 치는 하논 1번. 다섯 손가락이 같은 힘으로 또렷하게 나오게 하는 고전 연습이에요.',
      how: ['양손은 한 옥타브 떨어져 같은 음을 쳐요.', '올라갈 때 오른손 1-2-3-4-5-4-3-2, 왼손 5-4-3-2-1-2-3-4.', '꼭대기에서 모양을 거꾸로 뒤집어 내려와요.'],
      tips: ['하논이 권한 대로 60에서 시작해 108까지, 조금씩 템포를 올려요 (스피드 트레이너).', '손가락을 높이 들어 또박또박 치는 연습과 가볍게 치는 연습을 번갈아 하면 좋아요.'],
      src: 'Charles-Louis Hanon 《The Virtuoso Pianist》(1873) 1번 · 저작권이 끝난 음형',
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
      src: '음대 · 예고 피아노 입시 공통 과제 (전 조 스케일 · 표준 운지)',
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
      src: '피아노 교본 공통 코드 전위 연습',
      gen: o => {
        const r = rhRoot(o.key), l = r - 12; const shapes = [[0, 4, 7], [4, 7, 12], [7, 12, 16], [12, 16, 19]]; const rf = [[1, 3, 5], [1, 2, 5], [1, 3, 5], [1, 3, 5]], lf = [[5, 3, 1], [5, 3, 1], [5, 2, 1], [5, 3, 1]];
        const idx = [0, 1, 2, 3, 2, 1, 0];
        return hands(o, idx.map(i => chord(shapes[i].map(x => x + r), rf[i])), idx.map(i => chord(shapes[i].map(x => x + l), lf[i])));
      } },
    { id: 'k-cadence', cat: 'k-chord', level: 3, ko: '카덴스 I–IV–V–I (가까운 자리)', rh: '2', tempo: [60, 110], opts: { key: 'C', hands: 'both', mode: 'major' },
      goal: '오른손은 가까운 전위로 I – IV – V – I, 왼손은 베이스 음. 입시 · 반주에서 가장 먼저 익히는 카덴스(마침꼴)예요.',
      how: ['오른손: I 기본형(1-3-5) → IV 2전위(1-2-5) → V 1전위(1-2-5) → I 기본형. 음이 거의 움직이지 않아요.', '왼손: 으뜸음 → 버금딸림음 → 딸림음 → 으뜸음을 5번 손가락으로.', '마이너로 바꾸면 V 에 이끔음(반음 올린 7음)이 들어가요.'],
      tips: ['공통음(두 코드에 같이 있는 음)은 손가락을 떼지 않고 이어서 누르는 느낌으로.', '12키 모두 익히면 어떤 곡의 반주도 시작할 수 있어요.'],
      src: '음대 · 예고 피아노 입시 공통 과제 (카덴스)',
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
      src: '음대 · 예고 피아노 입시 공통 과제 (아르페지오)',
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
      src: '피아노 교본 공통 반음계 표준 운지',
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
      src: 'Mark Levine 《The Jazz Piano Book》 · 실용음악 재즈 피아노 입시 보이싱',
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
      src: '알베르티 베이스 (Clementi · Mozart 소나티네 반주형)',
      gen: o => {
        const sh = N().mod(pcOf(o.key), 12); const t = sh > 6 ? sh - 12 : sh;
        const alb = (a, b, c) => [one(a + t, 5, .5), one(c + t, 1, .5), one(b + t, 3, .5), one(c + t, 1, .5), one(a + t, 5, .5), one(c + t, 1, .5), one(b + t, 3, .5), one(c + t, 1, .5)];
        const L = [].concat(alb(48, 52, 55), alb(48, 53, 57), alb(47, 50, 55), alb(48, 52, 55));
        const mel = [[64, 1], [67, 2], [72, 5], [67, 2], [65, 1], [69, 3], [72, 5], [69, 3], [62, 1], [67, 3], [71, 5], [67, 3]];
        const R = mel.map(([m, f]) => one(m + t, f, 1)).concat([one(64 + t, 1, 1), one(67 + t, 3, 1), one(72 + t, 5, 2)]);
        return hands(o, R, L);
      }, fixed: true }
  ];
  EX.forEach(e => { e.inst = 'keys'; });
  const ROUTINES = [
    { id: 'k-easy', inst: 'keys', ko: '입문 루틴', min: 10, desc: '다섯 손가락 → 하논 1번 → 전위 → 스케일 한 손씩.', steps: [['k-five', 2], ['k-hanon', 3], ['k-inv', 2], ['k-scale', 3]] },
    { id: 'k-mid', inst: 'keys', ko: '중급 루틴', min: 15, desc: '입시 기본 세트: 스케일 · 아르페지오 · 카덴스.', steps: [['k-hanon', 3], ['k-scale', 4], ['k-arp', 4], ['k-cadence', 4]] },
    { id: 'k-hard', inst: 'keys', ko: '고급 루틴', min: 20, desc: '반음계 · 재즈 보이싱 · 양손 독립까지.', steps: [['k-hanon', 3], ['k-chrom', 4], ['k-arp', 4], ['k-251', 4], ['k-alberti', 5]] }
  ];
  GH.data.techSources = GH.data.techSources || {};
  GH.data.techSources.keys = [
    ['Charles-Louis Hanon', '《The Virtuoso Pianist》 (1873)', '1번 음형 · 다섯 손가락 독립과 고른 소리'],
    ['Ferdinand Beyer', '《바이엘 피아노 교본》', '다섯 손가락 자리 · 손 모양'],
    ['Mark Levine', '《The Jazz Piano Book》', '가이드톤 · ii–V–I 보이싱'],
    ['음대 · 예고 피아노 입시', '공통 과제', '전 조 스케일 · 아르페지오 · 카덴스 (표준 운지)']
  ];
  GH.data.techCats = (GH.data.techCats || []).concat(CATS);
  GH.data.technique = (GH.data.technique || []).concat(EX);
  GH.data.techRoutines = (GH.data.techRoutines || []).concat(ROUTINES);
})();
