/* VexFlow 오선 렌더링: 리얼북처럼 손으로 쓴 재즈 악보 스타일 (없으면 null) */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const N = GH.notes;
  GH.render = GH.render || {};
  const DUR = { 4: 'w', 3: 'hd', 2: 'h', 1.5: 'qd', 1: 'q', 0.75: '8d', 0.5: '8', 0.25: '16' };
  const SVG_NS = 'http://www.w3.org/2000/svg';
  let fontSet = false;
  /* 음표 · 음자리표는 손글씨 재즈 악보 글꼴 Petaluma (VexFlow 전체 빌드에 들어 있음) */
  function vf() {
    const VF = window.Vex && window.Vex.Flow ? window.Vex.Flow : null;
    if (VF && !fontSet) {
      fontSet = true;
      try { if (VF.setMusicFont) VF.setMusicFont('Petaluma', 'Bravura', 'Gonville', 'Custom'); } catch (e) { console.warn('Petaluma 글꼴을 쓸 수 없어 기본 글꼴로 그립니다', e); }
    }
    return VF;
  }
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

  /* ---- 리얼북 표기 조각 ---- */
  function svgEl(tag, attrs, text) {
    const e = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(k => e.setAttribute(k, attrs[k]));
    if (text != null) e.textContent = text;
    return e;
  }
  const FLAT = '♭', SHARP = '♯';
  const accTxt = q => q.replace(/b(?=\d)/g, FLAT).replace(/#/g, SHARP);
  /* 코드 심볼: 루트는 크게, 임시표는 위로 작게, 나머지는 작게. b/# 은 ♭/♯ 로 */
  function chordText(sym, x, y, cls) {
    const t = svgEl('text', { class: 'rb-chord' + (cls ? ' ' + cls : ''), x, y });
    const m = /^([A-G])([#b♯♭]?)([^/]*)(?:\/(.+))?$/.exec(String(sym || ''));
    if (!m) { t.textContent = sym; return t; }
    t.appendChild(svgEl('tspan', { class: 'rt' }, m[1]));
    if (m[2]) t.appendChild(svgEl('tspan', { class: 'ra', dy: -7 }, m[2] === 'b' || m[2] === FLAT ? FLAT : SHARP));
    const rest = (m[3] ? accTxt(m[3]) : '') + (m[4] ? '/' + m[4].replace(/^([A-G])b/, '$1' + FLAT).replace(/^([A-G])#/, '$1' + SHARP) : '');
    /* 임시표(♭♯)는 음악 글꼴로 따로 */
    let first = true;
    (rest.match(/[♭♯]|[^♭♯]+/g) || []).forEach(run => {
      const isAcc = /^[♭♯]$/.test(run);
      const attrs = { class: isAcc ? 'rq rqa' : 'rq' };
      if (isAcc) attrs.dx = 2.5; else if (!first) attrs.dx = 1;
      if (first && m[2]) attrs.dy = 7;
      first = false;
      t.appendChild(svgEl('tspan', attrs, run));
    });
    return t;
  }
  const chordWidth = sym => 14 + String(sym || '').length * 9;
  /* 제목(가운데 위)과 연주 스타일(왼쪽 위) */
  function sheetHeader(svg, W, title, style) {
    if (title) svg.appendChild(svgEl('text', { class: 'rb-title', x: W / 2, y: 34, 'text-anchor': 'middle' }, title));
    if (style) {
      const t = svgEl('text', { class: 'rb-style', x: 14, y: title ? 60 : 22 });
      String(style).split('♩').forEach((part, i) => { if (i) t.appendChild(svgEl('tspan', { class: 'rb-note' }, '♩')); if (part) t.appendChild(svgEl('tspan', null, part)); });
      svg.appendChild(t);
    }
  }
  /* 박자표: Petaluma 숫자가 오선보다 커 보이지 않게 조금 줄인다 */
  function addTime(VF, stave, spec) {
    spec = spec || '4/4';
    try { const ts = new VF.TimeSignature(spec); ts.point = 31; ts.setTimeSig(spec); stave.addModifier(ts); }
    catch (e) { stave.addTimeSignature(spec); }
  }
  /* 화면 폭에 맞춰 키운다 (최대 배율까지) */
  function fitSvg(svg, W, H, maxScale) {
    if (!svg) return;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.style.width = '100%'; svg.style.height = 'auto'; svg.style.maxWidth = Math.round(W * (maxScale || 1)) + 'px';
    svg.style.minWidth = Math.round(Math.min(W, 520) * 0.78) + 'px'; /* 너무 작아지면 가로 스크롤 */
  }
  /* 높은음자리표 기준 음 높이 (한 칸 = 5px) */
  const LETTERS = 'cdefgab';
  const stepOf = key => { const parts = key.split('/'); return Number(parts[1]) * 7 + LETTERS.indexOf(parts[0].charAt(0)); };
  const TOP_STEP = 38, BOTTOM_STEP = 30; /* F5 (맨 윗줄), E4 (맨 아랫줄) */

  /* 릭 → 오선 (코드 심볼, 제목, 스타일 표기 포함). opts: {transpose, pref, width, tuning, title, style} */
  function staff(lick, opts) {
    const VF = vf(); if (!VF) return null;
    opts = opts || {};
    try {
      const { Renderer, Stave, StaveNote, Voice, Formatter, Beam, Dot, Barline } = VF;
      const pref = opts.pref || (/b/.test(lick.key) && lick.key.length > 1 || lick.key === 'F' ? 'flat' : 'sharp');
      const tr = opts.transpose || 0;
      const tun = opts.tuning || GH.voicings.STD;
      /* 기타는 실음보다 한 옥타브 높게 적는다 */
      const writtenOf = ev => (ev.ns ? ev.ns : [[ev.s, ev.f]]).map(([s, f]) => tun[6 - s] + f + tr + 12);
      /* 마디 나누기: 마디를 넘는 음은 잘라서 넣고, 코드 심볼은 첫 조각에만 */
      const measures = [[]]; let pos = 0;
      lick.notes.forEach(ev => {
        let d = ev.d; let cur = measures[measures.length - 1];
        const room = 4 - (pos % 4);
        if (d > room + 1e-6) {
          cur.push(Object.assign({}, ev, { d: room })); pos += room; measures.push([]); cur = measures[measures.length - 1]; d -= room;
          cur.push(Object.assign({}, ev, { d, rest: ev.rest, tie: true, ch: null })); pos += d;
        } else { cur.push(ev); pos += d; }
        if (Math.abs(pos % 4) < 1e-6 && pos > 0) measures.push([]);
      });
      if (!measures[measures.length - 1].length) measures.pop();
      const MW = 250, CLEF = 34;
      const perLine = Math.max(1, Math.min(4, Math.floor(((opts.width || 1000) - CLEF - 20) / MW)));
      const lineCount = Math.ceil(measures.length / perLine);
      const totalW = Math.min(measures.length, perLine) * MW + CLEF + 22;
      /* 줄마다 위아래 여백: 가장 높은 음 · 낮은 음과 코드 심볼 자리 */
      const lines = [];
      for (let li = 0; li < lineCount; li++) {
        const evs = [].concat(...measures.slice(li * perLine, (li + 1) * perLine));
        let hi = TOP_STEP, lo = BOTTOM_STEP, hasChord = false;
        evs.forEach(ev => {
          if (ev.ch) hasChord = true;
          if (ev.rest) return;
          writtenOf(ev).forEach(m => { const st = stepOf(keyOf(m, pref).key); hi = Math.max(hi, st); lo = Math.min(lo, st); });
        });
        const above = (hi - TOP_STEP) * 5, below = (BOTTOM_STEP - lo) * 5;
        const chordLift = Math.max(22, above + 16);
        lines.push({ padTop: hasChord ? chordLift + 22 : Math.max(28, above + 18), chordLift, padBottom: Math.max(30, below + 26) });
      }
      const div = document.createElement('div');
      div.className = 'staff-box rb';
      const renderer = new Renderer(div, Renderer.Backends.SVG);
      const headH = opts.title ? 68 : opts.style ? 28 : 0;
      let y0 = headH + 4;
      lines.forEach(L => { L.top = y0 + L.padTop; y0 += L.padTop + 40 + L.padBottom; });
      renderer.resize(totalW, y0 + 4);
      const ctx = renderer.getContext();
      const svg = div.querySelector('svg');
      fitSvg(svg, totalW, y0 + 4, 1.3);
      if (svg) sheetHeader(svg, totalW, opts.title, opts.style);
      const chordMarks = [];
      measures.forEach((m, mi) => {
        const line = Math.floor(mi / perLine), col = mi % perLine; const L = lines[line];
        const x = 10 + (col === 0 ? 0 : CLEF + col * MW);
        const stave = new Stave(x, L.top - 40, MW + (col === 0 ? CLEF : 0));
        if (col === 0) { stave.addClef('treble'); if (mi === 0) addTime(VF, stave); }
        if (mi === measures.length - 1 && Barline) stave.setEndBarType(Barline.type.END);
        stave.setContext(ctx).draw();
        const notes = m.map(ev => {
          const dur = DUR[ev.d] || '8';
          const n = ev.rest ? new StaveNote({ keys: ['b/4'], duration: dur.replace('d', '') + 'r' }) : makeNote(VF, writtenOf(ev), null, pref, dur.replace('d', ''));
          if (dur.endsWith('d')) { try { Dot.buildAndAttach([n], { all: true }); } catch (e) { /* ignore */ } }
          if (ev.ch) n.__ch = ev.ch;
          return n;
        });
        const voice = new Voice({ num_beats: 4, beat_value: 4 }).setStrict(false);
        voice.addTickables(notes);
        const beams = Beam.generateBeams(notes.filter(n => !n.isRest()));
        new Formatter().joinVoices([voice]).format([voice], stave.getNoteEndX() - stave.getNoteStartX() - 16);
        voice.draw(ctx, stave);
        beams.forEach(b => b.setContext(ctx).draw());
        notes.forEach(n => { if (n.__ch) chordMarks.push({ sym: n.__ch, x: n.getAbsoluteX() - 4, y: L.top - L.chordLift, line }); });
      });
      /* 코드 심볼: 같은 줄에서 겹치면 오른쪽으로 민다 */
      let last = { line: -1, end: 0 };
      chordMarks.forEach(c => {
        const x = c.line === last.line ? Math.max(c.x, last.end + 6) : c.x;
        if (svg) svg.appendChild(chordText(c.sym, x, c.y));
        last = { line: c.line, end: x + chordWidth(c.sym) };
      });
      return div;
    } catch (e) {
      console.warn('오선 렌더링 실패', e);
      return null;
    }
  }
  /* 코드 구성음을 오선에 (하나의 화음). opts: {pref, width, names(구성음 철자, midis 와 같은 순서), symbol(위에 적을 코드 심볼)} */
  function chordStaff(midis, opts) {
    const VF = vf(); if (!VF) return null;
    opts = opts || {};
    try {
      const { Renderer, Stave, Voice, Formatter } = VF;
      const shift = fitShift(midis);
      const W = 170, top = opts.symbol ? 26 : 0;
      const div = document.createElement('div'); div.className = 'staff-box rb';
      const renderer = new Renderer(div, Renderer.Backends.SVG);
      renderer.resize(W, 130 + top);
      const ctx = renderer.getContext();
      const stave = new Stave(8, 10 + top, W - 16); stave.addClef('treble'); stave.setContext(ctx).draw();
      const n = makeNote(VF, midis.map(m => m + shift), opts.names, opts.pref || 'sharp', 'w');
      const voice = new Voice({ num_beats: 4, beat_value: 4 }).setStrict(false); voice.addTickables([n]);
      new Formatter().joinVoices([voice]).format([voice], stave.getNoteEndX() - stave.getNoteStartX() - 10);
      voice.draw(ctx, stave);
      const svg = div.querySelector('svg');
      fitSvg(svg, W, 130 + top, 1.45);
      if (opts.symbol && svg) svg.appendChild(chordText(opts.symbol, Math.max(12, n.getAbsoluteX() - 8), 54));
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
      const div = document.createElement('div'); div.className = 'staff-box rb';
      const renderer = new Renderer(div, Renderer.Backends.SVG);
      renderer.resize(W, 130);
      const ctx = renderer.getContext();
      const stave = new Stave(8, 10, W - 16); stave.addClef('treble'); stave.setContext(ctx).draw();
      fitSvg(div.querySelector('svg'), W, 130, 1.3);
      const notes = midis.map((m, i) => makeNote(VF, [m + shift], opts.names ? [opts.names[i]] : null, opts.pref || 'sharp', 'q'));
      const voice = new Voice({ num_beats: midis.length, beat_value: 4 }).setStrict(false); voice.addTickables(notes);
      new Formatter().joinVoices([voice]).format([voice], stave.getNoteEndX() - stave.getNoteStartX() - 14);
      voice.draw(ctx, stave);
      return div;
    } catch (e) { console.warn('오선 렌더링 실패', e); return null; }
  }

  /* 보이스별 화음을 오선에 (실음 그대로, 필요하면 큰보표).
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
      const div = document.createElement('div'); div.className = 'staff-box rb voices-staff';
      const renderer = new Renderer(div, Renderer.Backends.SVG);
      const totalW = FIRST + Math.min(bars.length, perLine) * BW + 20;
      renderer.resize(totalW, lines * staffH + 20);
      fitSvg(div.querySelector('svg'), totalW, lines * staffH + 20, 1.25);
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
  /* 리얼북 왼쪽 위 스타일 표기: (Med. Swing ♩ = 120) */
  function feelMark(tempo, feel) {
    const t = tempo < 88 ? 'Slow' : tempo < 150 ? 'Med.' : 'Up';
    const f = feel === 'swing' ? 'Swing' : feel === 'shuffle' ? 'Shuffle' : 'Straight';
    return '(' + t + ' ' + f + ')  ♩ = ' + Math.round(tempo);
  }
  GH.render.feelMark = feelMark;
  GH.render.staff = staff;
  GH.render.chordStaff = chordStaff;
  GH.render.scaleStaff = scaleStaff;
  GH.render.voicesStaff = voicesStaff;
  GH.render.staffFitShift = fitShift;
  GH.render.hasVexFlow = () => !!vf();
  GH.render.vexflow = vf;
  GH.render.addTime = addTime;
  GH.render.chordText = chordText;
})();
