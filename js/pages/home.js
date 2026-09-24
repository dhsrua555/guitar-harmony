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
  function heroArt() {
    const el = svg('svg', { class: 'hero-art-svg', viewBox: '0 0 540 420', role: 'img', 'aria-label': '오선 위 여섯 음과 그 위를 튀는 공. 누르면 소리가 납니다' });
    /* 잉크로 그린 해: 칠은 살짝 어긋나고, 오른쪽 아래에 빗금 그림자 */
    el.appendChild(K().path(K().blob(303, 215, 187, 186, { points: 14, wobble: 0.02 }), 'ha-circle'));
    el.appendChild(K().path(K().hatchCircle(300, 212, 184, { gap: 7, from: 0.62 }), 'ha-hatch'));
    el.appendChild(K().path(K().ellipse(300, 212, 188, 188, { points: 26, overshoot: 0.05, wobble: 0.012 }), 'ha-ink'));
    el.appendChild(K().path(K().ellipse(300, 212, 206, 206, { points: 30, overshoot: 0.02, wobble: 0.01 }), 'ha-ring'));
    let staffD = ''; [170, 190, 210, 230, 250].forEach(y => { staffD += K().line(22, y, 522, y, { passes: 2, bow: 1.4, overshoot: 2 }); });
    el.appendChild(K().path(staffD, 'ha-line'));
    el.appendChild(svg('text', { class: 'ha-clef', x: 34, y: 262 }, '\u{1D11E}'));
    const heads = [];
    const beam = (a, b) => {
      const A = MELODY[a], B = MELODY[b];
      const sx = p => p.x + (p.up ? 11 : -11), ey = p => p.y + (p.up ? -62 : 62);
      const t = A.up ? 9 : -9, j = K().rng(K().seedOf(A.x, B.x)), w = () => (j() - 0.5) * 1.6;
      el.appendChild(svg('path', { class: 'ha-beam', d: `M${sx(A) - 1 + w()},${ey(A) + w()} L${sx(B) + 1.5 + w()},${ey(B) + w()} L${sx(B) + 1 + w()},${ey(B) + t + w()} L${sx(A) - 1.5 + w()},${ey(A) + t + w()} Z` }));
    };
    MELODY.forEach(p => {
      const g = svg('g', { class: 'ha-note' });
      const stx = p.x + (p.up ? 11 : -11);
      g.appendChild(K().path(K().line(stx, p.y + (p.up ? -3 : 3), stx, p.y + (p.up ? -62 : 62), { passes: 2, overshoot: 1, jitter: 0.8 }), 'ha-stem'));
      g.appendChild(K().path(K().blob(p.x, p.y, 13, 9.5, { points: 9, wobble: 0.08 }), 'ha-head', { transform: `rotate(-22 ${p.x} ${p.y})` }));
      el.appendChild(g); heads.push(g);
    });
    beam(0, 1); beam(2, 3); beam(4, 5);
    [['ha-f1', 470, 70, 'sharp', .22], ['ha-f2', 70, 330, 'flat', -.12], ['ha-f3', 510, 330, 'note', .3], ['ha-f4', 110, 70, 'notes', -.18]].forEach(([cls, x, y, name, speed]) => {
      const g = svg('g', { class: 'ha-float ' + cls, 'data-speed': speed });
      const ic = I(name, { size: 44, stroke: 2 }); ic.setAttribute('x', x - 22); ic.setAttribute('y', y - 22);
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
            h('span', { class: 'eyebrow' }, 'GUITAR · HARMONY · EAR TRAINING'),
            h('h1', { class: 'hero-title' }, h('span', { class: 'ln' }, '기타로 치고,'), h('span', { class: 'ln' }, '귀로 이해하는'), h('span', { class: 'ln hot' }, '화성학')),
            h('p', { class: 'hero-lead' }, '코드 하나부터 진행, 스케일, 음감 훈련까지. 쉬운 것은 앞에, 어려운 것은 안쪽에 두었습니다.'),
            h('div', { class: 'home-search', role: 'search' }, h('span', { class: 'search-icon', 'aria-hidden': 'true' }, I('search')), input, results)),
          heroArt())));
      el.appendChild(marquee(['CHORDS', 'SCALES', 'INTERVALS', 'PROGRESSIONS', 'EAR TRAINING', 'RHYTHM', 'LICKS', 'VOICINGS', 'MODES', 'REHARM']));

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
            h('div', { class: 'title' }, '처음이라면, 배우기'), h('p', null, '음정 → 코드 → 스케일 → 진행 순서의 6단계 로드맵. 보고, 듣고, 쳐 보고, 퀴즈로 확인합니다.'),
            h('span', { class: 'sticker path-sticker', 'aria-hidden': 'true' }, 'START', h('br'), 'HERE'), go()),
          h('div', { class: 'path-card c-sun' },
            h('span', { class: 'path-num' }, '02'), h('span', { class: 'path-ic', 'aria-hidden': 'true' }, I('chord')),
            h('div', { class: 'title' }, '코드 하나 찾아보기'), h('p', null, '구성음, 잡는 법, 어울리는 스케일과 진행을 한 페이지에서.'),
            h('div', { class: 'quick-start-form' }, h('label', null, h('span', null, '루트'), rootSel), h('label', null, h('span', null, '타입'), qSel), h('button', { class: 'btn primary', type: 'button', onclick: () => { GH.router.go('/chord/' + encodeURIComponent(root) + '/' + q); } }, '코드 열기'))),
          h('a', { href: '#/practice', class: 'path-card c-sky' },
            h('span', { class: 'path-num' }, '03'), h('span', { class: 'path-ic', 'aria-hidden': 'true' }, I('headphones')),
            h('div', { class: 'title' }, '귀와 손 연습하기'), h('p', null, '계이름 · 음정 · 코드 퀴즈로 음감을 기르고, 메트로놈과 백킹 트랙 위에서 연주합니다.'), go()))));

      /* 더 깊이: 섹션별 링크 (둥근 경계의 색 띠) */
      const secs = A.SECTIONS.filter(s => s.items.length);
      el.appendChild(h('section', { class: 'band band-pink curve-top home-more' },
        h('div', { class: 'wrap reveal' },
          displayHead('더 깊이 들어가기', 'DEEP DIVE', '기초는 앞에, 심화는 뒤에 있습니다. 옆의 p · mf · ff 는 난이도입니다.'),
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
