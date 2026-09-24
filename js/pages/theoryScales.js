/* 화성학 › 스케일 (개요 / 상세 route 분리) */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, table, kv, select, tabs } = GH.ui; const N = GH.notes;
  const state = { compareA: 'ionian', compareB: 'dorian', circleMode: 'major' };
  const OVERVIEW_TABS = ['list', 'circle', 'chordscale', 'compare'];
  const DEG_NAMES = ['으뜸음 (Tonic)', '위으뜸음 (Supertonic)', '가온음 (Mediant)', '버금딸림음 (Subdominant)', '딸림음 (Dominant)', '버금가온음 (Submediant)', '이끎음 / 아래으뜸음 (Leading Tone / Subtonic)'];

  const detailPath = id => '/theory/scales/' + encodeURIComponent(id);

  function routeRoot(query) {
    return query.root && N.pcOf(query.root) != null ? N.normalize(query.root) : GH.app.key();
  }

  function renderOverview(el, params) {
    const A = GH.app; const qy = params.query || {};
    const root = routeRoot(qy); const pref = A.pref(root); const rootPc = N.pcOf(root);
    const tab = OVERVIEW_TABS.includes(qy.tab) ? qy.tab : 'list';
    if (qy.scale && GH.scales.get(qy.scale)) state.compareA = qy.scale;
    if (qy.compare && GH.scales.get(qy.compare)) state.compareB = qy.compare;

    el.appendChild(h('h1', null, '스케일'));
    el.appendChild(h('p', { class: 'muted' }, '스케일의 전체 목록과 5도권, 코드–스케일 매칭, 평행 스케일 비교를 모았습니다. 목록에서 스케일을 선택하면 구조와 하모나이즈 결과를 개별 상세 페이지에서 볼 수 있습니다.'));
    el.appendChild(tabs([
      { id: 'list', label: '전체 목록' },
      { id: 'circle', label: '5도권 · 조표' },
      { id: 'chordscale', label: '코드–스케일 표' },
      { id: 'compare', label: '스케일 비교' }
    ], tab, id => GH.router.go('/theory/scales', {
      root,
      scale: id === 'compare' ? state.compareA : null,
      compare: id === 'compare' ? state.compareB : null,
      tab: id
    })));
    const body = h('div'); el.appendChild(body);
    if (tab === 'circle') renderCircle(body, root, pref);
    else if (tab === 'chordscale') renderChordScale(body, root);
    else if (tab === 'compare') renderCompare(body, root, pref, rootPc, state.compareA, state.compareB);
    else renderList(body, root);
  }

  function renderDetail(el, params) {
    const A = GH.app; const qy = params.query || {};
    const scaleId = params.id || qy.scale;
    const sc = GH.scales.get(scaleId);
    if (!sc) {
      el.appendChild(GH.ui.empty('스케일을 찾을 수 없습니다.'));
      el.appendChild(h('p', null, h('a', { href: '#/theory/scales' }, '스케일 목록으로')));
      return;
    }
    const root = routeRoot(qy); const pref = A.pref(root); const rootPc = N.pcOf(root);
    const notes = GH.scales.notes(root, sc.id);
    const formula = GH.scales.formula(sc.id);
    const parent = GH.scales.get(sc.parent);

    el.appendChild(h('div', { class: 'breadcrumb' }, h('a', { href: '#/theory/scales' }, '스케일'), ' › ', sc.ko));
    el.appendChild(h('h1', null, N.pretty(root) + ' ' + sc.ko));
    el.appendChild(h('p', { class: 'muted' }, sc.en));
    el.appendChild(h('div', { class: 'toolbar' },
      h('label', null, '으뜸음', A.rootSelect(root, value => GH.router.go(detailPath(sc.id), { root: value }))),
      h('label', null, '스케일', A.scaleSelect(sc.id, value => GH.router.go(detailPath(value), { root }))),
      A.playBtn('▶ 스케일 듣기', () => { const base = 48 + rootPc; const midi = sc.intervals.map(iv => base + N.ivSemi(iv)).concat([base + 12]); GH.player.playNotes(midi.concat(midi.slice(0, -1).reverse()), { tempo: 150 }); }, 'primary'),
      h('a', { class: 'btn small', href: A.scaleHref(sc.id, root) }, '기타 포지션 →')));

    el.appendChild(h('div', { class: 'card' },
      h('p', null, sc.desc),
      h('div', { class: 'row', style: 'margin:6px 0' }, GH.ui.pills(notes.map(note => ({ label: N.pretty(note.name), cls: note.cls }))), GH.ui.pills(notes.map(note => ({ label: note.label, cls: note.cls })))),
      h('div', { class: 'row', style: 'margin:6px 0;font-family:var(--mono)' }, notes.map((note, index) => [h('span', { class: 'pill ' + note.cls }, N.pretty(note.name)), h('span', { class: 'muted' }, formula[index])]).flat()),
      kv([
        ['인터벌 공식', (sc.labels || sc.intervals).join(' – ')],
        ['온음·반음 공식', formula.join(' – ') + ' · W=온음 / H=반음'],
        ['음 개수', sc.intervals.length],
        ['특징음', sc.characteristic.length ? sc.characteristic.join(', ') : '–'],
        ['어보이드 노트 (코드에 따라)', sc.avoid.length ? sc.avoid.join(', ') : '–'],
        ['주요 용도', sc.usage],
        ['모체 스케일', parent ? parent.ko + (sc.modeIndex > 1 ? ' · ' + sc.modeIndex + '번째 모드' : '') : '–']
      ])));

    if (sc.intervals.length === 7) el.appendChild(section('스케일 디그리', table(['도수', '기능명', '음', '역할'], notes.map((note, index) => [
      note.label,
      DEG_NAMES[index],
      N.pretty(note.name),
      index === 0 ? '으뜸음과 조성의 중심' : index === 4 ? '으뜸음의 완전5도 위 · 딸림 기능' : index === 6 ? (N.ivSemi(note.iv) === 11 ? '으뜸음으로 반음 해결하는 이끎음' : '으뜸음의 온음 아래인 아래으뜸음') : index === 3 ? '으뜸음의 완전5도 아래 · 버금딸림 기능' : ''
    ]))));

    const base = 48 + rootPc; const midis = sc.intervals.map(iv => base + N.ivSemi(iv)).concat([base + 12]);
    const staff = GH.render.scaleStaff(midis, { pref, names: notes.map(note => note.name).concat([notes[0].name]) });
    const on = {}; notes.forEach(note => { on[note.pc] = { label: note.label, cls: note.cls }; });
    el.appendChild(section('오선 · 건반 · 기타 지판',
      staff ? h('div', null, h('h3', null, '오선'), staff) : null,
      h('h3', null, '피아노 건반'), GH.render.piano({ from: 48, to: 76, on }),
      h('h3', null, '기타 지판'), GH.render.fretboard({ pcMap: on, pref, to: 22 }).el,
      h('div', { style: 'margin-top:6px' }, A.ivLegend())));

    if (sc.intervals.length === 7) {
      const triads = GH.scales.harmonize(root, sc.id, false), sevenths = GH.scales.harmonize(root, sc.id, true);
      el.appendChild(section('다이어토닉 하모나이즈', h('p', { class: 'muted' }, '각 스케일 디그리 위에 모체 스케일의 음만 사용해 3도씩 쌓은 코드입니다.'),
        table(['도수', '트라이어드', '7th 코드', '하모닉 펑션'], triads.map((triad, index) => [triad.iv, triad.chord ? h('a', { href: A.chordHref(triad.root, triad.qId) }, triad.chord.symbol) : '–', sevenths[index].chord ? h('a', { href: A.chordHref(sevenths[index].root, sevenths[index].qId) }, sevenths[index].chord.symbol) : '–', h('span', { class: A.fnClass(triad.fn) }, GH.chords.FN_KO[triad.fn])])),
        A.playBtn('▶ 7th 코드 순차 재생', () => GH.player.playProgression(A.toPlayable(sevenths.filter(item => item.chord).map(item => Object.assign(item.chord, { beats: 2 }))), { tempo: 100, style: 'ballad' }))));
    }

    const qualities = sc.chords.map(id => GH.chords.getQuality(id)).filter(Boolean);
    el.appendChild(section('코드–스케일 후보', h('p', { class: 'muted' }, '아래 코드 퀄리티에서 이 스케일을 솔로와 멜로디의 음 재료로 사용할 수 있습니다.'), h('div', { class: 'toc' }, qualities.map(quality => h('a', { href: A.chordHref(root, quality.id) }, GH.chords.symbol(root, quality.id) + ' · ' + quality.ko)))));

    const modes = GH.scales.modesOf(sc.parent);
    if (modes.length > 1) el.appendChild(section('같은 모체 스케일의 모드',
      h('div', { class: 'toc' }, modes.map(mode => h('a', { href: A.theoryScaleHref(mode.id, root), style: mode.id === sc.id ? 'color:var(--accent);border-color:var(--accent)' : '' }, mode.modeIndex + '. ' + mode.ko))),
      h('a', { href: A.modeHref(sc.id, root) }, '모드 비교 페이지 →')));
  }

  function renderCircle(el, root, pref) {
    const A = GH.app;
    const minor = state.circleMode === 'minor';
    el.appendChild(h('div', { class: 'toolbar' }, h('label', null, select({ options: [{ value: 'major', label: '메이저 키' }, { value: 'minor', label: '마이너 키' }], value: state.circleMode, onChange: value => { state.circleMode = value; GH.router.rerender(); } })), h('span', { class: 'muted' }, '원을 선택하면 기준 키가 바뀝니다.')));
    el.appendChild(h('div', { class: 'split' },
      h('div', null, GH.render.circle({ key: root, mode: state.circleMode, pref, onSelect: (selectedRoot, mode) => { state.circleMode = mode; GH.router.go('/theory/scales', { root: selectedRoot, tab: 'circle' }); if (N.pcOf(A.key()) !== N.pcOf(selectedRoot)) GH.state.set({ key: selectedRoot }); } })),
      h('div', null, h('h3', null, N.pretty(root) + (minor ? ' 마이너' : ' 메이저')),
        kv([['조표', GH.scales.keySignature(root, minor).text], ['관계조 (나란한조)', minor ? N.pretty(GH.scales.relativeMajor(root)) + ' 메이저' : N.pretty(GH.scales.relativeMinor(root)) + ' 마이너'], ['동주조 (같은 으뜸음)', N.pretty(root) + (minor ? ' 메이저' : ' 마이너')], ['완전5도 위 · 도미넌트 방향', N.pretty(N.spell(root, '5'))], ['완전5도 아래 · 서브도미넌트 방향', N.pretty(N.spell(root, '4'))]]),
        h('p', null, '시계 방향으로 갈수록 샵이 하나씩 늘고, 반시계 방향으로 갈수록 플랫이 늘어납니다. 이웃한 키는 음 하나만 달라 자연스럽게 전조할 수 있습니다.'),
        h('p', null, 'iii–vi–ii–V–I처럼 완전5도 하행으로 움직이는 진행은 강한 기능 진행을 만듭니다.'),
        h('h3', null, '다이어토닉 7th 코드'), A.chordStrip(GH.chords.diatonic(root, minor ? 'aeolian' : 'ionian', true).map(item => Object.assign(item.chord, { roman: item.roman, fn: item.fn })), { link: true }))));
  }

  function renderChordScale(el, root) {
    const A = GH.app;
    el.appendChild(section('코드–스케일 매칭', h('p', null, '코드톤을 모두 포함하는 스케일이 코드–스케일 후보입니다. 1차 선택은 가장 보편적인 사운드이고, 대안 후보는 텐션과 컬러를 바꿀 때 사용합니다.'),
      table(['코드 퀄리티', '1차 선택', '대안 후보'], GH.chords.QUALITIES.filter(quality => quality.id !== '5').map(quality => {
        const fits = GH.scales.forChord(quality.id); const primary = fits.filter(item => item.primary), alternatives = fits.filter(item => !item.primary);
        return [
          h('a', { href: A.chordHref(root, quality.id) }, GH.chords.symbol(root, quality.id) + ' · ' + quality.ko),
          h('span', null, primary.map(item => h('a', { href: A.theoryScaleHref(item.scale.id, root), style: 'font-weight:700;margin-right:8px' }, item.scale.ko))),
          h('span', { class: 'muted' }, alternatives.slice(0, 5).map(item => h('a', { href: A.theoryScaleHref(item.scale.id, root), style: 'margin-right:8px' }, item.scale.ko)))
        ];
      }))));
  }

  function renderCompare(el, root, pref, rootPc, aId, bId) {
    const A = GH.app;
    const a = GH.scales.get(aId) || GH.scales.get('ionian'), b = GH.scales.get(bId) || GH.scales.get('dorian');
    state.compareA = a.id; state.compareB = b.id;
    el.appendChild(h('div', { class: 'toolbar' },
      h('label', null, 'A', A.scaleSelect(a.id, value => GH.router.go('/theory/scales', { root, scale: value, compare: b.id, tab: 'compare' }))),
      h('label', null, 'B', A.scaleSelect(b.id, value => GH.router.go('/theory/scales', { root, scale: a.id, compare: value, tab: 'compare' }))),
      h('label', null, '으뜸음', A.rootSelect(root, value => GH.router.go('/theory/scales', { root: value, scale: a.id, compare: b.id, tab: 'compare' })))));
    const comparison = GH.scales.compare(a.id, b.id);
    const notesA = GH.scales.notes(root, a.id), notesB = GH.scales.notes(root, b.id);
    const line = (name, notes, only) => h('div', { class: 'row', style: 'margin:6px 0' }, h('b', { style: 'min-width:180px' }, name), GH.ui.pills(notes.map(note => ({ label: N.pretty(note.name) + ' (' + note.label + ')', cls: only.includes(N.mod(note.pc - rootPc, 12)) ? 'iv-1' : 'iv-s' }))));
    el.appendChild(section('같은 으뜸음에서 평행 비교', line(a.ko, notesA, comparison.onlyA), line(b.ko, notesB, comparison.onlyB), h('p', { class: 'muted' }, '강조색은 한쪽에만 있는 음입니다. 공통음은 ' + comparison.common.length + '개입니다.')));
    const pcMap = {};
    notesA.forEach(note => { pcMap[note.pc] = { label: note.label, cls: comparison.onlyA.includes(N.mod(note.pc - rootPc, 12)) ? 'iv-1' : 'iv-s' }; });
    notesB.forEach(note => { if (!pcMap[note.pc]) pcMap[note.pc] = { label: note.label, cls: 'iv-3', ghost: true }; });
    el.appendChild(section('기타 지판 오버레이', h('p', { class: 'muted' }, '중립색은 공통음, 강조색은 A에만 있는 음, 테두리 음은 B에만 있는 음입니다.'), GH.render.fretboard({ pcMap, pref, to: 22 }).el));
    el.appendChild(section('A/B 청음 비교', h('div', { class: 'row' }, A.playBtn('▶ ' + a.ko, () => { const base = 48 + rootPc; GH.player.playNotes(a.intervals.map(iv => base + N.ivSemi(iv)).concat([base + 12]), { tempo: 150 }); }), A.playBtn('▶ ' + b.ko, () => { const base = 48 + rootPc; GH.player.playNotes(b.intervals.map(iv => base + N.ivSemi(iv)).concat([base + 12]), { tempo: 150 }); }), h('a', { class: 'btn small', href: A.theoryScaleHref(a.id, root) }, 'A 상세'), h('a', { class: 'btn small', href: A.theoryScaleHref(b.id, root) }, 'B 상세'))));
  }

  function renderList(el, root) {
    const A = GH.app; const groups = GH.scales.byCategory();
    GH.scales.CATEGORY_ORDER.forEach(category => {
      el.appendChild(section(GH.scales.CATEGORY_KO[category], table(['스케일', '인터벌', 'W/H 공식', '주요 코드', '용도'], groups[category].map(scale => [
        h('a', { href: A.theoryScaleHref(scale.id, root) }, scale.ko),
        h('span', null, (scale.labels || scale.intervals).map(iv => h('span', { class: 'pill ' + N.ivClass(iv) }, iv))),
        GH.scales.formula(scale.id).join('-'),
        scale.chords.slice(0, 4).join(', '),
        scale.usage
      ]))));
    });
  }

  GH.pages['/theory/scales'] = {
    title: '스케일',
    staff: true,
    render(el, params) {
      params = params || { query: {} };
      const query = params.query || {};
      /* 기존 #/theory/scales?scale=... 링크와 직접 렌더 테스트 호환 */
      if (query.scale && (!query.tab || query.tab === 'explorer')) return renderDetail(el, Object.assign({}, params, { id: query.scale }));
      renderOverview(el, params);
    }
  };

  GH.pages['/theory/scales/:id'] = {
    title: '스케일',
    staff: true,
    render: renderDetail
  };
})();
