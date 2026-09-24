/* 홈: 간결한 시작 페이지 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h } = GH.ui; const N = GH.notes;

  GH.pages['/'] = {
    title: '홈',
    render(el) {
      const A = GH.app; const key = A.key();

      /* 히어로 + 큰 검색 */
      const input = h('input', { type: 'search', class: 'home-search-input', placeholder: '코드, 스케일, 진행을 검색 (예: Cmaj7, 도리안, ii-V-I)', autocomplete: 'off', spellcheck: 'false', 'aria-label': '검색' });
      const results = h('div', { class: 'search-results home-results', role: 'listbox', hidden: true });
      GH.search.bind(input, results);
      el.appendChild(h('section', { class: 'home-hero' },
        h('span', { class: 'eyebrow' }, 'GUITAR · HARMONY'),
        h('h1', null, '기타로 치고,', h('br'), h('span', null, '귀로 이해하는 화성학')),
        h('p', null, '코드 하나부터 진행, 스케일, 음감 훈련까지. 쉬운 것은 앞에, 어려운 것은 안쪽에 두었습니다.'),
        h('div', { class: 'home-search', role: 'search' }, h('span', { class: 'search-icon', 'aria-hidden': 'true' }), input, results)));

      /* 무엇을 하고 싶나요: 세 갈래 */
      let root = key, q = 'maj';
      const rootSel = A.rootSelect(root, v => { root = v; });
      const qSel = A.qualitySelect(q, v => { q = v; }, x => x.level <= 2);
      /* 맞춤 가이드 (처음 방문이면 설문 창) */
      if (GH.guide) {
        el.appendChild(GH.guide.homeCard());
        if (GH.guide.shouldOnboard() && document.getElementById('app') === el) setTimeout(() => { if (document.body.contains(el)) GH.guide.openOnboarding({ onDone: () => GH.router.rerender() }); }, 450);
      }
      el.appendChild(h('section', { class: 'home-paths' },
        h('a', { href: '#/learn', class: 'card link path-card path-learn' },
          h('span', { class: 'path-icon', 'aria-hidden': 'true' }, '1'), h('div', { class: 'title' }, '처음이라면, 배우기'), h('p', null, '음정 → 코드 → 스케일 → 진행 순서의 6단계 로드맵. 보고, 듣고, 쳐 보고, 퀴즈로 확인합니다.'), h('span', { class: 'feature-arrow', 'aria-hidden': 'true' }, '→')),
        h('div', { class: 'card path-card path-chord' },
          h('span', { class: 'path-icon', 'aria-hidden': 'true' }, '♪'), h('div', { class: 'title' }, '코드 하나 찾아보기'), h('p', null, '구성음, 잡는 법, 어울리는 스케일과 진행을 한 페이지에서.'),
          h('div', { class: 'quick-start-form' }, h('label', null, h('span', null, '루트'), rootSel), h('label', null, h('span', null, '타입'), qSel), h('button', { class: 'btn primary', type: 'button', onclick: () => { GH.router.go('/chord/' + encodeURIComponent(root) + '/' + q); } }, '코드 열기'))),
        h('a', { href: '#/practice', class: 'card link path-card path-practice' },
          h('span', { class: 'path-icon', 'aria-hidden': 'true' }, '◉'), h('div', { class: 'title' }, '귀와 손 연습하기'), h('p', null, '계이름 · 음정 · 코드 퀴즈로 음감을 기르고, 백킹 트랙 위에서 연주합니다.'), h('span', { class: 'feature-arrow', 'aria-hidden': 'true' }, '→'))));

      /* 더 깊이: 섹션별 링크 (간단 목록) */
      const secs = A.SECTIONS.filter(s => s.items.length);
      el.appendChild(h('section', { class: 'home-more' },
        h('div', { class: 'section-heading compact' }, h('h2', null, '더 깊이 들어가기'), h('p', null, '기초는 앞에, 심화는 뒤에 있습니다.')),
        h('div', { class: 'home-more-grid' }, secs.map(s => h('div', { class: 'home-more-col' },
          h('a', { class: 'home-more-head', href: '#' + s.path }, s.label, h('span', { class: 'muted' }, ' →')),
          h('ul', { class: 'plain home-more-list' }, s.items.map(([p, label, level]) => h('li', null, h('a', { href: '#' + p }, label), A.levelBadge(level)))))))));

      /* 현재 키 한 줄 */
      const dia = GH.chords.diatonic(key, 'ionian', false);
      el.appendChild(h('section', { class: 'home-key' },
        h('div', { class: 'row', style: 'justify-content:space-between' }, h('h2', null, N.pretty(key) + ' 메이저의 기본 코드'), h('span', { class: 'muted', style: 'font-size:.84rem' }, '상단 키를 바꾸면 사이트 전체가 따라옵니다')),
        A.chordStrip(dia.map(d => Object.assign(d.chord, { roman: d.roman, fn: d.fn })), { link: true })));
    }
  };
})();
