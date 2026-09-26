/* 홈: 큰 타이포 히어로 + 튀는 공 악보, 흐르는 띠, 번호 카드, 원형 경계 섹션 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, svg } = GH.ui; const N = GH.notes;
  const I = (name, o) => GH.icon(name, o);
  const K = () => GH.sketch;

  /* 히어로 그림: 오선 위 여섯 음을 노란 공이 차례로 튀며 지나간다. 누르면 그 음들을 들려준다 */
  const MELODY = [
    { x: 150, y: 230, up: true, midi: 67 }, { x: 215, y: 220, up: true, midi: 69 },
    { x: 280, y: 200, up: false, midi: 72 }, { x: 345, y: 190, up: false, midi: 74 },
    { x: 410, y: 180, up: false, midi: 76 }, { x: 470, y: 160, up: false, midi: 79 }
  ];
  /* ---- 손그림 악보 조각 (글꼴 대신 펜으로 그은 선) ---- */
  /* 점들을 조금씩 흔들어 두 번 긋는다: 굵은 선 한 번 + 가는 선 한 번 */
  function penStroke(pts, seed, cls, amp) {
    const r = K().rng(seed), a = amp == null ? 0.9 : amp;
    const shake = () => pts.map(([x, y]) => [x + (r() - 0.5) * a * 2, y + (r() - 0.5) * a * 2]);
    const g = svg('g', { class: cls });
    g.appendChild(K().path(K().curve(shake(), false), 'pen-main'));
    g.appendChild(K().path(K().curve(shake(), false), 'pen-hair'));
    return g;
  }
  /* 높은음자리표: 꼬리 점 → 꼬리 → 기둥 → 위 고리 → 배 → G 줄(y=230)을 감는 소용돌이. 오선 간격 20 */
  const CLEF = [[48, 280], [52, 290], [62, 292], [70, 282], [71, 262], [68, 230], [65, 200], [62, 168], [60, 142], [62, 124], [71, 114], [80, 121],
    [80, 139], [71, 159], [59, 178], [45, 196], [35, 218], [36, 243], [48, 259], [66, 264], [84, 256], [92, 236], [85, 214], [70, 205], [55, 211],
    [50, 227], [58, 239], [70, 236], [70, 227]];
  const CLEF_BELLY = CLEF.slice(14, 23); /* 배 부분은 펜을 눌러 그은 듯 한 번 더 굵게 */
  function sketchClef(dx, dy) {
    const g = svg('g', { class: 'ha-clef', transform: 'translate(' + dx + ' ' + dy + ')' });
    g.appendChild(penStroke(CLEF, 17, 'pen'));
    g.appendChild(K().path(K().curve(CLEF_BELLY.map(([x, y]) => [x + 0.6, y + 0.4]), false), 'pen-weight'));
    g.appendChild(K().path(K().blob(47, 279, 6.4, 5.8, { points: 8, wobble: 0.1 }), 'ha-clef-dot'));
    return g;
  }
  /* 음표 머리: 칠은 살짝 어긋나고, 테두리는 한 바퀴를 조금 넘겨 그린다 */
  function sketchHead(x, y, cls) {
    const g = svg('g', { class: cls || '', transform: 'rotate(-22 ' + x + ' ' + y + ')' });
    g.appendChild(K().path(K().blob(x + 1, y + 0.8, 12.4, 8.8, { points: 9, wobble: 0.1 }), 'ha-head'));
    g.appendChild(K().path(K().ellipse(x, y, 13.2, 9.6, { points: 10, overshoot: 0.18, wobble: 0.1 }), 'ha-head-ink'));
    return g;
  }
  /* 빔: 네 귀퉁이를 흔든 굵은 띠 + 위아래 가장자리를 한 번씩 긋기 */
  function sketchBeam(x1, y1, x2, y2, t, seed) {
    const r = K().rng(seed), w = () => (r() - 0.5) * 1.8;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const g = svg('g', { class: 'ha-beam-g' });
    g.appendChild(K().path(K().curve([[x1 + w(), y1 + w()], [mx + w(), my + w() - 0.6], [x2 + w(), y2 + w()], [x2 + w(), y2 + t + w()], [mx + w(), my + t + w() + 0.6], [x1 + w(), y1 + t + w()]], true), 'ha-beam'));
    g.appendChild(K().path(K().line(x1, y1, x2, y2, { passes: 1, overshoot: 2.2, jitter: 1 }) + K().line(x1, y1 + t, x2, y2 + t, { passes: 1, overshoot: 2.2, jitter: 1 }), 'ha-beam-ink'));
    return g;
  }
  /* 떠다니는 기호 (44 × 44 칸 안에 손으로) */
  function sketchSymbol(name) {
    const L = (a, b, c, d, o) => K().line(a, b, c, d, Object.assign({ passes: 2, jitter: 1, overshoot: 1.6 }, o));
    const box = svg('svg', { width: 44, height: 44, viewBox: '0 0 44 44', overflow: 'visible' });
    const ink = d => box.appendChild(K().path(d, 'ha-f-ink'));
    const fill = d => box.appendChild(K().path(d, 'ha-f-fill'));
    if (name === 'sharp') { ink(L(17, 6, 15, 40) + L(29, 4, 27, 38)); ink(L(8, 17, 36, 11, { bow: 1.6 }) + L(8, 30, 36, 24, { bow: 1.6 })); }
    else if (name === 'flat') { ink(L(14, 3, 14, 40)); ink(K().curve([[14, 40], [26, 31], [30, 23], [24, 19], [14, 25]], false) + K().curve([[15, 39], [25, 31.5], [28.5, 23.5], [23.5, 20.5], [15, 26]], false)); }
    else if (name === 'note') { fill(K().blob(15, 33, 8.5, 6, { points: 8, wobble: 0.12 })); ink(K().ellipse(14.4, 32.6, 9, 6.4, { points: 9, overshoot: 0.2 })); ink(L(22.5, 31, 23, 5)); ink(K().curve([[23, 5], [30, 12], [36, 17], [34, 26]], false)); }
    else { fill(K().blob(10, 35, 7, 5, { points: 8, wobble: 0.12 }) + K().blob(31, 31, 7, 5, { points: 8, wobble: 0.12 })); ink(L(16.5, 34, 17, 8) + L(37.5, 30, 38, 4)); box.appendChild(K().path(K().curve([[17, 8], [27, 5.5], [38, 3.5], [38, 9], [27, 11], [17, 13.5]], true), 'ha-f-fill')); }
    return box;
  }
  function heroArt() {
    const el = svg('svg', { class: 'hero-art-svg', viewBox: '0 0 540 420', role: 'img', 'aria-label': '오선 위 여섯 음과 그 위를 튀는 공. 누르면 소리가 납니다' });
    /* 잉크로 그린 해: 칠은 살짝 어긋나고, 오른쪽 아래에 빗금 그림자 */
    el.appendChild(K().path(K().blob(303, 215, 187, 186, { points: 14, wobble: 0.02 }), 'ha-circle'));
    el.appendChild(K().path(K().hatchCircle(300, 212, 184, { gap: 7, from: 0.62 }), 'ha-hatch'));
    el.appendChild(K().path(K().ellipse(300, 212, 188, 188, { points: 26, overshoot: 0.05, wobble: 0.012 }), 'ha-ink'));
    el.appendChild(K().path(K().ellipse(300, 212, 206, 206, { points: 30, overshoot: 0.02, wobble: 0.01 }), 'ha-ring'));
    let staffD = ''; [170, 190, 210, 230, 250].forEach(y => { staffD += K().line(22, y, 522, y, { passes: 2, bow: 1.4, overshoot: 2 }); });
    el.appendChild(K().path(staffD, 'ha-line'));
    el.appendChild(sketchClef(0, 0));
    const heads = [];
    const beam = (a, b) => {
      const A = MELODY[a], B = MELODY[b];
      const sx = p => p.x + (p.up ? 11 : -11), ey = p => p.y + (p.up ? -62 : 62);
      const t = A.up ? 9 : -9;
      el.appendChild(sketchBeam(sx(A) - 1.5, ey(A), sx(B) + 1.5, ey(B), t, K().seedOf(A.x, B.x)));
    };
    MELODY.forEach(p => {
      const g = svg('g', { class: 'ha-note' });
      const stx = p.x + (p.up ? 11 : -11);
      g.appendChild(K().path(K().line(stx, p.y + (p.up ? -3 : 3), stx, p.y + (p.up ? -62 : 62), { passes: 2, overshoot: 1, jitter: 0.8 }), 'ha-stem'));
      g.appendChild(sketchHead(p.x, p.y));
      el.appendChild(g); heads.push(g);
    });
    beam(0, 1); beam(2, 3); beam(4, 5);
    [['ha-f1', 470, 70, 'sharp', .22], ['ha-f2', 70, 330, 'flat', -.12], ['ha-f3', 510, 330, 'note', .3], ['ha-f4', 110, 70, 'notes', -.18]].forEach(([cls, x, y, name, speed]) => {
      const g = svg('g', { class: 'ha-float ' + cls, 'data-speed': speed });
      const ic = sketchSymbol(name); ic.setAttribute('x', x - 22); ic.setAttribute('y', y - 22);
      g.appendChild(ic); el.appendChild(g);
    });
    const land = p => ({ x: p.x - (p.up ? 4 : 0), y: p.up ? p.y - 62 - 20 : p.y - 30 });
    const pts = MELODY.map(land);
    const ball = svg('g', { class: 'ha-ball', transform: `translate(${pts[0].x} ${pts[0].y})` });
    ball.appendChild(K().path(K().blob(0.8, 0.6, 15, 14.6, { points: 9, wobble: 0.05 }), 'ha-ball-fill'));
    ball.appendChild(K().path(K().ellipse(0, 0, 15.4, 15, { points: 11 }), 'ha-ball-ink'));
    ball.appendChild(K().path('M-6 -8C-3 -11 3 -11 6 -8', 'ha-ball-shine'));
    el.appendChild(ball);
    const sticker = h('button', { class: 'sticker hero-sticker', type: 'button' }, I('play', { size: 16 }), h('span', null, '눌러서', h('br'), '듣기'));
    const wrap = h('div', { class: 'hero-art' }, el, sticker);
    bounce(el, ball, pts, heads, wrap, sticker);
    return wrap;
  }
  function bounce(el, ball, pts, heads, wrap, sticker) {
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const HOP = 430, REST = 1500;
    let t0 = null, raf = 0, landed = -1, sound = false, visible = true;
    const place = (x, y) => { ball.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')'); };
    const light = k => { heads.forEach((g, i) => g.classList.toggle('lit', i === k)); };
    const pluck = k => { const A = GH.audio; if (!sound || !A || !A.context()) return; A.pluck(MELODY[k].midi, A.now() + 0.01, 1.1, { gain: 0.85 }); };
    function frame(t) {
      raf = 0;
      if (!el.isConnected) return;
      if (t0 == null) t0 = t;
      const e = t - t0, n = pts.length;
      const k = Math.floor(e / HOP);
      if (k - 1 > landed && k - 1 < n) { landed = k - 1; light(landed); pluck(landed); }
      if (k >= n) {
        place(pts[n - 1].x, pts[n - 1].y);
        if (e > HOP * n + 260) light(-1);
        if (e > HOP * n + REST) { t0 = t; landed = -1; sound = false; wrap.classList.remove('playing'); if (reduce) return; }
      } else if (reduce) {
        const at = pts[Math.max(0, landed)]; place(at.x, at.y); /* 움직임 줄이기: 공은 음마다 순간 이동 */
      } else {
        const p = (e % HOP) / HOP;
        const a = k === 0 ? { x: pts[0].x - 70, y: pts[0].y - 150 } : pts[k - 1], b = pts[k];
        const q = k === 0 ? p * p : p; /* 첫 음은 위에서 떨어진다 */
        place(a.x + (b.x - a.x) * q, a.y + (b.y - a.y) * q - (k === 0 ? 0 : Math.sin(Math.PI * p) * 48));
      }
      if (visible || sound) raf = requestAnimationFrame(frame);
    }
    const start = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const play = () => { sound = true; t0 = null; landed = -1; wrap.classList.add('playing'); start(); };
    el.addEventListener('click', play); sticker.addEventListener('click', play);
    if (reduce) { place(pts[0].x, pts[0].y); return; }
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (!el.isConnected) { io.disconnect(); return; } if (visible) start(); }, { threshold: 0.15 });
      io.observe(wrap);
    }
    start();
  }

  /* 흐르는 띠 */
  function marquee(words) {
    const unit = () => h('span', { class: 'mq-unit' }, words.map(w => [h('span', null, w), I('note', { cls: 'mq-ic' })]));
    return h('div', { class: 'marquee', 'aria-hidden': 'true' }, h('div', { class: 'mq-track' }, unit(), unit()));
  }
  const displayHead = (ko, en, sub, cls) => h('div', { class: 'display-head' + (cls ? ' ' + cls : '') }, h('span', { class: 'en' }, en), h('h2', null, ko), sub ? h('p', null, sub) : null);

  GH.pages['/'] = {
    title: '홈',
    render(el) {
      const A = GH.app; const key = A.key();

      /* 히어로 + 큰 검색 */
      const input = h('input', { type: 'search', class: 'home-search-input', placeholder: '코드, 스케일, 진행을 검색 (예: Cmaj7, 도리안, ii-V-I)', autocomplete: 'off', spellcheck: 'false', 'aria-label': '검색' });
      const results = h('div', { class: 'search-results home-results', role: 'listbox', hidden: true });
      GH.search.bind(input, results);
      el.appendChild(h('section', { class: 'home-hero' },
        h('div', { class: 'wrap hero-grid' },
          h('div', { class: 'hero-copy' },
            h('span', { class: 'eyebrow' }, 'BAND · HARMONY · EAR TRAINING'),
            h('h1', { class: 'hero-title' }, h('span', { class: 'ln' }, '화성학과'), h('span', { class: 'ln hot' }, '악기')),
            h('p', { class: 'hero-lead' }, '기타 · 베이스 · 키보드 · 드럼 · 보컬 기본기부터 코드 진행, 스케일, 음감 훈련까지. 쉬운 것은 앞에, 어려운 것은 안쪽에 두었습니다.'),
            h('div', { class: 'home-search', role: 'search' }, h('span', { class: 'search-icon', 'aria-hidden': 'true' }, I('search')), input, results)),
          heroArt())));
      el.appendChild(marquee(['GUITAR', 'BASS', 'KEYS', 'DRUMS', 'VOCAL', 'CHORDS', 'SCALES', 'PROGRESSIONS', 'EAR TRAINING', 'RHYTHM', 'VOICINGS', 'MODES']));

      /* 맞춤 가이드 (처음 방문이면 설문 창) */
      if (GH.guide) {
        el.appendChild(h('div', { class: 'wrap home-guide reveal' }, GH.guide.homeCard()));
        if (GH.guide.shouldOnboard() && document.getElementById('app') === el) {
          const open = () => setTimeout(() => { if (document.body.contains(el) && GH.guide.shouldOnboard()) GH.guide.openOnboarding({ onDone: () => GH.router.rerender() }); }, 450);
          if (GH.intro && GH.intro.active()) GH.intro.after(open); else open();
        }
      }

      /* 무엇을 할까요: 세 갈래 */
      let root = key, q = 'maj';
      const rootSel = A.rootSelect(root, v => { root = v; });
      const qSel = A.qualitySelect(q, v => { q = v; }, x => x.level <= 2);
      const go = () => h('span', { class: 'path-go', 'aria-hidden': 'true' }, I('arrow'));
      el.appendChild(h('section', { class: 'wrap home-paths reveal' },
        displayHead('무엇을 할까요?', "WHAT'S NEXT", '세 갈래 중 하나를 고르세요. 어디서 시작해도 서로 이어집니다.'),
        h('div', { class: 'path-grid' },
          h('a', { href: '#/learn', class: 'path-card c-pink' },
            h('span', { class: 'path-num' }, '01'), h('span', { class: 'path-ic', 'aria-hidden': 'true' }, I('learn')),
            h('div', { class: 'title' }, '처음이라면, 기초 코스'), h('p', null, '음 이름부터 코드, 리듬, 스케일, 코드 진행까지 23개의 짧은 레슨. 한 장에 개념 하나씩, 듣고 쳐 보고 문제로 확인합니다.'),
            h('span', { class: 'sticker path-sticker', 'aria-hidden': 'true' }, 'START', h('br'), 'HERE'), go()),
          h('div', { class: 'path-card c-sun' },
            h('span', { class: 'path-num' }, '02'), h('span', { class: 'path-ic', 'aria-hidden': 'true' }, I('chord')),
            h('div', { class: 'title' }, '코드 하나 찾아보기'), h('p', null, '구성음, 잡는 법, 어울리는 스케일과 진행을 한 페이지에서.'),
            h('div', { class: 'quick-start-form' }, h('label', null, h('span', null, '루트'), rootSel), h('label', null, h('span', null, '타입'), qSel), h('button', { class: 'btn primary', type: 'button', onclick: () => { GH.router.go('/chord/' + encodeURIComponent(root) + '/' + q); } }, '코드 열기'))),
          h('a', { href: '#/practice', class: 'path-card c-sky' },
            h('span', { class: 'path-num' }, '03'), h('span', { class: 'path-ic', 'aria-hidden': 'true' }, I('headphones')),
            h('div', { class: 'title' }, '귀와 손 연습하기'), h('p', null, '계이름 · 인터벌 · 코드 퀴즈로 음감을 기르고, 메트로놈과 백킹 트랙 위에서 연주합니다.'), go()))));

      /* 더 깊이: 섹션별 링크 (둥근 경계의 색 띠) */
      const secs = A.SECTIONS.filter(s => s.items.length);
      el.appendChild(h('section', { class: 'band band-pink curve-top home-more' },
        h('div', { class: 'wrap reveal' },
          displayHead('더 깊이 들어가기', 'DEEP DIVE', '기초는 앞에, 심화는 뒤에 있습니다. 옆의 p · mp · mf · f · ff 는 난이도예요 (p 입문 → ff 고급).'),
          h('div', { class: 'home-more-grid' }, secs.map(s => h('div', { class: 'home-more-col' },
            h('a', { class: 'home-more-head', href: '#' + s.path }, h('span', { class: 'hm-ic', 'aria-hidden': 'true' }, I(s.icon)), h('span', null, s.label, h('small', null, s.en))),
            h('ul', { class: 'plain home-more-list' }, s.items.map(([p, label, level]) => h('li', null, h('a', { href: '#' + p }, I(GH.icon.forRoute(p), { cls: 'li-ic' }), label), A.levelBadge(level))))))))));

      /* 현재 키의 다이어토닉 코드: 리드 시트처럼 */
      const dia = GH.chords.diatonic(key, 'ionian', false);
      el.appendChild(h('section', { class: 'band band-sky curve-top home-key' },
        h('div', { class: 'wrap reveal' },
          h('div', { class: 'home-key-head' }, h('div', null, h('span', { class: 'en' }, 'KEY OF ' + N.pretty(key).toUpperCase()), h('h2', null, N.pretty(key) + ' 메이저의 기본 코드')), h('span', { class: 'home-key-note' }, '상단 키를 바꾸면 사이트 전체가 따라옵니다')),
          h('div', { class: 'sheet' }, A.chordStrip(dia.map(d => Object.assign(d.chord, { roman: d.roman, fn: d.fn })), { link: true })))));
    }
  };
})();
