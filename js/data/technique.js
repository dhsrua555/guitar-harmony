/* 기본기 연습 데이터 (세션 공통 목록 + 기타). 베이스 · 키보드 · 드럼 · 보컬은 techBass · techKeys · techDrums · techVocal.js
   기타: 크로매틱 · 손가락 신경분리 · 펜타토닉 · 피킹 · 레가토 (교재 · 입시 전통의 연습 방식을 참고해 새로 적은 연습)
   gen(o) → [{s 줄(1=높은 E), f 프렛, fg 손가락(0 개방 · 1 검지 · 2 중지 · 3 약지 · 4 새끼), t 'h' 해머온 | 'p' 풀오프, label 도수}]
   음 길이와 피킹 방향은 페이지에서 리듬 · 피킹 설정에 따라 붙인다. 운지는 스탠다드 튜닝 기준 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  GH.data = GH.data || {};
  const UP = [6, 5, 4, 3, 2, 1];
  const nt = (s, f, fg, t) => ({ s, f, fg, t: t || null });
  /* 한 줄에서 손가락 순서대로 (손가락 k → 시작 프렛 + k - 1) */
  const onString = (s, F, order) => order.map(k => nt(s, F + k - 1, k));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* 1~4 손가락 순열 24가지 */
  const PERMS = [];
  (function rec(pre, rest) { if (!rest.length) { PERMS.push(pre.join('')); return; } rest.forEach((x, i) => rec(pre.concat(x), rest.slice(0, i).concat(rest.slice(i + 1)))); })([], [1, 2, 3, 4]);
  /* 쉬운 순서 (이웃한 손가락끼리 먼저, 3 · 4번이 붙는 것은 뒤로) */
  const PERM_EASY = ['1234', '4321', '1324', '1423', '1243', '1342', '1432', '2134', '2143', '2314', '2341', '2413', '2431', '3124', '3142', '3214', '3241', '3412', '3421', '4123', '4132', '4213', '4231', '4312'];

  /* 펜타토닉 박스 (positions.js 의 2음/줄 박스) → 운지: 박스 가장 낮은 프렛이 검지 */
  function pentBox(o) {
    const N = GH.notes; const rootPc = N.pcOf(o.key || 'A');
    const list = GH.positions.npsPositions(rootPc, 'minor_pent', 2, GH.voicings.STD);
    const p = list[clamp((Number(o.box) || 1) - 1, 0, list.length - 1)];
    const hasOpen = p.notes.some(n => n.f === 0);
    const base = hasOpen ? 1 : Math.min(...p.notes.map(n => n.f));
    return p.notes.map(n => ({ s: n.s, f: n.f, fg: n.f === 0 ? 0 : clamp(n.f - base + 1, 1, 4), label: n.label, t: null }));
  }
  /* 내추럴 마이너 3NPS: 줄마다 온-온 → 1 2 4, 온-반 → 1 3 4, 반-온 → 1 2 4 */
  function nps3(o) {
    const N = GH.notes; const rootPc = N.pcOf(o.key || 'A');
    const list = GH.positions.npsPositions(rootPc, 'aeolian', 3, GH.voicings.STD);
    const p = list[clamp((Number(o.pos) || 1) - 1, 0, list.length - 1)];
    const out = [];
    for (let i = 0; i < 6; i++) {
      const tri = p.notes.slice(i * 3, i * 3 + 3);
      const a = tri[1].f - tri[0].f, b = tri[2].f - tri[1].f;
      const fg = tri[0].f === 0 ? tri.map(n => clamp(n.f, 0, 4)) : a === 2 && b === 1 ? [1, 3, 4] : [1, 2, 4];
      tri.forEach((n, k) => out.push({ s: n.s, f: n.f, fg: fg[k], label: n.label, t: null }));
    }
    return out;
  }
  const up = seq => seq.slice();
  const downOf = seq => seq.slice().reverse();

  const CATS = [
    { id: 'chromatic', ko: '크로매틱', en: 'CHROMATIC', icon: 'fretboard', desc: '한 손가락에 한 프렛씩, 반음을 차례로 짚어요. 손가락을 깨우는 가장 기본적인 워밍업이에요.' },
    { id: 'indep', ko: '손가락 신경분리', en: 'INDEPENDENCE', icon: 'pick', desc: '손가락 순서를 섞거나 한 손가락을 누른 채 다른 손가락만 움직여, 손가락이 따로따로 움직이게 만들어요.' },
    { id: 'pent', ko: '펜타토닉', en: 'PENTATONIC', icon: 'scale', desc: '솔로의 기본 재료인 마이너 펜타토닉 박스를 오르내리고, 3음 · 4음 묶음과 건너뛰기로 손에 익혀요.' },
    { id: 'pick', ko: '피킹', en: 'PICKING', icon: 'metronome', desc: '다운 · 업을 번갈아 치는 얼터네이트 피킹, 줄 옮기기, 줄 건너뛰기로 오른손을 고르게 만들어요.' },
    { id: 'legato', ko: '레가토', en: 'LEGATO', icon: 'melody', desc: '피킹 한 번에 해머온 · 풀오프로 여러 음을 이어, 왼손 힘과 음 사이의 매끄러움을 길러요.' }
  ];

  /* opts 종류: fret(시작 프렛), string(줄), key + box(펜타 박스), key + pos(3NPS), perm(순열), pickStart('d'|'u') */
  const EX = [
    /* ---- 크로매틱 ---- */
    { id: 'chroma-1234', cat: 'chromatic', level: 1, ko: '크로매틱 1-2-3-4', rh: '8', tempo: [60, 120], opts: { fret: 5 },
      goal: '네 손가락이 한 프렛씩 맡는 감각을 익혀요. 모든 기본기의 출발점이에요.',
      how: ['검지(1)를 시작 프렛에, 중지 · 약지 · 새끼(2 · 3 · 4)를 바로 옆 프렛에 하나씩 둬요.', '6번 줄부터 1-2-3-4로 치고 한 줄씩 위로 올라가요.', '1번 줄에서는 4-3-2-1로 거꾸로 치며 6번 줄까지 내려와요.', '피킹은 다운 · 업을 번갈아 (얼터네이트).'],
      tips: ['손가락은 프렛 선 바로 뒤를 눌러야 적은 힘으로 깨끗한 소리가 나요.', '다음 손가락을 누를 때까지 앞 손가락은 떼지 않아도 괜찮아요. 올라갈 때는 그대로 두고, 내려올 때는 미리 짚어 두세요.', '5프렛에서 편해지면 1프렛(더 넓은 간격)에서도 해 보세요.'],
      gen: o => { const F = o.fret; const out = []; UP.forEach(s => out.push(...onString(s, F, [1, 2, 3, 4]))); UP.slice().reverse().forEach(s => out.push(...onString(s, F, [4, 3, 2, 1]))); return out; } },
    { id: 'chroma-shift', cat: 'chromatic', level: 2, ko: '크로매틱 포지션 이동', rh: '8', tempo: [60, 110], opts: { fret: 1 },
      goal: '1-2-3-4를 치며 한 프렛씩 위로 옮겨 가요. 지판 위를 옮겨 다니는 감각과 지구력을 길러요.',
      how: ['시작 프렛에서 6번 줄 → 1번 줄로 1-2-3-4를 올라가요.', '1번 줄에서 손 전체를 한 프렛 위로 옮겨 4-3-2-1로 6번 줄까지 내려와요.', '다시 한 프렛 위로 옮겨 올라가고, 한 번 더 옮겨 내려와요. 모두 네 번.'],
      tips: ['옮길 때 엄지도 같이 옮겨야 손 모양이 무너지지 않아요.', '옮기는 순간 박이 밀리기 쉬워요. 메트로놈을 켜고 박을 먼저 지키세요.'],
      gen: o => { const F = o.fret; const out = []; for (let k = 0; k < 4; k++) { const f = F + k; if (k % 2 === 0) UP.forEach(s => out.push(...onString(s, f, [1, 2, 3, 4]))); else UP.slice().reverse().forEach(s => out.push(...onString(s, f, [4, 3, 2, 1]))); } return out; } },
    { id: 'stretch', cat: 'chromatic', level: 3, ko: '넓어지는 스트레칭', rh: '8', tempo: [50, 90], opts: { fret: 8, string: 3 },
      goal: '1-2-3-4를 한 프렛씩 아래로 내려오며 쳐요. 아래로 갈수록 프렛 간격이 넓어져 자연스럽게 손가락이 벌어져요.',
      how: ['고른 줄의 시작 프렛에서 1-2-3-4를 쳐요.', '손을 한 프렛 아래로 내려 다시 1-2-3-4. 1프렛까지 이어 가요.'],
      tips: ['손가락을 억지로 벌리지 말고, 손바닥이 넥에서 살짝 떨어지게 하면 편해요.', '당기거나 저리면 바로 멈추고 손을 털어 주세요. 스트레칭은 짧게 여러 번이 좋아요.'],
      gen: o => { const out = []; for (let f = o.fret; f >= 1; f--) out.push(...onString(o.string, f, [1, 2, 3, 4])); return out; } },
    /* ---- 손가락 신경분리 ---- */
    { id: 'perm', cat: 'indep', level: 2, ko: '손가락 순서 바꾸기 (24가지)', rh: '8', tempo: [60, 110], opts: { fret: 5, perm: '1324' },
      goal: '1-2-3-4의 순서를 섞은 24가지 조합으로, 손가락이 머리의 명령대로 따로 움직이게 만들어요. 흔히 말하는 신경분리 연습이에요.',
      how: ['위에서 순서를 하나 골라요. 1-3-2-4 부터 시작하면 좋아요.', '모든 줄에서 같은 순서로, 6번 줄에서 1번 줄까지 올라갔다 내려와요.', '하루에 순서 두세 개만 골라 깨끗하게 치는 것이 목표예요.'],
      tips: ['소리를 내지 않는 손가락도 줄 가까이(1cm 안쪽)에 머무르게 하세요. 멀리 들리면 다음 음이 늦어요.', '3 · 4번이 붙어 있는 순서(예: 1-2-4-3)가 가장 어려워요. 템포를 더 낮춰도 괜찮아요.'],
      gen: o => { const order = String(o.perm).split('').map(Number); const out = []; UP.forEach(s => out.push(...onString(s, o.fret, order))); UP.slice().reverse().forEach(s => out.push(...onString(s, o.fret, order))); return out; } },
    { id: 'trill', cat: 'indep', level: 2, ko: '트릴 돌리기 (두 손가락씩)', rh: '16', tempo: [50, 100], opts: { fret: 5, string: 3 },
      goal: '두 손가락으로 해머온 · 풀오프를 빠르게 주고받아요. 1-2, 1-3, 1-4, 2-3, 2-4, 3-4 여섯 쌍을 차례로.',
      how: ['한 쌍마다 처음 한 번만 피킹하고, 나머지는 해머온(위로) · 풀오프(아래로)로 이어요.', '한 쌍에 16분음표 8개(두 박), 끝나면 바로 다음 쌍으로.'],
      tips: ['해머온은 손가락 끝으로 프렛 바로 뒤를 톡 내리치고, 풀오프는 줄을 살짝 아래로 튕기며 떼요.', '약지 · 새끼(3-4) 쌍은 소리가 작아지기 쉬워요. 두 음의 크기가 같아질 때까지 천천히.'],
      gen: o => { const F = o.fret, s = o.string; const out = []; [[1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]].forEach(([a, b]) => { for (let k = 0; k < 4; k++) { out.push(nt(s, F + a - 1, a, k === 0 ? null : 'p'), nt(s, F + b - 1, b, 'h')); } }); return out; } },
    { id: 'spider', cat: 'indep', level: 3, ko: '스파이더 (두 줄 1·3 / 2·4)', rh: '8', tempo: [50, 100], opts: { fret: 5 },
      goal: '두 줄에 손가락을 1 · 3, 2 · 4 짝으로 번갈아 놓아요. 손가락이 거미 다리처럼 따로 움직여요.',
      how: ['아래 줄 1번 → 위 줄 3번 → 아래 줄 2번 → 위 줄 4번 순서예요.', '6 · 5번 줄에서 시작해 한 줄씩 올라가 2 · 1번 줄까지, 다시 내려와요.', '한 번 누른 손가락은 다음에 움직일 차례가 될 때까지 누른 채로 둬요.'],
      tips: ['“누른 채로 두기”가 이 연습의 핵심이에요. 손가락이 들리면 천천히 다시.', '손목이 꺾이지 않게 넥을 조금 세워 잡으면 편해요.'],
      gen: o => { const F = o.fret; const pairs = [[6, 5], [5, 4], [4, 3], [3, 2], [2, 1], [3, 2], [4, 3], [5, 4]]; const out = []; pairs.forEach(([lo, hi]) => out.push(nt(lo, F, 1), nt(hi, F + 2, 3), nt(lo, F + 1, 2), nt(hi, F + 3, 4))); return out; } },
    { id: 'weak34', cat: 'indep', level: 3, ko: '약지 · 새끼 강화 (1 누르고 3-4-3)', rh: '16', tempo: [50, 100], opts: { fret: 5 },
      goal: '검지(1)를 누른 채로 약지와 새끼만 움직여요. 가장 약한 두 손가락의 힘과 독립성을 길러요.',
      how: ['한 줄에서 1-3-4-3 을 두 번 쳐요 (16분음표 8개).', '6번 줄에서 1번 줄까지 올라갔다가 다시 내려와요.'],
      tips: ['검지는 끝까지 떼지 않아요. 약지 · 새끼가 움직일 때 검지가 같이 들리지 않는지 보세요.', '새끼손가락은 곧게 펴지 말고 살짝 구부려 끝으로 누르세요.'],
      gen: o => { const F = o.fret; const strs = [6, 5, 4, 3, 2, 1, 2, 3, 4, 5]; const out = []; strs.forEach(s => { for (let k = 0; k < 2; k++) out.push(...onString(s, F, [1, 3, 4, 3])); }); return out; } },
    { id: 'diag', cat: 'indep', level: 3, ko: '대각선 크로매틱', rh: '8', tempo: [50, 100], opts: { fret: 5 },
      goal: '1-2-3-4를 줄마다 하나씩 대각선으로 짚어요. 손가락 독립과 줄 옮기기를 함께 연습해요.',
      how: ['6번 줄 1번 → 5번 줄 2번 → 4번 줄 3번 → 3번 줄 4번 손가락.', '한 줄 위에서 같은 모양을 반복해 1번 줄까지, 그다음 거꾸로 내려와요.'],
      tips: ['한 줄에 한 음씩이라 앞 음이 계속 울리기 쉬워요. 누른 손가락을 살짝 들어 소리를 끊어 주세요.'],
      gen: o => { const F = o.fret; const out = []; [[6, 5, 4, 3], [5, 4, 3, 2], [4, 3, 2, 1]].forEach(g => g.forEach((s, k) => out.push(nt(s, F + k, k + 1)))); [[1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6]].forEach(g => g.forEach((s, k) => out.push(nt(s, F + 3 - k, 4 - k)))); return out; } },
    /* ---- 펜타토닉 ---- */
    { id: 'pent-box', cat: 'pent', level: 1, ko: '펜타토닉 박스 오르내리기', rh: '8', tempo: [60, 140], opts: { key: 'A', box: 1 },
      goal: '마이너 펜타토닉 한 박스를 6번 줄부터 1번 줄까지 올라갔다 내려와요. 솔로에서 가장 많이 쓰는 모양이에요.',
      how: ['박스 1은 한 줄에 두 음씩, 검지와 약지(또는 새끼)로 짚어요.', '빨간 점(루트)이 어디 있는지 보면서 쳐요.'],
      tips: ['A 박스 1(5프렛)이 가장 흔한 시작이에요. 익숙해지면 키와 박스를 바꿔 보세요.', '같은 줄의 두 음은 손가락을 둘 다 눌러 둔 채 치면 더 매끄러워요.'],
      gen: o => { const b = pentBox(o); return up(b).concat(downOf(b)); } },
    { id: 'pent-3s', cat: 'pent', level: 3, ko: '펜타토닉 3음 묶음', rh: '8t', tempo: [60, 120], opts: { key: 'A', box: 1 },
      goal: '박스 음을 세 개씩 묶어 한 칸씩 밀며 쳐요 (1-2-3, 2-3-4 …). 솔로에서 바로 쓰는 시퀀스예요.',
      how: ['셋잇단음표로, 한 박에 한 묶음씩.', '올라갈 때는 낮은 음부터, 내려올 때는 높은 음부터 세 개씩.'],
      tips: ['묶음의 첫 음(박 첫머리)에 살짝 힘을 주면 박이 또렷해요.'],
      gen: o => { const b = pentBox(o); const out = []; for (let i = 0; i + 2 < b.length; i++) out.push(b[i], b[i + 1], b[i + 2]); const d = downOf(b); for (let i = 0; i + 2 < d.length; i++) out.push(d[i], d[i + 1], d[i + 2]); return out; } },
    { id: 'pent-4s', cat: 'pent', level: 3, ko: '펜타토닉 4음 묶음', rh: '16', tempo: [60, 120], opts: { key: 'A', box: 1 },
      goal: '박스 음을 네 개씩 묶어 한 칸씩 밀며 쳐요. 16분음표 네 개가 한 박에 딱 맞아요.',
      how: ['한 박에 한 묶음 (1-2-3-4, 2-3-4-5 …).', '끝까지 올라가면 높은 음부터 네 개씩 내려와요.'],
      tips: ['줄을 옮기는 곳에서 피킹이 꼬이기 쉬워요. 그 부분만 떼어 천천히 반복해도 좋아요.'],
      gen: o => { const b = pentBox(o); const out = []; for (let i = 0; i + 3 < b.length; i++) out.push(b[i], b[i + 1], b[i + 2], b[i + 3]); const d = downOf(b); for (let i = 0; i + 3 < d.length; i++) out.push(d[i], d[i + 1], d[i + 2], d[i + 3]); return out; } },
    { id: 'pent-skip', cat: 'pent', level: 4, ko: '펜타토닉 건너뛰기', rh: '8', tempo: [60, 130], opts: { key: 'A', box: 1 },
      goal: '한 음씩 건너뛰며 짝을 지어 쳐요 (1-3, 2-4 …). 넓게 뛰는 소리와 줄 넘기를 함께 연습해요.',
      how: ['박스의 첫 음과 셋째 음, 둘째 음과 넷째 음 … 순서로 올라가요.', '맨 위에서는 거꾸로 짝을 지어 내려와요.'],
      tips: ['건너뛸 때 두 줄이 같이 울리지 않게, 치지 않는 줄은 왼손 손가락 옆면으로 살짝 막아 주세요.'],
      gen: o => { const b = pentBox(o); const out = []; for (let i = 0; i + 2 < b.length; i++) out.push(b[i], b[i + 2]); const d = downOf(b); for (let i = 0; i + 2 < d.length; i++) out.push(d[i], d[i + 2]); return out; } },
    /* ---- 피킹 ---- */
    { id: 'pick-open', cat: 'pick', level: 1, ko: '개방현 얼터네이트 피킹', rh: '8', tempo: [60, 120], opts: {},
      goal: '왼손은 쉬고 오른손만. 줄마다 다운-업-다운-업 네 번씩 치며 6번 줄에서 1번 줄까지 오가요.',
      how: ['피크는 엄지와 검지 옆면으로 가볍게 잡고, 끝이 2~3mm만 나오게 해요.', '다운(⊓)과 업(V)을 반드시 번갈아 쳐요. 줄을 옮겨도 순서는 그대로.'],
      tips: ['손목을 문 손잡이 돌리듯 작게 움직이세요. 팔 전체로 치면 빨리 지쳐요.', '다운과 업의 소리 크기가 같아지는 것이 목표예요.'],
      gen: () => { const out = []; UP.concat(UP.slice().reverse()).forEach(s => { for (let k = 0; k < 4; k++) out.push(nt(s, 0, 0)); }); return out; } },
    { id: 'pick-tremolo', cat: 'pick', level: 2, ko: '한 음 네 번씩 (16분 피킹)', rh: '16', tempo: [60, 120], opts: { fret: 5, string: 2 },
      goal: '한 음을 16분음표로 네 번씩 치고 다음 음으로. 왼손과 오른손의 타이밍을 맞추는 연습이에요.',
      how: ['고른 줄에서 1-2-3-4 손가락으로 올라갔다가 4-3-2-1로 내려와요.', '음을 바꾸는 순간이 늘 다운 스트로크에 오도록 해요.'],
      tips: ['왼손이 먼저, 오른손은 그다음. 손가락이 자리를 잡은 뒤에 피킹이 들어가야 소리가 깨끗해요.'],
      gen: o => { const out = []; [1, 2, 3, 4, 4, 3, 2, 1].forEach(k => { for (let r = 0; r < 4; r++) out.push(nt(o.string, o.fret + k - 1, k)); }); return out; } },
    { id: 'pick-cross', cat: 'pick', level: 3, ko: '스트링 크로싱 (바깥쪽 · 안쪽)', rh: '8', tempo: [60, 130], opts: { fret: 5, pickStart: 'd' },
      goal: '이웃한 두 줄을 한 음씩 오가요. 피크가 두 줄 바깥쪽으로 도는지(바깥쪽 피킹), 안쪽에 갇히는지(안쪽 피킹) 둘 다 익혀요.',
      how: ['아래 줄 3번 손가락, 위 줄 1번 손가락을 번갈아 쳐요.', '다운으로 시작하면 바깥쪽 피킹, 업으로 시작하면 안쪽 피킹이에요. 위에서 바꿔 보세요.', '6 · 5번 줄에서 2 · 1번 줄까지 올라갔다 내려와요.'],
      tips: ['안쪽 피킹이 더 어렵게 느껴지는 게 정상이에요. 느린 템포로 피크가 줄에 걸리지 않는지 보세요.'],
      gen: o => { const F = o.fret; const pairs = [[6, 5], [5, 4], [4, 3], [3, 2], [2, 1], [3, 2], [4, 3], [5, 4]]; const out = []; pairs.forEach(([lo, hi]) => { out.push(nt(lo, F + 2, 3), nt(hi, F, 1), nt(lo, F + 2, 3), nt(hi, F, 1)); }); return out; } },
    { id: 'pick-skip', cat: 'pick', level: 4, ko: '스트링 스키핑 (한 줄 건너)', rh: '8', tempo: [60, 120], opts: { fret: 5 },
      goal: '가운데 줄 하나를 건너뛰며 두 줄을 오가요. 오른손이 정확한 줄을 찾아가는 감각과 뮤트를 익혀요.',
      how: ['6 · 4번 줄, 5 · 3번 줄, 4 · 2번 줄, 3 · 1번 줄 순서로 짝을 지어요.', '아래 줄 1번 → 위 줄 3번 → 아래 줄 2번 → 위 줄 4번 손가락.'],
      tips: ['건너뛴 줄이 울리지 않게 오른손 손날과 왼손 손가락으로 막아 주세요.', '줄을 건너뛸 때 피크를 크게 휘두르지 말고, 필요한 만큼만 옮겨요.'],
      gen: o => { const F = o.fret; const pairs = [[6, 4], [5, 3], [4, 2], [3, 1], [4, 2], [5, 3]]; const out = []; pairs.forEach(([lo, hi]) => out.push(nt(lo, F, 1), nt(hi, F + 2, 3), nt(lo, F + 1, 2), nt(hi, F + 3, 4))); return out; } },
    /* ---- 레가토 ---- */
    { id: 'pent-legato', cat: 'legato', level: 2, ko: '펜타토닉 해머온 · 풀오프', rh: '8', tempo: [60, 120], opts: { key: 'A', box: 1 },
      goal: '펜타토닉 박스를 줄마다 한 번만 피킹하고, 올라갈 때는 해머온 · 내려올 때는 풀오프로 이어요.',
      how: ['올라갈 때: 낮은 음을 피킹하고 높은 음은 해머온(H).', '내려올 때: 높은 음을 피킹하고 낮은 음은 풀오프(P).'],
      tips: ['해머온한 음이 피킹한 음만큼 크게 들려야 해요. 손가락을 높이 들지 말고 짧고 빠르게.'],
      gen: o => { const b = pentBox(o); const asc = up(b).map((n, i) => Object.assign({}, n, { t: i % 2 === 1 ? 'h' : null })); const desc = downOf(b).map((n, i) => Object.assign({}, n, { t: i % 2 === 1 ? 'p' : null })); return asc.concat(desc); } },
    { id: 'legato-3nps', cat: 'legato', level: 5, ko: '3NPS 레가토 (줄당 세 음)', rh: '8t', tempo: [60, 120], opts: { key: 'A', pos: 1 },
      goal: '내추럴 마이너를 한 줄에 세 음씩. 줄마다 첫 음만 피킹하고 나머지 두 음은 해머온 · 풀오프로 이어요.',
      how: ['셋잇단음표로 한 박에 한 줄씩.', '올라갈 때: 피킹 → H → H, 내려올 때: 피킹 → P → P.', '손가락은 온음-온음이면 1-2-4, 온음-반음이면 1-3-4.'],
      tips: ['세 음의 크기가 고르게 들릴 때까지 템포를 올리지 마세요.', '풀오프 때 다른 줄을 건드리지 않게, 줄을 손가락 아래쪽(바닥 방향)으로 튕겨 떼요.'],
      gen: o => { const b = nps3(o); const asc = b.map((n, i) => Object.assign({}, n, { t: i % 3 === 0 ? null : 'h' })); const desc = downOf(b).map((n, i) => Object.assign({}, n, { t: i % 3 === 0 ? null : 'p' })); return asc.concat(desc); } }
  ];

  /* 오늘의 루틴: [연습 id, 분] */
  const ROUTINES = [
    { id: 'g-easy', inst: 'guitar', ko: '입문 루틴', min: 10, desc: '오른손 → 1-2-3-4 → 트릴 → 펜타토닉. 기타를 잡은 지 얼마 안 됐다면 여기부터.', steps: [['pick-open', 2], ['chroma-1234', 3], ['trill', 2], ['pent-box', 3]] },
    { id: 'g-mid', inst: 'guitar', ko: '중급 루틴', min: 15, desc: '순서 바꾸기와 스파이더로 손가락을 나누고, 펜타토닉 시퀀스와 줄 옮기기까지.', steps: [['chroma-1234', 2], ['perm', 4], ['spider', 3], ['pent-3s', 3], ['pick-cross', 3]] },
    { id: 'g-hard', inst: 'guitar', ko: '고급 루틴', min: 20, desc: '포지션 이동, 약한 손가락, 건너뛰기, 3NPS 레가토로 속도와 정확도를 함께.', steps: [['chroma-shift', 3], ['perm', 3], ['weak34', 3], ['pent-skip', 4], ['pick-skip', 3], ['legato-3nps', 4]] }
  ];

  /* 연습마다 참고한 교재 · 전통 */
  const SRC = {
    'chroma-1234': 'Troy Stetina 《Speed Mechanics for Lead Guitar》의 크로매틱 워밍업', 'chroma-shift': 'Troy Stetina 《Speed Mechanics for Lead Guitar》 · 포지션 이동', stretch: 'John Petrucci 《Rock Discipline》의 스트레칭 워밍업',
    perm: 'John Petrucci 《Rock Discipline》의 손가락 순열 (신경분리)', trill: 'John Petrucci 《Rock Discipline》의 트릴 연습', spider: 'John Petrucci 《Rock Discipline》의 스파이더 연습', weak34: '약지 · 새끼 독립 연습 (기타 교본 공통)', diag: '대각선 크로매틱 (기타 교본 공통)',
    'pent-box': 'William Leavitt 《A Modern Method for Guitar》(Berklee) 포지션 연습', 'pent-3s': '펜타토닉 시퀀스 (Troy Stetina 《Speed Mechanics》)', 'pent-4s': '펜타토닉 시퀀스 (Troy Stetina 《Speed Mechanics》)', 'pent-skip': '인터벌 시퀀스 (실용음악 기타 입시 스케일 과제)',
    'pick-open': 'William Leavitt 《A Modern Method for Guitar》 얼터네이트 피킹', 'pick-tremolo': 'Troy Stetina 《Speed Mechanics》 피킹 동기화', 'pick-cross': '인사이드 · 아웃사이드 피킹 (Troy Grady의 피킹 분석)', 'pick-skip': '스트링 스키핑 (Paul Gilbert 연습 방식)',
    'pent-legato': '해머온 · 풀오프 기초 (기타 교본 공통)', 'legato-3nps': '3NPS 레가토 (Joe Satriani · John Petrucci 레가토 연습)'
  };
  EX.forEach(e => { e.inst = 'guitar'; e.src = SRC[e.id] || ''; });
  CATS.forEach(c => { c.inst = 'guitar'; });

  GH.data.techInst = [
    { id: 'guitar', ko: '기타', en: 'GUITAR', icon: 'guitar', desc: '크로매틱 · 신경분리 · 펜타토닉 · 피킹 · 레가토', view: '지판 · TAB · 오선' },
    { id: 'bass', ko: '베이스', en: 'BASS', icon: 'bass', desc: '투핑거 · 운지 · 코드톤 · 워킹 · 그루브', view: '지판 · TAB · 낮은음자리표' },
    { id: 'keys', ko: '키보드', en: 'KEYS', icon: 'piano', desc: '하논 · 스케일 · 아르페지오 · 카덴스 · 양손 독립', view: '건반 · 큰보표' },
    { id: 'drums', ko: '드럼', en: 'DRUMS', icon: 'drum', desc: '루디먼트 · 액센트 · 그루브 · 필인 · 손발 독립', view: '드럼 킷 · 드럼 악보' },
    { id: 'vocal', ko: '보컬', en: 'VOCAL', icon: 'mic', desc: '호흡 · 발성 · 음정 · 시창 · 애드리브', view: '악보 · 피아노 가이드' }
  ];
  GH.data.techSources = GH.data.techSources || {};
  GH.data.techSources.guitar = [
    ['Troy Stetina', '《Speed Mechanics for Lead Guitar》 (Hal Leonard)', '크로매틱 · 얼터네이트 피킹 · 템포를 조금씩 올리는 스피드 훈련'],
    ['John Petrucci', '《Rock Discipline》', '손가락 순열(신경분리) · 스파이더 · 트릴 · 레가토 워밍업'],
    ['William Leavitt', '《A Modern Method for Guitar》 (Berklee Press)', '포지션 · 스케일 · 피킹 기본기'],
    ['실용음악과 기타 입시', '공통 과제', '메이저 · 펜타토닉 포지션, 메트로놈 템포 올리기, 인터벌 시퀀스']
  ];
  GH.data.techCats = CATS;
  GH.data.technique = EX;
  GH.data.techRoutines = ROUTINES;
  GH.data.techPerms = PERM_EASY;
  GH.data.techAllPerms = PERMS;
})();
