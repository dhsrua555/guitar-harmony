/* 연습 › 리듬 연습: 메트로놈 · 리듬 따라 치기 · 스트럼 패턴 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, select, tabs, chips, callout } = GH.ui; const N = GH.notes; const R = () => GH.rhythm;

  const TAB_LIST = [{ id: 'metronome', label: '메트로놈' }, { id: 'tap', label: '리듬 따라 치기' }, { id: 'strum', label: '스트럼 패턴' }];
  const SUBDIVS = [{ value: 1, label: '4분' }, { value: 2, label: '8분' }, { value: 3, label: '셋잇단' }, { value: 4, label: '16분' }];
  const STRUM_PROGS = [['I-V-vi-IV', 'I – V – vi – IV'], ['I-IV-V', 'I – IV – V'], ['i-VII-VI-VII', 'i – VII – VI – VII'], ['ii-V-I', 'ii – V – I']];
  const state = {
    tab: 'metronome',
    met: { tempo: 90, beats: 4, subdiv: 1, swing: false, accent: true, gap: 'off', trainer: 'off' },
    tap: { level: 1, id: 'r1b', tempo: 80, bars: 2, sound: 'hear', offset: 0, best: {}, last: null },
    strum: { id: 'pop', prog: 'I-V-vi-IV', tempo: null, metronome: false }
  };
  let tapTimes = [];

  function metronomeTab(el) {
    const m = state.met; const A = GH.app;
    const running = () => R().running() && R().current().kind === 'metronome';
    const dots = h('div', { class: 'met-dots' });
    const drawDots = () => { GH.ui.clear(dots); for (let b = 0; b < m.beats; b++) dots.appendChild(h('span', { class: 'met-beat' + (b === 0 && m.accent ? ' accent' : '') }, h('b', null, b + 1), h('span', { class: 'met-subs' }, Array.from({ length: m.subdiv }, () => h('i'))))); };
    drawDots();
    const bpm = h('span', { class: 'met-bpm' }, m.tempo);
    const tempoIn = h('input', { type: 'range', min: 40, max: 240, value: m.tempo, 'aria-label': '템포', oninput: e => setTempo(Number(e.target.value)) });
    const setTempo = v => { m.tempo = Math.max(30, Math.min(260, Math.round(v))); bpm.textContent = m.tempo; tempoIn.value = m.tempo; if (running()) R().current().tempo = m.tempo; };
    const onTick = (beat, sub, bar, muted) => {
      dots.querySelectorAll('.met-beat').forEach((d, i) => { d.classList.toggle('on', i === beat); d.classList.toggle('muted', muted); d.querySelectorAll('i').forEach((x, k) => x.classList.toggle('on', i === beat && k === sub)); });
      barLabel.textContent = (bar + 1) + '마디' + (muted ? ' · 소리 없이 세어 보세요' : '');
    };
    const barLabel = h('span', { class: 'muted met-bar' }, '');
    const startBtn = h('button', { class: 'btn primary met-start', type: 'button' }, '▶ 시작');
    const opts = () => ({ tempo: m.tempo, beats: m.beats, subdiv: m.subdiv, swing: m.swing, accent: m.accent,
      gap: m.gap === 'off' ? null : m.gap.split('-').map(Number),
      trainer: m.trainer === 'off' ? null : { every: 4, step: Number(m.trainer), max: 240 },
      onTick, onTempo: t => setTempo(t), onStop: () => { startBtn.textContent = '▶ 시작'; startBtn.classList.remove('playing'); dots.querySelectorAll('.on').forEach(x => x.classList.remove('on')); } });
    startBtn.addEventListener('click', () => { if (running()) { R().stop(); return; } if (R().metronome(opts())) { startBtn.textContent = '■ 정지'; startBtn.classList.add('playing'); } });
    const live = patch => { Object.assign(m, patch); drawDots(); if (running()) Object.assign(R().current(), opts(), { onTick }); };
    let taps = [];
    const tapTempo = h('button', { class: 'btn', type: 'button', onclick: () => {
      const t = performance.now(); taps = taps.filter(x => t - x < 2500); taps.push(t);
      if (taps.length >= 2) { const iv = []; for (let i = 1; i < taps.length; i++) iv.push(taps[i] - taps[i - 1]); setTempo(60000 / (iv.reduce((a, b) => a + b, 0) / iv.length)); }
    } }, '탭 템포');
    el.appendChild(h('div', { class: 'card met-card' },
      h('div', { class: 'row', style: 'justify-content:space-between;align-items:flex-end' }, h('div', null, bpm, h('span', { class: 'muted' }, ' BPM')), barLabel),
      dots,
      h('div', { class: 'row' }, startBtn, tapTempo, h('button', { class: 'btn small', type: 'button', onclick: () => setTempo(m.tempo - 5) }, '−5'), tempoIn, h('button', { class: 'btn small', type: 'button', onclick: () => setTempo(m.tempo + 5) }, '+5'))));
    el.appendChild(h('div', { class: 'toolbar' },
      h('label', null, '박자', select({ options: [2, 3, 4, 5, 6, 7].map(n => ({ value: n, label: n + '/4' })), value: m.beats, onChange: v => live({ beats: Number(v) }) })),
      h('label', null, '분할', chips({ options: SUBDIVS, value: m.subdiv, onChange: v => live({ subdiv: Number(v) }) })),
      h('label', null, h('input', { type: 'checkbox', checked: m.swing, onchange: e => live({ swing: e.target.checked }) }), '스윙 (8분)'),
      h('label', null, h('input', { type: 'checkbox', checked: m.accent, onchange: e => live({ accent: e.target.checked }) }), '첫 박 강세'),
      h('label', null, '갭 트레이닝', select({ options: [{ value: 'off', label: '끄기' }, { value: '2-1', label: '2마디 듣고 1마디 쉬기' }, { value: '2-2', label: '2마디 듣고 2마디 쉬기' }, { value: '4-4', label: '4마디 듣고 4마디 쉬기' }], value: m.gap, onChange: v => live({ gap: v }) })),
      h('label', null, '스피드 트레이너', select({ options: [{ value: 'off', label: '끄기' }, { value: '2', label: '4마디마다 +2' }, { value: '5', label: '4마디마다 +5' }, { value: '10', label: '4마디마다 +10' }], value: m.trainer, onChange: v => live({ trainer: v }) }))));
    el.appendChild(callout(h('b', null, '이렇게 써 보세요. '), '갭 트레이닝은 클릭이 꺼진 마디에도 박을 유지하는 연습입니다. 다시 소리가 날 때 내 박과 맞는지 확인하세요. 스피드 트레이너는 편한 템포보다 10 낮게 시작해 조금씩 올라갑니다. 2·4박에만 박수를 치고 싶다면 박자를 2/4로 두고 템포를 절반으로 설정해도 됩니다.'));
  }

  function tapTab(el) {
    const t = state.tap; const A = GH.app;
    const pool = GH.data.rhythms.filter(r => r.level === t.level);
    if (!pool.some(r => r.id === t.id)) t.id = pool[0].id;
    const pat = GH.data.rhythms.find(r => r.id === t.id); const ev = R().parse(pat.p);
    el.appendChild(h('div', { class: 'toolbar' },
      h('label', null, '단계', select({ options: Object.entries(GH.data.rhythmLevels).map(([v, l]) => ({ value: v, label: v + '. ' + l })), value: t.level, onChange: v => { t.level = Number(v); t.last = null; GH.router.rerender(); } })),
      h('label', null, '템포', h('input', { type: 'range', min: 50, max: 160, value: t.tempo, oninput: e => { t.tempo = Number(e.target.value); e.target.nextSibling.textContent = t.tempo; } }), h('span', { class: 'mono' }, t.tempo)),
      h('label', null, '마디', select({ options: [1, 2, 4].map(n => ({ value: n, label: n + '번 반복' })), value: t.bars, onChange: v => { t.bars = Number(v); } })),
      h('label', null, '방식', select({ options: [{ value: 'hear', label: '듣고 따라 치기 (소리 있음)' }, { value: 'read', label: '악보만 보고 치기 (클릭만)' }], value: t.sound, onChange: v => { t.sound = v; } })),
      h('label', null, '지연 보정', h('input', { type: 'range', min: -150, max: 150, step: 5, value: t.offset, oninput: e => { t.offset = Number(e.target.value); e.target.nextSibling.textContent = t.offset + 'ms'; } }), h('span', { class: 'mono' }, t.offset + 'ms'))));
    el.appendChild(h('div', { class: 'rhythm-picks' }, pool.map(r => h('button', { class: 'rhythm-pick' + (r.id === t.id ? ' active' : ''), type: 'button', 'aria-label': '리듬 ' + r.p, onclick: () => { t.id = r.id; t.last = null; GH.router.rerender(); } }, GH.render.rhythmMini(r.p))),
      h('button', { class: 'btn small', type: 'button', onclick: () => { const others = pool.filter(r => r.id !== t.id); t.id = GH.util.pick(others.length ? others : pool).id; t.last = null; GH.router.rerender(); } }, '무작위')));
    const staff = GH.render.rhythmStaff(ev, { width: Math.min(640, (el.clientWidth || 640) - 20), height: 110 });
    const line = GH.render.rhythmTimeline(ev);
    const result = h('div', { class: 'tap-result', 'aria-live': 'polite' }, t.last ? t.last : h('span', { class: 'muted' }, '▶ 시작을 누르면 한 마디 카운트 뒤에 리듬이 나옵니다. 음표가 나오는 순간 아래 패드를 누르거나 Space 키를 치세요.'));
    const pad = h('button', { class: 'tap-pad', type: 'button' }, h('b', null, 'TAP'), h('small', null, '누르거나 Space'));
    const startBtn = h('button', { class: 'btn primary', type: 'button' }, '▶ 시작');
    let ctl = null;
    const hit = () => { if (!ctl || !R().running()) return; tapTimes.push(GH.audio.now() - t.offset / 1000); pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit'); };
    pad.addEventListener('pointerdown', e => { e.preventDefault(); hit(); });
    const keyHandler = e => { if (!document.body.contains(pad)) { document.removeEventListener('keydown', keyHandler); return; } if (e.code === 'Space' && !/INPUT|SELECT|TEXTAREA/.test((document.activeElement || {}).tagName || '')) { e.preventDefault(); if (!e.repeat) hit(); } };
    document.addEventListener('keydown', keyHandler);
    startBtn.addEventListener('click', () => {
      tapTimes = []; line.reset();
      GH.ui.clear(result); result.appendChild(h('span', { class: 'muted' }, '카운트 인…'));
      ctl = R().playPattern(ev, { tempo: t.tempo, countIn: 1, bars: t.bars, click: true, sound: t.sound === 'hear' ? 'wood' : 'none',
        onBeat: (b, bar) => { if (bar === -1) { GH.ui.clear(result); result.appendChild(h('b', { class: 'count' }, String(4 - b > 0 ? b + 1 : ''))); } else if (b === 0 && bar === 0) { GH.ui.clear(result); result.appendChild(h('span', { class: 'muted' }, '치세요!')); } },
        onNote: i => { line.setCurrent(i); if (staff) staff.setCurrent(i); },
        onEnd: c => {
          line.setCurrent(-1); if (staff) staff.setCurrent(-1);
          const sc = R().score(c.expected, tapTimes);
          const spb = 60 / t.tempo; const lastBar = t.bars - 1;
          line.grade(sc.items.filter(x => x.bar === lastBar), tapTimes, c.start + lastBar * 4 * spb, spb, c.latency);
          const best = Math.max(t.best[t.id] || 0, sc.score); t.best[t.id] = best;
          const tend = Math.abs(sc.meanErr) < 0.015 ? '박에 잘 맞았습니다' : sc.meanErr < 0 ? '평균 ' + Math.round(-sc.meanErr * 1000) + 'ms 빨랐습니다' : '평균 ' + Math.round(sc.meanErr * 1000) + 'ms 늦었습니다';
          const counts = {}; sc.items.forEach(x => { counts[x.grade] = (counts[x.grade] || 0) + 1; });
          t.last = h('div', null, h('div', { class: 'tap-score' }, h('b', null, sc.score + '점'), h('span', { class: 'muted' }, ' · 최고 ' + best + '점')),
            h('p', { style: 'margin:4px 0' }, tend + '. 정확 ' + (counts.good || 0) + ' · 조금 빠름/늦음 ' + ((counts.early || 0) + (counts.late || 0)) + ' · 많이 어긋남 ' + ((counts.veryEarly || 0) + (counts.veryLate || 0)) + ' · 놓침 ' + (counts.miss || 0) + (sc.extra ? ' · 남는 탭 ' + sc.extra : '')),
            h('p', { class: 'muted', style: 'margin:0;font-size:.82rem' }, '타임라인 색: 초록 정확, 노랑 조금 어긋남, 빨강 많이 어긋남 또는 놓침. 작은 세로선이 내가 친 위치(마지막 마디)입니다.'));
          GH.ui.clear(result); result.appendChild(t.last);
        } });
    });
    el.appendChild(section(pat.p.replace(/r/g, '(쉼)').split(' ').length + '개 음표 · 단계 ' + t.level,
      staff ? staff.el : null, line.el,
      h('div', { class: 'row', style: 'margin:12px 0' }, startBtn, A.playBtn('▶ 먼저 들어 보기', () => { ctl = null; R().playPattern(ev, { tempo: t.tempo, countIn: 1, bars: 1, click: true, onNote: i => { line.setCurrent(i); if (staff) staff.setCurrent(i); }, onEnd: () => { line.setCurrent(-1); if (staff) staff.setCurrent(-1); } }); }), A.stopBtn()),
      pad, result));
    el.appendChild(callout(h('b', null, '세는 법. '), '8분음표는 "하나 그리고 둘 그리고", 16분음표는 "하나 이 그리고 이", 셋잇단은 "하나 트리 플렛"처럼 소리 내어 세면서 치세요. 블루투스 이어폰은 소리가 늦게 들려 늦게 치게 되므로, 점수가 계속 늦게 나오면 지연 보정을 앞으로(음수) 옮기세요.'));
  }

  function strumTab(el) {
    const s = state.strum; const A = GH.app; const key = A.key();
    const S = GH.data.strums.find(x => x.id === s.id) || GH.data.strums[0];
    const tempo = s.tempo || S.tempo;
    const prog = GH.data.progressions.find(p => p.id === s.prog) || GH.data.progressions[0];
    const chords = A.progressionChords(prog, key).slice(0, 4).map(c => Object.assign(c, { beats: 4 }));
    el.appendChild(h('div', { class: 'rhythm-picks' }, GH.data.strums.map(x => h('button', { class: 'chip' + (x.id === S.id ? ' active' : ''), type: 'button', onclick: () => { s.id = x.id; s.tempo = null; GH.router.rerender(); } }, x.ko))));
    const slots = S.p.trim().split(/\s+/); const perBeat = S.grid / 4;
    const countLabel = i => { const b = Math.floor(i / perBeat) + 1, k = i % perBeat; if (k === 0) return String(b); if (perBeat === 2) return '&'; if (perBeat === 3) return k === 1 ? '트' : '렛'; return ['', 'e', '&', 'a'][k]; };
    const grid = h('div', { class: 'strum-grid', style: '--slots:' + slots.length });
    slots.forEach((x, i) => grid.appendChild(h('span', { class: 'strum-slot' + (i % perBeat === 0 ? ' beat' : '') + ' s-' + (x === '-' ? 'rest' : x) }, h('b', null, x === 'D' ? '↓' : x === 'U' ? '↑' : x === 'x' ? '✕' : '·'), h('small', null, countLabel(i)))));
    const strip = A.chordStrip(chords, { link: true });
    const startBtn = h('button', { class: 'btn primary', type: 'button' }, '▶ 시작');
    const setSlot = (i, bar) => { grid.querySelectorAll('.strum-slot').forEach((e, k) => e.classList.toggle('current', k === i)); strip.setCurrent(i < 0 ? -1 : bar % chords.length); };
    startBtn.addEventListener('click', () => {
      if (R().running() && R().current().kind === 'strum') { R().stop(); return; }
      if (R().playStrum(S, chords, { tempo, loop: true, metronome: s.metronome, onSlot: setSlot, onStop: () => { setSlot(-1, 0); startBtn.textContent = '▶ 시작'; startBtn.classList.remove('playing'); } })) { startBtn.textContent = '■ 정지'; startBtn.classList.add('playing'); }
    });
    el.appendChild(section(S.ko,
      h('p', null, S.desc),
      grid,
      h('div', { class: 'toolbar', style: 'margin-top:12px' }, startBtn,
        h('label', null, '진행', select({ options: STRUM_PROGS.filter(([id]) => GH.data.progressions.some(p => p.id === id)).map(([v, l]) => ({ value: v, label: l + ' (' + N.pretty(key) + ')' })), value: s.prog, onChange: v => { s.prog = v; GH.router.rerender(); } })),
        h('label', null, '템포', h('input', { type: 'range', min: 50, max: 160, value: tempo, oninput: e => { s.tempo = Number(e.target.value); e.target.nextSibling.textContent = s.tempo; const c = R().current(); if (c && c.kind === 'strum') c.tempo = s.tempo; } }), h('span', { class: 'mono' }, tempo)),
        h('label', null, h('input', { type: 'checkbox', checked: s.metronome, onchange: e => { s.metronome = e.target.checked; } }), '메트로놈')),
      strip,
      h('p', { class: 'muted', style: 'font-size:.84rem' }, '↓ 다운, ↑ 업, ✕ 뮤트 칩, · 쉼 (손은 움직이되 줄은 치지 않음). 코드 이름을 누르면 잡는 법을 볼 수 있습니다.')));
  }

  GH.pages['/rhythm'] = {
    title: '리듬 연습',
    staff: true,
    render(el, params) {
      const qy = params.query || {};
      if (qy.tab && TAB_LIST.some(t => t.id === qy.tab)) state.tab = qy.tab;
      el.appendChild(h('h1', null, '리듬 연습'));
      el.appendChild(h('p', { class: 'muted' }, '같은 음을 쳐도 리듬이 흔들리면 음악이 되지 않습니다. 메트로놈으로 박을 몸에 익히고, 리듬 따라 치기로 박 안의 위치를 정확히 맞추고, 스트럼 패턴으로 오른손 리듬을 반주에 적용해 보세요.'));
      el.appendChild(tabs(TAB_LIST, state.tab, id => GH.router.go('/rhythm', { tab: id })));
      const body = h('div'); el.appendChild(body);
      if (state.tab === 'tap') tapTab(body); else if (state.tab === 'strum') strumTab(body); else metronomeTab(body);
      el.appendChild(h('div', { class: 'toc' }, h('a', { href: '#/ear?tab=rhythm' }, '리듬 듣고 맞히기 퀴즈 →'), h('a', { href: '#/backing' }, '백킹 트랙 위에서 연주하기 →')));
    }
  };
})();
