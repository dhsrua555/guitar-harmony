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
  /* ---- 더 많은 드럼 연습 ---- */
  const hitsAt = (n, list) => { const out = Array.from({ length: n }, () => ({ hits: [] })); list.forEach(([i, k, extra, st]) => { if (!out[i]) return; out[i].hits.push(hit(k, extra || {})); if (st) out[i].st = st; }); return out; };
  EX.push(
    { id: 'd-seven', cat: 'd-rud', level: 3, ko: '7 스트로크 롤 (R R L L R R L>)', rh: '16', tempo: [50, 100], opts: {},
      goal: '더블 세 번 뒤 액센트로 끝나는 롤. 5 스트로크 롤보다 길어 필인의 끝이나 크레셴도에 써요.',
      how: ['R R L L R R L> 쉬고, L L R R L L R> 쉬고.', '더블 여섯 음이 고르게, 마지막 액센트는 크게.'],
      tips: ['액센트 앞의 더블이 급해지지 않게, 메트로놈의 박 위에 액센트가 떨어지도록.'],
      src: 'PAS 40 International Drum Rudiments #11 Seven Stroke Roll',
      gen: () => ({ grid: 0.25, slots: sticking('R R L L R R L> - L L R R L L R> -', 8, 0.25) }) },
    { id: 'd-triple', cat: 'd-rud', level: 3, ko: '트리플 패러디들 (R L R L R L R R)', rh: '16', rhs: ['8', '16'], tempo: [50, 110], opts: {},
      goal: '싱글 여섯 번 + 더블 한 번. 두 박 단위로 리드 손이 바뀌어 긴 프레이즈의 스티킹에 좋아요.',
      how: ['R> L R L R L R R · L> R L R L R L L.', '첫 음 액센트, 나머지는 작게.'],
      tips: ['더블 두 음이 다음 액센트 준비예요. 스틱을 낮게 유지했다가 액센트에서 들어요.'],
      src: 'PAS 40 International Drum Rudiments #18 Triple Paradiddle',
      gen: o => ({ grid: G[o.rh], slots: sticking('R> L R L R L R R L> R L R L R L L', 8, G[o.rh]) }) },
    { id: 'd-pdd', cat: 'd-rud', level: 3, ko: '패러디들디들 (R L R R L L, 셋잇단)', rh: '8t', tempo: [50, 110], opts: {},
      goal: '싱글 두 번 + 더블 두 번을 셋잇단으로. 같은 손이 계속 리드해서 탐 필 · 셔플 필에 많이 써요.',
      how: ['R> L R R L L 을 반복, 셋잇단 두 박에 한 묶음.', '첫 음 액센트.'],
      tips: ['더블 두 개가 연달아 오니 손가락 컨트롤이 중요해요. 더블 스트로크를 먼저 충분히.'],
      src: 'PAS 40 International Drum Rudiments #19 Single Paradiddle-diddle',
      gen: () => ({ grid: 1 / 3, slots: sticking('R> L R R L L', 8, 1 / 3) }) },
    { id: 'd-sticking', cat: 'd-ctrl', level: 3, ko: '스티킹 조합 8가지 (한 마디씩)', rh: '8', tempo: [60, 140], opts: {},
      goal: '싱글 · 더블 · 패러디들 등 스티킹 여덟 가지를 한 마디씩 이어 쳐요. 어떤 조합이 와도 손이 헷갈리지 않게 만들어요.',
      how: ['마디마다 스티킹이 바뀌어요. 아래 R · L 을 소리 내어 읽으며.', '모든 음은 같은 크기로.'],
      tips: ['막히는 마디만 떼어 반복한 뒤 다시 이어 쳐요.'],
      src: 'George Lawrence Stone 《Stick Control》 식 스티킹 조합 연습',
      gen: () => { const pats = ['R L R L R L R L', 'L R L R L R L R', 'R R L L R R L L', 'L L R R L L R R', 'R L R R L R L L', 'R L L R L R R L', 'R R L R R L R L', 'R L R L R R L L']; const slots = []; pats.forEach(p => p.split(' ').forEach(t => slots.push({ hits: [hit('snare')], st: t }))); return { grid: 0.5, slots }; } },
    { id: 'd-accent-trip', cat: 'd-ctrl', level: 4, ko: '셋잇단 액센트 옮기기', rh: '8t', tempo: [60, 120], opts: {},
      goal: '셋잇단 세 음 중 액센트를 한 마디씩 첫째 → 둘째 → 셋째 자리로 옮겨요. 셔플 · 재즈 컴핑의 엇박 액센트를 손에 익혀요.',
      how: ['R L R L R L … 를 계속, 액센트 자리만 바꿔요.', '둘째 · 셋째 자리 액센트는 박과 엇갈려 어려워요. 발로 4분음표를 밟으며.'],
      tips: ['액센트가 아닌 음은 스틱을 3cm 정도 높이에서 떨어뜨리듯.'],
      src: 'Joe Morello 《Master Studies》 · 셋잇단 액센트',
      gen: () => { const slots = []; for (let bar = 0; bar < 3; bar++) for (let i = 0; i < 12; i++) slots.push({ hits: [hit('snare', { acc: i % 3 === bar })], st: i % 2 ? 'L' : 'R' }); return { grid: 1 / 3, slots }; } },
    { id: 'd-dynamics', cat: 'd-ctrl', level: 4, ko: '셈여림 조절 (p → f → p)', rh: '16', tempo: [60, 110], opts: {},
      goal: '16분음표 싱글을 치며 네 마디 동안 아주 작게(p) → 크게(f) → 다시 작게. 템포는 그대로, 크기만 바꾸는 컨트롤이에요.',
      how: ['1마디 p · 2마디 mf · 3마디 f · 4마디 mp.', '크게 칠수록 스틱을 높이 들고, 작게는 낮게.'],
      tips: ['크게 칠 때 빨라지고 작게 칠 때 느려지기 쉬워요. 메트로놈을 꼭 켜요.'],
      src: '다이내믹 컨트롤 (Joe Morello 《Master Studies》 · 스네어 교본 공통)',
      gen: () => { const vs = [0.25, 0.55, 1, 0.4]; const slots = []; for (let bar = 0; bar < 4; bar++) for (let i = 0; i < 16; i++) { const v = vs[bar] + (vs[(bar + 1) % 4] - vs[bar]) * (i / 16); slots.push({ hits: [hit('snare', { v, acc: v > 0.85, ghost: v < 0.3 })], st: i % 2 ? 'L' : 'R' }); } return { grid: 0.25, slots }; } },
    { id: 'd-halftime', cat: 'd-groove', level: 3, ko: '하프타임 그루브', tempo: [60, 110], opts: {},
      goal: '스네어가 3박에 한 번만 나와 곡이 반 속도처럼 무겁게 들리는 그루브. 발라드 · 힙합 · 록 브리지에서 많이 써요.',
      how: ['하이햇 8분, 스네어 3박, 킥 1박 · 2박 & · 4박 &.'],
      tips: ['스네어가 적으니 한 번 칠 때 크고 길게 울리게.'],
      src: 'Tommy Igoe 《Groove Essentials》 · 하프타임',
      gen: () => ({ grid: 0.25, slots: groove(32, { hat: range(0, 32, 2), snare: [8, 24], kick: [0, 6, 14, 16, 22, 30] }) }) },
    { id: 'd-shuffle', cat: 'd-groove', level: 3, ko: '블루스 셔플', tempo: [70, 130], opts: {},
      goal: '하이햇을 셋잇단의 첫째 · 셋째 음(“딴–다 딴–다”)으로. 블루스 · 로큰롤의 흔들리는 리듬이에요.',
      how: ['하이햇: 박마다 셋잇단 1 · 3번째, 스네어 2 · 4박, 킥 1 · 3박.'],
      tips: ['셋잇단 가운데 음을 입으로 “(음)” 하며 비우면 셔플이 정확해져요.'],
      src: 'Tommy Igoe 《Groove Essentials》 · 셔플',
      gen: () => ({ grid: 1 / 3, slots: groove(24, { hat: range(0, 24).filter(i => i % 3 !== 1), snare: [3, 9, 15, 21], kick: [0, 6, 12, 18] }) }) },
    { id: 'd-disco', cat: 'd-groove', level: 2, ko: '디스코 · 포 온 더 플로어', tempo: [100, 130], opts: {},
      goal: '킥을 네 박 모두에, 열린 하이햇을 8분 뒤박(&)에. 디스코 · 댄스 · 하우스의 기본이에요.',
      how: ['킥 1 · 2 · 3 · 4, 스네어 2 · 4, 하이햇은 박에서 닫고 & 에서 열어요 (o).'],
      tips: ['열린 하이햇은 다음 박에 페달을 밟아 바로 닫아야 소리가 끊겨요.'],
      src: 'Tommy Igoe 《Groove Essentials》 · 디스코',
      gen: () => ({ grid: 0.5, slots: groove(16, { hat: range(0, 16, 2), hatopen: range(1, 16, 2), snare: [2, 6, 10, 14], kick: range(0, 16, 2) }) }) },
    { id: 'd-bossa', cat: 'd-groove', level: 4, ko: '보사노바 (림 클라베 · 킥 1 · 3)', tempo: [70, 140], opts: {},
      goal: '스틱을 스네어 테두리에 눕혀 치는 림(크로스 스틱)으로 보사노바 클라베를, 킥은 “둥–(다)둥”. 라틴 재즈의 기본 그루브예요.',
      how: ['하이햇 8분(오른손), 림 클라베(왼손), 킥 1박 · 2박 끝(a) · 3박 · 4박 끝.', '두 마디가 한 묶음이에요.'],
      tips: ['킥은 크게 치지 말고 베이스 소리처럼 부드럽게.'],
      src: 'Duduka Da Fonseca 《Brazilian Rhythms for Drumset》 · 보사노바',
      gen: () => ({ grid: 0.25, slots: groove(32, { hat: range(0, 32, 2), rim: [0, 6, 12, 20, 26], kick: [0, 7, 8, 15, 16, 23, 24, 31] }) }) },
    { id: 'd-2hand', cat: 'd-groove', level: 3, ko: '16비트 양손 하이햇', tempo: [70, 110], opts: {},
      goal: '양손으로 하이햇 16분음표(R L R L), 백비트에서는 오른손이 스네어로. 빠른 16비트 · 디스코 펑크에서 써요.',
      how: ['R L R L 을 쉬지 않고, 2 · 4박 첫 음(R)만 스네어로 옮겨요.', '킥 1 · 3 · 3&.'],
      tips: ['왼손은 계속 하이햇. 오른손이 스네어로 갔다 올 때 박이 밀리지 않게.'],
      src: '16비트 투핸드 하이햇 (펑크 · R&B 드럼 교본)',
      gen: () => { const slots = hitsAt(32, range(0, 32).map(i => [i, i % 8 === 4 ? 'snare' : 'hat', i % 8 === 4 ? { acc: true } : null, i % 2 ? 'L' : 'R'])); [0, 8, 10, 16, 24, 26].forEach(i => slots[i].hits.push(hit('kick'))); return { grid: 0.25, slots }; } },
    { id: 'd-fill-trip', cat: 'd-fill', level: 4, ko: '셋잇단 탐 필', tempo: [60, 110], opts: {},
      goal: '한 마디 셔플 그루브 뒤, 셋잇단으로 스네어 → 하이 탐 → 미드 탐 → 플로어 탐을 돌아요.',
      how: ['필은 R L R · L R L … 번갈아.', '필 다음 첫 박에 크래시 + 킥.'],
      tips: ['셋잇단 필은 서두르기 쉬워요. “하나-둘-셋” 하고 세며.'],
      src: '셋잇단 필인 (Tommy Igoe 《Groove Essentials》)',
      gen: () => { const bar1 = groove(12, { hat: range(0, 12).filter(i => i % 3 !== 1 && i > 0), crash: [0], snare: [3, 9], kick: [0, 6] }); const kinds = ['snare', 'tom1', 'tom2', 'tom3']; const bar2 = range(0, 12).map(i => ({ hits: [hit(kinds[Math.floor(i / 3)])], st: i % 2 ? 'L' : 'R' })); return { grid: 1 / 3, slots: bar1.concat(bar2) }; } },
    { id: 'd-phrase4', cat: 'd-fill', level: 3, ko: '4마디 프레이즈 (그루브 3 + 필 1)', tempo: [70, 120], opts: {},
      goal: '8비트 세 마디 뒤 한 마디 필인, 그리고 크래시로 다시 시작. 실제 곡에서 드러머가 가장 많이 하는 4마디 단위예요.',
      how: ['1마디 첫 박 크래시 + 킥.', '4마디째 3 · 4박에 16분 탐 필.'],
      tips: ['마디 수를 세는 습관이 곡 구성을 따라가는 힘이 돼요.'],
      src: '4마디 프레이즈와 필 (Tommy Igoe 《Groove Essentials》)',
      gen: () => { const beat = first => groove(16, { hat: range(first ? 2 : 0, 16, 2), crash: first ? [0] : [], snare: [4, 12], kick: [0, 8, 10] }); const fillBar = groove(16, { hat: [0, 2, 4, 6], snare: [4], kick: [0] }); const kinds = ['snare', 'snare', 'tom1', 'tom1', 'tom2', 'tom2', 'tom3', 'tom3']; for (let i = 8; i < 16; i++) fillBar[i] = { hits: [hit(kinds[i - 8])], st: i % 2 ? 'L' : 'R' }; return { grid: 0.25, slots: beat(true).concat(beat(false), beat(false), fillBar) }; } },
    { id: 'd-dblkick', cat: 'd-fill', level: 5, ko: '더블 베이스 드럼 입문 (16분 킥)', tempo: [60, 120], opts: {},
      goal: '두 발로 킥을 16분음표로 번갈아(R L R L). 손은 하이햇 4분음표와 스네어 2 · 4박. 메탈 · 하드록의 더블 킥 기초예요.',
      how: ['오른발 · 왼발 번갈아, 발목을 써서 작게.', '처음엔 한 박만 16분, 나머지는 쉬며 시작해도 돼요.'],
      tips: ['발에 힘이 들어가면 손까지 굳어요. 손은 가볍게, 발은 고르게.'],
      src: '더블 베이스 드럼 (메탈 · 록 드럼 교본 공통)',
      gen: () => { const slots = hitsAt(32, range(0, 32).map(i => [i, 'kick', null, i % 2 ? 'L' : 'R'])); range(0, 32, 4).forEach(i => slots[i].hits.push(hit('hat'))); [4, 12, 20, 28].forEach(i => slots[i].hits.push(hit('snare', { acc: true }))); return { grid: 0.25, slots }; } }
  );
  EX.forEach(e => { e.inst = 'drums'; e.handsOnly = e.cat === 'd-rud' || e.cat === 'd-ctrl'; });   /* 손만 쓰는 스트로크 연습: 스네어(연습 패드)만 */
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
