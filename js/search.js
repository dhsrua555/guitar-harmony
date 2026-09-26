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
    add('페이지', '멜로디 → 코드 찾기', '연습 · 도구', ['melody', '멜로디', '코드 붙이기', '하모나이즈', '반주 만들기', '작곡', '격자', '피아노 롤', 'piano roll', '코드 진행 추천', '화음 넣기'], '#/tools/melody');
    add('페이지', '기본 코드 폼', '기타 · 보이싱', ['voicing', 'chord', '오픈 포지션', 'caged', '이동형', '바레', '파워 코드'], '#/guitar/voicings/basic');
    add('페이지', '재즈·확장 보이싱', '기타 · 보이싱', ['voicing', '드롭2', 'drop 2', '셸', '가이드 톤', '텐션', 'quartal'], '#/guitar/voicings/advanced');
    add('페이지', '트라이어드 · 아르페지오', '기타 탭', ['triad', 'arpeggio', '3화음'], '#/guitar/triads');
    add('페이지', '스케일 포지션', '기타 탭', ['scale', 'position', 'caged', '3nps', '펜타토닉 박스'], '#/guitar/scales');
    add('페이지', '릭', '기타 탭', ['lick', 'phrase', '프레이즈', '솔로'], '#/guitar/licks');
    add('페이지', '세션별 기본기 연습', '연습', ['technique', 'exercise', '기본기', '워밍업', '손풀기', '손 풀기', '루틴', '연습 루틴', '입시', '음대'], '#/technique');
    add('페이지', '기타 기본기', '기본기 연습', ['guitar', '기타', '크로매틱', 'chromatic', '1234', '신경분리', '손가락 독립', 'finger independence', '스파이더', 'spider', '트릴', '얼터네이트', 'alternate picking', '피킹', '레가토', 'legato'], '#/technique/guitar');
    add('페이지', '베이스 코드톤 자리', '베이스', ['bass chord', '베이스 코드', '아르페지오', '코드톤'], '#/bass/chords');
    add('페이지', '베이스 스케일 포지션', '베이스', ['bass scale', '베이스 스케일', '4현', '펜타토닉 베이스'], '#/bass/scales');
    add('페이지', '베이스 코드 파인더', '베이스', ['bass finder'], '#/bass/finder');
    add('페이지', '건반 코드 보이싱', '키보드', ['piano voicing', '피아노 코드', '건반 코드', '전위', '반주'], '#/keys/voicings');
    add('페이지', '건반 재즈 보이싱', '키보드', ['rootless', '루트리스', '셸', 'shell', '쿼탈', 'so what', '어퍼 스트럭처', 'drop 2 piano'], '#/keys/voicings/advanced');
    add('페이지', '건반 스케일 · 운지', '키보드', ['piano scale', '피아노 스케일', '운지', 'fingering', '엄지 넘기기'], '#/keys/scales');
    add('페이지', '건반 코드 파인더', '키보드', ['piano chord finder', '건반 파인더'], '#/keys/finder');
    add('페이지', '스케일 부르기', '보컬', ['sing scale', '노래 스케일', '계이름', '발성 스케일'], '#/vocal/scales');
    add('페이지', '코드톤 · 화음 나누기', '보컬', ['합창', '코러스', '화음', '4성부', 'SATB'], '#/vocal/chords');
    add('페이지', '루디먼트 · 스틱 컨트롤', '드럼', ['rudiment', '스틱 컨트롤', 'stick control', '스네어 연습', '패드'], '#/drums/rudiments');
    add('페이지', '그루브 · 필인', '드럼', ['groove', 'fill', '드럼 비트', '셔플', '보사노바', '디스코'], '#/drums/grooves');
    add('페이지', '찹 · 컴비네이션', '드럼', ['chops', 'chop', '찹', 'combination', '컴비네이션', '손발 조합', '식스 스트로크', '버스트', '가스펠'], '#/drums/chops');
    add('페이지', '베이스 기본기', '기본기 연습', ['bass', '베이스', '투핑거', '시만들', '워킹', 'walking', '슬랩', 'slap', '데드 노트'], '#/technique/bass');
    add('페이지', '키보드 기본기', '기본기 연습', ['keys', 'piano', '키보드', '피아노', '하논', 'hanon', '케이던스', 'cadence', '스케일 운지', '아르페지오', '알베르티'], '#/technique/keys');
    add('페이지', '드럼 기본기', '기본기 연습', ['drums', '드럼', '루디먼트', 'rudiment', '패러디들', 'paradiddle', '싱글 스트로크', '더블 스트로크', '그루브', '고스트 노트', '필인', '리니어'], '#/technique/drums');
    add('페이지', '보컬 기본기', '기본기 연습', ['vocal', 'voice', '보컬', '노래', '발성', '호흡', '롱톤', '립 트릴', '시창', '멜리스마', '런', '화음'], '#/technique/vocal');
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
    /* 세션 코스에만 있는 레슨 (베이스 · 키보드 · 드럼 · 보컬) */
    (GH.data.courseLessons || []).forEach(l => { const C = (GH.data.courseSessions || {})[l.sess] || {}; add('레슨', l.title, '기초 코스 · ' + (C.ko || ''), [l.id, l.lead, C.ko || ''].concat((l.terms || []).map(t => t[0] + ' ' + t[1])), '#/learn/' + l.id + '?s=' + l.sess); });
    GH.data.glossary.forEach(g => add('용어', g.ko, g.en, [g.def.slice(0, 40)], '#/glossary?q=' + encodeURIComponent(g.ko)));
    (GH.data.technique || []).forEach(x => { const c = GH.data.techCats.find(k => k.id === x.cat); const I = GH.data.techInst.find(k => k.id === x.inst); add('기본기', x.ko, I.ko + ' 기본기 · ' + c.ko, [x.id, c.en, c.ko, I.ko, I.en, '기본기', '연습'], '#/technique/' + x.inst + '/' + x.id); });
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
