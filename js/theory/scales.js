/* 스케일 데이터와 함수 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const N = GH.notes; const mod = N.mod;

  /* id, ko, en, intervals, labels(표시용 텐션 표기), category, parent, modeIndex, characteristic, avoid(코드별 어보이드 참고), chords, desc, usage */
  const SCALES = [
    /* --- 메이저 스케일의 모드 --- */
    { id: 'ionian', ko: '아이오니안 (메이저 스케일)', en: 'Ionian / Major', intervals: ['1', '2', '3', '4', '5', '6', '7'], category: 'major', parent: 'ionian', modeIndex: 1, characteristic: ['4', '7'], avoid: ['4'], chords: ['maj', 'maj7', '6', '69', 'maj9', 'add9', 'sus2'], desc: '메이저 스케일이자 기능화성의 기준이 되는 스케일. maj7 위의 4음은 메이저 3도와 b9 마찰을 만들 수 있어 지속음이나 강박에서 주의한다.', usage: '메이저 키의 I 코드, 팝, 클래식, 동요' },
    { id: 'dorian', ko: '도리안', en: 'Dorian', intervals: ['1', '2', 'b3', '4', '5', '6', 'b7'], category: 'major', parent: 'ionian', modeIndex: 2, characteristic: ['6'], avoid: [], chords: ['min', 'm7', 'm6', 'm9', 'm11', 'm69'], desc: '마이너 계열이지만 메이저 6도가 있어 밝은 색이 섞인 모드. m7 위에서 자주 선택하는 대표적인 출발점이다.', usage: 'ii-V-I의 ii, 모달 재즈(So What), 펑크, 산타나 스타일' },
    { id: 'phrygian', ko: '프리지안', en: 'Phrygian', intervals: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'], category: 'major', parent: 'ionian', modeIndex: 3, characteristic: ['b2'], avoid: ['b2', 'b6'], chords: ['min', 'm7', 'sus4'], desc: 'b2가 특징인 어두운 마이너 모드. 스페인 플라멩코와 메탈에서 자주 쓴다.', usage: '플라멩코, 메탈 리프, iii 코드 위' },
    { id: 'lydian', ko: '리디안', en: 'Lydian', intervals: ['1', '2', '3', '#4', '5', '6', '7'], category: 'major', parent: 'ionian', modeIndex: 4, characteristic: ['#4'], avoid: [], chords: ['maj', 'maj7', 'maj7#11', 'maj9', '69', 'add9'], desc: '#4가 특징인 밝은 모드. maj7 위에서 자연11 대신 #11을 사용해 선명하고 떠 있는 색을 만든다.', usage: 'IV 코드 위, 영화음악, 조 새트리아니, 스티브 바이' },
    { id: 'mixolydian', ko: '믹솔리디안', en: 'Mixolydian', intervals: ['1', '2', '3', '4', '5', '6', 'b7'], category: 'major', parent: 'ionian', modeIndex: 5, characteristic: ['b7'], avoid: ['4'], chords: ['7', '9', '13', '7sus4', '13sus4', 'maj'], desc: '메이저에 b7이 붙은 도미넌트의 기본 스케일. 블루스, 록, 컨트리, 펑크의 핵심.', usage: 'V7 코드 위, 블루스, 록 (Sweet Home Alabama), 펑크' },
    { id: 'aeolian', ko: '에올리안 (내추럴 마이너)', en: 'Aeolian / Natural Minor', intervals: ['1', '2', 'b3', '4', '5', 'b6', 'b7'], category: 'major', parent: 'ionian', modeIndex: 6, characteristic: ['b6'], avoid: ['b6'], chords: ['min', 'm7', 'm9', 'madd9'], desc: '가장 기본적인 마이너 스케일. 슬프고 서정적이며 록과 팝의 마이너 키에서 기본으로 쓴다.', usage: '마이너 키의 i 코드, 록 발라드, 팝' },
    { id: 'locrian', ko: '로크리안', en: 'Locrian', intervals: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'], category: 'major', parent: 'ionian', modeIndex: 7, characteristic: ['b5'], avoid: ['b2'], chords: ['dim', 'm7b5'], desc: 'b2와 b5가 있는 어두운 모드. 퍼펙트 5도 대신 b5가 있어 토닉 중심을 안정시키기 어렵고 m7b5 코드 위에서 자주 쓴다.', usage: '마이너 ii-V의 iiø7 위, 메탈' },
    /* --- 마이너 스케일 --- */
    { id: 'harmonic_minor', ko: '하모닉 마이너', en: 'Harmonic Minor', intervals: ['1', '2', 'b3', '4', '5', 'b6', '7'], category: 'minor', parent: 'harmonic_minor', modeIndex: 1, characteristic: ['7', 'b6'], avoid: [], chords: ['min', 'mMaj7', 'madd9'], desc: '내추럴 마이너의 7음을 올려 리딩톤을 만든 스케일. b6과 7 사이의 어그멘티드 2도가 이국적인 긴장을 만든다.', usage: '마이너 키의 V7 → i 해결, 네오클래시컬 메탈, 클래식' },
    { id: 'melodic_minor', ko: '멜로딕 마이너', en: 'Melodic Minor (Jazz Minor)', intervals: ['1', '2', 'b3', '4', '5', '6', '7'], category: 'minor', parent: 'melodic_minor', modeIndex: 1, characteristic: ['6', '7'], avoid: [], chords: ['min', 'mMaj7', 'm6', 'm69'], desc: '메이저 스케일의 3음만 내린 스케일 (재즈에서는 상행 하행 동일). 도리안보다 밝고 세련된 마이너 토닉 소리.', usage: 'mMaj7, m6 코드 위, 재즈 마이너 토닉' },
    { id: 'harmonic_major', ko: '하모닉 메이저', en: 'Harmonic Major', intervals: ['1', '2', '3', '4', '5', 'b6', '7'], category: 'minor', parent: 'harmonic_major', modeIndex: 1, characteristic: ['b6'], avoid: ['4'], chords: ['maj7', 'maj', 'augMaj7'], desc: '메이저 스케일의 6음만 내린 스케일. 메이저 키에서 iv 마이너(모달 인터체인지)를 쓸 때의 소리.', usage: 'I → iv 진행, 리하모니' },
    /* --- 멜로딕 마이너 모드 --- */
    { id: 'dorian_b2', ko: '도리안 b2', en: 'Dorian b2 / Phrygian #6', intervals: ['1', 'b2', 'b3', '4', '5', '6', 'b7'], category: 'minor', parent: 'melodic_minor', modeIndex: 2, characteristic: ['b2', '6'], avoid: [], chords: ['7sus4', 'm7'], desc: '멜로딕 마이너 2번째 모드. 7sus4(b9) 코드 위에서 프리지안 대신 쓸 수 있는 스케일.', usage: 'sus4 b9 코드, 모달 재즈' },
    { id: 'lydian_aug', ko: '리디안 어그멘티드', en: 'Lydian Augmented', intervals: ['1', '2', '3', '#4', '#5', '6', '7'], category: 'minor', parent: 'melodic_minor', modeIndex: 3, characteristic: ['#4', '#5'], avoid: [], chords: ['augMaj7', 'aug', 'maj7#11'], desc: '멜로딕 마이너 3번째 모드. maj7#5 코드의 스케일.', usage: 'maj7#5 코드, 현대 재즈' },
    { id: 'lydian_dom', ko: '리디안 도미넌트', en: 'Lydian Dominant', intervals: ['1', '2', '3', '#4', '5', '6', 'b7'], category: 'minor', parent: 'melodic_minor', modeIndex: 4, characteristic: ['#4', 'b7'], avoid: [], chords: ['7', '7#11', '9', '13', '7b5'], desc: '멜로딕 마이너 4번째 모드. 믹솔리디안의 4음을 #4로 바꾼 소리로, 7#11과 비해결 도미넌트에 자주 쓴다.', usage: 'bVII7, bII7(트라이톤 대체), 7#11 코드' },
    { id: 'mixolydian_b6', ko: '믹솔리디안 b6', en: 'Mixolydian b6 / Hindu', intervals: ['1', '2', '3', '4', '5', 'b6', 'b7'], category: 'minor', parent: 'melodic_minor', modeIndex: 5, characteristic: ['b6', 'b7'], avoid: ['4'], chords: ['7', '7b13'], desc: '멜로딕 마이너 5번째 모드. 7b13 코드의 스케일이며 마이너로 해결하는 V7에 쓴다.', usage: 'V7b13 → i' },
    { id: 'locrian_nat2', ko: '로크리안 ♮2', en: 'Locrian ♮2 / Aeolian b5', intervals: ['1', '2', 'b3', '4', 'b5', 'b6', 'b7'], category: 'minor', parent: 'melodic_minor', modeIndex: 6, characteristic: ['2', 'b5'], avoid: [], chords: ['m7b5'], desc: '멜로딕 마이너 6번째 모드. 로크리안의 b2를 자연2도로 올려 m7b5 코드 위에서 9음을 사용할 수 있게 한다.', usage: '마이너 ii-V의 iiø7 위 (9음 사용)' },
    { id: 'altered', ko: '알터드 (슈퍼 로크리안)', en: 'Altered / Super Locrian', intervals: ['1', 'b2', '#2', '3', 'b5', 'b6', 'b7'], labels: ['1', 'b9', '#9', '3', '#11', 'b13', 'b7'], category: 'minor', parent: 'melodic_minor', modeIndex: 7, characteristic: ['b9', '#9', 'b13'], avoid: [], chords: ['7alt', '7#9', '7b9', '7#5', '7b13'], desc: '멜로딕 마이너 7번째 모드. 도미넌트의 3음과 b7을 제외한 모든 음이 변화된 가장 긴장감 큰 도미넌트 스케일. 반음 위 멜로딕 마이너와 같다 (G7alt = Ab 멜로딕 마이너).', usage: 'V7alt → I/i, 비밥, 모던 재즈' },
    /* --- 하모닉 마이너 모드 --- */
    { id: 'locrian_nat6', ko: '로크리안 ♮6', en: 'Locrian ♮6', intervals: ['1', 'b2', 'b3', '4', 'b5', '6', 'b7'], category: 'minor', parent: 'harmonic_minor', modeIndex: 2, characteristic: ['6'], avoid: [], chords: ['m7b5'], desc: '하모닉 마이너 2번째 모드. 로크리안의 b6를 자연6도로 올려 iiø7 위에서 13음을 사용할 수 있다.', usage: '마이너 ii-V의 ii' },
    { id: 'ionian_aug', ko: '아이오니안 #5', en: 'Ionian Augmented', intervals: ['1', '2', '3', '4', '#5', '6', '7'], category: 'minor', parent: 'harmonic_minor', modeIndex: 3, characteristic: ['#5'], avoid: ['4'], chords: ['augMaj7', 'aug'], desc: '하모닉 마이너 3번째 모드. maj7#5 코드의 또 다른 선택지.', usage: 'bIII+maj7 코드' },
    { id: 'dorian_sharp4', ko: '도리안 #4 (루마니안 마이너)', en: 'Dorian #4 / Ukrainian Dorian', intervals: ['1', '2', 'b3', '#4', '5', '6', 'b7'], category: 'minor', parent: 'harmonic_minor', modeIndex: 4, characteristic: ['#4'], avoid: [], chords: ['m7', 'm6'], desc: '하모닉 마이너 4번째 모드. 도리안에 #4가 붙어 집시, 클레즈머 느낌이 난다.', usage: '집시 재즈, 동유럽 음악' },
    { id: 'phrygian_dom', ko: '프리지안 도미넌트', en: 'Phrygian Dominant', intervals: ['1', 'b2', '3', '4', '5', 'b6', 'b7'], labels: ['1', 'b9', '3', '4', '5', 'b13', 'b7'], category: 'minor', parent: 'harmonic_minor', modeIndex: 5, characteristic: ['b9', '3'], avoid: ['4'], chords: ['7', '7b9', '7b13'], desc: '하모닉 마이너 5번째 모드. 마이너 키 V7 위의 기본 스케일이며 플라멩코, 메탈, 중동 음악의 소리.', usage: 'V7 → i (마이너 키), 플라멩코, 잉베이 맘스틴' },
    { id: 'lydian_sharp2', ko: '리디안 #2', en: 'Lydian #2', intervals: ['1', '#2', '3', '#4', '5', '6', '7'], category: 'minor', parent: 'harmonic_minor', modeIndex: 6, characteristic: ['#2', '#4'], avoid: [], chords: ['maj7', 'maj7#11'], desc: '하모닉 마이너 6번째 모드. maj7 위에서 #9의 독특한 색채를 준다.', usage: 'bVImaj7 코드' },
    { id: 'ultralocrian', ko: '얼트라 로크리안', en: 'Ultralocrian / Altered bb7', intervals: ['1', 'b2', 'b3', 'b4', 'b5', 'b6', 'bb7'], category: 'minor', parent: 'harmonic_minor', modeIndex: 7, characteristic: ['bb7'], avoid: [], chords: ['dim7'], desc: '하모닉 마이너 7번째 모드. vii°7 코드 위에서 쓴다.', usage: 'vii°7 → i' },
    /* --- 펜타토닉, 블루스 --- */
    { id: 'major_pent', ko: '메이저 펜타토닉', en: 'Major Pentatonic', intervals: ['1', '2', '3', '5', '6'], category: 'pentatonic', parent: 'major_pent', modeIndex: 1, characteristic: [], avoid: [], chords: ['maj', '6', '69', 'add9', 'maj7', '7'], desc: '메이저 스케일에서 4음과 7음을 뺀 5음 스케일. 메이저 코드의 주요 코드톤과 9, 13을 담아 멜로디와 애드리브의 출발점으로 쓰기 좋다.', usage: '컨트리, 남부 록, 블루스 (메이저 느낌), 팝' },
    { id: 'minor_pent', ko: '마이너 펜타토닉', en: 'Minor Pentatonic', intervals: ['1', 'b3', '4', '5', 'b7'], category: 'pentatonic', parent: 'major_pent', modeIndex: 5, characteristic: [], avoid: [], chords: ['min', 'm7', 'm11', '7', '5'], desc: '내추럴 마이너에서 2음과 b6을 뺀 5음 스케일. 기타 솔로의 출발점이며 마이너 코드는 물론 블루스에서는 도미넌트 위에서도 쓴다.', usage: '블루스, 록, 거의 모든 기타 솔로' },
    { id: 'blues', ko: '블루스 스케일', en: 'Blues Scale', intervals: ['1', 'b3', '4', 'b5', '5', 'b7'], category: 'pentatonic', parent: 'blues', modeIndex: 1, characteristic: ['b5'], avoid: [], chords: ['7', 'm7', '9', '7#9', 'min'], desc: '마이너 펜타토닉에 b5(블루 노트)를 더한 스케일. b5는 4와 5 사이의 경과음으로 쓴다.', usage: '블루스, 록, 재즈 블루스' },
    { id: 'major_blues', ko: '메이저 블루스 스케일', en: 'Major Blues Scale', intervals: ['1', '2', 'b3', '3', '5', '6'], category: 'pentatonic', parent: 'major_blues', modeIndex: 1, characteristic: ['b3'], avoid: [], chords: ['maj', '6', '7', '9'], desc: '메이저 펜타토닉에 b3을 더한 스케일. b3 → 3 의 움직임이 컨트리와 스윙 블루스의 핵심.', usage: '컨트리, 스윙, 로커빌리, 웨스턴 스윙' },
    /* --- 대칭 스케일 --- */
    { id: 'whole_tone', ko: '홀톤', en: 'Whole Tone', intervals: ['1', '2', '3', '#4', '#5', 'b7'], category: 'symmetric', parent: 'whole_tone', modeIndex: 1, characteristic: ['#4', '#5'], avoid: [], chords: ['7#5', '7b5', 'aug', '7#11'], desc: '온음만으로 이루어진 6음 대칭 스케일. 2가지 종류밖에 없으며 7#5 코드와 꿈같은 분위기에 쓴다.', usage: '7#5, aug 코드, 인상주의, 몽환적 효과' },
    { id: 'wh_dim', ko: '디미니시드 (온음-반음)', en: 'Diminished (Whole-Half)', intervals: ['1', '2', 'b3', '4', 'b5', 'b6', 'bb7', '7'], labels: ['1', '9', 'b3', '11', 'b5', 'b13', 'bb7', '7'], category: 'symmetric', parent: 'wh_dim', modeIndex: 1, characteristic: [], avoid: [], chords: ['dim7', 'dim'], desc: '온음과 반음이 번갈아 나오는 8음 대칭 스케일. dim7 코드 위에서 쓴다. 3가지 종류밖에 없다.', usage: 'dim7 코드, 패싱 디미니시드' },
    { id: 'hw_dim', ko: '도미넌트 디미니시드 (반음-온음)', en: 'Dominant Diminished (Half-Whole)', intervals: ['1', 'b2', '#2', '3', '#4', '5', '6', 'b7'], labels: ['1', 'b9', '#9', '3', '#11', '5', '13', 'b7'], category: 'symmetric', parent: 'wh_dim', modeIndex: 2, characteristic: ['b9', '#9', '13'], avoid: [], chords: ['7b9', '7#9', '13', '7#11', 'dim7'], desc: '반음과 온음이 번갈아 나오는 8음 대칭 스케일. 7b9 코드의 대표 스케일이며 b9, #9, #11, 13 텐션을 모두 담고 있다.', usage: 'V7b9, 13b9 코드, 비밥, 퓨전' },
    { id: 'augmented', ko: '어그멘티드 스케일', en: 'Augmented Scale', intervals: ['1', '#2', '3', '5', '#5', '7'], category: 'symmetric', parent: 'augmented', modeIndex: 1, characteristic: ['#5'], avoid: [], chords: ['aug', 'augMaj7', 'maj7'], desc: '마이너 3도와 반음이 번갈아 나오는 6음 대칭 스케일. 두 개의 어그멘티드 트라이어드를 겹친 형태.', usage: 'augMaj7, 현대 재즈 (마이클 브레커, 올리버 넬슨)' },
    /* --- 비밥 --- */
    { id: 'bebop_dom', ko: '비밥 도미넌트', en: 'Bebop Dominant', intervals: ['1', '2', '3', '4', '5', '6', 'b7', '7'], category: 'bebop', parent: 'bebop_dom', modeIndex: 1, characteristic: ['7'], avoid: [], chords: ['7', '9', '13'], desc: '믹솔리디안에 메이저 7도를 경과음으로 더한 8음 스케일. 코드톤에서 시작해 연속 8분음표로 연주하면 다음 코드톤을 강박에 배치하기 쉽다.', usage: 'V7 코드 위 비밥 라인' },
    { id: 'bebop_major', ko: '비밥 메이저', en: 'Bebop Major', intervals: ['1', '2', '3', '4', '5', '#5', '6', '7'], category: 'bebop', parent: 'bebop_major', modeIndex: 1, characteristic: ['#5'], avoid: [], chords: ['maj7', '6', 'maj9'], desc: '메이저 스케일에 #5를 경과음으로 더한 8음 스케일. 적절한 코드톤에서 시작하면 연속 8분음표 라인의 강박에 코드톤을 배치하기 쉽다.', usage: 'Imaj7, I6 코드 위 비밥 라인' },
    { id: 'bebop_dorian', ko: '비밥 도리안', en: 'Bebop Dorian', intervals: ['1', '2', 'b3', '3', '4', '5', '6', 'b7'], category: 'bebop', parent: 'bebop_dorian', modeIndex: 1, characteristic: ['3'], avoid: [], chords: ['m7', 'm9'], desc: '도리안에 메이저 3도를 경과음으로 더한 스케일. ii7 코드 위 비밥 라인에 쓴다.', usage: 'ii7 코드 위' },
    /* --- 기타 --- */
    { id: 'chromatic', ko: '크로매틱', en: 'Chromatic', intervals: ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'], category: 'chromatic', parent: 'chromatic', modeIndex: 1, characteristic: [], avoid: [], chords: [], desc: '12개 반음 전부. 경과음, 인클로저, 어프로치 노트의 재료.', usage: '크로매틱 어프로치, 인클로저' },
    { id: 'hungarian_minor', ko: '헝가리안 마이너', en: 'Hungarian Minor', intervals: ['1', '2', 'b3', '#4', '5', 'b6', '7'], category: 'exotic', parent: 'hungarian_minor', modeIndex: 1, characteristic: ['#4', '7'], avoid: [], chords: ['min', 'mMaj7'], desc: '하모닉 마이너에 #4를 더한 스케일. 어그멘티드 2도가 두 번 나와 집시 음악의 강렬한 색채를 낸다.', usage: '집시, 클레즈머, 네오클래시컬' },
    { id: 'double_harmonic', ko: '더블 하모닉 (비잔틴)', en: 'Double Harmonic / Byzantine', intervals: ['1', 'b2', '3', '4', '5', 'b6', '7'], category: 'exotic', parent: 'double_harmonic', modeIndex: 1, characteristic: ['b2', '7'], avoid: [], chords: ['maj', 'maj7'], desc: 'b2와 7이 모두 있는 스케일. 중동, 아랍 음악의 소리 (Misirlou).', usage: '중동, 서프 록 (Misirlou), 메탈' },
    { id: 'hirajoshi', ko: '히라조시 (平調子)', en: 'Hirajoshi', intervals: ['1', '2', 'b3', '5', 'b6'], category: 'exotic', parent: 'hirajoshi', modeIndex: 1, characteristic: ['b6'], avoid: [], chords: ['min', 'madd9'], desc: '일본 고토 스케일 중 하나. 5음 스케일이지만 반음이 있어 펜타토닉과 다른 긴장이 있다.', usage: '일본풍, 마티 프리드먼 스타일' },
    { id: 'in_sen', ko: '인센 (陰旋)', en: 'In Sen', intervals: ['1', 'b2', '4', '5', 'b7'], category: 'exotic', parent: 'in_sen', modeIndex: 1, characteristic: ['b2'], avoid: [], chords: ['sus4', '7sus4'], desc: '일본 스케일. b2와 4가 있어 sus4 b9 코드 위에서 쓸 수 있다.', usage: '일본풍, 7sus4(b9) 코드' },
    { id: 'yo', ko: '요 (陽旋, 민요 스케일)', en: 'Yo Scale', intervals: ['1', '2', '4', '5', '6'], category: 'exotic', parent: 'major_pent', modeIndex: 4, characteristic: [], avoid: [], chords: ['sus2', 'sus4', 'maj'], desc: '3음이 없는 일본 민요 스케일. 메이저 펜타토닉의 모드이며 밝고 담백하다.', usage: '민요풍, 국악 계열 멜로디' }
  ];
  const SMAP = {}; SCALES.forEach(s => { SMAP[s.id] = s; });
  const CATEGORY_KO = { major: '메이저 스케일의 모드', minor: '멜로딕·하모닉 계열과 모드', pentatonic: '펜타토닉과 블루스', symmetric: '대칭 스케일', bebop: '비밥 스케일', exotic: '그 밖의 스케일', chromatic: '크로매틱' };
  const CATEGORY_ORDER = ['major', 'minor', 'pentatonic', 'symmetric', 'bebop', 'exotic', 'chromatic'];

  function get(id) { return SMAP[id]; }
  function pcs(rootPc, id) { return SMAP[id].intervals.map(iv => mod(rootPc + N.ivSemi(iv), 12)); }
  function notes(root, id) {
    const s = SMAP[id]; const rootPc = N.pcOf(root);
    return s.intervals.map((iv, i) => ({ iv, label: (s.labels || s.intervals)[i], name: N.spell(root, iv), pc: mod(rootPc + N.ivSemi(iv), 12), cls: N.ivClass((s.labels || s.intervals)[i]) }));
  }
  function labelMap(rootPc, id) {
    const s = SMAP[id]; const map = {};
    s.intervals.forEach((iv, i) => { map[mod(rootPc + N.ivSemi(iv), 12)] = (s.labels || s.intervals)[i]; });
    return map;
  }
  /* 온음/반음 공식: W, H, W+H(3반음) */
  function formula(id) {
    const s = SMAP[id]; const semis = s.intervals.map(N.ivSemi);
    const steps = [];
    for (let i = 0; i < semis.length; i++) {
      const next = i + 1 < semis.length ? semis[i + 1] : semis[0] + 12;
      const d = next - semis[i];
      steps.push(d === 1 ? 'H' : d === 2 ? 'W' : d === 3 ? 'W+H' : d + '반음');
    }
    return steps;
  }
  function modesOf(parentId) { return SCALES.filter(s => s.parent === parentId).sort((a, b) => a.modeIndex - b.modeIndex); }
  function byCategory() { const g = {}; CATEGORY_ORDER.forEach(c => { g[c] = SCALES.filter(s => s.category === c); }); return g; }
  /* 코드에 맞는 스케일: 코드 pcs ⊆ 스케일 pcs. 코드 타입에 적힌 우선순위를 앞에 둔다 */
  function forChord(qId) {
    const q = GH.chords.getQuality(qId); if (!q) return [];
    const cpcs = q.intervals.map(N.ivPc);
    const fits = SCALES.filter(s => s.id !== 'chromatic' && cpcs.every(p => s.intervals.map(N.ivPc).includes(p)));
    const pref = q.scales || [];
    fits.sort((a, b) => {
      const ia = pref.indexOf(a.id), ib = pref.indexOf(b.id);
      if (ia >= 0 && ib >= 0) return ia - ib; if (ia >= 0) return -1; if (ib >= 0) return 1;
      return CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    });
    return fits.map(s => ({ scale: s, primary: pref.includes(s.id) }));
  }
  /* 스케일 위에 만들어지는 다이어토닉 코드 (트라이어드, 세븐 코드) */
  function harmonize(root, id, sevenths) { return GH.chords.diatonic(root, id, sevenths); }
  /* 두 스케일 비교: 공통음, a에만, b에만 (상대 pc 기준) */
  function compare(aId, bId) {
    const a = SMAP[aId].intervals.map(N.ivPc), b = SMAP[bId].intervals.map(N.ivPc);
    return { common: a.filter(p => b.includes(p)), onlyA: a.filter(p => !b.includes(p)), onlyB: b.filter(p => !a.includes(p)) };
  }
  /* 조표: 메이저 키 루트 → 샵/플랫 개수 */
  const SHARP_ORDER = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
  const FLAT_ORDER = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
  function keySignature(root, minor) {
    let major = root;
    if (minor) major = N.spell(root, 'b3');
    const n = N.normalize(major);
    let i = SHARP_ORDER.indexOf(n); if (i >= 0) return { sharps: i, flats: 0, text: i === 0 ? '없음' : '♯ ' + i + '개' };
    i = FLAT_ORDER.indexOf(n); if (i >= 0) return { sharps: 0, flats: i, text: '♭ ' + i + '개' };
    /* 이명동음으로 다시 시도 */
    const pc = N.pcOf(n);
    for (let k = 0; k < 12; k++) { if (N.pcOf(SHARP_ORDER[k] || 'C') === pc && k < SHARP_ORDER.length) return { sharps: k, flats: 0, text: '♯ ' + k + '개' }; if (FLAT_ORDER[k] && N.pcOf(FLAT_ORDER[k]) === pc) return { sharps: 0, flats: k, text: '♭ ' + k + '개' }; }
    return { sharps: 0, flats: 0, text: '' };
  }
  function relativeMinor(root) { return N.spell(root, '6'); }
  function relativeMajor(minorRoot) { return N.spell(minorRoot, 'b3'); }

  GH.scales = { SCALES, CATEGORY_KO, CATEGORY_ORDER, get, pcs, notes, labelMap, formula, modesOf, byCategory, forChord, harmonize, compare, keySignature, relativeMinor, relativeMajor };
})();
