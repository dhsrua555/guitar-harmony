/* 리듬: 패턴 해석, 메트로놈, 패턴 재생, 탭 채점 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const DUR = { 2: 2, '4.': 1.5, 4: 1, '8.': 0.75, 8: 0.5, 16: 0.25, '8t': 1 / 3 };
  const VF_DUR = { 2: 'h', '4.': 'q', 4: 'q', '8.': '8', 8: '8', 16: '16', '8t': '8' };

  /* 'p' 문자열 → [{code, d, pos, rest, dot, trip}] */
  function parse(p) {
    let pos = 0; const out = [];
    String(p).trim().split(/\s+/).forEach(tok => {
      const rest = /r$/.test(tok); const code = tok.replace(/r$/, '');
      const d = DUR[code]; if (d == null) throw new Error('알 수 없는 리듬 기호: ' + tok);
      out.push({ code, d, pos, rest, dot: /\.$/.test(code), trip: code === '8t', vf: VF_DUR[code] });
      pos += d;
    });
    out.total = Math.round(pos * 1000) / 1000;
    return out;
  }
  const onsets = events => events.filter(e => !e.rest).map(e => e.pos);

  /* ---- 스케줄러 공용 ---- */
  let timers = []; let loopTimer = null; let active = null;
  function later(fn, at) { const A = GH.audio; timers.push(setTimeout(() => { try { fn(); } catch (e) { console.error(e); } }, Math.max(0, (at - A.now()) * 1000))); }
  function stop() {
    const was = active; active = null;
    timers.forEach(clearTimeout); timers = [];
    if (loopTimer) { clearInterval(loopTimer); loopTimer = null; }
    if (was && was.onStop) was.onStop();
  }
  GH.events.on('player-stop', () => { if (active) stop(); });
  function begin(ctl) { GH.player.stop(); stop(); const A = GH.audio; if (!A.context()) return null; active = ctl; return ctl; }

  /* ---- 메트로놈 ----
     opts: {tempo, beats(한 마디 박 수), subdiv(1 4분, 2 8분, 3 셋잇단, 4 16분), swing(bool, 8분일 때), accent(bool),
            gap: [켜는 마디, 끄는 마디] | null, trainer: {every(마디), step(bpm), max} | null, onTick(beat, sub, bar, muted), onTempo(bpm), onStop} */
  function metronome(opts) {
    const ctl = begin(Object.assign({ kind: 'metronome' }, opts)); if (!ctl) return null;
    const A = GH.audio;
    ctl.tempo = opts.tempo || 90;
    let next = A.now() + 0.08, beat = 0, bar = 0;
    const tick = () => {
      if (active !== ctl) return;
      while (next < A.now() + 0.2) {
        const spb = 60 / ctl.tempo; const sub = Math.max(1, ctl.subdiv || 1);
        const beats = ctl.beats || 4;
        const gap = ctl.gap; const muted = !!(gap && (bar % (gap[0] + gap[1])) >= gap[0]);
        for (let k = 0; k < sub; k++) {
          let off = k / sub;
          if (sub === 2 && ctl.swing && k === 1) off = 2 / 3;
          const at = next + off * spb;
          if (!muted) {
            if (k === 0) A.drum('click', at, beat === 0 && ctl.accent !== false ? 1.5 : 1);
            else A.drum('tick', at, 1);
          }
          const b = beat, bb = bar, kk = k;
          if (ctl.onTick) later(() => { if (active === ctl) ctl.onTick(b, kk, bb, muted); }, at);
        }
        next += spb; beat++;
        if (beat >= beats) {
          beat = 0; bar++;
          const tr = ctl.trainer;
          if (tr && bar % tr.every === 0 && ctl.tempo < tr.max) { ctl.tempo = Math.min(tr.max, ctl.tempo + tr.step); const t = ctl.tempo; if (ctl.onTempo) later(() => { if (active === ctl) ctl.onTempo(t); }, next); }
        }
      }
    };
    tick(); loopTimer = setInterval(tick, 25);
    return ctl;
  }

  /* ---- 패턴 재생 ----
     events(parse 결과), opts: {tempo, countIn(마디 수, 기본 1), bars(반복 마디 수, 기본 1), click(bool), sound('wood'|'pluck'), midi, swing,
                                onNote(i, bar), onBeat(beat, bar), onStop, onEnd}
     반환 ctl: {expected: [{time, i, bar}], start, end} — time 은 소리가 스피커에서 나오는 시각 기준 */
  function playPattern(events, opts) {
    opts = opts || {};
    const ctl = begin(Object.assign({ kind: 'pattern' }, opts)); if (!ctl) return null;
    const A = GH.audio; const ctx = A.context();
    const spb = 60 / (opts.tempo || 80); const beats = events.total || 4;
    const countIn = opts.countIn == null ? 1 : opts.countIn; const bars = opts.bars || 1;
    const t0 = A.now() + 0.12; const latency = (ctx && (ctx.outputLatency || ctx.baseLatency)) || 0;
    const swingPos = pos => { if (!opts.swing) return pos; const fl = Math.floor(pos), fr = pos - fl; return Math.abs(fr - 0.5) < 0.01 ? fl + 2 / 3 : pos; };
    ctl.expected = []; ctl.start = t0 + countIn * beats * spb; ctl.latency = latency;
    for (let b = 0; b < countIn; b++) for (let k = 0; k < beats; k++) {
      const at = t0 + (b * beats + k) * spb; A.drum('click', at, k === 0 ? 1.5 : 1);
      if (opts.onBeat) { const kk = k; later(() => { if (active === ctl) opts.onBeat(kk, -1); }, at); }
    }
    for (let bar = 0; bar < bars; bar++) {
      const barStart = ctl.start + bar * beats * spb;
      if (opts.click !== false) for (let k = 0; k < beats; k++) { const at = barStart + k * spb; A.drum('tick', at, 1.4); if (opts.onBeat) { const kk = k, bb = bar; later(() => { if (active === ctl) opts.onBeat(kk, bb); }, at); } }
      events.forEach((e, i) => {
        if (e.rest) return;
        const at = barStart + swingPos(e.pos) * spb;
        if (opts.sound === 'pluck') A.pluck(opts.midi || 64, at, Math.max(0.12, e.d * spb * 0.9), { gain: 0.9 });
        else if (opts.sound !== 'none') A.drum('wood', at, e.pos % 1 === 0 ? 1 : 0.8);
        ctl.expected.push({ time: at + latency, i, bar });
        if (opts.onNote) { const ii = i, bb = bar; later(() => { if (active === ctl) opts.onNote(ii, bb); }, at); }
      });
    }
    ctl.end = ctl.start + bars * beats * spb;
    later(() => { if (active === ctl) { const cb = opts.onEnd; active = null; stop(); if (cb) cb(ctl); } }, ctl.end + 0.35);
    return ctl;
  }

  /* 탭 채점. expected: [{time}], taps: [초], 반환 {items: [{i, err(초)|null, grade}], extra, score(0~100), meanErr, meanAbs} */
  function score(expected, taps, opts) {
    opts = opts || {};
    const win = opts.window || 0.2, good = opts.good || 0.045, ok = opts.ok || 0.1;
    const used = new Set(); const items = [];
    expected.forEach(e => {
      let best = -1, bestD = Infinity;
      taps.forEach((t, k) => { if (used.has(k)) return; const d = Math.abs(t - e.time); if (d < bestD && d <= win) { bestD = d; best = k; } });
      if (best < 0) { items.push({ i: e.i, bar: e.bar, err: null, grade: 'miss' }); return; }
      used.add(best); const err = taps[best] - e.time;
      items.push({ i: e.i, bar: e.bar, err, grade: Math.abs(err) <= good ? 'good' : Math.abs(err) <= ok ? (err < 0 ? 'early' : 'late') : (err < 0 ? 'veryEarly' : 'veryLate') });
    });
    const pts = { good: 1, early: 0.6, late: 0.6, veryEarly: 0.25, veryLate: 0.25, miss: 0 };
    const hits = items.filter(x => x.err != null);
    const extra = taps.length - used.size;
    const raw = items.length ? items.reduce((a, x) => a + pts[x.grade], 0) / items.length : 0;
    return { items, extra, score: Math.max(0, Math.round(100 * raw - extra * 5)), meanErr: hits.length ? hits.reduce((a, x) => a + x.err, 0) / hits.length : 0, meanAbs: hits.length ? hits.reduce((a, x) => a + Math.abs(x.err), 0) / hits.length : 0 };
  }

  /* 스트럼 재생. strum: {grid, p}, chords: 코드 객체 목록(한 마디씩), opts: {tempo, loop, onSlot(i, bar), onStop} */
  function playStrum(strum, chords, opts) {
    opts = opts || {};
    const ctl = begin(Object.assign({ kind: 'strum' }, opts)); if (!ctl) return null;
    const A = GH.audio; const slots = strum.p.trim().split(/\s+/);
    const playable = GH.app.toPlayable(chords);
    ctl.tempo = opts.tempo || strum.tempo || 90;
    const perBeat = strum.grid / 4;
    let next = A.now() + 0.1, slot = 0, bar = 0;
    const tick = () => {
      if (active !== ctl) return;
      while (next < A.now() + 0.2) {
        const spb = 60 / ctl.tempo; const step = spb / perBeat;
        const s = slots[slot]; const c = playable[bar % playable.length];
        const onBeat = slot % perBeat === 0; const beatIdx = Math.floor(slot / perBeat);
        const accent = (beatIdx === 0 && onBeat ? 1.08 : 1) * (onBeat ? 1 : 0.86);
        if (s === 'D' || s === 'U') {
          const notes = s === 'D' ? c.midi : c.midi.slice(-4).reverse();
          notes.forEach((m, k) => A.pluck(m, next + k * (s === 'D' ? 0.013 : 0.01), step * (s === 'D' ? 1.9 : 1.4), { gain: (s === 'D' ? 0.78 : 0.52) * accent }));
          if (s === 'D' && onBeat && (beatIdx === 0 || beatIdx === 2)) A.bass(c.bass - 12, next, spb * 1.6, { gain: 0.55 });
        } else if (s === 'x') {
          c.midi.slice(-4).forEach((m, k) => A.pluck(m, next + k * 0.006, 0.05, { gain: 0.45 }));
          A.drum('rim', next, 0.45);
        }
        if (opts.metronome && onBeat) A.drum('tick', next, 1.3);
        const ss = slot, bb = bar;
        if (opts.onSlot) later(() => { if (active === ctl) opts.onSlot(ss, bb); }, next);
        next += step; slot++;
        if (slot >= slots.length) { slot = 0; bar++; if (!opts.loop && bar >= playable.length) { later(() => { if (active === ctl) stop(); }, next + 0.2); active.ending = true; return; } }
      }
    };
    tick(); loopTimer = setInterval(() => { if (active === ctl && !ctl.ending) tick(); }, 25);
    return ctl;
  }

  GH.rhythm = { parse, onsets, metronome, playPattern, playStrum, score, stop, running: () => !!active, current: () => active };
})();
