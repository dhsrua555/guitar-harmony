/* 화성학 › 코드 진행 (목록 / 상세 route 분리) */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, table, kv, select, chips } = GH.ui; const N = GH.notes;
  const state = { activeId: null, tempo: null, style: null, loop: true, metronome: false, vlKind: 'drop2', vlSet: '5-4-3-2' };

  const detailPath = id => '/theory/progressions/' + encodeURIComponent(id);
  const findProgression = id => GH.data.progressions.find(p => p.id === id);
  const validGenre = genre => genre === 'all' || Object.prototype.hasOwnProperty.call(GH.data.genres, genre);

  function routeKey(query) {
    return query.key && N.pcOf(query.key) != null ? N.normalize(query.key) : GH.app.key();
  }

  function renderList(el, params) {
    const qy = params.query || {};
    const key = routeKey(qy);
    const genre = qy.genre && validGenre(qy.genre) ? qy.genre : 'all';
    el.appendChild(h('h1', null, '코드 진행'));
    el.appendChild(h('p', { class: 'muted' }, '장르와 상황에 맞는 진행을 고르세요. 상세 페이지에서 코드 차트, 하모닉 펑션, 그루브, 보이스 리딩과 코드–스케일 옵션을 한 화면에 볼 수 있습니다.'));
    el.appendChild(h('div', { style: 'margin:10px 0' }, chips({
      options: [{ value: 'all', label: '전체' }].concat(Object.entries(GH.data.genres).map(([k, v]) => ({ value: k, label: v }))),
      value: genre,
      onChange: v => GH.router.go('/theory/progressions', { genre: v === 'all' ? null : v, key: qy.key || null })
    })));
    const list = GH.data.progressions.filter(p => genre === 'all' || p.genres.includes(genre));
    const grid = h('div', { class: 'grid cols-4' });
    list.forEach(p => grid.appendChild(h('a', {
      class: 'card link',
      href: GH.router.href(detailPath(p.id), { key, genre: genre === 'all' ? null : genre }),
      style: 'color:inherit'
    },
    h('div', { class: 'title' }, p.ko),
    h('div', { class: 'muted', style: 'font-size:.85rem' }, p.en),
    h('div', { style: 'margin-top:6px' }, GH.ui.difficulty(p.level), p.genres.slice(0, 3).map(g => GH.ui.badge(GH.data.genres[g]))))));
    el.appendChild(grid);
  }

  function renderFoundation(el) {
    const A = GH.app;
    el.appendChild(A.deep('기초 이론: 하모닉 펑션 · 케이던스 · 로마 숫자 · 전조',
      h('div', { class: 'split' },
        h('div', null, h('h3', null, '세 가지 하모닉 펑션'), h('ul', { class: 'plain' },
          h('li', null, h('b', { class: 'fn-T' }, '토닉 (T)'), ': I, iii, vi. 안정과 종지의 중심.'),
          h('li', null, h('b', { class: 'fn-S' }, '서브도미넌트 (S)'), ': IV, ii. 토닉에서 벗어나 도미넌트를 준비.'),
          h('li', null, h('b', { class: 'fn-D' }, '도미넌트 (D)'), ': V, vii°. 트라이톤의 긴장이 토닉으로 해결.')),
        h('div', { class: 'fn-cycle' }, h('span', { class: 'node', style: 'background:var(--iv-5)' }, 'T'), '→', h('span', { class: 'node', style: 'background:var(--iv-3)' }, 'S'), '→', h('span', { class: 'node', style: 'background:var(--iv-1)' }, 'D'), '→', h('span', { class: 'node', style: 'background:var(--iv-5)' }, 'T'))),
        h('div', null, h('h3', null, '케이던스 (Cadence)'), table(['이름', '진행', '사운드'], [['정격 종지', 'V → I', '가장 강한 해결'], ['변격 종지', 'IV → I', '부드러운 해결'], ['반종지', '… → V', '도미넌트에서 열린 채 끝남'], ['위종지', 'V → vi', '예상한 토닉을 피하는 해결']]))),
      h('h3', null, '로마 숫자와 내슈빌 넘버'),
      h('p', null, '로마 숫자는 대문자를 메이저, 소문자를 마이너로 적습니다. °는 디미니시드, ø는 하프 디미니시드, +는 어그멘티드입니다. V7/ii처럼 슬래시 뒤에 로마 숫자가 오면 일시적으로 토닉화되는 목표를, I/3·C/E처럼 도수나 음이름이 오면 베이스음을 뜻합니다. 내슈빌 넘버는 같은 관계를 1, 4, 5, 6m처럼 적어 세션에서 즉시 트랜스포즈할 때 씁니다.'),
      h('h3', null, '전조 (Modulation)'),
      h('p', null, '피벗 코드 전조는 두 키의 공통 코드를 연결점으로 쓰고, 다이렉트 모듈레이션은 새 키의 V7 또는 I로 바로 이동합니다. 공통음 전조는 멜로디의 한 음을 유지한 채 아래 화성을 새 키로 바꿉니다.')));
  }

  function renderDetail(el, params) {
    const A = GH.app; const qy = params.query || {};
    const id = params.id || qy.id;
    const P = findProgression(id);
    if (!P) {
      el.appendChild(GH.ui.empty('코드 진행을 찾을 수 없습니다.'));
      el.appendChild(h('p', null, h('a', { href: '#/theory/progressions' }, '코드 진행 목록으로')));
      return;
    }
    if (state.activeId !== P.id) { state.activeId = P.id; state.tempo = null; state.style = null; }
    const key = routeKey(qy); const pref = A.pref(key);
    const backQuery = { genre: qy.genre && validGenre(qy.genre) && qy.genre !== 'all' ? qy.genre : null, key: qy.key || null };
    el.appendChild(h('div', { class: 'breadcrumb' }, h('a', { href: GH.router.href('/theory/progressions', backQuery) }, '코드 진행'), ' › ', P.ko));
    el.appendChild(h('h1', null, P.ko));
    el.appendChild(h('p', { class: 'muted' }, P.en));

    const chords = A.progressionChords(P, key);
    const tempo = state.tempo || P.tempo || 110, style = state.style || P.style || 'pop';
    const strip = A.chordStrip(chords, { link: true });
    el.appendChild(h('div', { class: 'row', style: 'margin-bottom:8px' }, GH.ui.difficulty(P.level), P.genres.map(g => GH.ui.badge(GH.data.genres[g], 'accent')), GH.ui.badge('무드: ' + P.mood), P.symbols ? GH.ui.badge('오리지널 키 ' + N.pretty(P.key) + ' · 현재 ' + N.pretty(key)) : GH.ui.badge((P.mode === 'minor' ? N.pretty(key) + ' 마이너' : N.pretty(key) + ' 메이저') + ' 기준')));
    el.appendChild(h('p', null, P.desc));

    const voiceSets = state.vlKind === 'drop3' ? ['6-4-3-2', '5-3-2-1'] : ['6-5-4-3', '5-4-3-2', '4-3-2-1'];
    if (!voiceSets.includes(state.vlSet)) state.vlSet = voiceSets[0];
    const seq = GH.voicings.voiceLead(chords, { kind: state.vlKind, strSet: state.vlSet });
    const chart = h('div', { class: 'chart' });
    let barIdx = 0, beatsInBar = 0; let barEl = null; const cellsByChord = [];
    chords.forEach((c, i) => {
      if (beatsInBar === 0) { barEl = h('div', { class: 'bar' }, h('div', { class: 'num' }, (barIdx + 1) + '마디')); chart.appendChild(barEl); }
      const cell = h('span', { class: 'ch', style: 'margin-right:8px' }, c.symbol); barEl.appendChild(cell); cellsByChord.push(barEl);
      beatsInBar += c.beats; if (beatsInBar >= 4) { beatsInBar = 0; barIdx++; }
    });
    const tb = h('div', { class: 'toolbar' },
      A.playBtn('▶ 재생', () => GH.player.playProgression(A.toPlayable(chords, seq), { tempo: state.tempo || P.tempo || 110, style: state.style || P.style || 'pop', loop: state.loop, metronome: state.metronome, onChord: i => { strip.setCurrent(i); chart.querySelectorAll('.bar').forEach(b => b.classList.remove('current')); if (i >= 0 && cellsByChord[i]) cellsByChord[i].classList.add('current'); } }), 'primary'),
      A.stopBtn(),
      h('label', null, '템포', GH.ui.rangeNumber({ value: tempo, min: 40, max: 280, suffix: 'BPM', label: '템포', onInput: v => { state.tempo = v; } })),
      h('label', null, '스타일 / 그루브', select({ options: [['pop', 'Pop'], ['rock', 'Rock'], ['ballad', 'Ballad'], ['soul', 'Neo Soul'], ['swing', 'Swing'], ['shuffle', 'Shuffle'], ['bossa', 'Bossa Nova'], ['funk', 'Funk'], ['gospel', 'Gospel']].map(([v, l]) => ({ value: v, label: l })), value: style, onChange: v => { state.style = v; } })),
      h('label', null, h('input', { type: 'checkbox', checked: state.loop, onchange: e => { state.loop = e.target.checked; } }), '루프'),
      h('label', null, h('input', { type: 'checkbox', checked: state.metronome, onchange: e => { state.metronome = e.target.checked; } }), '클릭'),
      h('label', null, '키', A.rootSelect(key, v => { GH.state.set({ key: v }); GH.router.go(detailPath(P.id), { key: v, genre: backQuery.genre }); })),
      h('a', { class: 'btn small', href: A.backingHref(P.id, key) }, '백킹 트랙 →'));
    el.appendChild(tb);
    el.appendChild(strip);
    el.appendChild(h('div', { style: 'margin:8px 0' }, A.fnLegend()));
    el.appendChild(h('h2', null, '코드 차트'));
    el.appendChild(chart);
    el.appendChild(h('h2', null, '하모닉 펑션'));
    el.appendChild(h('div', { class: 'fn-cycle' }, chords.map((c, i) => [h('span', { class: 'node', style: 'background:var(--iv-' + (c.fn === 'T' ? '5' : c.fn === 'S' ? '3' : c.fn === 'D' ? '1' : 't') + ')' }, (c.fn || 'X') + ' ' + c.symbol), i < chords.length - 1 ? h('span', null, '→') : null]).flat()));

    const deepV = h('div');
    deepV.appendChild(h('div', { class: 'toolbar' }, h('label', null, '보이싱 타입', select({ options: [{ value: 'drop2', label: '드롭 2' }, { value: 'drop3', label: '드롭 3' }, { value: 'shell', label: '셸·가이드 톤' }], value: state.vlKind, onChange: v => { state.vlKind = v; const nextSets = v === 'drop3' ? ['6-4-3-2', '5-3-2-1'] : ['6-5-4-3', '5-4-3-2', '4-3-2-1']; if (!nextSets.includes(state.vlSet)) state.vlSet = nextSets[0]; GH.router.rerender(); } })), h('label', null, '현 세트', select({ options: voiceSets, value: state.vlSet, onChange: v => { state.vlSet = v; GH.router.rerender(); } })), h('a', { class: 'btn small', href: A.voicingsHref(chords[0].root, chords[0].qId, 'advanced') }, '첫 코드 확장 보이싱 →')));
    const vg = h('div', { class: 'grid diagrams' });
    const shown = new Set();
    seq.forEach((v, i) => { if (!v) return; const k = chords[i].symbol + v.id; if (shown.has(k)) return; shown.add(k); vg.appendChild(GH.render.chordCard(v, { pref, title: chords[i].symbol, sub: v.name })); });
    deepV.appendChild(vg);
    el.appendChild(A.deep('보이스 리딩 보이싱', deepV));

    const deepS = h('div');
    deepS.appendChild(table(['코드', '펑션', '1차 옵션', '대안 옵션'], chords.filter((c, i, a) => a.findIndex(x => x.symbol === c.symbol) === i).map(c => { const fits = GH.scales.forChord(c.qId); const prim = fits.filter(f => f.primary).slice(0, 2), rest = fits.filter(f => !f.primary).slice(0, 3); return [h('a', { href: A.chordHref(c.root, c.qId) }, c.symbol), h('span', { class: A.fnClass(c.fn) }, GH.chords.FN_KO[c.fn] || ''), h('span', null, prim.map(f => h('a', { href: A.scaleHref(f.scale.id, c.root), style: 'margin-right:8px;font-weight:700' }, N.pretty(c.root) + ' ' + f.scale.ko))), h('span', { class: 'muted' }, rest.map(f => f.scale.ko).join(', '))]; })));
    if (P.scales && P.scales.length) deepS.appendChild(h('p', { class: 'muted' }, '자주 쓰는 옵션: ', P.scales.map(s => {
      const owner = chords.find(c => GH.scales.forChord(c.qId).some(f => f.scale.id === s));
      const scaleRoot = owner ? owner.root : key;
      return h('a', { href: A.scaleHref(s, scaleRoot), style: 'margin-right:8px' }, N.pretty(scaleRoot) + ' ' + GH.scales.get(s).ko);
    })));
    el.appendChild(A.deep('코드–스케일 옵션', deepS));

    el.appendChild(kv([['레퍼런스 곡', h('ul', { class: 'plain' }, (P.songs || []).map(s => h('li', null, s)))], ['바리에이션', h('ul', { class: 'plain' }, (P.variations || []).map(s => h('li', null, s)))]]));
    const licks = GH.data.licks.filter(l => (l.progressionIds || []).includes(P.id));
    if (licks.length) el.appendChild(h('div', null, h('h2', null, '관련 릭'), h('div', { class: 'toc' }, licks.map(l => h('a', { href: A.lickHref(l.id) }, l.ko)))));
    const reharms = GH.data.reharm.filter(r => r.example && r.example.before && JSON.stringify(r.example.before).includes(P.chords && typeof P.chords[0] === 'string' ? P.chords[0] : '§'));
    if (reharms.length) el.appendChild(h('div', null, h('h2', null, '리하모니제이션 아이디어'), h('div', { class: 'toc' }, reharms.map(r => h('a', { href: A.reharmHref(r.id) }, r.ko)))));
    renderFoundation(el);
  }

  GH.pages['/theory/progressions'] = {
    title: '코드 진행',
    render(el, params) {
      params = params || { query: {} };
      const qy = params.query || {};
      /* 기존 #/theory/progressions?id=... 링크와 직접 렌더 테스트 호환 */
      if (qy.id) return renderDetail(el, Object.assign({}, params, { id: qy.id }));
      renderList(el, params);
    }
  };

  GH.pages['/theory/progressions/:id'] = {
    title: '코드 진행',
    render: renderDetail
  };
})();
