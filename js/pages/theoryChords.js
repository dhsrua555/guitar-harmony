/* 화성학 › 코드 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, table, kv, select, callout, tabs } = GH.ui; const N = GH.notes;
  const state = { q: 'maj7', diaScale: 'ionian', sevenths: true, tab: 'builder', group: 'category' };
  const FAMILY_KO = { major: '메이저 계열', minor: '마이너 계열', dominant: '도미넌트 계열', diminished: '디미니시드 계열', augmented: '어그멘티드 계열', sus: '서스 계열' };
  GH.pages['/theory/chords'] = {
    title: '코드',
    staff: true,
    render(el, params) {
      const A = GH.app; const qy = params.query || {};
      const key = A.key(); const root = qy.root || key; const pref = A.pref(root);
      if (qy.q && GH.chords.getQuality(qy.q)) { state.q = qy.q; state.tab = 'builder'; }
      if (qy.tab) state.tab = qy.tab;
      if (qy.group && ['category', 'family', 'level'].includes(qy.group)) state.group = qy.group;
      el.appendChild(h('h1', null, '코드'));
      if (GH.course) { const hint = GH.course.hint('triad'); if (hint) el.appendChild(hint); }
      el.appendChild(h('p', { class: 'muted' }, '코드는 함께 울리며 하나의 화성으로 인식되는 음의 조합입니다. 기능화성에서는 주로 3도씩 쌓아 설명하지만, sus·add·파워 코드처럼 다른 구조도 있습니다. 코드 빌더에서 구성음을 확인하고 코드 퀄리티, 다이어토닉 코드, 텐션과 표기법을 살펴보세요.'));
      el.appendChild(tabs([{ id: 'builder', label: '코드 빌더' }, { id: 'types', label: '코드 퀄리티' }, { id: 'diatonic', label: '다이어토닉 코드' }, { id: 'tension', label: '텐션' }, { id: 'notation', label: '표기법' }, { id: 'inversion', label: '인버전 · 슬래시 코드' }], state.tab, id => GH.router.go('/theory/chords', { root, q: state.q, tab: id })));
      const body = h('div'); el.appendChild(body);
      if (state.tab === 'builder') renderBuilder(body, root, pref);
      else if (state.tab === 'types') renderTypes(body, root, pref);
      else if (state.tab === 'diatonic') renderDiatonic(body, key);
      else if (state.tab === 'tension') renderTension(body, root);
      else if (state.tab === 'notation') renderNotation(body, root);
      else renderInversion(body, root, pref);
    }
  };
  function renderBuilder(el, root, pref) {
    const A = GH.app;
    const chord = GH.chords.buildChord(root, state.q);
    el.appendChild(h('div', { class: 'toolbar' }, h('label', null, '루트', A.rootSelect(root, v => GH.router.go('/theory/chords', { root: v, q: state.q, tab: 'builder' }))), h('label', null, '코드 퀄리티', A.qualitySelect(state.q, v => GH.router.go('/theory/chords', { root, q: v, tab: 'builder' }))),
      A.playBtn('▶ 듣기', () => { const v = GH.voicings.representative(chord.root, chord.qId); GH.player.playChord(v ? v.midi.filter(m => m != null) : chord.pcs.map(p => 48 + p), { arpeggio: true }); }, 'primary'),
      h('a', { class: 'btn small', href: A.chordHref(root, state.q) }, '코드 상세 →'), h('a', { class: 'btn small', href: A.voicingsHref(root, state.q, 'basic') }, '기본 코드 폼 →'), h('a', { class: 'btn small', href: A.voicingsHref(root, state.q, 'advanced') }, '확장 보이싱 →')));
    const q = chord.quality;
    el.appendChild(h('div', { class: 'card' },
      h('div', { class: 'row' }, h('span', { class: 'symbol-big' }, chord.symbol), h('span', { class: 'muted' }, q.ko + ' · 재즈 표기 ' + N.pretty(root) + q.jazz)),
      h('p', null, q.desc),
      h('h3', null, '구성음과 도수'),
      table(['도수', '인터벌', '음이름', '반음'], chord.notes.map(n => [h('span', { class: 'pill ' + n.cls }, n.iv), n.ko, N.pretty(n.name), N.ivSemi(n.iv)])),
      kv([['사용 가능한 텐션', q.tensions.length ? q.tensions.join(', ') : '–'], ['어보이드 노트', q.avoid.length ? q.avoid.join(', ') : '없음'], ['다른 표기', [q.sym || 'maj', q.jazz].concat(q.aliases || []).filter((x, i, a) => x && a.indexOf(x) === i).map(x => N.pretty(root) + x).join(', ')]])));
    const base = 48 + chord.rootPc;
    const midis = chord.notes.map(n => base + N.mod(n.pc - chord.rootPc, 12) + (N.ivSemi(n.iv) >= 12 ? 12 : 0));
    const onMidi = {}; midis.forEach((m, i) => { onMidi[m] = { label: chord.notes[i].iv, cls: chord.notes[i].cls }; });
    const pcMap = {}; chord.notes.forEach(n => { pcMap[n.pc] = { label: n.iv, cls: n.cls }; });
    const st = GH.render.chordStaff(midis, { pref, width: 220, names: chord.notes.map(n => n.name), symbol: chord.symbol });
    el.appendChild(section('세 가지 시각으로 보기',
      h('div', { class: 'split' }, h('div', null, h('h3', null, '피아노'), GH.render.piano({ from: 48, to: 76, onMidi })), h('div', null, h('h3', null, '오선'), st || h('p', { class: 'muted' }, 'VexFlow 로딩 중이거나 오프라인입니다.'))),
      h('h3', null, '기타 지판 (코드톤 전체)'), GH.render.fretboard({ pcMap, pref, to: 22 }).el, h('div', { style: 'margin-top:6px' }, A.ivLegend())));
    const vs = GH.voicings.forChord(root, state.q, ['open', 'caged', 'shell', 'jazz']).slice(0, 6);
    if (vs.length) { const g = h('div', { class: 'grid diagrams' }); vs.forEach(v => g.appendChild(GH.render.chordCard(v, { pref }))); el.appendChild(section('대표 보이싱', g, h('div', { class: 'toc' }, h('a', { href: A.voicingsHref(root, state.q, 'basic') }, '기본 코드 폼 →'), h('a', { href: A.voicingsHref(root, state.q, 'advanced') }, '재즈·확장 보이싱 →')))); }
    const fits = GH.scales.forChord(state.q);
    el.appendChild(section('코드 스케일 후보', h('div', { class: 'toc' }, fits.map(f => h('a', { href: A.scaleHref(f.scale.id, root), style: f.primary ? 'font-weight:700;color:var(--accent);border-color:var(--accent)' : '' }, f.scale.ko))), h('p', { class: 'muted' }, '강조된 항목은 일반적인 출발점입니다. 실제 선택은 키, 코드 기능, 앞뒤 진행과 멜로디를 함께 고려하세요.')));
  }
  function renderTypes(el, root, pref) {
    const A = GH.app; const C = GH.chords;
    const by = state.group;
    el.appendChild(h('div', { class: 'toolbar' }, h('label', null, '분류', select({ options: [{ value: 'category', label: '구성별 (트라이어드 · sus · 7th · 텐션 …)' }, { value: 'family', label: '계열별 (메이저 · 마이너 · 도미넌트 …)' }, { value: 'level', label: '난이도별 (p 입문 → ff 고급)' }], value: by, onChange: v => { state.group = v; GH.router.go('/theory/chords', { root, q: state.q, tab: 'types', group: v }); } })), h('span', { class: 'muted' }, '코드 퀄리티 ' + C.QUALITIES.length + '개. 행을 누르면 코드 빌더로 이동합니다.')));
    const rows = list => table(['심벌', '이름', '난이도', '구성음(도수)', '텐션', '어보이드 노트', '주요 스케일 후보'], list.map(q => ({ onClick: () => GH.router.go('/theory/chords', { root, q: q.id, tab: 'builder' }), cells: [h('b', null, N.pretty(root) + (q.sym || '')), q.ko, A.levelBadge(q.level), h('span', null, q.intervals.map(iv => h('span', { class: 'pill ' + N.ivClass(iv) }, iv))), q.tensions.join(' ') || '–', q.avoid.join(' ') || '–', (q.scales || []).slice(0, 2).map(s => GH.scales.get(s) ? GH.scales.get(s).ko : s).join(', ')] })));
    if (by === 'family') {
      const groups = GH.util.groupBy(C.QUALITIES, q => q.family);
      Object.keys(FAMILY_KO).forEach(fam => { const list = groups[fam]; if (!list) return; el.appendChild(section(FAMILY_KO[fam] + ' (' + list.length + ')', rows(list))); });
    } else if (by === 'level') {
      [1, 2, 3, 4, 5].forEach(lv => { const list = C.QUALITIES.filter(q => q.level === lv); if (!list.length) return; el.appendChild(section(C.LEVEL_KO[lv] + ' (' + list.length + ')', h('p', { class: 'muted' }, ['', '팝 · 록 반주에서 가장 먼저 쓰는 코드입니다.', '발라드 · 포크에 자주 나오고, 재즈 코드로 넘어가는 다리가 되는 코드입니다.', '재즈 · 네오소울 · 보사노바에서 자주 쓰는 확장 코드입니다.', '변화 텐션이 들어간 도미넌트와 색이 짙은 확장 코드입니다.', '텐션을 여러 개 겹친, 보이싱을 신경 써야 하는 코드입니다.'][lv]), rows(list))); });
    } else {
      C.CATEGORY_ORDER.forEach(cat => { const list = C.QUALITIES.filter(q => q.category === cat); if (!list.length) return; const sec = section(C.CATEGORY_KO[cat] + ' (' + list.length + ')', h('p', { class: 'muted' }, C.CATEGORY_DESC[cat]), rows(list)); sec.id = 'cat-' + cat; el.appendChild(sec); });
    }
    el.appendChild(callout('행을 누르면 코드 빌더에서 자세히 볼 수 있습니다. 같은 구성음을 다른 루트와 심벌로 해석할 수도 있습니다: C6 = Am7, Cm6 = Am7b5. C7b9에서 루트를 생략하면 C#°7, E°7, G°7, Bb°7과 같은 음 집합이 됩니다.'));
  }
  function renderDiatonic(el, key) {
    const A = GH.app;
    const scales = [['ionian', '메이저'], ['aeolian', '내추럴 마이너'], ['harmonic_minor', '하모닉 마이너'], ['melodic_minor', '멜로딕 마이너'], ['dorian', '도리안'], ['mixolydian', '믹솔리디안'], ['lydian', '리디안'], ['phrygian', '프리지안']];
    el.appendChild(h('div', { class: 'toolbar' }, h('label', null, '키', A.rootSelect(key, v => GH.state.set({ key: v }))), h('label', null, '스케일', select({ options: scales.map(([id, ko]) => ({ value: id, label: ko })), value: state.diaScale, onChange: v => { state.diaScale = v; GH.router.rerender(); } })), h('label', null, select({ options: [{ value: '3', label: '트라이어드' }, { value: '7', label: '세븐 코드' }], value: state.sevenths ? '7' : '3', onChange: v => { state.sevenths = v === '7'; GH.router.rerender(); } })), A.fnLegend()));
    const dia = GH.chords.diatonic(key, state.diaScale, state.sevenths);
    el.appendChild(section(N.pretty(key) + ' ' + GH.scales.get(state.diaScale).ko + '의 다이어토닉 코드',
      h('p', { class: 'muted' }, '스케일의 각 음 위에 3도씩 쌓으면 그 키 안의 코드가 만들어집니다 (하모나이제이션). 로마 숫자는 대문자 = 메이저, 소문자 = 마이너, ° = 디미니시드, ø = 하프 디미니시드.'),
      A.chordStrip(dia.map(d => Object.assign(d.chord, { roman: d.roman, fn: d.fn })), { link: true }),
      table(['도수', '로마 숫자', '코드', '구성음', '기능', '듣기'], dia.map(d => [d.degree, d.roman, h('a', { href: A.chordHref(d.root, d.qId) }, d.chord.symbol), d.chord.notes.map(n => N.pretty(n.name)).join(' '), h('span', { class: A.fnClass(d.fn) }, GH.chords.FN_KO[d.fn]), A.playBtn('▶', () => { const v = GH.voicings.representative(d.root, d.qId); GH.player.playChord(v ? v.midi.filter(m => m != null) : d.chord.pcs.map(p => 48 + p)); })])),
      A.playBtn('▶ 전부 순서대로', () => { GH.player.playProgression(A.toPlayable(dia.map(d => Object.assign(d.chord, { beats: 2 }))), { tempo: 100, style: 'ballad' }); }, 'primary')));
    el.appendChild(callout(h('b', null, '화성 기능. '), '토닉(T)은 중심과 안정, 서브도미넌트(S)는 전개와 이동, 도미넌트(D)는 긴장과 해결 방향을 만듭니다. 메이저 키: I, iii, vi = T · ii, IV = S · V, vii° = D. T → S → D → T는 대표적인 기능 진행입니다. ', h('a', { href: '#/theory/progressions' }, '코드 진행 →')));
  }
  function renderTension(el, root) {
    const A = GH.app;
    el.appendChild(section('사용 가능한 텐션', h('p', null, '사용 가능한 텐션은 코드의 기능, 코드 스케일, 멜로디와 보이싱에 따라 달라집니다. 실용적인 첫 기준으로, 구조적인 코드톤과 b9를 이루는 음은 강박이나 지속음으로 둘 때 주의하세요. 도미넌트의 변화 텐션(b9, #9, #11, b13)은 해결 방향에 맞춰 선택합니다.'),
      table(['코드', '기본 텐션', '변화 텐션', '어보이드 노트', '메모'], [
        ['maj7', '9, 13, (#11)', '–', '11 (4음)', '11은 3음과 b9 마찰. #11은 리디안 문맥에서 사용'],
        ['m7', '9, 11', '–', 'b13 (b6 문맥)', '도리안이면 13 사용 가능. 에올리안 문맥의 b13은 5음과 마찰'],
        ['7', '9, 13', 'b9, #9, #11, b13', '11 (4음)', '기능과 해결 방향에 따라 자연 텐션과 변화 텐션을 선택'],
        ['m7b5', '11, b13, (9)', '–', 'b9 (b2)', '로크리안 ♮2를 쓰면 9 사용 가능'],
        ['dim7', '9, 11, b13, 7', '–', '–', '온음-반음 디미니시드 스케일 문맥의 텐션'],
        ['mMaj7', '9, 11, 13', '–', '–', '멜로딕 마이너'],
        ['7sus4', '9, 13', 'b9', '3', '3음이 어보이드 (sus의 4와 반음 충돌)']
      ])));
    const g7 = GH.chords.buildChord(root, '7');
    el.appendChild(section('어퍼 스트럭처 트라이어드 (' + g7.symbol + ' 위에)', h('p', { class: 'muted' }, '도미넌트 7 코드 위에 메이저 트라이어드를 겹치면 여러 텐션을 하나의 모양으로 보이싱할 수 있습니다.'),
      table(['얹는 메이저 트라이어드', '얻는 음', '결과 코드'], [['2', '9, #11, 13', '13(#11)'], ['b3', '#9, 5, b7', '7(#9)'], ['b6', 'b13, 1, #9', '7(#9,b13)'], ['6', '13, b9, 3', '13(b9)'], ['b2', 'b9, 11, b13', '7(b9,11,b13)'], ['#4', '#11, b7, b9', '7(b9,#11)']].map(([iv, t, suffix]) => { const r = N.spell(root, iv); return [r + ' 메이저', t, N.pretty(root) + suffix]; }))));
    el.appendChild(h('div', { class: 'toc' }, h('a', { href: A.reharmHref('tension') }, '리하모니제이션: 텐션과 어퍼 스트럭처 →')));
  }
  function renderNotation(el, root) {
    const r = N.pretty(root);
    el.appendChild(section('코드 심벌 표기 비교', h('p', null, '같은 코드도 리드 시트와 교재에 따라 표기가 다릅니다. 이 사이트는 일반 표기를 기본으로 하고 설정에서 재즈 심벌로 바꿀 수 있습니다.'),
      table(['코드', '일반 표기', '재즈 심벌', '그 밖의 표기', '읽는 법'], [
        ['메이저 7', r + 'maj7', r + '△7', r + 'M7, ' + r + 'Ma7, ' + r + 'Δ7, ' + r + 'j7', '메이저 세븐'],
        ['마이너 7', r + 'm7', r + '-7', r + 'min7, ' + r + 'mi7', '마이너 세븐'],
        ['도미넌트 7', r + '7', r + '7', r + 'dom7', '세븐'],
        ['하프 디미니시드', r + 'm7b5', r + 'ø7', r + 'm7(b5), ' + r + '-7b5', '마이너 세븐 플랫 파이브'],
        ['디미니시드 7', r + 'dim7', r + '°7', r + 'o7', '디미니시드 세븐'],
        ['마이너 메이저 7', r + 'mMaj7', r + '-△7', r + 'm(maj7), ' + r + 'mM7', '마이너 메이저 세븐'],
        ['어그멘티드', r + 'aug', r + '+', r + '(#5)', '어그멘티드'],
        ['식스 나인', r + '6/9', r + '6/9', r + '69, ' + r + '6(9)', '식스 나인'],
        ['애드 9', r + 'add9', r + 'add9', r + '(add9), ' + r + 'add2', '애드 나인'],
        ['알터드', r + '7alt', r + '7alt', r + '7(b9,#9,b13)', '세븐 알터드'],
        ['슬래시', r + '/E', r + '/E', '', r + ' 온 E (베이스 E)']
      ])));
    el.appendChild(section('읽는 규칙', h('ul', { class: 'plain' }, ['루트 → 트라이어드 퀄리티(생략하면 메이저, m은 마이너) → 7음 종류(7 = 마이너 7도, maj7 = 메이저 7도) → 텐션과 변화음 순으로 읽습니다.', '숫자 하나만 쓰인 C9, C13에는 도미넌트 7이 포함됩니다. 메이저 9 코드는 Cmaj9처럼 maj를 표시합니다.', 'add는 7음 없이 해당 음만 더한다는 뜻입니다(Cadd9 = C E G D).', 'sus는 3음을 4음 또는 2음으로 바꾼 코드입니다(C7sus4 = C F G Bb).', '변화 텐션은 C7(b9)처럼 괄호 안에 쓰거나 C7b9처럼 붙여 씁니다.'].map(t => h('li', null, t)))));
  }
  function renderInversion(el, root, pref) {
    const A = GH.app;
    const c = GH.chords.buildChord(root, 'maj');
    el.appendChild(section('인버전 (Inversion)', h('p', null, '루트가 아닌 코드톤을 최저음에 두면 인버전(전위)입니다. 3음이 베이스면 1전위, 5음이면 2전위, 7음이면 3전위입니다. 기타에서는 드롭 2처럼 인버전별로 서로 다른 운지 형태를 사용합니다.'),
      h('div', { class: 'grid diagrams' }, [['1', '기본형'], ['3', '1전위'], ['5', '2전위']].map(([iv, name]) => { const bass = N.spell(root, iv); const list = GH.voicings.generate(root, 'maj', 'triad').filter(v => v.bassIv === iv && v.strSet === '4-3-2'); const v = list[0]; return v ? GH.render.chordCard(v, { pref, title: c.symbol + (iv === '1' ? '' : '/' + N.pretty(bass)), sub: name }) : null; }))));
    el.appendChild(section('슬래시 코드', h('p', null, 'C/E는 C 코드의 베이스음을 E로 지정한 표기입니다. 인버전을 나타내거나(C/E, C/G), 코드톤이 아닌 베이스음을 지정할 수 있습니다(C/D, F/G). 베이스 라인을 매끄럽게 연결할 때 자주 씁니다.'),
      h('div', { class: 'toc' }, h('a', { href: A.reharmHref('bass_line') }, '베이스 라인 리하모니제이션 →'), h('a', { href: A.reharmHref('pedal_point') }, '페달 포인트 →'))));
    el.appendChild(section('하이브리드 코드와 폴리코드', h('p', null, '베이스 위에 그 음을 포함하지 않는 트라이어드를 얹은 것이 하이브리드 코드 (G/C, F/G). 두 코드를 위아래로 겹친 것이 폴리코드 (D/C7 처럼 가로줄로 적기도 함). 어퍼 스트럭처 트라이어드는 도미넌트 위의 폴리코드입니다.')));
  }
})();
