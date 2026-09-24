/* 배우기 로드맵 + 섹션 허브 (기타 / 화성학 / 연습) */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section } = GH.ui;

  const STEPS = [
    { n: 1, level: 1, title: '음과 음정: 소리의 거리 재기', what: '기타 지판에서 음을 찾고, 두 음 사이의 거리(음정)를 귀와 눈으로 익힙니다.',
      todo: ['지판을 눌러 소리를 들으며 같은 음이 어디에 또 있는지 찾아보세요.', '완전5도(스타워즈), 장3도(나비야)처럼 노래로 인터벌을 기억하세요.'],
      links: [['#/theory/intervals', '음정 이론'], ['#/tools/finder', '지판 눌러 보기'], ['#/ear?tab=interval', '음정 퀴즈']] },
    { n: 2, level: 1, title: '코드: 음을 쌓아 화음 만들기', what: '메이저 · 마이너 3화음에서 7화음까지, 코드가 어떻게 만들어지는지 보고 듣습니다.',
      todo: ['코드 빌더에서 C, Am, F, G 를 차례로 듣고 밝음/어두움을 비교하세요.', '오픈 코드 폼으로 같은 코드를 기타에서 잡아 보세요.'],
      links: [['#/theory/chords', '코드 빌더'], ['#/guitar/voicings/basic?types=open,caged', '기본 코드 폼'], ['#/ear?tab=chord', '코드 퀄리티 퀴즈']] },
    { n: 3, level: 1, title: '키와 스케일: 어떤 음을 쓸까', what: '메이저 스케일과 펜타토닉으로 키 안의 음을 익히고, 계이름(도레미)으로 듣는 상대음감을 시작합니다.',
      todo: ['마이너 펜타토닉 박스 1을 외우고 연습 패턴을 따라 치세요.', '계이름 퀴즈로 스케일 안에서 음의 위치를 듣는 연습을 하세요.'],
      links: [['#/guitar/scales?scale=minor_pent', '펜타토닉 박스'], ['#/theory/scales', '스케일 이론'], ['#/ear?tab=degree', '계이름 퀴즈']] },
    { n: 4, level: 2, title: '코드 진행: 코드가 움직이는 이유', what: '토닉 · 프리도미넌트 · 도미넌트 기능과 장르별 필수 진행을 익히고, 백킹 트랙 위에서 연주합니다.',
      todo: ['I – V – vi – IV 와 ii – V – I 을 듣고 토닉으로 해결되는 느낌을 비교해 보세요.', '백킹 트랙을 틀고 코드톤만으로 솔로해 보세요.'],
      links: [['#/theory/progressions', '코드 진행'], ['#/backing', '백킹 트랙'], ['#/ear?tab=root', '근음 진행 퀴즈'], ['#/ear?tab=prog', '진행 맞히기']] },
    { n: 5, level: 2, title: '곡으로 연결하기', what: '실제 곡 형태의 진행을 마디별로 분석하고, 릭을 배워 진행 위에 얹습니다. 멜로디에 코드를 붙여 보기도 합니다.',
      todo: ['곡 분석에서 마디를 하나씩 눌러 스케일과 보이싱을 확인하세요.', '멜로디 → 코드 도구에 좋아하는 멜로디를 넣어 반주를 만들어 보세요.'],
      links: [['#/songs', '곡 분석'], ['#/guitar/licks', '릭'], ['#/tools/melody', '멜로디 → 코드']] },
    { n: 6, level: 3, title: '심화: 모드, 리하모니제이션, 재즈 보이싱', what: '같은 음으로 다른 색을 내는 모드, 코드를 바꾸는 리하모니제이션, 드롭 2 보이싱과 보이스 리딩까지.',
      todo: ['도리안과 에올리안을 같은 루트에서 번갈아 듣고 특징음을 찾으세요.', 'ii – V – I 을 드롭 2 보이싱으로 한 현 세트 안에서 연결해 보세요.'],
      links: [['#/theory/modes', '모드'], ['#/theory/reharm', '리하모니제이션'], ['#/guitar/voicings/advanced?q=7&types=drop2', '드롭 2 보이싱'], ['#/ear?tab=mode', '모드 퀴즈']] }
  ];

  GH.pages['/learn'] = {
    title: '배우기',
    render(el) {
      const A = GH.app;
      el.appendChild(h('div', { class: 'page-head' }, h('span', { class: 'eyebrow' }, 'ROADMAP'), h('h1', null, '배우기: 처음부터 차근차근'), h('p', { class: 'muted' }, '위에서 아래로 따라가면 됩니다. 각 단계는 "보기 → 듣기 → 기타로 쳐 보기 → 퀴즈"로 이어집니다. 어려운 내용은 6단계에 모아 두었으니 처음엔 건너뛰어도 좋습니다.')));
      if (GH.guide) el.appendChild(GH.guide.planSection());
      const list = h('ol', { class: 'roadmap' });
      STEPS.forEach(s => list.appendChild(h('li', { class: 'step lv' + s.level },
        h('div', { class: 'step-num', 'aria-hidden': 'true' }, s.n),
        h('div', { class: 'step-body' },
          h('div', { class: 'row', style: 'gap:8px' }, h('h2', null, s.title), A.levelBadge(s.level)),
          h('p', null, s.what),
          h('ul', { class: 'plain step-todo' }, s.todo.map(t => h('li', null, t))),
          h('div', { class: 'toc' }, s.links.map(([href, label]) => h('a', { href }, label)))))));
      el.appendChild(list);
      el.appendChild(GH.ui.callout(h('b', null, '막히면 검색. '), '상단 검색창(단축키 /)에 Cmaj7, 도리안, ii-V-I 처럼 궁금한 것을 바로 적으세요. 모르는 말은 ', h('a', { href: '#/glossary' }, '용어집'), '에 있습니다.'));
    }
  };

  function hub(id, extra) {
    return {
      title: { guitar: '기타', theory: '화성학', practice: '연습' }[id],
      render(el) {
        const A = GH.app; const sec = A.SECTIONS.find(x => x.id === id);
        el.appendChild(h('div', { class: 'page-head' }, h('span', { class: 'eyebrow' }, sec.id.toUpperCase()), h('h1', null, sec.label), h('p', { class: 'muted' }, sec.desc)));
        const basic = sec.items.filter(it => it[2] === 1), more = sec.items.filter(it => it[2] > 1);
        const card = ([p, label, level, desc]) => h('a', { href: '#' + p, class: 'card link hub-card' }, h('div', { class: 'row', style: 'justify-content:space-between;align-items:flex-start' }, h('div', { class: 'title' }, label), A.levelBadge(level)), h('p', null, desc), h('span', { class: 'feature-arrow', 'aria-hidden': 'true' }, '→'));
        el.appendChild(section('기초부터', h('div', { class: 'grid cols-3' }, basic.map(card))));
        if (more.length) el.appendChild(section('더 깊이', h('div', { class: 'grid cols-3' }, more.map(card))));
        if (extra) extra(el);
      }
    };
  }
  GH.pages['/guitar'] = hub('guitar', el => {
    const A = GH.app; const key = A.key();
    el.appendChild(section('바로 가기', h('div', { class: 'toc' },
      h('a', { href: A.voicingsHref(key, 'maj', 'basic') }, GH.notes.pretty(key) + ' 기본 코드 폼'), h('a', { href: A.scaleHref('minor_pent', key) }, GH.notes.pretty(key) + ' 마이너 펜타토닉'), h('a', { href: A.scaleHref('ionian', key) }, GH.notes.pretty(key) + ' 메이저 스케일'), h('a', { href: '#/guitar/licks?genre=blues' }, '블루스 릭'), h('a', { href: A.voicingsHref(key, '7', 'advanced') + '&types=drop2' }, '도미넌트 7th 드롭 2'))));
  });
  GH.pages['/theory'] = hub('theory', el => {
    const A = GH.app; const key = A.key(); const N = GH.notes;
    const dia = GH.chords.diatonic(key, 'ionian', true);
    el.appendChild(section(N.pretty(key) + ' 메이저의 다이어토닉 코드', h('p', { class: 'muted' }, '상단의 키를 바꾸면 사이트 전체의 예제가 함께 바뀝니다. 코드를 누르면 그 코드의 허브로 갑니다.'), A.chordStrip(dia.map(d => Object.assign(d.chord, { roman: d.roman, fn: d.fn })), { link: true }), h('div', { style: 'margin-top:8px' }, A.fnLegend())));
    el.appendChild(section('자주 찾는 주제', h('div', { class: 'toc' }, [['#/theory/progressions/ii-V-I', 'ii–V–I'], ['#/theory/progressions/blues12', '12마디 블루스'], ['#/theory/modes/dorian', '도리안'], ['#/theory/reharm/tritone_sub', '트라이톤 대체'], ['#/theory/scales?tab=circle', '5도권'], ['#/theory/chords?tab=tension', '텐션 규칙']].map(([href, t]) => h('a', { href }, t)))));
  });
  GH.pages['/practice'] = hub('practice', el => {
    el.appendChild(section('오늘의 10분 루틴', h('ol', { class: 'plain' }, ['계이름 퀴즈 10문제 (스케일 기준 듣기)', '음정 퀴즈 10문제 (상행)', '백킹 트랙 ii – V – I을 90 BPM으로 틀고 코드톤 솔로 2분', '근음 진행 퀴즈 5문제'].map(t => h('li', null, t))), h('div', { class: 'toc' }, h('a', { href: '#/ear?tab=degree' }, '계이름 퀴즈'), h('a', { href: '#/ear?tab=interval' }, '음정 퀴즈'), h('a', { href: '#/backing?id=ii-V-I' }, 'ii – V – I 백킹 트랙'), h('a', { href: '#/ear?tab=root' }, '근음 퀴즈'))));
  });
})();
