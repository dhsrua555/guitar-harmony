/* 앱 부트스트랩: 내비게이션, 뒤로가기, 설정 패널, 검색, 공용 헬퍼 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, clear, select, legend } = GH.ui; const N = GH.notes;

  /* 메뉴 구조: 섹션(허브) → 페이지. level: 1 기초, 2 중급, 3 고급 */
  const SECTIONS = [
    { id: 'learn', label: '배우기', en: 'LEARN', icon: 'learn', color: 'pink', path: '/learn', desc: '처음이라면 여기서부터. 레슨 한 장에 개념 하나씩 배우는 기초 코스와 로드맵.', items: [] },
    { id: 'guitar', label: '기타', en: 'GUITAR', icon: 'guitar', color: 'sun', path: '/guitar', desc: '지판 위에서 코드, 스케일, 릭을 찾습니다.', items: [
      ['/guitar/voicings', '코드 보이싱', 2, '기본 코드 폼과 재즈·확장 보이싱을 나눠서 탐색'],
      ['/guitar/scales', '스케일 포지션', 2, '펜타토닉 박스, CAGED, 3NPS 포지션과 연습 패턴'],
      ['/guitar/triads', '트라이어드 · 아르페지오', 3, '현 세트별 트라이어드 인버전과 코드톤 아르페지오'],
      ['/guitar/doublestops', '더블스탑', 4, '3도·6도·옥타브를 두 줄로 함께 치는 패턴'],
      ['/guitar/phrasing', '솔로 프레이즈 만들기', 4, '코드톤, 어프로치, 인클로저, 패싱 노트로 라인 만들기'],
      ['/guitar/licks', '릭', 3, 'TAB, 오선, 느린 재생, 도수 분석이 달린 프레이즈']] },
    { id: 'theory', label: '화성학', en: 'THEORY', icon: 'piano', color: 'sky', path: '/theory', desc: '코드와 스케일이 왜 그렇게 들리는지 이해합니다.', items: [
      ['/theory/intervals', '인터벌', 1, '두 음 사이의 거리. 모든 이론의 출발점'],
      ['/theory/chords', '코드', 2, '코드 빌더, 코드 퀄리티, 다이어토닉 코드, 표기법'],
      ['/theory/scales', '스케일', 2, '스케일 구조, 5도권, 코드 스케일, 하모나이제이션'],
      ['/theory/progressions', '코드 진행', 3, '장르별 필수 진행을 듣고 기능을 분석'],
      ['/theory/modes', '모드', 5, '7모드의 밝기와 특징음, 멜로딕/하모닉 마이너 모드'],
      ['/theory/reharm', '리하모니제이션', 5, '멜로디는 두고 코드를 바꾸는 기법']] },
    { id: 'practice', label: '연습', en: 'PRACTICE', icon: 'headphones', color: 'olive', path: '/practice', desc: '귀와 손을 훈련하는 도구.', items: [
      ['/ear', '이어 트레이닝', 1, '계이름, 인터벌, 코드, 진행을 듣고 맞히는 퀴즈'],
      ['/backing', '백킹 트랙', 2, '드럼 · 베이스 · 컴핑 위에서 솔로 연습'],
      ['/rhythm', '리듬 연습', 1, '메트로놈, 리듬 따라 치기, 스트럼 패턴'],
      ['/tools/finder', '코드 파인더', 1, '지판을 눌러 잡은 모양의 코드 이름 찾기'],
      ['/tools/melody', '멜로디 → 코드', 3, '멜로디를 넣으면 어울리는 코드를 제안'],
      ['/tools/harmony', '멜로디 화음 쌓기', 4, '멜로디 위아래에 3도·5도·6도 하모니 라인을 쌓아 듣기'],
      ['/songs', '곡 분석', 4, '마디별 코드에 스케일, 보이싱, 릭을 연결'],
      ['/glossary', '용어집', 1, '한글 · 영어 음악 용어 사전']] }
  ];
  function sectionOf(path) {
    if (path === '/learn' || path.startsWith('/learn/')) return 'learn';
    if (path.startsWith('/guitar')) return 'guitar';
    if (path.startsWith('/theory') || path.startsWith('/chord/')) return 'theory';
    if (/^\/(songs|tools|ear|glossary|backing|practice|rhythm)/.test(path)) return 'practice';
    return null;
  }
  function parentOf(path) {
    const parents = [
      '/theory/progressions', '/theory/reharm', '/theory/intervals', '/theory/modes', '/theory/scales',
      '/guitar/voicings', '/guitar/licks', '/songs', '/learn'
    ].filter(p => path.startsWith(p + '/')).sort((a, b) => b.length - a.length);
    if (parents.length) {
      if (/^\/songs\/[^/]+\/bar\//.test(path)) return path.split('/').slice(0, 3).join('/');
      return parents[0];
    }
    const sec = SECTIONS.find(s => s.id === sectionOf(path));
    if (!sec || sec.path === path) return '/';
    return sec.path;
  }
  function renderNav(route) {
    const main = document.getElementById('mainnav'); clear(main);
    const sec = route ? sectionOf(route.path) : null;
    SECTIONS.forEach(s => main.appendChild(h('a', { href: '#' + s.path, class: sec === s.id ? 'active' : '', 'aria-current': sec === s.id ? 'page' : null }, GH.icon(s.icon), h('span', null, s.label))));
    const sub = document.getElementById('subnav'); clear(sub);
    const S = SECTIONS.find(s => s.id === sec);
    if (S && S.items.length) {
      sub.appendChild(h('a', { href: '#' + S.path, class: 'hub' + (route.path === S.path ? ' active' : ''), 'aria-current': route.path === S.path ? 'page' : null }, S.label + ' 홈'));
      S.items.forEach(([p, label, level]) => { const active = route && (route.path === p || route.path.startsWith(p + '/')); sub.appendChild(h('a', { href: '#' + p, class: (active ? 'active' : '') + ' lv' + level, 'aria-current': active ? 'page' : null, title: LEVEL_KO[level] }, label)); });
    }
    const back = document.getElementById('back-btn');
    if (back) back.hidden = !route || route.path === '/';
    document.body.classList.toggle('is-home', !route || route.path === '/');
    document.body.classList.toggle('is-hub', !!route && SECTIONS.some(s => s.path === route.path));
    document.body.dataset.section = sec || '';
    renderHangTab();
    if (menuOpen) closeMenu(false);
    document.body.classList.remove('tools-open');
    const tb = document.getElementById('tools-btn'); if (tb) tb.setAttribute('aria-expanded', 'false');
  }
  /* 오늘의 연습: 맞춤 가이드의 다음 미션 */
  function todayHref() { const G = GH.guide; const n = G && G.next(); return n ? G.missionHref(n) : '#/practice'; }
  function renderHangTab() {
    const a = document.getElementById('hang-tab'); if (!a) return;
    const n = GH.guide && GH.guide.next();
    a.href = todayHref(); a.title = n ? '다음 미션: ' + n.title : '연습 도구 모음';
  }

  /* ---- 모바일 전체 화면 메뉴 ---- */
  let menuOpen = false, menuTimer = null;
  function renderMenu() {
    const panel = document.getElementById('menu-panel'); clear(panel);
    const route = GH.router.current(); const sec = route ? sectionOf(route.path) : null;
    const inner = h('div', { class: 'menu-inner' });
    SECTIONS.forEach((s, i) => inner.appendChild(h('div', { class: 'menu-sec' + (sec === s.id ? ' active' : ''), style: '--i:' + i },
      h('a', { class: 'menu-big', href: '#' + s.path }, h('span', { class: 'menu-ic menu-' + s.color }, GH.icon(s.icon)), h('span', { class: 'menu-label' }, s.label), h('span', { class: 'menu-en', 'aria-hidden': 'true' }, s.en)),
      s.items.length ? h('div', { class: 'menu-items' }, s.items.map(([p, label]) => h('a', { href: '#' + p, class: route && (route.path === p || route.path.startsWith(p + '/')) ? 'active' : '' }, label))) : null)));
    const cur = GH.state.get().key; const pref = GH.state.pref(cur);
    const keySel = h('select', { 'aria-label': '전체 키', onchange: e => GH.state.set({ key: e.target.value }) }, N.rootList(pref).map(r => h('option', { value: r, selected: r === cur || N.pcOf(r) === N.pcOf(cur) }, N.pretty(r))));
    inner.appendChild(h('div', { class: 'menu-foot', style: '--i:' + SECTIONS.length },
      h('a', { class: 'btn primary', href: todayHref() }, GH.icon('metronome'), '오늘의 연습'),
      h('label', { class: 'keysel' }, h('span', null, '키'), keySel),
      h('button', { class: 'btn', type: 'button', onclick: () => { closeMenu(false); openSettings(); } }, GH.icon('settings'), '설정')));
    panel.appendChild(inner);
  }
  function setMenuBtn(open) {
    const b = document.getElementById('menu-btn'); if (!b) return;
    b.setAttribute('aria-expanded', open ? 'true' : 'false'); b.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    const l = b.querySelector('.menu-label'); if (l) l.textContent = open ? 'CLOSE' : 'MENU';
  }
  function openMenu() {
    const panel = document.getElementById('menu-panel'); if (!panel) return;
    if (menuTimer) { clearTimeout(menuTimer); menuTimer = null; }
    renderMenu(); panel.hidden = false; void panel.offsetWidth;
    panel.classList.add('open'); document.body.classList.add('menu-open'); menuOpen = true; setMenuBtn(true);
    const first = panel.querySelector('a'); if (first) first.focus({ preventScroll: true });
  }
  function closeMenu(focusBack) {
    const panel = document.getElementById('menu-panel'); if (!panel || !menuOpen) return;
    panel.classList.remove('open'); document.body.classList.remove('menu-open'); menuOpen = false; setMenuBtn(false);
    menuTimer = setTimeout(() => { panel.hidden = true; menuTimer = null; }, 420);
    if (focusBack !== false) { const b = document.getElementById('menu-btn'); if (b) b.focus({ preventScroll: true }); }
  }

  /* ---- 스크롤 등장 · 시차 (움직임 줄이기 설정이면 끔) ---- */
  const reduceMotion = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  let revealIO = null, hideIO = null, pxEls = [], pxRaf = 0;
  /* 섹션 안의 카드 · 목록은 하나씩 차례로 (촤라락) */
  const RV_ITEMS = '.grid > *, .path-grid > *, .home-more-grid > *, .hub-grid > *, .roadmap > li, .course-chapters > *, .mission-list > li, .prog-strip > *, .list > *';
  /* 화면에 들어오면 나타나고, 완전히 벗어나면 다시 숨겨 둔다 → 위아래로 몇 번을 오가도 매번 움직인다.
     같은 페이지를 다시 그릴 때(건반 누르기 등)는 지금 보이는 것은 움직이지 않고 바로 보인다 */
  function revealScan(instant) {
    const els = document.querySelectorAll('#app .reveal:not([data-rv])');
    if (!revealIO) { els.forEach(e => e.classList.add('in')); return; }
    const vh = innerHeight; const quick = [];
    els.forEach(e => {
      e.setAttribute('data-rv', '1');
      e.querySelectorAll(RV_ITEMS).forEach((c, i) => { c.classList.add('rv-item'); c.style.setProperty('--ri', Math.min(i, 9)); });
      if (instant) { const r = e.getBoundingClientRect(); if (r.bottom > 0 && r.top < vh) { e.classList.add('in', 'rv-instant'); quick.push(e); } }
      revealIO.observe(e); hideIO.observe(e);
    });
    if (quick.length) requestAnimationFrame(() => requestAnimationFrame(() => quick.forEach(e => e.classList.remove('rv-instant'))));
  }
  function onScroll() {
    document.body.classList.toggle('scrolled', window.scrollY > 8);
    if (!pxEls.length || pxRaf) return;
    pxRaf = requestAnimationFrame(() => { pxRaf = 0; const y = window.scrollY; pxEls.forEach(e => { e.style.transform = 'translateY(' + (y * Number(e.dataset.speed)).toFixed(1) + 'px)'; }); });
  }
  function motionScan(route) { revealScan(!!(route && route.samePage)); pxEls = reduceMotion() ? [] : Array.from(document.querySelectorAll('#app [data-speed]')); onScroll(); }
  /* 난이도는 셈여림 기호 다섯 단계 (ui.js 의 LEVELS): p 입문 · mp 기초 · mf 중급 · f 중상급 · ff 고급 */
  const LEVEL_KO = {}; Object.keys(GH.ui.LEVELS).forEach(k => { LEVEL_KO[k] = GH.ui.LEVELS[k].dyn + ' ' + GH.ui.LEVELS[k].ko; });

  /* ---- 공용 헬퍼 ---- */
  const app = {
    SECTIONS, LEVEL_KO, sectionOf, parentOf,
    levelBadge(level) { return GH.ui.level(level); },
    key() { return GH.state.get().key; },
    pref(root) { return GH.state.pref(root); },
    chordHref(root, qId) { return '#/chord/' + encodeURIComponent(root) + '/' + qId; },
    chordLink(root, qId, text) { return h('a', { href: app.chordHref(root, qId) }, text || GH.chords.symbol(root, qId)); },
    scaleHref(id, root) { return '#/guitar/scales?scale=' + id + (root ? '&root=' + encodeURIComponent(root) : ''); },
    theoryScaleHref(id, root) { return GH.router.href('/theory/scales/' + encodeURIComponent(id), root ? { root } : null); },
    modeHref(id, root) {
      return GH.router.href('/theory/modes/' + encodeURIComponent(id), root ? { root } : null);
    },
    progHref(id, key) { return GH.router.href('/theory/progressions/' + encodeURIComponent(id), key ? { key } : null); },
    backingHref(id, key) { return GH.router.href('/backing', { id, key }); },
    lickHref(id, to) { return GH.router.href('/guitar/licks/' + id, { to }); },
    reharmHref(id) { return '#/theory/reharm/' + encodeURIComponent(id); },
    songHref(id, bar) { return '#/songs/' + encodeURIComponent(id) + (bar ? '/bar/' + encodeURIComponent(bar) : ''); },
    intervalHref(iv, root) { return GH.router.href('/theory/intervals/' + encodeURIComponent(iv), root ? { root } : null); },
    voicingsHref(root, qId, level) { return GH.router.href('/guitar/voicings/' + (level === 'advanced' ? 'advanced' : 'basic'), { root, q: qId }); },
    rootSelect(value, onChange) {
      const pref = GH.state.pref(value);
      const opts = N.rootList(pref).map(r => ({ value: r, label: N.pretty(r) }));
      if (value && !opts.some(o => o.value === value)) opts.push({ value, label: N.pretty(value) });
      return select({ options: opts, value, onChange });
    },
    /* 코드 타입 선택: 구성별 그룹 */
    qualitySelect(value, onChange, filter) {
      const el = h('select', { onchange: e => onChange(e.target.value) });
      const C = GH.chords;
      C.CATEGORY_ORDER.forEach(cat => {
        const list = C.QUALITIES.filter(q => q.category === cat && (!filter || filter(q))); if (!list.length) return;
        const og = h('optgroup', { label: C.CATEGORY_KO[cat] });
        list.forEach(q => { const o = h('option', { value: q.id }, (q.sym || 'maj') + '  ' + q.ko); if (q.id === value) o.selected = true; og.appendChild(o); });
        el.appendChild(og);
      });
      return el;
    },
    scaleSelect(value, onChange, filter) {
      const el = h('select', { onchange: e => onChange(e.target.value) });
      const groups = GH.scales.byCategory();
      GH.scales.CATEGORY_ORDER.forEach(c => {
        const list = groups[c].filter(s => !filter || filter(s)); if (!list.length) return;
        const og = h('optgroup', { label: GH.scales.CATEGORY_KO[c] });
        list.forEach(s => { const o = h('option', { value: s.id }, s.ko); if (s.id === value) o.selected = true; og.appendChild(o); });
        el.appendChild(og);
      });
      return el;
    },
    ivLegend() { return legend([{ cls: 'iv-1', label: '루트 / 토닉' }, { cls: 'iv-3', label: '3음' }, { cls: 'iv-5', label: '5음' }, { cls: 'iv-7', label: '7음' }, { cls: 'iv-t', label: '텐션 (9, 11, 13, 2, 4, 6)' }, { cls: 'iv-s', label: '그 외 스케일 음' }]); },
    fnLegend() { return legend([{ cls: 'iv-5', label: 'T 토닉' }, { cls: 'iv-3', label: 'S 서브도미넌트' }, { cls: 'iv-1', label: 'D 도미넌트' }, { cls: 'iv-t', label: 'X 비다이어토닉' }]); },
    chordPills(chord, opts) { return GH.ui.pills(chord.notes.map(n => ({ label: (opts && opts.name ? N.pretty(n.name) : n.iv), cls: n.cls, title: N.pretty(n.name) + ' · ' + n.iv + ' (' + n.ko + ')' }))); },
    playBtn(label, fn, cls) { return h('button', { class: 'btn small ' + (cls || ''), type: 'button', onclick: fn }, label); },
    stopBtn() { return h('button', { class: 'btn small', type: 'button', onclick: () => GH.player.stop() }, '■ 정지'); },
    fnClass(fn) { return 'fn-' + (fn || 'X'); },
    /* 심화 내용 접기: 기본은 접힌 상태 */
    deep(title, ...content) {
      return h('details', { class: 'deep' }, h('summary', null, h('span', { class: 'deep-mark', 'aria-hidden': 'true' }, GH.icon('sharp', { cls: 'when-closed' }), GH.icon('natural', { cls: 'when-open' })), title, h('span', { class: 'deep-hint' }, '심화')), h('div', { class: 'deep-body' }, content));
    },
    /* 진행 정의 → 실제 코드 목록 (key: 루트 이름) */
    progressionChords(p, key) {
      const items = (p.symbols || p.chords).map(c => typeof c === 'string' ? { r: c, beats: 4 } : Object.assign({ beats: 4 }, c));
      if (p.symbols) {
        const shift = N.mod(N.pcOf(key) - N.pcOf(p.key), 12);
        const pref = GH.state.pref(key);
        return items.map(it => {
          const ps = GH.chords.parseSymbol(it.r);
          const root = N.niceName(N.pcOf(ps.root) + shift, pref);
          const c = GH.chords.buildChord(root, ps.qId, { bass: ps.bass ? N.niceName(N.pcOf(ps.bass) + shift, pref) : null });
          return Object.assign(c, { roman: it.r, fn: ps.qId.match(/^(7|9|13|7b9|7#9|7alt|7#11|7b13|7#5|7sus4)$/) ? 'D' : ps.qId.match(/^(maj|maj7|maj9|6|69)$/) ? 'T' : 'S', beats: it.beats });
        });
      }
      return items.map(it => {
        const c = GH.chords.romanToChord(it.r, key, p.mode);
        if (!c) return null;
        if (it.bass) { c.bass = N.spell(key, it.bass); c.symbol = GH.chords.symbol(c.root, c.qId) + '/' + N.pretty(c.bass); }
        c.beats = it.beats;
        return c;
      }).filter(Boolean);
    },
    /* 코드 목록 → 재생용 (대표 보이싱 미디) */
    toPlayable(chords, voicings) {
      return chords.map((c, i) => {
        const v = voicings && voicings[i] ? voicings[i] : GH.voicings.representative(c.root, c.qId);
        const midi = v ? v.midi.filter(m => m != null) : GH.chords.chordPcs(c.rootPc, c.qId).map(pc => 48 + pc);
        const bassPc = c.bass ? N.pcOf(c.bass) : c.rootPc;
        return { midi, bass: 40 + N.mod(bassPc - 4, 12), beats: c.beats || 4 };
      });
    },
    chordStrip(chords, opts) {
      opts = opts || {};
      const strip = h('div', { class: 'prog-strip' });
      chords.forEach((c, i) => {
        const cell = h(opts.link ? 'a' : 'div', { class: 'prog-cell', 'data-i': i, href: opts.link ? app.chordHref(c.root, c.qId) : null },
          h('div', { class: 'roman' }, c.roman || ''),
          h('div', { class: 'chord' }, c.symbol),
          opts.fn !== false ? h('div', { class: 'fn ' + app.fnClass(c.fn) }, GH.chords.FN_KO[c.fn] || '') : null,
          c.beats && c.beats !== 4 ? h('div', { class: 'tag' }, c.beats + '박') : null);
        strip.appendChild(cell);
      });
      strip.setCurrent = i => { strip.querySelectorAll('.prog-cell').forEach(el => el.classList.toggle('current', Number(el.dataset.i) === i)); };
      return strip;
    }
  };
  GH.app = app;

  /* ---- 설정 패널 ---- */
  let settingsReturnFocus = null; let closeTimer = null;
  function renderSettings() {
    const panel = document.getElementById('settings-panel'); clear(panel);
    const s = GH.state.get();
    const field = (label, ctl) => h('div', { class: 'field' }, h('label', null, label), ctl);
    panel.appendChild(h('div', { class: 'row', style: 'justify-content:space-between' }, h('h2', { id: 'settings-title' }, '설정'), h('button', { class: 'iconbtn', type: 'button', 'aria-label': '설정 닫기', onclick: closeSettings }, GH.icon('close'))));
    if (GH.guide) {
      const G = GH.guide; const gp = G.profile();
      panel.appendChild(h('h3', { class: 'settings-group' }, '나의 학습'));
      panel.appendChild(h('div', { class: 'field' }, h('label', null, '수준 · 목표'),
        h('div', { class: 'row', style: 'gap:6px' }, h('span', { class: 'badge accent' }, G.levelKo()), (gp.goals || []).map(id => { const g = G.GOALS.find(x => x.id === id); return g ? h('span', { class: 'badge' }, g.ko) : null; })),
        h('div', { class: 'row', style: 'gap:6px;margin-top:8px' },
          h('button', { class: 'btn small', type: 'button', onclick: () => { closeSettings(); G.openOnboarding({ onDone: () => GH.router.rerender() }); } }, gp.onboarded ? '다시 고르기' : '수준 · 목표 고르기'),
          h('button', { class: 'btn small', type: 'button', onclick: () => { if (confirm('완료한 미션 기록을 모두 지울까요?')) { G.resetProgress(); renderSettings(); GH.router.rerender(); } } }, '진행 기록 초기화'))));
      panel.appendChild(h('div', { class: 'field' }, h('label', { style: 'display:flex;gap:8px;align-items:center;color:var(--fg)' }, h('input', { type: 'checkbox', checked: gp.showGuides !== false, onchange: e => { G.setProfile({ showGuides: e.target.checked }); GH.router.rerender(); } }), '페이지마다 사용법 가이드 보이기')));
    }
    panel.appendChild(h('h3', { class: 'settings-group' }, '소리'));
    panel.appendChild(field('재생 음색', select({ options: GH.audio.PRESET_ORDER.map(id => ({ value: id, label: GH.audio.PRESETS[id].ko })), value: s.instrument, onChange: v => GH.state.set({ instrument: v }) })));
    if (GH.samples) {
      const stTxt = h('small', { class: 'muted sample-status' });
      const upd = () => { const a = GH.samples.status(GH.state.get().instrument); stTxt.textContent = GH.state.get().sound === 'synth' ? '합성음으로 재생합니다.' : a === 'ready' ? '실제 악기 녹음으로 재생합니다.' : a === 'error' ? '녹음을 받지 못해 합성음으로 재생합니다.' : '녹음을 받는 중이에요. 그동안은 합성음으로 재생합니다.'; };
      upd(); GH.samples.onChange(upd);
      const soundSel = select({ options: [{ value: 'sample', label: '실제 악기 녹음 (기본)' }, { value: 'synth', label: '합성음 (데이터 절약)' }], value: s.sound || 'sample', onChange: v => { GH.state.set({ sound: v }); upd(); } });
      const credit = h('small', { class: 'muted', style: 'font-size:.72rem;line-height:1.5' }, '녹음 출처: 어쿠스틱 University of Iowa MIS · 일렉 기타 · 일렉 베이스 Karoryfer Samples · 클래식 Freesound quartertone · 피아노 Salamander Grand Piano (Alexander Holm), tonejs-instruments 모음 (CC BY 3.0) · 드럼 Virtuosity Drums (Versilian Studios · Karoryfer Samples) · 콘트라베이스 D. Smolken (CC0)');
      panel.appendChild(field('소리 방식', h('div', { style: 'display:grid;gap:6px' }, soundSel, stTxt, credit)));
    }
    panel.appendChild(field('볼륨', h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: s.volume, style: 'width:100%', oninput: e => GH.state.set({ volume: Number(e.target.value) }) })));
    panel.appendChild(field('룸 / 리버브', h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: s.reverb == null ? 0.3 : s.reverb, style: 'width:100%', oninput: e => GH.state.set({ reverb: Number(e.target.value) }) })));
    panel.appendChild(h('div', { class: 'field' }, h('button', { class: 'btn small', type: 'button', onclick: () => { const A = GH.audio; if (!A.context()) return; const t = A.now() + 0.05; [48, 52, 55, 60].forEach((m, i) => A.pluck(m, t + i * 0.03, 1.8, { gain: 0.9 })); } }, '▶ 톤 미리 듣기')));
    panel.appendChild(h('h3', { class: 'settings-group' }, '표기'));
    panel.appendChild(field('임시표 표기', select({ options: [{ value: 'auto', label: '자동 (키에 따라)' }, { value: 'sharp', label: '샵 ♯ 우선' }, { value: 'flat', label: '플랫 ♭ 우선' }], value: s.accidentals, onChange: v => GH.state.set({ accidentals: v }) })));
    panel.appendChild(field('지판 라벨', select({ options: [{ value: 'degree', label: '도수 (1, b3, 5 …)' }, { value: 'name', label: '음이름 (C, Eb, G …)' }], value: s.labelMode, onChange: v => GH.state.set({ labelMode: v }) })));
    panel.appendChild(field('코드 심볼 스타일', select({ options: [{ value: 'standard', label: '표준 (Cmaj7, Dm7, Bm7b5)' }, { value: 'jazz', label: '재즈 약식 (C△7, D-7, Bø7)' }], value: s.symbolStyle, onChange: v => GH.state.set({ symbolStyle: v }) })));
    panel.appendChild(h('h3', { class: 'settings-group' }, '기타'));
    panel.appendChild(field('튜닝 (스케일 지판에 적용·코드 폼은 스탠다드 기준)', select({ options: Object.entries(GH.state.TUNINGS).map(([k, t]) => ({ value: k, label: t.label })), value: s.tuning, onChange: v => GH.state.set({ tuning: v }) })));
    panel.appendChild(field('카포 (지판 표시, 0은 없음)', GH.ui.numberInput({ value: Number(s.capo) || 0, min: 0, max: 12, suffix: '프렛', label: '카포 위치 (프렛)', onChange: v => GH.state.set({ capo: v }) })));
    const lefty = h('input', { type: 'checkbox', checked: s.lefty, onchange: e => GH.state.set({ lefty: e.target.checked }) });
    panel.appendChild(h('div', { class: 'field' }, h('label', null, '왼손잡이'), h('label', { style: 'display:flex;gap:8px;align-items:center;color:var(--fg)' }, lefty, '지판과 코드 다이어그램을 좌우 반전')));
    panel.appendChild(h('h3', { class: 'settings-group' }, '화면'));
    panel.appendChild(field('테마', select({ options: [{ value: 'auto', label: '크림 페이퍼 (기본)' }, { value: 'light', label: '크림 페이퍼' }, { value: 'dark', label: '다크' }], value: s.theme, onChange: v => GH.state.set({ theme: v }) })));
    panel.appendChild(h('div', { class: 'field' }, h('button', { class: 'btn small', onclick: () => { GH.state.reset(); renderSettings(); } }, '기본값으로 초기화')));
    panel.appendChild(h('p', { class: 'muted', style: 'font-size:.8rem' }, '설정은 이 브라우저에 저장됩니다.'));
  }
  function openSettings() {
    settingsReturnFocus = document.activeElement;
    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    renderSettings();
    const panel = document.getElementById('settings-panel'); const bd = document.getElementById('settings-backdrop');
    panel.hidden = false; bd.hidden = false;
    document.body.classList.add('panel-open');
    document.getElementById('settings-btn').setAttribute('aria-expanded', 'true');
    void panel.offsetWidth; /* 리플로우 후 클래스를 붙여야 트랜지션이 재생된다 */
    panel.classList.add('open'); bd.classList.add('open');
    panel.focus({ preventScroll: true });
  }
  function closeSettings() {
    const panel = document.getElementById('settings-panel'); const bd = document.getElementById('settings-backdrop');
    if (panel.hidden) return;
    panel.classList.remove('open'); bd.classList.remove('open');
    document.body.classList.remove('panel-open');
    document.getElementById('settings-btn').setAttribute('aria-expanded', 'false');
    closeTimer = setTimeout(() => { panel.hidden = true; bd.hidden = true; closeTimer = null; }, 240);
    if (settingsReturnFocus && settingsReturnFocus.focus) settingsReturnFocus.focus({ preventScroll: true });
  }

  /* ---- 전역 키 ---- */
  function renderKeySelect() {
    const sel = document.getElementById('global-key');
    const cur = GH.state.get().key; const pref = GH.state.pref(cur);
    clear(sel);
    N.rootList(pref).forEach(r => { const o = h('option', { value: r }, N.pretty(r)); if (r === cur || N.pcOf(r) === N.pcOf(cur)) o.selected = true; sel.appendChild(o); });
    sel.onchange = () => GH.state.set({ key: sel.value });
  }

  function init() {
    document.querySelectorAll('[data-icon]').forEach(el => { if (!el.querySelector('svg')) el.insertBefore(GH.icon(el.dataset.icon), el.firstChild); });
    if ('IntersectionObserver' in window && !reduceMotion()) {
      document.documentElement.classList.add('can-reveal');
      revealIO = new IntersectionObserver(es => es.forEach(en => {
        if (!en.isIntersecting || en.target.classList.contains('in')) return;
        /* 들어오는 쪽에 맞춰 시작 위치를 정한 뒤 나타나게 (위에서 들어오면 위에서 내려온다) */
        const t = en.target, fromTop = en.boundingClientRect.top < 0;
        if (t.classList.contains('from-top') !== fromTop) { t.classList.toggle('from-top', fromTop); void t.offsetWidth; }
        t.classList.add('in');
      }), { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
      /* 완전히 벗어나면 되돌린다. 위로 벗어났으면 다음에는 위에서 내려오도록 */
      hideIO = new IntersectionObserver(es => es.forEach(en => { if (!en.isIntersecting && en.target.classList.contains('in')) { en.target.classList.toggle('from-top', en.boundingClientRect.bottom <= 0); en.target.classList.remove('in'); } }), { threshold: 0 });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) menuBtn.addEventListener('click', () => { if (menuOpen) closeMenu(); else openMenu(); });
    const menuPanel = document.getElementById('menu-panel');
    if (menuPanel) menuPanel.addEventListener('click', e => { const a = e.target.closest('a'); if (a && location.hash === a.getAttribute('href')) closeMenu(false); });
    const toolsBtn = document.getElementById('tools-btn');
    if (toolsBtn) toolsBtn.addEventListener('click', () => { const on = document.body.classList.toggle('tools-open'); toolsBtn.setAttribute('aria-expanded', on ? 'true' : 'false'); if (on) document.getElementById('search-input').focus(); });
    GH.events.on('guide', renderHangTab);
    document.getElementById('settings-btn').addEventListener('click', openSettings);
    document.getElementById('settings-backdrop').addEventListener('click', closeSettings);
    const back = document.getElementById('back-btn');
    if (back) back.addEventListener('click', () => GH.router.back());
    GH.search.bind(document.getElementById('search-input'), document.getElementById('search-results'));
    renderKeySelect();
    GH.events.on('settings', () => { renderKeySelect(); GH.router.rerender(); });
    GH.events.on('route', renderNav);
    GH.events.on('route', r => { if (GH.guide) GH.guide.decorate(r); if (GH.coach) GH.coach.onRoute(r); motionScan(r); });
    GH.events.on('vexflow', () => { const r = GH.router.current(); if (r && r.page && r.page.staff) GH.router.rerender(); });
    const fl = document.getElementById('footer-links');
    SECTIONS.forEach(s => fl.appendChild(h('a', { href: '#' + s.path }, s.label)));
    [['#/glossary', '용어집'], ['#/tools/finder', '코드 파인더'], ['#/backing', '백킹 트랙'], ['#/rhythm', '메트로놈']].forEach(([p, l]) => { fl.appendChild(h('a', { href: p }, l)); });
    document.addEventListener('keydown', e => {
      const tag = document.activeElement && document.activeElement.tagName;
      const settingsPanel = document.getElementById('settings-panel');
      if (e.key === 'Escape' && !settingsPanel.hidden) { closeSettings(); return; }
      if (e.key === 'Escape' && menuOpen) { closeMenu(); return; }
      if (e.key === 'Tab' && !settingsPanel.hidden) {
        const focusable = Array.from(settingsPanel.querySelectorAll('button, select, input, a[href], [tabindex]:not([tabindex="-1"])')).filter(x => !x.disabled && !x.hidden);
        if (focusable.length) {
          const first = focusable[0], last = focusable[focusable.length - 1];
          if (e.shiftKey && (document.activeElement === first || document.activeElement === settingsPanel)) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      if (e.key === '/' && settingsPanel.hidden && tag !== 'INPUT' && tag !== 'SELECT' && tag !== 'TEXTAREA' && !document.activeElement.isContentEditable) { e.preventDefault(); document.getElementById('search-input').focus(); }
    });
    GH.router.render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
