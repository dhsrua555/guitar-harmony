/* 곡 분석 예제: 마디별 코드, 기능, 스케일, 보이싱과 릭 연결 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  GH.data = GH.data || {};
  /* bars: {c: 코드 심볼, r: 로마 숫자, fn: T/S/D/X, scale: [루트, 스케일id], tip, licks: [릭 id]} */
  GH.data.songs = [
    { id: 'autumn', ko: '재즈 스탠다드 형태 A: Autumn Leaves (G 메이저 / E 마이너)', key: 'G', mode: 'major', form: 'AABC 32마디 (여기서는 A 8마디 + C 8마디)', tempo: 130, style: 'swing',
      summary: '메이저 ii-V-I 와 관계조(E 마이너)의 마이너 ii-V-i 가 번갈아 나오는 구조. 한 곡 안에서 두 종류의 ii-V 를 모두 연습할 수 있어 재즈 입문의 교과서로 불린다.',
      bars: [
        { c: 'Am7', r: 'ii7', fn: 'S', scale: ['A', 'dorian'], tip: 'G 메이저의 ii. 도리안 = G 메이저 스케일.', licks: ['bebop-251-c'] },
        { c: 'D7', r: 'V7', fn: 'D', scale: ['D', 'mixolydian'], tip: '비밥 도미넌트나 알터드로 색을 더할 수 있다.', licks: ['bebop-g7-desc', 'altered-g7'] },
        { c: 'Gmaj7', r: 'Imaj7', fn: 'T', scale: ['G', 'ionian'], tip: '착지. 3음(B)이나 7음(F#)에서 프레이즈를 끝낸다.', licks: ['neosoul-cmaj7'] },
        { c: 'Cmaj7', r: 'IVmaj7', fn: 'S', scale: ['C', 'lydian'], tip: 'IV 코드 위에서는 리디안 (#4 = F#) 이 자연스럽다.', licks: ['lydian-fmaj7'] },
        { c: 'F#m7b5', r: 'iiø7 (Em)', fn: 'S', scale: ['F#', 'locrian_nat2'], tip: 'E 마이너의 ii. 로크리안 ♮2를 쓰면 9th를 포함할 수 있다.', licks: ['minor-251-am'] },
        { c: 'B7b9', r: 'V7b9 (Em)', fn: 'D', scale: ['B', 'phrygian_dom'], tip: 'E 하모닉 마이너 = B 프리지안 도미넌트.', licks: ['minor-251-am', 'dim-g7b9'] },
        { c: 'Em7', r: 'i7 (Em)', fn: 'T', scale: ['E', 'aeolian'], tip: '마이너 토닉. 에올리안 또는 도리안.', licks: ['rock-em-pent'] },
        { c: 'Em7', r: 'i7 (Em)', fn: 'T', scale: ['E', 'dorian'], tip: '', licks: [] },
        { c: 'F#m7b5', r: 'iiø7', fn: 'S', scale: ['F#', 'locrian'], tip: 'C 섹션 시작.', licks: ['minor-251-am'] },
        { c: 'B7b9', r: 'V7b9', fn: 'D', scale: ['B', 'altered'], tip: '알터드로 더 강한 긴장.', licks: ['altered-g7'] },
        { c: 'Em7 A7', r: 'i7 – IV7', fn: 'T', scale: ['E', 'dorian'], tip: 'A7 은 D7 로 가는 세컨더리 도미넌트 (V7/V) 이자 E 도리안 뱀프의 IV7.', licks: ['funk-dm7-dorian'] },
        { c: 'Dm7 G7', r: 'v7 – I7 (→ C)', fn: 'X', scale: ['D', 'dorian'], tip: 'Cmaj7 로 가는 ii-V. 키가 잠깐 C 로 기운다.', licks: ['bebop-251-c'] },
        { c: 'Cmaj7', r: 'IVmaj7', fn: 'S', scale: ['C', 'lydian'], tip: '', licks: [] },
        { c: 'B7b9', r: 'V7b9 (Em)', fn: 'D', scale: ['B', 'phrygian_dom'], tip: '', licks: ['dim-g7b9'] },
        { c: 'Em7', r: 'i7', fn: 'T', scale: ['E', 'minor_pent'], tip: '엔딩. 펜타토닉으로 단순하게 끝내도 좋다.', licks: ['rock-em-pent'] },
        { c: 'Em7', r: 'i7', fn: 'T', scale: ['E', 'aeolian'], tip: '', licks: [] }
      ],
      practice: ['먼저 ii-V-I (Am7 D7 Gmaj7) 와 iiø7-V7-i (F#ø7 B7 Em) 두 조각을 따로 루프한다.', '각 코드에 드롭 2 보이싱 (5-4-3-2 세트) 을 보이스 리딩으로 연결해 컴핑한다.', '솔로는 각 코드의 3음과 7음(가이드 톤)만으로 먼저 연주해 본다.'],
      progressions: ['ii-V-I', 'ii-V-i'] },
    { id: 'fbluesjazz', ko: 'F 재즈 블루스 12마디', key: 'F', mode: 'major', form: '12마디 블루스', tempo: 150, style: 'swing',
      summary: '블루스 폼에 ii-V, 세컨더리 도미넌트, 디미니시드 패싱이 들어간 재즈 블루스. 기본 블루스와 어디가 다른지 마디별로 비교한다.',
      bars: [
        { c: 'F7', r: 'I7', fn: 'T', scale: ['F', 'mixolydian'], tip: 'F 블루스 스케일도 항상 가능.', licks: ['blues-a-box1', 'mixo-a7'] },
        { c: 'Bb7', r: 'IV7', fn: 'S', scale: ['Bb', 'mixolydian'], tip: '퀵 체인지. 2마디째에 IV7.', licks: ['bebop-g7-desc'] },
        { c: 'F7', r: 'I7', fn: 'T', scale: ['F', 'blues'], tip: '', licks: ['blues-a-box1'] },
        { c: 'Cm7 F7', r: 'v7 – I7 (→ IV)', fn: 'X', scale: ['C', 'dorian'], tip: 'Bb7 로 가는 ii-V. F7 은 여기서 세컨더리 도미넌트 V7/IV.', licks: ['bebop-251-c'] },
        { c: 'Bb7', r: 'IV7', fn: 'S', scale: ['Bb', 'mixolydian'], tip: '', licks: ['mixo-a7'] },
        { c: 'Bdim7', r: '#iv°7', fn: 'X', scale: ['B', 'wh_dim'], tip: 'IV 와 I/5 사이의 패싱 디미니시드. Bb7 폼을 반음 올리면 된다.', licks: ['dim-g7b9'] },
        { c: 'F7', r: 'I7', fn: 'T', scale: ['F', 'major_blues'], tip: '', licks: ['country-a-doublestop'] },
        { c: 'D7', r: 'VI7 (V7/ii)', fn: 'D', scale: ['D', 'hw_dim'], tip: 'Gm7 로 가는 세컨더리 도미넌트. b9 텐션이 어울린다.', licks: ['dim-g7b9', 'altered-g7'] },
        { c: 'Gm7', r: 'ii7', fn: 'S', scale: ['G', 'dorian'], tip: '기본 블루스의 V7 자리에 ii7.', licks: ['funk-dm7-dorian'] },
        { c: 'C7', r: 'V7', fn: 'D', scale: ['C', 'bebop_dom'], tip: '알터드나 비밥 도미넌트.', licks: ['bebop-g7-desc', 'altered-g7'] },
        { c: 'F7 D7', r: 'I7 – VI7', fn: 'T', scale: ['F', 'mixolydian'], tip: '턴어라운드 시작.', licks: ['blues-e-turnaround'] },
        { c: 'Gm7 C7', r: 'ii7 – V7', fn: 'D', scale: ['G', 'dorian'], tip: '턴어라운드. 마지막 마디는 엔딩 릭으로 끝낼 수도 있다.', licks: ['blues-a-ending', 'bebop-251-c'] }
      ],
      practice: ['기본 12마디 블루스와 코드 차트를 나란히 놓고 달라진 마디(2, 4, 6, 8, 9, 12)만 표시해 본다.', '루트 6번줄, 5번줄 셸 보이싱으로 전체를 컴핑한다 (프레디 그린 스타일).', 'F 블루스 스케일 하나로 12마디를 버틴 뒤, 각 코드의 3음을 찾아 넣는다.'],
      progressions: ['blues12', 'jazzblues', 'bluesturn'] },
    { id: 'kpopchorus', ko: 'K-pop / J-pop 발라드 코러스 (왕도 진행 + 캐논 변형)', key: 'C', mode: 'major', form: '8마디 코러스', tempo: 72, style: 'ballad',
      summary: 'IVmaj7 – V7 – iii7 – vi7 왕도 진행에 ii – V 를 붙여 I 로 해결하고, 마지막에 세컨더리 도미넌트로 다시 시작으로 돌아가는 전형적인 발라드 코러스.',
      bars: [
        { c: 'Fmaj7', r: 'IVmaj7', fn: 'S', scale: ['F', 'lydian'], tip: '토닉이 아닌 IV 에서 시작해 떠 있는 느낌.', licks: ['lydian-fmaj7', 'neosoul-cmaj7'] },
        { c: 'G7', r: 'V7', fn: 'D', scale: ['G', 'mixolydian'], tip: 'G7sus4 → G7 으로 나누면 더 부드럽다.', licks: ['bebop-g7-desc'] },
        { c: 'Em7', r: 'iii7', fn: 'T', scale: ['E', 'phrygian'], tip: 'I 대신 iii 로 살짝 비켜 가는 것이 왕도 진행의 핵심. E7 (V7/vi) 으로 바꾸면 더 극적.', licks: ['rock-em-pent'] },
        { c: 'Am7', r: 'vi7', fn: 'T', scale: ['A', 'aeolian'], tip: '', licks: ['minor-251-am'] },
        { c: 'Dm7', r: 'ii7', fn: 'S', scale: ['D', 'dorian'], tip: '', licks: ['funk-dm7-dorian'] },
        { c: 'G7', r: 'V7', fn: 'D', scale: ['G', 'mixolydian'], tip: 'G/B (V/3) 로 베이스를 올리면 캐논 느낌.', licks: ['altered-g7'] },
        { c: 'C', r: 'I', fn: 'T', scale: ['C', 'ionian'], tip: '해결.', licks: ['neosoul-cmaj7'] },
        { c: 'C E7', r: 'I – III7 (V7/vi)', fn: 'T', scale: ['E', 'phrygian_dom'], tip: 'E7 이 다음 코러스의 Am 또는 Fmaj7 으로 이끈다.', licks: ['metal-e-harm'] }
      ],
      practice: ['오픈 코드 → CAGED 바레 → 드롭 2 순으로 같은 진행을 세 가지 보이싱으로 쳐 본다.', 'iii7 을 III7 로, V7 을 V7sus4 로 바꾸며 리하모니 효과를 들어 본다.', '멜로디를 정하고 각 코드에서 멜로디 음이 몇 도인지 적어 본다 (리하모니의 기본 규칙).'],
      progressions: ['royalroad', 'canon', 'ii-V-I'] }
  ];
})();
