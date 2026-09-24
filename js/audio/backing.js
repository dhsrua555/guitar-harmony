/* 백킹트랙 엔진: 드럼 + 베이스 + 코드 컴핑을 룩어헤드 스케줄러로 반복 재생 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const N = GH.notes; const mod = N.mod;

  /* 드럼 t: 박 (패턴 길이 bars*4), 컴핑 t: 마디 안의 박, 베이스는 패턴 이름 */
  const STYLES = {
    ballad: { ko: '발라드', tempo: 72, swing: 0.5, bars: 1,
      drums: [{ t: 0, k: 'kick' }, { t: 2, k: 'kick', g: .8 }, { t: 1, k: 'snare', g: .5 }, { t: 3, k: 'snare', g: .5 }, { t: 0, k: 'hat', g: .7 }, { t: .5, k: 'hat', g: .4 }, { t: 1, k: 'hat', g: .6 }, { t: 1.5, k: 'hat', g: .4 }, { t: 2, k: 'hat', g: .7 }, { t: 2.5, k: 'hat', g: .4 }, { t: 3, k: 'hat', g: .6 }, { t: 3.5, k: 'hat', g: .4 }],
      comp: [{ t: 0, d: 2, g: .8 }, { t: 2, d: 2, g: .6 }], bass: 'long' },
    pop: { ko: '팝', tempo: 100, swing: 0.5, bars: 1,
      drums: [{ t: 0, k: 'kick' }, { t: 1.5, k: 'kick', g: .8 }, { t: 2, k: 'kick', g: .9 }, { t: 1, k: 'snare' }, { t: 3, k: 'snare' }, { t: 0, k: 'hat', g: .8 }, { t: .5, k: 'hat', g: .45 }, { t: 1, k: 'hat', g: .7 }, { t: 1.5, k: 'hat', g: .45 }, { t: 2, k: 'hat', g: .8 }, { t: 2.5, k: 'hat', g: .45 }, { t: 3, k: 'hat', g: .7 }, { t: 3.5, k: 'hatopen', g: .5 }],
      comp: [{ t: 0, d: 1.5 }, { t: 1.5, d: .5, g: .6, dir: 'up' }, { t: 2, d: 1 }, { t: 3, d: .5, g: .7 }, { t: 3.5, d: .5, g: .6, dir: 'up' }], bass: 'pop' },
    rock: { ko: '록', tempo: 120, swing: 0.5, bars: 1,
      drums: [{ t: 0, k: 'kick' }, { t: 2, k: 'kick' }, { t: 2.5, k: 'kick', g: .8 }, { t: 1, k: 'snare' }, { t: 3, k: 'snare' }].concat([0, .5, 1, 1.5, 2, 2.5, 3, 3.5].map(t => ({ t, k: 'hat', g: t % 1 ? .5 : .85 }))),
      comp: [0, .5, 1, 1.5, 2, 2.5, 3, 3.5].map(t => ({ t, d: .45, g: t % 1 ? .6 : .85 })), bass: 'eighths' },
    funk: { ko: '펑크', tempo: 100, swing: 0.5, bars: 1,
      drums: [{ t: 0, k: 'kick' }, { t: .75, k: 'kick', g: .8 }, { t: 2, k: 'kick' }, { t: 2.75, k: 'kick', g: .7 }, { t: 1, k: 'snare' }, { t: 3, k: 'snare' }, { t: 1.75, k: 'snare', g: .25 }, { t: 3.5, k: 'snare', g: .25 }].concat([0, .25, .5, .75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5].map(t => ({ t, k: 'hat', g: t % .5 ? .3 : t % 1 ? .5 : .8 }))).concat([{ t: 3.75, k: 'hatopen', g: .5 }]),
      comp: [{ t: 0, d: .3, g: .85 }, { t: .75, d: .25, g: .6 }, { t: 1.5, d: .25, g: .7 }, { t: 2.5, d: .3, g: .85 }, { t: 3.25, d: .25, g: .6 }, { t: 3.75, d: .25, g: .5 }], bass: 'funk' },
    swing: { ko: '스윙 (재즈)', tempo: 140, swing: 0.67, bars: 1,
      drums: [{ t: 0, k: 'ride', g: .78 }, { t: 1, k: 'ride', g: .9 }, { t: 1.5, k: 'ride', g: .58 }, { t: 2, k: 'ride', g: .78 }, { t: 3, k: 'ride', g: .9 }, { t: 3.5, k: 'ride', g: .58 }, { t: 1, k: 'pedal', g: .75 }, { t: 3, k: 'pedal', g: .75 }, { t: 0, k: 'kick', g: .3 }, { t: 1, k: 'kick', g: .22 }, { t: 2, k: 'kick', g: .28 }, { t: 3, k: 'kick', g: .22 }, { t: 2.5, k: 'rim', g: .35 }],
      bassInst: 'upright',
      comp: [{ t: 0, d: 1.5, g: .7 }, { t: 1.5, d: 1, g: .55 }], compAlt: [{ t: 1.5, d: 1, g: .65 }, { t: 3.5, d: .5, g: .6 }], bass: 'walking' },
    bossa: { ko: '보사노바', tempo: 120, swing: 0.5, bars: 2,
      drums: [0, 1.5, 2, 3.5, 4, 5.5, 6, 7.5].map(t => ({ t, k: 'kick', g: t % 1 ? .7 : .9 })).concat([0, 1.5, 3, 5, 6.5].map(t => ({ t, k: 'rim', g: .8 }))).concat([0, .5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5].map(t => ({ t, k: 'shaker', g: t % 1 ? .5 : .8 }))),
      comp: [{ t: 0, d: 1, g: .7 }, { t: 1.5, d: .5, g: .6 }, { t: 2.5, d: .5, g: .6 }, { t: 3, d: 1, g: .65 }], bass: 'bossa', bassInst: 'upright' },
    shuffle: { ko: '셔플 블루스', tempo: 110, swing: 0.67, bars: 1,
      drums: [{ t: 0, k: 'kick' }, { t: 2, k: 'kick' }, { t: 1, k: 'snare' }, { t: 3, k: 'snare' }].concat([0, .5, 1, 1.5, 2, 2.5, 3, 3.5].map(t => ({ t, k: 'hat', g: t % 1 ? .45 : .85 }))),
      comp: [0, 1, 2, 3].flatMap(b => [{ t: b, d: .6, g: .8 }, { t: b + .5, d: .3, g: .5, dir: 'up' }]), bass: 'boogie' },
    reggae: { ko: '레게', tempo: 78, swing: 0.5, bars: 1,
      drums: [{ t: 2, k: 'kick' }, { t: 2, k: 'rim', g: .8 }, { t: 0, k: 'hat', g: .6 }, { t: .5, k: 'hat', g: .4 }, { t: 1, k: 'hat', g: .6 }, { t: 1.5, k: 'hat', g: .4 }, { t: 2, k: 'hat', g: .6 }, { t: 2.5, k: 'hat', g: .4 }, { t: 3, k: 'hat', g: .6 }, { t: 3.5, k: 'hatopen', g: .4 }],
      comp: [{ t: 1, d: .35, g: .8 }, { t: 3, d: .35, g: .8 }], bass: 'reggae' }
  };
  const STYLE_ORDER = ['ballad', 'pop', 'rock', 'funk', 'swing', 'bossa', 'shuffle', 'reggae'];

  const st = { playing: false, timer: null, timers: [], opts: null, items: [], tempo: 100, style: 'pop', startTime: 0, loopStart: 0, loopBeats: 0, scheduledUntilIndex: 0, pass: 0 };

  function swingT(t, sw) { const f = t - Math.floor(t); return Math.abs(f - 0.5) < 0.01 ? Math.floor(t) + sw : t; }
  const human = amount => (Math.random() * 2 - 1) * amount;
  const third = q => (GH.chords.getQuality(q).intervals.some(iv => /^b3$/.test(iv)) ? 3 : GH.chords.getQuality(q).intervals.some(iv => /^(3)$/.test(iv)) ? 4 : /sus2/.test(q) ? 2 : 5);
  const fifth = q => (GH.chords.getQuality(q).intervals.some(iv => /^b5$/.test(iv)) ? 6 : GH.chords.getQuality(q).intervals.some(iv => /^#5$/.test(iv)) ? 8 : 7);
  const seventh = q => { const iv = GH.chords.getQuality(q).intervals; return iv.includes('7') ? 11 : iv.includes('b7') ? 10 : iv.includes('bb7') || iv.includes('6') ? 9 : 12; };
  const fit = m => { while (m < 28) m += 12; while (m > 45) m -= 12; return m; };
  /* 베이스 라인: 코드 항목 → [{t(박), d, midi, g}] */
  function bassLine(item, next, pattern, barIndex) {
    const r = item.bassMidi, q = item.qId, B = item.beats;
    const ev = (t, d, semi, g) => ({ t, d, midi: fit(r + semi), g: g == null ? 1 : g });
    const appr = () => {
      if (!next) return ev(B - 1, 1, fifth(q), .85);
      const target = fit(next.bassMidi);
      const below = target - 1, above = target + 1, dom = fit(target + 7);
      const choice = barIndex % 3 === 0 ? below : barIndex % 3 === 1 ? dom : above;
      return { t: B - 1, d: 1, midi: fit(choice), g: .85 };
    };
    if (pattern === 'walking') {
      if (B <= 1) return [ev(0, 1, 0)];
      if (B === 2) return [ev(0, 1, 0), appr()];
      if (B === 3) return [ev(0, 1, 0), ev(1, 1, third(q), .85), appr()];
      const out = [];
      for (let b = 0; b < B - 4; b += 4) out.push(ev(b, 1, 0), ev(b + 1, 1, third(q), .85), ev(b + 2, 1, fifth(q), .9), ev(b + 3, 1, b % 8 === 0 ? seventh(q) : 12, .85));
      const b0 = Math.floor((B - 1) / 4) * 4;
      if (B - b0 >= 4) out.push(ev(b0, 1, 0), ev(b0 + 1, 1, third(q), .85), ev(b0 + 2, 1, fifth(q), .9), appr());
      return out;
    }
    if (pattern === 'boogie') {
      const out = []; const steps = [0, 0, third(q), third(q), fifth(q), fifth(q), 9, 9];
      for (let b = 0; b < B; b++) { const s = steps[(b * 2) % 8], s2 = steps[(b * 2 + 1) % 8]; out.push(ev(b, .5, B >= 4 ? s : (b % 2 ? fifth(q) : 0), .95), ev(b + .5, .5, B >= 4 ? s2 : (b % 2 ? fifth(q) : 0), .7)); }
      return out;
    }
    if (pattern === 'eighths') { const out = []; for (let b = 0; b < B; b++) { out.push(ev(b, .5, b === 2 && B >= 4 ? fifth(q) : 0, .95), ev(b + .5, .5, b === 2 && B >= 4 ? fifth(q) : 0, .7)); } return out; }
    if (pattern === 'pop') { const out = []; for (let m = 0; m < B; m += 4) { const L = Math.min(4, B - m); out.push(ev(m, Math.min(1.5, L), 0)); if (L > 1.5) out.push(ev(m + 1.5, .5, 0, .7)); if (L > 2) out.push(ev(m + 2, Math.min(1, L - 2), fifth(q), .9)); if (L > 3) out.push(ev(m + 3, .5, 0, .8), ev(m + 3.5, .5, 12, .6)); } return out; }
    if (pattern === 'funk') { const out = []; for (let m = 0; m < B; m += 4) { const L = Math.min(4, B - m); [[0, .5, 0, 1], [.75, .25, 0, .7], [1.5, .5, seventh(q) === 12 ? 12 : seventh(q), .8], [2.5, .5, 0, .95], [3, .5, fifth(q), .8], [3.5, .5, 12, .6]].forEach(([t, d, s, g]) => { if (t < L) out.push(ev(m + t, d, s, g)); }); } return out; }
    if (pattern === 'bossa') { const out = []; for (let m = 0; m < B; m += 4) { const L = Math.min(4, B - m); [[0, 1.5, 0, 1], [1.5, .5, fifth(q) - 12, .8], [2, 1.5, fifth(q) - 12, .9], [3.5, .5, 0, .7]].forEach(([t, d, s, g]) => { if (t < L) out.push(ev(m + t, d, s, g)); }); } return out; }
    if (pattern === 'reggae') { const out = []; for (let m = 0; m < B; m += 4) { const L = Math.min(4, B - m); [[0, 1, 0, 1], [1.5, .5, fifth(q) - 12, .7], [2, 1, 0, .9], [3, .5, third(q), .7], [3.5, .5, fifth(q), .7]].forEach(([t, d, s, g]) => { if (t < L) out.push(ev(m + t, d, s, g)); }); } return out; }
    /* long */
    const out = []; for (let m = 0; m < B; m += 4) { const L = Math.min(4, B - m); out.push(ev(m, Math.min(2, L), 0)); if (L > 2) out.push(ev(m + 2, L - 2, fifth(q) - 12, .8)); } return out;
  }

  function schedule(fn, at) { const A = GH.audio; const t = setTimeout(() => { try { fn(); } catch (e) { console.error(e); } }, Math.max(0, (at - A.now()) * 1000)); st.timers.push(t); return t; }

  /* 한 코드 항목의 모든 이벤트를 절대 시간에 예약 */
  function scheduleItem(idx, at, globalBeat) {
    const A = GH.audio; const o = st.opts; const S = STYLES[st.style] || STYLES.pop;
    const beat = 60 / st.tempo; const sw = S.swing || 0.5;
    const item = st.items[idx]; const next = st.items[(idx + 1) % st.items.length];
    const B = item.beats; const barIndex = Math.floor(globalBeat / 4);
    if (o.onChord) schedule(() => { if (st.playing) o.onChord(idx, item, st.pass); }, at);
    if (o.onBeat) for (let b = 0; b < B; b++) schedule(() => { if (st.playing) o.onBeat((globalBeat + b) % 4, Math.floor((globalBeat + b) / 4)); }, at + b * beat);
    if (o.metronome) for (let b = 0; b < B; b++) A.click(at + b * beat, (globalBeat + b) % 4 === 0);
    /* 드럼 */
    if (o.drums !== false) {
      const patLen = (S.bars || 1) * 4; const pos = mod(globalBeat, patLen);
      for (let m = 0; m < B + pos; m += patLen) S.drums.forEach(e => {
        const t = e.t + m - pos; if (t < 0 || t >= B) return;
        const loose = e.k === 'hat' || e.k === 'hatopen' || e.k === 'shaker' || e.k === 'ride' ? .007 : .004;
        const backbeat = e.k === 'snare' || e.k === 'rim' ? .003 : 0;
        const dynamic = (e.g == null ? 1 : e.g) * .9 * (1 + human(e.k === 'hat' || e.k === 'shaker' ? .075 : .045));
        A.drum(e.k, at + swingT(t, sw) * beat + backbeat + human(loose), dynamic);
      });
    }
    /* 컴핑 */
    if (o.comp !== false && item.midi && item.midi.length) {
      const pos = mod(globalBeat, 4);
      for (let m = 0; m < B + pos; m += 4) {
        const bar = Math.floor((globalBeat + m) / 4);
        const pat = S.compAlt && bar % 2 === 1 ? S.compAlt : S.comp;
        pat.forEach(e => {
          const t = e.t + m - pos; if (t < 0 || t >= B) return;
          const d = Math.min(e.d, B - t) * beat + 0.04;
          const list = e.dir === 'up' ? item.midi.slice().reverse() : item.midi;
          const gap = (st.style === 'funk' || d < beat * .55 ? .012 : st.style === 'ballad' ? .027 : .021) * (e.dir === 'up' ? .72 : 1);
          const eventGain = (e.g == null ? .8 : e.g) * .78 * (1 + human(.035));
          list.forEach((mm, i) => {
            const contour = e.dir === 'up' ? .8 + i * .035 : 1 - i * .024;
            A.pluck(mm, at + swingT(t, sw) * beat + i * gap + human(.0025), d, { gain: eventGain * contour * (1 + human(.025)), bus: 'chords' });
          });
        });
      }
    }
    /* 베이스 */
    if (o.bass !== false) bassLine(item, next, S.bass, barIndex).forEach(e => {
      if (e.t >= B) return;
      const laidBack = st.style === 'swing' || st.style === 'bossa' ? .004 : 0;
      A.bass(e.midi, at + swingT(e.t, sw) * beat + laidBack + human(.003), Math.max(.12, e.d * beat * .93), { gain: e.g * (1 + human(.035)), bus: 'bass', inst: S.bassInst });
    });
  }
  function tick() {
    if (st.playing !== true) return;
    const A = GH.audio; const now = A.now(); const beat = 60 / st.tempo;
    while (st.nextTime < now + 0.35) {
      if (st.nextIndex >= st.items.length) {
        if (!st.opts.loop) { const endAt = st.nextTime; schedule(() => { if (st.playing) stop(); }, endAt + 0.1); st.playing = 'ending'; return; }
        st.nextIndex = 0; st.pass++;
      }
      const item = st.items[st.nextIndex];
      scheduleItem(st.nextIndex, st.nextTime, st.nextBeat);
      st.nextTime += item.beats * beat; st.nextBeat += item.beats; st.nextIndex++;
    }
  }
  /* opts: {chords:[{root,qId,rootPc,symbol,beats,bass}], voicings, tempo, style, loop, countIn, drums, bass, comp, metronome, onChord, onBeat, onStop} */
  function start(opts) {
    const A = GH.audio; if (!A.context()) return null;
    GH.player.stop();
    stop();
    st.opts = opts = Object.assign({ loop: true }, opts);
    st.tempo = opts.tempo || (STYLES[opts.style] || STYLES.pop).tempo; st.style = STYLES[opts.style] ? opts.style : 'pop';
    const playable = GH.app.toPlayable(opts.chords, opts.voicings);
    st.items = opts.chords.map((c, i) => ({ symbol: c.symbol, root: c.root, rootPc: c.rootPc, qId: c.qId, fn: c.fn, roman: c.roman, beats: c.beats || 4, midi: playable[i].midi, bassMidi: playable[i].bass - 12 }));
    st.pass = 0; st.nextIndex = 0; st.nextBeat = 0;
    /* 녹음을 아직 못 풀었으면 잠깐(최대 2.5초) 기다렸다가 시작해서, 첫 마디만 합성음으로 나오는 일이 없게 */
    const Smp = GH.samples;
    if (Smp && Smp.enabled()) {
      const need = [opts.drums !== false && 'drums', opts.bass !== false && (STYLES[st.style].bassInst || 'bass'), opts.comp !== false && GH.state.get().instrument].filter(Boolean);
      if (need.some(id => Smp.status(id) !== 'ready')) {
        st.playing = 'loading';
        Smp.whenReady(need, 2500).then(() => { if (st.playing === 'loading' && st.opts === opts) begin(A, opts); });
        return st;
      }
    }
    begin(A, opts);
    return st;
  }
  function begin(A, opts) {
    const beat = 60 / st.tempo;
    const t0 = A.now() + 0.12;
    st.playing = true;
    if (opts.countIn) { for (let b = 0; b < 4; b++) { A.click(t0 + b * beat, b === 0); if (opts.onBeat) schedule(() => { if (st.playing) opts.onBeat(b, -1); }, t0 + b * beat); } st.nextTime = t0 + 4 * beat; }
    else st.nextTime = t0;
    st.startTime = st.nextTime;
    tick();
    st.timer = setInterval(tick, 40);
    GH.events.emit('backing-start');
  }
  function stop() {
    const was = st.playing;
    st.playing = false;
    if (st.timer) { clearInterval(st.timer); st.timer = null; }
    st.timers.forEach(clearTimeout); st.timers = [];
    if (was) { GH.audio.stopAll(); const o = st.opts; if (o && o.onChord) o.onChord(-1); if (o && o.onBeat) o.onBeat(-1); if (o && o.onStop) o.onStop(); GH.events.emit('backing-stop'); }
  }
  function update(patch) {
    if (patch.tempo) st.tempo = patch.tempo;
    if (patch.style && STYLES[patch.style]) st.style = patch.style;
    if (st.opts) ['drums', 'bass', 'comp', 'loop', 'metronome'].forEach(k => { if (patch[k] != null) st.opts[k] = patch[k]; });
  }
  GH.events.on('player-start', () => { if (st.playing) stop(); });
  GH.events.on('player-stop', () => { if (st.playing) stop(); });
  GH.backing = { STYLES, STYLE_ORDER, start, stop, update, isPlaying: () => !!st.playing, state: () => st };
})();
