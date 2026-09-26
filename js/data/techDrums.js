/* 기본기 연습 · 드럼 (루디먼트 · 컨트롤 · 찹 · 그루브 · 필인 · 컴비네이션)
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
    { id: 'd-chop', inst: 'drums', ko: '찹 (스피드 · 손 패턴)', en: 'CHOPS', icon: 'bolt', desc: '짧게 달렸다 멈추는 버스트, 식스 스트로크 · 인버티드 더블 같은 빠른 손 패턴, 박을 가로지르는 액센트.' },
    { id: 'd-groove', inst: 'drums', ko: '그루브', en: 'GROOVE', icon: 'backing', desc: '8비트 · 16비트 · 고스트 노트 · 스윙. 곡을 받쳐 주는 기본 리듬들이에요.' },
    { id: 'd-fill', inst: 'drums', ko: '필인 · 손발 독립', en: 'FILL · INDEPENDENCE', icon: 'spark', desc: '탐을 도는 필인과, 손발을 한 번에 하나씩 쓰는 리니어 패턴.' },
    { id: 'd-combo', inst: 'drums', ko: '컴비네이션 (손발 조합)', en: 'COMBINATIONS', icon: 'stack', desc: '손(R · L)과 킥(K)을 한 줄로 이어 치는 조합. 3 · 4 · 6음 묶음부터 탐을 도는 조합 필까지.' }
  ];
  const EX = [
    { id: 'd-single', cat: 'd-rud', level: 1, ko: '싱글 스트로크 (R L R L)', rh: '8', rhs: ['4', '8', '8t', '16'], tempo: [60, 120], opts: {},
      goal: '오른손 · 왼손을 한 번씩 번갈아 쳐요. 모든 드럼 연주의 첫걸음, 루디먼트 1번이에요.',
      how: ['스틱은 엄지와 검지로 앞에서 1/3 지점을 잡고, 나머지 손가락은 가볍게 감싸요.', '두 스틱이 같은 높이에서 떨어지게, 소리 크기도 같게.', '4분 → 8분 → 셋잇단 → 16분으로 리듬을 바꿔 보세요.'],
      tips: ['스틱을 내리친 뒤 튀어 오르는 힘을 이용해요. 꽉 쥐면 빨리 지쳐요.', '연습 패드나 책 위에서 해도 좋아요.'],
      gen: o => ({ grid: G[o.rh], slots: sticking('R L', 8, G[o.rh]) }) },
    { id: 'd-double', cat: 'd-rud', level: 2, ko: '더블 스트로크 (R R L L)', rh: '16', rhs: ['8', '16'], tempo: [50, 100], opts: {},
      goal: '한 손으로 두 번씩. 손목으로 한 번, 튀어 오르는 스틱을 손가락으로 한 번 더 받아 쳐요.',
      how: ['R R L L 을 반복해요. 두 번째 음이 첫 음만큼 크게 나야 해요.', '느린 템포에서는 손목 두 번, 빨라지면 손목 한 번 + 손가락 한 번.'],
      tips: ['두 번째 음이 작아지는 것이 가장 흔한 실수예요. 두 번째를 살짝 더 세게 친다는 느낌으로.'],
      gen: o => ({ grid: G[o.rh], slots: sticking('R R L L', 8, G[o.rh]) }) },
    { id: 'd-para', cat: 'd-rud', level: 2, ko: '싱글 패러디들 (R L R R · L R L L)', rh: '16', rhs: ['8', '16'], tempo: [50, 110], opts: {},
      goal: '싱글 두 번 + 더블 한 번. 첫 음에 액센트를 두면 리드 손이 저절로 바뀌어요.',
      how: ['R> L R R · L> R L L. 액센트(>)는 크게, 나머지는 작게.', '액센트 음은 스틱을 높이 들고, 작은 음은 낮게 (높이로 크기를 조절).'],
      tips: ['패러디들을 하이햇(오른손) · 스네어(왼손)로 옮겨 치면 그대로 그루브가 돼요.'],
      gen: o => ({ grid: G[o.rh], slots: sticking('R> L R R L> R L L', 8, G[o.rh]) }) },
    { id: 'd-five', cat: 'd-rud', level: 3, ko: '5 스트로크 롤 (R R L L R>)', rh: '16', tempo: [50, 100], opts: {},
      goal: '더블 두 번 뒤 액센트 한 번으로 끝나는 짧은 롤. 필인의 끝을 마무리할 때 많이 써요.',
      how: ['R R L L R> 쉬고, L L R R L> 쉬고. 액센트 뒤의 쉼을 꼭 지켜요.'],
      tips: ['더블이 고르게 나와야 롤이 매끄러워요. 먼저 더블 스트로크를 충분히.'],
      gen: () => ({ grid: 0.25, slots: sticking('R R L L R> - - - L L R R L> - - -', 8, 0.25) }) },
    { id: 'd-accent', cat: 'd-ctrl', level: 3, ko: '액센트 옮기기 (16분 한 칸씩)', rh: '16', tempo: [50, 100], opts: {},
      goal: '16분음표 네 개 중 액센트를 한 마디씩 1 → e → & → a 자리로 옮겨요. 센 음과 여린 음을 손이 구분하게 만들어요.',
      how: ['R L R L 을 계속 치면서, 마디마다 액센트 자리만 바꿔요.', '액센트는 스틱을 높이(업 스트로크 준비), 탭은 낮게.'],
      tips: ['액센트 다음 음이 같이 커지지 않도록, 액센트를 친 스틱은 낮은 자리에서 멈춰요 (다운 스트로크).'],
      gen: () => { const slots = []; for (let bar = 0; bar < 4; bar++) for (let i = 0; i < 16; i++) slots.push({ hits: [hit('snare', { acc: i % 4 === bar })], st: i % 2 ? 'L' : 'R' }); return { grid: 0.25, slots }; } },
    { id: 'd-8beat', cat: 'd-groove', level: 1, ko: '8비트 기본 그루브', tempo: [60, 120], opts: {},
      goal: '하이햇 8분음표, 스네어 2 · 4박, 킥 1 · 3박. 대부분의 팝 · 록이 이 리듬 위에 있어요.',
      how: ['오른손은 하이햇을 8분음표로 계속.', '왼손은 2 · 4박에 스네어, 오른발은 1 · 3박에 킥.', '하이햇과 스네어 · 킥이 겹치는 자리는 동시에 떨어지게.'],
      tips: ['손이 먼저 익숙해지면 킥을 더해요. 한 번에 다 하려고 하지 않아도 돼요.', '2 · 4박 스네어가 곡의 박을 잡아 줘요. 스네어를 조금 더 크게.'],
      gen: () => ({ grid: 0.5, slots: groove(16, { hat: range(0, 16), snare: [2, 6, 10, 14], kick: [0, 4, 8, 12] }) }) },
    { id: 'd-8kick', cat: 'd-groove', level: 2, ko: '8비트 킥 변형', tempo: [60, 120], opts: { kick: 'v2' },
      goal: '손은 8비트 그대로 두고 킥 자리만 바꿔요. 손발을 따로 움직이는 첫 연습이에요.',
      how: ['위에서 킥 모양을 하나 골라요.', '하이햇 8분음표와 스네어 2 · 4박은 절대 바꾸지 않아요.'],
      tips: ['킥이 "&"(뒤 8분) 자리에 올 때 하이햇과 정확히 겹치는지 들어 보세요.'],
      gen: o => { const k = KICKS[o.kick] || KICKS.v1; return { grid: 0.5, slots: groove(16, { hat: range(0, 16), snare: [2, 6, 10, 14], kick: k.concat(k.map(x => x + 8)) }) }; } },
    { id: 'd-16beat', cat: 'd-groove', level: 3, ko: '16비트 그루브 (한 손 하이햇)', tempo: [60, 100], opts: {},
      goal: '하이햇을 한 손으로 16분음표, 8분 자리에 액센트. 킥은 1 · 2& · 3 · 3& 로 R&B · 펑크 느낌을 내요.',
      how: ['오른손 하이햇 16분: 액센트(8분 자리)는 스틱 어깨로, 나머지는 끝으로 가볍게.', '스네어 2 · 4박, 킥 1 · 2& · 3 · 3&.'],
      tips: ['16분 하이햇이 힘들면 먼저 8분으로 치다가 사이를 채워 가요.'],
      gen: () => ({ grid: 0.25, slots: groove(32, { hat: range(0, 32).map(i => [i, { acc: i % 2 === 0 }]), snare: [4, 12, 20, 28], kick: [0, 6, 8, 10, 16, 22, 24, 26] }) }) },
    { id: 'd-ghost', cat: 'd-groove', level: 4, ko: '고스트 노트 그루브', tempo: [60, 100], opts: {},
      goal: '백비트 스네어 사이에 아주 작은 고스트 노트( )를 넣어요. 펑크 · 네오소울 그루브의 비밀이에요.',
      how: ['하이햇 8분(오른손), 2 · 4박 스네어는 크게(왼손).', '괄호 음은 스틱을 1~2cm 높이에서 떨어뜨리듯 아주 작게.'],
      tips: ['고스트 노트가 들릴 듯 말 듯해야 백비트가 더 커 보여요.'],
      gen: () => ({ grid: 0.25, slots: groove(32, { hat: range(0, 32, 2), snare: [[4, { acc: true }], [12, { acc: true }], [20, { acc: true }], [28, { acc: true }], [3, { ghost: true }], [9, { ghost: true }], [11, { ghost: true }], [14, { ghost: true }], [19, { ghost: true }], [25, { ghost: true }], [27, { ghost: true }], [30, { ghost: true }]], kick: [0, 8, 10, 16, 22, 24] }) }) },
    { id: 'd-swing', cat: 'd-groove', level: 4, ko: '스윙 라이드 (재즈 타임)', tempo: [80, 180], opts: {},
      goal: '라이드 심벌 "칭 · 칭-가 · 칭 · 칭-가" 와 2 · 4박 하이햇 페달. 재즈 드럼의 기본 타임 키핑이에요.',
      how: ['라이드: 1박, 2박 + 2박의 셋잇단 마지막, 3박, 4박 + 셋잇단 마지막.', '왼발 하이햇은 2 · 4박에 "칙".', '킥은 아주 작게 4분음표로 (피더링).'],
      tips: ['셋잇단 마지막 음은 다음 박에 붙는 느낌으로 짧고 가볍게.'],
      gen: () => ({ grid: 1 / 3, slots: groove(24, { ride: [0, 3, 5, 6, 9, 11, 12, 15, 17, 18, 21, 23], pedal: [3, 9, 15, 21], kick: [0, 3, 6, 9, 12, 15, 18, 21].map(i => [i, { ghost: true }]) }) }) },
    { id: 'd-fill', cat: 'd-fill', level: 3, ko: '16분 탐 필 (스네어 → 탐 → 플로어)', tempo: [60, 110], opts: {},
      goal: '한 마디는 8비트, 한 마디는 16분음표로 스네어 → 하이 탐 → 미드 탐 → 플로어 탐을 돌고, 크래시로 돌아와요.',
      how: ['필은 R L R L 로, 탐을 옮길 때 몸통을 살짝 돌려요.', '필 다음 첫 박에 크래시 + 킥을 함께.'],
      tips: ['필을 치는 동안 템포가 빨라지기 쉬워요. 메트로놈을 꼭 켜고.'],
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
      gen: () => ({ grid: 0.25, slots: sticking('R R L L R R L> - L L R R L L R> -', 8, 0.25) }) },
    { id: 'd-triple', cat: 'd-rud', level: 3, ko: '트리플 패러디들 (R L R L R L R R)', rh: '16', rhs: ['8', '16'], tempo: [50, 110], opts: {},
      goal: '싱글 여섯 번 + 더블 한 번. 두 박 단위로 리드 손이 바뀌어 긴 프레이즈의 스티킹에 좋아요.',
      how: ['R> L R L R L R R · L> R L R L R L L.', '첫 음 액센트, 나머지는 작게.'],
      tips: ['더블 두 음이 다음 액센트 준비예요. 스틱을 낮게 유지했다가 액센트에서 들어요.'],
      gen: o => ({ grid: G[o.rh], slots: sticking('R> L R L R L R R L> R L R L R L L', 8, G[o.rh]) }) },
    { id: 'd-pdd', cat: 'd-rud', level: 3, ko: '패러디들디들 (R L R R L L, 셋잇단)', rh: '8t', tempo: [50, 110], opts: {},
      goal: '싱글 두 번 + 더블 두 번을 셋잇단으로. 같은 손이 계속 리드해서 탐 필 · 셔플 필에 많이 써요.',
      how: ['R> L R R L L 을 반복, 셋잇단 두 박에 한 묶음.', '첫 음 액센트.'],
      tips: ['더블 두 개가 연달아 오니 손가락 컨트롤이 중요해요. 더블 스트로크를 먼저 충분히.'],
      gen: () => ({ grid: 1 / 3, slots: sticking('R> L R R L L', 8, 1 / 3) }) },
    { id: 'd-sticking', cat: 'd-ctrl', level: 3, ko: '스티킹 조합 8가지 (한 마디씩)', rh: '8', tempo: [60, 140], opts: {},
      goal: '싱글 · 더블 · 패러디들 등 스티킹 여덟 가지를 한 마디씩 이어 쳐요. 어떤 조합이 와도 손이 헷갈리지 않게 만들어요.',
      how: ['마디마다 스티킹이 바뀌어요. 아래 R · L 을 소리 내어 읽으며.', '모든 음은 같은 크기로.'],
      tips: ['막히는 마디만 떼어 반복한 뒤 다시 이어 쳐요.'],
      gen: () => { const pats = ['R L R L R L R L', 'L R L R L R L R', 'R R L L R R L L', 'L L R R L L R R', 'R L R R L R L L', 'R L L R L R R L', 'R R L R R L R L', 'R L R L R R L L']; const slots = []; pats.forEach(p => p.split(' ').forEach(t => slots.push({ hits: [hit('snare')], st: t }))); return { grid: 0.5, slots }; } },
    { id: 'd-accent-trip', cat: 'd-ctrl', level: 4, ko: '셋잇단 액센트 옮기기', rh: '8t', tempo: [60, 120], opts: {},
      goal: '셋잇단 세 음 중 액센트를 한 마디씩 첫째 → 둘째 → 셋째 자리로 옮겨요. 셔플 · 재즈 컴핑의 엇박 액센트를 손에 익혀요.',
      how: ['R L R L R L … 를 계속, 액센트 자리만 바꿔요.', '둘째 · 셋째 자리 액센트는 박과 엇갈려 어려워요. 발로 4분음표를 밟으며.'],
      tips: ['액센트가 아닌 음은 스틱을 3cm 정도 높이에서 떨어뜨리듯.'],
      gen: () => { const slots = []; for (let bar = 0; bar < 3; bar++) for (let i = 0; i < 12; i++) slots.push({ hits: [hit('snare', { acc: i % 3 === bar })], st: i % 2 ? 'L' : 'R' }); return { grid: 1 / 3, slots }; } },
    { id: 'd-dynamics', cat: 'd-ctrl', level: 4, ko: '셈여림 조절 (p → f → p)', rh: '16', tempo: [60, 110], opts: {},
      goal: '16분음표 싱글을 치며 네 마디 동안 아주 작게(p) → 크게(f) → 다시 작게. 템포는 그대로, 크기만 바꾸는 컨트롤이에요.',
      how: ['1마디 p · 2마디 mf · 3마디 f · 4마디 mp.', '크게 칠수록 스틱을 높이 들고, 작게는 낮게.'],
      tips: ['크게 칠 때 빨라지고 작게 칠 때 느려지기 쉬워요. 메트로놈을 꼭 켜요.'],
      gen: () => { const vs = [0.25, 0.55, 1, 0.4]; const slots = []; for (let bar = 0; bar < 4; bar++) for (let i = 0; i < 16; i++) { const v = vs[bar] + (vs[(bar + 1) % 4] - vs[bar]) * (i / 16); slots.push({ hits: [hit('snare', { v, acc: v > 0.85, ghost: v < 0.3 })], st: i % 2 ? 'L' : 'R' }); } return { grid: 0.25, slots }; } },
    { id: 'd-halftime', cat: 'd-groove', level: 3, ko: '하프타임 그루브', tempo: [60, 110], opts: {},
      goal: '스네어가 3박에 한 번만 나와 곡이 반 속도처럼 무겁게 들리는 그루브. 발라드 · 힙합 · 록 브리지에서 많이 써요.',
      how: ['하이햇 8분, 스네어 3박, 킥 1박 · 2박 & · 4박 &.'],
      tips: ['스네어가 적으니 한 번 칠 때 크고 길게 울리게.'],
      gen: () => ({ grid: 0.25, slots: groove(32, { hat: range(0, 32, 2), snare: [8, 24], kick: [0, 6, 14, 16, 22, 30] }) }) },
    { id: 'd-shuffle', cat: 'd-groove', level: 3, ko: '블루스 셔플', tempo: [70, 130], opts: {},
      goal: '하이햇을 셋잇단의 첫째 · 셋째 음(“딴–다 딴–다”)으로. 블루스 · 로큰롤의 흔들리는 리듬이에요.',
      how: ['하이햇: 박마다 셋잇단 1 · 3번째, 스네어 2 · 4박, 킥 1 · 3박.'],
      tips: ['셋잇단 가운데 음을 입으로 “(음)” 하며 비우면 셔플이 정확해져요.'],
      gen: () => ({ grid: 1 / 3, slots: groove(24, { hat: range(0, 24).filter(i => i % 3 !== 1), snare: [3, 9, 15, 21], kick: [0, 6, 12, 18] }) }) },
    { id: 'd-disco', cat: 'd-groove', level: 2, ko: '디스코 · 포 온 더 플로어', tempo: [100, 130], opts: {},
      goal: '킥을 네 박 모두에, 열린 하이햇을 8분 뒤박(&)에. 디스코 · 댄스 · 하우스의 기본이에요.',
      how: ['킥 1 · 2 · 3 · 4, 스네어 2 · 4, 하이햇은 박에서 닫고 & 에서 열어요 (o).'],
      tips: ['열린 하이햇은 다음 박에 페달을 밟아 바로 닫아야 소리가 끊겨요.'],
      gen: () => ({ grid: 0.5, slots: groove(16, { hat: range(0, 16, 2), hatopen: range(1, 16, 2), snare: [2, 6, 10, 14], kick: range(0, 16, 2) }) }) },
    { id: 'd-bossa', cat: 'd-groove', level: 4, ko: '보사노바 (림 클라베 · 킥 1 · 3)', tempo: [70, 140], opts: {},
      goal: '스틱을 스네어 테두리에 눕혀 치는 림(크로스 스틱)으로 보사노바 클라베를, 킥은 “둥–(다)둥”. 라틴 재즈의 기본 그루브예요.',
      how: ['하이햇 8분(오른손), 림 클라베(왼손), 킥 1박 · 2박 끝(a) · 3박 · 4박 끝.', '두 마디가 한 묶음이에요.'],
      tips: ['킥은 크게 치지 말고 베이스 소리처럼 부드럽게.'],
      gen: () => ({ grid: 0.25, slots: groove(32, { hat: range(0, 32, 2), rim: [0, 6, 12, 20, 26], kick: [0, 7, 8, 15, 16, 23, 24, 31] }) }) },
    { id: 'd-2hand', cat: 'd-groove', level: 3, ko: '16비트 양손 하이햇', tempo: [70, 110], opts: {},
      goal: '양손으로 하이햇 16분음표(R L R L), 백비트에서는 오른손이 스네어로. 빠른 16비트 · 디스코 펑크에서 써요.',
      how: ['R L R L 을 쉬지 않고, 2 · 4박 첫 음(R)만 스네어로 옮겨요.', '킥 1 · 3 · 3&.'],
      tips: ['왼손은 계속 하이햇. 오른손이 스네어로 갔다 올 때 박이 밀리지 않게.'],
      gen: () => { const slots = hitsAt(32, range(0, 32).map(i => [i, i % 8 === 4 ? 'snare' : 'hat', i % 8 === 4 ? { acc: true } : null, i % 2 ? 'L' : 'R'])); [0, 8, 10, 16, 24, 26].forEach(i => slots[i].hits.push(hit('kick'))); return { grid: 0.25, slots }; } },
    { id: 'd-fill-trip', cat: 'd-fill', level: 4, ko: '셋잇단 탐 필', tempo: [60, 110], opts: {},
      goal: '한 마디 셔플 그루브 뒤, 셋잇단으로 스네어 → 하이 탐 → 미드 탐 → 플로어 탐을 돌아요.',
      how: ['필은 R L R · L R L … 번갈아.', '필 다음 첫 박에 크래시 + 킥.'],
      tips: ['셋잇단 필은 서두르기 쉬워요. “하나-둘-셋” 하고 세며.'],
      gen: () => { const bar1 = groove(12, { hat: range(0, 12).filter(i => i % 3 !== 1 && i > 0), crash: [0], snare: [3, 9], kick: [0, 6] }); const kinds = ['snare', 'tom1', 'tom2', 'tom3']; const bar2 = range(0, 12).map(i => ({ hits: [hit(kinds[Math.floor(i / 3)])], st: i % 2 ? 'L' : 'R' })); return { grid: 1 / 3, slots: bar1.concat(bar2) }; } },
    { id: 'd-phrase4', cat: 'd-fill', level: 3, ko: '4마디 프레이즈 (그루브 3 + 필 1)', tempo: [70, 120], opts: {},
      goal: '8비트 세 마디 뒤 한 마디 필인, 그리고 크래시로 다시 시작. 실제 곡에서 드러머가 가장 많이 하는 4마디 단위예요.',
      how: ['1마디 첫 박 크래시 + 킥.', '4마디째 3 · 4박에 16분 탐 필.'],
      tips: ['마디 수를 세는 습관이 곡 구성을 따라가는 힘이 돼요.'],
      gen: () => { const beat = first => groove(16, { hat: range(first ? 2 : 0, 16, 2), crash: first ? [0] : [], snare: [4, 12], kick: [0, 8, 10] }); const fillBar = groove(16, { hat: [0, 2, 4, 6], snare: [4], kick: [0] }); const kinds = ['snare', 'snare', 'tom1', 'tom1', 'tom2', 'tom2', 'tom3', 'tom3']; for (let i = 8; i < 16; i++) fillBar[i] = { hits: [hit(kinds[i - 8])], st: i % 2 ? 'L' : 'R' }; return { grid: 0.25, slots: beat(true).concat(beat(false), beat(false), fillBar) }; } },
    { id: 'd-dblkick', cat: 'd-fill', level: 5, ko: '더블 베이스 드럼 입문 (16분 킥)', tempo: [60, 120], opts: {},
      goal: '두 발로 킥을 16분음표로 번갈아(R L R L). 손은 하이햇 4분음표와 스네어 2 · 4박. 메탈 · 하드록의 더블 킥 기초예요.',
      how: ['오른발 · 왼발 번갈아, 발목을 써서 작게.', '처음엔 한 박만 16분, 나머지는 쉬며 시작해도 돼요.'],
      tips: ['발에 힘이 들어가면 손까지 굳어요. 손은 가볍게, 발은 고르게.'],
      gen: () => { const slots = hitsAt(32, range(0, 32).map(i => [i, 'kick', null, i % 2 ? 'L' : 'R'])); range(0, 32, 4).forEach(i => slots[i].hits.push(hit('hat'))); [4, 12, 20, 28].forEach(i => slots[i].hits.push(hit('snare', { acc: true }))); return { grid: 0.25, slots }; } }
  );
  /* ---- 찹 · 컴비네이션 ---- */
  /* 손발 조합: R · L 은 손(북은 drumAt(칸)으로, 없으면 스네어), K 는 킥, '>' 는 액센트, '-' 는 쉼 */
  function combo(str, beatsTotal, grid, drumAt) {
    const toks = str.trim().split(/\s+/);
    return range(0, Math.round(beatsTotal / grid)).map(i => {
      const t = toks[i % toks.length];
      if (t === '-') return { hits: [] };
      const acc = t.includes('>'); const s = t.replace('>', '');
      return s === 'K' ? { hits: [hit('kick', { acc })], st: 'K' } : { hits: [hit(drumAt ? drumAt(i) : 'snare', { acc })], st: s };
    });
  }
  const around = order => i => order[Math.floor(i / 3) % order.length];   /* 셋잇단 한 박마다 북 옮기기 */
  EX.push(
    { id: 'd-burst', cat: 'd-chop', level: 2, handsOnly: true, ko: '싱글 버스트 늘려가기 (1박 → 2박 → 3박)', tempo: [70, 150], opts: {},
      goal: '16분음표 싱글로 짧게 달리고 멈추기를 반복하며, 달리는 길이를 1박 → 2박 → 3박으로 늘려요. 빠른 템포에서 힘을 빼는 법을 익히는 스피드 훈련이에요.',
      how: ['달린 뒤 다음 박 첫 음에 액센트를 찍고 멈춰요.', '쉬는 동안 어깨 · 손목에 들어간 힘을 풀어요.', '1박 버스트가 편한 템포에서 시작해 스피드 트레이너로 올려요.'],
      tips: ['빨라질수록 스틱을 낮게. 높이 들면 느려져요.', '3박 버스트가 흐트러지면 템포를 내리고 1박부터 다시.'],
      gen: () => ({ grid: 0.25, slots: sticking('R L R L R> - - - L R L R L> - - - R L R L R L R L R> - - - - - - - L R L R L R L R L> - - - - - - - R L R L R L R L R L R L R> - - -', 16, 0.25) }) },
    { id: 'd-single7', cat: 'd-chop', level: 3, handsOnly: true, ko: '싱글 스트로크 세븐 (셋잇단 R L R L R L R>)', tempo: [60, 130], opts: {},
      goal: '셋잇단 싱글 여섯 음을 달린 뒤 일곱째 음을 3박 위 액센트로 끊어요. 짧은 필의 끝을 "딱" 맺는 찹이에요.',
      how: ['R L R L R L R> 뒤 남은 박은 쉬고, 다음 마디는 L 로 시작해 L> 로 끝나요.', '액센트 뒤의 쉼을 정확히 세요.'],
      tips: ['여섯 음이 고르게 들려야 해요. 오른손만 커지지 않게.'],
      gen: () => ({ grid: 1 / 3, slots: sticking('R L R L R L R> - - - - - L R L R L R L> - - - - -', 8, 1 / 3) }) },
    { id: 'd-six', cat: 'd-chop', level: 3, handsOnly: true, ko: '식스 스트로크 롤 (R L L R R L)', tempo: [50, 110], opts: {},
      goal: '싱글 - 더블 - 더블 - 싱글. 양 끝 싱글에 액센트를 둬 "딱 드르르 딱". 빠르게 치면 한 덩어리 롤처럼 들리는 대표적인 찹이에요.',
      how: ['R> L L R R L> 을 셋잇단으로 반복. 가운데 더블 두 개는 작게.', '액센트(첫 R · 끝 L)는 스틱을 높이, 더블은 낮게.'],
      tips: ['끝 L 액센트가 약해지기 쉬워요. 왼손 액센트만 따로 연습해 두면 좋아요.'],
      gen: () => ({ grid: 1 / 3, slots: sticking('R> L L R R L>', 8, 1 / 3) }) },
    { id: 'd-ladder', cat: 'd-chop', level: 4, handsOnly: true, ko: '스트로크 사다리 (싱글 → 더블 → 트리플)', tempo: [50, 100], opts: {},
      goal: '셋잇단 위에서 한 마디씩 싱글(R L) → 더블(R R L L) → 트리플(R R R L L L)로 한 손이 연달아 치는 수를 늘려요. 손목과 손가락 컨트롤을 함께 기르는 찹이에요.',
      how: ['마디 첫 음에만 액센트. 4마디째는 다시 싱글로 돌아와 숨을 골라요.', '더블 · 트리플의 뒤 음들이 첫 음만큼 크게 나오게.'],
      tips: ['트리플 스트로크는 손목 한 번 + 손가락 두 번. 느린 템포에서 손가락만 쓰는 연습을 먼저.'],
      gen: () => { const slots = []; ['R L R L R L R L R L R L', 'R R L L R R L L R R L L', 'R R R L L L R R R L L L', 'R L R L R L R L R L R L'].forEach(b => b.split(' ').forEach((t, i) => slots.push({ hits: [hit('snare', { acc: i === 0 })], st: t }))); return { grid: 1 / 3, slots }; } },
    { id: 'd-invdbl', cat: 'd-chop', level: 4, handsOnly: true, ko: '인버티드 더블 (R L L R · L R R L)', tempo: [50, 110], opts: {},
      goal: '더블 스트로크 순서를 뒤집어 싱글 사이에 더블을 끼워요. 박마다 리드 손이 바뀌고, 빠르게 치면 액센트가 또렷한 롤이 돼요.',
      how: ['R> L L R · L> R R L 을 16분음표로. 액센트는 박마다 첫 음.', '액센트 다음 더블(L L · R R)은 낮게, 작게.'],
      tips: ['박 끝 싱글(R · L)이 다음 액센트로 넘어가는 다리예요. 서두르지 않게.', '익숙해지면 박 끝 싱글에도 액센트를 줘 보세요.'],
      gen: () => ({ grid: 0.25, slots: sticking('R> L L R L> R R L', 8, 0.25) }) },
    { id: 'd-3over4', cat: 'd-chop', level: 4, handsOnly: true, ko: '세 칸마다 액센트 (16분 위의 3 대 4)', tempo: [60, 120], opts: {},
      goal: '16분 싱글을 치며 세 칸마다 액센트. 액센트가 박을 가로질러 흐르다 세 마디 만에 제자리로 돌아와요. 박을 잃지 않는 힘과 액센트 컨트롤을 함께 길러요.',
      how: ['R> L R L> R L R> … 액센트 손이 오른손 · 왼손 번갈아 바뀌어요.', '메트로놈 클릭(4분음표)을 들으며, 액센트에 박이 끌려가지 않게.'],
      tips: ['액센트만 따로 치면 점8분음표 리듬이에요. 먼저 액센트만 손뼉으로 쳐 봐요.'],
      gen: () => ({ grid: 0.25, slots: sticking('R L', 12, 0.25, 3) }) },
    { id: 'd-six-kit', cat: 'd-chop', level: 5, ko: '식스 스트로크 탐 돌기 (액센트 = 탐 + 킥)', tempo: [50, 100], opts: {},
      goal: '식스 스트로크 롤의 양 끝 액센트는 탐에서 킥과 함께, 가운데 더블은 스네어에서 작게. 가스펠 · 퓨전 드러머들이 즐겨 쓰는 크고 빠른 필이에요.',
      how: ['두 박에 한 묶음. 묶음마다 액센트 북이 하이 탐 → 미드 탐 → 플로어 탐 → 플로어 탐으로 내려가요.', '더블(L L · R R)은 스네어에서 고스트 노트처럼 작게.'],
      tips: ['먼저 스네어에서 식스 스트로크 롤을 고르게 친 뒤 옮겨요.', '액센트와 킥이 정확히 같이 떨어지게.'],
      gen: () => { const toms = ['tom1', 'tom2', 'tom3', 'tom3']; const slots = []; toms.forEach(tom => 'R L L R R L'.split(' ').forEach((t, i) => { const acc = i === 0 || i === 5; slots.push({ hits: acc ? [hit(tom, { acc: true }), hit('kick')] : [hit('snare', { ghost: true })], st: t }); })); return { grid: 1 / 3, slots }; } },

    { id: 'd-rlk', cat: 'd-combo', level: 2, ko: '3음 조합 R L K (셋잇단)', tempo: [60, 130], opts: {},
      goal: '오른손 · 왼손 · 킥을 셋잇단으로 한 번씩. 손발을 섞어 치는 가장 짧은 조합이자, 록 드러머들이 즐겨 쓰는 "손 두 번 + 킥" 필의 기본이에요.',
      how: ['R L K 를 입으로 "따 다 쿵" 하며 먼저 익혀요.', '오른손(R)이 늘 박 위에 떨어져요. 액센트로 박을 느껴요.', '킥은 손과 같은 크기로. 발만 커지거나 작아지지 않게.'],
      tips: ['킥을 밟은 발은 바로 떼요. 비터를 북에 붙여 두면 다음 킥이 늦어져요.', '익숙해지면 손을 탐으로 옮겨 보세요 (R L K 탐 돌기).'],
      gen: () => ({ grid: 1 / 3, slots: combo('R> L K', 8, 1 / 3) }) },
    { id: 'd-rlrk', cat: 'd-combo', level: 2, ko: '4음 조합 R L R K (16분)', tempo: [60, 120], opts: {},
      goal: '손 세 번 + 킥 한 번을 16분음표로. 한 박에 한 묶음이라 박을 잃지 않고 손발을 섞는 연습이에요.',
      how: ['R> L R K 반복. 첫 음(박)에 액센트.', '킥은 박의 마지막 16분(a) 자리. 다음 박 오른손을 끌어오는 느낌으로.'],
      tips: ['킥이 늦어지면 다음 박이 밀려요. 메트로놈 클릭이 오른손 액센트와 딱 겹치는지 들어요.'],
      gen: () => ({ grid: 0.25, slots: combo('R> L R K', 8, 0.25) }) },
    { id: 'd-rlkk', cat: 'd-combo', level: 3, ko: '킥 두 번 조합 R L K K (16분)', tempo: [50, 100], opts: {},
      goal: '손 두 번 뒤 킥을 16분음표로 두 번. 한 발로 빠른 킥 두 번을 내는 힘과 손발 연결을 같이 길러요.',
      how: ['R> L K K 반복. 킥 두 번의 크기를 같게.', '느린 템포에선 발목 두 번, 빨라지면 발꿈치를 든 채 발끝을 앞으로 미끄러뜨리듯 두 번.'],
      tips: ['두 번째 킥이 작아지거나 늦는 게 가장 흔해요. 킥만 따로 16분 두 번씩 연습해도 좋아요.'],
      gen: () => ({ grid: 0.25, slots: combo('R> L K K', 8, 0.25) }) },
    { id: 'd-332', cat: 'd-combo', level: 3, ko: '3 · 3 · 2 조합 (R L K · R L K · R K)', tempo: [60, 110], opts: {},
      goal: '16분음표 여덟 칸을 3 · 3 · 2 로 나누고 묶음마다 첫 음에 액센트. 박과 엇갈리는 액센트가 라틴 · 펑크의 들뜬 느낌을 만들어요.',
      how: ['R> L K · R> L K · R> K. 액센트는 1박 · 1박 a(넷째 16분) · 2박 &(셋째 16분).', '메트로놈을 켠 채 액센트 자리를 몸에 익혀요.'],
      tips: ['액센트만 치면 "쿵 – 쿵 – 쿵" 트레실로(3 · 3 · 2) 리듬이에요. 먼저 액센트만 손뼉으로 쳐 봐요.'],
      gen: () => ({ grid: 0.25, slots: combo('R> L K R> L K R> K', 8, 0.25) }) },
    { id: 'd-sixes', cat: 'd-combo', level: 3, ko: '6음 조합 R L R L K K (셋잇단)', tempo: [60, 120], opts: {},
      goal: '손 네 번 + 킥 두 번을 셋잇단 두 박에. 손과 발이 번갈아 굴러가는 "식스" 조합으로, 빠르게 치면 탐 필처럼 들려요.',
      how: ['R> L R L K K 반복. 액센트는 두 박마다 첫 오른손.', '킥 두 번 뒤 오른손이 박 위로 곧장 이어지게.'],
      tips: ['손을 스네어에서 탐으로 옮겨도 그대로 쓸 수 있어요. 먼저 스네어에서 고르게.'],
      gen: () => ({ grid: 1 / 3, slots: combo('R> L R L K K', 8, 1 / 3) }) },
    { id: 'd-rlk-toms', cat: 'd-combo', level: 4, ko: 'R L K 탐 돌기 (셋잇단)', tempo: [60, 120], opts: {},
      goal: 'R L K 조합을 한 박마다 스네어 → 하이 탐 → 미드 탐 → 플로어 탐으로 옮기고, 다시 거꾸로 올라와요. 조합을 필인으로 쓰는 첫걸음이에요.',
      how: ['한 박에 한 북. 손 두 번(R L)은 같은 북, 킥은 박의 마지막 셋잇단.', '북을 옮길 때 팔만이 아니라 몸통을 살짝 돌려요.'],
      tips: ['멀리 있는 플로어 탐으로 갈 때 박이 늦기 쉬워요. 스틱을 미리 그쪽으로.'],
      gen: () => ({ grid: 1 / 3, slots: combo('R> L K', 8, 1 / 3, around(['snare', 'tom1', 'tom2', 'tom3', 'tom3', 'tom2', 'tom1', 'snare'])) }) },
    { id: 'd-combo-fill', cat: 'd-combo', level: 4, ko: '조합 필 (그루브 3마디 + R L R K 1마디)', tempo: [70, 120], opts: {},
      goal: '8비트 세 마디 뒤, 마지막 마디에서 R L R K 조합으로 스네어 → 탐을 돌고 크래시로 돌아와요. 조합을 실제 곡의 필인으로 써 봐요.',
      how: ['1마디 첫 박은 크래시 + 킥.', '4마디째는 한 박마다 스네어 · 하이 탐 · 미드 탐 · 플로어 탐, 박 끝마다 킥.'],
      tips: ['필 첫 음이 급해지지 않게, 그루브의 템포를 그대로 가지고 들어가요.'],
      gen: () => { const beat = first => groove(16, { hat: range(first ? 2 : 0, 16, 2), crash: first ? [0] : [], snare: [4, 12], kick: [0, 8, 10] }); const order = ['snare', 'tom1', 'tom2', 'tom3']; return { grid: 0.25, slots: beat(true).concat(beat(false), beat(false), combo('R> L R K', 4, 0.25, i => order[Math.floor(i / 4)])) }; } },
    { id: 'd-556', cat: 'd-combo', level: 5, ko: '5 · 5 · 6 조합 (R L R L K · R L R L K · R L R L K K)', tempo: [50, 100], opts: {},
      goal: '16분음표 한 마디(16칸)를 5 · 5 · 6 으로 나눠 손 넷 + 킥으로. 묶음이 박을 넘나들어 가스펠 · 퓨전 드러머의 찹처럼 들려요.',
      how: ['묶음마다 첫 오른손에 액센트: 1박 · 2박 e(둘째 16분) · 3박 &(셋째 16분).', '먼저 묶음 하나(R L R L K)를 반복해 익힌 뒤 이어 붙여요.'],
      tips: ['마디 끝 킥 두 번 뒤 다음 마디 첫 박이 정확히 떨어지는지 메트로놈과 맞춰요.'],
      gen: () => ({ grid: 0.25, slots: combo('R> L R L K R> L R L K R> L R L K K', 8, 0.25) }) }
  );
  EX.forEach(e => { e.inst = 'drums'; if (e.handsOnly == null) e.handsOnly = e.cat === 'd-rud' || e.cat === 'd-ctrl'; });   /* 손만 쓰는 스트로크 연습: 스네어(연습 패드)만 */
  const ROUTINES = [
    { id: 'd-easy', inst: 'drums', ko: '입문 루틴', min: 10, desc: '싱글 · 더블로 손을 풀고 8비트와 킥 변형까지.', steps: [['d-single', 3], ['d-double', 2], ['d-8beat', 3], ['d-8kick', 2]] },
    { id: 'd-mid', inst: 'drums', ko: '중급 루틴', min: 15, desc: '패러디들 · 액센트 → 손발 조합 → 16비트 → 필인.', steps: [['d-para', 3], ['d-accent', 3], ['d-rlk', 2], ['d-16beat', 3], ['d-fill', 4]] },
    { id: 'd-hard', inst: 'drums', ko: '고급 루틴', min: 20, desc: '식스 스트로크 · 3 대 4 액센트 → 고스트 노트 · 스윙 → 6음 조합 · 리니어.', steps: [['d-six', 3], ['d-3over4', 3], ['d-ghost', 4], ['d-swing', 4], ['d-sixes', 3], ['d-linear', 3]] }
  ];
  GH.data.techKickVariants = KICK_KO;
  GH.data.techCats = (GH.data.techCats || []).concat(CATS);
  GH.data.technique = (GH.data.technique || []).concat(EX);
  GH.data.techRoutines = (GH.data.techRoutines || []).concat(ROUTINES);
})();
