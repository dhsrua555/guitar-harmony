/* 세션별 페이지: 베이스 · 키보드 · 보컬의 코드 보이싱 · 스케일 · 트라이어드 · 코드 파인더 (기타는 /guitar/… 원래 페이지)
   각 세션은 메뉴에 따로 있고, 페이지 위의 칩으로 같은 주제의 다른 세션 페이지로 건너간다 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, select, chips } = GH.ui; const N = GH.notes; const mod = N.mod;
  const INSTS = [{ id: 'guitar', ko: '기타', icon: 'guitar' }, { id: 'bass', ko: '베이스', icon: 'bass' }, { id: 'keys', ko: '키보드', icon: 'piano' }, { id: 'vocal', ko: '보컬', icon: 'mic' }];
  const BASS = () => GH.data.techBassTuning;
  const SOLFA = ['도', '도#', '레', '미♭', '미', '파', '파#', '솔', '솔#', '라', '시♭', '시'];
  const PART_KO = ['베이스', '테너', '알토', '소프라노'];
  const instKo = id => (INSTS.find(i => i.id === id) || INSTS[0]).ko;
  /* 주제별 세션 페이지 주소 */
  const ROUTES = {
    voicings: { guitar: '/guitar/voicings/basic', bass: '/bass/chords', keys: '/keys/voicings', vocal: '/vocal/chords' },
    scales: { guitar: '/guitar/scales', bass: '/bass/scales', keys: '/keys/scales', vocal: '/vocal/scales' },
    triads: { guitar: '/guitar/triads', bass: '/bass/arpeggios', keys: '/keys/arpeggios', vocal: '/vocal/arpeggios' },
    finder: { guitar: '/tools/finder', bass: '/bass/finder', keys: '/keys/finder', vocal: '/vocal/chords' }
  };
  const vstate = { voice: null, pattern: 'ascdesc', tempo: 100, hands: 'both', finder: new Set(), bassFrets: [null, null, null, null] };
  const voiceId = () => { const V = GH.data.techVoices; if (V[vstate.voice]) return vstate.voice; try { const s = localStorage.getItem('gh.tech.voice'); if (V[s]) return s; } catch (e) { /* ignore */ } return 'alto'; };

  /* ---- 같은 주제의 다른 세션 페이지로 ---- */
  function switcher(kind, cur, note) {
    const qy = (GH.router.current() && GH.router.current().query) || {};
    const keep = {}; ['root', 'q', 'scale', 'arpQ'].forEach(k => { if (qy[k]) keep[k] = qy[k]; });
    return h('div', { class: 'inst-switch', role: 'navigation', 'aria-label': '다른 세션으로 보기' },
      h('span', { class: 'tech-lab' }, '다른 세션으로 보기'),
      h('div', { class: 'chips' }, INSTS.map(i => h('a', { class: 'chip' + (i.id === cur ? ' active' : ''), href: GH.router.href(ROUTES[kind][i.id], keep), 'aria-current': i.id === cur ? 'page' : null }, GH.icon(i.icon), i.ko)),
        h('a', { class: 'chip', href: '#/technique/drums', title: '드럼은 음높이가 없어 코드 · 스케일 대신 기본기 연습으로 가요' }, GH.icon('drum'), '드럼 기본기 →')),
      note ? h('p', { class: 'muted inst-note' }, note) : null);
  }

  /* ---- 공통 ---- */
  const semis = chord => chord.quality.intervals.map(N.ivSemi);
  const ivOf = (chord, pc) => { const n = chord.notes.find(x => x.pc === pc); return n ? n.iv : N.tensionIv(N.intervalName(chord.rootPc, pc)); };
  const deg = (chord, re) => { const i = chord.quality.intervals.findIndex(x => re.test(x)); return i >= 0 ? N.ivSemi(chord.quality.intervals[i]) : null; };
  /* 코드 음은 코드의 철자(B♭ 등)로, 텐션은 키 기준으로 */
  const nameList = (ms, pref, chord) => ms.map(m => { const n = chord && chord.notes.find(x => x.pc === mod(m, 12)); return N.pretty((n ? n.name : N.noteName(mod(m, 12), pref)) + (Math.floor(m / 12) - 1)); }).join(' ');
  function pianoFor(ms, chord, pref, opts) {
    opts = opts || {};
    const lo = Math.min(...ms), hi = Math.max(...ms);
    const from = opts.from != null ? opts.from : lo - mod(lo, 12), to = opts.to != null ? opts.to : Math.max(from + 23, hi + (11 - mod(hi, 12)));
    const onMidi = {}; ms.forEach(m => { const iv = chord ? ivOf(chord, mod(m, 12)) : ''; onMidi[m] = { label: opts.labels ? opts.labels[m] : iv, cls: opts.cls ? opts.cls(m) : N.ivClass(iv) }; });
    return GH.render.piano({ from, to, onMidi, pref, preset: 'piano' });
  }
  const playBlock = (lh, rh) => { const A = GH.audio; if (!A.context()) return; GH.player.stop(); const t = A.now() + 0.06; lh.forEach((m, i) => A.pluck(m, t + i * 0.02, 2.2, { preset: 'piano', gain: 0.7 })); rh.forEach((m, i) => A.pluck(m, t + 0.05 + i * 0.025, 2.2, { preset: 'piano', gain: 0.62 })); };
  const playSeqNotes = (ms, tempo, sound, onNote) => GH.player.playSeq(ms.map(m => ({ d: 0.5, m })), { tempo: tempo || 110, sound: (ev, t, dur) => sound(ev.m, t, dur), onNote: (i, ev) => onNote && onNote(i, ev) });

  /* ============ 키보드: 코드 보이싱 ============ */
  function keysVoicings(chord, level) {
    const S = semis(chord); const core = S.filter(x => x < 12).sort((a, b) => a - b); const ext = S.filter(x => x >= 12);
    const R = chord.rootPc <= 5 ? 60 + chord.rootPc : 48 + chord.rootPc; const L = R - 12;
    const third = deg(chord, /^(b3|3|2|4)$/), fifth = deg(chord, /^(b5|5|#5)$/), seventh = deg(chord, /^(bb7|b7|7|6)$/);
    const out = [];
    const rot = k => core.map((x, i) => R + x + (i < k ? 12 : 0)).sort((a, b) => a - b);
    if (level !== 'advanced') {
      out.push({ name: '기본형', desc: '오른손은 코드 음을 아래에서부터 차례로, 왼손은 루트.', lh: [L], rh: rot(0).concat(ext.map(x => R + x)) });
      for (let k = 1; k < core.length; k++) out.push({ name: k + '전위', desc: '맨 아래 음을 한 옥타브 올린 모양. 코드를 옮길 때 손을 적게 움직이게 해요.', lh: [L], rh: rot(k).concat(ext.map(x => R + x + 12)) });
      /* 팝 반주: 왼손 옥타브, 오른손은 맨 위 음이 A4~E5 근처인 전위 */
      let best = rot(0); for (let k = 0; k < core.length; k++) { const v = rot(k).map(x => x + 12); if (Math.abs(v[v.length - 1] - 74) < Math.abs(best[best.length - 1] - 74)) best = v; }
      out.push({ name: '팝 반주형', desc: '왼손 옥타브 + 오른손 코드. 발라드 · 팝 반주에서 가장 흔한 모양이에요.', lh: [L - 12, L], rh: best });
      if (fifth != null && third != null) out.push({ name: '오픈 (양손 펼침)', desc: '왼손 루트 · 5음, 오른손 3음 · 7음 · 루트. 넓고 풍성한 소리예요.', lh: [L, L + fifth], rh: [R + third, seventh != null && seventh !== fifth ? R + seventh : R + 12].concat(seventh != null ? [R + 12 + (ext[0] != null ? ext[0] - 12 : 0)] : []).sort((a, b) => a - b) });
    } else {
      if (seventh == null || third == null) return { note: '재즈 보이싱은 세븐 코드(maj7 · m7 · 7 · m7b5 …)에서 볼 수 있어요. 코드 퀄리티를 세븐 코드로 바꿔 보세요.', list: keysVoicings(chord, 'basic').list };
      const dom = chord.quality.family === 'dominant' || /^(7|9|13)/.test(chord.qId);
      const nine = 14, five = fifth != null ? fifth : 7, top = dom ? 21 : five + 12;  /* 도미넌트는 5음 대신 13 */
      const place = (degs, low) => { const ms = []; let prev = low - 1; degs.forEach(d => { let m = prev + 1 + mod(chord.rootPc + d - (prev + 1), 12); ms.push(m); prev = m; }); return ms; };
      out.push({ name: '셸 (왼손 1-7)', desc: '루트와 7음만. 오른손은 멜로디를 치고 왼손이 코드를 받쳐요.', lh: [L - 12, L - 12 + seventh], rh: [] });
      out.push({ name: '셸 (왼손 1-10)', desc: '루트와 한 옥타브 위 3음(10도). 1-7 셸과 번갈아 쓰면 손이 거의 움직이지 않아요. 손이 작으면 3음만 따로 쳐도 돼요.', lh: [L - 12, L + third], rh: [] });
      out.push({ name: '루트리스 A형 (3-' + (dom ? '13' : '5') + '-7-9)', desc: '루트를 빼고 3음부터 쌓은 빌 에반스식 보이싱. 베이스가 루트를 맡을 때 써요.', lh: place([third, dom ? 9 : five, seventh, nine], 50), rh: [] });
      out.push({ name: '루트리스 B형 (7-9-3-' + (dom ? '13' : '5') + ')', desc: 'A형을 뒤집은 모양. ii–V–I 에서 A형과 번갈아 쓰면 음이 반음 · 온음씩만 움직여요.', lh: place([seventh, nine, third, dom ? 9 : five], 50), rh: [] });
      const close = [0, third, five, seventh].map(x => R + x).sort((a, b) => a - b);
      out.push({ name: '드롭 2 (양손)', desc: '4음 클로즈의 위에서 두 번째 음을 한 옥타브 내려 왼손으로. 음 사이가 넓어져 맑게 울려요.', lh: [close[2] - 12, close[0]], rh: [close[1], close[3]] });
      if (/^m/.test(chord.qId) && !/maj/.test(chord.qId) && chord.quality.family !== 'diminished') out.push({ name: '쿼탈 (So What)', desc: '4도 · 4도 · 4도 · 3도로 쌓은 모달 재즈 보이싱 (마일스 데이비스 〈So What〉).', lh: [L - 12, L - 7, L - 2], rh: [L + 3, L + 7] });
      if (dom) out.push({ name: '어퍼 스트럭처 (II 트라이어드)', desc: '왼손 3음 · 7음(트라이톤) 위에 한 음 위 메이저 트라이어드(9 · #11 · 13)를 얹은 화려한 도미넌트.', lh: [L + third - 12, L + seventh - 12].sort((a, b) => a - b), rh: [R + 14, R + 18, R + 21].map(x => x > 79 ? x - 12 : x).sort((a, b) => a - b) });
    }
    return { list: out };
  }
  function keysVoiceCard(chord, v, pref) {
    const all = v.lh.concat(v.rh);
    return h('div', { class: 'card inst-card' },
      h('div', { class: 'row', style: 'justify-content:space-between' }, h('b', null, v.name), GH.app.playBtn('▶ 듣기', () => playBlock(v.lh, v.rh))),
      h('div', { class: 'inst-piano' }, pianoFor(all, chord, pref)),
      h('div', { class: 'inst-hands' }, v.lh.length ? h('span', null, h('b', null, '왼손 '), nameList(v.lh, pref, chord)) : null, v.rh.length ? h('span', null, h('b', null, '오른손 '), nameList(v.rh, pref, chord)) : null),
      h('p', { class: 'muted' }, v.desc));
  }
  function keysVoiceLeading(level, pref) {
    const key = GH.app.key(); const kp = N.pcOf(key);
    const box = h('div');
    if (level === 'advanced') {
      const ch = [[2, 'm7'], [7, '7'], [0, 'maj7']].map(([d, q]) => GH.chords.buildChord(N.noteName(mod(kp + d, 12), pref), q));
      const forms = ['A', 'B', 'A']; const vs = ch.map((c, i) => { const r = keysVoicings(c, 'advanced').list; return r.find(x => x.name.startsWith('루트리스 ' + forms[i])); });
      box.appendChild(h('p', { class: 'muted' }, N.pretty(key) + ' 키 ii–V–I 을 루트리스 A → B → A 로. 왼손 보이싱은 거의 제자리, 3음 · 7음이 반음씩 움직여요. 오른손 대신 베이스가 루트를 쳐요.'));
      box.appendChild(h('div', { class: 'grid cols-3' }, ch.map((c, i) => keysVoiceCard(c, Object.assign({}, vs[i], { name: c.symbol + ' · ' + vs[i].name }), pref))));
      box.appendChild(GH.app.playBtn('▶ ii–V–I 이어 듣기', () => { GH.player.playSeq(ch.map((c, i) => ({ d: 4, i })), { tempo: 90, sound: (ev, t, dur) => { vs[ev.i].lh.forEach(m => GH.audio.pluck(m, t, dur * 0.95, { preset: 'piano', gain: 0.6 })); GH.audio.bass(28 + mod(ch[ev.i].rootPc - 4, 12), t, dur * 0.9, {}); } }); }, 'primary'));
      return section('보이스 리딩: ii–V–I', box);
    }
    const ch = [[0, 'maj'], [5, 'maj'], [7, 'maj'], [0, 'maj']].map(([d, q]) => GH.chords.buildChord(N.noteName(mod(kp + d, 12), pref), q));
    const R = 60 + kp - (kp > 5 ? 12 : 0);
    const rhs = [[R, R + 4, R + 7], [R, R + 5, R + 9], [R - 1, R + 2, R + 7], [R, R + 4, R + 7]], lhs = [[R - 12], [R - 19], [R - 17], [R - 12]];
    box.appendChild(h('p', { class: 'muted' }, N.pretty(key) + ' 키 I – IV – V – I 을 가까운 전위로 이어요 (I 기본형 → IV 2전위 → V 1전위). 오른손이 거의 움직이지 않아요.'));
    box.appendChild(h('div', { class: 'grid cols-4' }, ch.map((c, i) => keysVoiceCard(c, { name: c.symbol, desc: ['기본형', '2전위', '1전위', '기본형'][i], lh: lhs[i], rh: rhs[i] }, pref))));
    box.appendChild(GH.app.playBtn('▶ 이어 듣기', () => { GH.player.playSeq(ch.map((c, i) => ({ d: 2, i })), { tempo: 80, sound: (ev, t, dur) => { lhs[ev.i].concat(rhs[ev.i]).forEach(m => GH.audio.pluck(m, t, dur * 0.95, { preset: 'piano', gain: 0.62 })); } }); }, 'primary'));
    return section('코드 잇기: I – IV – V – I', box);
  }

  /* ============ 베이스: 코드톤 자리 ============ */
  function bassPlace(tun, midi, P) {
    const NS = tun.length;
    for (const [lo, hi] of [[P, P + 3], [P - 1, P + 4]]) for (let s = NS; s >= 1; s--) { const f = midi - tun[NS - s]; if (f >= Math.max(0, lo) && f <= hi) return { s, f, fg: f === 0 ? 0 : Math.max(1, Math.min(4, f - P + 1)) }; }
    return null;
  }
  function bassShapes(chord) {
    const tun = BASS(); const S = semis(chord).filter(x => x < 12).sort((a, b) => a - b).concat([12]);
    const shapes = [];
    [[4, 28], [3, 33]].forEach(([s, base]) => {
      let f = mod(chord.rootPc - mod(base, 12), 12); if (f < 2) f += 12;
      const rootMidi = base + f; const P = semis(chord).includes(3) ? f : f - 1;   /* 마이너는 루트를 검지, 나머지는 중지로 */
      const notes = S.map(x => { const p = bassPlace(tun, rootMidi + x, P); return p ? Object.assign(p, { midi: rootMidi + x, label: x === 12 ? '1' : ivOf(chord, mod(rootMidi + x, 12)) }) : null; });
      if (notes.every(Boolean)) shapes.push({ name: (s === 4 ? 'E' : 'A') + ' 줄 루트 (' + f + '프렛)', notes, P });
    });
    return shapes;
  }
  function bassCards(chord, pref) {
    const tun = BASS();
    return bassShapes(chord).map(sh => {
      const fb = GH.render.fretboard({ tuning: tun, notes: sh.notes.map(n => ({ s: n.s, f: n.f, label: n.label, cls: N.ivClass(n.label) })), from: Math.max(0, sh.P - 1), to: sh.P + 5, pref, capo: 0, sound: m => GH.audio.bass(m, GH.audio.now(), 1.2, {}) });
      const seq = sh.notes.concat(sh.notes.slice(0, -1).reverse());
      return h('div', { class: 'card inst-card' },
        h('div', { class: 'row', style: 'justify-content:space-between' }, h('b', null, sh.name), GH.app.playBtn('▶ 아르페지오', () => playSeqNotes(seq.map(n => n.midi), 120, (m, t, d) => GH.audio.bass(m, t, d * 0.9, {}), (i, ev) => fb.highlightMany(i < 0 || !ev ? [] : [[seq[i].s, seq[i].f]])))),
        fb.el, h('p', { class: 'muted' }, '손가락: ' + sh.notes.map(n => n.fg).join('-') + ' · 1-3-5-(7)-8 을 올라갔다 내려와요.'));
    });
  }

  /* ============ 보컬: 코드톤 부르기 · 화음 나누기 ============ */
  function vocalChord(chord, pref) {
    const V = GH.data.techVoices[voiceId()]; const S = semis(chord).filter(x => x < 12).sort((a, b) => a - b);
    let root = V.root + mod(chord.rootPc - mod(V.root, 12), 12); if (root > V.root + 5) root -= 12;
    const up = S.map(x => root + x).concat([root + 12]); const line = up.concat(up.slice(0, -1).reverse());
    const box = h('div');
    box.appendChild(h('div', { class: 'toolbar' }, h('label', null, '음역', select({ options: Object.entries(GH.data.techVoices).map(([v, x]) => ({ value: v, label: x.ko })), value: voiceId(), onChange: v => { vstate.voice = v; try { localStorage.setItem('gh.tech.voice', v); } catch (e) { /* ignore */ } GH.router.rerender(); } }))));
    const events = line.map((m, i) => ({ at: i, d: 1, m: [m], names: [N.noteName(mod(m, 12), pref)], lyric: SOLFA[mod(m - root, 12)] }));
    const sh = GH.render.sheet && GH.render.sheet({ kind: 'line', clef: V.clef, written: V.clef === 'treble8vb' ? 12 : 0, pref, events, width: 700 });
    box.appendChild(sh ? h('div', { class: 'tech-sheet' }, sh.el) : h('p', { class: 'muted' }, '악보를 불러오는 중이에요.'));
    box.appendChild(h('div', { class: 'row', style: 'gap:8px;margin-top:8px' }, GH.app.playBtn('▶ 코드 듣고 따라 부르기', () => { GH.player.playSeq(events, { tempo: 84, sound: (ev, t, dur) => { if (ev.at === 0) up.slice(0, -1).forEach(m => GH.audio.pluck(m - 12, t, events.length * dur, { preset: 'piano', gain: 0.35 })); GH.audio.pluck(ev.m[0], t, dur * 0.9, { preset: 'piano', gain: 0.6 }); }, onNote: (i, ev) => sh && sh.highlight(i < 0 || !ev ? null : ev.at) }); }, 'primary'), GH.app.stopBtn()));
    box.appendChild(h('p', { class: 'muted' }, '가사 줄은 코드 루트를 "도"로 둔 계이름이에요. 피아노가 코드를 깔아 주면 한 음씩 따라 불러 보세요.'));
    /* 합창 파트: 베이스 = 루트, 나머지 음을 테너 · 알토 · 소프라노에 가까이 */
    const tones = S.slice(1); const parts = [];
    let b = 40 + mod(chord.rootPc - 4, 12); parts.push(b);
    const want = [55, 62, 69]; const pool = tones.length >= 3 ? tones.slice(0, 3) : tones.concat([0]).slice(0, 3);
    let prev = b;
    pool.forEach((x, i) => { let m = prev + 1 + mod(chord.rootPc + x - (prev + 1), 12); while (m < want[i] - 6) m += 12; parts.push(m); prev = m; });
    const sat = GH.render.sheet && GH.render.sheet({ kind: 'grand', pref, width: 360, rh: [{ at: 0, d: 4, m: [parts[2], parts[3]], fg: '' }], lh: [{ at: 0, d: 4, m: [parts[0], parts[1]] }] });
    const partBtns = parts.map((m, i) => GH.app.playBtn('▶ ' + PART_KO[i] + ' ' + N.pretty(N.midiName(m, pref)), () => { GH.player.stop(); const t = GH.audio.now() + 0.05; GH.audio.pluck(m, t, 2, { preset: 'piano', gain: 0.8 }); }));
    box.appendChild(h('h3', null, '4성부로 나누기 (합창 · 코러스)'));
    box.appendChild(h('div', { class: 'split' }, sat ? h('div', { class: 'tech-sheet' }, sat.el) : null,
      h('div', null, h('p', { class: 'muted' }, '베이스가 루트, 테너 · 알토 · 소프라노가 나머지 코드 음을 나눠 불러요. 파트마다 자기 음을 먼저 듣고, 다 같이 맞춰 보세요.'), h('div', { class: 'row', style: 'gap:6px' }, partBtns, GH.app.playBtn('▶ 다 같이', () => playBlock(parts.slice(0, 2), parts.slice(2)), 'primary')))));
    return box;
  }

  /* ============ 페이지: 코드 보이싱 ============ */
  function voicingsPage(el, params, level, inst) {
    const A = GH.app; const qy = params.query || {};
    const root = qy.root || A.key(); const qId = GH.chords.getQuality(qy.q) ? qy.q : (level === 'advanced' ? 'maj7' : 'maj'); const pref = A.pref(root);
    const chord = GH.chords.buildChord(root, qId);
    const path = inst === 'keys' ? (level === 'advanced' ? '/keys/voicings/advanced' : '/keys/voicings') : ROUTES.voicings[inst];
    const navigate = extra => GH.router.go(path, Object.assign({ root, q: qId }, extra || {}));
    const title = inst === 'keys' ? (level === 'advanced' ? '재즈 · 확장 보이싱 (건반)' : '건반 코드 보이싱') : inst === 'bass' ? '베이스 코드톤 자리' : '코드톤 부르기 · 화음 나누기';
    el.appendChild(h('div', { class: 'breadcrumb' }, h('a', { href: '#/' + inst }, instKo(inst)), ' › ' + title));
    el.appendChild(h('h1', null, title));
    el.appendChild(switcher('voicings', inst));
    el.appendChild(h('div', { class: 'toolbar' },
      h('label', null, '루트', A.rootSelect(root, v => navigate({ root: v }))),
      h('label', null, '코드 퀄리티', A.qualitySelect(qId, v => navigate({ q: v }))),
      inst === 'keys' ? h('div', { class: 'chips' }, [['basic', '기본 보이싱'], ['advanced', '재즈 · 확장']].map(([lv, l]) => h('a', { class: 'chip' + ((level || 'basic') === lv ? ' active' : ''), href: GH.router.href(lv === 'advanced' ? '/keys/voicings/advanced' : '/keys/voicings', { root, q: qId }) }, l))) : null));
    el.appendChild(h('div', { class: 'card' }, h('div', { class: 'row' }, h('span', { class: 'symbol-big' }, chord.symbol), A.chordPills(chord, { name: true }), A.chordPills(chord), h('a', { class: 'btn small', href: A.chordHref(root, qId) }, '코드 상세 →')), h('p', { class: 'muted', style: 'margin:.6em 0 0' }, chord.quality.desc)));
    el.appendChild(h('div', { style: 'margin:8px 0' }, A.ivLegend()));
    if (inst === 'keys') {
      const r = keysVoicings(chord, level);
      if (r.note) el.appendChild(GH.ui.notice(r.note));
      el.appendChild(section(level === 'advanced' && !r.note ? '재즈 · 확장 보이싱' : '기본 보이싱', h('p', { class: 'muted' }, '건반 숫자는 도수예요. ▶ 로 들어 보고, 같은 모양을 다른 루트로도 옮겨 쳐 보세요.'), h('div', { class: 'grid cols-3' }, r.list.map(v => keysVoiceCard(chord, v, pref)))));
      el.appendChild(keysVoiceLeading(r.note ? 'basic' : level, pref));
      el.appendChild(section('건반 전체의 코드톤', GH.render.piano({ from: 36, to: 84, on: Object.fromEntries(chord.notes.map(n => [n.pc, { label: n.iv, cls: n.cls }])), pref, preset: 'piano' })));
    } else if (inst === 'bass') {
      el.appendChild(section('코드톤 자리 (아르페지오 모양)', h('p', { class: 'muted' }, '베이스는 코드를 한꺼번에 누르기보다 코드 음을 하나씩 짚어요. 루트를 E 줄 · A 줄에 둔 두 자리를 익히면 모든 키에서 같은 모양으로 쓸 수 있어요.'), h('div', { class: 'grid cols-2' }, bassCards(chord, pref))));
      el.appendChild(section('지판 전체의 코드톤', GH.render.fretboard({ tuning: BASS(), pcMap: Object.fromEntries(chord.notes.map(n => [n.pc, { label: n.iv, cls: n.cls }])), pref, to: 17, capo: 0, sound: m => GH.audio.bass(m, GH.audio.now(), 1.2, {}) }).el));
      el.appendChild(h('div', { class: 'toc' }, h('a', { href: '#/technique/bass/b-arp' }, '베이스 기본기: 코드톤 아르페지오 →'), h('a', { href: '#/technique/bass/b-walk' }, '워킹 베이스 →')));
    } else {
      el.appendChild(section('코드톤 부르기', vocalChord(chord, pref)));
      el.appendChild(h('div', { class: 'toc' }, h('a', { href: '#/technique/vocal/v-harmony' }, '보컬 기본기: 3도 화음 부르기 →'), h('a', { href: '#/technique/vocal/v-arp' }, '아르페지오 발성 →')));
    }
  }

  /* ============ 페이지: 스케일 (키보드 · 보컬) ============ */
  /* 메이저 스케일 표준 운지 (오른손 · 왼손, 한 옥타브: 7음 + 맨 위 음) */
  const FG = {
    rh: { C: '1231234', G: '1231234', D: '1231234', A: '1231234', E: '1231234', B: '1231234', F: '1234123', Bb: '2123123', Eb: '3123412', Ab: '3412312', Db: '2312341', Gb: '2341231' },
    lh: { C: '5432132', G: '5432132', D: '5432132', A: '5432132', E: '5432132', B: '4321432', F: '5432132', Bb: '3214321', Eb: '3214321', Ab: '3214321', Db: '3214321', Gb: '4321321' }
  };
  const FG_TOP = { rh: { C: 5, G: 5, D: 5, A: 5, E: 5, B: 5, F: 4, Bb: 4, Eb: 3, Ab: 3, Db: 2, Gb: 2 }, lh: { C: 1, G: 1, D: 1, A: 1, E: 1, B: 1, F: 1, Bb: 3, Eb: 3, Ab: 3, Db: 3, Gb: 4 } };
  const fgKey = pc => ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'][mod(pc, 12)];
  function scaleFingers(pc, hand, n) {
    const k = fgKey(pc); const pat = FG[hand][k]; if (!pat) return null;
    const out = []; for (let i = 0; i < n - 1; i++) out.push(Number(pat[i % 7]));
    out.push(FG_TOP[hand][k]); return out;
  }
  function scalePage(el, params, inst) {
    const A = GH.app; const qy = params.query || {};
    const root = qy.root || A.key(); const scaleId = GH.scales.get(qy.scale) ? qy.scale : 'ionian'; const sc = GH.scales.get(scaleId);
    const pref = A.pref(root); const rootPc = N.pcOf(root);
    const go = patch => GH.router.go(ROUTES.scales[inst], Object.assign({ root, scale: scaleId }, patch));
    const title = inst === 'keys' ? '스케일 · 운지' : '스케일 부르기';
    el.appendChild(h('div', { class: 'breadcrumb' }, h('a', { href: '#/' + inst }, instKo(inst)), ' › ' + title));
    el.appendChild(h('h1', null, title));
    el.appendChild(switcher('scales', inst));
    const semisOf = sc.intervals.map(N.ivSemi).map(x => mod(x, 12)).sort((a, b) => a - b);
    const lm = GH.scales.labelMap(rootPc, scaleId);
    const pats = [{ value: 'asc', label: '상행' }, { value: 'desc', label: '하행' }, { value: 'ascdesc', label: '상행 후 하행' }, { value: 'thirds', label: '3도 시퀀스' }, { value: 'fours', label: '4음 그룹' }];
    const tempoIn = GH.ui.rangeNumber({ value: vstate.tempo, min: 40, max: 220, suffix: 'BPM', label: '템포', onInput: v => { vstate.tempo = v; } });
    const tb = h('div', { class: 'toolbar' },
      h('label', null, '루트', A.rootSelect(root, v => go({ root: v }))),
      h('label', null, '스케일', A.scaleSelect(scaleId, v => go({ scale: v }))),
      h('label', null, '패턴', select({ options: pats, value: vstate.pattern, onChange: v => { vstate.pattern = v; GH.router.rerender(); } })),
      inst === 'keys' ? h('label', null, '손', select({ options: [{ value: 'rh', label: '오른손' }, { value: 'lh', label: '왼손' }, { value: 'both', label: '양손' }], value: vstate.hands, onChange: v => { vstate.hands = v; GH.router.rerender(); } })) : null,
      inst === 'vocal' ? h('label', null, '음역', select({ options: Object.entries(GH.data.techVoices).map(([v, x]) => ({ value: v, label: x.ko })), value: voiceId(), onChange: v => { vstate.voice = v; try { localStorage.setItem('gh.tech.voice', v); } catch (e) { /* ignore */ } GH.router.rerender(); } })) : null,
      h('label', null, '템포', tempoIn));
    el.appendChild(tb);
    el.appendChild(h('div', { class: 'card' }, h('div', { class: 'row' }, h('span', { class: 'symbol-big', style: 'font-size:1.4rem' }, N.pretty(root) + ' ' + sc.ko), h('span', { class: 'muted' }, sc.en)),
      h('div', { class: 'row', style: 'margin:6px 0' }, GH.ui.pills(GH.scales.notes(root, scaleId).map(n => ({ label: N.pretty(n.name), cls: n.cls }))), GH.ui.pills(GH.scales.notes(root, scaleId).map(n => ({ label: n.label, cls: n.cls })))), h('p', { class: 'muted', style: 'margin:.4em 0 0' }, sc.desc)));
    let base, octaves;
    if (inst === 'keys') { base = 60 + rootPc - (rootPc > 5 ? 12 : 0); octaves = 1; }
    else { const V = GH.data.techVoices[voiceId()]; base = V.root + mod(rootPc - mod(V.root, 12), 12); if (base > V.root + 4) base -= 12; octaves = 1; }
    const upMidis = []; for (let o = 0; o < octaves; o++) semisOf.forEach(x => upMidis.push(base + 12 * o + x)); upMidis.push(base + 12 * octaves);
    const notes = upMidis.map(m => ({ midi: m, pc: mod(m, 12) }));
    const seq = GH.positions.pattern(notes, vstate.pattern).map(n => n.midi);
    const major = scaleId === 'ionian' && inst === 'keys';
    const rf = major ? scaleFingers(rootPc, 'rh', upMidis.length) : null, lf = major ? scaleFingers(rootPc, 'lh', upMidis.length) : null;
    const fgOf = (hand, m) => { const f = hand === 'rh' ? rf : lf; if (!f) return ''; const i = upMidis.indexOf(hand === 'rh' ? m : m + 12); return i >= 0 ? String(f[i]) : ''; };
    const d = 0.5;
    let sheet = null, view = null;
    if (inst === 'keys') {
      const withF = ['asc', 'desc', 'ascdesc'].includes(vstate.pattern);
      const rh = vstate.hands === 'lh' ? [] : seq.map((m, i) => ({ at: i * d, d, m: [m], fg: withF ? fgOf('rh', m) : '' }));
      const lh = vstate.hands === 'rh' ? [] : seq.map((m, i) => ({ at: i * d, d, m: [m - 12], fg: withF ? fgOf('lh', m - 12) : '' }));
      sheet = GH.render.sheet && GH.render.sheet({ kind: 'grand', pref, width: Math.min(1100, el.clientWidth || 800), rh, lh });
      const shown = [].concat(vstate.hands !== 'lh' ? upMidis : [], vstate.hands !== 'rh' ? upMidis.map(m => m - 12) : []);
      const labels = {}; shown.forEach(m => { labels[m] = lm[mod(m, 12)] || ''; });
      view = pianoFor(shown, null, pref, { labels, cls: m => N.ivClass(lm[mod(m, 12)] || '') });
      el.appendChild(section('건반 · 운지', h('div', { class: 'inst-piano wide' }, view),
        h('p', { class: 'muted' }, major ? '음표 위 숫자가 손가락 번호(1 엄지 ~ 5 새끼)예요. 엄지를 넘기는 자리에서 소리가 끊기지 않게 해 보세요.' : '운지 표는 메이저 스케일(아이오니안)에만 붙여 두었어요. 다른 스케일은 가까운 메이저 스케일 운지를 바탕으로 쳐 보세요.')));
    } else {
      const V = GH.data.techVoices[voiceId()];
      sheet = GH.render.sheet && GH.render.sheet({ kind: 'line', clef: V.clef, written: V.clef === 'treble8vb' ? 12 : 0, pref, width: Math.min(1100, el.clientWidth || 800), events: seq.map((m, i) => ({ at: i * d, d, m: [m], lyric: SOLFA[mod(m - base, 12)] })) });
    }
    const status = h('div', { class: 'tech-status', role: 'status', 'aria-live': 'polite' });
    el.appendChild(section(inst === 'keys' ? '악보 · 따라 치기' : '악보 · 따라 부르기',
      h('div', { class: 'toolbar' }, A.playBtn('▶ 재생', () => {
        GH.player.playSeq(seq.map((m, i) => ({ d, m, i })), { tempo: vstate.tempo, countIn: 4,
          sound: (ev, t, dur) => { if (inst === 'keys') { if (vstate.hands !== 'lh') GH.audio.pluck(ev.m, t, dur * 0.95, { preset: 'piano', gain: 0.72 }); if (vstate.hands !== 'rh') GH.audio.pluck(ev.m - 12, t, dur * 0.95, { preset: 'piano', gain: 0.6 }); } else GH.audio.pluck(ev.m, t, dur * 0.95, { preset: 'piano', gain: 0.65 }); },
          onCount: k => { status.textContent = ['하나', '둘', '셋', '넷'][k] || ''; },
          onNote: (i, ev) => { status.textContent = i >= 0 ? '' : status.textContent; if (sheet) sheet.highlight(i < 0 || !ev ? null : ev.i * d); if (view && view.highlightMany) view.highlightMany(i < 0 || !ev ? [] : [].concat(vstate.hands !== 'lh' ? [ev.m] : [], vstate.hands !== 'rh' ? [ev.m - 12] : [])); } });
      }, 'primary'), A.stopBtn(), status),
      sheet ? h('div', { class: 'tech-sheet' }, sheet.el) : h('p', { class: 'muted' }, '악보를 불러오는 중이에요.'),
      inst === 'vocal' ? h('p', { class: 'muted' }, '가사 줄은 루트를 "도"로 둔 계이름이에요. 피아노를 따라 부른 뒤, 소리를 끄고 혼자 불러 보세요.') : null));
    el.appendChild(h('div', { class: 'toc' }, h('a', { href: A.theoryScaleHref(scaleId, root) }, '스케일 이론 →'), h('a', { href: inst === 'keys' ? '#/technique/keys/k-scale' : '#/technique/vocal/v-five' }, inst === 'keys' ? '키보드 기본기: 스케일 2옥타브 →' : '보컬 기본기: 5음 스케일 →')));
  }

  /* ============ 페이지: 트라이어드 · 아르페지오 ============ */
  function triadsPage(el, params, inst) {
    const A = GH.app; const qy = params.query || {};
    const root = N.parseNote(qy.root) ? N.normalize(qy.root) : A.key();
    const tq = GH.chords.getQuality(qy.q); const q = tq && tq.intervals.length === 3 ? qy.q : 'maj';
    const arpQ = GH.chords.getQuality(qy.arpQ) ? qy.arpQ : 'maj7';
    const go = patch => GH.router.go(ROUTES.triads[inst], Object.assign({ root, q, arpQ }, patch)); const pref = A.pref(root);
    const title = inst === 'vocal' ? '아르페지오 부르기' : '트라이어드 · 아르페지오';
    el.appendChild(h('div', { class: 'breadcrumb' }, h('a', { href: '#/' + inst }, instKo(inst)), ' › ' + title));
    el.appendChild(h('h1', null, title));
    el.appendChild(switcher('triads', inst));
    el.appendChild(h('div', { class: 'toolbar' }, h('label', null, '루트', A.rootSelect(root, v => go({ root: v }))), h('label', null, '트라이어드', A.qualitySelect(q, v => go({ q: v }), x => x.intervals.length === 3)), h('label', null, '아르페지오 코드', A.qualitySelect(arpQ, v => go({ arpQ: v })))));
    const chord = GH.chords.buildChord(root, q), arp = GH.chords.buildChord(root, arpQ);
    el.appendChild(h('div', { class: 'row', style: 'margin-bottom:8px' }, h('span', { class: 'symbol-big' }, chord.symbol), A.chordPills(chord, { name: true }), A.chordPills(chord), A.ivLegend()));
    if (inst === 'keys') {
      const inv = keysVoicings(chord, 'basic').list.filter(v => /기본형|전위/.test(v.name));
      el.appendChild(section('트라이어드 인버전', h('p', { class: 'muted' }, '기본형 → 1전위 → 2전위. 오른손 운지는 1-3-5 / 1-2-5 / 1-3-5, 왼손은 5-3-1 / 5-3-1 / 5-2-1.'), h('div', { class: 'grid cols-3' }, inv.map(v => keysVoiceCard(chord, v, pref)))));
      const R = 60 + arp.rootPc - (arp.rootPc > 5 ? 12 : 0); const S = semis(arp).filter(x => x < 12).sort((a, b) => a - b);
      const up = []; for (let o = 0; o < 2; o++) S.forEach(x => up.push(R + 12 * o + x)); up.push(R + 24);
      const tri = S.length === 3; const rf = tri ? [1, 2, 3, 1, 2, 3, 5] : null, lf = tri ? [5, 4, 2, 1, 4, 2, 1] : null;
      const seq = up.concat(up.slice(0, -1).reverse());
      const fgAt = (arr, i) => arr ? String(i < up.length ? arr[i] : arr[seq.length - 1 - i]) : '';
      const sh = GH.render.sheet && GH.render.sheet({ kind: 'grand', pref, width: Math.min(1100, el.clientWidth || 800), rh: seq.map((m, i) => ({ at: i * 0.5, d: 0.5, m: [m], fg: fgAt(rf, i) })), lh: seq.map((m, i) => ({ at: i * 0.5, d: 0.5, m: [m - 12], fg: fgAt(lf, i) })) });
      el.appendChild(section('아르페지오 2옥타브 · ' + arp.symbol, sh ? h('div', { class: 'tech-sheet' }, sh.el) : null, h('div', { class: 'toolbar', style: 'margin-top:8px' }, A.playBtn('▶ 아르페지오 듣기', () => GH.player.playSeq(seq.map((m, i) => ({ d: 0.5, m, i })), { tempo: 100, sound: (ev, t, dur) => { GH.audio.pluck(ev.m, t, dur, { preset: 'piano', gain: 0.7 }); GH.audio.pluck(ev.m - 12, t, dur, { preset: 'piano', gain: 0.55 }); }, onNote: (i, ev) => sh && sh.highlight(i < 0 || !ev ? null : ev.i * 0.5) }), 'primary'), A.stopBtn()),
        h('p', { class: 'muted' }, tri ? '트라이어드 아르페지오 표준 운지: 오른손 1-2-3-1-2-3-5, 왼손 5-4-2-1-4-2-1.' : '세븐 코드 아르페지오는 손 크기에 맞춰 운지를 정해요. 엄지가 루트에 오게 하면 편해요.')));
    } else if (inst === 'bass') {
      el.appendChild(section('트라이어드 자리 · ' + chord.symbol, h('div', { class: 'grid cols-2' }, bassCards(chord, pref))));
      el.appendChild(section('세븐 코드 아르페지오 · ' + arp.symbol, h('div', { class: 'grid cols-2' }, bassCards(arp, pref))));
    } else {
      el.appendChild(section('트라이어드 부르기 · ' + chord.symbol, vocalChord(chord, pref)));
    }
  }

  /* ============ 페이지: 코드 파인더 (키보드 · 베이스) ============ */
  function finderPage(el, inst) {
    const A = GH.app; const pref = A.pref();
    el.appendChild(h('div', { class: 'breadcrumb' }, h('a', { href: '#/' + inst }, instKo(inst)), ' › 코드 파인더'));
    el.appendChild(h('h1', null, '코드 파인더'));
    el.appendChild(switcher('finder', inst));
    let midis;
    if (inst === 'keys') {
      el.appendChild(h('p', { class: 'muted' }, '건반을 눌러 음을 고르면 그 음들로 만들 수 있는 코드 이름을 찾아요. 같은 건반을 다시 누르면 빠져요.'));
      const on = {}; vstate.finder.forEach(m => { on[m] = { label: N.pretty(N.noteName(mod(m, 12), pref)), cls: 'iv-1' }; });
      el.appendChild(h('div', { class: 'inst-piano wide' }, GH.render.piano({ from: 48, to: 83, onMidi: on, pref, preset: 'piano', onClick: m => { if (vstate.finder.has(m)) vstate.finder.delete(m); else vstate.finder.add(m); GH.router.rerender(); } })));
      midis = Array.from(vstate.finder).sort((a, b) => a - b);
    } else {
      const tun = BASS();
      el.appendChild(h('p', { class: 'muted' }, '4현 지판을 눌러 두 음 이상 고르면 (더블스톱 · 코드톤) 코드 이름을 찾아요. 같은 줄을 다시 누르면 지워요.'));
      const notes = vstate.bassFrets.map((f, i) => f == null ? null : { s: 4 - i, f, label: N.noteName((tun[i] + f) % 12, pref), cls: 'iv-1' }).filter(Boolean);
      el.appendChild(GH.render.fretboard({ tuning: tun, notes, pref, to: 17, capo: 0, labelMode: 'name', sound: m => GH.audio.bass(m, GH.audio.now(), 1.2, {}), onClick: (s, f) => { const i = 4 - s; vstate.bassFrets[i] = vstate.bassFrets[i] === f ? null : f; GH.router.rerender(); } }).el);
      midis = vstate.bassFrets.map((f, i) => f == null ? null : tun[i] + f).filter(m => m != null);
    }
    el.appendChild(h('div', { class: 'row', style: 'margin:10px 0' }, A.playBtn('▶ 듣기', () => { if (inst === 'keys') playBlock([], midis); else { GH.player.stop(); const t = GH.audio.now() + 0.05; midis.forEach((m, i) => GH.audio.bass(m, t + i * 0.03, 1.8, {})); } }), A.playBtn('지우기', () => { vstate.finder.clear(); vstate.bassFrets = [null, null, null, null]; GH.router.rerender(); })));
    if (midis.length < 2) { el.appendChild(GH.ui.empty('두 음 이상 골라 주세요.')); return; }
    el.appendChild(h('p', null, '고른 음: ', midis.map(m => N.pretty(N.midiName(m, pref))).join(', ')));
    const res = GH.chords.identifyAll(midis.map(m => m % 12), pref); const bassPc = midis[0] % 12;
    if (!res.length) { el.appendChild(GH.ui.notice('정확히 일치하는 코드 이름이 없어요. 음을 하나 빼거나 더해 보세요.')); return; }
    el.appendChild(section('가능한 이름', GH.ui.table(['코드', '베이스', ''], res.map(r => { const c = GH.chords.buildChord(r.root, r.qId); return [h('a', { href: A.chordHref(r.root, r.qId), style: 'font-weight:700' }, r.symbol), c.rootPc === bassPc ? '기본위치' : '/' + N.pretty(N.noteName(bassPc, pref)) + ' (인버전)', h('span', { class: 'muted' }, c.quality.ko)]; }))));
  }

  /* 코드 상세 페이지에 넣는 악기별 조각 */
  function chordSection(chord, pref, inst) {
    const q = { root: chord.root, q: chord.qId };
    if (inst === 'keys') return section('건반 보이싱', h('div', { class: 'grid cols-3' }, keysVoicings(chord, 'basic').list.slice(0, 3).map(v => keysVoiceCard(chord, v, pref))), h('div', { class: 'row' }, h('a', { class: 'btn small', href: GH.router.href('/keys/voicings', q) }, '건반 보이싱 더 보기 →'), h('a', { class: 'btn small', href: GH.router.href('/keys/voicings/advanced', q) }, '재즈 보이싱 →')));
    if (inst === 'bass') return section('베이스 코드톤 자리', h('div', { class: 'grid cols-2' }, bassCards(chord, pref)), h('a', { class: 'btn small', href: GH.router.href('/bass/chords', q) }, '베이스 코드톤 더 보기 →'));
    if (inst === 'vocal') return section('코드톤 부르기 · 화음 나누기', vocalChord(chord, pref));
    return null;
  }
  /* ---- 세션별 주소 ---- */
  const page = (title, fn) => ({ title, staff: true, render: fn });
  GH.pages['/bass/chords'] = page('베이스 코드톤 자리', (el, p) => voicingsPage(el, p, 'basic', 'bass'));
  GH.pages['/keys/voicings'] = page('건반 코드 보이싱', (el, p) => voicingsPage(el, p, 'basic', 'keys'));
  GH.pages['/keys/voicings/advanced'] = page('건반 재즈 보이싱', (el, p) => voicingsPage(el, p, 'advanced', 'keys'));
  GH.pages['/vocal/chords'] = page('코드톤 · 화음 나누기', (el, p) => voicingsPage(el, p, 'basic', 'vocal'));
  GH.pages['/bass/scales'] = page('베이스 스케일 포지션', (el, p) => GH.scalePositions(el, p, { bass: true }));
  GH.pages['/keys/scales'] = page('건반 스케일 · 운지', (el, p) => scalePage(el, p, 'keys'));
  GH.pages['/vocal/scales'] = page('스케일 부르기', (el, p) => scalePage(el, p, 'vocal'));
  GH.pages['/bass/arpeggios'] = page('베이스 아르페지오', (el, p) => triadsPage(el, p, 'bass'));
  GH.pages['/keys/arpeggios'] = page('건반 아르페지오', (el, p) => triadsPage(el, p, 'keys'));
  GH.pages['/vocal/arpeggios'] = page('아르페지오 부르기', (el, p) => triadsPage(el, p, 'vocal'));
  GH.pages['/bass/finder'] = page('베이스 코드 파인더', el => finderPage(el, 'bass'));
  GH.pages['/keys/finder'] = page('건반 코드 파인더', el => finderPage(el, 'keys'));

  GH.instView = { INSTS, ROUTES, instKo, switcher, voicingsPage, scalePage, triadsPage, finderPage, chordSection, keysVoicings, bassShapes, scaleFingers };
})();
