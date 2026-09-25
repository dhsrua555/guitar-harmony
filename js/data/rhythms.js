/* 리듬 패턴 (4/4 한 마디) 과 기타 스트럼 패턴
   p: 음표 기호를 공백으로 구분. 2 이분, 4 사분, 8 팔분, 16 십육분, 4. / 8. 점음표, 8t 셋잇단 팔분(세 개가 한 박), 뒤에 r 이 붙으면 쉼표 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  GH.data = GH.data || {};
  GH.data.rhythmLevels = { 1: '4분 · 8분음표', 2: '쉼표 · 점음표', 3: '16분음표', 4: '싱코페이션 (당김음)', 5: '셋잇단음표' };
  GH.data.rhythms = [
    { id: 'r1a', level: 1, p: '4 4 4 4' },
    { id: 'r1b', level: 1, p: '4 8 8 4 4' },
    { id: 'r1c', level: 1, p: '8 8 8 8 4 4' },
    { id: 'r1d', level: 1, p: '4 4 8 8 4' },
    { id: 'r1e', level: 1, p: '2 4 4' },
    { id: 'r1f', level: 1, p: '8 8 4 8 8 4' },
    { id: 'r1g', level: 1, p: '4 8 8 8 8 4' },
    { id: 'r2a', level: 2, p: '4 4r 4 4' },
    { id: 'r2b', level: 2, p: '4. 8 4 4' },
    { id: 'r2c', level: 2, p: '4 8r 8 4 4' },
    { id: 'r2d', level: 2, p: '8r 8 8r 8 4 4' },
    { id: 'r2e', level: 2, p: '4. 8 4. 8' },
    { id: 'r2f', level: 2, p: '2 8 8 4' },
    { id: 'r2g', level: 2, p: '4r 8 8 4 4r' },
    { id: 'r3a', level: 3, p: '16 16 16 16 4 4 4' },
    { id: 'r3b', level: 3, p: '8 16 16 4 8 16 16 4' },
    { id: 'r3c', level: 3, p: '16 16 8 4 16 16 8 4' },
    { id: 'r3d', level: 3, p: '8. 16 8. 16 4 4' },
    { id: 'r3e', level: 3, p: '4 16 16 16 16 4 8 8' },
    { id: 'r3f', level: 3, p: '16 8 16 4 16 8 16 4' },
    { id: 'r4a', level: 4, p: '8 4 8 4 4' },
    { id: 'r4b', level: 4, p: '4 8 4 8 4' },
    { id: 'r4c', level: 4, p: '8r 4 4 4 8' },
    { id: 'r4d', level: 4, p: '8 4 4 8 4' },
    { id: 'r4e', level: 4, p: '8r 8 8r 8 8r 8 8r 8' },
    { id: 'r4f', level: 4, p: '4 8 8r 8 4 8' },
    { id: 'r5a', level: 5, p: '8t 8t 8t 4 8t 8t 8t 4' },
    { id: 'r5b', level: 5, p: '4 8t 8t 8t 4 4' },
    { id: 'r5c', level: 5, p: '8t 8t 8t 8t 8t 8t 4 4' },
    { id: 'r5d', level: 5, p: '4 4 8t 8t 8t 8t 8t 8t' },
    { id: 'r5e', level: 5, p: '8t 8tr 8t 8t 8tr 8t 4 4' }
  ];
  /* 스트럼: D 다운, U 업, x 뮤트(칩), - 쉼. grid = 한 마디 칸 수 (8: 8분, 12: 셋잇단, 16: 16분) */
  GH.data.strums = [
    { id: 'down4', ko: '4분 다운 (첫걸음)', grid: 8, p: 'D - D - D - D -', tempo: 80, desc: '박마다 다운 한 번. 손목은 8분음표로 계속 위아래로 움직이되 업은 줄을 치지 않습니다. 모든 스트럼의 기본 동작입니다.' },
    { id: 'eighths', ko: '8분 다운-업', grid: 8, p: 'D U D U D U D U', tempo: 80, desc: '다운은 박 위, 업은 박 사이(앤드). 업은 위쪽 줄 서너 개만 가볍게.' },
    { id: 'pop', ko: '팝 기본 (D - D U - U D U)', grid: 8, p: 'D - D U - U D U', tempo: 90, desc: '가장 많이 쓰는 어쿠스틱 팝 패턴. 3박 앞의 비어 있는 다운이 싱코페이션을 만듭니다. 손은 멈추지 말고 허공을 지나가세요.' },
    { id: 'rock8', ko: '록 8비트 다운', grid: 8, p: 'D D D D D D D D', tempo: 110, desc: '8분음표를 모두 다운으로. 파워 코드와 함께 쓰면 록의 밀어붙이는 느낌이 납니다. 2·4박을 조금 세게.' },
    { id: 'ballad', ko: '발라드 (D - - U - U D -)', grid: 8, p: 'D - - U - U D -', tempo: 72, desc: '여백이 많은 패턴. 첫 다운을 길게 울리고 뒤는 가볍게 채웁니다.' },
    { id: 'reggae', ko: '레게 스캥크 (업비트 칩)', grid: 8, p: '- x - x - x - x', tempo: 76, desc: '박 사이(앤드)마다 짧게 끊는 칩. 왼손 힘을 살짝 풀어 소리를 바로 죽입니다.' },
    { id: 'shuffle', ko: '셔플 (셋잇단 스윙)', grid: 12, p: 'D - U D - U D - U D - U', tempo: 96, desc: '박을 셋으로 나눠 첫째와 셋째만 칩니다. 블루스와 셔플 록의 출렁이는 리듬.' },
    { id: 'funk16', ko: '펑크 16비트 (칩 섞기)', grid: 16, p: 'D - U - x - U D - U x - U - D U', tempo: 92, desc: '손은 16분음표로 쉬지 않고, 칩(x)으로 2·4박 백비트를 만듭니다. 짧고 날카롭게.' },
    { id: 'bossa', ko: '보사노바 느낌 (D - U - D U - U)', grid: 8, p: 'D - U - D U - U', tempo: 100, desc: '베이스는 1·3박, 위쪽 줄은 싱코페이션으로. 부드럽게 쓸듯이.' },

    { id: 'worship', ko: '워십 스트로크 (D - D - D U D U)', grid: 8, p: 'D - D - D U D U', tempo: 76, desc: '찬양팀 어쿠스틱 기타의 기본. 1 · 2박은 크게 두 번 내려치고 3 · 4박은 D U D U 로 채워 후렴을 밀어 줍니다. 벌스에서는 1박만 치고 길게 울려도 좋아요.' }

  ];
})();
