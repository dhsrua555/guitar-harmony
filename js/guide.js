/* 학습 가이드: 처음 방문 설문(수준 · 목표), 맞춤 미션 순서, 진행 기록, 페이지별 가이드 막대 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h } = GH.ui;
  const KEY = 'gh.guide.v1';

  /* 수준: 사이트 난이도와 같은 셈여림 다섯 단계 (lv → GH.ui.LEVELS: p 입문 · mp 기초 · mf 중급 · f 중상급 · ff 고급) */
  const LEVELS = [
    { id: 'new', lv: 1, ko: '완전히 처음이에요', desc: '코드 이름이나 악보가 아직 낯설어요.' },
    { id: 'chords', lv: 2, ko: '코드 몇 개는 잡아요', desc: 'C, G, Am 같은 오픈 코드로 간단히 반주할 수 있어요.',
      by: { bass: ['간단한 곡은 쳐요', '루트 음을 따라 8분음표로 곡에 맞춰 칠 수 있어요.'], keys: ['코드 몇 개는 짚어요', 'C, F, G, Am 같은 코드로 간단히 반주할 수 있어요.'], drums: ['기본 비트는 쳐요', '8비트를 치며 곡에 맞춰 박을 유지할 수 있어요.'], vocal: ['한 곡은 끝까지 불러요', '반주에 맞춰 음정과 박을 크게 놓치지 않고 부를 수 있어요.'] } },
    { id: 'theory', lv: 3, ko: '기초 이론은 알아요', desc: '메이저 스케일, 인터벌 이름, 다이어토닉 코드를 알아요.' },
    { id: 'player', lv: 4, ko: '곡을 분석하고 솔로도 해요', desc: '펜타토닉으로 애드리브하고, 코드 진행을 1-5-6-4 · 투파이브처럼 숫자로 읽어요.',
      by: { bass: ['곡을 분석하고 라인을 만들어요', '코드톤과 어프로치로 워킹 라인을 만들고, 진행을 숫자로 읽어요.'], keys: ['곡을 분석하고 편곡도 해요', '보이싱을 골라 반주를 만들고, 코드 진행을 숫자로 읽어요.'], drums: ['곡 구성을 읽고 필인을 넣어요', '벌스 · 코러스 구성을 따라가며 필인과 다이내믹을 조절해요.'], vocal: ['화음을 넣고 애드리브도 해요', '3도 · 6도 화음을 넣고, 블루스 스케일로 애드리브해요.'] } },
    { id: 'advanced', lv: 5, ko: '꽤 공부했어요', desc: '모드, 텐션, 세컨더리 도미넌트, 리하모니, 재즈 진행이 익숙해요.' }
  ];
  LEVELS.forEach(l => { const L = GH.ui.LEVELS[l.lv]; l.dyn = L.dyn; l.tag = L.ko; });
  const GOALS = [
    { id: 'theory', ko: '화성학 이해', icon: 'piano', desc: '코드와 스케일이 왜 그렇게 들리는지' },
    { id: 'guitar', ko: '연주 실력 · 기본기', icon: 'guitar', desc: '운지 · 테크닉 · 매일 하는 기본기 연습' },
    { id: 'ear', ko: '음감 훈련', icon: 'ear', desc: '인터벌, 코드, 진행을 귀로 구분' },
    { id: 'solo', ko: '즉흥 솔로', icon: 'melody', desc: '코드 위에서 멜로디 만들기' },
    { id: 'compose', ko: '작곡 · 편곡', icon: 'staff', desc: '멜로디에 코드와 화음 붙이기' },
    { id: 'rhythm', ko: '리듬감', icon: 'metronome', desc: '박 유지, 스트럼, 싱코페이션' }
  ];
  /* 세션(악기): 모두 기본기 연습이 있고, 코드 폼 · 스케일 포지션 같은 나머지 도구는 아직 기타 중심 */
  const SESSIONS = [
    { id: 'guitar', ko: '기타', icon: 'guitar', desc: '코드 폼 · 스케일 · 릭 · 기본기' },
    { id: 'bass', ko: '베이스', icon: 'bass', desc: '투핑거 · 코드톤 · 워킹 · 그루브' },
    { id: 'keys', ko: '키보드', icon: 'piano', desc: '하논 · 스케일 · 카덴스 · 보이싱' },
    { id: 'drums', ko: '드럼', icon: 'drum', desc: '루디먼트 · 그루브 · 필인' },
    { id: 'vocal', ko: '보컬', icon: 'mic', desc: '호흡 · 음정 · 시창 · 애드리브' }
  ];
  /* lv: [가장 쉬운 수준, 가장 어려운 수준] (LEVELS 인덱스), inst: 이 세션을 고른 사람에게만 (없으면 모두) */
  const MISSIONS = [
    { id: 'course-ch1', title: '기초 코스 1장: 소리의 이름', route: '/learn/notes', goals: ['guitar', 'solo', 'theory'], lv: [0, 0], desc: '음 이름, 반음 · 온음, 개방현, 6 · 5번 줄의 음을 다섯 레슨으로 익힙니다.' },
    { id: 'course-ch2', title: '기초 코스 2장: 인터벌', route: '/learn/interval', goals: ['theory', 'ear'], lv: [0, 0], desc: '두 음 사이의 거리, 메이저 · 마이너 3도, 퍼펙트 5도와 파워 코드.' },
    { id: 'course-ch3', title: '기초 코스 3장: 첫 코드', route: '/learn/triad', goals: ['guitar', 'compose'], lv: [0, 1], desc: '트라이어드, 메이저 · 마이너 코드, 오픈 코드 8개, 코드 이름 읽기.' },
    { id: 'course-ch4', title: '기초 코스 4장: 리듬과 스트로크', route: '/learn/beat', goals: ['rhythm', 'guitar'], lv: [0, 1], desc: '박과 템포, 4분 · 8분음표, 다운 · 업 스트로크.' },
    { id: 'course-ch5', title: '기초 코스 5장: 키와 스케일', route: '/learn/majorscale', goals: ['solo', 'theory', 'ear'], lv: [0, 1], desc: '메이저 스케일, 키와 토닉, 다이어토닉 코드, 마이너 펜타토닉.' },
    { id: 'course-ch6', title: '기초 코스 6장: 코드 진행', route: '/learn/function', goals: ['compose', 'theory', 'solo'], lv: [0, 1], desc: '토닉 · 서브도미넌트 · 도미넌트, 1-5-6-4 와 투파이브원, MR 위에서 쳐 보기.' },
    { id: 'finder', title: '지판에서 음 찾기', route: '/tools/finder', goals: ['guitar', 'theory'], lv: [0, 1], desc: '지판을 눌러 소리를 들으며 같은 음이 어디에 또 있는지 찾아봅니다.' },
    { id: 'open', title: '오픈 코드 네 개 잡기 (C · G · Am · F)', route: '/guitar/voicings/basic', q: { types: 'open' }, goals: ['guitar', 'compose'], lv: [0, 1], desc: '다이어그램을 보고 잡은 뒤 ▶ 듣기로 소리를 비교합니다.' },
    { id: 'metro', title: '메트로놈에 맞춰 4분·8분 치기', route: '/rhythm', goals: ['rhythm', 'guitar'], lv: [0, 2], desc: '60~80 BPM에서 박마다 한 번, 그다음 두 번씩 쳐 봅니다.' },
    { id: 'strum', title: '팝 기본 스트럼 익히기', route: '/rhythm', q: { tab: 'strum' }, goals: ['guitar', 'rhythm'], lv: [0, 2], desc: 'D - D U - U D U 패턴을 코드 진행에 맞춰 반복합니다.' },
    { id: 'intervals', title: '인터벌 이름과 소리 익히기', route: '/theory/intervals', goals: ['theory', 'ear'], lv: [0, 1], desc: '메이저 3도, 퍼펙트 5도처럼 두 음 사이의 거리를 노래로 기억합니다.' },
    { id: 'chordbuild', title: '코드가 만들어지는 원리', route: '/theory/chords', goals: ['theory', 'compose'], lv: [0, 1], desc: '코드 빌더에서 메이저와 마이너를 번갈아 듣고 구성음을 비교합니다.' },
    { id: 'earint', title: '인터벌 퀴즈 10문제', route: '/ear', q: { tab: 'interval' }, goals: ['ear'], lv: [0, 2], desc: '스케일 인터벌 범위로 시작해 80%가 넘으면 범위를 넓힙니다.' },
    { id: 'tap1', title: '리듬 따라 치기 1단계', route: '/rhythm', q: { tab: 'tap' }, goals: ['rhythm', 'ear'], lv: [0, 1], desc: '4분·8분음표 리듬을 듣고 패드를 눌러 80점 이상을 목표로 합니다.' },
    { id: 'tech-chroma', title: '기본기: 크로매틱 1-2-3-4', route: '/technique/guitar/chroma-1234', goals: ['guitar', 'rhythm'], lv: [0, 1], inst: ['guitar'], desc: '메트로놈 60 BPM에 맞춰 한 손가락에 한 프렛씩, 6번 줄에서 1번 줄까지 올라갔다 내려옵니다.' },
    { id: 'tech-perm', title: '신경분리: 손가락 순서 바꾸기', route: '/technique/guitar/perm', goals: ['guitar'], lv: [1, 3], inst: ['guitar'], desc: '1-3-2-4 같은 순서를 골라 모든 줄에서 깨끗하게 칩니다. 하루에 두세 개씩.' },
    { id: 'pent', title: '마이너 펜타토닉 박스 1', route: '/guitar/scales', q: { scale: 'minor_pent' }, goals: ['guitar', 'solo'], lv: [1, 2], desc: '박스 1을 외우고 상행·하행 패턴을 재생에 맞춰 따라 칩니다.' },
    { id: 'degree', title: '계이름 퀴즈 (메이저 스케일)', route: '/ear', q: { tab: 'degree' }, goals: ['ear'], lv: [1, 2], desc: '스케일을 듣고 도를 붙잡은 뒤 들린 음의 계이름을 맞힙니다.' },
    { id: 'diatonic', title: '다이어토닉 코드와 기능', route: '/theory/chords', q: { tab: 'diatonic' }, goals: ['theory', 'compose'], lv: [1, 2], desc: '한 키 안의 7개 코드와 토닉 · 서브도미넌트 · 도미넌트 기능을 봅니다.' },
    { id: 'prog', title: '장르별 기본 진행 듣기', route: '/theory/progressions', goals: ['theory', 'compose', 'guitar'], lv: [1, 2], desc: 'I – V – vi – IV 와 ii – V – I 을 듣고 기능 흐름을 비교합니다.' },
    { id: 'backing', title: '백킹 트랙 위에서 솔로하기', route: '/backing', q: { id: 'blues12' }, goals: ['solo', 'guitar', 'rhythm'], lv: [1, 3], desc: '12마디 블루스를 틀고 펜타토닉과 코드톤으로 솔로합니다.' },
    { id: 'melody', title: '멜로디에 코드 붙이기', route: '/tools/melody', goals: ['compose'], lv: [1, 3], desc: '아는 멜로디를 격자에 리듬째 찍고, 추천 코드 진행과 화음을 들어 가며 반주를 만듭니다.' },
    { id: 'root', title: '진행 루트 퀴즈', route: '/ear', q: { tab: 'root' }, goals: ['ear', 'theory'], lv: [2, 3], desc: '코드 진행을 듣고 루트를 계이름으로 맞힙니다.' },
    { id: 'rq', title: '리듬 듣고 맞히기 퀴즈', route: '/ear', q: { tab: 'rhythm' }, goals: ['rhythm', 'ear'], lv: [1, 3], desc: '들은 리듬과 같은 악보를 고릅니다. 쉼표와 16분음표 단계까지.' },
    { id: 'triads', title: '현 세트별 트라이어드', route: '/guitar/triads', goals: ['guitar', 'solo'], lv: [2, 3], desc: '같은 코드를 세 가지 인버전으로 지판 위아래에서 잡아 봅니다.' },
    { id: 'phrase', title: '코드톤 타겟팅과 어프로치 노트', route: '/guitar/phrasing', goals: ['solo', 'theory'], lv: [3, 4], desc: '기법 카드를 들어 보고 빌더에서 ii – V – I 라인을 만듭니다.' },
    { id: 'harmony', title: '멜로디에 3도·6도 화음 쌓기', route: '/tools/harmony', goals: ['compose', 'ear', 'theory'], lv: [2, 4], desc: '다이어토닉 3도 위와 6도 아래를 비교하며 들어 봅니다.' },
    { id: 'ds', title: '3도·6도 더블스탑', route: '/guitar/doublestops', goals: ['guitar', 'solo'], lv: [2, 3], desc: '2·3번 줄 3도, 1·3번 줄 6도 패턴을 올라갔다 내려옵니다.' },
    { id: 'songs', title: '곡 분석으로 마디별 스케일 연결', route: '/songs', goals: ['solo', 'theory'], lv: [3, 4], desc: '마디를 하나씩 눌러 코드, 스케일, 보이싱을 이어 봅니다.' },
    { id: 'licks', title: '릭 하나를 여러 키로 옮기기', route: '/guitar/licks', goals: ['solo', 'guitar'], lv: [3, 4], desc: '마음에 드는 릭을 느리게 익힌 뒤 키 옮기기로 다른 키에서 칩니다.' },
    { id: 'modes', title: '모드의 밝기와 특징음', route: '/theory/modes', goals: ['theory', 'ear', 'solo'], lv: [3, 4], desc: '같은 루트의 7모드를 밝은 순서로 듣고 특징음을 찾습니다.' },
    { id: 'reharm', title: '리하모니제이션 기법 비교', route: '/theory/reharm', goals: ['theory', 'compose'], lv: [4, 4], desc: '원래 진행과 바꾼 진행을 A/B로 들어 봅니다.' },
    { id: 'tech-routine', title: '기본기 루틴 15분 (신경분리 · 펜타토닉 시퀀스)', route: '/technique/guitar', q: { r: 'g-mid' }, goals: ['guitar', 'solo'], lv: [2, 4], inst: ['guitar'], desc: '루틴 타이머에 맞춰 순서 바꾸기, 스파이더, 펜타토닉 3음 묶음, 스트링 크로싱을 이어서 합니다.' },
    { id: 'drop2', title: '드롭 2 보이스 리딩', route: '/guitar/voicings/advanced', q: { types: 'drop2' }, goals: ['guitar'], lv: [3, 4], desc: 'ii – V – I 을 한 현 세트 안에서 가장 가깝게 연결합니다.' },
    { id: 'modeq', title: '모드 퀴즈', route: '/ear', q: { tab: 'mode' }, goals: ['ear'], lv: [4, 4], desc: '3음의 장단을 먼저 듣고 특징음으로 모드를 구분합니다.' },
    { id: 'tap5', title: '리듬 따라 치기 4 · 5단계 (싱코페이션 · 셋잇단)', route: '/rhythm', q: { tab: 'tap' }, goals: ['rhythm', 'ear'], lv: [2, 4], desc: '당김음과 셋잇단 패턴을 듣고 따라 쳐서 80점 이상을 목표로 합니다.' },
    { id: 'funk16', title: '펑크 16비트 스트럼과 칩', route: '/rhythm', q: { tab: 'strum' }, goals: ['rhythm', 'guitar'], lv: [3, 4], desc: '손은 16분음표로 쉬지 않고, 칩(짧게 끊기)으로 2 · 4박 백비트를 만듭니다.' },
    { id: 'swingcomp', title: '스윙 MR 위에서 컴핑하기', route: '/backing', q: { id: 'ii-V-I', style: 'swing' }, goals: ['rhythm', 'guitar', 'compose'], lv: [3, 4], desc: '투파이브원 스윙 MR을 틀고 2 · 4박에 짧게 코드를 넣어 드럼 · 베이스와 그루브를 맞춥니다.' },
    { id: 'bass-open', title: '베이스 기본기: 투핑거와 크로매틱', route: '/technique/bass/b-open', goals: ['guitar', 'rhythm'], lv: [0, 1], inst: ['bass'], desc: '검지 · 중지를 번갈아 개방현을 치고, 한 손가락 한 프렛 크로매틱으로 이어 갑니다.' },
    { id: 'bass-major', title: '베이스: 고정 포지션 메이저 스케일', route: '/technique/bass/b-major', goals: ['guitar', 'theory'], lv: [1, 2], inst: ['bass'], desc: '루트를 중지에 두는 모양으로 12키 메이저 스케일을 칩니다.' },
    { id: 'bass-root58', title: '베이스: 루트 · 5도 · 옥타브 그루브', route: '/technique/bass/b-root58', goals: ['rhythm', 'guitar'], lv: [1, 2], inst: ['bass'], desc: '1-6-4-5 진행 위에서 1-5-8-5 를 8분음표로.' },
    { id: 'bass-walk', title: '베이스: 워킹 베이스 ii–V–I', route: '/technique/bass/b-walk', goals: ['guitar', 'solo', 'theory'], lv: [3, 4], inst: ['bass'], desc: '코드톤 세 개와 반음 어프로치로 4분음표 라인을 만듭니다.' },
    { id: 'keys-five', title: '키보드 기본기: 다섯 손가락과 하논', route: '/technique/keys/k-five', goals: ['guitar'], lv: [0, 1], inst: ['keys'], desc: '다섯 손가락 자리에서 손 모양을 잡고, 하논 1번 음형으로 이어 갑니다.' },
    { id: 'keys-scale', title: '키보드: 엄지 넘기기 스케일 2옥타브', route: '/technique/keys/k-scale', goals: ['guitar', 'theory'], lv: [1, 2], inst: ['keys'], desc: 'C · G · D · F 메이저를 표준 운지로 한 손씩, 그다음 양손.' },
    { id: 'keys-cadence', title: '키보드: I–IV–V–I 카덴스', route: '/technique/keys/k-cadence', goals: ['compose', 'theory', 'guitar'], lv: [1, 3], inst: ['keys'], desc: '가까운 전위로 코드를 잇는 반주의 기본. 12키로 옮겨 칩니다.' },
    { id: 'keys-251', title: '키보드: 재즈 ii–V–I 보이싱', route: '/technique/keys/k-251', goals: ['theory', 'compose'], lv: [3, 4], inst: ['keys'], desc: '3음 · 7음 가이드톤이 반음씩 움직이는 보이스 리딩을 익힙니다.' },
    { id: 'drum-single', title: '드럼 기본기: 싱글 · 더블 스트로크', route: '/technique/drums/d-single', goals: ['rhythm', 'guitar'], lv: [0, 1], inst: ['drums'], desc: '메트로놈에 맞춰 R L 을 고르게, 이어서 R R L L 더블 스트로크.' },
    { id: 'drum-8beat', title: '드럼: 8비트 기본 그루브', route: '/technique/drums/d-8beat', goals: ['rhythm'], lv: [0, 2], inst: ['drums'], desc: '하이햇 8분 · 스네어 2 · 4박 · 킥 1 · 3박을 합칩니다.' },
    { id: 'drum-para', title: '드럼: 패러디들과 액센트', route: '/technique/drums/d-para', goals: ['rhythm', 'guitar'], lv: [1, 3], inst: ['drums'], desc: 'R L R R · L R L L 에 액센트를 넣어 손을 고르게.' },
    { id: 'drum-ghost', title: '드럼: 고스트 노트 · 스윙', route: '/technique/drums/d-ghost', goals: ['rhythm', 'solo'], lv: [3, 4], inst: ['drums'], desc: '작은 고스트 노트로 펑크 그루브를, 라이드로 재즈 타임을.' },
    { id: 'vocal-long', title: '보컬 기본기: 롱톤과 립 트릴', route: '/technique/vocal/v-longtone', goals: ['guitar', 'ear'], lv: [0, 1], inst: ['vocal'], desc: '한 음을 4박 흔들림 없이, 입술 떨기로 목에 힘을 뺍니다.' },
    { id: 'vocal-five', title: '보컬: 5음 스케일 반음씩 올리기', route: '/technique/vocal/v-five', goals: ['ear', 'guitar'], lv: [0, 2], inst: ['vocal'], desc: '도-레-미-파-솔을 반복마다 반음씩 올려 음역을 넓힙니다.' },
    { id: 'vocal-interval', title: '보컬: 인터벌 시창 (2도 ~ 8도)', route: '/technique/vocal/v-interval', goals: ['ear', 'theory'], lv: [1, 3], inst: ['vocal'], desc: '악보를 보고 음정을 바로 부르는 시창의 기초.' },
    { id: 'vocal-run', title: '보컬: 3도 화음과 런', route: '/technique/vocal/v-harmony', goals: ['ear', 'solo', 'compose'], lv: [3, 4], inst: ['vocal'], desc: '피아노 선율 위에 3도 화음을 얹고, 블루스 스케일 런으로 이어 갑니다.' }
  ];
  ['finder', 'open', 'strum', 'pent', 'triads', 'ds', 'licks', 'drop2', 'funk16'].forEach(id => { const m = MISSIONS.find(x => x.id === id); if (m) m.inst = ['guitar']; });
  /* 페이지 가이드: 경로(앞부분 일치) → 무엇을, 어떻게 */
  const PAGES = [
    ['/guitar/voicings', '코드를 잡는 여러 방법을 찾는 곳입니다.', ['루트와 코드 퀄리티를 고르세요.', '다이어그램의 점을 누르면 그 줄 소리가 나고, ▶ 듣기로 전체를 들을 수 있습니다.', '처음이라면 기본 코드 폼의 오픈 코드부터 시작하세요.']],
    ['/technique', '세션별로 손과 몸을 푸는 기본기 연습입니다.', ['루틴 하나를 골라 순서대로, 연습마다 정해진 시간만큼 해 보세요.', '느린 템포에서 틀리지 않게 친 뒤 5 BPM씩 올리고, 깨끗하게 친 템포를 기록합니다.']],
    ['/guitar/scales', '스케일이 지판 어디에 있는지 포지션별로 보는 곳입니다.', ['스케일과 루트를 고르세요.', '포지션을 하나 골라 그 박스만 외웁니다.', '연습 패턴 재생에 맞춰 따라 치고, 백킹을 켜서 솔로해 보세요.']],
    ['/guitar/triads', '세 음짜리 코드를 줄 세트마다 여러 자리에서 잡는 법을 익힙니다.', ['한 줄 세트(예: 3-2-1번 줄)만 골라 기본형 → 1전위 → 2전위 순서로 올라가 보세요.', '아래 아르페지오에서 같은 코드톤을 한 음씩 쳐 봅니다.']],
    ['/guitar/doublestops', '두 줄을 함께 눌러 3도·6도 화음으로 멜로디를 두껍게 만드는 연습입니다.', ['인터벌과 줄 쌍을 고르세요. 3도는 2·3번 줄이 가장 쉽습니다.', '▶ 듣기로 소리를 확인하고 느린 템포로 올라갔다 내려오세요.']],
    ['/guitar/phrasing', '코드톤과 어프로치 노트로 솔로 라인을 만드는 원리를 배웁니다.', ['기법 카드를 위에서부터 하나씩 들어 보세요.', '마음에 드는 기법을 "빌더에서 열기"로 가져와 진행과 키를 바꿔 봅니다.', '만든 라인을 따라 친 뒤 백킹 트랙 위에서 반복하세요.']],
    ['/guitar/licks', '장르별 실전 프레이즈를 TAB과 오선, 느린 재생으로 익힙니다.', ['난이도 p · mp 부터 고르세요.', '느리게(60%) 재생에 맞춰 따라 치고, 익숙해지면 템포를 올립니다.']],
    ['/theory/intervals', '두 음 사이의 거리(인터벌)를 소리와 지판 모양으로 익힙니다.', ['표에서 인터벌을 누르고 ▶ 순차 / 동시로 들어 보세요.', '기억할 곡을 흥얼거리며 소리와 이름을 연결합니다.']],
    ['/theory/chords', '코드가 어떤 음으로 만들어지는지 보고 듣는 곳입니다.', ['코드 빌더에서 루트와 퀄리티를 바꿔 가며 들어 보세요.', '다이어토닉 코드 탭에서 한 키 안의 코드 7개를 확인합니다.']],
    ['/theory/scales', '스케일의 구조와 스케일에서 만들어지는 코드를 봅니다.', ['스케일을 고르고 ▶ 듣기로 소리를 확인하세요.', '오선, 건반, 지판을 같이 보며 같은 음의 위치를 비교합니다.']],
    ['/theory/progressions', '장르별로 자주 쓰는 코드 진행을 듣고 기능을 분석합니다.', ['진행을 고르고 ▶ 재생으로 들어 보세요.', '색으로 표시된 기능(T · S · D)이 어떻게 흘러가는지 보고, 백킹 트랙으로 넘어가 연주해 봅니다.']],
    ['/theory/modes', '같은 음을 다른 중심으로 쓰는 모드의 색채를 비교합니다.', ['밝기 순서에서 모드를 하나씩 들어 보세요.', '특징음이 어디서 들리는지 찾아봅니다.']],
    ['/theory/reharm', '멜로디는 그대로 두고 코드를 바꾸는 기법을 비교합니다.', ['기법을 하나 고르고 A(원래)와 B(바꾼 것)를 번갈아 들어 보세요.']],
    ['/chord/', '코드 하나에 대한 모든 정보(구성음, 잡는 법, 스케일, 진행)가 모인 곳입니다.', ['▶ 듣기로 소리를 확인하고, 기타 보이싱에서 잡기 쉬운 폼을 고르세요.', '어울리는 스케일 표에서 솔로에 쓸 스케일을 찾습니다.']],
    ['/tools/finder', '지판을 눌러 잡은 모양이 무슨 코드인지 찾아 줍니다.', ['줄마다 한 칸씩 누르세요. 같은 자리를 다시 누르면 지워집니다.', '아래에 가능한 코드 이름이 나옵니다.']],
    ['/tools/melody', '멜로디를 리듬째 격자에 찍으면 어울리는 코드 진행을 순위별로 추천합니다.', ['격자를 눌러 멜로디를 찍거나 예시를 불러오세요.', '추천 진행 가운데 하나를 골라 ▶ 로 들어 봅니다.', '3도 · 6도 화음을 얹어 모두 재생하고, 마음에 들면 백킹 트랙으로 보내 연주해 보세요.']],
    ['/tools/harmony', '멜로디 위아래에 3도·6도 같은 화음 보이스를 쌓아 들어 봅니다.', ['멜로디를 넣고 빠른 설정에서 "3도 위"를 먼저 골라 보세요.', '보이스마다 뮤트·솔로로 따로 들어 봅니다.', '아래 더블스탑으로 기타에서 바로 쳐 볼 수 있습니다.']],
    ['/ear', '듣고 맞히는 퀴즈로 음감을 기릅니다.', ['탭을 골라 ▶ 문제 듣기를 누르고 답을 고르세요.', '틀리면 정답과 내가 고른 답을 번갈아 들어 차이를 확인합니다.', '정답률 80%가 넘으면 설정에서 범위를 넓히세요.']],
    ['/rhythm', '박을 유지하고 리듬을 정확하게 치는 연습을 합니다.', ['메트로놈에서 편한 템포로 박을 세어 보세요.', '리듬 따라 치기에서 패드를 눌러 점수를 확인합니다.', '스트럼 패턴을 코드 진행에 맞춰 반복합니다.']],
    ['/backing', '드럼 · 베이스 · 코드 반주 위에서 솔로와 리듬을 연습합니다.', ['진행과 스타일을 고르고 ▶ 시작을 누르세요.', '재생 중 지판에 표시되는 코드톤(색 있는 음) 위주로 쳐 봅니다.']],
    ['/songs', '실제 곡 형태의 진행을 마디별로 분석합니다.', ['곡을 고르고 마디를 하나씩 눌러 코드, 스케일, 보이싱을 확인하세요.']],
    ['/glossary', '음악 용어를 한글과 영어로 찾아봅니다.', ['검색창에 궁금한 용어를 적어 보세요.']]
  ];

  /* ---- 저장 ---- */
  let data = { profile: { level: null, goals: [], sessions: [], onboarded: false, skipped: false, showGuides: true }, done: {}, visits: {} };
  try { const raw = localStorage.getItem(KEY); if (raw) { const d = JSON.parse(raw); data = Object.assign(data, d, { profile: Object.assign(data.profile, d.profile || {}) }); } } catch (e) { /* 저장소를 못 쓰는 환경 */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ } };
  const profile = () => data.profile;
  function setProfile(patch) { Object.assign(data.profile, patch); save(); GH.events.emit('guide', data); }
  const levelIdx = () => Math.max(0, LEVELS.findIndex(l => l.id === data.profile.level));
  const sessions = () => (data.profile.sessions || []).filter(id => SESSIONS.some(s => s.id === id));
  /* 수준 이름 · 설명은 첫 번째로 고른 세션에 맞춰 */
  const levelText = (l, sess) => { const b = l.by && sess && l.by[sess]; return b ? { ko: b[0], desc: b[1] } : { ko: l.ko, desc: l.desc }; };
  const missionHref = (m, extra) => GH.router.href(m.route, Object.assign({}, m.q || {}, extra || {}));
  /* 미션 페이지의 따라 하기 단계 (coach.js) */
  function missionSteps(m) { const S = GH.coach && GH.coach.stepsFor({ path: m.route, query: m.q || {} }); return S ? S.map(x => x.say) : []; }

  /* 맞춤 순서: 지금 수준과 한 단계 위, 목표가 겹치는 미션을 쉬운 것부터 */
  function plan(p) {
    p = p || data.profile; const li = Math.max(0, LEVELS.findIndex(l => l.id === p.level));
    const goals = p.goals && p.goals.length ? p.goals : GOALS.map(g => g.id);
    const n = goals.length;
    const sess = p.sessions && p.sessions.length ? p.sessions : ['guitar'];
    const pool = MISSIONS.filter(m => m.lv[0] <= li + 1 && m.lv[1] >= li && m.goals.some(g => goals.includes(g)) && (!m.inst || m.inst.some(i => sess.includes(i))));
    const isCourse = m => /^course-/.test(m.id);
    const idx = m => MISSIONS.indexOf(m);
    const gap = m => m.lv[0] > li ? 1.5 * (m.lv[0] - li) : li - m.lv[0]; /* 내 수준에서 시작하는 것 → 복습 → 한 단계 위 */
    const hits = m => m.goals.filter(g => goals.includes(g));
    const weight = m => hits(m).reduce((a, g) => a + (n - goals.indexOf(g)), 0); /* 먼저 고른 목표일수록 무겁게 */
    const order = keyOf => (a, b) => { const x = keyOf(a), y = keyOf(b); for (let k = 0; k < x.length; k++) if (x[k] !== y[k]) return x[k] - y[k]; return 0; };
    /* 1) 여러 목표를 골랐으면, 고른 목표를 두 개 이상 함께 채우는 미션부터 (많이 채울수록, 먼저 고른 목표일수록 앞) */
    const combo = n > 1 ? pool.filter(m => hits(m).length >= 2 && (gap(m) <= 1 || (li === 0 && isCourse(m)))) : []; /* 한 단계 넘게 위인 것은 앞당기지 않는다 */
    combo.sort(order(m => li === 0 && isCourse(m) ? [0, -hits(m).length, -weight(m), idx(m)] : [1, gap(m), -hits(m).length, -weight(m), m.lv[0], idx(m)]));
    /* 2) 나머지는 목표마다 줄을 세우고, 첫 번째 목표부터 한 개씩 번갈아 꺼낸다
       한 줄 안에서는: 처음이면 기초 코스 장 순서대로 → 수준에 가장 맞는 것 → 그 목표가 주된 목표인 것 → 쉬운 것 */
    const rest = pool.filter(m => !combo.includes(m));
    const groups = goals.map(() => []);
    rest.forEach(m => { const k = Math.min(...m.goals.map(g => { const i = goals.indexOf(g); return i < 0 ? 99 : i; })); groups[k].push(m); });
    groups.forEach((list, i) => list.sort(order(m => li === 0 && isCourse(m) ? [0, 0, 0, 0, idx(m)] : [1, gap(m), m.goals[0] === goals[i] ? 0 : 1, m.lv[0], idx(m)])));
    const out = combo.slice();
    for (let round = 0; out.length < pool.length; round++) groups.forEach(list => { if (list[round]) out.push(list[round]); });
    return out.slice(0, 12);
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
    const draft = { level: data.profile.level || 'new', goals: (data.profile.goals || []).slice(), sessions: sessions().slice() };
    const only = opts.only === 'sessions'; const TOTAL = only ? 1 : 3;
    let step = opts.step || 1;
    const box = h('div', { class: 'onboard', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'onboard-title', tabindex: '-1' });
    const wrap = h('div', { class: 'onboard-backdrop' }, box);
    wrap.addEventListener('click', e => { if (e.target === wrap) skip(); });
    const skip = () => { if (!data.profile.onboarded) setProfile({ skipped: true }); closeModal(); };
    const draw = () => {
      GH.ui.clear(box);
      box.appendChild(h('div', { class: 'onboard-top' }, h('span', { class: 'eyebrow' }, 'STEP ' + step + ' / ' + TOTAL), h('button', { class: 'iconbtn', type: 'button', 'aria-label': '닫기', onclick: skip }, GH.icon('close'))));
      if (step === 1) {
        box.appendChild(h('h2', { id: 'onboard-title' }, '어떤 세션에 관심 있으세요?'));
        box.appendChild(h('p', { class: 'muted' }, '여러 개를 골라도 돼요. 고른 세션의 기본기 연습과 미션을 먼저 추천해 드려요.'));
        box.appendChild(h('div', { class: 'onboard-options goals sessions' }, SESSIONS.map(s => { const k = draft.sessions.indexOf(s.id); return h('button', { class: 'onboard-option' + (k >= 0 ? ' active' : ''), type: 'button', 'aria-pressed': k >= 0 ? 'true' : 'false', onclick: () => { if (k >= 0) draft.sessions.splice(k, 1); else draft.sessions.push(s.id); draw(); } }, h('span', { class: 'onboard-icon', 'aria-hidden': 'true' }, k >= 0 ? String(k + 1) : GH.icon(s.icon)), h('b', null, s.ko), h('small', null, s.desc)); })));
        if (draft.sessions.some(id => id !== 'guitar')) box.appendChild(h('p', { class: 'onboard-note' }, '베이스 · 키보드 · 드럼 · 보컬은 지금 기본기 연습부터 준비돼 있어요. 화성학 · 리듬 · 음감 연습은 모든 세션에 함께 쓰여요.'));
        box.appendChild(h('div', { class: 'onboard-actions' }, h('button', { class: 'btn', type: 'button', onclick: skip }, '나중에 할게요'),
          only ? h('button', { class: 'btn primary', type: 'button', disabled: !draft.sessions.length, onclick: () => { setProfile({ sessions: draft.sessions }); closeModal(); if (opts.onDone) opts.onDone(); } }, '저장')
            : h('button', { class: 'btn primary', type: 'button', disabled: !draft.sessions.length, onclick: () => { step = 2; draw(); } }, '다음 →')));
      } else if (step === 2) {
        box.appendChild(h('h2', { id: 'onboard-title' }, '음악을 얼마나 알고 계세요?'));
        box.appendChild(h('p', { class: 'muted' }, '수준에 맞춰 쉬운 것부터 순서대로 추천해 드립니다. 나중에 설정에서 언제든 바꿀 수 있어요.'));
        box.appendChild(h('div', { class: 'onboard-options', role: 'radiogroup' }, LEVELS.map(l => h('button', { class: 'onboard-option' + (draft.level === l.id ? ' active' : ''), type: 'button', role: 'radio', 'aria-checked': draft.level === l.id ? 'true' : 'false', onclick: () => { draft.level = l.id; draw(); } }, h('i', { class: 'dyn-tag lv' + l.lv, 'aria-hidden': 'true', title: l.dyn + ' ' + l.tag }, l.dyn), h('b', null, levelText(l, draft.sessions[0]).ko), h('small', null, levelText(l, draft.sessions[0]).desc)))));
        box.appendChild(h('div', { class: 'onboard-actions' }, h('button', { class: 'btn', type: 'button', onclick: () => { step = 1; draw(); } }, '← 이전'), h('button', { class: 'btn primary', type: 'button', onclick: () => { step = 3; draw(); } }, '다음 →')));
      } else {
        box.appendChild(h('h2', { id: 'onboard-title' }, '이 사이트에서 무엇을 얻고 싶으세요?'));
        box.appendChild(h('p', { class: 'muted' }, '여러 개를 골라도 됩니다. 고른 순서대로 우선해서 추천합니다.'));
        box.appendChild(h('div', { class: 'onboard-options goals' }, GOALS.map(g => { const k = draft.goals.indexOf(g.id); return h('button', { class: 'onboard-option' + (k >= 0 ? ' active' : ''), type: 'button', 'aria-pressed': k >= 0 ? 'true' : 'false', onclick: () => { if (k >= 0) draft.goals.splice(k, 1); else draft.goals.push(g.id); draw(); } }, h('span', { class: 'onboard-icon', 'aria-hidden': 'true' }, k >= 0 ? String(k + 1) : GH.icon(g.icon)), h('b', null, g.ko), h('small', null, g.desc)); })));
        const preview = plan({ level: draft.level, goals: draft.goals, sessions: draft.sessions }).slice(0, 3);
        if (draft.goals.length) box.appendChild(h('div', { class: 'onboard-preview' }, h('span', { class: 'muted' }, '먼저 해 볼 것: '), preview.map((m, i) => h('span', { class: 'badge' }, (i + 1) + '. ' + m.title))));
        box.appendChild(h('div', { class: 'onboard-actions' }, h('button', { class: 'btn', type: 'button', onclick: () => { step = 2; draw(); } }, '← 이전'),
          h('button', { class: 'btn primary', type: 'button', disabled: !draft.goals.length, onclick: () => { setProfile({ level: draft.level, goals: draft.goals, sessions: draft.sessions, onboarded: true, skipped: false }); closeModal(); if (opts.onDone) opts.onDone(); } }, '추천 받기')));
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
  const levelKo = () => { const l = LEVELS.find(x => x.id === data.profile.level); return l ? l.dyn + ' · ' + levelText(l, sessions()[0]).ko : '수준 미선택'; };
  const sessionChips = () => sessions().map(id => { const s = SESSIONS.find(x => x.id === id); return h('span', { class: 'badge' }, GH.icon(s.icon, { cls: 'badge-ic' }), s.ko); });
  const goalChips = () => (data.profile.goals || []).map(id => { const g = GOALS.find(x => x.id === id); return g ? h('span', { class: 'badge' }, GH.icon(g.icon, { cls: 'badge-ic' }), g.ko) : null; });
  function progressBar(list) { const done = list.filter(m => isDone(m.id)).length; return h('div', { class: 'guide-progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': list.length, 'aria-valuenow': done }, h('span', { style: 'width:' + (list.length ? Math.round(100 * done / list.length) : 0) + '%' }), h('small', null, done + ' / ' + list.length + ' 완료')); }

  /* 홈 카드: 설문 전에는 시작 안내, 후에는 다음 미션 */
  function homeCard() {
    const rerender = () => GH.router.rerender();
    if (!data.profile.onboarded) {
      return h('section', { class: 'guide-card start' },
        h('div', null, h('span', { class: 'eyebrow' }, 'MY GUIDE'), h('h2', null, '나에게 맞는 순서를 추천받으세요'), h('p', { class: 'muted' }, '관심 있는 세션(기타 · 베이스 · 키보드 · 드럼 · 보컬), 음악 지식 수준, 목표를 세 번의 선택으로 알려 주시면 쉬운 것부터 차례로 할 일을 골라 드립니다.')),
        h('div', { class: 'guide-start-btns' },
          h('button', { class: 'btn primary', type: 'button', onclick: () => openOnboarding({ onDone: rerender }) }, '30초 설문 시작 →'),
          h('a', { class: 'btn', href: '#/learn/notes?coach=1' }, '설문 없이 첫 레슨부터')));
    }
    const list = plan(); const n = next();
    return h('section', { class: 'guide-card' },
      h('div', { class: 'guide-card-head' }, h('div', null, h('span', { class: 'eyebrow' }, 'MY GUIDE'), h('h2', null, n ? '다음에 할 일' : '추천 미션을 모두 마쳤어요')),
        h('div', { class: 'row', style: 'gap:6px' }, sessionChips(), h('span', { class: 'badge accent' }, levelKo()), goalChips(), h('button', { class: 'btn small', type: 'button', onclick: () => openOnboarding({ onDone: rerender }) }, '수정'))),
      sessions().length ? null : h('button', { class: 'guide-session-ask', type: 'button', onclick: () => openOnboarding({ only: 'sessions', onDone: rerender }) }, GH.icon('spark'), '관심 있는 세션(악기)을 알려 주시면 그 세션의 기본기 연습도 추천해 드려요 →'),
      n ? h('a', { class: 'guide-next', href: missionHref(n, { coach: 1 }) },
          h('span', { class: 'guide-now-tag' }, '지금 할 일 하나'),
          h('b', null, n.title), h('span', { class: 'muted' }, n.desc),
          missionSteps(n).length ? h('ol', { class: 'guide-steps' }, missionSteps(n).slice(0, 3).map(t => h('li', null, t))) : null,
          h('span', { class: 'guide-start' }, GH.icon('play', { size: 14 }), '누르면 페이지로 가서 하나씩 짚어 드려요'),
          h('span', { class: 'guide-go', 'aria-hidden': 'true' }, GH.icon('arrow')))
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
    if (route.path === '/' || route.path === '/learn' || route.path.startsWith('/learn/') || data.profile.showGuides === false) return;
    const info = pageInfo(route.path); const mission = data.profile.onboarded ? missionFor(route) : null;
    if (!info && !mission) return;
    /* 처음 두 번 방문할 때만 펼쳐 둔다 (초보 수준일 때) */
    const beginner = (!data.profile.onboarded || levelIdx() <= 1) && (data.visits[route.path] || 0) <= 2;
    const open = openState[route.path] != null ? openState[route.path] : beginner;
    const n = next();
    const S = GH.coach && GH.coach.stepsFor(route); const coachSteps = S ? S.map(x => x.say) : null;
    const box = h('details', { class: 'page-guide', open: open ? true : null, ontoggle: e => { openState[route.path] = e.currentTarget.open; } },
      h('summary', null, h('span', { class: 'guide-dot', 'aria-hidden': 'true' }, GH.icon('note')), h('span', null, mission ? '미션 · ' + mission.title : '이 페이지에서 할 일'), mission && isDone(mission.id) ? h('span', { class: 'badge accent' }, '완료') : null, h('span', { class: 'pg-toggle', 'aria-hidden': 'true' }, GH.icon('sharp', { cls: 'when-closed' }), GH.icon('natural', { cls: 'when-open' }))),
      h('div', { class: 'page-guide-body' },
        info ? h('p', null, info[1]) : null,
        coachSteps ? h('ol', null, coachSteps.map(t => h('li', null, t))) : info ? h('ol', null, info[2].map(t => h('li', null, t))) : null,
        mission ? h('p', { class: 'muted' }, mission.desc) : null,
        h('div', { class: 'row', style: 'gap:6px' },
          coachSteps ? h('button', { class: 'btn small primary', type: 'button', onclick: () => GH.coach.start() }, GH.icon('play', { size: 14 }), '따라 하기 (하나씩 짚어 드려요)') : null,
          mission ? h('button', { class: 'btn small', type: 'button', onclick: () => { toggleDone(mission.id); decorate(GH.router.current()); } }, isDone(mission.id) ? '완료 취소' : [GH.icon('check'), '미션 완료']) : null,
          n && (!mission || n.id !== mission.id) ? h('a', { class: 'btn small', href: missionHref(n) }, '다음 미션: ' + n.title + ' →') : null,
          !data.profile.onboarded ? h('button', { class: 'btn small', type: 'button', onclick: () => openOnboarding({ onDone: () => GH.router.rerender() }) }, '맞춤 추천 받기') : null,
          h('button', { class: 'btn small ghost', type: 'button', onclick: () => { setProfile({ showGuides: false }); decorate(GH.router.current()); } }, '가이드 숨기기'))));
    app.insertBefore(box, app.firstChild);
  }
  function resetProgress() { data.done = {}; data.visits = {}; save(); GH.events.emit('guide', data); }

  GH.guide = { LEVELS, GOALS, SESSIONS, sessions, levelText, sessionChips, MISSIONS, PAGES, missionHref, profile, setProfile, plan, next, isDone, toggleDone, missionFor, openOnboarding, shouldOnboard, homeCard, planSection, decorate, resetProgress, levelKo };
})();
