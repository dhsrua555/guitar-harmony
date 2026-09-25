/* 도구 › 용어집 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section } = GH.ui;
  const state = { q: '' };
  GH.pages['/glossary'] = {
    title: '용어집',
    render(el, params) {
      const qy = params.query || {};
      if (qy.q != null) state.q = qy.q;
      el.appendChild(h('h1', null, '용어집'));
      el.appendChild(h('p', { class: 'muted' }, '한글과 영어 용어를 함께 적었습니다. 각 항목에서 관련 페이지로 이동할 수 있습니다.'));
      const input = h('input', { type: 'search', placeholder: '용어 검색 (예: 트라이톤, voicing)', value: state.q, style: 'width:100%;max-width:420px', oninput: e => { state.q = e.target.value; renderList(); } });
      el.appendChild(h('div', { class: 'toolbar' }, input));
      const list = h('div', { class: 'list' });
      el.appendChild(list);
      function renderList() {
        GH.ui.clear(list);
        const q = state.q.trim().toLowerCase();
        const items = GH.data.glossary.filter(g => !q || g.ko.toLowerCase().includes(q) || g.en.toLowerCase().includes(q) || g.def.toLowerCase().includes(q));
        if (!items.length) { list.appendChild(GH.ui.empty('검색 결과가 없습니다.')); return; }
        items.forEach(g => list.appendChild(h('div', { class: 'list-item' }, h('div', { style: 'min-width:200px' }, h('div', { class: 'title' }, g.ko), h('div', { class: 'muted', style: 'font-size:.85rem' }, g.en)), h('div', { style: 'flex:1' }, h('div', null, g.def), g.route ? h('a', { href: g.route, style: 'font-size:.85rem' }, '관련 페이지 →') : null))));
      }
      renderList();
    }
  };
  GH.pages['/404'] = { title: '없는 페이지', render(el) { el.appendChild(GH.ui.empty('페이지를 찾을 수 없습니다.')); el.appendChild(h('p', null, h('a', { href: '#/' }, '홈으로'), ' · ', h('a', { href: '#/bug' }, '링크가 잘못됐다면 알려 주세요'))); } };
})();
