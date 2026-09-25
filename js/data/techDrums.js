/* 기본기 연습 · 드럼. PAS 루디먼트 이름 · 교재 전통을 참고해 새로 적은 연습
   gen(o) → { grid(칸 길이, 박), slots: [{hits:[{k, acc, ghost}], st(스티킹)}] }
   k: kick · snare · hat · hatopen · pedal(하이햇 페달) · ride · crash · tom1 · tom2 · tom3 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  GH.data = GH.data || {};
  const G = { '8': 0.5, '8t': 1 / 3, '16': 0.25, '4': 1 };
  const hit = (k, extra) => Object.assign({ k }, extra || {});
  /* 스티킹 문자열 → 스네어 칸. 대문자 = 액센트 없음, '>' 가 붙으면 액센트, '-' 는 쉼 */
  function sticking(str, beatsTotal, grid, accentFirst) {
    const toks = str.trim().split(/\s+/);
    const n = Math.round(beatsTotal / grid); const out = [];
    for (let i = 0; i < n; i++) {
      const t = toks[i % toks.length];
      if (t === '-') { out.push({ hits: [] }); continue; }
      const acc = /[>]/.test(t) || (accentFirst && i % accentFirst === 0);
      out.push({ hits: [hit('snare', { acc })], st: t.replace('>', '') });
    }
    return out;
  }
  /* 그루브: 칸 번호 목록으로 */
  function groove(n, lanes) {
    const out = Array.from({ length: n }, () => ({ hits: [] }));
    Object.keys(lanes).forEach(k => lanes[k].forEach(p => { const [i, extra] = Array.isArray(p) ? p : [p, null]; if (out[i]) out[i].hits.push(hit(k, extra || {})); }));
    return out;
  }
  const range = (a, b, step) => { const r = []; for (let i = a; i < b; i += step || 1) r.push(i); return r; };

  const KICKS = { v1: [0, 4], v2: [0, 4, 5], v3: [0, 1, 4], v4: [0, 3, 4], v5: [0, 4, 7] };
  const KICK_KO = { v1: '1 · 3박', v2: '1 · 3 · 3&', v3: '1 · 1& · 3', v4: '1 · 2& · 3', v5: '1 · 3 · 4&' };

  const CATS = [
    { id: 'd-rud', inst: 'drums', ko: '루디먼트', en: 'RUDIMENTS', icon: 'drum', desc: '국제 표준 40가지 루디먼트 중 기본이 되는 싱글 · 더블 · 패러디들 · 롤. 스네어 하나로 손을 고르게 만들어요.' },
    { id: 'd-ctrl', inst: 'drums', ko: '액센트 · 컨트롤', en: 'CONTROL', icon: 'metronome', desc: '센 음(액센트)과 여린 음(탭)을 구분해 치는 스틱 컨트롤.' },
    { id: 'd-groove', inst: 'drums', ko: '그루브', en: 'GROOVE', icon: 'backing', desc: '8비트 · 16비트 · 고스트 노트 · 스윙. 곡을 받쳐 주는 기본 리듬들이에요.' },
    { id: 'd-fill', inst: 'drums', ko: '필인 · 손발 독립', en: 'FILL · INDEPENDENCE', icon: 'spark', desc: '탐을 도는 필인과, 손발을 한 번에 하나씩 쓰는 리니어 패턴.' }
  ];
  const EX = [
    { id: 'd-single', cat: 'd-rud', level: 1, ko: '싱글 스트로크 (R L R L)', rh: '8', rhs: ['4', '8', '8t', '16'], tempo: [60, 120], opts: {},
      goal: '오른손 · 왼손을 한 번씩 번갈아 쳐요. 모든 드럼 연주의 첫걸음, 루디먼트 1번이에요.',
      how: ['스틱은 엄지와 검지로 앞에서 1/3 지점을 잡고, 나머지 손가락은 가볍게 감싸요.', '두 스틱이 같은 높이에서 떨어지게, 소리 크기도 같게.', '4분 → 8분 → 셋잇단 → 16분으로 리듬을 바꿔 보세요.'],
      tips: ['스틱을 내리친 뒤 튀어 오르는 힘을 이용해요. 꽉 쥐면 빨리 지쳐요.', '연습 패드나 책 위에서 해도 좋아요.'],
      src: 'PAS 40 International Drum Rudiments #1 Single Stroke Roll',
      gen: o => ({ grid: G[o.rh], slots: sticking('R L', 8, G[o.rh]) }) },
    { id: 'd-double', cat: 'd-rud', level: 2, ko: '더블 스트로크 (R R L L)', rh: '16', rhs: ['8', '16'], tempo: [50, 100], opts: {},
      goal: '한 손으로 두 번씩. 손목으로 한 번, 튀어 오르는 스틱을 손가락으로 한 번 더 받아 쳐요.',
      how: ['R R L L 을 반복해요. 두 번째 음이 첫 음만큼 크게 나야 해요.', '느린 템포에서는 손목 두 번, 빨라지면 손목 한 번 + 손가락 한 번.'],
      tips: ['두 번째 음이 작아지는 것이 가장 흔한 실수예요. 두 번째를 살짝 더 세게 친다는 느낌으로.'],
      src: 'PAS 40 International Drum Rudiments #6 Double Stroke Open Roll',
      gen: o => ({ grid: G[o.rh], slots: sticking('R R L L', 8, G[o.rh]) }) },
    { id: 'd-para', cat: 'd-rud', level: 2, ko: '싱글 패러디들 (R L R R · L R L L)', rh: '16', rhs: ['8', '16'], tempo: [50, 110], opts: {},
      goal: '싱글 두 번 + 더블 한 번. 첫 음에 액센트를 두면 리드 손이 저절로 바뀌어요.',
      how: ['R> L R R · L> R L L. 액센트(>)는 크게, 나머지는 작게.', '액센트 음은 스틱을 높이 들고, 작은 음은 낮게 (높이로 크기를 조절).'],
      tips: ['패러디들을 하이햇(오른손) · 스네어(왼손)로 옮겨 치면 그대로 그루브가 돼요.'],
      src: 'PAS 40 International Drum Rudiments #16 Single Paradiddle',
      gen: o => ({ grid: G[o.rh], slots: sticking('R> L R R L> R L L', 8, G[o.rh]) }) },
    { id: 'd-five', cat: 'd-rud', level: 3, ko: '5 스트로크 롤 (R R L L R>)', rh: '16', tempo: [50, 100], opts: {},
      goal: '더블 두 번 뒤 액센트 한 번으로 끝나는 짧은 롤. 필인의 끝을 마무리할 때 많이 써요.',
      how: ['R R L L R> 쉬고, L L R R L> 쉬고. 액센트 뒤의 쉼을 꼭 지켜요.'],
      tips: ['더블이 고르게 나와야 롤이 매끄러워요. 먼저 더블 스트로크를 충분히.'],
      src: 'PAS 40 International Drum Rudiments #10 Five Stroke Roll',
      gen: () => ({ grid: 0.25, slots: sticking('R R L L R> - - - L L R R L> - - -', 8, 0.25) }) },
    { id: 'd-accent', cat: 'd-ctrl', level: 3, ko: '액센트 옮기기 (16분 한 칸씩)', rh: '16', tempo: [50, 100], opts: {},
      goal: '16분음표 네 개 중 액센트를 한 마디씩 1 → e → & → a 자리로 옮겨요. 센 음과 여린 음을 손이 구분하게 만들어요.',
      how: ['R L R L 을 계속 치면서, 마디마다 액센트 자리만 바꿔요.', '액센트는 스틱을 높이(업 스트로크 준비), 탭은 낮게.'],
      tips: ['액센트 다음 음이 같이 커지지 않도록, 액센트를 친 스틱은 낮은 자리에서 멈춰요 (다운 스트로크).'],
      src: 'Joe Morello 《Master Studies》 · George L. Stone 《Stick Control》 액센트 연습',
      gen: () => { const slots = []; for (let bar = 0; bar < 4; bar++) for (let i = 0; i < 16; i++) slots.push({ hits: [hit('snare', { acc: i % 4 === bar })], st: i % 2 ? 'L' : 'R' }); return { grid: 0.25, slots }; } },
    { id: 'd-8beat', cat: 'd-groove', level: 1, ko: '8비트 기본 그루브', tempo: [60, 120], opts: {},
      goal: '하이햇 8분음표, 스네어 2 · 4박, 킥 1 · 3박. 대부분의 팝 · 록이 이 리듬 위에 있어요.',
      how: ['오른손은 하이햇을 8분음표로 계속.', '왼손은 2 · 4박에 스네어, 오른발은 1 · 3박에 킥.', '하이햇과 스네어 · 킥이 겹치는 자리는 동시에 떨어지게.'],
      tips: ['손이 먼저 익숙해지면 킥을 더해요. 한 번에 다 하려고 하지 않아도 돼요.', '2 · 4박 스네어가 곡의 박을 잡아 줘요. 스네어를 조금 더 크게.'],
      src: 'Tommy Igoe 《Groove Essentials》 · 록 기본 비트',
      gen: () => ({ grid: 0.5, slots: groove(16, { hat: range(0, 16), snare: [2, 6, 10, 14], kick: [0, 4, 8, 12] }) }) },
    { id: 'd-8kick', cat: 'd-groove', level: 2, ko: '8비트 킥 변형', tempo: [60, 120], opts: { kick: 'v2' },
      goal: '손은 8비트 그대로 두고 킥 자리만 바꿔요. 손발을 따로 움직이는 첫 연습이에요.',
      how: ['위에서 킥 모양을 하나 골라요.', '하이햇 8분음표와 스네어 2 · 4박은 절대 바꾸지 않아요.'],
      tips: ['킥이 "&"(뒤 8분) 자리에 올 때 하이햇과 정확히 겹치는지 들어 보세요.'],
      src: 'Tommy Igoe 《Groove Essentials》 · 킥 변형 (손발 독립 기초)',
      gen: o => { const k = KICKS[o.kick] || KICKS.v1; return { grid: 0.5, slots: groove(16, { hat: range(0, 16), snare: [2, 6, 10, 14], kick: k.concat(k.map(x => x + 8)) }) }; } },
    { id: 'd-16beat', cat: 'd-groove', level: 3, ko: '16비트 그루브 (한 손 하이햇)', tempo: [60, 100], opts: {},
      goal: '하이햇을 한 손으로 16분음표, 8분 자리에 액센트. 킥은 1 · 2& · 3 · 3& 로 R&B · 펑크 느낌을 내요.',
      how: ['오른손 하이햇 16분: 액센트(8분 자리)는 스틱 어깨로, 나머지는 끝으로 가볍게.', '스네어 2 · 4박, 킥 1 · 2& · 3 · 3&.'],
      tips: ['16분 하이햇이 힘들면 먼저 8분으로 치다가 사이를 채워 가요.'],
      src: 'Tommy Igoe 《Groove Essentials》 · 16비트',
      gen: () => ({ grid: 0.25, slots: groove(32, { hat: range(0, 32).map(i => [i, { acc: i % 2 === 0 }]), snare: [4, 12, 20, 28], kick: [0, 6, 8, 10, 16, 22, 24, 26] }) }) },
    { id: 'd-ghost', cat: 'd-groove', level: 4, ko: '고스트 노트 그루브', tempo: [60, 100], opts: {},
      goal: '백비트 스네어 사이에 아주 작은 고스트 노트( )를 넣어요. 펑크 · 네오소울 그루브의 비밀이에요.',
      how: ['하이햇 8분(오른손), 2 · 4박 스네어는 크게(왼손).', '괄호 음은 스틱을 1~2cm 높이에서 떨어뜨리듯 아주 작게.'],
      tips: ['고스트 노트가 들릴 듯 말 듯해야 백비트가 더 커 보여요.'],
      src: 'David Garibaldi 《Future Sounds》 · 펑크 고스트 노트',
      gen: () => ({ grid: 0.25, slots: groove(32, { hat: range(0, 32, 2), snare: [[4, { acc: true }], [12, { acc: true }], [20, { acc: true }], [28, { acc: true }], [3, { ghost: true }], [9, { ghost: true }], [11, { ghost: true }], [14, { ghost: true }], [19, { ghost: true }], [25, { ghost: true }], [27, { ghost: true }], [30, { ghost: true }]], kick: [0, 8, 10, 16, 22, 24] }) }) },
    { id: 'd-swing', cat: 'd-groove', level: 4, ko: '스윙 라이드 (재즈 타임)', tempo: [80, 180], opts: {},
      goal: '라이드 심벌 "칭 · 칭-가 · 칭 · 칭-가" 와 2 · 4박 하이햇 페달. 재즈 드럼의 기본 타임 키핑이에요.',
      how: ['라이드: 1박, 2박 + 2박의 셋잇단 마지막, 3박, 4박 + 셋잇단 마지막.', '왼발 하이햇은 2 · 4박에 "칙".', '킥은 아주 작게 4분음표로 (피더링).'],
      tips: ['셋잇단 마지막 음은 다음 박에 붙는 느낌으로 짧고 가볍게.'],
      src: 'John Riley 《The Art of Bop Drumming》 · 라이드 패턴',
      gen: () => ({ grid: 1 / 3, slots: groove(24, { ride: [0, 3, 5, 6, 9, 11, 12, 15, 17, 18, 21, 23], pedal: [3, 9, 15, 21], kick: [0, 3, 6, 9, 12, 15, 18, 21].map(i => [i, { ghost: true }]) }) }) },
    { id: 'd-fill', cat: 'd-fill', level: 3, ko: '16분 탐 필 (스네어 → 탐 → 플로어)', tempo: [60, 110], opts: {},
      goal: '한 마디는 8비트, 한 마디는 16분음표로 스네어 → 하이 탐 → 미드 탐 → 플로어 탐을 돌고, 크래시로 돌아와요.',
      how: ['필은 R L R L 로, 탐을 옮길 때 몸통을 살짝 돌려요.', '필 다음 첫 박에 크래시 + 킥을 함께.'],
      tips: ['필을 치는 동안 템포가 빨라지기 쉬워요. 메트로놈을 꼭 켜고.'],
      src: 'Tommy Igoe 《Groove Essentials》 · 기본 필인',
      gen: () => {
        const bar1 = groove(16, { hat: range(2, 16, 2), crash: [0], snare: [4, 12], kick: [0, 8] });
        const kinds = ['snare', 'tom1', 'tom2', 'tom3'];
        const bar2 = range(0, 16).map(i => ({ hits: [hit(kinds[Math.floor(i / 4)])], st: i % 2 ? 'L' : 'R' }));
        return { grid: 0.25, slots: bar1.concat(bar2) };
      } },
    { id: 'd-linear', cat: 'd-fill', level: 5, ko: '리니어 16비트 (손발 하나씩)', tempo: [50, 100], opts: {},
      goal: '두 소리가 절대 겹치지 않게, 킥(K) · 오른손(R) · 왼손(L)이 한 칸에 하나씩만 나와요. 손발 독립의 끝판왕 연습이에요.',
      how: ['아래 스티킹(K R L)을 먼저 입으로 말하며 익혀요.', 'R 은 하이햇, L 은 스네어 (액센트는 백비트), K 는 킥.'],
      tips: ['60 BPM 보다 느려도 괜찮아요. 한 번이라도 겹치면 템포를 내리세요.'],
      src: 'Gary Chester 《The New Breed》 · 리니어 드러밍',
      gen: () => {
        const pat = ['K', 'R', 'L', 'R', 'L>', 'R', 'K', 'R', 'K', 'R', 'L', 'R', 'L>', 'R', 'K', 'K'];
        const slots = pat.concat(pat).map(t => ({ hits: [t[0] === 'K' ? hit('kick') : t[0] === 'R' ? hit('hat') : hit('snare', { acc: t.includes('>'), ghost: !t.includes('>') })], st: t[0] }));
        return { grid: 0.25, slots };
      } }
  ];
  EX.forEach(e => { e.inst = 'drums'; });
  const ROUTINES = [
    { id: 'd-easy', inst: 'drums', ko: '입문 루틴', min: 10, desc: '싱글 · 더블로 손을 풀고 8비트와 킥 변형까지.', steps: [['d-single', 3], ['d-double', 2], ['d-8beat', 3], ['d-8kick', 2]] },
    { id: 'd-mid', inst: 'drums', ko: '중급 루틴', min: 15, desc: '패러디들 · 액센트 → 16비트 → 필인.', steps: [['d-para', 3], ['d-accent', 3], ['d-16beat', 4], ['d-fill', 5]] },
    { id: 'd-hard', inst: 'drums', ko: '고급 루틴', min: 20, desc: '롤 · 고스트 노트 · 스윙 · 리니어로 장르와 독립까지.', steps: [['d-five', 3], ['d-accent', 3], ['d-ghost', 5], ['d-swing', 5], ['d-linear', 4]] }
  ];
  GH.data.techKickVariants = KICK_KO;
  GH.data.techSources = GH.data.techSources || {};
  GH.data.techSources.drums = [
    ['Percussive Arts Society', '《PAS International Drum Rudiments》 (40가지)', '싱글 · 더블 · 패러디들 · 롤의 표준 이름과 스티킹'],
    ['George Lawrence Stone', '《Stick Control》', '스티킹 조합 · 양손 균형'],
    ['Joe Morello', '《Master Studies》', '액센트 · 탭 컨트롤'],
    ['Tommy Igoe', '《Groove Essentials》', '8비트 · 16비트 · 필인 그루브'],
    ['John Riley', '《The Art of Bop Drumming》', '스윙 라이드 · 하이햇 2 · 4'],
    ['Gary Chester', '《The New Breed》', '손발 독립 · 리니어'],
    ['실용음악과 드럼 입시', '공통 과제', '루디먼트 · 장르 그루브 · 필인 · 초견']
  ];
  GH.data.techCats = (GH.data.techCats || []).concat(CATS);
  GH.data.technique = (GH.data.technique || []).concat(EX);
  GH.data.techRoutines = (GH.data.techRoutines || []).concat(ROUTINES);
})();
