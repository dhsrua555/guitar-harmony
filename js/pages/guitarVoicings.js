/* 기타 › 코드 보이싱 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, chips, select, notice, callout } = GH.ui; const N = GH.notes;
  const TYPES = {
    basic: ['open', 'caged', 'power'],
    advanced: ['shell', 'jazz', 'quartal', 'drop2', 'drop3', 'drop24']
  };
  const state = {
    q: { basic: 'maj', advanced: 'maj7' },
    types: { basic: ['open', 'caged', 'power'], advanced: ['shell', 'jazz', 'drop2'] },
    labelMode: 'iv', strSet: 'all', inv: 'all', progId: 'ii-V-I', vlKind: 'drop2', vlSet: '5-4-3-2'
  };

  function breadcrumb(level) {
    return h('div', { class: 'breadcrumb' }, h('a', { href: '#/guitar/voicings' }, '코드 보이싱'), ' › ', level === 'basic' ? '기본 코드 폼' : '재즈·확장 보이싱');
  }

  function renderLanding(el) {
    const A = GH.app; const root = A.key();
    el.appendChild(h('h1', null, '코드 보이싱'));
    el.appendChild(h('p', { class: 'muted' }, '연주 목적에 맞게 기본 폼과 확장 보이싱을 나눌었습니다. 먼저 오픈 포지션과 CAGED를 익힌 뒤, 셸·드롭·텐션 보이싱으로 넘어가면 폼을 혼동하지 않고 찾을 수 있습니다.'));
    el.appendChild(h('div', { class: 'grid cols-2' },
      h('a', { class: 'card link', href: A.voicingsHref(root, 'maj', 'basic') },
        h('span', { class: 'badge' }, '기초'), h('h2', null, '기본 코드 폼'),
        h('p', null, '오픈 포지션, CAGED 이동형 폼, 파워 코드를 모아 봅니다.'),
        h('div', { class: 'muted' }, '코드 반주·합주를 위한 필수 폼 →')),
      h('a', { class: 'card link', href: A.voicingsHref(root, 'maj7', 'advanced') },
        h('span', { class: 'badge accent' }, '중·고급'), h('h2', null, '재즈·확장 보이싱'),
        h('p', null, '셸, 드롭 2·3·2 & 4, 텐션, 4도 보이싱과 보이스 리딩을 다룹니다.'),
        h('div', { class: 'muted' }, '재즈 컴핑·네오소울·화성 확장 →'))));
    el.appendChild(section('두 방식을 나눈 기준', h('div', { class: 'split' },
      h('div', null, h('h3', null, '기본 코드 폼'), h('p', { class: 'muted' }, '개방현과 바레를 포함해 노래 반주에 바로 쓰는 폼입니다.')),
      h('div', null, h('h3', null, '재즈·확장 보이싱'), h('p', { class: 'muted' }, '가이드 톤, 텐션, 보이스 배치와 최소 이동을 중심으로 보는 폼입니다.')))));
  }

  function renderExplorer(el, params, level) {
    const A = GH.app; const st = GH.state.get(); const qy = params.query || {};
    const allowed = TYPES[level]; const path = '/guitar/voicings/' + level;
    if (qy.q && GH.chords.getQuality(qy.q)) state.q[level] = qy.q;
    if (qy.types) {
      const requested = qy.types.split(',').filter(t => allowed.includes(t));
      if (requested.length) state.types[level] = requested;
    }
    const qId = state.q[level]; const root = qy.root || A.key(); const pref = A.pref(root);
    const chord = GH.chords.buildChord(root, qId);
    el.appendChild(breadcrumb(level));
    el.appendChild(h('h1', null, level === 'basic' ? '기본 코드 폼' : '재즈·확장 보이싱'));
    if (level === 'basic' && GH.course) { const hint = GH.course.hint('openchords'); if (hint) el.appendChild(hint); }
    el.appendChild(h('p', { class: 'muted' }, level === 'basic'
      ? '오픈 포지션, CAGED 이동형 폼, 파워 코드를 코드 퀄리티와 루트에 맞춰 찾습니다.'
      : '가이드 톤·텐션·보이스 배치를 중심으로 셸, 드롭, 4도 보이싱을 찾습니다.'));
    el.appendChild(h('div', { class: 'toc' }, h('a', { href: '#/guitar/voicings/' + (level === 'basic' ? 'advanced' : 'basic') }, level === 'basic' ? '재즈·확장 보이싱 보기 →' : '기본 코드 폼 보기 →')));
    if (!GH.state.isStandardTuning()) el.appendChild(notice('코드 폼은 스탠다드 튜닝 기준입니다. 현재 튜닝(' + GH.state.TUNINGS[st.tuning].label + ')에서는 스케일 지판만 튜닝 설정을 따릅니다.'));

    const navigate = extra => GH.router.go(path, Object.assign({ root, q: state.q[level] }, extra || {}));
    const tb = h('div', { class: 'toolbar' });
    tb.appendChild(h('label', null, '루트', A.rootSelect(root, v => navigate({ root: v }))));
    tb.appendChild(h('label', null, '코드 퀄리티', A.qualitySelect(qId, v => { state.q[level] = v; navigate({ q: v }); })));
    tb.appendChild(h('label', null, '다이어그램 표기', select({ options: [{ value: 'iv', label: '도수' }, { value: 'finger', label: '손가락 번호' }, { value: 'name', label: '음이름' }], value: state.labelMode, onChange: v => { state.labelMode = v; GH.router.rerender(); } })));
    tb.appendChild(h('label', null, '현 세트', select({ options: [{ value: 'all', label: '전체' }, '6-5-4-3', '5-4-3-2', '4-3-2-1', '6-4-3-2', '5-3-2-1'], value: state.strSet, onChange: v => { state.strSet = v; GH.router.rerender(); } })));
    tb.appendChild(h('label', null, '인버전', select({ options: [{ value: 'all', label: '전체' }, { value: '0', label: '기본위치' }, { value: '1', label: '1전위' }, { value: '2', label: '2전위' }, { value: '3', label: '3전위' }], value: state.inv, onChange: v => { state.inv = v; GH.router.rerender(); } })));
    el.appendChild(tb);
    el.appendChild(h('div', { style: 'margin:0 0 12px' }, h('span', { class: 'muted', style: 'margin-right:8px' }, '보이싱 타입'), chips({ options: allowed.map(k => ({ value: k, label: GH.data.voicingTypes[k] })), value: state.types[level], multi: true, onChange: v => { state.types[level] = v; navigate({ types: v.join(',') }); } })));

    el.appendChild(h('div', { class: 'card' }, h('div', { class: 'row' },
      h('span', { class: 'symbol-big' }, chord.symbol), A.chordPills(chord, { name: true }), A.chordPills(chord),
      A.playBtn('▶ 코드 듣기', () => { const v = GH.voicings.representative(root, qId); GH.player.playChord(v ? v.midi.filter(m => m != null) : chord.pcs.map(p => 48 + p), { arpeggio: true }); }),
      h('a', { class: 'btn small', href: A.chordHref(root, qId) }, '코드 상세 →'),
      h('a', { class: 'btn small', href: '#/theory/chords?root=' + encodeURIComponent(root) + '&q=' + qId + '&tab=builder' }, '화성학 →')),
      h('p', { class: 'muted', style: 'margin:.6em 0 0' }, chord.quality.desc)));
    el.appendChild(h('div', { style: 'margin:8px 0' }, A.ivLegend()));

    let list = GH.voicings.forChord(root, qId, state.types[level]);
    if (state.strSet !== 'all') list = list.filter(v => (v.strSet || v.strings.join('-')) === state.strSet || v.strings.join('-') === state.strSet);
    if (state.inv !== 'all') list = list.filter(v => String(v.inversion) === state.inv);
    const groups = GH.util.groupBy(list, v => v.type); let any = false;
    allowed.forEach(t => {
      const g = groups[t]; if (!g || !g.length) return; any = true;
      const desc = {
        open: '개방현을 포함한 오픈 포지션. 특정 루트에서만 쓸 수 있습니다.',
        caged: 'C·A·G·E·D 오픈 코드 셰이프를 지판 전체로 확장한 이동형 포지션입니다. 일부 셰이프는 바레를 사용합니다.',
        power: '루트와 퍼펙트 5도로 만든 파워 코드입니다.',
        shell: '루트·3음·7음(가이드 톤)을 중심으로 한 간결한 컴핑 보이싱입니다.',
        jazz: '9th·11th·13th와 변화 텐션을 포함하며, 문맥에 따라 루트이나 5음을 생략합니다.',
        quartal: '4도 간격으로 쌓은 모달·네오소울 사운드의 보이싱입니다.',
        drop2: '4-way close의 위에서 두 번째 음을 한 옥타브 내린 4성 보이싱입니다.',
        drop3: '4-way close의 위에서 세 번째 음을 내려, 보통 한 현을 건너뛰어 배치합니다.',
        drop24: '위에서 두 번째와 네 번째 음을 내린 넓은 간격의 보이싱입니다.'
      }[t] || '';
      const sec = section(GH.data.voicingTypes[t] + ' (' + g.length + ')', h('p', { class: 'muted' }, desc));
      const grid = h('div', { class: 'grid diagrams' });
      g.sort((a, b) => (a.strSet || '').localeCompare(b.strSet || '') || a.baseFret - b.baseFret);
      g.forEach(v => grid.appendChild(GH.render.chordCard(v, { labelMode: state.labelMode, pref, arpeggio: false })));
      sec.appendChild(grid); el.appendChild(sec);
    });
    if (!any) el.appendChild(GH.ui.empty('조건에 맞는 보이싱이 없습니다. 보이싱 타입이나 필터를 바꿔 보세요.'));

    const pcMap = {}; chord.notes.forEach(n => { pcMap[n.pc] = { label: n.iv, cls: n.cls }; });
    el.appendChild(section('지판 전체의 코드톤', h('p', { class: 'muted' }, '보이싱은 이 구성음 가운데 필요한 음을 선택하고 중복·생략해 배치합니다. 베이스와 탑 노트가 바뀌면 전위와 색채도 달라집니다.'), GH.render.fretboard({ pcMap, pref, to: 22 }).el));
    if (level === 'advanced') renderVoiceLeading(el, root, pref);
  }

  function renderVoiceLeading(el, root, pref) {
    const A = GH.app; const progs = GH.data.progressions.filter(p => !p.symbols);
    const P = progs.find(p => p.id === state.progId) || progs[0]; const chords = A.progressionChords(P, root);
    const voiceSets = state.vlKind === 'drop3' ? ['6-4-3-2', '5-3-2-1'] : ['6-5-4-3', '5-4-3-2', '4-3-2-1'];
    if (!voiceSets.includes(state.vlSet)) state.vlSet = voiceSets[0];
    const seq = GH.voicings.voiceLead(chords, { kind: state.vlKind, strSet: state.vlSet });
    const vlSec = section('코드 진행의 보이스 리딩', h('p', { class: 'muted' }, '공통음을 유지하고 각 보이스의 이동을 줄인 보이싱 조합입니다.'));
    let strip;
    vlSec.appendChild(h('div', { class: 'toolbar' },
      h('label', null, '코드 진행', select({ options: progs.map(p => ({ value: p.id, label: p.ko })), value: P.id, onChange: v => { state.progId = v; GH.router.rerender(); } })),
      h('label', null, '보이싱', select({ options: [{ value: 'drop2', label: '드롭 2' }, { value: 'drop3', label: '드롭 3' }, { value: 'shell', label: '셸' }], value: state.vlKind, onChange: v => { state.vlKind = v; state.vlSet = v === 'drop3' ? '6-4-3-2' : '5-4-3-2'; GH.router.rerender(); } })),
      h('label', null, '현 세트', select({ options: voiceSets, value: state.vlSet, onChange: v => { state.vlSet = v; GH.router.rerender(); } })),
      A.playBtn('▶ 진행 듣기', () => GH.player.playProgression(A.toPlayable(chords, seq), { tempo: P.tempo || 100, style: P.style, onChord: i => strip.setCurrent(i) }), 'primary'), A.stopBtn()));
    strip = A.chordStrip(chords, { link: true }); vlSec.appendChild(strip);
    const grid = h('div', { class: 'grid diagrams', style: 'margin-top:10px' });
    seq.forEach((v, i) => { if (v) grid.appendChild(GH.render.chordCard(v, { labelMode: state.labelMode, pref, title: chords[i].symbol, sub: v.name })); });
    vlSec.appendChild(grid); el.appendChild(vlSec);
    el.appendChild(callout(h('b', null, '4-way close 보이싱이란? '), '네 보이스를 한 옥타브 안에 밀집시킨 클로즈 보이싱입니다. 기타에서는 스트레치가 커지기 쉽기 때문에, 특정 보이스를 한 옥타브 내린 드롭 보이싱으로 연주합니다.'));
  }

  GH.pages['/guitar/voicings'] = {
    title: '코드 보이싱',
    render(el, params) {
      const qy = params.query || {};
      if (qy.root || qy.q || qy.types) {
        const requested = (qy.types || '').split(',');
        const level = requested.some(t => TYPES.advanced.includes(t)) ? 'advanced' : 'basic';
        renderExplorer(el, params, level); return;
      }
      renderLanding(el);
    }
  };
  GH.pages['/guitar/voicings/basic'] = { title: '기본 코드 폼', render(el, params) { renderExplorer(el, params, 'basic'); } };
  GH.pages['/guitar/voicings/advanced'] = { title: '재즈·확장 보이싱', render(el, params) { renderExplorer(el, params, 'advanced'); } };
})();
