/* 모드 부가 정보: 밝기, 분위기, 뱀프, 곡 예시 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  GH.data = GH.data || {};
  /* vamp: 모드 루트 기준 로마 숫자 (메이저 기준 표기, 필요한 곳에 b/# 명시) */
  GH.data.modes = {
    lydian: { brightness: 7, color: '#f5b400', mood: '매우 밝고 떠 있는, 꿈꾸는 듯한', chord: 'maj7#11, maj9(#11), 6/9', vamp: ['Imaj7', 'II'], vampText: 'I△7 – II (예: F△7 – G)', songs: ['The Simpsons 테마 (리디안 도미넌트 섞임)', 'Joe Satriani – Flying in a Blue Dream', 'Fleetwood Mac – Dreams', '영화음악(존 윌리엄스, E.T. 비행 장면)'], tip: '♯4를 특징음으로 들려주면 리디안의 색채가 분명해진다. 퍼펙트 4도를 강조하면 아이오니안 느낌이 커질 수 있다.' },
    ionian: { brightness: 6, color: '#f08c00', mood: '밝고 안정적, 익숙한', chord: 'maj7, 6, maj9, add9', vamp: ['Imaj7', 'IVmaj7'], vampText: 'I△7 – IV△7 (예: C△7 – F△7)', songs: ['Let It Be', '동요와 팝의 대부분', 'Beethoven – Ode to Joy'], tip: 'maj7 코드에서 4도를 길게 유지하거나 강박에 둘 때는 3음과의 b9 충돌을 확인한다. 경과음이나 sus 소리로는 사용할 수 있다.' },
    mixolydian: { brightness: 5, color: '#c8412f', mood: '밝지만 거친, 블루지한, 록', chord: '7, 9, 13, 7sus4', vamp: ['I7', 'bVII'], vampText: 'I7 – bVII (예: G7 – F)', songs: ['Lynyrd Skynyrd – Sweet Home Alabama', 'The Beatles – Norwegian Wood', 'Grateful Dead – Fire on the Mountain', 'The Beatles – Hey Jude (아웃트로)'], tip: 'b7이 특징음. 메이저 스케일에서 7음만 내리면 된다. 블루스 스케일과 섞어 쓰면 록 솔로가 된다.' },
    dorian: { brightness: 4, color: '#22a06b', mood: '마이너지만 밝은, 쿨한, 펑키한', chord: 'm7, m6, m9, m11, m13', vamp: ['i7', 'IV7'], vampText: 'i7 – IV7 (예: Dm7 – G7)', songs: ['Miles Davis – So What', 'Santana – Oye Como Va', 'Daft Punk – Get Lucky', 'Scarborough Fair', 'Pink Floyd – Another Brick in the Wall Pt.2 (솔로)'], tip: '메이저 6도가 특징음. 마이너 펜타토닉에 2음과 6음을 더하면 도리안이 된다. m7 컴핑이나 모달 뱀프에서 대표적인 출발점이다.' },
    aeolian: { brightness: 3, color: '#2f6fed', mood: '슬픈, 서정적, 록 발라드', chord: 'm7, m9, m(add9), m7(b6)', vamp: ['i', 'bVI', 'bVII'], vampText: 'i – bVI – bVII (예: Am – F – G)', songs: ['R.E.M. – Losing My Religion', 'Bob Dylan / Jimi Hendrix – All Along the Watchtower', 'The Cranberries – Zombie', 'Led Zeppelin – Stairway to Heaven (솔로)'], tip: 'b6이 특징음. 내추럴 마이너이며, V7이 필요하면 7음을 올려 하모닉 마이너로 잠시 바꾼다.' },
    phrygian: { brightness: 2, color: '#8b5cf6', mood: '어둡고 이국적, 스페인, 긴장', chord: 'm7, sus4(b9), m(b9)', vamp: ['i', 'bIImaj7'], vampText: 'i – bII△7 (예: Em – F△7)', songs: ['Jefferson Airplane – White Rabbit (인트로)', 'Metallica – Wherever I May Roam', '플라멩코 전반', 'Pink Floyd – Set the Controls for the Heart of the Sun'], tip: 'b2가 특징음. 3음을 메이저 3도로 바꾸면 프리지안 도미넌트(플라멩코 소리)가 된다.' },
    locrian: { brightness: 1, color: '#374151', mood: '매우 어두운, 불안정한, 긴장된', chord: 'm7b5, dim', vamp: ['iø7', 'bIImaj7'], vampText: 'iø7 – bII△7 (예: Bø7 – C△7)', songs: ['Björk – Army of Me', 'Rush – YYZ (인트로 리프)', 'Metallica – Enter Sandman (리프의 b5)'], tip: '퍼펙트 5도 대신 ♭5가 있어 토닉 코드의 안정감이 약하다. 실전에서는 iiø7 코드 위의 스케일 후보로 자주 쓴다.' },
    /* 멜로딕 마이너 모드 */
    melodic_minor: { color: '#0ea5a4', mood: '세련된 마이너 토닉, 영화적', chord: 'mMaj7, m6, m6/9', vamp: ['imMaj7', 'iv7'], vampText: 'i-△7 – iv7 (예: Cm△7 – Fm7)', songs: ['재즈 마이너 토닉 (예: Nardis, Beautiful Love의 토닉)', '영화음악 (James Bond 테마의 mMaj7)'], tip: '도리안의 b7을 7로 올린 것. mMaj7과 m6 코드 위에서 쓴다.' },
    dorian_b2: { color: '#0ea5a4', mood: '프리지안보다 부드러운 이국적 소리', chord: '7sus4(b9), m7', vamp: ['i7sus4', 'bIImaj7#11'], vampText: 'sus4(b9) 뱀프', songs: ['모달 재즈, 존 콜트레인의 sus 코드'], tip: '7sus4 위에서 b9와 13을 함께 낼 수 있다.' },
    lydian_aug: { color: '#0ea5a4', mood: '리디안보다 더 떠 있는 소리', chord: 'maj7#5', vamp: ['Imaj7#5'], vampText: 'I△7#5 뱀프', songs: ['현대 재즈 (허비 행콕, 웨인 쇼터)'], tip: '#4와 #5가 함께 있다. maj7#5 코드에서만 안정된다.' },
    lydian_dom: { color: '#0ea5a4', mood: '도미넌트지만 해결하지 않는, 유머러스한', chord: '7#11, 9#11, 13#11', vamp: ['I7#11'], vampText: 'I7#11 뱀프', songs: ['The Simpsons 테마', 'Yes – Roundabout (부분)', '재즈 스탠다드의 bVII7, bII7 위'], tip: '믹솔리디안의 4를 #4로 올린 것. 해결하지 않는 도미넌트(bVII7, 트라이톤 대체)에 최적.' },
    mixolydian_b6: { color: '#0ea5a4', mood: '마이너로 해결하려는 도미넌트', chord: '7b13, 9b13', vamp: ['I7b13', 'iv'], vampText: 'I7b13 → iv', songs: ['마이너 키 V7 위의 재즈 라인'], tip: 'b6이 b13 텐션이 된다. 4음은 어보이드.' },
    locrian_nat2: { color: '#0ea5a4', mood: 'm7b5 위에서 9음을 낼 수 있는 로크리안', chord: 'm9b5', vamp: ['iø7', 'IV7b9'], vampText: 'iiø7 – V7b9 (마이너 ii-V)', songs: ['마이너 ii-V-i의 iiø7 위'], tip: '로크리안의 b2를 2로 올렸다. iiø7 위에서 로크리안 대신 쓰면 더 밝고 세련된 소리.' },
    altered: { color: '#0ea5a4', mood: '가장 긴장된 도미넌트, 모던 재즈', chord: '7alt, 7#9, 7b9, 7#5', vamp: ['I7alt', 'IVmaj7'], vampText: 'I7alt → IV△7', songs: ['비밥과 모던 재즈의 V7 (찰리 파커, 존 콜트레인)'], tip: '반음 위 멜로딕 마이너와 같은 음. G7alt = Ab 멜로딕 마이너. 3음과 b7만 남기고 전부 변화.' },
    /* 하모닉 마이너 모드 */
    harmonic_minor: { color: '#d946ef', mood: '클래식한 마이너, 이국적, 네오클래시컬', chord: 'mMaj7, m, m(add9)', vamp: ['i', 'V7'], vampText: 'i – V7 (예: Am – E7)', songs: ['Bach – Toccata and Fugue', 'Yngwie Malmsteen – Far Beyond the Sun', '집시 재즈, 클래식 마이너 키'], tip: 'b6과 7 사이의 어그멘티드 2도가 특징. V7 코드 위에서 쓰면 마이너 키 해결이 자연스럽다.' },
    locrian_nat6: { color: '#d946ef', mood: 'm7b5 위에서 13음을 낼 수 있는 로크리안', chord: 'm7b5(13)', vamp: ['iø7', 'IV7b9'], vampText: 'iiø7 – V7b9', songs: ['마이너 ii-V의 ii'], tip: '6음이 자연 6도.' },
    ionian_aug: { color: '#d946ef', mood: '메이저지만 #5가 있는 긴장', chord: 'maj7#5', vamp: ['Imaj7#5'], vampText: 'bIII△7#5', songs: ['마이너 키의 bIII+ 코드'], tip: '' },
    dorian_sharp4: { color: '#d946ef', mood: '집시, 클레즈머, 동유럽', chord: 'm7, m6, m(#11)', vamp: ['i7', 'IV7'], vampText: 'i7 – IV7 (도리안과 같지만 #4)', songs: ['집시 재즈, 클레즈머'], tip: '' },
    phrygian_dom: { color: '#d946ef', mood: '플라멩코, 중동, 메탈', chord: '7b9, 7b9b13, 7(b13)', vamp: ['I7', 'bII'], vampText: 'I7 – bII (예: E7 – F)', songs: ['Hava Nagila', '플라멩코 (Andalusian cadence의 V)', 'Dick Dale – Misirlou (일부)', 'Yngwie Malmsteen 전반'], tip: '마이너 키의 V7 위에서 하모닉 마이너를 5도부터 시작한 것. b9와 3의 어그멘티드 2도가 특징.' },
    lydian_sharp2: { color: '#d946ef', mood: 'maj7 위의 독특한 #9 색채', chord: 'maj7#11, maj7(#9)', vamp: ['Imaj7#11'], vampText: 'bVI△7 코드', songs: ['마이너 키의 bVI△7'], tip: '' },
    ultralocrian: { color: '#d946ef', mood: 'dim7 코드의 스케일', chord: 'dim7', vamp: ['i°7', 'i'], vampText: 'vii°7 → i', songs: ['마이너 키의 vii°7'], tip: '' }
  };
  GH.data.diatonicModeOrder = ['lydian', 'ionian', 'mixolydian', 'dorian', 'aeolian', 'phrygian', 'locrian'];
})();
