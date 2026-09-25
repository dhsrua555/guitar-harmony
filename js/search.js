/* 통합 검색 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, clear } = GH.ui;
  let index = null;
  const norm = s => String(s || '').toLowerCase().replace(/\s+/g, '').replace(/♯/g, '#').replace(/♭/g, 'b');
  function build() {
    const ix = [];
    const add = (type, title, sub, keys, route) => ix.push({ type, title, sub: sub || '', keys: norm([title, sub].concat(keys || []).join('|')), route });
    add('페이지', '홈', '검색과 바로가기', ['home'], '#/');
    add('페이지', '배우기 (로드맵)', '처음이라면 여기서부터', ['learn', '입문', '초보', '시작', '로드맵', '기초'], '#/learn');
    add('페이지', '기타 홈', '기타 섹션', ['guitar'], '#/guitar');
    add('페이지', '화성학 홈', '화성학 섹션', ['theory', '이론'], '#/theory');
    add('페이지', '연습 홈', '연습 · 도구 섹션', ['practice', '도구'], '#/practice');
    add('페이지', '백킹 트랙', '연습', ['backing', 'backing track', '반주', '드럼', '베이스', '잼', 'jam', '메트로놈'], '#/backing');
    add('페이지', '더블스탑', '기타', ['double stop', 'doublestop', '3도', '6도', '옥타브', '두 줄', '화음 연주'], '#/guitar/doublestops');
    add('페이지', '솔로 프레이즈 만들기', '기타', ['phrase', 'phrasing', '솔로', '즉흥', '코드톤', '어프로치', 'approach', '인클로저', 'enclosure', '패싱', 'passing', '이웃음', '가이드 톤', 'bebop', '비밥'], '#/guitar/phrasing');
    add('페이지', '리듬 연습', '연습', ['rhythm', '리듬', '메트로놈', 'metronome', '박자', '스트럼', 'strum', '싱코페이션', '셋잇단', '16분', '탭', '갭 트레이닝'], '#/rhythm');
    add('퀴즈', '리듬 듣고 맞히기', '이어 트레이닝', ['rhythm', '리듬 청음', '리듬 받아쓰기'], '#/ear?tab=rhythm');
    add('페이지', '멜로디 화음 쌓기', '연습 · 도구', ['harmony', 'harmonize', '화음', '보이스', '성부', '3도 화음', '6도', '하모니 라인', '코러스', '더블링', 'voice'], '#/tools/harmony');
    add('페이지', '멜로디 → 코드 찾기', '연습 · 도구', ['melody', '멜로디', '코드 붙이기', '하모나이즈', '반주 만들기', '작곡'], '#/tools/melody');
    add('페이지', '기본 코드 폼', '기타 · 보이싱', ['voicing', 'chord', '오픈 포지션', 'caged', '이동형', '바레', '파워 코드'], '#/guitar/voicings/basic');
    add('페이지', '재즈·확장 보이싱', '기타 · 보이싱', ['voicing', '드롭2', 'drop 2', '셸', '가이드 톤', '텐션', 'quartal'], '#/guitar/voicings/advanced');
    add('페이지', '트라이어드 · 아르페지오', '기타 탭', ['triad', 'arpeggio', '3화음'], '#/guitar/triads');
    add('페이지', '스케일 포지션', '기타 탭', ['scale', 'position', 'caged', '3nps', '펜타토닉 박스'], '#/guitar/scales');
    add('페이지', '릭', '기타 탭', ['lick', 'phrase', '프레이즈', '솔로'], '#/guitar/licks');
    add('페이지', '인터벌 (Interval)', '화성학', ['interval', '인터벌', '음정', '도수'], '#/theory/intervals');
    add('페이지', '코드 이론', '화성학 탭', ['chord', '다이어토닉', '텐션', '코드 빌더', '표기법'], '#/theory/chords');
    add('페이지', '스케일 이론', '화성학 탭', ['scale', '5도권', 'circle of fifths', '조표', '코드 스케일'], '#/theory/scales');
    add('페이지', '모드', '화성학 탭', ['mode', '선법', '밝기'], '#/theory/modes');
    add('페이지', '코드 진행', '화성학 탭', ['progression', '케이던스', '로마 숫자', '기능'], '#/theory/progressions');
    add('페이지', '리하모니제이션', '화성학 탭', ['reharm', 'reharmonization', '대체', '세컨더리', '트라이톤'], '#/theory/reharm');
    add('페이지', '곡 분석', '도구', ['song', 'analysis', 'autumn leaves', 'blues'], '#/songs');
    add('페이지', '이어 트레이닝', '연습', ['ear training', '청음', '음감', '인터벌 퀴즈', '음정 퀴즈', '계이름', '루트', '근음', '퀴즈'], '#/ear');
    add('퀴즈', '계이름 맞추기 (메이저 스케일)', '이어 트레이닝', ['solfege', '음감', '도레미', '상대음감'], '#/ear?tab=degree');
    add('퀴즈', '인터벌 맞추기', '이어 트레이닝', ['interval', '인터벌', '음정', '청음'], '#/ear?tab=interval');
    add('퀴즈', '코드 진행 듣고 루트 계이름 맞추기', '이어 트레이닝', ['root', '루트', '근음', '진행', '베이스'], '#/ear?tab=root');
    add('퀴즈', '코드 퀄리티 맞추기', '이어 트레이닝', ['chord quality', '코드 종류'], '#/ear?tab=chord');
    add('퀴즈', '모드 맞추기', '이어 트레이닝', ['mode', '선법'], '#/ear?tab=mode');
    add('퀴즈', '코드 진행 맞추기', '이어 트레이닝', ['progression', '진행'], '#/ear?tab=prog');
    add('페이지', '용어집', '도구', ['glossary', '용어'], '#/glossary');
    add('페이지', '코드 파인더', '도구', ['finder', '지판 눌러서 코드 찾기'], '#/tools/finder');
    add('페이지', '버그 제보함', '도움', ['bug', 'report', '버그', '오류', '에러', '제보', '신고', '고장', '안 돼요', '안돼요', '문의', '건의'], '#/bug');
    GH.chords.QUALITIES.forEach(q => add('코드 퀄리티', q.ko + ' (' + (q.sym || 'maj') + ')', q.intervals.join(' '), [q.id, q.sym, q.jazz].concat(q.aliases || []), '#/theory/chords?q=' + q.id));
    GH.chords.CATEGORY_ORDER.forEach(c => add('코드 분류', GH.chords.CATEGORY_KO[c], GH.chords.QUALITIES.filter(q => q.category === c).map(q => q.sym || 'maj').join(' '), [c], '#/theory/chords?tab=types&cat=' + c));
    GH.scales.SCALES.forEach(s => {
      const isMode = ['ionian', 'melodic_minor', 'harmonic_minor'].includes(s.parent) && s.modeIndex !== 1 || ['dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'].includes(s.id);
      add(isMode ? '모드' : '스케일', s.ko, s.en, [s.id, s.intervals.join(' ')], isMode ? '#/theory/modes/' + encodeURIComponent(s.id) : '#/theory/scales/' + encodeURIComponent(s.id));
    });
    GH.data.progressions.forEach(p => add('코드 진행', p.ko, p.en, [p.id].concat(p.genres.map(g => GH.data.genres[g])).concat(p.songs || []), '#/theory/progressions/' + encodeURIComponent(p.id)));
    GH.data.licks.forEach(l => add('릭', l.ko, l.over + ' · ' + GH.data.lickGenres[l.genre], [l.id, l.genre, l.key, l.scale].concat(l.qIds || []), '#/guitar/licks/' + l.id));
    GH.data.reharm.forEach(r => add('리하모니', r.ko, r.en, [r.id, r.summary], '#/theory/reharm/' + encodeURIComponent(r.id)));
    (GH.data.course || []).forEach(ch => ch.lessons.forEach(l => add('레슨', l.title, '기초 코스 ' + ch.n + '장 · ' + ch.title, [l.id, l.lead].concat((l.terms || []).map(t => t[0] + ' ' + t[1])), '#/learn/' + l.id)));
    GH.data.glossary.forEach(g => add('용어', g.ko, g.en, [g.def.slice(0, 40)], '#/glossary?q=' + encodeURIComponent(g.ko)));
    GH.data.songs.forEach(s => add('곡 분석', s.ko, s.key + ' ' + s.form, [s.id], '#/songs/' + encodeURIComponent(s.id)));
    return ix;
  }
  function query(q) {
    if (!index) index = build();
    const nq = norm(q);
    if (!nq) return [];
    const out = [];
    /* 코드 심볼 직접 입력 */
    const parsed = GH.chords.parseSymbol(q.trim());
    if (parsed && /^[A-Ga-g]/.test(q.trim())) {
      const c = GH.chords.buildChord(parsed.root, parsed.qId);
      if (c) out.push({ type: '코드', title: c.symbol, sub: c.notes.map(n => GH.notes.pretty(n.name)).join(' '), route: '#/chord/' + encodeURIComponent(c.root) + '/' + c.qId, score: 100 });
    }
    index.forEach(e => {
      const t = norm(e.title);
      let score = 0;
      if (t === nq) score = 90; else if (t.startsWith(nq)) score = 70; else if (t.includes(nq)) score = 50; else if (e.keys.includes(nq)) score = 30;
      if (score) out.push(Object.assign({ score }, e));
    });
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, 14);
  }
  function bind(input, box) {
    let sel = -1; let results = [];
    const render = () => {
      clear(box);
      if (!results.length) { box.hidden = true; input.setAttribute('aria-expanded', 'false'); return; }
      results.forEach((r, i) => box.appendChild(h('a', { href: r.route, class: i === sel ? 'sel' : '', role: 'option', 'aria-selected': i === sel ? 'true' : 'false', onclick: () => { box.hidden = true; input.setAttribute('aria-expanded', 'false'); input.value = ''; } }, h('span', { class: 'type' }, r.type), h('span', null, r.title), h('span', { class: 'sub' }, r.sub))));
      box.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    };
    input.addEventListener('input', () => { results = query(input.value); sel = -1; render(); });
    input.addEventListener('focus', () => { if (input.value) { results = query(input.value); render(); } });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { sel = Math.min(results.length - 1, sel + 1); render(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); render(); e.preventDefault(); }
      else if (e.key === 'Enter') { const r = results[sel >= 0 ? sel : 0]; if (r) { location.hash = r.route; box.hidden = true; input.setAttribute('aria-expanded', 'false'); input.value = ''; input.blur(); } }
      else if (e.key === 'Escape') { box.hidden = true; input.setAttribute('aria-expanded', 'false'); input.blur(); }
    });
    document.addEventListener('click', e => { if (!box.contains(e.target) && e.target !== input) { box.hidden = true; input.setAttribute('aria-expanded', 'false'); } });
  }
  GH.search = { query, bind, rebuild: () => { index = null; } };
})();
