/* 코드 타입 데이터, 코드 빌더, 다이어토닉, 로마 숫자 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const N = GH.notes; const mod = N.mod;

  /* id, sym(표준 표기), jazz(재즈 약식), aliases, ko, intervals, family, tensions(어베일러블), avoid, scales(우선 매칭), desc */
  const QUALITIES = [
    { id: 'maj', sym: '', jazz: '', aliases: ['M', 'maj', 'major', '△'], ko: '메이저', intervals: ['1', '3', '5'], family: 'major', tensions: ['9', '13', '#11'], avoid: ['4'], scales: ['ionian', 'lydian', 'major_pent', 'mixolydian'], desc: '메이저 3도 위에 마이너 3도를 쌓은 밝고 안정적인 기본 트라이어드. 키의 중심이 되는 소리.' },
    { id: 'min', sym: 'm', jazz: '-', aliases: ['m', 'min', '-', 'minor'], ko: '마이너', intervals: ['1', 'b3', '5'], family: 'minor', tensions: ['9', '11'], avoid: ['b6'], scales: ['aeolian', 'dorian', 'minor_pent', 'phrygian'], desc: '마이너 3도 위에 메이저 3도를 쌓은 어둡고 차분한 트라이어드. 메이저의 3음을 반음 내린 형태.' },
    { id: 'dim', sym: 'dim', jazz: '°', aliases: ['dim', '°', 'o'], ko: '디미니시드', intervals: ['1', 'b3', 'b5'], family: 'diminished', tensions: [], avoid: [], scales: ['locrian', 'wh_dim'], desc: '마이너 3도를 두 번 쌓아 b5가 생기는 불안정한 트라이어드. 다이어토닉에서는 vii°로 도미넌트 기능을 한다.' },
    { id: 'aug', sym: 'aug', jazz: '+', aliases: ['aug', '+', '#5'], ko: '어그멘티드', intervals: ['1', '3', '#5'], family: 'augmented', tensions: ['9'], avoid: [], scales: ['whole_tone', 'lydian_aug', 'augmented'], desc: '메이저 3도를 두 번 쌓은 대칭 트라이어드. 4반음마다 같은 모양이 반복되어 세 개의 루트를 가진다.' },
    { id: 'sus2', sym: 'sus2', jazz: 'sus2', aliases: ['sus2'], ko: '서스2', intervals: ['1', '2', '5'], family: 'sus', tensions: [], avoid: [], scales: ['ionian', 'mixolydian', 'dorian'], desc: '3음 대신 2음을 쓴 코드. 메이저와 마이너 어느 쪽도 아닌 열린 소리.' },
    { id: 'sus4', sym: 'sus4', jazz: 'sus4', aliases: ['sus4', 'sus'], ko: '서스4', intervals: ['1', '4', '5'], family: 'sus', tensions: ['9'], avoid: [], scales: ['mixolydian', 'ionian'], desc: '3음 대신 4음을 쓴 코드. 4음이 3음으로 내려가며 해결되는 긴장감이 특징.' },
    { id: '5', sym: '5', jazz: '5', aliases: ['5', 'power'], ko: '파워코드', intervals: ['1', '5'], family: 'major', tensions: [], avoid: [], scales: ['minor_pent', 'major_pent', 'aeolian', 'mixolydian'], desc: '루트와 5도만으로 이루어진 코드. 3음이 없어 메이저와 마이너의 구분이 없고 디스토션에 강하다.' },
    { id: '6', sym: '6', jazz: '6', aliases: ['6', 'maj6', 'M6'], ko: '메이저 6', intervals: ['1', '3', '5', '6'], family: 'major', tensions: ['9'], avoid: ['4'], scales: ['ionian', 'lydian', 'major_pent'], desc: '메이저 트라이어드에 메이저 6도를 더한 코드. maj7보다 부드럽게 곡을 끝낼 때 쓴다. 같은 음의 m7 (예: C6 = Am7)과 구성음이 같다.' },
    { id: 'm6', sym: 'm6', jazz: '-6', aliases: ['m6', 'min6', '-6'], ko: '마이너 6', intervals: ['1', 'b3', '5', '6'], family: 'minor', tensions: ['9'], avoid: [], scales: ['dorian', 'melodic_minor'], desc: '마이너 트라이어드에 메이저 6도를 더한 코드. 도리안이나 멜로딕 마이너의 소리이며 m7b5 (예: Cm6 = Am7b5)와 구성음이 같다.' },
    { id: 'maj7', sym: 'maj7', jazz: '△7', aliases: ['maj7', 'M7', 'Maj7', '△7', 'Δ7', 'ma7', 'j7'], ko: '메이저 7', intervals: ['1', '3', '5', '7'], family: 'major', tensions: ['9', '13', '#11'], avoid: ['4'], scales: ['ionian', 'lydian', 'major_pent', 'bebop_major'], desc: '메이저 트라이어드에 메이저 7도를 더한 코드. 부드럽고 세련된 토닉 소리. 재즈, 보사노바, 네오소울의 기본.' },
    { id: '7', sym: '7', jazz: '7', aliases: ['7', 'dom7'], ko: '도미넌트 7', intervals: ['1', '3', '5', 'b7'], family: 'dominant', tensions: ['9', '13', 'b9', '#9', '#11', 'b13'], avoid: ['4'], scales: ['mixolydian', 'lydian_dom', 'altered', 'hw_dim', 'whole_tone', 'bebop_dom', 'blues', 'phrygian_dom'], desc: '메이저 트라이어드에 마이너 7도를 더한 코드. 3음과 b7음이 만드는 트라이톤이 해결을 요구하는 도미넌트 기능의 핵심. 블루스에서는 토닉으로도 쓴다.' },
    { id: 'm7', sym: 'm7', jazz: '-7', aliases: ['m7', 'min7', '-7'], ko: '마이너 7', intervals: ['1', 'b3', '5', 'b7'], family: 'minor', tensions: ['9', '11'], avoid: ['b6'], scales: ['dorian', 'aeolian', 'phrygian', 'minor_pent', 'bebop_dorian'], desc: '마이너 트라이어드에 마이너 7도를 더한 코드. ii-V-I의 ii, 마이너 키의 토닉 등으로 자주 쓰이는 마이너 세븐 코드.' },
    { id: 'm7b5', sym: 'm7b5', jazz: 'ø7', aliases: ['m7b5', 'ø7', 'ø', 'm7(b5)', '-7b5', 'min7b5', 'half-dim'], ko: '마이너 7 b5 (하프 디미니시드)', intervals: ['1', 'b3', 'b5', 'b7'], family: 'diminished', tensions: ['9', '11', 'b13'], avoid: ['b2'], scales: ['locrian', 'locrian_nat2', 'locrian_nat6'], desc: '디미니시드 트라이어드에 마이너 7도를 더한 코드. 마이너 ii-V-i의 ii, 메이저 키의 vii로 쓰인다.' },
    { id: 'dim7', sym: 'dim7', jazz: '°7', aliases: ['dim7', '°7', 'o7'], ko: '디미니시드 7', intervals: ['1', 'b3', 'b5', 'bb7'], family: 'diminished', tensions: ['9', '11', 'b13', '7'], avoid: [], scales: ['wh_dim'], desc: '마이너 3도만으로 쌓은 완전 대칭 코드. 3반음마다 같은 모양이 반복되어 네 개의 루트를 가진다. 패싱 코드와 7b9의 대체로 쓴다.' },
    { id: 'mMaj7', sym: 'mMaj7', jazz: '-△7', aliases: ['mMaj7', 'mM7', 'm(maj7)', 'minmaj7', '-maj7', '-△7', 'mΔ7'], ko: '마이너 메이저 7', intervals: ['1', 'b3', '5', '7'], family: 'minor', tensions: ['9', '11', '13'], avoid: [], scales: ['melodic_minor', 'harmonic_minor'], desc: '마이너 트라이어드에 메이저 7도를 더한 코드. 멜로딕/하모닉 마이너의 토닉. 긴장감 있는 영화음악적 소리.' },
    { id: 'augMaj7', sym: 'maj7#5', jazz: '△7#5', aliases: ['maj7#5', 'augmaj7', '+maj7', 'M7#5', 'maj7+5', '△7#5'], ko: '메이저 7 #5', intervals: ['1', '3', '#5', '7'], family: 'augmented', tensions: ['9', '#11'], avoid: [], scales: ['lydian_aug', 'ionian_aug'], desc: '어그멘티드 트라이어드에 메이저 7도를 더한 코드. 멜로딕 마이너 3번째 모드(리디안 어그멘티드)의 소리.' },
    { id: '7#5', sym: '7#5', jazz: '7#5', aliases: ['7#5', 'aug7', '+7', '7+5', '7+'], ko: '도미넌트 7 #5', intervals: ['1', '3', '#5', 'b7'], family: 'dominant', tensions: ['9', '#9', 'b9'], avoid: [], scales: ['whole_tone', 'altered'], desc: '5음을 올린 도미넌트. 홀톤 스케일이나 알터드 스케일과 어울리며 마이너로 해결할 때 특히 효과적.' },
    { id: '7b5', sym: '7b5', jazz: '7b5', aliases: ['7b5', '7-5'], ko: '도미넌트 7 b5', intervals: ['1', '3', 'b5', 'b7'], family: 'dominant', tensions: ['9'], avoid: [], scales: ['whole_tone', 'lydian_dom', 'altered'], desc: '5음을 내린 도미넌트. 트라이톤 대체 코드와 구성음을 공유한다 (C7b5 = Gb7b5).' },
    { id: '7sus4', sym: '7sus4', jazz: '7sus4', aliases: ['7sus4', '7sus', '11'], ko: '도미넌트 7 sus4', intervals: ['1', '4', '5', 'b7'], family: 'dominant', tensions: ['9', '13'], avoid: [], scales: ['mixolydian', 'dorian_b2'], desc: '3음 대신 4음을 가진 도미넌트. 해결을 미루는 부유하는 소리로 펑크, 가스펠, 모달 재즈에서 자주 쓴다.' },
    { id: 'add9', sym: 'add9', jazz: 'add9', aliases: ['add9', 'add2', '(add9)'], ko: '애드 9', intervals: ['1', '3', '5', '9'], family: 'major', tensions: [], avoid: [], scales: ['ionian', 'lydian', 'mixolydian'], desc: '7음 없이 9음만 더한 메이저 코드. 팝과 어쿠스틱에서 맑고 넓은 소리를 만든다.' },
    { id: 'madd9', sym: 'm(add9)', jazz: '-add9', aliases: ['madd9', 'm(add9)', 'madd2', '-add9'], ko: '마이너 애드 9', intervals: ['1', 'b3', '5', '9'], family: 'minor', tensions: [], avoid: [], scales: ['aeolian', 'dorian'], desc: '마이너 트라이어드에 9음을 더한 코드. 서정적이고 영화적인 소리.' },
    { id: '69', sym: '6/9', jazz: '6/9', aliases: ['6/9', '69', '6add9', '6(9)'], ko: '식스 나인', intervals: ['1', '3', '5', '6', '9'], family: 'major', tensions: [], avoid: ['4'], scales: ['ionian', 'lydian', 'major_pent'], desc: '메이저 6에 9음을 더한 코드. 메이저 펜타토닉을 그대로 쌓은 소리로 재즈 엔딩과 보사노바에 자주 쓴다.' },
    { id: 'maj9', sym: 'maj9', jazz: '△9', aliases: ['maj9', 'M9', '△9', 'Δ9'], ko: '메이저 9', intervals: ['1', '3', '5', '7', '9'], family: 'major', tensions: ['13', '#11'], avoid: ['4'], scales: ['ionian', 'lydian'], desc: 'maj7에 9음을 더한 코드. 네오소울과 재즈 발라드의 대표적인 토닉 소리.' },
    { id: '9', sym: '9', jazz: '9', aliases: ['9', 'dom9'], ko: '도미넌트 9', intervals: ['1', '3', '5', 'b7', '9'], family: 'dominant', tensions: ['13', '#11'], avoid: ['4'], scales: ['mixolydian', 'lydian_dom', 'bebop_dom'], desc: '도미넌트 7에 9음을 더한 코드. 펑크와 블루스의 기본 도미넌트 (예: 제임스 브라운 스타일 E9).' },
    { id: 'm9', sym: 'm9', jazz: '-9', aliases: ['m9', 'min9', '-9'], ko: '마이너 9', intervals: ['1', 'b3', '5', 'b7', '9'], family: 'minor', tensions: ['11'], avoid: ['b6'], scales: ['dorian', 'aeolian'], desc: 'm7에 9음을 더한 코드. 네오소울, R&B, 재즈에서 m7 대신 기본으로 쓰는 풍부한 마이너.' },
    { id: 'm11', sym: 'm11', jazz: '-11', aliases: ['m11', 'min11', '-11'], ko: '마이너 11', intervals: ['1', 'b3', '5', 'b7', '9', '11'], family: 'minor', tensions: [], avoid: [], scales: ['dorian', 'aeolian'], desc: 'm9에 11음을 더한 코드. 쿼탈 보이싱(So What 코드)의 실제 이름이기도 하다.' },
    { id: '13', sym: '13', jazz: '13', aliases: ['13', 'dom13'], ko: '도미넌트 13', intervals: ['1', '3', '5', 'b7', '9', '13'], family: 'dominant', tensions: ['#11'], avoid: ['4'], scales: ['mixolydian', 'lydian_dom', 'bebop_dom'], desc: '도미넌트에 13음까지 더한 코드. 기타에서는 보통 5음과 9음을 생략하고 R, 3, b7, 13으로 잡는다.' },
    { id: 'maj13', sym: 'maj13', jazz: '△13', aliases: ['maj13', 'M13', '△13'], ko: '메이저 13', intervals: ['1', '3', '5', '7', '9', '13'], family: 'major', tensions: ['#11'], avoid: ['4'], scales: ['ionian', 'lydian'], desc: 'maj9에 13음을 더한 코드. 넓고 화려한 토닉.' },
    { id: '7b9', sym: '7b9', jazz: '7b9', aliases: ['7b9', '7(b9)', '7-9'], ko: '도미넌트 7 b9', intervals: ['1', '3', '5', 'b7', 'b9'], family: 'dominant', tensions: ['13', '#11', '#9'], avoid: [], scales: ['hw_dim', 'phrygian_dom', 'altered'], desc: '9음을 내린 도미넌트. 마이너로 해결하는 V7의 기본형이며 루트를 빼면 dim7과 같다 (G7b9 = B°7/G).' },
    { id: '7#9', sym: '7#9', jazz: '7#9', aliases: ['7#9', '7(#9)', '7+9'], ko: '도미넌트 7 #9', intervals: ['1', '3', '5', 'b7', '#9'], family: 'dominant', tensions: ['b13', 'b9'], avoid: [], scales: ['altered', 'blues', 'hw_dim'], desc: '메이저 3도와 #9(마이너 3도)가 함께 울리는 코드. 지미 헨드릭스 코드로 불리며 블루스, 펑크, 록에서 쓴다.' },
    { id: '7#11', sym: '7#11', jazz: '7#11', aliases: ['7#11', '9#11', '7(#11)'], ko: '도미넌트 7 #11', intervals: ['1', '3', '5', 'b7', '9', '#11'], family: 'dominant', tensions: ['13'], avoid: [], scales: ['lydian_dom', 'whole_tone'], desc: '리디안 도미넌트의 소리. 해결하지 않는 도미넌트(bVII7, 트라이톤 대체 bII7)에 잘 어울린다.' },
    { id: '7b13', sym: '7b13', jazz: '7b13', aliases: ['7b13', '7(b13)', '7b6'], ko: '도미넌트 7 b13', intervals: ['1', '3', 'b7', 'b13'], family: 'dominant', tensions: ['9', 'b9', '#9'], avoid: ['5'], scales: ['mixolydian_b6', 'altered', 'phrygian_dom'], desc: '13음을 내린 도미넌트. 마이너 키의 V7에 자연스럽게 나타난다 (하모닉 마이너 5번째 모드).' },
    { id: '7alt', sym: '7alt', jazz: '7alt', aliases: ['7alt', 'alt', '7#9b13', '7b9#9'], ko: '알터드 도미넌트', intervals: ['1', '3', 'b7', 'b9', '#9', '#11', 'b13'], family: 'dominant', tensions: [], avoid: [], scales: ['altered'], desc: '5음과 9음을 모두 변화시킨 도미넌트. 알터드 스케일의 소리로 가장 긴장감이 큰 V7. 보이싱에서는 보통 b9 또는 #9, b13 중 일부만 쓴다.' },
    { id: 'maj7#11', sym: 'maj7#11', jazz: '△7#11', aliases: ['maj7#11', 'M7#11', '△7#11', 'maj7(#11)', 'lydian'], ko: '메이저 7 #11', intervals: ['1', '3', '5', '7', '#11'], family: 'major', tensions: ['9', '13'], avoid: [], scales: ['lydian'], desc: '리디안의 소리를 담은 maj7. 메이저 키의 IV 코드, 혹은 영화음악적인 떠 있는 토닉에 쓴다.' },
    { id: 'm69', sym: 'm6/9', jazz: '-6/9', aliases: ['m6/9', 'm69', 'm6add9'], ko: '마이너 식스 나인', intervals: ['1', 'b3', '5', '6', '9'], family: 'minor', tensions: [], avoid: [], scales: ['dorian', 'melodic_minor'], desc: 'm6에 9음을 더한 코드. 도리안의 특징음(메이저 6도)과 9음이 함께 울리는 세련된 마이너.' },
    { id: '13sus4', sym: '13sus4', jazz: '13sus4', aliases: ['13sus4', '13sus', '9sus4', '9sus'], ko: '도미넌트 13 sus4', intervals: ['1', '4', '5', 'b7', '9', '13'], family: 'dominant', tensions: [], avoid: [], scales: ['mixolydian'], desc: '7sus4에 9, 13음을 더한 코드. 가스펠과 네오소울에서 V 대신 흔히 쓰는 부드러운 도미넌트.' },
    /* ---- 추가 코드 타입 ---- */
    { id: '7sus2', sym: '7sus2', jazz: '7sus2', aliases: ['7sus2'], ko: '도미넌트 7 sus2', intervals: ['1', '2', '5', 'b7'], family: 'dominant', tensions: ['13'], avoid: [], scales: ['mixolydian', 'dorian'], desc: '3음 대신 2음을 가진 도미넌트. 부드럽고 열린 소리로 록과 팝의 리프, 아르페지오에 자주 쓴다.' },
    { id: 'maj7sus4', sym: 'maj7sus4', jazz: '△7sus4', aliases: ['maj7sus4', 'M7sus4', '△7sus4'], ko: '메이저 7 sus4', intervals: ['1', '4', '5', '7'], family: 'major', tensions: ['9'], avoid: [], scales: ['ionian'], desc: '3음 대신 4음을 가진 maj7. 4음과 7음이 만드는 긴장이 현대적이고 몽환적이다. 영화음악과 네오소울.' },
    { id: 'add4', sym: 'add4', jazz: 'add4', aliases: ['add4', 'add11', '(add4)'], ko: '애드 4', intervals: ['1', '3', '4', '5'], family: 'major', tensions: [], avoid: [], scales: ['ionian', 'mixolydian'], desc: '메이저 트라이어드에 4음을 더한 코드. 3음과 4음이 붙어 있어 긴장감 있는 팝/록 사운드.' },
    { id: 'mb6', sym: 'm(b6)', jazz: '-b6', aliases: ['mb6', 'm(b6)', '-b6', 'mb13'], ko: '마이너 b6', intervals: ['1', 'b3', '5', 'b6'], family: 'minor', tensions: ['9'], avoid: [], scales: ['aeolian', 'harmonic_minor'], desc: '마이너 트라이어드에 마이너 6도를 더한 코드. 에올리안과 하모닉 마이너의 어두운 색채로 영화음악에서 자주 쓴다.' },
    { id: 'm7#5', sym: 'm7#5', jazz: '-7#5', aliases: ['m7#5', 'm7+5', '-7#5'], ko: '마이너 7 #5', intervals: ['1', 'b3', '#5', 'b7'], family: 'minor', tensions: ['9', '11'], avoid: [], scales: ['aeolian', 'phrygian'], desc: '마이너 7의 5음을 올린 코드. b6이 들어간 에올리안의 소리이며 b6 위의 maj7 (Cm7#5 = Abmaj7/C)과 같은 음이다.' },
    { id: 'dimMaj7', sym: 'dimMaj7', jazz: '°△7', aliases: ['dimMaj7', 'dimmaj7', '°maj7', 'dim(maj7)', '°△7', 'dimM7'], ko: '디미니시드 메이저 7', intervals: ['1', 'b3', 'b5', '7'], family: 'diminished', tensions: ['9', '11'], avoid: [], scales: ['wh_dim'], desc: '디미니시드 트라이어드에 메이저 7도를 더한 코드. 온음-반음 디미니시드 스케일의 7음이며 dim7 대신 긴장을 더할 때 쓴다.' },
    { id: 'mMaj9', sym: 'mMaj9', jazz: '-△9', aliases: ['mMaj9', 'mM9', 'm(maj9)', '-maj9', '-△9'], ko: '마이너 메이저 9', intervals: ['1', 'b3', '5', '7', '9'], family: 'minor', tensions: ['11', '13'], avoid: [], scales: ['melodic_minor'], desc: 'mMaj7에 9음을 더한 코드. 멜로딕 마이너 토닉의 세련되고 긴장감 있는 소리.' },
    { id: 'm9b5', sym: 'm9b5', jazz: 'ø9', aliases: ['m9b5', 'ø9', 'm9(b5)', '-9b5'], ko: '마이너 9 b5', intervals: ['1', 'b3', 'b5', 'b7', '9'], family: 'diminished', tensions: ['11'], avoid: [], scales: ['locrian_nat2', 'locrian_nat6'], desc: 'm7b5에 9음을 더한 코드. 로크리안 ♮2(멜로딕 마이너 6번째 모드)의 소리로 마이너 ii-V의 ii에 색을 더한다.' },
    { id: 'm7add11', sym: 'm7add11', jazz: '-7(11)', aliases: ['m7add11', 'm711', 'm(add11)', 'madd11', '-7add11'], ko: '마이너 7 애드 11', intervals: ['1', 'b3', '5', 'b7', '11'], family: 'minor', tensions: ['9'], avoid: ['b6'], scales: ['dorian', 'aeolian'], desc: '9음 없이 11음만 더한 m7. 기타에서 잡기 쉬운 쿼탈 느낌의 마이너 보이싱 (예: Am7add11).' },
    { id: 'm13', sym: 'm13', jazz: '-13', aliases: ['m13', 'min13', '-13'], ko: '마이너 13', intervals: ['1', 'b3', '5', 'b7', '9', '13'], family: 'minor', tensions: ['11'], avoid: [], scales: ['dorian'], desc: 'm7에 9음과 13음을 더한 코드. 메이저 6도(13)가 있어 도리안의 소리. 네오소울과 재즈 컴핑.' },
    { id: '13b9', sym: '13b9', jazz: '13b9', aliases: ['13b9', '13(b9)', '7b913'], ko: '도미넌트 13 b9', intervals: ['1', '3', '5', 'b7', 'b9', '13'], family: 'dominant', tensions: ['#11', '#9'], avoid: ['4'], scales: ['hw_dim'], desc: 'b9와 자연 13이 함께 있는 도미넌트. 반음-온음 디미니시드 스케일의 대표 코드로 비밥과 재즈 블루스에서 쓴다.' },
    { id: '13#11', sym: '13#11', jazz: '13#11', aliases: ['13#11', '13(#11)'], ko: '도미넌트 13 #11', intervals: ['1', '3', 'b7', '9', '#11', '13'], family: 'dominant', tensions: [], avoid: [], scales: ['lydian_dom'], desc: '리디안 도미넌트의 텐션을 모두 담은 코드. 해결하지 않는 도미넌트(bVII7, bII7)에 어울린다.' },
    { id: '7b9b13', sym: '7b9b13', jazz: '7b9b13', aliases: ['7b9b13', '7(b9,b13)', '7b13b9'], ko: '도미넌트 7 b9 b13', intervals: ['1', '3', 'b7', 'b9', 'b13'], family: 'dominant', tensions: ['#9'], avoid: [], scales: ['phrygian_dom', 'altered'], desc: 'b9와 b13을 가진 도미넌트. 프리지안 도미넌트의 색을 담아 마이너 키의 V7에서 자주 쓴다.' },
    { id: '7sus4b9', sym: '7sus4b9', jazz: '7sus4(b9)', aliases: ['7sus4b9', '7sus4(b9)', '7susb9', 'sus4b9'], ko: '도미넌트 7 sus4 b9', intervals: ['1', '4', '5', 'b7', 'b9'], family: 'dominant', tensions: ['13'], avoid: [], scales: ['dorian_b2', 'phrygian'], desc: 'sus4 위에 b9를 얹은 코드. 프리지안과 도리안 b2의 소리이며 모달 재즈와 스패니시 분위기에서 쓴다.' },
    { id: '9#5', sym: '9#5', jazz: '9#5', aliases: ['9#5', '9+5', 'aug9', '9+'], ko: '도미넌트 9 #5', intervals: ['1', '3', '#5', 'b7', '9'], family: 'dominant', tensions: [], avoid: [], scales: ['whole_tone'], desc: '홀톤 스케일을 그대로 쌓은 도미넌트. 5음이 올라가 떠 있는 긴장감이 있으며 해결 직전에 색을 바꿀 때 쓴다.' },
    { id: '9b5', sym: '9b5', jazz: '9b5', aliases: ['9b5', '9-5'], ko: '도미넌트 9 b5', intervals: ['1', '3', 'b5', 'b7', '9'], family: 'dominant', tensions: ['13'], avoid: [], scales: ['whole_tone', 'lydian_dom'], desc: '5음을 내린 도미넌트 9. 트라이톤 대체와 구성음을 공유하는 세련된 재즈 도미넌트.' },
    { id: 'maj9#11', sym: 'maj9#11', jazz: '△9#11', aliases: ['maj9#11', 'M9#11', '△9#11', 'maj9(#11)'], ko: '메이저 9 #11', intervals: ['1', '3', '5', '7', '9', '#11'], family: 'major', tensions: ['13'], avoid: [], scales: ['lydian'], desc: '리디안의 소리를 모두 담은 메이저 코드. 기타에서는 루트와 5음을 생략하고 3, 7, 9, #11로 잡는다.' }
  ];
  /* ---- 분류: 구성(category), 난이도(level) ---- */
  const CATEGORY_KO = { triad: '기본 트라이어드 · 파워 코드', sus: 'sus 코드', add: '6th · add 코드', seventh: '7th 코드 (세븐 코드)', ninth: '9th 코드', extended: '11th · 13th 코드', altered: '변화 도미넌트' };
  const CATEGORY_ORDER = ['triad', 'sus', 'add', 'seventh', 'ninth', 'extended', 'altered'];
  const CATEGORY_DESC = { triad: '메이저·마이너·디미니시드·어그멘티드 트라이어드와 두 음으로 된 파워 코드.', sus: '3음을 2음이나 4음으로 바꾼 코드. 메이저와 마이너가 확정되지 않은 열린 소리.', add: '7음 없이 6음, 9음, 4음 등을 더한 코드. 팝, 어쿠스틱, 발라드에서 자주 쓴다.', seventh: '트라이어드에 7음을 더한 코드. 재즈와 블루스 화성의 기본 단위.', ninth: '세븐 코드 위에 9음을 더한 코드. 기본 세븐 코드보다 넓고 풍부한 색을 낸다.', extended: '11음, 13음, #11까지 확장한 코드. 기타에서는 보통 루트이나 5음을 생략한다.', altered: 'b9, #9, b13처럼 변화 텐션을 포함한 도미넌트 코드.' };
  const CATEGORY_OF = { maj: 'triad', min: 'triad', dim: 'triad', aug: 'triad', 5: 'triad', sus2: 'sus', sus4: 'sus', '7sus4': 'sus', '7sus2': 'sus', '13sus4': 'sus', '7sus4b9': 'sus', maj7sus4: 'sus', add9: 'add', madd9: 'add', add4: 'add', 6: 'add', m6: 'add', 69: 'add', m69: 'add', mb6: 'add', maj7: 'seventh', 7: 'seventh', m7: 'seventh', m7b5: 'seventh', dim7: 'seventh', mMaj7: 'seventh', augMaj7: 'seventh', '7#5': 'seventh', '7b5': 'seventh', dimMaj7: 'seventh', 'm7#5': 'seventh', maj9: 'ninth', 9: 'ninth', m9: 'ninth', mMaj9: 'ninth', m9b5: 'ninth', '9#5': 'ninth', '9b5': 'ninth', m11: 'extended', m7add11: 'extended', 13: 'extended', maj13: 'extended', m13: 'extended', '7#11': 'extended', 'maj7#11': 'extended', 'maj9#11': 'extended', '13#11': 'extended', '13b9': 'extended', '7b9': 'altered', '7#9': 'altered', '7b13': 'altered', '7alt': 'altered', '7b9b13': 'altered' };
  const LEVEL_OF = { maj: 1, min: 1, '5': 1, '7': 1, m7: 1, maj7: 1, sus4: 1, sus2: 1, add9: 1, '6': 1, dim: 2, aug: 2, m6: 2, '7sus4': 2, madd9: 2, add4: 2, m7b5: 2, '9': 2, m9: 2, maj9: 2, '69': 2, dim7: 3, mMaj7: 3, '13': 3, m11: 3, '7b9': 3, '7#9': 3, m69: 3, '7sus2': 3, maj7sus4: 3, '13sus4': 3, mb6: 3, '7#5': 4, '7b5': 4, '7#11': 4, '7b13': 4, maj13: 4, 'maj7#11': 4, m13: 4, m7add11: 4, augMaj7: 4, 'm7#5': 4, '7alt': 4, dimMaj7: 5, mMaj9: 5, m9b5: 5, '13b9': 5, '13#11': 5, '7b9b13': 5, '7sus4b9': 5, '9#5': 5, '9b5': 5, 'maj9#11': 5 };
  const LEVEL_KO = { 1: 'p 입문', 2: 'mp 기초', 3: 'mf 중급', 4: 'f 중상급', 5: 'ff 고급' };
  QUALITIES.forEach(q => { q.category = CATEGORY_OF[q.id] || 'seventh'; q.level = LEVEL_OF[q.id] || 5; });
  const QMAP = {}; QUALITIES.forEach(q => { QMAP[q.id] = q; });
  const ALIAS = {};
  QUALITIES.forEach(q => { ALIAS[q.id] = q.id; ALIAS[q.sym] = q.id; ALIAS[q.jazz] = q.id; (q.aliases || []).forEach(a => { ALIAS[a] = q.id; }); });

  function getQuality(id) { return QMAP[id]; }
  function normalizeSuffix(s) {
    s = (s || '').trim().replace(/♯/g, '#').replace(/♭/g, 'b').replace(/Δ/g, '△').replace(/\(([^)]*)\)/g, '$1');
    return s;
  }
  function findQuality(suffix) {
    const s = normalizeSuffix(suffix);
    if (s === '') return 'maj';
    if (ALIAS[s] != null) return ALIAS[s];
    const lower = s.toLowerCase();
    for (const k of Object.keys(ALIAS)) if (k.toLowerCase() === lower && k !== '') return ALIAS[k];
    /* 흔한 변형 처리 */
    const m = { 'maj': 'maj', 'min': 'min', 'm': 'min', '-': 'min', 'M': 'maj', 'dom': '7', 'maj7#5': 'augMaj7', '7+': '7#5', 'sus': 'sus4', 'm7-5': 'm7b5', 'dim': 'dim', 'o': 'dim', 'aug': 'aug' };
    if (m[s]) return m[s];
    return null;
  }
  function symbol(root, qId, style) {
    const q = QMAP[qId]; if (!q) return root;
    style = style || (GH.state ? GH.state.get().symbolStyle : 'standard');
    return N.pretty(root) + (style === 'jazz' ? q.jazz : q.sym);
  }
  function chordPcs(rootPc, qId) { const q = QMAP[qId]; return q.intervals.map(iv => mod(rootPc + N.ivSemi(iv), 12)); }
  function buildChord(root, qId, opts) {
    const q = QMAP[qId]; if (!q) return null;
    root = N.normalize(root);
    const rootPc = N.pcOf(root);
    const notes = q.intervals.map(iv => ({ iv, name: N.spell(root, iv), pc: mod(rootPc + N.ivSemi(iv), 12), cls: N.ivClass(iv), ko: N.intervalKo(iv) }));
    const bass = opts && opts.bass ? N.normalize(opts.bass) : null;
    return { root, rootPc, quality: q, qId, notes, pcs: notes.map(n => n.pc), symbol: symbol(root, qId) + (bass ? '/' + N.pretty(bass) : ''), bass };
  }
  /* 코드 심볼 문자열 파싱: 'F#m7b5', 'Bbmaj7/D', 'C' */
  function parseSymbol(str) {
    if (!str) return null;
    let s = String(str).trim().replace(/♯/g, '#').replace(/♭/g, 'b');
    const m = /^([A-Ga-g](?:##|#|bb|b)?)(.*)$/.exec(s);
    if (!m) return null;
    const root = N.normalize(m[1].charAt(0).toUpperCase() + m[1].slice(1));
    let rest = m[2]; let bass = null;
    const sm = /^(.*)\/([A-G](?:#|b)?)$/.exec(rest);
    if (sm && !/^6\/9$/.test(rest) && !/6\/9/.test(rest)) { rest = sm[1]; bass = sm[2]; }
    const qId = findQuality(rest);
    if (qId == null) return null;
    return { root, qId, bass };
  }
  /* 상대 pc 집합으로 코드 타입 찾기 (exact) */
  function identify(relPcs) {
    const key = [...new Set(relPcs.map(p => mod(p, 12)))].sort((a, b) => a - b).join(',');
    return QUALITIES.filter(q => q.intervals.map(N.ivPc).slice().sort((a, b) => a - b).join(',') === key).map(q => q.id);
  }
  /* pc 집합(절대)으로 가능한 코드 이름 전부 찾기 (코드 파인더) */
  function identifyAll(pcs, pref) {
    const set = [...new Set(pcs.map(p => mod(p, 12)))];
    const out = [];
    for (let r = 0; r < 12; r++) {
      if (!set.includes(r)) continue;
      const rel = set.map(p => mod(p - r, 12));
      identify(rel).forEach(qId => out.push({ root: N.noteName(r, pref), qId, symbol: symbol(N.noteName(r, pref), qId), size: set.length }));
    }
    /* 루트가 낮은 음일 때, 음 개수 적은 코드 순으로 정렬 */
    out.sort((a, b) => a.qId.length - b.qId.length);
    return out;
  }

  /* ---- 다이어토닉 코드 ---- */
  const FUNCTIONS_MAJOR = ['T', 'S', 'T', 'S', 'D', 'T', 'D'];
  const FUNCTIONS_MINOR = ['T', 'S', 'T', 'S', 'D', 'S', 'D'];
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  function diatonic(keyRoot, scaleId, sevenths) {
    const sc = GH.scales.get(scaleId || 'ionian');
    const ivs = sc.intervals;
    if (ivs.length !== 7) return [];
    const rootPc = N.pcOf(keyRoot);
    const isMinor = /aeolian|minor|dorian|phrygian/.test(sc.id);
    return ivs.map((iv, i) => {
      const degRoot = N.spell(keyRoot, iv);
      const degPc = mod(rootPc + N.ivSemi(iv), 12);
      const stack = sevenths ? [0, 2, 4, 6] : [0, 2, 4];
      const rel = stack.map(s => mod(N.ivSemi(ivs[(i + s) % 7]) - N.ivSemi(iv), 12));
      const ids = identify(rel);
      const qId = ids[0] || null;
      const q = qId ? QMAP[qId] : null;
      let roman = ROMAN[i];
      if (q && (q.family === 'minor' || q.family === 'diminished')) roman = roman.toLowerCase();
      if (q && q.family === 'diminished') roman += q.id === 'dim7' ? '°7' : q.id === 'm7b5' ? 'ø7' : '°';
      else if (q && q.family === 'augmented') roman += q.id === 'augMaj7' ? '+maj7' : '+';
      else if (q && sevenths) roman += q.id === 'maj7' ? 'maj7' : q.id === 'mMaj7' ? 'mMaj7' : '7';
      const fn = (isMinor ? FUNCTIONS_MINOR : FUNCTIONS_MAJOR)[i];
      return { degree: i + 1, iv, root: degRoot, pc: degPc, qId, roman, fn, chord: qId ? buildChord(degRoot, qId) : null };
    });
  }
  const FN_KO = { T: '토닉', S: '서브도미넌트', D: '도미넌트', X: '기타' };

  /* ---- 로마 숫자 ---- */
  const MAJOR_DEG = [0, 2, 4, 5, 7, 9, 11];
  const ROMAN_RE = /^(b|#|♭|♯)?(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(.*)$/;
  function parseRoman(str) {
    let s = String(str).trim();
    let secondary = null, bassIv = null;
    const parts = s.split('/');
    if (parts.length === 2 && ROMAN_RE.test(parts[1])) { s = parts[0]; secondary = parts[1]; }
    else if (parts.length === 2 && N.INTERVALS[parts[1]] && !/6$/.test(parts[0])) { s = parts[0]; bassIv = parts[1]; }
    const m = ROMAN_RE.exec(s);
    if (!m) return null;
    const acc = m[1] === 'b' || m[1] === '♭' ? -1 : m[1] === '#' || m[1] === '♯' ? 1 : 0;
    const numeral = m[2];
    const degree = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'].indexOf(numeral.toUpperCase()) + 1;
    const upper = numeral === numeral.toUpperCase();
    return { acc, degree, upper, suffix: m[3] || '', secondary, bassIv, text: str };
  }
  function suffixToQuality(suffix, upper) {
    const s = normalizeSuffix(suffix);
    if (s === '') return upper ? 'maj' : 'min';
    if (s === '7') return upper ? '7' : 'm7';
    if (s === '6') return upper ? '6' : 'm6';
    if (s === '9') return upper ? '9' : 'm9';
    if (s === '11') return upper ? '7sus4' : 'm11';
    if (s === '13') return upper ? '13' : 'm11';
    if (s === '°' || s === 'o' || s === 'dim') return 'dim';
    if (s === '°7' || s === 'o7' || s === 'dim7') return 'dim7';
    if (s === 'ø' || s === 'ø7' || s === 'm7b5') return 'm7b5';
    if (s === '+' || s === 'aug') return 'aug';
    if (s === '+7') return '7#5';
    if (s === 'add9') return upper ? 'add9' : 'madd9';
    if (s === '6/9' || s === '69') return upper ? '69' : 'm69';
    const q = findQuality(s);
    return q || (upper ? 'maj' : 'min');
  }
  /* 로마 숫자 → 코드. mode: 'major' | 'minor' (마이너에서는 III, VI, VII 를 자동으로 내림) */
  function romanToChord(roman, keyRoot, mode) {
    const p = parseRoman(roman); if (!p) return null;
    mode = mode || 'major';
    if (p.secondary) {
      const target = romanToChord(p.secondary, keyRoot, mode);
      const root = N.spell(target.root, '5');
      const qId = suffixToQuality(p.suffix || '7', true);
      const c = buildChord(root, qId);
      return Object.assign(c, { roman: p.text, fn: 'D', secondaryOf: target, degreeInfo: p });
    }
    let acc = p.acc;
    if (mode === 'minor' && acc === 0) {
      if (p.degree === 3 || p.degree === 6) acc = -1;
      if (p.degree === 7 && p.upper && !/°|ø|dim/.test(p.suffix)) acc = -1;
    }
    const ivName = (acc === -1 ? 'b' : acc === 1 ? '#' : '') + p.degree;
    const root = N.spell(keyRoot, N.INTERVALS[ivName] ? ivName : String(p.degree));
    const qId = suffixToQuality(p.suffix, p.upper);
    const bass = p.bassIv ? N.spell(root, p.bassIv) : null;
    const c = buildChord(root, qId, { bass });
    if (!c) return null;
    let fn;
    if (acc !== 0) fn = 'X';
    else fn = (mode === 'minor' ? FUNCTIONS_MINOR : FUNCTIONS_MAJOR)[p.degree - 1];
    if (p.degree === 5 && QMAP[qId].family === 'dominant') fn = 'D';
    if (p.degree === 7 && QMAP[qId].family === 'diminished') fn = 'D';
    if (acc === -1 && p.degree === 2 && QMAP[qId].family === 'dominant') fn = 'D'; /* 트라이톤 대체 */
    if (acc === -1 && p.degree === 7 && QMAP[qId].family === 'dominant') fn = 'S'; /* 백도어 */
    if (acc === 0 && QMAP[qId].family === 'dominant' && ![1, 4, 5].includes(p.degree)) fn = 'D'; /* 세컨더리 도미넌트 */
    return Object.assign(c, { roman: p.text, fn, degreeInfo: p });
  }
  function progressionChords(romans, keyRoot, mode) { return romans.map(r => romanToChord(r, keyRoot, mode)).filter(Boolean); }

  /* 코드가 어떤 다이어토닉 스케일 위에 있는지: pcs ⊆ scale */
  function fitsScale(chordPcs, scaleRootPc, scaleIntervals) {
    const s = new Set(scaleIntervals.map(iv => mod(scaleRootPc + N.ivSemi(iv), 12)));
    return chordPcs.every(p => s.has(p));
  }

  GH.chords = { QUALITIES, CATEGORY_KO, CATEGORY_ORDER, CATEGORY_DESC, LEVEL_KO, getQuality, findQuality, symbol, chordPcs, buildChord, parseSymbol, identify, identifyAll, diatonic, FN_KO, parseRoman, romanToChord, progressionChords, fitsScale, MAJOR_DEG };
})();
