/* 인터벌 데이터 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  GH.data = GH.data || {};
  GH.data.intervals = [
    { iv: '1', semi: 0, ko: '유니즌 (1도)', en: 'Perfect Unison', feel: '같은 음. 모든 인터벌의 출발점.', song: '같은 음을 두 번 치는 모든 멜로디', inversion: '8', ex: 'C → C' },
    { iv: 'b2', semi: 1, ko: '마이너 2도', en: 'Minor 2nd', feel: '가장 강한 불협화. 반음. 긴장감과 공포.', song: '죠스 테마, 엘리제를 위하여 (첫 두 음)', inversion: '7', ex: 'C → Db' },
    { iv: '2', semi: 2, ko: '메이저 2도', en: 'Major 2nd', feel: '온음. 스케일의 기본 걸음. 9음의 재료.', song: '생일 축하합니다 (첫 두 음), 학교종', inversion: 'b7', ex: 'C → D' },
    { iv: 'b3', semi: 3, ko: '마이너 3도', en: 'Minor 3rd', feel: '마이너 코드의 색. 슬프고 어두운 느낌.', song: 'Greensleeves, Smoke on the Water (첫 두 음)', inversion: '6', ex: 'C → Eb' },
    { iv: '3', semi: 4, ko: '메이저 3도', en: 'Major 3rd', feel: '메이저 코드의 색. 밝고 안정적.', song: 'When the Saints Go Marching In, 나비야', inversion: 'b6', ex: 'C → E' },
    { iv: '4', semi: 5, ko: '퍼펙트 4도', en: 'Perfect 4th', feel: '열려 있고 단단한 소리. 기타 인접 현의 조율 간격.', song: '결혼 행진곡 (Here Comes the Bride), Amazing Grace', inversion: '5', ex: 'C → F' },
    { iv: '#4', semi: 6, ko: '트라이톤 (#4 · b5)', en: 'Tritone', feel: '옥타브를 정확히 반으로 나눈 가장 불안정한 인터벌. 도미넌트 7 코드의 3음과 b7음이 만든다.', song: 'The Simpsons 테마, Maria (West Side Story)', inversion: '#4', ex: 'C → F#' },
    { iv: '5', semi: 7, ko: '퍼펙트 5도', en: 'Perfect 5th', feel: '가장 안정적인 협화 인터벌. 파워코드.', song: 'Star Wars 메인 테마, 반짝반짝 작은 별', inversion: '4', ex: 'C → G' },
    { iv: 'b6', semi: 8, ko: '마이너 6도', en: 'Minor 6th', feel: '애수 어린 소리. 마이너 키의 b6, 어그멘티드의 #5와 같은 음.', song: 'Love Story 테마, The Entertainer (세 번째, 네 번째 음)', inversion: '3', ex: 'C → Ab' },
    { iv: '6', semi: 9, ko: '메이저 6도', en: 'Major 6th', feel: '따뜻하고 부드러운 소리. 도리안의 특징음, 13음의 재료.', song: 'My Bonnie Lies Over the Ocean, NBC 차임', inversion: 'b3', ex: 'C → A' },
    { iv: 'b7', semi: 10, ko: '마이너 7도', en: 'Minor 7th', feel: '도미넌트와 블루스의 긴장. 해결을 요구한다.', song: 'Somewhere (West Side Story), Star Trek 오리지널 테마', inversion: '2', ex: 'C → Bb' },
    { iv: '7', semi: 11, ko: '메이저 7도', en: 'Major 7th', feel: '세련된 긴장. maj7 코드의 색. 루트 반음 아래.', song: 'Take On Me (코러스), Superman 테마', inversion: 'b2', ex: 'C → B' },
    { iv: '8', semi: 12, ko: '옥타브', en: 'Octave', feel: '같은 음의 높은 버전. 주파수 2배.', song: 'Somewhere Over the Rainbow (첫 두 음)', inversion: '1', ex: 'C → C (높은)' }
  ];
  GH.data.compoundIntervals = [
    { iv: 'b9', simple: 'b2', ko: '단 9도', note: '7b9 코드. 마이너로 해결하는 V7의 텐션.' },
    { iv: '9', simple: '2', ko: '장 9도', note: '거의 모든 코드에 붙일 수 있는 가장 부드러운 텐션.' },
    { iv: '#9', simple: 'b3', ko: '증 9도', note: '7#9 (헨드릭스 코드). 도미넌트 위에서 블루지한 소리.' },
    { iv: '11', simple: '4', ko: '완전 11도', note: '마이너 코드에서 자연스럽다. 메이저/도미넌트에서는 3음과 부딪혀 어보이드 노트.' },
    { iv: '#11', simple: '#4', ko: '증 11도', note: '리디안의 소리. maj7#11, 7#11.' },
    { iv: 'b13', simple: 'b6', ko: '단 13도', note: '7b13. 마이너로 해결하는 V7, 알터드.' },
    { iv: '13', simple: '6', ko: '장 13도', note: '도미넌트 13. 기타에서는 R, 3, b7, 13 네 음으로 잡는다.' }
  ];
})();
