/* VexFlow 오선 렌더링 (없으면 null) */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const N = GH.notes;
  GH.render = GH.render || {};
  const DUR = { 4: 'w', 3: 'hd', 2: 'h', 1.5: 'qd', 1: 'q', 0.75: '8d', 0.5: '8', 0.25: '16' };
  function vf() { return window.Vex && window.Vex.Flow ? window.Vex.Flow : null; }
  const ACC_SEMI = { '': 0, '#': 1, '##': 2, 'b': -1, 'bb': -2 };

  /* midi + (선택) 철자 → VexFlow 키. 철자가 있으면 그 글자와 임시표를 쓰고, 옥타브는 실제 음높이에서 계산 (Cb4 = B3 소리) */
  function keyOf(midi, pref, name) {
    let letter, acc;
    const p = name ? N.parseNote(name) : null;
    if (p && N.mod(p.pc - midi, 12) === 0 && Math.abs(p.acc) <= 2) { letter = p.letter; acc = p.acc > 0 ? '#'.repeat(p.acc) : 'b'.repeat(-p.acc); }
    else { const nm = N.noteName(N.mod(midi, 12), pref); letter = nm.charAt(0); acc = nm.slice(1); }
    const oct = Math.floor((midi - ACC_SEMI[acc]) / 12) - 1;
    return { key: letter.toLowerCase() + acc + '/' + oct, acc: acc || null };
  }
  /* 높은음자리표 가운데 (D4 ~ G5) 에 가장 많이 들어오도록 표기 옥타브만 옮긴다. 소리에는 영향 없음 */
  function fitShift(midis, lo, hi) {
    lo = lo == null ? 62 : lo; hi = hi == null ? 79 : hi;
    let best = 0, bestCost = Infinity;
    for (let s = -24; s <= 24; s += 12) {
      let cost = 0;
      midis.forEach(m => { const x = m + s; if (x < lo) cost += lo - x; else if (x > hi) cost += x - hi; });
      cost += Math.abs(s) * 0.001; /* 같으면 덜 옮기는 쪽 */
      if (cost < bestCost) { bestCost = cost; best = s; }
    }
    return best;
  }
  function makeNote(VF, midis, names, pref, duration, clef) {
    const items = midis.map((m, i) => ({ m, k: keyOf(m, pref, names && names[i]), i })).sort((a, b) => a.m - b.m);
    const n = new VF.StaveNote({ keys: items.map(x => x.k.key), duration, auto_stem: true, clef: clef || 'treble' });
    items.forEach((x, idx) => { if (x.k.acc) n.addModifier(new VF.Accidental(x.k.acc), idx); });
    n.__order = items.map(x => x.i);
    return n;
  }

  /* 릭 → 오선. opts: {transpose, pref, width, tuning} */
  function staff(lick, opts) {
    const VF = vf(); if (!VF) return null;
    opts = opts || {};
    try {
      const { Renderer, Stave, StaveNote, Voice, Formatter, Beam, Dot } = VF;
      const pref = opts.pref || (/b/.test(lick.key) && lick.key.length > 1 || lick.key === 'F' ? 'flat' : 'sharp');
      const tr = opts.transpose || 0;
      const tun = opts.tuning || GH.voicings.STD;
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
        const x = 10 + col * MW, y = line * 110;
        const stave = new Stave(x, y, MW + (col === 0 ? 30 : 0));
        if (col === 0) { stave.addClef('treble'); if (mi === 0) stave.addTimeSignature('4/4'); }
        stave.setContext(ctx).draw();
        const notes = m.map(ev => {
          const dur = DUR[ev.d] || '8';
          if (ev.rest) return new StaveNote({ keys: ['b/4'], duration: dur.replace('d', '') + 'r' });
          const pairs = ev.ns ? ev.ns : [[ev.s, ev.f]];
          /* 기타는 실음보다 한 옥타브 높게 적는다 */
          const n = makeNote(VF, pairs.map(([s, f]) => tun[6 - s] + f + tr + 12), null, pref, dur.replace('d', ''));
          if (dur.endsWith('d')) { try { Dot.buildAndAttach([n], { all: true }); } catch (e) { /* ignore */ } }
          return n;
        });
        const voice = new Voice({ num_beats: 4, beat_value: 4 }).setStrict(false);
        voice.addTickables(notes);
        const beams = Beam.generateBeams(notes.filter(n => !n.isRest()));
        new Formatter().joinVoices([voice]).format([voice], stave.getNoteEndX() - stave.getNoteStartX() - 16);
        voice.draw(ctx, stave);
        beams.forEach(b => b.setContext(ctx).draw());
      });
      return div;
    } catch (e) {
      console.warn('오선 렌더링 실패', e);
      return null;
    }
  }
  /* 코드 구성음을 오선에 (하나의 화음). opts: {pref, width, names(구성음 철자, midis 와 같은 순서)} */
  function chordStaff(midis, opts) {
    const VF = vf(); if (!VF) return null;
    opts = opts || {};
    try {
      const { Renderer, Stave, Voice, Formatter } = VF;
      const shift = fitShift(midis);
      const W = 170;
      const div = document.createElement('div'); div.className = 'staff-box';
      const renderer = new Renderer(div, Renderer.Backends.SVG);
      renderer.resize(W, 130);
      const ctx = renderer.getContext();
      const stave = new Stave(8, 10, W - 16); stave.addClef('treble'); stave.setContext(ctx).draw();
      const n = makeNote(VF, midis.map(m => m + shift), opts.names, opts.pref || 'sharp', 'w');
      const voice = new Voice({ num_beats: 4, beat_value: 4 }).setStrict(false); voice.addTickables([n]);
      new Formatter().joinVoices([voice]).format([voice], stave.getNoteEndX() - stave.getNoteStartX() - 10);
      voice.draw(ctx, stave);
      return div;
    } catch (e) { console.warn('오선 렌더링 실패', e); return null; }
  }
  /* 스케일 음을 순서대로 오선에. opts: {pref, width, names} */
  function scaleStaff(midis, opts) {
    const VF = vf(); if (!VF) return null;
    opts = opts || {};
    try {
      const { Renderer, Stave, Voice, Formatter } = VF;
      const shift = fitShift(midis);
      const W = opts.width || Math.max(340, midis.length * 50 + 90);
      const div = document.createElement('div'); div.className = 'staff-box';
      const renderer = new Renderer(div, Renderer.Backends.SVG);
      renderer.resize(W, 130);
      const ctx = renderer.getContext();
      const stave = new Stave(8, 10, W - 16); stave.addClef('treble'); stave.setContext(ctx).draw();
      const notes = midis.map((m, i) => makeNote(VF, [m + shift], opts.names ? [opts.names[i]] : null, opts.pref || 'sharp', 'q'));
      const voice = new Voice({ num_beats: midis.length, beat_value: 4 }).setStrict(false); voice.addTickables(notes);
      new Formatter().joinVoices([voice]).format([voice], stave.getNoteEndX() - stave.getNoteStartX() - 14);
      voice.draw(ctx, stave);
      return div;
    } catch (e) { console.warn('오선 렌더링 실패', e); return null; }
  }

  /* 성부별 화음을 오선에 (실음 그대로, 필요하면 큰보표).
     columns: [[{midi, name, voice}], ...] 한 칸 = 한 박. opts: {pref, width, colors: [melody, v1, v2, v3]}
     반환: {el, highlight(i)} */
  function voicesStaff(columns, opts) {
    const VF = vf(); if (!VF) return null;
    opts = opts || {};
    try {
      const { Renderer, Stave, Voice, Formatter, GhostNote, StaveConnector } = VF;
      const all = [].concat(...columns.map(c => c.map(n => n.midi)));
      if (!all.length) return null;
      const lo = Math.min(...all), hi = Math.max(...all);
      const layout = lo >= 57 ? 'treble' : hi < 62 ? 'bass' : 'grand';
      const SPLIT = 60; /* 큰보표에서 가운데 C 이상은 높은음자리표 */
      const perBar = 4;
      const bars = []; for (let i = 0; i < columns.length; i += perBar) bars.push(columns.slice(i, i + perBar));
      const BW = 230, FIRST = 50;
      const width = Math.max(360, opts.width || 900);
      const perLine = Math.max(1, Math.floor((width - FIRST - 20) / BW));
      const lines = Math.ceil(bars.length / perLine);
      const staffH = layout === 'grand' ? 190 : 110;
      const div = document.createElement('div'); div.className = 'staff-box voices-staff';
      const renderer = new Renderer(div, Renderer.Backends.SVG);
      const totalW = FIRST + Math.min(bars.length, perLine) * BW + 20;
      renderer.resize(totalW, lines * staffH + 20);
      const ctx = renderer.getContext();
      const colors = opts.colors || [];
      const noteEls = [];
      const build = (col, part) => {
        const pick = col.filter(n => layout !== 'grand' || (part === 'treble' ? n.midi >= SPLIT : n.midi < SPLIT));
        if (!pick.length) return new GhostNote({ duration: 'q' });
        const n = makeNote(VF, pick.map(p => p.midi), pick.map(p => p.name), opts.pref || 'sharp', 'q', part);
        n.__order.forEach((srcIdx, keyIdx) => { const c = colors[pick[srcIdx].voice]; if (c) n.setKeyStyle(keyIdx, { fillStyle: c, strokeStyle: c }); });
        const flag = pick.some(p => p.outOfScale); if (flag) n.__out = true;
        return n;
      };
      bars.forEach((bar, bi) => {
        const line = Math.floor(bi / perLine), colIdx = bi % perLine;
        const x = 10 + (colIdx === 0 ? 0 : FIRST + colIdx * BW - 10), y = 10 + line * staffH;
        const w = colIdx === 0 ? FIRST + BW - 10 : BW;
        const parts = layout === 'grand' ? ['treble', 'bass'] : [layout];
        const staves = parts.map((clef, k) => { const s = new Stave(x, y + k * 80, w); if (colIdx === 0) s.addClef(clef); s.setContext(ctx).draw(); return s; });
        if (layout === 'grand' && colIdx === 0) {
          new StaveConnector(staves[0], staves[1]).setType(StaveConnector.type.BRACE).setContext(ctx).draw();
          new StaveConnector(staves[0], staves[1]).setType(StaveConnector.type.SINGLE_LEFT).setContext(ctx).draw();
        }
        if (layout === 'grand') new StaveConnector(staves[0], staves[1]).setType(StaveConnector.type.SINGLE_RIGHT).setContext(ctx).draw();
        const voices = parts.map(part => {
          const notes = bar.map(col => build(col, part));
          const v = new Voice({ num_beats: bar.length, beat_value: 4 }).setStrict(false); v.addTickables(notes); v.__notes = notes; return v;
        });
        const fw = staves[0].getNoteEndX() - staves[0].getNoteStartX() - 12;
        new Formatter().joinVoices(voices).format(voices, fw);
        voices.forEach((v, k) => v.draw(ctx, staves[k]));
        bar.forEach((col, ci) => {
          const idx = bi * perBar + ci; const els = [];
          voices.forEach(v => { const n = v.__notes[ci]; try { const e = n.getSVGElement && n.getSVGElement(); if (e) els.push(e); } catch (e) { /* ignore */ } });
          noteEls[idx] = els;
        });
      });
      let cur = -1;
      return {
        el: div,
        highlight(i) {
          if (cur >= 0 && noteEls[cur]) noteEls[cur].forEach(e => e.classList.remove('current'));
          cur = i == null ? -1 : i;
          if (cur >= 0 && noteEls[cur]) noteEls[cur].forEach(e => e.classList.add('current'));
        },
        layout
      };
    } catch (e) { console.warn('오선 렌더링 실패', e); return null; }
  }
  GH.render.staff = staff;
  GH.render.chordStaff = chordStaff;
  GH.render.scaleStaff = scaleStaff;
  GH.render.voicesStaff = voicesStaff;
  GH.render.staffFitShift = fitShift;
  GH.render.hasVexFlow = () => !!vf();
})();
