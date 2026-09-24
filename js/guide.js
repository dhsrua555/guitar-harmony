/* 학습 가이드: 처음 방문 설문(수준 · 목표), 맞춤 미션 순서, 진행 기록, 페이지별 가이드 막대 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h } = GH.ui;
  const KEY = 'gh.guide.v1';

  const LEVELS = [
    { id: 'new', dyn: 'pp', ko: '완전히 처음이에요', desc: '코드 이름이나 악보가 아직 낯설어요.' },
    { id: 'chords', dyn: 'p', ko: '코드 몇 개는 잡아요', desc: 'C, G, Am 같은 오픈 코드로 간단히 반주할 수 있어요.' },
    { id: 'theory', dyn: 'mf', ko: '기초 이론은 알아요', desc: '메이저 스케일, 음정 이름, 다이어토닉 코드를 알아요.' },
    { id: 'advanced', dyn: 'ff', ko: '꽤 공부했어요', desc: '모드, 텐션, 세컨더리 도미넌트, 재즈 진행이 익숙해요.' }
  ];
  const GOALS = [
    { id: 'theory', ko: '화성학 이해', icon: 'piano', desc: '코드와 스케일이 왜 그렇게 들리는지' },
    { id: 'guitar', ko: '기타 연주 실력', icon: 'guitar', desc: '코드 폼, 스케일 포지션, 운지' },
    { id: 'ear', ko: '음감 훈련', icon: 'ear', desc: '음정, 코드, 진행을 귀로 구분' },
    { id: 'solo', ko: '즉흥 솔로', icon: 'melody', desc: '코드 위에서 멜로디 만들기' },
    { id: 'compose', ko: '작곡 · 편곡', icon: 'staff', desc: '멜로디에 코드와 화음 붙이기' },
    { id: 'rhythm', ko: '리듬감', icon: 'metronome', desc: '박 유지, 스트럼, 싱코페이션' }
  ];
  /* lv: [가장 쉬운 수준, 가장 어려운 수준] (LEVELS 인덱스) */
  const MISSIONS = [
    { id: 'finder', title: '지판에서 음 찾기', route: '/tools/finder', goals: ['guitar', 'theory'], lv: [0, 1], desc: '지판을 눌러 소리를 들으며 같은 음이 어디에 또 있는지 찾아봅니다.' },
    { id: 'open', title: '오픈 코드 네 개 잡기 (C · G · Am · F)', route: '/guitar/voicings/basic', q: { types: 'open' }, goals: ['guitar', 'compose'], lv: [0, 1], desc: '다이어그램을 보고 잡은 뒤 ▶ 듣기로 소리를 비교합니다.' },
    { id: 'metro', title: '메트로놈에 맞춰 4분·8분 치기', route: '/rhythm', goals: ['rhythm', 'guitar'], lv: [0, 2], desc: '60~80 BPM에서 박마다 한 번, 그다음 두 번씩 쳐 봅니다.' },
    { id: 'strum', title: '팝 기본 스트럼 익히기', route: '/rhythm', q: { tab: 'strum' }, goals: ['guitar', 'rhythm'], lv: [0, 2], desc: 'D - D U - U D U 패턴을 코드 진행에 맞춰 반복합니다.' },
    { id: 'intervals', title: '음정 이름과 소리 익히기', route: '/theory/intervals', goals: ['theory', 'ear'], lv: [0, 1], desc: '장3도, 완전5도처럼 두 음 사이의 거리를 노래로 기억합니다.' },
    { id: 'chordbuild', title: '코드가 만들어지는 원리', route: '/theory/chords', goals: ['theory', 'compose'], lv: [0, 1], desc: '코드 빌더에서 메이저와 마이너를 번갈아 듣고 구성음을 비교합니다.' },
    { id: 'earint', title: '음정 퀴즈 10문제', route: '/ear', q: { tab: 'interval' }, goals: ['ear'], lv: [0, 2], desc: '스케일 음정 범위로 시작해 80%가 넘으면 범위를 넓힙니다.' },
    { id: 'tap1', title: '리듬 따라 치기 1단계', route: '/rhythm', q: { tab: 'tap' }, goals: ['rhythm', 'ear'], lv: [0, 1], desc: '4분·8분음표 리듬을 듣고 패드를 눌러 80점 이상을 목표로 합니다.' },
    { id: 'pent', title: '마이너 펜타토닉 박스 1', route: '/guitar/scales', q: { scale: 'minor_pent' }, goals: ['guitar', 'solo'], lv: [1, 2], desc: '박스 1을 외우고 상행·하행 패턴을 재생에 맞춰 따라 칩니다.' },
    { id: 'degree', title: '계이름 퀴즈 (메이저 스케일)', route: '/ear', q: { tab: 'degree' }, goals: ['ear'], lv: [1, 2], desc: '스케일을 듣고 도를 붙잡은 뒤 들린 음의 계이름을 맞힙니다.' },
    { id: 'diatonic', title: '다이어토닉 코드와 기능', route: '/theory/chords', q: { tab: 'diatonic' }, goals: ['theory', 'compose'], lv: [1, 2], desc: '한 키 안의 7개 코드와 토닉 · 서브도미넌트 · 도미넌트 기능을 봅니다.' },
    { id: 'prog', title: '장르별 기본 진행 듣기', route: '/theory/progressions', goals: ['theory', 'compose', 'guitar'], lv: [1, 2], desc: 'I – V – vi – IV 와 ii – V – I 을 듣고 기능 흐름을 비교합니다.' },
    { id: 'backing', title: '백킹 트랙 위에서 솔로하기', route: '/backing', q: { id: 'blues12' }, goals: ['solo', 'guitar', 'rhythm'], lv: [1, 3], desc: '12마디 블루스를 틀고 펜타토닉과 코드톤으로 솔로합니다.' },
    { id: 'melody', title: '멜로디에 코드 붙이기', route: '/tools/melody', goals: ['compose'], lv: [1, 3], desc: '아는 멜로디를 넣고 추천 코드를 들어 가며 반주를 만듭니다.' },
    { id: 'root', title: '진행 근음 퀴즈', route: '/ear', q: { tab: 'root' }, goals: ['ear', 'theory'], lv: [1, 3], desc: '코드 진행을 듣고 근음을 계이름으로 맞힙니다.' },
    { id: 'rq', title: '리듬 듣고 맞히기 퀴즈', route: '/ear', q: { tab: 'rhythm' }, goals: ['rhythm', 'ear'], lv: [1, 3], desc: '들은 리듬과 같은 악보를 고릅니다. 쉼표와 16분음표 단계까지.' },
    { id: 'triads', title: '현 세트별 트라이어드', route: '/guitar/triads', goals: ['guitar', 'solo'], lv: [2, 3], desc: '같은 코드를 세 가지 인버전으로 지판 위아래에서 잡아 봅니다.' },
    { id: 'phrase', title: '코드톤 타겟팅과 어프로치 노트', route: '/guitar/phrasing', goals: ['solo', 'theory'], lv: [2, 3], desc: '기법 카드를 들어 보고 빌더에서 ii – V – I 라인을 만듭니다.' },
    { id: 'harmony', title: '멜로디에 3도·6도 화음 쌓기', route: '/tools/harmony', goals: ['compose', 'ear', 'theory'], lv: [2, 3], desc: '다이어토닉 3도 위와 6도 아래를 비교하며 들어 봅니다.' },
    { id: 'ds', title: '3도·6도 더블스탑', route: '/guitar/doublestops', goals: ['guitar', 'solo'], lv: [2, 3], desc: '2·3번 줄 3도, 1·3번 줄 6도 패턴을 올라갔다 내려옵니다.' },
    { id: 'songs', title: '곡 분석으로 마디별 스케일 연결', route: '/songs', goals: ['solo', 'theory'], lv: [2, 3], desc: '마디를 하나씩 눌러 코드, 스케일, 보이싱을 이어 봅니다.' },
    { id: 'licks', title: '릭 하나를 여러 키로 옮기기', route: '/guitar/licks', goals: ['solo', 'guitar'], lv: [2, 3], desc: '마음에 드는 릭을 느리게 익힌 뒤 키 옮기기로 다른 키에서 칩니다.' },
    { id: 'modes', title: '모드의 밝기와 특징음', route: '/theory/modes', goals: ['theory', 'ear', 'solo'], lv: [3, 3], desc: '같은 루트의 7모드를 밝은 순서로 듣고 특징음을 찾습니다.' },
    { id: 'reharm', title: '리하모니제이션 기법 비교', route: '/theory/reharm', goals: ['theory', 'compose'], lv: [3, 3], desc: '원래 진행과 바꾼 진행을 A/B로 들어 봅니다.' },
    { id: 'drop2', title: '드롭 2 보이스 리딩', route: '/guitar/voicings/advanced', q: { types: 'drop2' }, goals: ['guitar'], lv: [3, 3], desc: 'ii – V – I 을 한 현 세트 안에서 가장 가깝게 연결합니다.' },
    { id: 'modeq', title: '모드 퀴즈', route: '/ear', q: { tab: 'mode' }, goals: ['ear'], lv: [3, 3], desc: '3음의 장단을 먼저 듣고 특징음으로 모드를 구분합니다.' }
  ];
  /* 페이지 가이드: 경로(앞부분 일치) → 무엇을, 어떻게 */
  const PAGES = [
    ['/guitar/voicings', '코드를 잡는 여러 방법을 찾는 곳입니다.', ['루트와 코드 퀄리티를 고르세요.', '다이어그램의 점을 누르면 그 줄 소리가 나고, ▶ 듣기로 전체를 들을 수 있습니다.', '처음이라면 기본 코드 폼의 오픈 코드부터 시작하세요.']],
    ['/guitar/scales', '스케일이 지판 어디에 있는지 포지션별로 보는 곳입니다.', ['스케일과 루트를 고르세요.', '포지션을 하나 골라 그 박스만 외웁니다.', '연습 패턴 재생에 맞춰 따라 치고, 백킹을 켜서 솔로해 보세요.']],
    ['/guitar/triads', '세 음짜리 코드를 줄 세트마다 여러 자리에서 잡는 법을 익힙니다.', ['한 줄 세트(예: 3-2-1번 줄)만 골라 기본형 → 1전위 → 2전위 순서로 올라가 보세요.', '아래 아르페지오에서 같은 코드톤을 한 음씩 쳐 봅니다.']],
    ['/guitar/doublestops', '두 줄을 함께 눌러 3도·6도 화음으로 멜로디를 두껍게 만드는 연습입니다.', ['음정과 줄 쌍을 고르세요. 3도는 2·3번 줄이 가장 쉽습니다.', '▶ 듣기로 소리를 확인하고 느린 템포로 올라갔다 내려오세요.']],
    ['/guitar/phrasing', '코드톤과 어프로치 노트로 솔로 라인을 만드는 원리를 배웁니다.', ['기법 카드를 위에서부터 하나씩 들어 보세요.', '마음에 드는 기법을 "빌더에서 열기"로 가져와 진행과 키를 바꿔 봅니다.', '만든 라인을 따라 친 뒤 백킹 트랙 위에서 반복하세요.']],
    ['/guitar/licks', '장르별 실전 프레이즈를 TAB과 오선, 느린 재생으로 익힙니다.', ['난이도 1~2부터 고르세요.', '느리게(60%) 재생에 맞춰 따라 치고, 익숙해지면 템포를 올립니다.']],
    ['/theory/intervals', '두 음 사이의 거리(음정)를 소리와 지판 모양으로 익힙니다.', ['표에서 음정을 누르고 ▶ 순차 / 동시로 들어 보세요.', '기억할 곡을 흥얼거리며 소리와 이름을 연결합니다.']],
    ['/theory/chords', '코드가 어떤 음으로 만들어지는지 보고 듣는 곳입니다.', ['코드 빌더에서 루트와 퀄리티를 바꿔 가며 들어 보세요.', '다이어토닉 코드 탭에서 한 키 안의 코드 7개를 확인합니다.']],
    ['/theory/scales', '스케일의 구조와 스케일에서 만들어지는 코드를 봅니다.', ['스케일을 고르고 ▶ 듣기로 소리를 확인하세요.', '오선, 건반, 지판을 같이 보며 같은 음의 위치를 비교합니다.']],
    ['/theory/progressions', '장르별로 자주 쓰는 코드 진행을 듣고 기능을 분석합니다.', ['진행을 고르고 ▶ 재생으로 들어 보세요.', '색으로 표시된 기능(T · S · D)이 어떻게 흘러가는지 보고, 백킹 트랙으로 넘어가 연주해 봅니다.']],
    ['/theory/modes', '같은 음을 다른 중심으로 쓰는 모드의 색채를 비교합니다.', ['밝기 순서에서 모드를 하나씩 들어 보세요.', '특징음이 어디서 들리는지 찾아봅니다.']],
    ['/theory/reharm', '멜로디는 그대로 두고 코드를 바꾸는 기법을 비교합니다.', ['기법을 하나 고르고 A(원래)와 B(바꾼 것)를 번갈아 들어 보세요.']],
    ['/chord/', '코드 하나에 대한 모든 정보(구성음, 잡는 법, 스케일, 진행)가 모인 곳입니다.', ['▶ 듣기로 소리를 확인하고, 기타 보이싱에서 잡기 쉬운 폼을 고르세요.', '어울리는 스케일 표에서 솔로에 쓸 스케일을 찾습니다.']],
    ['/tools/finder', '지판을 눌러 잡은 모양이 무슨 코드인지 찾아 줍니다.', ['줄마다 한 칸씩 누르세요. 같은 자리를 다시 누르면 지워집니다.', '아래에 가능한 코드 이름이 나옵니다.']],
    ['/tools/melody', '멜로디를 넣으면 어울리는 코드를 제안합니다.', ['건반이나 글자로 멜로디를 넣으세요.', '추천 순위의 ▶로 멜로디와 코드를 함께 들어 봅니다.', '자동 코드 붙이기 결과를 백킹 트랙으로 보내 연주해 보세요.']],
    ['/tools/harmony', '멜로디 위아래에 3도·6도 같은 화음 성부를 쌓아 들어 봅니다.', ['멜로디를 넣고 빠른 설정에서 "3도 위"를 먼저 골라 보세요.', '성부마다 뮤트·솔로로 따로 들어 봅니다.', '아래 더블스탑으로 기타에서 바로 쳐 볼 수 있습니다.']],
    ['/ear', '듣고 맞히는 퀴즈로 음감을 기릅니다.', ['탭을 골라 ▶ 문제 듣기를 누르고 답을 고르세요.', '틀리면 정답과 내가 고른 답을 번갈아 들어 차이를 확인합니다.', '정답률 80%가 넘으면 설정에서 범위를 넓히세요.']],
    ['/rhythm', '박을 유지하고 리듬을 정확하게 치는 연습을 합니다.', ['메트로놈에서 편한 템포로 박을 세어 보세요.', '리듬 따라 치기에서 패드를 눌러 점수를 확인합니다.', '스트럼 패턴을 코드 진행에 맞춰 반복합니다.']],
    ['/backing', '드럼 · 베이스 · 코드 반주 위에서 솔로와 리듬을 연습합니다.', ['진행과 스타일을 고르고 ▶ 시작을 누르세요.', '재생 중 지판에 표시되는 코드톤(색 있는 음) 위주로 쳐 봅니다.']],
    ['/songs', '실제 곡 형태의 진행을 마디별로 분석합니다.', ['곡을 고르고 마디를 하나씩 눌러 코드, 스케일, 보이싱을 확인하세요.']],
    ['/glossary', '음악 용어를 한글과 영어로 찾아봅니다.', ['검색창에 궁금한 용어를 적어 보세요.']]
  ];

  /* ---- 저장 ---- */
  let data = { profile: { level: null, goals: [], onboarded: false, skipped: false, showGuides: true }, done: {}, visits: {} };
  try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); data = Object.assign(data, d, { profile: Object.assign(data.profile, d.profile || {}) }); } } catch (e) { /* 저장소를 못 쓰는 환경 */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ } };
  const profile = () => data.profile;
  function setProfile(patch) { Object.assign(data.profile, patch); save(); GH.events.emit('guide', data); }
  const levelIdx = () => Math.max(0, LEVELS.findIndex(l => l.id === data.profile.level));
  const missionHref = m => GH.router.href(m.route, m.q || null);

  /* 맞춤 순서: 지금 수준과 한 단계 위, 목표가 겹치는 미션을 쉬운 것부터 */
  function plan(p) {
    p = p || data.profile; const li = Math.max(0, LEVELS.findIndex(l => l.id === p.level));
    const goals = p.goals && p.goals.length ? p.goals : GOALS.map(g => g.id);
    const rank = m => Math.min(...m.goals.map(g => { const k = goals.indexOf(g); return k < 0 ? 99 : k; }));
    return MISSIONS.filter(m => m.lv[0] <= li + 1 && m.lv[1] >= li && m.goals.some(g => goals.includes(g)))
      .sort((a, b) => (a.lv[0] - b.lv[0]) || (rank(a) - rank(b)))
      .slice(0, 12);
  }
  const isDone = id => !!data.done[id];
  function toggleDone(id, on) { if (on == null) on = !isDone(id); if (on) data.done[id] = Date.now(); else delete data.done[id]; save(); GH.events.emit('guide', data); }
  const next = () => plan().find(m => !isDone(m.id)) || null;
  function missionFor(route) { if (!route) return null; return plan().find(m => m.route === route.path && (!m.q || Object.keys(m.q).every(k => String(route.query[k] || '') === String(m.q[k])))) || plan().find(m => m.route === route.path) || null; }

  /* ---- 설문 창 ---- */
  let modal = null;
  function closeModal() { if (!modal) return; const m = modal; modal = null; m.classList.remove('open'); setTimeout(() => m.remove(), 220); document.body.classList.remove('panel-open'); }
  function openOnboarding(opts) {
    opts = opts || {};
    if (modal) return;
    const draft = { level: data.profile.level || 'new', goals: (data.profile.goals || []).slice() };
    let step = opts.step || 1;
    const box = h('div', { class: 'onboard', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'onboard-title', tabindex: '-1' });
    const wrap = h('div', { class: 'onboard-backdrop' }, box);
    wrap.addEventListener('click', e => { if (e.target === wrap) skip(); });
    const skip = () => { if (!data.profile.onboarded) setProfile({ skipped: true }); closeModal(); };
    const draw = () => {
      GH.ui.clear(box);
      box.appendChild(h('div', { class: 'onboard-top' }, h('span', { class: 'eyebrow' }, 'STEP ' + step + ' / 2'), h('button', { class: 'iconbtn', type: 'button', 'aria-label': '닫기', onclick: skip }, GH.icon('close'))));
      if (step === 1) {
        box.appendChild(h('h2', { id: 'onboard-title' }, '음악을 얼마나 알고 계세요?'));
        box.appendChild(h('p', { class: 'muted' }, '수준에 맞춰 쉬운 것부터 순서대로 추천해 드립니다. 나중에 설정에서 언제든 바꿀 수 있어요.'));
        box.appendChild(h('div', { class: 'onboard-options', role: 'radiogroup' }, LEVELS.map(l => h('button', { class: 'onboard-option' + (draft.level === l.id ? ' active' : ''), type: 'button', role: 'radio', 'aria-checked': draft.level === l.id ? 'true' : 'false', onclick: () => { draft.level = l.id; draw(); } }, h('i', { class: 'dyn-tag', 'aria-hidden': 'true' }, l.dyn), h('b', null, l.ko), h('small', null, l.desc)))));
        box.appendChild(h('div', { class: 'onboard-actions' }, h('button', { class: 'btn', type: 'button', onclick: skip }, '나중에 할게요'), h('button', { class: 'btn primary', type: 'button', onclick: () => { step = 2; draw(); } }, '다음 →')));
      } else {
        box.appendChild(h('h2', { id: 'onboard-title' }, '이 사이트에서 무엇을 얻고 싶으세요?'));
        box.appendChild(h('p', { class: 'muted' }, '여러 개를 골라도 됩니다. 고른 순서대로 우선해서 추천합니다.'));
        box.appendChild(h('div', { class: 'onboard-options goals' }, GOALS.map(g => { const k = draft.goals.indexOf(g.id); return h('button', { class: 'onboard-option' + (k >= 0 ? ' active' : ''), type: 'button', 'aria-pressed': k >= 0 ? 'true' : 'false', onclick: () => { if (k >= 0) draft.goals.splice(k, 1); else draft.goals.push(g.id); draw(); } }, h('span', { class: 'onboard-icon', 'aria-hidden': 'true' }, k >= 0 ? String(k + 1) : GH.icon(g.icon)), h('b', null, g.ko), h('small', null, g.desc)); })));
        const preview = plan({ level: draft.level, goals: draft.goals }).slice(0, 3);
        if (draft.goals.length) box.appendChild(h('div', { class: 'onboard-preview' }, h('span', { class: 'muted' }, '먼저 해 볼 것: '), preview.map((m, i) => h('span', { class: 'badge' }, (i + 1) + '. ' + m.title))));
        box.appendChild(h('div', { class: 'onboard-actions' }, h('button', { class: 'btn', type: 'button', onclick: () => { step = 1; draw(); } }, '← 이전'),
          h('button', { class: 'btn primary', type: 'button', disabled: !draft.goals.length, onclick: () => { setProfile({ level: draft.level, goals: draft.goals, onboarded: true, skipped: false }); closeModal(); if (opts.onDone) opts.onDone(); } }, '추천 받기')));
      }
      const first = box.querySelector('.onboard-option.active') || box.querySelector('.onboard-option'); if (first) first.focus({ preventScroll: true });
    };
    wrap.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); skip(); }
      if (e.key === 'Tab') { const f = Array.from(box.querySelectorAll('button:not([disabled])')); if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    });
    modal = wrap; document.body.appendChild(wrap); document.body.classList.add('panel-open');
    draw(); void wrap.offsetWidth; wrap.classList.add('open');
  }
  const shouldOnboard = () => !data.profile.onboarded && !data.profile.skipped;

  /* ---- 화면 조각 ---- */
  const levelKo = () => (LEVELS.find(l => l.id === data.profile.level) || {}).ko || '수준 미선택';
  const goalChips = () => (data.profile.goals || []).map(id => { const g = GOALS.find(x => x.id === id); return g ? h('span', { class: 'badge' }, GH.icon(g.icon, { cls: 'badge-ic' }), g.ko) : null; });
  function progressBar(list) { const done = list.filter(m => isDone(m.id)).length; return h('div', { class: 'guide-progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': list.length, 'aria-valuenow': done }, h('span', { style: 'width:' + (list.length ? Math.round(100 * done / list.length) : 0) + '%' }), h('small', null, done + ' / ' + list.length + ' 완료')); }

  /* 홈 카드: 설문 전에는 시작 안내, 후에는 다음 미션 */
  function homeCard() {
    const rerender = () => GH.router.rerender();
    if (!data.profile.onboarded) {
      return h('section', { class: 'guide-card start' },
        h('div', null, h('span', { class: 'eyebrow' }, 'MY GUIDE'), h('h2', null, '나에게 맞는 순서를 추천받으세요'), h('p', { class: 'muted' }, '음악 지식 수준과 목표를 두 번의 선택으로 알려 주시면, 쉬운 것부터 차례로 할 일을 골라 드립니다.')),
        h('button', { class: 'btn primary', type: 'button', onclick: () => openOnboarding({ onDone: rerender }) }, '30초 설문 시작 →'));
    }
    const list = plan(); const n = next();
    return h('section', { class: 'guide-card' },
      h('div', { class: 'guide-card-head' }, h('div', null, h('span', { class: 'eyebrow' }, 'MY GUIDE'), h('h2', null, n ? '다음에 할 일' : '추천 미션을 모두 마쳤어요')),
        h('div', { class: 'row', style: 'gap:6px' }, h('span', { class: 'badge accent' }, levelKo()), goalChips(), h('button', { class: 'btn small', type: 'button', onclick: () => openOnboarding({ onDone: rerender }) }, '수정'))),
      n ? h('a', { class: 'guide-next', href: missionHref(n) }, h('b', null, n.title), h('span', { class: 'muted' }, n.desc), h('span', { class: 'guide-go', 'aria-hidden': 'true' }, GH.icon('arrow')))
        : h('p', null, '수준을 한 단계 올리거나 목표를 추가하면 새 미션이 나옵니다.'),
      progressBar(list),
      h('a', { class: 'guide-all', href: '#/learn' }, '전체 추천 경로 보기 →'));
  }
  /* 배우기 페이지의 맞춤 경로 */
  function planSection() {
    const rerender = () => GH.router.rerender();
    if (!data.profile.onboarded) return h('section', { class: 'section guide-plan' }, h('h2', null, '나를 위한 경로'), h('p', { class: 'muted' }, '수준과 목표를 알려 주시면 아래 로드맵에서 지금 할 것만 골라 순서대로 보여 드립니다.'), h('button', { class: 'btn primary', type: 'button', onclick: () => openOnboarding({ onDone: rerender }) }, '수준 · 목표 고르기'));
    const list = plan();
    return h('section', { class: 'section guide-plan' },
      h('div', { class: 'row', style: 'justify-content:space-between' }, h('h2', { style: 'margin:0' }, '나를 위한 경로'), h('div', { class: 'row', style: 'gap:6px' }, h('span', { class: 'badge accent' }, levelKo()), goalChips(), h('button', { class: 'btn small', type: 'button', onclick: () => openOnboarding({ onDone: rerender }) }, '수정'))),
      progressBar(list),
      h('ol', { class: 'mission-list' }, list.map((m, i) => h('li', { class: 'mission' + (isDone(m.id) ? ' done' : '') },
        h('button', { class: 'mission-check', type: 'button', 'aria-pressed': isDone(m.id) ? 'true' : 'false', 'aria-label': m.title + (isDone(m.id) ? ' 완료 취소' : ' 완료로 표시'), onclick: () => { toggleDone(m.id); rerender(); } }, isDone(m.id) ? GH.icon('check') : String(i + 1).padStart(2, '0')),
        h('a', { href: missionHref(m) }, h('b', null, m.title), h('small', null, m.desc))))));
  }
  /* 페이지 위 가이드 막대 */
  function pageInfo(path) { const hit = PAGES.filter(([p]) => path === p || path.startsWith(p.endsWith('/') ? p : p + '/') || (p.endsWith('/') && path.startsWith(p))).sort((a, b) => b[0].length - a[0].length)[0]; return hit || null; }
  let lastPath = null; const openState = {};
  function decorate(route) {
    const app = document.getElementById('app'); if (!app || !route) return;
    if (route.path !== lastPath) { lastPath = route.path; data.visits[route.path] = (data.visits[route.path] || 0) + 1; save(); }
    const old = app.querySelector(':scope > .page-guide'); if (old) old.remove();
    if (route.path === '/' || route.path === '/learn' || data.profile.showGuides === false) return;
    const info = pageInfo(route.path); const mission = data.profile.onboarded ? missionFor(route) : null;
    if (!info && !mission) return;
    /* 처음 두 번 방문할 때만 펼쳐 둔다 (초보 수준일 때) */
    const beginner = (!data.profile.onboarded || levelIdx() <= 1) && (data.visits[route.path] || 0) <= 2;
    const open = openState[route.path] != null ? openState[route.path] : beginner;
    const n = next();
    const box = h('details', { class: 'page-guide', open: open ? true : null, ontoggle: e => { openState[route.path] = e.currentTarget.open; } },
      h('summary', null, h('span', { class: 'guide-dot', 'aria-hidden': 'true' }, GH.icon('note')), h('span', null, mission ? '미션 · ' + mission.title : '이 페이지 사용법'), mission && isDone(mission.id) ? h('span', { class: 'badge accent' }, '완료') : null, h('span', { class: 'pg-toggle', 'aria-hidden': 'true' }, GH.icon('sharp', { cls: 'when-closed' }), GH.icon('natural', { cls: 'when-open' }))),
      h('div', { class: 'page-guide-body' },
        info ? h('p', null, info[1]) : null,
        info ? h('ol', null, info[2].map(t => h('li', null, t))) : null,
        mission ? h('p', { class: 'muted' }, mission.desc) : null,
        h('div', { class: 'row', style: 'gap:6px' },
          mission ? h('button', { class: 'btn small' + (isDone(mission.id) ? '' : ' primary'), type: 'button', onclick: () => { toggleDone(mission.id); decorate(GH.router.current()); } }, isDone(mission.id) ? '완료 취소' : [GH.icon('check'), '미션 완료']) : null,
          n && (!mission || n.id !== mission.id) ? h('a', { class: 'btn small', href: missionHref(n) }, '다음 미션: ' + n.title + ' →') : null,
          !data.profile.onboarded ? h('button', { class: 'btn small', type: 'button', onclick: () => openOnboarding({ onDone: () => GH.router.rerender() }) }, '맞춤 추천 받기') : null,
          h('button', { class: 'btn small ghost', type: 'button', onclick: () => { setProfile({ showGuides: false }); decorate(GH.router.current()); } }, '가이드 숨기기'))));
    app.insertBefore(box, app.firstChild);
  }
  function resetProgress() { data.done = {}; data.visits = {}; save(); GH.events.emit('guide', data); }

  GH.guide = { LEVELS, GOALS, MISSIONS, PAGES, missionHref, profile, setProfile, plan, next, isDone, toggleDone, missionFor, openOnboarding, shouldOnboard, homeCard, planSection, decorate, resetProgress, levelKo };
})();
