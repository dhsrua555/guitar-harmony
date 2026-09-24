/* 재생 시퀀서: 코드, 스케일, 진행, 릭 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const A = GH.audio;
  let timers = [];
  let current = null;
  function schedule(fn, atSec) {
    const delay = Math.max(0, (atSec - A.now()) * 1000);
    const t = setTimeout(() => { try { fn(); } catch (e) { console.error(e); } }, delay);
    timers.push(t); return t;
  }
  function stop() {
    timers.forEach(clearTimeout); timers = [];
    A.stopAll();
    if (current && current.onStop) { const cb = current.onStop; current = null; cb(); }
    current = null;
    GH.events.emit('player-stop');
  }
  function begin(ctl) { stop(); current = ctl; A.context(); GH.events.emit('player-start'); return ctl; }

  const STRUM = 0.024;
  const human = amount => (Math.random() * 2 - 1) * amount;
  function chordAt(midis, when, dur, gain, dir) {
    const list = dir === 'up' ? midis.slice().reverse() : midis;
    const gap = STRUM * (dir === 'up' ? .72 : 1) * (list.length > 5 ? .88 : 1);
    const base = gain == null ? .8 : gain;
    list.forEach((m, i) => {
      /* 다운 스트로크는 저음, 업 스트로크는 고음에 자연스러운 악센트를 둔다. */
      const contour = dir === 'up' ? .8 + i * .035 : 1 - i * .025;
      A.pluck(m, when + i * gap + human(.0025), dur, { gain: base * contour * (1 + human(.035)) });
    });
  }
  function playChord(midis, opts) {
    opts = opts || {};
    const ctl = begin({ onStop: opts.onStop });
    const t0 = A.now() + 0.05;
    if (opts.arpeggio) {
      midis.forEach((m, i) => A.pluck(m, t0 + i * 0.22 + human(.003), 1.25, { gain: .76 * (1 + human(.035)) }));
      const total = midis.length * 0.22 + 1.0;
      chordAt(midis, t0 + total, 2.2, 0.8);
      schedule(() => { if (current === ctl) stop(); }, t0 + total + 2.3);
    } else {
      chordAt(midis, t0, opts.dur || 2.2, 0.85);
      schedule(() => { if (current === ctl) stop(); }, t0 + (opts.dur || 2.2) + 0.2);
    }
    return ctl;
  }
  function playVoicing(v, opts) { return playChord(v.midi.filter(m => m != null), opts); }
  /* 음 목록을 순서대로 (스케일, 아르페지오) */
  function playNotes(midis, opts) {
    opts = opts || {};
    const ctl = begin({ onStop: () => { if (opts.onNote) opts.onNote(-1); if (opts.onStop) opts.onStop(); } });
    const t0 = A.now() + 0.05; const step = opts.step || 60 / (opts.tempo || 160);
    midis.forEach((m, i) => {
      const accent = i % 4 === 0 ? 1 : i % 2 === 0 ? .94 : .88;
      A.pluck(m, t0 + i * step + human(.0018), step * .92, { gain: .84 * accent * (1 + human(.025)) });
      if (opts.onNote) schedule(() => opts.onNote(i, m), t0 + i * step);
    });
    schedule(() => { if (current === ctl) stop(); }, t0 + midis.length * step + 0.3);
    return ctl;
  }

  /* 스타일별 스트럼 패턴 (4박 기준) */
  const PATTERNS = {
    pop: [{ at: 0, d: 1.5 }, { at: 1.5, d: .5, g: .6, dir: 'up' }, { at: 2, d: 1 }, { at: 3, d: .5, g: .7 }, { at: 3.5, d: .5, g: .6, dir: 'up' }],
    rock: [{ at: 0, d: 1 }, { at: 1, d: 1, g: .8 }, { at: 2, d: 1 }, { at: 3, d: 1, g: .8 }],
    ballad: [{ at: 0, d: 2 }, { at: 2, d: 2, g: .8 }],
    soul: [{ at: 0, d: 1.75 }, { at: 1.75, d: .25, g: .5 }, { at: 2, d: 2 }],
    swing: [{ at: 0, d: 1 }, { at: 1, d: 1, g: .55 }, { at: 2, d: 1, g: .9 }, { at: 3, d: 1, g: .55 }],
    shuffle: [{ at: 0, d: .66 }, { at: .66, d: .34, g: .5, dir: 'up' }, { at: 1, d: .66 }, { at: 1.66, d: .34, g: .5, dir: 'up' }, { at: 2, d: .66 }, { at: 2.66, d: .34, g: .5, dir: 'up' }, { at: 3, d: .66 }, { at: 3.66, d: .34, g: .5, dir: 'up' }],
    bossa: [{ at: 0, d: 1.5 }, { at: 1.5, d: 1, g: .7 }, { at: 2.5, d: 1, g: .8 }, { at: 3.5, d: .5, g: .6 }],
    funk: [{ at: 0, d: .5 }, { at: .75, d: .25, g: .5, dir: 'up' }, { at: 1.5, d: .5, g: .7 }, { at: 2, d: .5 }, { at: 2.75, d: .25, g: .5, dir: 'up' }, { at: 3.5, d: .5, g: .7 }],
    gospel: [{ at: 0, d: 1 }, { at: 1, d: 1, g: .7 }, { at: 2, d: 1 }, { at: 3, d: 1, g: .7 }]
  };
  /* chords: [{midi:[...], bass: midi, beats}] */
  function playProgression(chords, opts) {
    opts = opts || {};
    const tempo = opts.tempo || 110, beat = 60 / tempo;
    const pat = PATTERNS[opts.style] || PATTERNS.pop;
    const ctl = begin({ onStop: () => { if (opts.onChord) opts.onChord(-1); if (opts.onStop) opts.onStop(); } });
    ctl.loop = !!opts.loop;
    let passStart = A.now() + 0.08;
    function pass() {
      let t = passStart;
      chords.forEach((c, i) => {
        const beats = c.beats || 4;
        if (opts.onChord) schedule(() => opts.onChord(i, c), t);
        if (opts.metronome) for (let b = 0; b < beats; b++) A.click(t + b * beat, b === 0);
        pat.filter(e => e.at < beats).forEach(e => {
          const d = Math.min(e.d, beats - e.at) * beat;
          chordAt(c.midi, t + e.at * beat + human(.004), d + 0.05, (e.g == null ? 0.85 : e.g) * 0.9 * (1 + human(.025)), e.dir);
        });
        if (c.bass != null) {
          A.bass(c.bass - 12, t + human(.003), Math.min(2, beats) * beat * 0.95, { gain: 1 + human(.025) });
          if (beats >= 4) A.bass(c.bass - 12 + (opts.style === 'swing' || opts.style === 'bossa' ? 7 : 0), t + 2 * beat + human(.004), 2 * beat * 0.95, { gain: .9 + human(.025) });
        }
        t += beats * beat;
      });
      const end = t;
      if (ctl.loop) { passStart = end; schedule(pass, end - 0.4); }
      else schedule(() => { if (current === ctl) stop(); }, end + 0.1);
    }
    pass();
    return ctl;
  }
  /* 릭 재생. lick.notes 이벤트, opts: {tempo, feel, onNote(i), transpose, tuning(기본 스탠다드), onStart(t0)} */
  function playLick(lick, opts) {
    opts = opts || {};
    const tempo = opts.tempo || lick.tempo || 100, beat = 60 / tempo;
    const feel = opts.feel || lick.feel;
    const tr = opts.transpose || 0;
    const tun = opts.tuning || GH.voicings.STD;
    const ctl = begin({ onStop: () => { if (opts.onNote) opts.onNote(-1); if (opts.onStop) opts.onStop(); } });
    ctl.loop = !!opts.loop;
    let passStart = A.now() + 0.1;
    if (opts.onStart) opts.onStart(passStart, beat);
    const swingPos = pos => { const fl = Math.floor(pos), fr = pos - fl; return feel === 'swing' || feel === 'shuffle' ? (Math.abs(fr - 0.5) < 0.01 ? fl + 2 / 3 : fl + fr) : pos; };
    function pass() {
      let pos = 0; let prevMidi = null;
      lick.notes.forEach((ev, i) => {
        const start = passStart + swingPos(pos) * beat;
        const endPos = swingPos(pos + ev.d);
        const dur = Math.max(0.08, (endPos - swingPos(pos)) * beat);
        if (opts.onNote) schedule(() => opts.onNote(i, ev), start);
        if (!ev.rest) {
          const pairs = ev.ns ? ev.ns : [[ev.s, ev.f]];
          pairs.forEach(([s, f], k) => {
            const midi = tun[6 - s] + f + tr;
            const onBeat = Math.abs(pos - Math.round(pos)) < .01;
            const o = { gain: (ev.t === 'h' || ev.t === 'p' ? .58 : .86) * (onBeat ? 1.05 : .94) * (1 + human(.025)) };
            if (ev.t === 'b') { o.bend = ev.bend || 2; o.release = !!ev.release; }
            if ((ev.t === '/' || ev.t === '\\') && prevMidi != null) o.slideFrom = prevMidi - midi;
            if (ev.t === '~') o.vibrato = true;
            A.pluck(midi, start + k * .018 + human(.0015), dur * (ev.t === '~' ? 1 : .96), o);
            if (k === pairs.length - 1) prevMidi = midi;
          });
        }
        pos += ev.d;
      });
      const end = passStart + swingPos(pos) * beat;
      if (ctl.loop) { passStart = end + beat; schedule(pass, end + beat - 0.4); }
      else schedule(() => { if (current === ctl) stop(); }, end + 0.4);
    }
    pass();
    return ctl;
  }
  function isPlaying() { return !!current; }
  GH.player = { playChord, playVoicing, playNotes, playProgression, playLick, stop, isPlaying, PATTERNS };
})();
