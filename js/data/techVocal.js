/* 기본기 연습 · 보컬. 발성 교재 · 시창 전통을 참고해 새로 적은 연습
   gen(o) → [{deg(으뜸음에서 반음), d(박), syl?(이 음의 가사), stacc?, gdeg?(피아노 가이드가 칠 음, 화음 연습)}] · 쉼표는 {rest:true, d}
   반복할 때마다 반음씩 올렸다 내려오며(키 이동) 음역을 넓힌다 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  GH.data = GH.data || {};
  const MAJ = [0, 2, 4, 5, 7, 9, 11];
  const sd = n => MAJ[((n - 1) % 7 + 7) % 7] + 12 * Math.floor((n - 1) / 7);   /* 스케일 도수(1~) → 반음 */
  const seq = (degs, d, extra) => degs.map(n => Object.assign({ deg: sd(n), d }, extra || {}));
  const rest = d => ({ rest: true, d });
  const VOICES = {
    sop: { ko: '소프라노 · 여성 높은 음역', root: 60, clef: 'treble' },
    alto: { ko: '알토 · 여성 낮은 음역', root: 55, clef: 'treble' },
    tenor: { ko: '테너 · 남성 높은 음역', root: 48, clef: 'treble8vb' },
    bari: { ko: '바리톤 · 베이스 · 남성 낮은 음역', root: 43, clef: 'bass' }
  };
  const CATS = [
    { id: 'v-breath', inst: 'vocal', ko: '호흡 · 발성', en: 'BREATH', icon: 'ear', desc: '긴 숨으로 한 음을 고르게, 입술 떨기와 스타카토로 성대를 가볍게 깨워요.' },
    { id: 'v-pitch', inst: 'vocal', ko: '음정 · 스케일', en: 'PITCH', icon: 'scale', desc: '5음 · 9음 스케일과 아르페지오를 반음씩 옮겨 부르며 음정과 음역을 넓혀요.' },
    { id: 'v-sight', inst: 'vocal', ko: '시창 · 화음', en: 'SIGHT-SINGING', icon: 'interval', desc: '악보를 보고 인터벌을 바로 부르고, 피아노와 3도 화음을 맞춰요. 입시 시창 · 청음의 기초예요.' },
    { id: 'v-adlib', inst: 'vocal', ko: '애드리브 · 런', en: 'AD-LIB', icon: 'melody', desc: '블루스 스케일과 빠른 런(멜리스마)으로 실용 보컬의 표현을 익혀요.' }
  ];
  const EX = [
    { id: 'v-longtone', cat: 'v-breath', level: 1, ko: '롱톤 (한 음 길게, 호흡 고르게)', tempo: [60, 60], opts: { voice: 'alto', steps: 2, vowel: '아' },
      goal: '한 음을 4박 동안 흔들림 없이, 4박 쉬며 숨. 호흡을 일정하게 내보내는 발성의 첫 연습이에요.',
      how: ['쉬는 4박 동안 코와 입으로 조용히 배(옆구리)까지 숨을 채워요.', '소리는 처음부터 끝까지 같은 크기 · 같은 음높이로.', '어깨가 올라가지 않게, 가슴은 편하게 연 채로.'],
      tips: ['끝으로 갈수록 음이 떨어지기 쉬워요. 마지막 박까지 음을 위에서 받친다는 느낌으로.', '익숙해지면 4박을 8박으로 늘려 보세요 (템포를 낮추면 돼요).'],
      src: 'Richard Miller 《The Structure of Singing》 · 호흡 조절 (appoggio) 기초',
      gen: o => [].concat(...[1, 3, 5, 3].map(n => [{ deg: sd(n), d: 4, syl: o.vowel }, rest(4)])) },
    { id: 'v-liptrill', cat: 'v-breath', level: 1, ko: '립 트릴 · 허밍 (1-3-5-3-1)', tempo: [80, 120], opts: { voice: 'alto', steps: 5, vowel: '(브르르)' },
      goal: '입술을 "브르르" 떨거나 입을 다문 허밍으로 1-3-5-3-1. 성대에 힘을 빼고 공기 흐름을 고르게 해요.',
      how: ['입술을 가볍게 다물고 숨을 내보내 입술이 떨리게 해요. 잘 안 되면 손가락으로 볼을 살짝 받쳐요.', '반복할 때마다 반음씩 올라갔다 내려와요.'],
      tips: ['떨림이 멈추면 숨이 약해진 거예요. 음보다 숨을 먼저 신경 쓰세요.'],
      src: '발성 워밍업 공통 (lip trill · humming)',
      gen: o => seq([1, 3, 5, 3], 1, { syl: o.vowel }).concat([{ deg: 0, d: 2, syl: o.vowel }, rest(2)]) },
    { id: 'v-staccato', cat: 'v-breath', level: 3, ko: '스타카토 아르페지오 (하 하 하)', tempo: [80, 132], opts: { voice: 'alto', steps: 5, vowel: '하' },
      goal: '1-3-5-8-5-3-1 을 짧게 끊어 "하!" 로. 배(횡격막)로 소리를 톡톡 튕기는 연습이에요.',
      how: ['음마다 배가 살짝 안으로 들어가는 느낌.', '목으로 끊지 말고 숨으로 끊어요.'],
      tips: ['소리가 거칠어지면 볼륨을 줄이고 가볍게.'],
      src: 'Nicola Vaccai 《Metodo pratico di canto》의 스타카토 · 도약 연습 방식',
      gen: o => seq([1, 3, 5, 8, 5, 3, 1], 0.5, { syl: o.vowel, stacc: true }).concat([rest(0.5), rest(4)]) },
    { id: 'v-five', cat: 'v-pitch', level: 1, ko: '5음 스케일 (1-2-3-4-5-4-3-2-1)', tempo: [80, 132], opts: { voice: 'alto', steps: 5, syl: 'solfa' },
      goal: '도-레-미-파-솔-파-미-레-도. 가장 많이 쓰는 발성 워밍업으로, 반복마다 반음씩 올라가요.',
      how: ['처음 피아노 화음을 듣고 첫 음을 마음속으로 먼저 불러 본 뒤 시작해요.', '올라갈수록 입을 세로로 조금 더 열어요.'],
      tips: ['높은 음에서 턱이 들리지 않게. 편하지 않은 높이에서는 멈추고 다시 내려오세요.'],
      src: '발성 워밍업 공통 (five-tone scale) · 실용음악 보컬 입시 워밍업',
      gen: o => seq([1, 2, 3, 4, 5, 4, 3, 2], 0.5).concat([{ deg: 0, d: 2 }, rest(2)]) },
    { id: 'v-arp', cat: 'v-pitch', level: 2, ko: '아르페지오 (1-3-5-8-5-3-1)', tempo: [80, 132], opts: { voice: 'alto', steps: 5, syl: 'solfa' },
      goal: '도-미-솔-도(높은)-솔-미-도. 음이 넓게 뛰어 음정 감각과 높은 음 연결을 함께 익혀요.',
      how: ['높은 도로 뛸 때 목에 힘을 주지 말고, 소리를 앞으로 던지듯.', '내려올 때도 음이 떨어지지 않게 붙잡아요.'],
      tips: ['뛰는 음정이 어렵다면 먼저 5음 스케일로 목을 푼 뒤 해요.'],
      src: 'Giuseppe Concone 《50 Lessons, Op. 9》 · 아르페지오 발성',
      gen: () => seq([1, 3, 5, 8, 5, 3], 0.5).concat([{ deg: 0, d: 1 }, rest(4)]) },
    { id: 'v-octave', cat: 'v-pitch', level: 3, ko: '옥타브 도약 후 하행 (1-8-7-6-5-4-3-2-1)', tempo: [80, 120], opts: { voice: 'alto', steps: 4, syl: 'solfa' },
      goal: '낮은 도에서 높은 도로 한 번에 뛴 뒤 한 음씩 내려와요. 가성 · 진성 사이를 부드럽게 잇는 연습이에요.',
      how: ['높은 도는 소리를 위로 밀지 말고 가볍게 얹어요.', '내려오면서 소리가 점점 두꺼워지는 것을 느껴 보세요.'],
      tips: ['도약이 끊기면 립 트릴로 같은 음형을 먼저 해 보세요.'],
      src: 'Nicola Vaccai 《Metodo pratico di canto》 · 옥타브 도약',
      gen: () => seq([1, 8, 7, 6, 5, 4, 3, 2], 0.5).concat([{ deg: 0, d: 2 }, rest(2)]) },
    { id: 'v-nine', cat: 'v-pitch', level: 3, ko: '9음 스케일 (1 ~ 9 ~ 1)', tempo: [80, 132], opts: { voice: 'alto', steps: 4, syl: 'solfa' },
      goal: '도에서 높은 레까지 올라갔다 내려와요. 한 숨에 긴 프레이즈를 부르는 호흡과 넓은 음역을 함께 기르는 연습이에요.',
      how: ['시작 전에 숨을 충분히. 한 숨에 끝까지 부르는 것이 목표예요.', '높은 레에서 소리가 얇아져도 괜찮아요. 억지로 크게 내지 않아요.'],
      tips: ['숨이 모자라면 템포를 조금 올리는 것도 방법이에요.'],
      src: '발성 워밍업 공통 (nine-tone scale)',
      gen: () => seq([1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2], 0.5).concat([{ deg: 0, d: 2 }, rest(2)]) },
    { id: 'v-chrom', cat: 'v-pitch', level: 4, ko: '반음계 (도 → 솔 반음씩)', tempo: [70, 110], opts: { voice: 'alto', steps: 3, syl: 'solfa' },
      goal: '도에서 솔까지 반음씩 올라갔다 내려와요. 가장 좁은 음정을 정확히 구분하는 음정 훈련이에요.',
      how: ['피아노 가이드를 켜고 한 음씩 맞춰 보고, 익숙해지면 가이드를 끄고 불러요.', '올라갈 때는 #(도# · 레# · 파#), 내려올 때는 ♭(솔♭ · 미♭ · 레♭) 이름으로.'],
      tips: ['반음이 온음처럼 넓어지기 쉬워요. 이웃한 음에 "기대듯" 좁게.'],
      src: '시창 · 청음 공통 (반음계) · 코다이 이동도 계이름',
      gen: () => { const up = [[0, '도'], [1, '도#'], [2, '레'], [3, '레#'], [4, '미'], [5, '파'], [6, '파#'], [7, '솔']], dn = [[7, '솔'], [6, '솔♭'], [5, '파'], [4, '미'], [3, '미♭'], [2, '레'], [1, '레♭'], [0, '도']]; return up.map(([deg, s]) => ({ deg, d: 0.5, sol: s })).concat(dn.map(([deg, s]) => ({ deg, d: 0.5, sol: s, flat: true }))); } },
    { id: 'v-interval', cat: 'v-sight', level: 2, ko: '인터벌 부르기 (2도 ~ 8도)', tempo: [70, 110], opts: { voice: 'alto', steps: 0, syl: 'solfa' },
      goal: '도-레-도, 도-미-도 … 도-높은 도-도. 악보를 보고 음정을 바로 부르는 시창의 기초예요.',
      how: ['각 음정을 부르기 전에 두 음이 어떤 노래의 시작과 닮았는지 떠올려 보세요 (예: 완전 4도 = "결혼 행진곡").', '가이드를 끄고 불러 본 뒤, 켜고 맞았는지 확인해요.'],
      tips: ['6도 · 7도가 가장 어려워요. 옥타브(8도)에서 한 음 모자란 소리로 생각하면 쉬워요.'],
      src: '코다이 시창 (이동도 계이름) · 음대 입시 시창 · 청음 기초',
      gen: () => [].concat(...[2, 3, 4, 5, 6, 7, 8].map(n => seq([1, n, 1], 1).concat([rest(1)]))) },
    { id: 'v-harmony', cat: 'v-sight', level: 5, ko: '3도 화음 부르기 (피아노 선율 위)', tempo: [70, 110], opts: { voice: 'alto', steps: 0, syl: 'solfa' },
      goal: '피아노가 도-레-미-파-솔을 치는 동안 나는 3도 위(미-파-솔-라-시)를 불러요. 코러스 · 입시 화음 청음의 기초예요.',
      how: ['악보는 내가 부를 음, 피아노 가이드는 아래 선율을 쳐요.', '두 음이 부딪히지 않고 맑게 섞이는 느낌을 찾아요.'],
      tips: ['처음에는 가이드 대신 내 음을 피아노로 한 번 들어 보고 시작해도 좋아요 (보컬 페이지 설정의 "내 음 치기").'],
      src: '화음 청음 · 코러스 파트 연습 (실용음악 보컬 입시)',
      gen: () => [1, 2, 3, 4, 5, 4, 3, 2].map(n => ({ deg: sd(n + 2), gdeg: sd(n), d: 1 })).concat([{ deg: sd(3), gdeg: 0, d: 4 }]) },
    { id: 'v-blues', cat: 'v-adlib', level: 4, ko: '블루스 스케일 런', tempo: [70, 120], opts: { voice: 'alto', steps: 4, syl: 'solfa' },
      goal: '1-b3-4-#4-5-b7-8 을 올라갔다 내려와요. R&B · 소울 애드리브의 재료가 되는 음들이에요.',
      how: ['#4(파#)는 4와 5 사이를 미끄러지듯 지나가는 음이에요.', '익숙해지면 한 음씩 꾸밈을 넣어 자유롭게 불러 보세요.'],
      tips: ['b3(미♭)이 메이저 3도(미)로 올라가지 않게 조심해요.'],
      src: '실용음악 보컬 입시 · 블루스 스케일 애드리브',
      gen: () => { const up = [[0, '도'], [3, '미♭'], [5, '파'], [6, '파#'], [7, '솔'], [10, '시♭'], [12, '도']]; const dn = [[12, '도'], [10, '시♭'], [7, '솔'], [6, '솔♭'], [5, '파'], [3, '미♭'], [0, '도']]; return up.map(([deg, s]) => ({ deg, d: 0.5, sol: s })).concat(dn.map(([deg, s]) => ({ deg, d: 0.5, sol: s, flat: true }))).concat([{ deg: 0, d: 1, sol: '도' }]); } },
    { id: 'v-run', cat: 'v-adlib', level: 5, ko: '멜리스마 런 (16분 하행 묶음)', tempo: [60, 100], opts: { voice: 'alto', steps: 4, syl: 'solfa' },
      goal: '네 음씩 묶어 내려오는 빠른 런. 한 글자에 여러 음을 굴리는 R&B · 가스펠 보컬의 핵심 기술이에요.',
      how: ['처음엔 음마다 "아" 를 또박또박, 빨라지면 한 숨에 굴려요.', '묶음의 첫 음에 살짝 무게를 두면 박이 흐트러지지 않아요.'],
      tips: ['느린 템포에서 정확하게 → 스피드 트레이너로 조금씩. 빠를수록 소리는 작게.'],
      src: '실용음악 보컬 입시 · R&B 멜리스마 연습',
      gen: () => seq([8, 7, 6, 5, 6, 5, 4, 3, 4, 3, 2, 1], 0.25).concat([{ deg: 0, d: 1 }, rest(4)]) }
  ];
  EX.forEach(e => { e.inst = 'vocal'; });
  const ROUTINES = [
    { id: 'v-easy', inst: 'vocal', ko: '입문 루틴', min: 10, desc: '롱톤으로 숨 → 립 트릴 → 5음 스케일 → 인터벌.', steps: [['v-longtone', 3], ['v-liptrill', 2], ['v-five', 3], ['v-interval', 2]] },
    { id: 'v-mid', inst: 'vocal', ko: '중급 루틴', min: 15, desc: '스타카토로 깨우고 아르페지오 · 옥타브 · 9음 스케일로 음역을 넓혀요.', steps: [['v-liptrill', 2], ['v-staccato', 3], ['v-arp', 3], ['v-octave', 3], ['v-nine', 4]] },
    { id: 'v-hard', inst: 'vocal', ko: '고급 루틴', min: 20, desc: '반음계 · 화음 · 블루스 · 런까지.', steps: [['v-liptrill', 2], ['v-nine', 3], ['v-chrom', 4], ['v-harmony', 4], ['v-blues', 3], ['v-run', 4]] }
  ];
  GH.data.techVoices = VOICES;
  GH.data.techSources = GH.data.techSources || {};
  GH.data.techSources.vocal = [
    ['Richard Miller', '《The Structure of Singing》', '호흡 조절 · 롱톤 · 발성 기초'],
    ['Nicola Vaccai', '《Metodo pratico di canto》 (1832)', '음정 도약 · 스타카토 · 레가토'],
    ['Giuseppe Concone', '《50 Lessons, Op. 9》', '아르페지오 · 프레이즈 발성'],
    ['Zoltán Kodály', '코다이 시창법', '이동도 계이름 · 인터벌 시창'],
    ['실용음악과 보컬 입시', '공통 과제', '스케일 워밍업 · 화음 청음 · 블루스 애드리브 · 런']
  ];
  GH.data.techCats = (GH.data.techCats || []).concat(CATS);
  GH.data.technique = (GH.data.technique || []).concat(EX);
  GH.data.techRoutines = (GH.data.techRoutines || []).concat(ROUTINES);
})();
