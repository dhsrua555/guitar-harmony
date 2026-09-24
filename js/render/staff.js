/* VexFlow 오선 렌더링 (없으면 null) */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const N = GH.notes;
  GH.render = GH.render || {};
  const DUR = { 4: 'w', 3: 'hd', 2: 'h', 1.5: 'qd', 1: 'q', 0.75: '8d', 0.5: '8', 0.25: '16' };
  function vf() { return window.Vex && window.Vex.Flow ? window.Vex.Flow : null; }
  /* 음표 묶음을 오선 가운데로 */
  function center(notes, stave) {
    try {
      const xs = notes.map(n => n.getAbsoluteX()); if (!xs.length) return;
      const lo = Math.min(...xs), hi = Math.max(...xs) + 12;
      const mid = (stave.getNoteStartX() + stave.getNoteEndX()) / 2;
      const shift = mid - (lo + hi) / 2;
      if (Math.abs(shift) > 1) notes.forEach(n => n.setXShift((n.getXShift ? n.getXShift() : 0) + shift));
    } catch (e) { /* ignore */ }
  }
  function keyOf(midi, pref) {
    const name = N.noteName(midi % 12, pref); const oct = Math.floor(midi / 12) - 1;
    const acc = name.length > 1 ? name.slice(1) : null;
    return { key: name.charAt(0).toLowerCase() + (acc ? acc : '') + '/' + oct, acc };
  }
  /* 릭 → 오선. opts: {transpose, pref, width} */
  function staff(lick, opts) {
    const VF = vf(); if (!VF) return null;
    opts = opts || {};
    try {
      const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, Beam, Dot } = VF;
      const pref = opts.pref || (/b/.test(lick.key) && lick.key.length > 1 || lick.key === 'F' ? 'flat' : 'sharp');
      const tr = opts.transpose || 0;
      const tun = GH.voicings.STD;
      /* 마디 나누기 */
      const measures = [[]]; let pos = 0;
      lick.notes.forEach(ev => {
        let d = ev.d; let cur = measures[measures.length - 1];
        const room = 4 - (pos % 4);
        if (d > room + 1e-6) { /* 마디를 넘는 음은 잘라서 넣는다 */
          cur.push(Object.assign({}, ev, { d: room })); pos += room; measures.push([]); cur = measures[measures.length - 1]; d -= room;
          cur.push(Object.assign({}, ev, { d, rest: ev.rest, tie: true })); pos += d;
        } else { cur.push(ev); pos += d; }
        if (Math.abs(pos % 4) < 1e-6 && pos > 0) measures.push([]);
      });
      if (!measures[measures.length - 1].length) measures.pop();
      const MW = 250, perLine = Math.max(1, Math.min(4, Math.floor((opts.width || 1000) / MW)));
      const lines = Math.ceil(measures.length / perLine);
      const div = document.createElement('div');
      div.className = 'staff-box';
      const renderer = new Renderer(div, Renderer.Backends.SVG);
      const totalW = Math.min(measures.length, perLine) * MW + 40;
      renderer.resize(totalW, lines * 110 + 10);
      const ctx = renderer.getContext();
      measures.forEach((m, mi) => {
        const line = Math.floor(mi / perLine), col = mi % perLine;
        const x = 10 + col * MW + (col === 0 ? 0 : 0), y = line * 110;
        const stave = new Stave(x, y, MW + (col === 0 ? 30 : 0));
        if (col === 0) { stave.addClef('treble'); if (mi === 0) stave.addTimeSignature('4/4'); }
        stave.setContext(ctx).draw();
        const notes = m.map(ev => {
          const dur = DUR[ev.d] || '8';
          if (ev.rest) return new StaveNote({ keys: ['b/4'], duration: dur.replace('d', '') + 'r' });
          const pairs = ev.ns ? ev.ns : [[ev.s, ev.f]];
          const ks = pairs.map(([s, f]) => keyOf(tun[6 - s] + f + tr + 12, pref)).sort((a, b) => 0);
          const n = new StaveNote({ keys: ks.map(k => k.key), duration: dur.replace('d', '') });
          ks.forEach((k, idx) => { if (k.acc) n.addModifier(new Accidental(k.acc), idx); });
          if (dur.endsWith('d')) { try { Dot.buildAndAttach([n], { all: true }); } catch (e) { /* ignore */ } }
          return n;
        });
        const voice = new Voice({ num_beats: 4, beat_value: 4 }).setStrict(false);
        voice.addTickables(notes);
        const beams = Beam.generateBeams(notes.filter(n => !n.isRest()));
        new Formatter().joinVoices([voice]).format([voice], stave.getNoteEndX() - stave.getNoteStartX() - 16);
        center(notes, stave);
        voice.draw(ctx, stave);
        beams.forEach(b => b.setContext(ctx).draw());
      });
      return div;
    } catch (e) {
      console.warn('오선 렌더링 실패', e);
      return null;
    }
  }
  /* 코드 구성음을 오선에 (하나의 화음) */
  function chordStaff(midis, opts) {
    const VF = vf(); if (!VF) return null;
    opts = opts || {};
    try {
      const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = VF;
      const div = document.createElement('div'); div.className = 'staff-box';
      const renderer = new Renderer(div, Renderer.Backends.SVG);
      renderer.resize(opts.width || 200, 120);
      const ctx = renderer.getContext();
      const stave = new Stave(10, 0, (opts.width || 200) - 20); stave.addClef('treble'); stave.setContext(ctx).draw();
      const ks = midis.slice().sort((a, b) => a - b).map(m => keyOf(m, opts.pref || 'sharp'));
      const n = new StaveNote({ keys: ks.map(k => k.key), duration: 'w' });
      ks.forEach((k, i) => { if (k.acc) n.addModifier(new Accidental(k.acc), i); });
      const voice = new Voice({ num_beats: 4, beat_value: 4 }).setStrict(false); voice.addTickables([n]);
      new Formatter().joinVoices([voice]).format([voice], (opts.width || 200) - 80);
      center([n], stave);
      voice.draw(ctx, stave);
      return div;
    } catch (e) { console.warn('오선 렌더링 실패', e); return null; }
  }
  /* 스케일 음을 순서대로 오선에 */
  function scaleStaff(midis, opts) {
    const VF = vf(); if (!VF) return null;
    opts = opts || {};
    try {
      const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = VF;
      const div = document.createElement('div'); div.className = 'staff-box';
      const W = opts.width || Math.max(320, midis.length * 46 + 80);
      const renderer = new Renderer(div, Renderer.Backends.SVG);
      renderer.resize(W, 120);
      const ctx = renderer.getContext();
      const stave = new Stave(10, 0, W - 20); stave.addClef('treble'); stave.setContext(ctx).draw();
      const notes = midis.map(m => { const k = keyOf(m, opts.pref || 'sharp'); const n = new StaveNote({ keys: [k.key], duration: 'q' }); if (k.acc) n.addModifier(new Accidental(k.acc), 0); return n; });
      const voice = new Voice({ num_beats: midis.length, beat_value: 4 }).setStrict(false); voice.addTickables(notes);
      new Formatter().joinVoices([voice]).format([voice], W - 90);
      center(notes, stave);
      voice.draw(ctx, stave);
      return div;
    } catch (e) { console.warn('오선 렌더링 실패', e); return null; }
  }
  GH.render.staff = staff;
  GH.render.chordStaff = chordStaff;
  GH.render.scaleStaff = scaleStaff;
  GH.render.hasVexFlow = () => !!vf();
})();
