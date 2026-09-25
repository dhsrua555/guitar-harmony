/* 세션별 기본기 연습: 기타 · 베이스 · 키보드 · 드럼 · 보컬
   /technique (세션 고르기) · /technique/:inst (루틴 · 연습 목록 · 참고 교재) · /technique/:inst/:id (따라 치기) */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, chips, select } = GH.ui; const N = GH.notes;
  const RH = { '2': { d: 2, ko: '2분음표', n: 0.5 }, '4': { d: 1, ko: '4분음표', n: 1 }, '8': { d: 0.5, ko: '8분음표', n: 2 }, '8t': { d: 1 / 3, ko: '셋잇단', n: 3 }, '16': { d: 0.25, ko: '16분음표', n: 4 } };
  const PPB = { 0.5: 36, 1: 36, 2: 46, 3: 60, 4: 76 };           /* TAB 박당 px: 음이 많을수록 넓게 */
  const FRET_RANGE = { 'chroma-shift': [1, 9], stretch: [4, 12], 'b-simandl': [1, 9] };
  const REC_KEY = 'gh.tech.v1', VOICE_KEY = 'gh.tech.voice';
  const STD = () => GH.voicings.STD, BASS = () => GH.data.techBassTuning;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const instOf = id => GH.data.techInst.find(x => x.id === id);
  const byId = id => GH.data.technique.find(x => x.id === id);
  const catOf = id => GH.data.techCats.find(c => c.id === id);
  const routineOf = id => GH.data.techRoutines.find(r => r.id === id);
  const exHref = (ex, q) => GH.router.href('/technique/' + ex.inst + '/' + ex.id, q);
  const nOf = rh => (RH[rh] || RH['8']).n;
  const scaleTempo = (bpm, from, to) => clamp(Math.round(bpm * nOf(from) / nOf(to)), 30, 240);
  const SOLFA = ['도', '도#', '레', '미♭', '미', '파', '파#', '솔', '솔#', '라', '시♭', '시'];
  const PLUCK_KO = { d: '⊓ 다운', u: 'V 업', i: 'i 검지', m: 'm 중지' };
  const RULES = {
    guitar: ['힘을 빼요. 소리가 날 만큼만 누르면 충분해요.', '템포는 틀리지 않고 칠 수 있는 만큼만. 자꾸 틀리면 5~10 BPM 내려요.', '손이 아프거나 저리면 바로 멈추고 쉬어요. 짧게 자주가 길게 한 번보다 좋아요.'],
    bass: ['굳은살이 생길 때까지는 10분씩 나눠서 연습해요.', '오른손은 검지 · 중지 교대를 끝까지 지켜요. 한 손가락만 쓰는 습관이 가장 흔한 실수예요.', '손목이 꺾이지 않게 스트랩 높이를 맞추세요.'],
    keys: ['의자 높이는 팔꿈치가 건반과 같은 높이가 되게.', '손목과 어깨에 힘을 빼고, 손가락 끝으로 건반 바닥까지 눌러요.', '한 손씩 → 양손, 느리게 → 빠르게. 틀린 곳만 떼어 반복해도 좋아요.'],
    drums: ['귀를 보호하세요. 실제 드럼은 이어플러그를 끼고 연습해요.', '스틱은 30% 힘으로 가볍게 쥐고, 튀어 오르는 힘을 이용해요.', '연습 패드나 쿠션 위에서도 루디먼트는 똑같이 연습할 수 있어요.'],
    vocal: ['물을 조금씩 마시며, 목이 따갑거나 쉬면 바로 멈춰요.', '큰 소리보다 편한 소리. 높은 음은 억지로 밀어 올리지 않아요.', '연습 끝에는 허밍으로 낮은 음까지 내려오며 목을 풀어요 (쿨다운).']
  };

  /* ---- 기록 (이 브라우저에만) ---- */
  function records() { try { return JSON.parse(localStorage.getItem(REC_KEY)) || {}; } catch (e) { return {}; } }
  function addRecord(id, bpm, rh) {
    const all = records(); const r = all[id] = all[id] || { log: [] };
    r.log.push({ bpm, rh, at: Date.now() }); if (r.log.length > 40) r.log.splice(0, r.log.length - 40);
    try { localStorage.setItem(REC_KEY, JSON.stringify(all)); } catch (e) { /* ignore */ }
  }
  const nps = e => e.bpm * nOf(e.rh);
  function bestOf(id) { const r = records()[id]; return r && r.log && r.log.length ? r.log.reduce((a, e) => !a || nps(e) > nps(a) ? e : a, null) : null; }
  const recLabel = e => e.bpm + ' BPM' + (RH[e.rh] ? ' · ' + RH[e.rh].ko : '');
  const dateKo = t => { const d = new Date(t); return (d.getMonth() + 1) + '월 ' + d.getDate() + '일'; };
  const savedVoice = () => { try { return localStorage.getItem(VOICE_KEY); } catch (e) { return null; } };

  /* ---- 옵션 ---- */
  function rhOptions(ex) {
    if (ex.fixed || ex.inst === 'vocal') return null;
    if (ex.inst === 'drums') return ex.rhs || null;
    if (ex.inst === 'keys') return ex.cat === 'k-chord' ? ['2', '4'] : ['4', '8', '8t', '16'];
    return ['4', '8', '8t', '16'];
  }
  function options(ex, qy) {
    const o = Object.assign({}, ex.opts); const int = v => parseInt(v, 10);
    if (o.fret != null && isFinite(int(qy.fret))) { const r = FRET_RANGE[ex.id] || [1, 12]; o.fret = clamp(int(qy.fret), r[0], r[1]); }
    if (o.string != null && /^[1-6]$/.test(qy.string || '')) o.string = clamp(int(qy.string), 1, ex.inst === 'bass' ? 4 : 6);
    if (o.key != null && qy.key) { if (o.keys) { if (o.keys.includes(qy.key)) o.key = qy.key; } else if (N.pcOf(qy.key) != null) o.key = N.normalize(qy.key); }
    if (o.box != null && /^[1-5]$/.test(qy.box || '')) o.box = int(qy.box);
    if (o.pos != null && /^[1-7]$/.test(qy.pos || '')) o.pos = int(qy.pos);
    if (o.perm != null && GH.data.techAllPerms.includes(qy.perm)) o.perm = qy.perm;
    if (o.pickStart != null && (qy.pick === 'd' || qy.pick === 'u')) o.pickStart = qy.pick;
    if (o.pluck != null && (qy.pick === 'i' || qy.pick === 'm')) o.pluck = qy.pick;
    if (o.hands != null && /^(rh|lh|both)$/.test(qy.hands || '')) o.hands = qy.hands;
    if (o.oct != null && /^[12]$/.test(qy.oct || '')) o.oct = int(qy.oct);
    if (o.mode != null && /^(major|minor)$/.test(qy.mode || '')) o.mode = qy.mode;
    if (o.kick != null && GH.data.techKickVariants[qy.kick]) o.kick = qy.kick;
    if (ex.inst === 'vocal') {
      const V = GH.data.techVoices; const sv = savedVoice();
      o.voice = V[qy.voice] ? qy.voice : V[sv] ? sv : o.voice;
      if (/^[0-8]$/.test(qy.steps || '')) o.steps = int(qy.steps);
      if (o.syl != null && /^(solfa|vowel)$/.test(qy.syl || '')) o.syl = qy.syl;
      const guides = ex.id === 'v-harmony' ? ['line', 'mine', 'off'] : ['mine', 'off'];
      o.guide = guides.includes(qy.guide) ? qy.guide : guides[0];
    }
    const rhs = rhOptions(ex); o.rh = rhs && rhs.includes(qy.rh) ? qy.rh : ex.rh || '4';
    return o;
  }

  /* ---- 악기별: 연습 → 재생 순서(seq) · 악보 · 악기 그림 · 소리 ---- */
  function guitarPreset() { const p = GH.state.get().instrument; return ['steel', 'nylon', 'electric'].includes(p) ? p : 'steel'; }
  function buildFretted(ex, o) {
    const tun = ex.inst === 'bass' ? BASS() : STD(); const NS = tun.length;
    const d = RH[o.rh].d; let alt = 0;
    const first = ex.inst === 'bass' ? (o.pluck === 'm' ? 1 : 0) : (o.pickStart === 'u' ? 1 : 0);
    const marks = ex.inst === 'bass' ? ['i', 'm'] : ['d', 'u'];
    let at = 0;
    const notes = ex.gen(o).map(n => {
      const e = { at, d, s: n.s, f: n.f, fg: n.fg, t: n.t || null, x: !!n.x, label: n.label || null, midi: tun[NS - n.s] + n.f };
      if (n.pk) e.pk = n.pk; else if (!e.t) { e.pk = marks[(first + alt) % 2]; alt++; }
      at += d; return e;
    });
    return { kind: 'fretted', tun, NS, seq: notes, notes };
  }
  function buildKeys(ex, o) {
    const g = ex.gen(o); const d = RH[o.rh].d;
    const stamp = list => { let at = 0; return list.map(n => { const e = Object.assign({}, n, { d: ex.fixed ? n.d : d, at }); at += e.d; return e; }); };
    const rh = stamp(g.rh || []), lh = stamp(g.lh || []);
    const map = new Map();
    rh.concat(lh).forEach(n => { const k = Math.round(n.at * 1000); if (!map.has(k)) map.set(k, { at: n.at, notes: [] }); map.get(k).notes.push(Object.assign({ hand: rh.includes(n) ? 'r' : 'l' }, n)); });
    const seq = Array.from(map.values()).sort((a, b) => a.at - b.at);
    const end = Math.max(0, ...rh.concat(lh).map(n => n.at + n.d));
    seq.forEach((s, i) => { s.d = (i + 1 < seq.length ? seq[i + 1].at : end) - s.at; });
    return { kind: 'keys', seq, rh, lh };
  }
  function buildDrums(ex, o) {
    const g = ex.gen(o);
    const seq = g.slots.map((s, i) => Object.assign({}, s, { at: i * g.grid, d: g.grid }));
    return { kind: 'drums', seq, grid: g.grid };
  }
  function buildVocal(ex, o) {
    const V = GH.data.techVoices[o.voice]; let at = 0;
    const seq = ex.gen(o).map((n, i) => {
      const e = Object.assign({}, n, { at, i });
      if (!n.rest) {
        e.midi = V.root + n.deg; e.gmidi = n.gdeg != null ? V.root + n.gdeg : null;
        e.syl = n.syl || (o.syl === 'vowel' ? '아' : n.sol || SOLFA[N.mod(n.deg, 12)]);
        e.name = N.noteName(N.mod(e.midi, 12), n.flat ? 'flat' : 'sharp');
      }
      at += n.d; return e;
    });
    const steps = o.steps || 0; const trs = [];
    for (let k = 0; k <= steps; k++) trs.push(k);
    for (let k = steps - 1; k >= 1; k--) trs.push(k);
    return { kind: 'vocal', seq, V, trs };
  }
  function build(ex, o) {
    if (ex.inst === 'keys') return buildKeys(ex, o);
    if (ex.inst === 'drums') return buildDrums(ex, o);
    if (ex.inst === 'vocal') return buildVocal(ex, o);
    return buildFretted(ex, o);
  }
  const totalBeats = B => Math.round((B.seq.length ? B.seq[B.seq.length - 1].at + B.seq[B.seq.length - 1].d : 0) * 1000) / 1000;
  function soundFor(ex, B, o) {
    const A = GH.audio;
    if (B.kind === 'fretted' && ex.inst === 'bass') return (ev, t, dur) => A.bass(ev.midi, t, ev.x ? 0.06 : dur * 0.92, { gain: ev.x ? 0.35 : ev.pk === 'P' ? 1.1 : 1 });
    if (B.kind === 'fretted') { const pre = guitarPreset(); return (ev, t, dur) => A.pluck(ev.midi, t, ev.x ? 0.05 : dur * 0.95, { gain: ev.t ? 0.6 : 0.85, preset: pre }); }
    if (B.kind === 'keys') return (ev, t, dur, pass, beat) => ev.notes.forEach(n => n.m.forEach(m => A.pluck(m, t, n.d * beat * 0.96, { preset: 'piano', gain: n.hand === 'l' ? 0.62 : 0.78 })));
    if (B.kind === 'drums') return (ev, t) => ev.hits.forEach(x => A.drum(x.k, t, x.ghost ? 0.22 : x.acc ? 1.05 : 0.72));
    return (ev, t, dur, pass, beat) => {
      const tr = B.trs[pass % B.trs.length];
      if (ev.i === 0) { const r = B.V.root + tr - 12; [r, r + 4, r + 7].forEach(m => A.pluck(m, t, Math.min(2, totalBeats(B)) * beat, { preset: 'piano', gain: 0.4 })); }
      if (ev.rest || o.guide === 'off') return;
      const m = o.guide === 'line' && ev.gmidi != null ? ev.gmidi : ev.midi;
      A.pluck(m + tr, t, (ev.stacc ? 0.4 : 0.95) * dur, { preset: 'piano', gain: 0.62 });
    };
  }

  /* ---- 악보 ---- */
  function sheetFor(ex, B, width, o) {
    if (!GH.render.sheet) return null;
    const pref = o.key ? GH.state.pref(o.key.replace(/m$/, '')) : 'sharp';
    if (B.kind === 'fretted') return GH.render.sheet({ kind: 'line', clef: ex.inst === 'bass' ? 'bass' : 'treble', written: 12, width, pref, events: B.notes.map(n => ({ at: n.at, d: n.d, m: [n.midi], x: n.x, fg: n.fg > 0 || typeof n.fg === 'string' ? String(n.fg) : '' })) });
    if (B.kind === 'keys') { const ev = n => ({ at: n.at, d: n.d, m: n.m, fg: (n.fg || []).join('') }); return GH.render.sheet({ kind: 'grand', width, pref, rh: B.rh.map(ev), lh: B.lh.map(ev) }); }
    if (B.kind === 'drums') return GH.render.sheet({ kind: 'drum', width, slots: B.seq });
    return GH.render.sheet({ kind: 'line', clef: B.V.clef, written: B.V.clef === 'treble8vb' ? 12 : 0, width, pref: 'sharp', events: B.seq.map(n => n.rest ? { at: n.at, d: n.d, m: null } : { at: n.at, d: n.d, m: [n.midi], names: [n.name], lyric: n.syl, stacc: n.stacc }) });
  }
  /* 기타 · 베이스 TAB: 화면 너비에 맞춰 1~4마디씩 끊는다 */
  function tabRows(notes, rh, width, NS) {
    const ppb = PPB[RH[rh].n];
    const perRow = clamp(Math.floor((width || 700) / (4 * ppb * 0.9)), 1, 4);
    const rows = []; let cur = null;
    notes.forEach((ev, i) => {
      const row = Math.floor(Math.floor(ev.at / 4 + 1e-6) / perRow);
      if (!cur || cur.row !== row) { cur = { row, start: i, notes: [] }; rows.push(cur); }
      cur.notes.push(ev);
    });
    const fullW = 34 + perRow * 4 * ppb + 24;
    const wrap = h('div', { class: 'tech-tab' });
    rows.forEach(r => {
      r.tab = GH.render.tab({ notes: r.notes }, { ppb, barStart: r.row * perRow, strings: NS });
      const W = r.tab.el.viewBox.baseVal.width;
      r.tab.el.style.minWidth = '0'; r.tab.el.style.width = Math.min(100, W / fullW * 100).toFixed(2) + '%';
      r.el = h('div', { class: 'tech-tab-row' }, r.tab.el); wrap.appendChild(r.el);
    });
    return { el: wrap, highlight(i) { rows.forEach(r => r.tab.highlight(i >= r.start && i < r.start + r.notes.length ? i - r.start : -1)); } };
  }
  /* ---- 악기 그림 ---- */
  function viewFor(ex, B) {
    if (B.kind === 'fretted') {
      const seen = new Set();
      const fbNotes = B.notes.filter(n => !n.x).filter(n => { const k = n.s + ':' + n.f; if (seen.has(k)) return false; seen.add(k); return true; })
        .map(n => n.label && !/[↑↓]/.test(n.label) ? { s: n.s, f: n.f, label: n.label, cls: N.ivClass(n.label) } : { s: n.s, f: n.f, label: n.fg > 0 ? n.fg : '0', cls: 'iv-s' });
      const fr = B.notes.map(n => n.f); const lo = Math.min(...fr), hi = Math.max(...fr); const from = lo <= 1 ? 0 : lo - 1;
      const fb = GH.render.fretboard({ notes: fbNotes, tuning: B.tun, capo: 0, from, to: Math.min(22, Math.max(hi + 1, from + 5)), labelMode: 'degree', pref: 'sharp', sound: ex.inst === 'bass' ? m => GH.audio.bass(m, GH.audio.now(), 1.2, {}) : null });
      return { el: fb.el, highlight: ev => fb.highlightMany(ev ? [[ev.s, ev.f]] : []), note: ex.opts.key ? '색은 도수(빨강이 루트), 점 안의 글자도 도수예요.' : '점 안의 숫자가 왼손 손가락 번호예요.' };
    }
    if (B.kind === 'keys') {
      const all = B.rh.concat(B.lh); const ms = [].concat(...all.map(n => n.m));
      const lo = Math.min(...ms), hi = Math.max(...ms);
      const from = lo - N.mod(lo, 12), to = hi + (11 - N.mod(hi, 12));
      const onMidi = {};
      B.lh.forEach(n => n.m.forEach((m, i) => { if (!onMidi[m]) onMidi[m] = { label: n.fg ? n.fg[i] : '', cls: 'hand-l' }; }));
      B.rh.forEach(n => n.m.forEach((m, i) => { if (!onMidi[m] || onMidi[m].cls === 'hand-l') onMidi[m] = { label: n.fg ? n.fg[i] : '', cls: 'hand-r' }; }));
      const el = GH.render.piano({ from, to, onMidi, preset: 'piano' });
      return { el: h('div', { class: 'tech-piano' }, el), highlight: ev => el.highlightMany(ev ? [].concat(...ev.notes.map(n => n.m)) : []), note: '노란 건반은 오른손, 파란 건반은 왼손. 숫자는 처음 누를 때의 손가락 번호예요.' };
    }
    if (B.kind === 'drums') {
      const kit = GH.render.drumkit();
      return { el: h('div', { class: 'tech-kit' }, kit.el), highlight: ev => kit.highlight(ev ? ev.hits.map(x => ({ k: x.k, st: ev.st })) : []), note: '치는 곳이 빛나고 스티킹(R 오른손 · L 왼손 · K 킥)이 떠요. 그림을 누르면 그 소리가 나요.' };
    }
    return null;
  }

  /* ---- 루틴 타이머 (페이지를 다시 그려도 이어진다) ---- */
  const timer = { key: null, left: 0, total: 0, iv: 0, el: null, btn: null, onEnd: null };
  const fmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  function paintTimer() {
    if (timer.el) timer.el.textContent = timer.left > 0 ? fmt(timer.left) : '끝!';
    if (timer.btn) timer.btn.textContent = timer.iv ? '일시정지' : timer.left > 0 && timer.left < timer.total ? '이어서' : timer.left > 0 ? '타이머 시작' : '다시';
    if (timer.el && timer.el.parentNode) timer.el.parentNode.classList.toggle('done', timer.left <= 0);
  }
  function stopTimer() { if (timer.iv) { clearInterval(timer.iv); timer.iv = 0; } paintTimer(); }
  function toggleTimer() {
    if (timer.iv) { stopTimer(); return; }
    if (timer.left <= 0) timer.left = timer.total;
    timer.iv = setInterval(() => {
      timer.left = Math.max(0, timer.left - 1);
      if (!timer.left) { stopTimer(); if (GH.audio && GH.audio.context()) { const t = GH.audio.now() + .05; GH.audio.click(t, true); GH.audio.click(t + .18, true); } if (timer.onEnd) timer.onEnd(); }
      paintTimer();
    }, 1000);
    paintTimer();
  }
  GH.events.on('route', r => { if (!r || !/^\/technique/.test(r.path)) { stopTimer(); timer.key = null; } });
  function sessionsOrder() {
    const sel = GH.guide && GH.guide.sessions ? GH.guide.sessions() : [];
    return GH.data.techInst.slice().sort((a, b) => { const x = sel.indexOf(a.id), y = sel.indexOf(b.id); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); });
  }
  function suggestedRoutine(inst, qy) {
    const own = GH.data.techRoutines.filter(r => r.inst === inst);
    if (own.some(r => r.id === qy.r)) return qy.r;
    const G = GH.guide; const lv = G && G.profile().level ? G.LEVELS.findIndex(l => l.id === G.profile().level) : 0;
    return own[lv >= 4 ? 2 : lv >= 2 ? 1 : 0].id;
  }
  const instChips = cur => h('div', { class: 'tech-inst-chips' }, sessionsOrder().map(s => h('a', { class: 'chip' + (s.id === cur ? ' active' : ''), href: '#/technique/' + s.id, 'aria-current': s.id === cur ? 'page' : null }, GH.icon(s.icon), s.ko)));

  /* ============ 세션 고르기 ============ */
  GH.pages['/technique'] = {
    title: '기본기 연습',
    render(el) {
      const sel = GH.guide && GH.guide.sessions ? GH.guide.sessions() : [];
      el.appendChild(h('h1', null, '세션별 기본기 연습'));
      el.appendChild(h('p', { class: 'muted' }, '가장 기초부터 응용까지, 악보와 악기 그림을 보며 메트로놈에 맞춰 따라 해요. 스피드 트레이너로 템포를 조금씩 올리고, 깨끗하게 친 템포를 기록해요.'));
      el.appendChild(h('div', { class: 'grid cols-3 tech-insts' }, sessionsOrder().map(s => {
        const n = GH.data.technique.filter(e => e.inst === s.id).length;
        return h('a', { class: 'card link tech-inst', href: '#/technique/' + s.id },
          h('span', { class: 'tech-inst-ic', 'aria-hidden': 'true' }, GH.icon(s.icon)),
          h('div', { class: 'tech-inst-body' }, h('div', { class: 'row', style: 'gap:6px' }, h('b', { class: 'title' }, s.ko), sel.includes(s.id) ? h('span', { class: 'badge accent' }, '내 세션') : null),
            h('div', { class: 'desc' }, s.desc), h('div', { class: 'tech-inst-meta' }, n + '가지 연습 · ' + s.view)));
      })));
      el.appendChild(h('div', { class: 'callout' }, h('b', null, '어떻게 연습하나요?'),
        h('ol', { class: 'tech-method' }, h('li', null, '루틴을 고르면 연습을 순서대로, 정해진 시간만큼 안내해요.'), h('li', null, '▶ 시작을 누르면 4박을 센 뒤 메트로놈과 함께 소리가 나고, 악보와 악기 그림에 지금 칠 음이 표시돼요.'), h('li', null, '스피드 트레이너를 켜면 몇 번 반복할 때마다 템포가 자동으로 올라가요.'), h('li', null, '틀리지 않고 쳤다면 그 템포를 기록해 두고, 다음 날 이어서 올려요.'))));
    }
  };

  /* ============ 세션별 목록 · 루틴 ============ */
  GH.pages['/technique/:inst'] = {
    title: '기본기 연습',
    render(el, params) {
      const I = instOf(params.inst); const qy = params.query || {};
      if (!I) { el.appendChild(GH.ui.empty('그런 세션이 없습니다.')); el.appendChild(h('p', null, h('a', { href: '#/technique' }, '세션 고르기로'))); return; }
      el.appendChild(h('div', { class: 'breadcrumb' }, h('a', { href: '#/technique' }, '기본기 연습'), ' › ', I.ko));
      el.appendChild(h('h1', null, I.ko + ' 기본기'));
      el.appendChild(instChips(I.id));
      el.appendChild(h('p', { class: 'muted' }, I.desc + '. 매일 10~20분, 느린 템포에서 정확하게 → 익숙해지면 조금씩 빠르게.'));
      /* 오늘의 루틴 */
      const rid = suggestedRoutine(I.id, qy); const R = routineOf(rid);
      const rChips = chips({ options: GH.data.techRoutines.filter(r => r.inst === I.id).map(r => ({ value: r.id, label: r.ko + ' ' + r.min + '분' })), value: rid, onChange: v => GH.router.go('/technique/' + I.id, { r: v }) });
      el.appendChild(h('div', { class: 'card tech-routine' },
        h('div', { class: 'tech-routine-head' }, h('span', { class: 'eyebrow' }, 'TODAY'), h('h2', null, '오늘의 루틴')),
        rChips, h('p', { class: 'muted' }, R.desc),
        h('ol', { class: 'tech-steps' }, R.steps.map(([id, min], i) => { const ex = byId(id); const b = bestOf(id); return h('li', null, h('a', { href: exHref(ex, { routine: rid, step: i + 1 }) }, h('span', { class: 'tech-step-title' }, ex.ko), h('span', { class: 'tech-step-meta' }, min + '분' + (b ? ' · 최고 ' + b.bpm + ' BPM' : '')))); })),
        h('a', { class: 'btn primary', href: exHref(byId(R.steps[0][0]), { routine: rid, step: 1 }) }, GH.icon('play'), '루틴 시작')));
      el.appendChild(h('div', { class: 'callout tech-rules' }, h('b', null, '다치지 않고 늘리려면'), h('ul', null, RULES[I.id].map(x => h('li', null, x)))));
      /* 분류별 연습 */
      GH.data.techCats.filter(c => c.inst === I.id).forEach(c => {
        const list = GH.data.technique.filter(e => e.cat === c.id).sort((a, b) => a.level - b.level);
        el.appendChild(h('section', { class: 'section tech-cat' },
          h('div', { class: 'tech-cat-head' }, h('span', { class: 'tech-cat-ic', 'aria-hidden': 'true' }, GH.icon(c.icon)), h('h2', null, c.ko), h('span', { class: 'tech-cat-en', 'aria-hidden': 'true' }, c.en)),
          h('p', { class: 'muted' }, c.desc),
          h('div', { class: 'grid cols-3' }, list.map(ex => {
            const b = bestOf(ex.id);
            return h('a', { class: 'card link tech-card', href: exHref(ex) },
              h('div', { class: 'row', style: 'gap:6px' }, GH.ui.level(ex.level), ex.rh && rhOptions(ex) ? h('span', { class: 'badge' }, RH[ex.rh].ko) : null, b ? h('span', { class: 'badge accent' }, '최고 ' + b.bpm + ' BPM') : null),
              h('div', { class: 'title' }, ex.ko), h('div', { class: 'desc' }, ex.goal));
          }))));
      });
      /* 참고 교재 */
      el.appendChild(section('참고한 교재 · 입시 전통',
        h('ul', { class: 'tech-sources' }, (GH.data.techSources[I.id] || []).map(([who, what, why]) => h('li', null, h('b', null, who), ' ', h('span', null, what), h('span', { class: 'muted' }, ' — ' + why)))),
        h('p', { class: 'muted', style: 'font-size:.82rem' }, '위 교재와 음대 · 실용음악과 입시에서 흔히 쓰는 연습 방식을 참고해 이 사이트에서 새로 적은 연습이에요. 교재의 악보를 그대로 옮기지는 않았어요 (저작권이 끝난 하논 1번 음형만 원래 모양 그대로).')));
    }
  };

  /* ============ 연습 화면 ============ */
  const play = { metronome: true, loop: true, countIn: true, trainer: false, every: 2, step: 4, view: 'both' };
  const tempos = {};                                          /* 연습 id → { bpm, rh, max } */
  GH.pages['/technique/:inst/:id'] = {
    title: '기본기 연습',
    staff: true,
    render(el, params) {
      const qy = params.query || {}; const A = GH.app;
      const ex = byId(params.id);
      if (!ex || ex.inst !== params.inst) { el.appendChild(GH.ui.empty('연습을 찾을 수 없습니다.')); el.appendChild(h('p', null, h('a', { href: '#/technique' }, '기본기 연습 목록으로'))); return; }
      const I = instOf(ex.inst); const cat = catOf(ex.cat); const o = options(ex, qy);
      const B = build(ex, o); const beats = totalBeats(B);
      const tbase = ex.inst === 'vocal' || !rhOptions(ex) ? (ex.rh || '4') : ex.rh;
      let t = tempos[ex.id];
      if (!t) t = tempos[ex.id] = { bpm: scaleTempo(ex.tempo[0], tbase, o.rh), rh: o.rh, max: scaleTempo(ex.tempo[1], tbase, o.rh) };
      if (t.rh !== o.rh) { t.bpm = scaleTempo(t.bpm, t.rh, o.rh); t.max = scaleTempo(t.max, t.rh, o.rh); t.rh = o.rh; }
      const goalLo = scaleTempo(ex.tempo[0], tbase, o.rh), goalHi = scaleTempo(ex.tempo[1], tbase, o.rh);
      const keep = {}; ['routine', 'step', 'fret', 'string', 'key', 'box', 'pos', 'perm', 'pick', 'rh', 'hands', 'oct', 'mode', 'kick', 'voice', 'steps', 'syl', 'guide'].forEach(k => { if (qy[k] != null) keep[k] = qy[k]; });
      const setQ = patch => GH.router.go('/technique/' + ex.inst + '/' + ex.id, Object.assign({}, keep, patch));

      el.appendChild(h('div', { class: 'breadcrumb' }, h('a', { href: '#/technique' }, '기본기 연습'), ' › ', h('a', { href: '#/technique/' + I.id }, I.ko), ' › ', cat.ko));
      el.appendChild(h('h1', null, ex.ko));
      el.appendChild(h('div', { class: 'row' }, GH.ui.level(ex.level), GH.ui.badge(I.ko + ' · ' + cat.ko, 'accent'), GH.ui.badge(goalLo === goalHi ? goalLo + ' BPM' : '권장 ' + goalLo + ' → ' + goalHi + ' BPM'), rhOptions(ex) ? GH.ui.badge(RH[o.rh].ko) : null));

      /* 루틴 막대 */
      const R = routineOf(qy.routine);
      const si = R ? clamp((parseInt(qy.step, 10) || (R.steps.findIndex(s => s[0] === ex.id) + 1) || 1) - 1, 0, R.steps.length - 1) : -1;
      if (R && R.steps[si][0] === ex.id) {
        const min = R.steps[si][1]; const key = R.id + ':' + si;
        if (timer.key !== key) { stopTimer(); timer.key = key; timer.total = timer.left = min * 60; }
        const nextStep = R.steps[si + 1];
        const nextA = nextStep ? h('a', { class: 'btn small primary', href: exHref(byId(nextStep[0]), { routine: R.id, step: si + 2 }) }, '다음: ' + byId(nextStep[0]).ko + ' →') : h('a', { class: 'btn small primary', href: '#/technique/' + I.id + '?r=' + R.id }, '루틴 끝! 목록으로');
        timer.el = h('b', { class: 'tech-timer-left' }); timer.btn = h('button', { class: 'btn small', type: 'button', onclick: toggleTimer });
        timer.onEnd = () => { nextA.classList.add('pulse'); };
        el.appendChild(h('div', { class: 'tech-routine-bar' },
          h('div', { class: 'tech-routine-where' }, h('span', { class: 'eyebrow' }, I.ko + ' ' + R.ko + ' · ' + (si + 1) + ' / ' + R.steps.length), h('span', { class: 'tech-dots', 'aria-hidden': 'true' }, R.steps.map((_, i) => h('i', { class: i < si ? 'done' : i === si ? 'now' : '' })))),
          h('div', { class: 'tech-timer' }, GH.icon('metronome'), timer.el, h('span', { class: 'muted' }, ' / ' + min + '분')),
          h('div', { class: 'row', style: 'gap:6px' }, timer.btn, nextA)));
        paintTimer();
      }

      el.appendChild(h('p', { class: 'lead' }, ex.goal));
      const legend = ex.inst === 'guitar' ? '손가락 번호: 1 검지 · 2 중지 · 3 약지 · 4 새끼 · ⊓ 다운 · V 업 피킹'
        : ex.inst === 'bass' ? '왼손 손가락: 1 검지 · 2 중지 · 3 약지 · 4 새끼 · 오른손: i 검지 · m 중지 (슬랩은 T 엄지 · P 팝)'
          : ex.inst === 'keys' ? '손가락 번호: 1 엄지 · 2 검지 · 3 중지 · 4 약지 · 5 새끼'
            : ex.inst === 'drums' ? '스티킹: R 오른손 · L 왼손 · K 킥 · > 액센트 · ( ) 고스트 노트' : '가사 줄은 계이름(이동도: 으뜸음 = 도)이에요. 반복할 때마다 반음씩 옮겨 불러요.';
      el.appendChild(h('div', { class: 'tech-how' }, h('h2', null, '이렇게 해요'), h('ol', null, ex.how.map(x => h('li', null, x))), h('p', { class: 'muted tech-fingers' }, legend)));

      /* 연습 설정 */
      const setBar = h('div', { class: 'toolbar tech-opts' });
      const lab = (label, ctl) => setBar.appendChild(h('label', null, label, ctl));
      if (o.perm != null) setBar.appendChild(h('div', { class: 'tech-perm' }, h('span', { class: 'tech-lab' }, '손가락 순서'), chips({ options: GH.data.techPerms.map(p => ({ value: p, label: p.split('').join('-') })), value: o.perm, onChange: v => setQ({ perm: v }) })));
      if (o.kick != null) setBar.appendChild(h('div', { class: 'tech-perm' }, h('span', { class: 'tech-lab' }, '킥 모양'), chips({ options: Object.entries(GH.data.techKickVariants).map(([v, l]) => ({ value: v, label: l })), value: o.kick, onChange: v => setQ({ kick: v }) })));
      if (o.key != null) lab('키', o.keys ? select({ options: o.keys.map(k => ({ value: k, label: N.pretty(k) })), value: o.key, onChange: v => setQ({ key: v }) }) : A.rootSelect(o.key, v => setQ({ key: v })));
      if (o.mode != null) lab('장조 · 단조', select({ options: [{ value: 'major', label: '메이저 (장조)' }, { value: 'minor', label: '마이너 (단조)' }], value: o.mode, onChange: v => setQ({ mode: v }) }));
      if (o.box != null) lab('박스', select({ options: [1, 2, 3, 4, 5].map(b => ({ value: b, label: b + '번 박스' })), value: o.box, onChange: v => setQ({ box: v }) }));
      if (o.pos != null) lab('포지션', select({ options: [1, 2, 3, 4, 5, 6, 7].map(b => ({ value: b, label: b + '번 포지션' })), value: o.pos, onChange: v => setQ({ pos: v }) }));
      if (o.fret != null) { const r = FRET_RANGE[ex.id] || [1, 12]; lab('시작 프렛', GH.ui.numberInput({ value: o.fret, min: r[0], max: r[1], suffix: '프렛', label: '시작 프렛', onChange: v => setQ({ fret: v }) })); }
      if (o.string != null) lab('줄', select({ options: Array.from({ length: ex.inst === 'bass' ? 4 : 6 }, (_, i) => ({ value: i + 1, label: (i + 1) + '번 줄' })), value: o.string, onChange: v => setQ({ string: v }) }));
      if (o.pickStart != null) lab('피킹 시작', select({ options: [{ value: 'd', label: '다운 ⊓ (바깥쪽 피킹)' }, { value: 'u', label: '업 V (안쪽 피킹)' }], value: o.pickStart, onChange: v => setQ({ pick: v }) }));
      if (o.pluck != null) lab('오른손 시작', select({ options: [{ value: 'i', label: 'i 검지부터' }, { value: 'm', label: 'm 중지부터' }], value: o.pluck, onChange: v => setQ({ pick: v }) }));
      if (o.hands != null) lab('손', select({ options: [{ value: 'rh', label: '오른손만' }, { value: 'lh', label: '왼손만' }, { value: 'both', label: '양손' }], value: o.hands, onChange: v => setQ({ hands: v }) }));
      if (o.oct != null) lab('범위', select({ options: [{ value: 1, label: '1옥타브' }, { value: 2, label: '2옥타브 (원래 하논)' }], value: o.oct, onChange: v => setQ({ oct: v }) }));
      if (ex.inst === 'vocal') {
        lab('음역', select({ options: Object.entries(GH.data.techVoices).map(([v, V]) => ({ value: v, label: V.ko })), value: o.voice, onChange: v => { try { localStorage.setItem(VOICE_KEY, v); } catch (e) { /* ignore */ } setQ({ voice: v }); } }));
        lab('반음씩 올리기', GH.ui.numberInput({ value: o.steps, min: 0, max: 8, suffix: '번', label: '반음씩 올리는 횟수', onChange: v => setQ({ steps: v }) }));
        if (o.syl != null) lab('가사', select({ options: [{ value: 'solfa', label: '계이름 (도레미)' }, { value: 'vowel', label: '모음 "아"' }], value: o.syl, onChange: v => setQ({ syl: v }) }));
        lab('피아노 가이드', select({ options: (ex.id === 'v-harmony' ? [{ value: 'line', label: '아래 선율 (화음 연습)' }, { value: 'mine', label: '내 음 치기' }] : [{ value: 'mine', label: '내 음 치기' }]).concat([{ value: 'off', label: '끄기 (첫 화음만)' }]), value: o.guide, onChange: v => setQ({ guide: v }) }));
      }
      const rhs = rhOptions(ex);
      if (rhs) lab('리듬', select({ options: rhs.map(k => ({ value: k, label: RH[k].ko + (k === ex.rh ? ' (기본)' : '') })), value: o.rh, onChange: v => setQ({ rh: v === ex.rh ? null : v }) }));
      if (setBar.childNodes.length) el.appendChild(setBar);

      /* 따라 치기 */
      const width = Math.min(1100, el.clientWidth || 700);
      const sheet = sheetFor(ex, B, width, o);
      const tabR = B.kind === 'fretted' ? tabRows(B.notes, o.rh, width, B.NS) : null;
      const view = viewFor(ex, B);
      const status = h('div', { class: 'tech-status', role: 'status', 'aria-live': 'polite' }, '▶ 시작을 누르면 “하나 둘 셋 넷” 뒤에 시작해요.');
      const tempoIn = GH.ui.rangeNumber({ value: t.bpm, min: 30, max: 240, suffix: 'BPM', label: '템포', onInput: v => { t.bpm = v; } });
      const gap = Math.round((Math.ceil(beats / 4 - 1e-6) * 4 - beats) * 1000) / 1000;
      const keyTxt = tr => N.pretty(N.noteName(N.mod(B.V.root + tr, 12), 'sharp')) + ' 메이저' + (tr ? ' (반음 +' + tr + ')' : ' (처음 키)');
      const start = () => {
        GH.player.playSeq(B.seq, {
          tempo: t.bpm, loop: play.loop || play.trainer || (B.kind === 'vocal' && B.trs.length > 1), loopGap: gap, metronome: play.metronome, countIn: play.countIn ? 4 : 0,
          sound: soundFor(ex, B, o),
          onCount: k => { status.textContent = ['하나', '둘', '셋', '넷'][k] || ''; status.classList.add('count'); },
          onPass: (n, tp) => { status.classList.remove('count'); status.textContent = '지금 ' + tp + ' BPM · ' + (n + 1) + '번째' + (B.kind === 'vocal' ? ' · ' + keyTxt(B.trs[n % B.trs.length]) : '') + (play.trainer ? ' · 스피드 트레이너 ' + t.max + ' BPM까지' : ''); tempoIn.setValue(tp); },
          nextTempo: n => { if (play.trainer && n % play.every === 0) t.bpm = Math.min(t.max, t.bpm + play.step); return t.bpm; },
          onNote: (i, ev) => {
            if (sheet) sheet.highlight(i < 0 || !ev ? null : ev.at);
            if (tabR) tabR.highlight(i);
            if (view) view.highlight(i < 0 ? null : ev);
          },
          onStop: () => { status.classList.remove('count'); status.textContent = '멈췄어요. 깨끗하게 쳤다면 아래에 기록을 남겨 보세요.'; }
        });
      };
      const chk = (label, key, extra) => h('label', { class: 'tech-chk' }, h('input', { type: 'checkbox', checked: play[key], onchange: e => { play[key] = e.target.checked; if (extra) extra(); } }), label);
      const trainerBox = h('div', { class: 'tech-trainer', hidden: !play.trainer },
        GH.ui.numberInput({ value: play.every, min: 1, max: 16, suffix: '번', label: '반복 횟수', onChange: v => { play.every = v; } }), h('span', null, '반복마다'),
        GH.ui.numberInput({ value: play.step, min: 1, max: 20, suffix: 'BPM', label: '올릴 템포', onChange: v => { play.step = v; } }), h('span', null, '씩 올려서'),
        GH.ui.numberInput({ value: t.max, min: 30, max: 240, suffix: 'BPM', label: '목표 템포', onChange: v => { t.max = v; } }), h('span', null, '까지'));
      const noteBox = h('div', { class: 'tech-notation' });
      const paintNotation = () => {
        GH.ui.clear(noteBox);
        const showSheet = !tabR || play.view !== 'tab', showTab = tabR && play.view !== 'staff';
        if (showSheet) noteBox.appendChild(sheet ? h('div', { class: 'tech-sheet' }, sheet.el) : h('p', { class: 'muted tech-sheet' }, GH.render.hasVexFlow && GH.render.hasVexFlow() ? '악보를 그릴 수 없습니다.' : '악보는 VexFlow 라이브러리를 인터넷에서 불러오는 중이에요. 잠시 뒤 나타나요.'));
        if (showTab) noteBox.appendChild(tabR.el);
      };
      paintNotation();
      el.appendChild(section('따라 하기',
        h('div', { class: 'toolbar tech-play' }, A.playBtn('▶ 시작', start, 'primary'), A.stopBtn(), h('label', { class: 'tech-tempo' }, '템포', tempoIn)),
        h('div', { class: 'toolbar tech-play-opts' }, chk('메트로놈', 'metronome'), chk('반복', 'loop'), chk('시작 전 4박 세기', 'countIn'), chk('스피드 트레이너', 'trainer', () => { trainerBox.hidden = !play.trainer; }),
          tabR ? h('label', null, '보기', select({ options: [{ value: 'both', label: '오선 + TAB' }, { value: 'staff', label: '오선만' }, { value: 'tab', label: 'TAB만' }], value: play.view, onChange: v => { play.view = v; paintNotation(); } })) : null),
        trainerBox, status, noteBox,
        h('p', { class: 'muted tech-note' }, B.kind === 'fretted' ? '오선의 음은 실제 소리보다 한 옥타브 높게 적는 ' + (ex.inst === 'bass' ? '베이스' : '기타') + ' 표기 관례를 따라요. TAB 숫자는 누를 프렛, 위의 작은 글자는 손가락 · 피킹.' + (ex.inst === 'bass' ? ' x 는 데드 노트.' : '') : B.kind === 'drums' ? '드럼 보표: 맨 위 x 크래시 · 그 아래 x 하이햇 · 라이드, 가운데 칸 스네어, 아래 킥, 맨 아래 x 는 하이햇 페달.' : B.kind === 'keys' ? '위는 오른손(높은음자리표), 아래는 왼손(낮은음자리표). 음표 위 숫자는 손가락 번호.' : '악보는 처음 키로 적었어요. 반복할 때마다 피아노 화음이 새 키를 알려 줘요.')));
      if (view) el.appendChild(section(B.kind === 'keys' ? '건반' : B.kind === 'drums' ? '드럼 킷' : '지판', view.el, h('p', { class: 'muted' }, view.note)));

      /* 기록 */
      const recBox = h('div', { class: 'tech-record-list' });
      const paintRec = () => {
        GH.ui.clear(recBox);
        const r = records()[ex.id]; const b = bestOf(ex.id);
        if (!b) { recBox.appendChild(h('p', { class: 'muted' }, '아직 기록이 없어요. 틀리지 않고 한 바퀴를 마쳤다면 기록해 보세요.')); return; }
        recBox.appendChild(h('p', null, h('b', null, '최고 ' + recLabel(b)), h('span', { class: 'muted' }, ' · ' + dateKo(b.at))));
        recBox.appendChild(h('div', { class: 'row', style: 'gap:6px' }, r.log.slice(-6).reverse().map(e => h('span', { class: 'badge' }, dateKo(e.at) + ' ' + e.bpm + (e.rh !== ex.rh && RH[e.rh] ? ' (' + RH[e.rh].ko + ')' : '')))));
      };
      const saved = h('span', { class: 'bug-copied', role: 'status', 'aria-live': 'polite' });
      el.appendChild(section('내 기록', h('div', { class: 'tech-record' },
        h('div', { class: 'row', style: 'gap:8px' }, h('button', { class: 'btn small', type: 'button', onclick: () => { addRecord(ex.id, t.bpm, o.rh); paintRec(); saved.textContent = t.bpm + ' BPM 기록했어요.'; } }, GH.icon('check'), '지금 템포로 기록 (깨끗하게 쳤을 때)'), saved),
        recBox, h('p', { class: 'muted', style: 'font-size:.8rem' }, '기록은 이 브라우저에만 저장돼요.'))));
      paintRec();

      el.appendChild(section('도움말', h('ul', { class: 'tech-tips' }, ex.tips.map(x => h('li', null, x))), ex.src ? h('p', { class: 'tech-src' }, h('b', null, '참고: '), ex.src) : null));
      const same = GH.data.technique.filter(e => e.cat === ex.cat && e.id !== ex.id);
      const extra = ex.inst === 'guitar' && (ex.cat === 'pent' || ex.id === 'pent-legato') ? [h('a', { href: A.scaleHref('minor_pent', o.key || 'A') }, '스케일 포지션에서 박스 보기')] : [];
      el.appendChild(section('다음에 해 볼 것', h('div', { class: 'toc' }, same.map(e => h('a', { href: exHref(e) }, e.ko)).concat(extra, [h('a', { href: '#/technique/' + I.id }, I.ko + ' 기본기 목록'), h('a', { href: '#/rhythm' }, '메트로놈 · 리듬 연습')]))));
    }
  };
  GH.technique = { build, options, bestOf, rhOptions, RH };
})();
