/* 도구 › 용어집 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, chips } = GH.ui;
  const state = { q: '', cat: 'all' };
  GH.pages['/glossary'] = {
    title: '용어집',
    render(el, params) {
      const qy = params.query || {};
      const cats = GH.data.glossaryCats || [];
      if (qy.q != null) state.q = qy.q;
      if (qy.cat && (qy.cat === 'all' || cats.some(c => c.id === qy.cat))) state.cat = qy.cat;
      el.appendChild(h('h1', null, '용어집'));
      el.appendChild(h('p', { class: 'muted' }, '한글과 영어 용어를 함께 적었습니다. 분야별로 묶어 두었고, 각 항목에서 관련 페이지로 이동할 수 있습니다.'));
      const input = h('input', { type: 'search', placeholder: '용어 검색 (예: 트라이톤, voicing)', value: state.q, style: 'width:100%;max-width:420px', 'aria-label': '용어 검색', oninput: e => { state.q = e.target.value; renderList(); } });
      const count = id => GH.data.glossary.filter(g => id === 'all' || g.cat === id).length;
      const catChips = chips({ options: [{ value: 'all', label: '전체 ' + count('all') }].concat(cats.map(c => ({ value: c.id, label: c.ko + ' ' + count(c.id) }))), value: state.cat, onChange: v => { state.cat = v; renderList(); } });
      catChips.classList.add('gloss-cats');
      el.appendChild(h('div', { class: 'toolbar', style: 'flex-direction:column;align-items:stretch;gap:10px' }, input, catChips));
      const list = h('div', { class: 'gloss-list' });
      el.appendChild(list);
      const item = g => h('div', { class: 'list-item' }, h('div', { style: 'min-width:200px' }, h('div', { class: 'title' }, g.ko), h('div', { class: 'muted', style: 'font-size:.85rem' }, g.en)), h('div', { style: 'flex:1' }, h('div', null, g.def), g.route ? h('a', { href: g.route, style: 'font-size:.85rem' }, '관련 페이지 →') : null));
      function renderList() {
        GH.ui.clear(list);
        const q = state.q.trim().toLowerCase();
        const items = GH.data.glossary.filter(g => (!q || g.ko.toLowerCase().includes(q) || g.en.toLowerCase().includes(q) || g.def.toLowerCase().includes(q)) && (state.cat === 'all' || g.cat === state.cat));
        if (!items.length) { list.appendChild(GH.ui.empty(state.cat === 'all' ? '검색 결과가 없습니다.' : '이 분류에는 맞는 용어가 없습니다. 분류를 "전체"로 바꿔 보세요.')); return; }
        cats.filter(c => state.cat === 'all' || c.id === state.cat).forEach(c => {
          const mine = items.filter(g => g.cat === c.id); if (!mine.length) return;
          list.appendChild(h('section', { class: 'gloss-group', id: 'gloss-' + c.id }, h('h2', { class: 'gloss-head' }, c.ko, h('span', { class: 'muted' }, ' ' + mine.length)), h('div', { class: 'list' }, mine.map(item))));
        });
      }
      renderList();
    }
  };
  GH.pages['/404'] = { title: '없는 페이지', render(el) { el.appendChild(GH.ui.empty('페이지를 찾을 수 없습니다.')); el.appendChild(h('p', null, h('a', { href: '#/' }, '홈으로'), ' · ', h('a', { href: '#/bug' }, '링크가 잘못됐다면 알려 주세요'))); } };
})();
