/* 따라 하기 코치: 화면의 실제 버튼 · 건반 · 선택 상자를 하나씩 가리키며 "여기를 눌러 보세요" 하고 알려 준다.
   - 단계: { sel: CSS 선택자, has: 이 글자를 담은 것만, say: 설명 }
   - 가리킨 것을 누르면 다음 단계로 넘어가고, 페이지를 다시 그려도 이어서 가리킨다
   - 오른쪽 아래의 도움말 버튼은 단계가 있는 모든 페이지에 뜬다 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h } = GH.ui;

  const QUIZ = [
    { sel: 'button', has: '▶ 문제 듣기', say: '먼저 ▶ 문제 듣기를 눌러 소리를 들어요. 몇 번이고 다시 들어도 괜찮아요.' },
    { sel: '.quiz-opts', say: '들린 것과 같다고 생각하는 답을 누르세요. 키보드 숫자로도 고를 수 있어요.' },
    { sel: '.quiz-feedback', say: '맞았는지 여기서 알려 줘요. 틀렸다면 정답과 내가 고른 답을 번갈아 들어 차이를 느껴 보세요.' },
    { sel: 'button', has: '다음 문제', say: '다음 문제로 넘어가요. 10문제쯤 풀고 점수를 확인해 보세요.' }
  ];
  const VOICINGS = [
    { sel: '.toolbar label', has: '루트', say: '먼저 코드의 루트(이름이 되는 음)를 고르세요. 예: C, G, A' },
    { sel: '.toolbar label', has: '코드 퀄리티', say: '메이저 · 마이너 · 세븐 같은 코드 종류를 고르세요.' },
    { sel: '.diagram-card', say: '코드 잡는 그림이에요. 세로줄이 기타 줄(왼쪽이 6번 줄), 점이 누를 곳이에요. 점을 누르면 그 줄 소리가 나요.' },
    { sel: '.diagram-card .play-btn', say: '▶ 듣기로 코드 전체를 들어 보세요. 기타로 똑같이 잡아서 같은 소리가 나면 성공이에요.' }
  ];
  const TECH_DETAIL = [
      { sel: '.tech-how', say: '먼저 어떻게 하는지 읽어요. 아래의 번호 · 기호 설명도 한 번 봐 두세요.' },
      { sel: '.tech-notation', say: '악보예요. 연주하는 동안 지금 칠 음이 색으로 표시돼요.' },
      { sel: 'button', has: '▶ 시작', say: '▶ 시작을 누르면 "하나 둘 셋 넷"을 센 뒤 소리가 나요. 악기로 같이 따라 해 보세요.' },
      { sel: '.tech-tempo', say: '틀리지 않고 할 수 있는 템포로 맞춰요. 익숙해지면 5 BPM씩 올리거나 스피드 트레이너를 켜요.' },
      { sel: '.tech-play-opts', say: '익숙해지면 스피드 트레이너를 켜 보세요. 몇 번 반복할 때마다 템포가 조금씩 올라가요. 마지막으로 쓴 템포는 다음에도 그대로 이어져요.' }
    ];
  const STEPS = {
    '/': [
      { sel: '.home-search', say: '궁금한 코드나 스케일 이름을 여기에 적으면 바로 찾아 줘요. 예: Cmaj7, 도리안, ii-V-I' },
      { sel: '.guide-card', say: '나에게 맞는 순서를 알려 주는 곳이에요. 두 가지 질문에 답하면 "다음에 할 일"이 여기에 나와요.' },
      { sel: '.path-card', say: '처음이라면 이 카드(기초 코스)부터 시작하세요. 레슨 한 장에 개념 하나씩이라 부담 없어요.' }
    ],
    '/learn': [
      { sel: '.course-resume', say: '이 버튼을 누르면 첫 레슨(또는 하던 레슨)이 바로 열려요. 뭘 할지 모르겠으면 여기부터!' },
      { sel: '.course-chapters', say: '기초 코스는 6장, 23개의 짧은 레슨이에요. 1장부터 순서대로 가면 됩니다.' },
      { sel: '.roadmap', say: '기초 코스를 마친 뒤에는 이 로드맵을 따라 도구와 퀴즈로 넓혀 가요.' }
    ],
    '/learn/': [
      { sel: '.lesson-body', say: '먼저 짧은 설명을 천천히 읽어요. 노란 밑줄이 꼭 알아야 할 말이에요.' },
      { sel: '.lesson-widget', say: '버튼과 건반을 눌러 직접 소리를 들어 보세요. 눌러 보는 게 가장 빨리 익히는 방법이에요.' },
      { sel: '.lesson-try', say: '악기를 들고(보컬은 목소리로) 적힌 순서대로 따라 해 보세요. 악기가 없으면 위의 소리로만 해도 괜찮아요.' },
      { sel: '.lesson-quiz', say: '마지막으로 문제 하나! 맞히면 레슨 완료로 기록돼요.' },
      { sel: '.lesson-next', say: '다 했으면 다음 레슨으로 넘어가요.' }
    ],
    '/tools/finder': [
      { sel: '.fretboard-scroll', say: '기타 지판이에요. 줄마다 누르고 싶은 칸을 한 번씩 눌러 보세요. 같은 칸을 다시 누르면 지워져요.' },
      { sel: 'button', has: '▶ 듣기', say: '잡은 모양을 한 번에 들어 봐요.' },
      { sel: '.empty, .list, .table-wrap', say: '여기에 가능한 코드 이름이 나와요. 두 줄 이상 누르면 나타납니다.' }
    ],
    '/guitar/voicings': [{ sel: '.card', say: '처음이라면 왼쪽 "기본 코드 폼"을 누르세요. 오픈 코드부터 차근차근 볼 수 있어요.' }],
    '/guitar/voicings/basic': VOICINGS,
    '/guitar/voicings/advanced': VOICINGS.concat([{ sel: '.toolbar label', has: '코드 진행', say: '아래에서는 진행을 고르고 보이스 리딩(손 이동이 가장 적은 연결)을 들어 볼 수 있어요.' }]),
    '/guitar/scales': [
      { sel: '.toolbar label', has: '스케일', say: '연습할 스케일을 고르세요. 처음이라면 마이너 펜타토닉이 좋아요.' },
      { sel: '.chips', say: '"전체" 대신 "1번 포지션"을 누르면 한 자리의 모양만 보여요. 그 모양 하나만 먼저 외우세요.' },
      { sel: '.fretboard-scroll', say: '점이 스케일 음이에요. 빨간 점이 루트예요. 눌러서 소리를 들어 보세요.' },
      { sel: 'button', has: '▶ 재생', say: '연습 패턴을 틀고 박자에 맞춰 따라 쳐 보세요. 템포는 느리게 시작해도 돼요.' }
    ],
    '/guitar/triads': [
      { sel: '.toolbar label', has: '루트', say: '연습할 코드의 루트를 고르세요.' },
      { sel: '.diagram-card', say: '같은 코드를 여러 자리에서 잡는 모양이에요. 한 줄 세트(예: 3-2-1번 줄)만 골라 기본형 → 1전위 → 2전위로 올라가 보세요.' },
      { sel: 'button', has: '인버전 순서대로', say: '한 세트의 모양을 순서대로 들어 봐요.' },
      { sel: 'button', has: '▶ 아르페지오 듣기', say: '아래 아르페지오로 코드톤을 한 음씩 쳐 봐요.' }
    ],
    '/guitar/doublestops': [
      { sel: '.toolbar label', has: '인터벌', say: '3도와 6도 중에 고르세요. 처음이면 3도가 쉬워요.' },
      { sel: '.toolbar label', has: '줄 쌍', say: '함께 누를 두 줄을 고르세요. 2 · 3번 줄이 가장 쉬워요.' },
      { sel: '.ds-view', say: 'TAB과 지판에 두 음씩 표시돼요. 두 손가락으로 동시에 누르고 함께 쳐요.' },
      { sel: 'button', has: '▶ 더블스탑 듣기', say: '소리를 듣고 느린 템포로 올라갔다 내려와 보세요.' }
    ],
    '/guitar/phrasing': [
      { sel: '.card', say: '솔로를 만드는 기법 카드예요. 위에서부터 ▶ 듣기로 하나씩 들어 보세요.' },
      { sel: 'button', has: '빌더에서 열기', say: '마음에 드는 기법을 빌더로 가져와요.' },
      { sel: '.toolbar label', has: '진행', say: '빌더에서 진행과 키를 바꿔 보세요. 라인이 새로 만들어져요.' },
      { sel: 'button', has: '▶ 라인 듣기', say: '만든 라인을 듣고 따라 쳐 보세요.' }
    ],
    '/technique': [
      { sel: '.tech-insts', say: '연습할 세션(악기)을 골라요. 고른 세션은 "내 세션"으로 표시돼요.' }
    ],
    '/technique/': [
      { sel: '.tech-routine', say: '오늘 할 연습 순서예요. 수준에 맞는 루틴을 고르고 "루틴 시작"을 누르면 하나씩 안내하고 시간도 재 줘요.' },
      { sel: '.tech-cat summary', say: '분류를 눌러 펼치거나 접어요. 연습을 하나만 골라도 돼요. 처음이라면 p(입문) 표시가 있는 것부터.' }
    ],
    '/technique/guitar/': TECH_DETAIL,
    '/technique/bass/': TECH_DETAIL,
    '/technique/keys/': TECH_DETAIL,
    '/technique/drums/': TECH_DETAIL,
    '/technique/vocal/': TECH_DETAIL,
    '/guitar/licks': [
      { sel: '.toolbar label', has: '난이도', say: '난이도를 p 입문이나 mp 기초로 골라 보세요.' },
      { sel: '.list-item', say: '마음에 드는 릭을 누르세요. TAB · 악보 · 느린 재생이 들어 있어요.' }
    ],
    '/guitar/licks/': [
      { sel: 'button', has: '▶ 느리게', say: '먼저 느리게(60%) 들으면서 음을 확인해요.' },
      { sel: 'svg.tab, .section', say: 'TAB의 숫자가 누를 프렛, 가로줄이 기타 줄이에요. 한 마디씩 따라 쳐 보세요.' },
      { sel: '.toolbar label', has: '키 옮기기', say: '익숙해지면 다른 키로 옮겨서 쳐 보세요.' }
    ],
    '/theory/intervals': [
      { sel: '.toolbar label', has: '기준음', say: '기준이 되는 음이에요. 처음에는 C 그대로 두세요.' },
      { sel: '.table-wrap', say: '반음 수마다 인터벌 이름이 있어요. 줄을 누르면 자세한 설명으로 가요.' },
      { sel: 'button', has: '▶ 멜로딕', say: '두 음을 차례로 들어 보세요.' },
      { sel: 'button', has: '▶ 하모닉', say: '두 음을 동시에 들어 보세요. 잘 어울리는 소리와 부딪히는 소리를 비교해 봐요.' }
    ],
    '/theory/intervals/': [{ sel: 'button', has: '▶', say: '▶ 버튼으로 두 음을 차례로, 동시에 들어 보고 지판 모양을 기타로 짚어 보세요.' }],
    '/theory/chords': [
      { sel: '.toolbar label', has: '루트', say: '코드의 루트를 고르세요.' },
      { sel: '.toolbar label', has: '코드 퀄리티', say: '메이저, 마이너, 세븐처럼 코드 종류를 바꿔 보세요.' },
      { sel: '.toolbar button', has: '▶ 듣기', say: '바꿀 때마다 들어 보고 밝은지 어두운지 비교해요.' },
      { sel: '#app .card', say: '구성음과 도수가 여기 나와요. R · 3 · 5가 어떤 음인지 확인하세요.' }
    ],
    '/theory/chords?tab=diatonic': [
      { sel: '.toolbar label', has: '키', say: '키를 고르세요.' },
      { sel: '.prog-strip', say: '한 키 안의 코드 7개예요. 색은 역할(토닉 · 서브도미넌트 · 도미넌트)이에요. 칸을 눌러 들어 보세요.' },
      { sel: 'button', has: '▶ 전부 순서대로', say: '1도부터 차례로 들어 보세요.' }
    ],
    '/theory/scales': [
      { sel: '.tabs', say: '전체 목록, 5도권, 코드–스케일 표, 스케일 비교로 나뉘어 있어요.' },
      { sel: '.table-wrap', say: '스케일 이름을 누르면 소리와 건반 · 지판 그림이 있는 자세한 페이지로 가요. 처음엔 아이오니안(메이저 스케일)부터.' }
    ],
    '/theory/progressions': [
      { sel: '.chips', say: '장르를 골라 목록을 좁혀요.' },
      { sel: '.card', say: '진행을 하나 누르세요. 처음이면 "기본 3코드"나 "팝 4코드"가 좋아요.' }
    ],
    '/theory/progressions/': [
      { sel: 'button', has: '▶ 재생', say: '▶ 재생으로 진행을 들어 보세요.' },
      { sel: '.prog-strip', say: '색은 코드의 역할이에요. 토닉(안정) → 도미넌트(긴장) → 토닉으로 흐르는 걸 들어 보세요.' },
      { sel: '.chart', say: '코드 차트예요. 기타로 한 마디에 코드 하나씩 따라 쳐 보세요.' }
    ],
    '/theory/modes': [{ sel: '.brightness', say: '밝은 모드부터 어두운 모드까지 나란히 있어요. 하나씩 눌러 들어 보고 특징음을 찾아봐요.' }],
    '/theory/reharm': [{ sel: '.card', say: '기법을 하나 고르세요. 안에서 원래 진행(A)과 바꾼 진행(B)을 번갈아 들어요.' }],
    '/theory/reharm/': [
      { sel: 'button', has: '▶ A 듣기', say: '먼저 원래 진행(A)을 들어요.' },
      { sel: 'button', has: '▶ B 듣기', say: '이어서 바꾼 진행(B)을 들어요. 무엇이 달라졌는지 느껴 보세요.' }
    ],
    '/ear': QUIZ,
    '/rhythm': [
      { sel: 'button', has: '▶ 시작', say: '메트로놈을 켜요.' },
      { sel: '.met-dots', say: '박마다 점이 켜져요. 박에 맞춰 발을 구르거나 손뼉을 쳐 보세요.' },
      { sel: '.num-field', say: '템포(BPM)를 바꿔요. 처음엔 60~80 정도가 좋아요.' },
      { sel: '.tabs', say: '익숙해지면 "리듬 따라 치기"와 "스트럼 패턴" 탭도 해 보세요.' }
    ],
    '/rhythm?tab=tap': [
      { sel: '.rhythm-picks', say: '칠 리듬을 골라요.' },
      { sel: 'button', has: '▶ 먼저 들어 보기', say: '어떤 리듬인지 먼저 들어 봐요.' },
      { sel: 'button', has: '▶ 시작', say: '시작을 누르면 한 마디를 세고 나서 시작해요.' },
      { sel: '.tap-pad', say: '리듬에 맞춰 이 패드를 누르세요(스페이스 키도 돼요). 끝나면 점수가 나와요.' }
    ],
    '/rhythm?tab=strum': [
      { sel: '.rhythm-picks', say: '스트로크 패턴을 골라요. 처음엔 "4분 다운"부터.' },
      { sel: '.strum-grid', say: 'D는 내려치기, U는 올려치기, 흐린 칸은 헛치기(손만 지나가기)예요.' },
      { sel: 'button', has: '▶ 시작', say: '코드 진행에 맞춰 패턴이 나와요. 소리에 맞춰 따라 쳐 보세요.' }
    ],
    '/backing': [
      { sel: '.toolbar label', has: '진행', say: '연습할 코드 진행을 골라요.' },
      { sel: '.toolbar label', has: '그루브', say: '스타일(팝, 록, 스윙 …)을 골라요.' },
      { sel: 'button', has: '▶ 시작', say: 'MR을 시작해요. 템포는 느리게 시작해도 돼요.' },
      { sel: '.now-box', say: '지금 코드와 그 코드의 음이 지판에 보여요. 색 있는 음 위주로 쳐 보세요.' }
    ],
    '/tools/melody': [
      { sel: '.mg-len', say: '찍을 음의 길이를 먼저 골라요. 4분음표가 한 박이에요.' },
      { sel: '.mgrid-scroll', say: '격자를 눌러 멜로디를 찍어요. 가로는 시간, 세로는 음 높이예요. 예시를 불러와서 고쳐 봐도 좋아요.' },
      { sel: '.mg-progs', say: '어울리는 코드 진행이 순위별로 나와요. 하나를 눌러 고르고 ▶ 로 들어 보세요.' },
      { sel: '.mg-voices', say: '멜로디에 얹을 화음을 고르고 ▶ 모두 재생으로 멜로디 · 화음 · 코드 · 베이스를 함께 들어요.' }
    ],
    '/tools/harmony': [
      { sel: 'svg.piano', say: '건반을 눌러 멜로디를 넣어요.' },
      { sel: '.chip', has: '3도 위', say: '빠른 설정에서 "3도 위"를 먼저 눌러 보세요.' },
      { sel: 'button', has: '▶ 전체 재생', say: '멜로디와 화음을 함께 들어요.' },
      { sel: '.voice-rows', say: '보이스마다 뮤트 · 솔로로 따로 들을 수 있어요.' }
    ],
    '/songs': [{ sel: '.card', say: '곡을 하나 고르세요.' }],
    '/songs/': [
      { sel: 'button', has: '▶ 전체 차트 재생', say: '먼저 전체를 들어 보세요.' },
      { sel: '.chart', say: '마디를 누르면 그 마디의 코드 · 스케일 · 보이싱이 나와요.' }
    ],
    '/chord/': [
      { sel: '#app .card button', has: '▶ 듣기', say: '먼저 코드 소리를 들어요.' },
      { sel: '.diagram-card', say: '기타로 잡는 여러 방법이에요. 잡기 쉬운 것 하나를 골라 따라 잡아 보세요.' },
      { sel: '.table-wrap', say: '이 코드 위에서 솔로할 때 쓰는 스케일이에요.' }
    ]
  };
  /* 경로 + 탭 → 단계 */
  function keyFor(route) {
    if (!route) return null;
    const tab = route.query && route.query.tab;
    if (tab && STEPS[route.path + '?tab=' + tab]) return route.path + '?tab=' + tab;
    if (STEPS[route.path]) return route.path;
    const pre = Object.keys(STEPS).filter(k => k.endsWith('/') && k.length > 1 && route.path.startsWith(k)).sort((a, b) => b.length - a.length)[0];
    if (pre) return pre;
    const up = Object.keys(STEPS).filter(k => !k.endsWith('/') && k.length > 1 && route.path.startsWith(k + '/')).sort((a, b) => b.length - a.length)[0];
    return up || null;
  }
  const stepsFor = route => { const k = keyFor(route); return k ? STEPS[k] : null; };

  /* ---- 화면 요소 찾기 ---- */
  function visible(e) { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && getComputedStyle(e).visibility !== 'hidden'; }
  function find(step) {
    const app = document.getElementById('app'); if (!app) return null;
    let list = []; try { list = Array.from(app.querySelectorAll(step.sel)); } catch (e) { return null; }
    return list.find(e => visible(e) && !e.closest('.page-guide') && (!step.has || (e.textContent || '').includes(step.has))) || null;
  }

  /* ---- 코치 상태 ---- */
  let cur = null; /* { key, steps, i, path, target } */
  let ring = null, bubble = null, raf = 0;
  const reduce = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ensureUI() {
    if (ring) return;
    ring = h('div', { class: 'coach-ring', 'aria-hidden': 'true' });
    bubble = h('div', { class: 'coach-bubble', role: 'dialog', 'aria-live': 'polite', 'aria-label': '따라 하기' });
    document.body.appendChild(ring); document.body.appendChild(bubble);
  }
  function start(route, at) {
    route = route || GH.router.current();
    clearNudge();
    const key = keyFor(route); if (!key) return false;
    ensureUI();
    cur = { key, steps: STEPS[key], i: at || 0, path: route.path, target: null };
    document.body.classList.add('coach-on');
    show(true);
    renderFab();
    return true;
  }
  function stop() {
    cur = null;
    if (ring) { ring.classList.remove('on'); bubble.classList.remove('on'); }
    cancelAnimationFrame(raf); raf = 0;
    document.body.classList.remove('coach-on');
    renderFab();
  }
  function go(d) { if (!cur) return; const n = cur.i + d; if (n < 0) return; if (n >= cur.steps.length) { finish(); return; } cur.i = n; show(true); }
  function finish() {
    const route = GH.router.current();
    const mission = GH.guide && GH.guide.missionFor ? GH.guide.missionFor(route) : null;
    const next = GH.guide && GH.guide.next ? GH.guide.next() : null;
    cur.i = cur.steps.length; cur.target = null;
    ring.classList.remove('on');
    GH.ui.clear(bubble);
    bubble.appendChild(h('div', { class: 'coach-top' }, h('b', null, '잘했어요!'), h('button', { class: 'iconbtn coach-x', type: 'button', 'aria-label': '닫기', onclick: stop }, GH.icon('close'))));
    bubble.appendChild(h('p', null, mission && !GH.guide.isDone(mission.id) ? '이 페이지에서 할 일을 모두 해 봤어요. 미션을 완료로 표시할까요?' : '이 페이지에서 할 일을 모두 해 봤어요. 한 번 더 해 보거나 다음으로 넘어가세요.'));
    bubble.appendChild(h('div', { class: 'coach-actions' },
      mission && !GH.guide.isDone(mission.id) ? h('button', { class: 'btn small primary', type: 'button', onclick: () => { GH.guide.toggleDone(mission.id, true); GH.guide.decorate(GH.router.current()); finish(); } }, GH.icon('check'), '미션 완료') : null,
      next && (!mission || next.id !== mission.id) ? h('a', { class: 'btn small' + (mission && !GH.guide.isDone(mission.id) ? '' : ' primary'), href: GH.guide.missionHref(next, { coach: 1 }), onclick: stop }, '다음: ' + next.title + ' →') : null,
      h('button', { class: 'btn small ghost', type: 'button', onclick: () => { cur.i = 0; show(true); } }, '처음부터 다시')));
    placeBubble(null); bubble.classList.add('on');
  }
  function show(scroll) {
    if (!cur) return;
    const step = cur.steps[cur.i];
    const t = find(step); cur.target = t;
    GH.ui.clear(bubble);
    const n = cur.steps.length;
    bubble.appendChild(h('div', { class: 'coach-top' },
      h('span', { class: 'coach-count' }, '따라 하기 ' + (cur.i + 1) + ' / ' + n),
      h('span', { class: 'coach-dots', 'aria-hidden': 'true' }, cur.steps.map((_, j) => h('i', { class: j < cur.i ? 'done' : j === cur.i ? 'now' : '' }))),
      h('button', { class: 'iconbtn coach-x', type: 'button', 'aria-label': '따라 하기 끄기', onclick: stop }, GH.icon('close'))));
    bubble.appendChild(h('p', null, step.say));
    if (!t) bubble.appendChild(h('p', { class: 'muted small' }, '가리킬 곳이 아직 화면에 없어요. 위의 설명대로 해 본 뒤 다음을 눌러 주세요.'));
    else bubble.appendChild(h('p', { class: 'coach-hint' }, '표시된 곳을 눌러 보면 다음 단계로 넘어가요.'));
    bubble.appendChild(h('div', { class: 'coach-actions' },
      cur.i > 0 ? h('button', { class: 'btn small ghost', type: 'button', onclick: () => go(-1) }, '← 이전') : null,
      h('button', { class: 'btn small primary', type: 'button', onclick: () => go(1) }, cur.i === n - 1 ? '다 했어요' : '다음 →')));
    bubble.classList.add('on');
    if (t) {
      ring.classList.add('on'); ring.classList.remove('pulse'); void ring.offsetWidth; ring.classList.add('pulse');
      if (scroll) {
        const r = t.getBoundingClientRect(); const vh = innerHeight;
        if (r.top < 80 || r.bottom > vh - 180) window.scrollTo({ top: Math.max(0, scrollY + r.top - Math.min(vh * 0.3, 160)), behavior: reduce() ? 'auto' : 'smooth' });
      }
    } else ring.classList.remove('on');
    loop();
  }
  /* 매 프레임 가리킨 요소 위치에 테두리와 말풍선을 붙인다 */
  function loop() {
    cancelAnimationFrame(raf);
    const tick = () => {
      raf = 0; if (!cur) return;
      if (cur.target && !cur.target.isConnected) { cur.target = find(cur.steps[cur.i] || {}); }
      if (cur.target) {
        const r = cur.target.getBoundingClientRect(), pad = 6;
        Object.assign(ring.style, { left: (r.left - pad) + 'px', top: (r.top - pad) + 'px', width: (r.width + pad * 2) + 'px', height: (r.height + pad * 2) + 'px' });
        placeBubble(r);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  function placeBubble(r) {
    const vw = innerWidth, vh = innerHeight, bw = Math.min(360, vw - 24);
    bubble.style.width = bw + 'px';
    const bh = bubble.offsetHeight || 150;
    let left, top, side = 'center';
    if (!r) { left = (vw - bw) / 2; top = vh - bh - 18; }
    else {
      left = Math.max(12, Math.min(vw - bw - 12, r.left + r.width / 2 - bw / 2));
      if (r.bottom + 14 + bh < vh - 8) { top = r.bottom + 14; side = 'below'; }
      else if (r.top - 14 - bh > 70) { top = r.top - 14 - bh; side = 'above'; }
      else { top = vh - bh - 18; side = 'center'; }
      bubble.style.setProperty('--arrow-x', Math.max(18, Math.min(bw - 18, r.left + r.width / 2 - left)) + 'px');
    }
    bubble.dataset.side = side;
    bubble.style.left = left + 'px'; bubble.style.top = top + 'px';
  }
  /* 가리킨 것을 누르면 (페이지가 다시 그려진 뒤) 다음 단계로 */
  function onUse(e) {
    if (!cur || !cur.target || cur.i >= cur.steps.length) return;
    if (bubble.contains(e.target) || (fab && fab.contains(e.target))) return;
    if (cur.target.contains(e.target) || e.target === cur.target) {
      const at = cur.i;
      setTimeout(() => { if (cur && cur.i === at) go(1); }, e.type === 'change' ? 250 : 450);
    }
  }
  document.addEventListener('click', onUse, true);
  document.addEventListener('change', onUse, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && cur) stop(); });

  /* ---- 오른쪽 아래 도움말 버튼 ---- */
  let fab = null;
  function renderFab() {
    const route = GH.router && GH.router.current();
    const has = !!keyFor(route);
    if (!fab) {
      fab = h('button', { class: 'coach-fab', type: 'button', onclick: () => { if (cur) stop(); else start(); } });
      document.body.appendChild(fab);
    }
    fab.hidden = !has;
    GH.ui.clear(fab);
    if (cur) fab.append(GH.icon('close'), h('span', null, '따라 하기 끄기'));
    else fab.append(h('span', { class: 'coach-fab-q', 'aria-hidden': 'true' }, '?'), h('span', null, '뭘 하지?'));
    fab.setAttribute('aria-label', cur ? '따라 하기 끄기' : '이 페이지에서 할 일을 하나씩 알려 드려요');
  }
  /* 처음 온 페이지면 도움말 버튼 옆에 짧은 말풍선 */
  let nudgeTimer = 0, nudgeTip = null;
  function clearNudge() { clearTimeout(nudgeTimer); if (nudgeTip) { nudgeTip.remove(); nudgeTip = null; } if (fab) fab.classList.remove('nudge'); }
  function nudge(route) {
    const now = GH.router.current(); if (!now || now.path !== route.path) return;
    const seen = (() => { try { return JSON.parse(localStorage.getItem('gh.coach.v1')) || {}; } catch (e) { return {}; } })();
    const key = keyFor(route); if (!key || seen[key] || cur) return;
    const prof = GH.guide && GH.guide.profile ? GH.guide.profile() : {};
    if (prof.level === 'player' || prof.level === 'advanced') return; /* 익숙한 사람에게는 말풍선을 띄우지 않는다 */
    seen[key] = 1; try { localStorage.setItem('gh.coach.v1', JSON.stringify(seen)); } catch (e) { /* ignore */ }
    clearNudge(); fab.classList.add('nudge');
    const tip = nudgeTip = h('div', { class: 'coach-nudge', role: 'status' }, '처음이세요? 여기를 누르면 할 일을 하나씩 짚어 드려요');
    document.body.appendChild(tip);
    nudgeTimer = setTimeout(clearNudge, 7000);
    tip.addEventListener('click', () => { clearNudge(); start(); });
  }
  /* 라우터가 그릴 때마다: 같은 페이지면 이어서 가리키고, 다른 페이지로 가면 끈다. ?coach=1 이면 바로 시작 */
  function onRoute(route) {
    renderFab();
    if (!route.samePage) clearNudge();
    if (cur && route.path !== cur.path) stop();
    if (cur) { if (cur.i < cur.steps.length) show(false); return; }
    if (route.query && String(route.query.coach) === '1') {
      setTimeout(() => { const c = GH.router.current(); if (c && c.path === route.path) start(c); }, 350);
      try { const url = location.hash.replace(/([?&])coach=1(&|$)/, (m, a, b) => (b ? a : '')).replace(/[?&]$/, ''); history.replaceState(history.state, '', url); } catch (e) { /* ignore */ }
      return;
    }
    setTimeout(() => nudge(route), 900);
  }
  GH.coach = { STEPS, keyFor, stepsFor, start, stop, onRoute, active: () => !!cur, find };
})();
