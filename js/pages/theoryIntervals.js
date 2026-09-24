/* 화성학 › 음정 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, table, callout } = GH.ui; const N = GH.notes;

  function playable(root, d) {
    const rootPc = N.pcOf(root); const base = 52 + N.mod(rootPc - 4, 12);
    return { base, top: base + d.semi };
  }

  function commonTheory(el) {
    const A = GH.app;
    el.appendChild(section('복합음정 (Compound Interval)', h('p', null, '한 옥타브를 넘는 음정입니다. 단순음정에 7을 더해 2도는 9도, 4도는 11도, 6도는 13도로 부릅니다. 코드에서는 이들을 주로 텐션으로 사용합니다.'),
      table(['텐션', '단순음정', '이름', '쓰임'], GH.data.compoundIntervals.map(c => [h('span', { class: 'pill iv-t' }, c.iv), c.simple, c.ko, c.note]))));
    el.appendChild(section('음정의 전위', h('p', null, '아래 음을 한 옥타브 올리면 음정이 전위됩니다. 두 음정의 도수 합은 9, 반음 수의 합은 12입니다. 장↔단, 완전↔완전, 증↔감으로 바뀝니다.'),
      h('div', { class: 'row' }, [['b2', '7'], ['2', 'b7'], ['b3', '6'], ['3', 'b6'], ['4', '5'], ['#4', 'b5']].map(([a, b]) => h('span', { class: 'callout', style: 'margin:0' }, h('span', { class: 'pill ' + N.ivClass(a) }, a), ' ↔ ', h('span', { class: 'pill ' + N.ivClass(b) }, b))))));
    el.appendChild(callout(h('b', null, '협화음정과 불협화음정. '), '완전 1·5·8도는 완전협화, 3·6도는 불완전협화, 2·7도와 트라이톤은 불협화음정으로 분류합니다. V7→I의 핵심은 도미넌트 7th 코드의 가이드 톤이 토닉 코드로 반음 해결되는 보이스 리딩입니다.'));
    el.appendChild(h('div', { class: 'toc' }, h('a', { href: '#/ear?tab=interval' }, '이어 트레이닝으로 음정 익히기 →'), h('a', { href: '#/theory/chords' }, '코드 화성학으로 넘어가기 →')));
  }

  function renderList(el, params) {
    const A = GH.app; const qy = params.query || {}; const root = qy.root || A.key(); const rootPc = N.pcOf(root); const pref = A.pref(root);
    el.appendChild(h('h1', null, '음정 (Interval)'));
    el.appendChild(h('p', { class: 'muted' }, '음정은 두 음 사이의 높이 차이입니다. 코드와 스케일은 근음 또는 토닉으로부터의 음정과 도수로 설명할 수 있습니다.'));
    el.appendChild(h('div', { class: 'toolbar' }, h('label', null, '기준음', A.rootSelect(root, v => GH.router.go('/theory/intervals', { root: v }))), A.ivLegend()));
    const p0 = playable(root, GH.data.intervals[0]);
    const rows = GH.data.intervals.map(d => {
      const name = d.semi === 12 ? N.noteName(rootPc, pref) : N.spell(root, d.iv);
      return { onClick: () => GH.router.go('/theory/intervals/' + encodeURIComponent(d.iv), { root }), cells: [
        h('a', { href: A.intervalHref(d.iv, root), class: 'pill ' + N.ivClass(d.iv === '8' ? '1' : d.iv) }, d.iv),
        h('a', { href: A.intervalHref(d.iv, root) }, d.ko), d.en, d.semi, N.pretty(root) + ' → ' + N.pretty(name), d.feel, d.song,
        h('span', { class: 'row', style: 'gap:4px' }, A.playBtn('▶ 멜로딕', e => { e.stopPropagation(); GH.player.playNotes([p0.base, p0.base + d.semi], { tempo: 100 }); }), A.playBtn('▶ 하모닉', e => { e.stopPropagation(); GH.player.playChord([p0.base, p0.base + d.semi], { dur: 1.6 }); }))
      ] };
    });
    el.appendChild(section('음정표 · ' + N.pretty(root) + ' 기준', h('p', { class: 'muted' }, '음정을 선택하면 듣기와 지판 형태를 한 화면에서 볼 수 있습니다.'), table(['도수', '이름', '영문', '반음', '음 예시', '사운드', '레퍼런스 곡', '듣기'], rows)));
    commonTheory(el);
  }

  function renderDetail(el, params) {
    const A = GH.app; const qy = params.query || {}; const root = qy.root || A.key(); const pref = A.pref(root); const rootPc = N.pcOf(root);
    const iv = params.iv || qy.iv; const d = GH.data.intervals.find(x => x.iv === iv) || GH.data.intervals.find(x => x.iv === '5');
    const index = GH.data.intervals.indexOf(d); const notes = playable(root, d);
    const targetPc = N.mod(rootPc + d.semi, 12); const targetName = d.semi === 12 ? N.noteName(rootPc, pref) : N.spell(root, d.iv);
    const pcMap = {}; pcMap[rootPc] = { label: '1', cls: 'iv-1' }; if (targetPc !== rootPc) pcMap[targetPc] = { label: d.iv, cls: N.ivClass(d.iv) };
    el.appendChild(h('div', { class: 'breadcrumb' }, h('a', { href: '#/theory/intervals' }, '음정'), ' › ', d.ko));
    el.appendChild(h('h1', null, N.pretty(root) + ' – ' + N.pretty(targetName)));
    el.appendChild(h('p', { class: 'muted' }, d.ko + ' (' + d.en + ') · ' + d.semi + '반음 · 도수 ' + d.iv));
    el.appendChild(h('div', { class: 'toolbar' },
      h('label', null, '기준음', A.rootSelect(root, v => GH.router.go('/theory/intervals/' + encodeURIComponent(d.iv), { root: v }))),
      A.playBtn('▶ 멜로딕으로 듣기', () => GH.player.playNotes([notes.base, notes.top], { tempo: 100 }), 'primary'),
      A.playBtn('▶ 하모닉으로 듣기', () => GH.player.playChord([notes.base, notes.top], { dur: 1.8 })), A.stopBtn()));
    el.appendChild(h('div', { class: 'card' }, h('div', { class: 'row' }, h('span', { class: 'pill ' + N.ivClass(d.iv === '8' ? '1' : d.iv) }, d.iv), h('strong', null, d.ko), h('span', { class: 'muted' }, d.feel)), h('p', null, '레퍼런스 곡: ' + d.song)));
    el.appendChild(section('지판에서 찾기', h('p', { class: 'muted' }, '빨간 기준음에서 ' + d.ko + '까지의 거리입니다. 같은 현에서는 ' + d.semi + '프렛 차이이며, 줄을 바꾸면 튜닝에 맞춰 위치가 달라집니다.'), GH.render.fretboard({ pcMap, pref, to: 22 }).el));
    const prev = GH.data.intervals[(index - 1 + GH.data.intervals.length) % GH.data.intervals.length]; const next = GH.data.intervals[(index + 1) % GH.data.intervals.length];
    el.appendChild(h('div', { class: 'row', style: 'justify-content:space-between' }, h('a', { class: 'btn small', href: A.intervalHref(prev.iv, root) }, '← ' + prev.ko), h('a', { class: 'btn small', href: A.intervalHref(next.iv, root) }, next.ko + ' →')));
  }

  const listPage = { title: '음정', render(el, params) { if (params.query && params.query.iv) renderDetail(el, params); else renderList(el, params); } };
  GH.pages['/theory/intervals'] = listPage;
  GH.pages['/theory/intervals/:iv'] = { title: '음정 상세', render: renderDetail };
})();
