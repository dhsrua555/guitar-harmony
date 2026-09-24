/* 연습 › 곡 분석 (목록 / 곡 / 마디 route 분리) */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, table } = GH.ui; const N = GH.notes;

  function findSong(id) { return GH.data.songs.find(s => s.id === id); }

  function songHref(A, id, bar) {
    return A.songHref ? A.songHref(id, bar) : '#/songs/' + encodeURIComponent(id) + (bar ? '/bar/' + encodeURIComponent(bar) : '');
  }

  function parseBars(song) {
    return song.bars.map(bar => {
      const symbols = bar.c.split(' ').filter(Boolean);
      const chords = symbols.map(symbol => {
        const parsed = GH.chords.parseSymbol(symbol);
        const chord = parsed ? GH.chords.buildChord(parsed.root, parsed.qId, { bass: parsed.bass }) : null;
        return chord ? Object.assign(chord, { beats: 4 / symbols.length, fn: bar.fn }) : null;
      }).filter(Boolean);
      return Object.assign({}, bar, { chords });
    });
  }

  function renderNotFound(el, message) {
    el.appendChild(GH.ui.empty(message));
    el.appendChild(h('p', null, h('a', { href: '#/songs' }, '곡 분석 목록으로')));
  }

  function renderList(el) {
    const A = GH.app;
    el.appendChild(h('h1', null, '곡 분석'));
    el.appendChild(h('p', { class: 'muted' }, '실제 곡과 세션에서 자주 만나는 폼을 마디별로 분석합니다. 곡을 열면 전체 코드 차트와 연습 순서를 보고, 각 마디에서 코드 퀄리티·코드–스케일·보이싱·릭을 따로 확인할 수 있습니다.'));
    const grid = h('div', { class: 'grid cols-3' });
    GH.data.songs.forEach(song => grid.appendChild(h('a', { class: 'card link', href: songHref(A, song.id), style: 'color:inherit' },
      h('div', { class: 'title' }, song.ko),
      h('div', { class: 'row', style: 'margin-top:6px' }, GH.ui.badge('키 ' + N.pretty(song.key)), GH.ui.badge(song.form), GH.ui.badge(song.tempo + ' BPM')),
      h('p', { class: 'muted', style: 'margin:.65rem 0 0' }, song.summary))));
    el.appendChild(grid);
  }

  function renderChart(A, song, bars) {
    const chart = h('div', { class: 'chart', style: 'margin:12px 0' });
    bars.forEach((bar, index) => chart.appendChild(h('a', {
      class: 'bar',
      href: songHref(A, song.id, index + 1),
      style: 'color:inherit;text-decoration:none'
    },
    h('div', { class: 'num' }, (index + 1) + '마디 · ' + bar.r),
    h('div', { class: 'ch ' + A.fnClass(bar.fn) }, bar.c),
    h('div', { class: 'sc' }, N.pretty(bar.scale[0]) + ' ' + GH.scales.get(bar.scale[1]).ko))));
    return chart;
  }

  function renderSong(el, params) {
    const A = GH.app;
    const song = findSong(params.id || (params.query && params.query.id));
    if (!song) { renderNotFound(el, '곡 분석 자료를 찾을 수 없습니다.'); return; }
    const bars = parseBars(song);
    const flat = bars.flatMap((bar, barIndex) => bar.chords.map(chord => Object.assign({}, chord, { bar: barIndex })));
    const chart = renderChart(A, song, bars);

    el.appendChild(h('div', { class: 'breadcrumb' }, h('a', { href: '#/songs' }, '곡 분석'), ' › ', song.ko));
    el.appendChild(h('h1', null, song.ko));
    el.appendChild(h('div', { class: 'row' }, GH.ui.badge('키 ' + N.pretty(song.key)), GH.ui.badge(song.form), GH.ui.badge(song.tempo + ' BPM')));
    el.appendChild(h('p', null, song.summary));
    el.appendChild(h('div', { class: 'toolbar' },
      h('a', { class: 'btn small primary', href: GH.router.href('/backing', { chords: song.bars.map(bar => bar.c).join(' | '), key: song.key, style: song.style, tempo: song.tempo }) }, '▶ 백킹 트랙으로 연습'),
      A.playBtn('▶ 전체 차트 재생', () => GH.player.playProgression(A.toPlayable(flat), { tempo: song.tempo, style: song.style, loop: true, onChord: i => { chart.querySelectorAll('.bar').forEach(bar => bar.classList.remove('current')); if (i >= 0 && flat[i]) { const active = chart.children[flat[i].bar]; if (active) active.classList.add('current'); } } }), 'primary'),
      A.stopBtn(), A.fnLegend()));
    el.appendChild(section('전체 코드 차트', h('p', { class: 'muted' }, '마디를 선택하면 코드, 코드–스케일, 기타 보이싱과 관련 릭을 별도 페이지에서 분석합니다.'), chart));
    el.appendChild(section('연습 방법',
      h('ol', null, song.practice.map(step => h('li', null, step))),
      h('div', { class: 'toc' }, song.progressions.map(id => { const progression = GH.data.progressions.find(item => item.id === id); return progression ? h('a', { href: A.progHref(id, song.key) }, progression.ko) : null; }))));
  }

  function renderBar(el, params) {
    const A = GH.app;
    const song = findSong(params.id || (params.query && params.query.id));
    if (!song) { renderNotFound(el, '곡 분석 자료를 찾을 수 없습니다.'); return; }
    const number = Number(params.bar != null ? params.bar : params.query && params.query.bar);
    const bars = parseBars(song);
    if (!Number.isInteger(number) || number < 1 || number > bars.length) {
      renderNotFound(el, '해당 마디를 찾을 수 없습니다.');
      return;
    }
    const index = number - 1;
    const bar = bars[index];
    const pref = A.pref(song.key);
    const previous = index > 0 ? number - 1 : null;
    const next = index < bars.length - 1 ? number + 1 : null;

    el.appendChild(h('div', { class: 'breadcrumb' },
      h('a', { href: '#/songs' }, '곡 분석'), ' › ',
      h('a', { href: songHref(A, song.id) }, song.ko), ' › ',
      number + '마디'));
    el.appendChild(h('h1', null, number + '마디 · ' + bar.c));
    el.appendChild(h('div', { class: 'row' }, GH.ui.badge(song.ko), GH.ui.badge('키 ' + N.pretty(song.key)), GH.ui.badge(song.tempo + ' BPM'), GH.ui.badge(bar.r), h('span', { class: A.fnClass(bar.fn) }, GH.chords.FN_KO[bar.fn] || '비다이어토닉')));
    el.appendChild(h('div', { class: 'row', style: 'justify-content:space-between;margin:14px 0' },
      previous ? h('a', { class: 'btn small', href: songHref(A, song.id, previous), 'aria-label': '이전 마디' }, '‹ ' + previous + '마디') : h('span', { class: 'muted' }, '첫 마디'),
      h('a', { class: 'btn small', href: songHref(A, song.id) }, '전체 차트'),
      next ? h('a', { class: 'btn small', href: songHref(A, song.id, next), 'aria-label': '다음 마디' }, next + '마디 ›') : h('span', { class: 'muted' }, '마지막 마디')));

    el.appendChild(section('코드 분석',
      h('div', { class: 'row', style: 'margin-bottom:8px' }, A.playBtn('▶ 이 마디 재생', () => GH.player.playProgression(A.toPlayable(bar.chords), { tempo: song.tempo, style: song.style }), 'primary'), A.stopBtn()),
      table(['코드', '근음', '코드 퀄리티', '하모닉 펑션', '코드 상세'], bar.chords.map(chord => [
        chord.symbol,
        N.pretty(chord.root),
        chord.quality.ko,
        h('span', { class: A.fnClass(bar.fn) }, GH.chords.FN_KO[bar.fn] || '비다이어토닉'),
        h('a', { class: 'btn small', href: A.chordHref(chord.root, chord.qId) }, chord.symbol + ' 코드 상세 →')
      ])),
      bar.tip ? h('p', null, bar.tip) : null));

    const scaleRoot = bar.scale[0], scaleId = bar.scale[1]; const scaleRootPc = N.pcOf(scaleRoot);
    const labelMap = GH.scales.labelMap(scaleRootPc, scaleId);
    const chordPcs = new Set(bar.chords.flatMap(chord => chord.pcs));
    const pcMap = {};
    Object.keys(labelMap).forEach(pc => { pcMap[pc] = { label: labelMap[pc], cls: chordPcs.has(Number(pc)) ? N.ivClass(labelMap[pc]) : 'iv-x' }; });
    el.appendChild(section('코드–스케일: ' + N.pretty(scaleRoot) + ' ' + GH.scales.get(scaleId).ko,
      h('p', { class: 'muted' }, '코드톤은 인터벌 컬러로, 나머지 스케일 톤은 중립색으로 표시합니다. ', h('a', { href: A.scaleHref(scaleId, scaleRoot) }, '기타 스케일 포지션 →')),
      GH.render.fretboard({ pcMap, pref, to: 22 }).el));

    const voicingGrid = h('div', { class: 'grid diagrams' });
    bar.chords.forEach(chord => {
      GH.voicings.forChord(chord.root, chord.qId, ['shell', 'jazz', 'drop2']).filter(voicing => voicing.baseFret <= 10).slice(0, 3).forEach(voicing => voicingGrid.appendChild(GH.render.chordCard(voicing, { pref, title: chord.symbol })));
    });
    el.appendChild(section('기타 보이싱', h('p', { class: 'muted' }, 'Shell, 텐션 보이싱과 Drop 2 중 10프렛 안에서 바로 적용하기 좋은 폼입니다.'), voicingGrid));

    const licks = (bar.licks || []).map(id => GH.data.licks.find(lick => lick.id === id)).filter(Boolean);
    if (licks.length) el.appendChild(section('관련 릭', h('div', { class: 'toc' }, licks.map(lick => h('a', { href: A.lickHref(lick.id) }, lick.ko + ' · 원 키 ' + N.pretty(lick.key))))));
  }

  GH.pages['/songs'] = {
    title: '곡 분석',
    render(el, params) {
      params = params || { query: {} };
      const query = params.query || {};
      /* 기존 #/songs?id=...&bar=... 링크와 직접 렌더 테스트 호환 */
      if (query.id && query.bar != null) return renderBar(el, Object.assign({}, params, { id: query.id, bar: query.bar }));
      if (query.id) return renderSong(el, Object.assign({}, params, { id: query.id }));
      renderList(el);
    }
  };

  GH.pages['/songs/:id'] = {
    title: '곡 분석',
    render: renderSong
  };

  GH.pages['/songs/:id/bar/:bar'] = {
    title: '마디 분석',
    render: renderBar
  };
})();
