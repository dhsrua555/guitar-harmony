/* 연습용 악보 (VexFlow): 한 줄 선율 · 큰보표(양손) · 드럼 보표. 운지 · 스티킹 · 가사 줄, 연주 중인 음 표시
   spec: { kind: 'line' | 'grand' | 'drum', width, pref,
           line:  events [{at, d, m: [midi…] | null(쉼표), names?, fg?(위 줄 글자), lyric?(아래 줄 글자), stacc?, acc?, x?(데드 노트)}], clef 'treble'|'bass'|'treble8vb', written(표기 옥타브 이동)
           grand: rh, lh (위와 같은 형식)
           drum:  slots [{at, d, hits:[{k, acc, ghost}], st?(스티킹)}], handsOnly(발 성부 없이) }
   → { el, highlight(at | null) } 또는 VexFlow 가 없으면 null */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const N = GH.notes;
  GH.render = GH.render || {};
  const EPS = 1e-4;
  const ACC_SEMI = { '': 0, '#': 1, '##': 2, 'b': -1, 'bb': -2 };
  const LETTERS = 'cdefgab';
  const CODE = [[4, 'w'], [3, 'hd'], [2, 'h'], [1.5, 'qd'], [1, 'q'], [0.75, '8d'], [0.5, '8'], [0.25, '16']];
  const codeOf = d => { const c = CODE.find(([v]) => Math.abs(v - d) < EPS); return c ? c[1] : Math.abs(d - 1 / 3) < EPS ? '8' : Math.abs(d - 2 / 3) < EPS ? 'q' : '16'; };
  const isTrip = d => Math.abs(d - 1 / 3) < EPS || Math.abs(d - 2 / 3) < EPS;
  /* 쉼표 길이를 박 안에서 쪼갠다 */
  function restPieces(from, to) {
    const out = []; let t = from;
    while (t < to - EPS) {
      const beatEnd = Math.floor(t + EPS) + 1, room = Math.min(to, t + 4 - (t % 4)) - t;
      const inBeat = Math.min(to, beatEnd) - t;
      let d = [4, 2, 1].find(v => v <= room + EPS && Math.abs((t % v)) < EPS) || [0.75, 0.5, 0.25].find(v => v <= inBeat + EPS) || inBeat;
      out.push({ at: t, d }); t += d;
    }
    return out;
  }
  function keyOf(midi, pref, name) {
    let letter, acc;
    const p = name ? N.parseNote(name) : null;
    if (p && N.mod(p.pc - midi, 12) === 0 && Math.abs(p.acc) <= 2) { letter = p.letter; acc = p.acc > 0 ? '#'.repeat(p.acc) : 'b'.repeat(-p.acc); }
    else { const nm = N.noteName(N.mod(midi, 12), pref); letter = nm.charAt(0); acc = nm.slice(1); }
    const oct = Math.floor((midi - ACC_SEMI[acc]) / 12) - 1;
    return { key: letter.toLowerCase() + acc + '/' + oct, acc: acc || null, step: oct * 7 + LETTERS.indexOf(letter.toLowerCase()) };
  }
  const CLEF_LINES = { treble: [38, 30], bass: [26, 18], percussion: [38, 30] }; /* 맨 윗줄 · 맨 아랫줄 음 높이 */

  /* 선율 한 줄 → 마디별 VexFlow 음표 */
  function lineVoice(VF, events, opts) {
    const clef = opts.clef === 'bass' ? 'bass' : 'treble';
    const shift = opts.written || 0;
    const evs = events.slice().sort((a, b) => a.at - b.at);
    const total = Math.max(4, Math.ceil((evs.length ? evs[evs.length - 1].at + evs[evs.length - 1].d : 4) / 4 - EPS) * 4);
    const measures = [];
    for (let m = 0; m < total / 4; m++) measures.push([]);
    let cursor = 0;
    const push = (item) => { const mi = Math.min(measures.length - 1, Math.floor(item.at / 4 + EPS)); measures[mi].push(item); };
    evs.forEach(ev => {
      if (ev.at > cursor + EPS) restPieces(cursor, ev.at).forEach(r => push({ at: r.at, d: r.d, rest: true }));
      push(Object.assign({}, ev, { rest: !ev.m || !ev.m.length }));
      cursor = ev.at + ev.d;
    });
    if (cursor < total - EPS) restPieces(cursor, total).forEach(r => push({ at: r.at, d: r.d, rest: true }));
    return measures.map(list => list.map(ev => {
      const code = codeOf(ev.d);
      let n;
      if (ev.rest) n = new VF.StaveNote({ keys: [clef === 'bass' ? 'd/3' : 'b/4'], duration: code.replace('d', '') + 'r', clef });
      else {
        const ks = ev.m.map((m, i) => keyOf(m + shift, opts.pref, ev.names && ev.names[i]));
        const order = ks.map((k, i) => i).sort((a, b) => ks[a].step - ks[b].step);
        n = new VF.StaveNote({ keys: order.map(i => ks[i].key + (ev.x ? '/x2' : '')), duration: code.replace('d', ''), clef, auto_stem: true });
        if (!ev.x) order.forEach((i, idx) => { if (ks[i].acc) n.addModifier(new VF.Accidental(ks[i].acc), idx); });
        if (ev.soft) order.forEach((i, idx) => { if (ev.soft.includes(ev.m[i])) try { n.setKeyStyle(idx, { fillStyle: '#948d80', strokeStyle: '#948d80' }); } catch (e) { /* ignore */ } });   /* 회색: 피아노가 치는 음 */
        n.__steps = ks.map(k => k.step);
        if (ev.stacc) try { n.addModifier(new VF.Articulation('a.').setPosition(VF.Modifier.Position.ABOVE), 0); } catch (e) { /* ignore */ }
        if (ev.acc) try { n.addModifier(new VF.Articulation('a>').setPosition(VF.Modifier.Position.ABOVE), 0); } catch (e) { /* ignore */ }
      }
      if (code.endsWith('d')) try { VF.Dot.buildAndAttach([n], { all: true }); } catch (e) { /* ignore */ }
      n.__at = ev.at; n.__d = ev.d; n.__fg = ev.fg; n.__lyric = ev.lyric; n.__rest = !!ev.rest;
      return n;
    }));
  }

  /* 드럼: 손(위 기둥) · 발(아래 기둥) 두 목소리 */
  const HANDS = new Set(['hat', 'hatopen', 'ride', 'crash', 'snare', 'rim', 'tom1', 'tom2', 'tom3']);
  const POS = { crash: 'a/5/x2', ride: 'f/5/x2', hat: 'g/5/x2', hatopen: 'g/5/x2', snare: 'c/5', rim: 'c/5/x2', tom1: 'e/5', tom2: 'd/5', tom3: 'a/4', kick: 'f/4', pedal: 'd/4/x2' };
  const STEP = { crash: 40, ride: 38, hat: 39, hatopen: 39, snare: 35, rim: 35, tom1: 37, tom2: 36, tom3: 33, kick: 31, pedal: 29 };
  function drumVoices(VF, slots) {
    const d = slots.length ? slots[0].d : 0.25; const per = Math.max(1, Math.round(1 / d));
    const total = Math.max(4, Math.ceil(slots.reduce((a, s) => Math.max(a, s.at + s.d), 0) / 4 - EPS) * 4);
    const bySlot = {}; slots.forEach(s => { bySlot[Math.round(s.at / d)] = s; });
    const make = (up) => {
      const measures = [];
      for (let m = 0; m < total / 4; m++) {
        const list = [];
        for (let b = 0; b < 4; b++) {
          const base = (m * 4 + b) * per; const on = [];
          for (let k = 0; k < per; k++) { const s = bySlot[base + k]; const hs = s ? s.hits.filter(x => HANDS.has(x.k) === up) : []; if (hs.length) on.push({ k, s, hs }); }
          const beatAt = m * 4 + b;
          if (!on.length) { list.push(rest(VF, 1, beatAt, up)); continue; }
          if (per === 3) { /* 셋잇단: 첫 칸만이면 4분음표, 아니면 4분 · 8분을 섞은 셋잇단 (재즈 라이드 표기) */
            if (on.length === 1 && on[0].k === 0) { list.push(hitNote(VF, on[0], 'q', beatAt, 1, up)); continue; }
            const grp = [];
            if (on[0].k > 0) grp.push(rest(VF, on[0].k / 3, beatAt, up, on[0].k === 2 ? 'q' : '8'));
            on.forEach((o, i) => { const next = i + 1 < on.length ? on[i + 1].k : 3; grp.push(hitNote(VF, o, next - o.k === 2 ? 'q' : '8', beatAt + o.k / 3, (next - o.k) / 3, up)); });
            list.push(...grp); list.__tuplets = (list.__tuplets || []).concat([grp]); continue;
          }
          if (on[0].k > 0) list.push(rest(VF, on[0].k * d, beatAt, up));
          on.forEach((o, i) => { const next = i + 1 < on.length ? on[i + 1].k : per; list.push(hitNote(VF, o, codeOf((next - o.k) * d), beatAt + o.k * d, (next - o.k) * d, up)); });
        }
        measures.push(list);
      }
      return measures;
    };
    return { up: make(true), down: make(false) };
  }
  function rest(VF, d, at, up, code) {
    const c = code || codeOf(d);
    const n = new VF.StaveNote({ keys: [up ? 'b/4' : 'e/4'], duration: c.replace('d', '') + 'r', clef: 'percussion', stem_direction: up ? 1 : -1 });
    if (c.endsWith('d')) try { VF.Dot.buildAndAttach([n], { all: true }); } catch (e) { /* ignore */ }
    n.__at = at; n.__d = d; n.__rest = true; return n;
  }
  function hitNote(VF, o, code, at, d, up) {
    const hs = o.hs.slice().sort((a, b) => STEP[a.k] - STEP[b.k]);
    const n = new VF.StaveNote({ keys: hs.map(x => POS[x.k]), duration: code.replace('d', ''), clef: 'percussion', stem_direction: up ? 1 : -1 });
    if (code.endsWith('d')) try { VF.Dot.buildAndAttach([n], { all: true }); } catch (e) { /* ignore */ }
    if (hs.some(x => x.acc)) try { n.addModifier(new VF.Articulation('a>').setPosition(up ? VF.Modifier.Position.ABOVE : VF.Modifier.Position.BELOW), 0); } catch (e) { /* ignore */ }
    hs.forEach((x, i) => { if (x.ghost) { try { if (VF.Parenthesis) { n.addModifier(new VF.Parenthesis(VF.Modifier.Position.LEFT), i); n.addModifier(new VF.Parenthesis(VF.Modifier.Position.RIGHT), i); } else n.setKeyStyle(i, { fillStyle: '#9a948a', strokeStyle: '#9a948a' }); } catch (e) { /* ignore */ } } });   /* 고스트 노트인 음에만 괄호 */
    if (hs.some(x => x.k === 'hatopen')) try { n.addModifier(new VF.Annotation('o').setFont('Arial', 9).setVerticalJustification(VF.Annotation.VerticalJustify.TOP), 0); } catch (e) { /* ignore */ }
    n.__at = at; n.__d = d; n.__st = o.s.st; n.__ghost = hs.some(x => x.ghost); n.__steps = hs.map(x => STEP[x.k]); return n;
  }

  function sheet(spec) {
    const VF = window.Vex && window.Vex.Flow ? window.Vex.Flow : null; if (!VF) return null;
    try {
      const pref = spec.pref || 'sharp';
      let staffs;                                     /* [{clef, measures:[[notes]], annot:{above, below}}] */
      if (spec.kind === 'drum') {
        const v = drumVoices(VF, spec.slots || []);
        staffs = [{ clef: 'percussion', voices: spec.handsOnly ? [v.up] : [v.up, v.down], sticking: true }];
      } else if (spec.kind === 'grand') {
        staffs = [{ clef: 'treble', voices: [lineVoice(VF, spec.rh || [], { clef: 'treble', pref })] }, { clef: 'bass', voices: [lineVoice(VF, spec.lh || [], { clef: 'bass', pref })] }];
      } else {
        const clef = spec.clef || 'treble'; const vclef = clef === 'bass' ? 'bass' : 'treble';
        staffs = [{ clef: vclef, anno: clef === 'treble8vb' ? '8vb' : null, voices: [lineVoice(VF, spec.events || [], { clef: vclef, pref, written: (spec.written || 0) })] }];
      }
      const nMeasures = Math.max(...staffs.map(s => Math.max(...s.voices.map(v => v.length))));
      /* 마디 너비: 한 마디 안에서 음표가 놓이는 서로 다른 시각의 수로 */
      let dense = 1;
      for (let mi = 0; mi < 64; mi++) { const ats = new Set(), ghosts = new Set(); staffs.forEach(s => s.voices.forEach(v => (v[mi] || []).forEach(n => { ats.add(Math.round(n.__at * 1000)); if (n.__ghost) ghosts.add(Math.round(n.__at * 1000)); }))); dense = Math.max(dense, ats.size + ghosts.size * 0.4); }   /* 고스트 노트 괄호는 자리를 더 차지한다 */
      const MW = Math.max(200, Math.min(620, 90 + dense * (spec.kind === 'drum' ? 27 : 24))), CLEF = 46;
      const W = Math.max(spec.width || 700, 480);
      const perLine = Math.max(1, Math.min(4, Math.floor((W - CLEF - 20) / MW)));
      const lineCount = Math.ceil(nMeasures / perLine);
      const totalW = Math.min(nMeasures, perLine) * MW + CLEF + 22;
      /* 줄마다 보표 위아래 여백 */
      const lines = [];
      for (let li = 0; li < lineCount; li++) {
        const ss = staffs.map(s => {
          const [topL, botL] = CLEF_LINES[s.clef] || CLEF_LINES.treble;
          let hi = topL, lo = botL, hasFg = false, hasLy = false, hasSt = false;
          s.voices.forEach(v => v.slice(li * perLine, (li + 1) * perLine).forEach(m => m.forEach(n => { (n.__steps || []).forEach(st => { hi = Math.max(hi, st); lo = Math.min(lo, st); }); if (n.__fg != null && n.__fg !== '') hasFg = true; if (n.__lyric) hasLy = true; if (n.__st) hasSt = true; })));
          const above = (hi - topL) * 5, below = (botL - lo) * 5;
          const drum = s.clef === 'percussion';                  /* 드럼은 위 기둥 · 아래 기둥이 보표 밖으로 나간다 */
          const tupDown = drum && s.voices.length > 1 && s.voices[1].slice(li * perLine, (li + 1) * perLine).some(m => m.__tuplets && m.__tuplets.length) ? 24 : 0;   /* 발(아래 기둥)의 셋잇단 괄호 · 3 자리 */
          return { padTop: Math.max(24, above + 14) + (drum ? 44 : 12) + (hasFg ? 16 : 0), padBottom: Math.max(22, below + 20) + (drum ? 34 : 6) + tupDown + (hasLy ? 18 : 0) + (hasSt ? 20 : 0), above: above + (drum ? 40 : 8), below: below + (drum ? 32 : 4) + tupDown, hasFg, hasLy, hasSt };
        });
        lines.push(ss);
      }
      const div = document.createElement('div'); div.className = 'staff-box sheet';
      const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
      let y = 6; const gapStaff = 14;
      lines.forEach(ss => { ss.forEach((L, k) => { L.top = y + L.padTop; y += L.padTop + 40 + L.padBottom + (k < ss.length - 1 ? gapStaff : 0); }); y += 8; });
      renderer.resize(totalW, y + 4);
      const ctx = renderer.getContext();
      const svg = div.querySelector('svg');
      const drawn = [];                                /* {n, stave, staffIdx, line} */
      const texts = [];
      for (let mi = 0; mi < nMeasures; mi++) {
        const line = Math.floor(mi / perLine), col = mi % perLine;
        const x = 10 + (col === 0 ? 0 : CLEF + col * MW), w = MW + (col === 0 ? CLEF : 0);
        const staves = staffs.map((s, k) => {
          const L = lines[line][k];
          const st = new VF.Stave(x, L.top - 40, w);
          if (col === 0) { st.addClef(s.clef, 'default', s.anno || undefined); if (mi === 0) st.addTimeSignature('4/4'); }
          else st.setNoteStartX(st.getNoteStartX() + 10);   /* 마디 첫 음이 마디줄에 붙지 않게 */
          if (mi === 0) st.setBegBarType(VF.Barline.type.REPEAT_BEGIN);
          if (mi === nMeasures - 1) st.setEndBarType(VF.Barline.type.REPEAT_END);
          st.setContext(ctx).draw();
          return st;
        });
        if (col === 0 && staves.length > 1) {
          try { new VF.StaveConnector(staves[0], staves[staves.length - 1]).setType(VF.StaveConnector.type.BRACE).setContext(ctx).draw(); new VF.StaveConnector(staves[0], staves[staves.length - 1]).setType(VF.StaveConnector.type.SINGLE_LEFT).setContext(ctx).draw(); } catch (e) { /* ignore */ }
        }
        if (staves.length > 1) try { new VF.StaveConnector(staves[0], staves[staves.length - 1]).setType(VF.StaveConnector.type.SINGLE_RIGHT).setContext(ctx).draw(); } catch (e) { /* ignore */ }
        const allVoices = [];
        staffs.forEach((s, k) => s.voices.forEach(v => {
          const notes = v[mi] || [];
          if (!notes.length) return;
          /* 셋잇단 묶음: 음표 길이가 바뀌므로 목소리에 넣기 전에 만든다 (뒤에 만들면 두 목소리의 박 위치가 어긋난다) */
          const tuplets = (v[mi] && v[mi].__tuplets) || [];
          const trips = tuplets.length ? tuplets : groupTriplets(notes);
          const tupletObjs = trips.map(g => { try { const down = g[0].getStemDirection && g[0].getStemDirection() < 0; return new VF.Tuplet(g, { num_notes: 3, notes_occupied: 2, bracketed: g.some(n => n.__rest) || g.length < 3, ratioed: false, location: down ? -1 : 1 }); } catch (e) { return null; } }).filter(Boolean);
          const voice = new VF.Voice({ num_beats: 4, beat_value: 4 }).setStrict(false);
          voice.addTickables(notes);
          allVoices.push({ voice, notes, stave: staves[k], k, tupletObjs });
        }));
        const fmt = new VF.Formatter();
        staffs.forEach((s, k) => { const vs = allVoices.filter(a => a.k === k).map(a => a.voice); if (vs.length) fmt.joinVoices(vs); });
        const width = staves[0].getNoteEndX() - staves[0].getNoteStartX() - 14;
        if (allVoices.length) fmt.format(allVoices.map(a => a.voice), width);
        allVoices.forEach(av => {
          const beams = beamsFor(VF, av.notes);
          av.voice.draw(ctx, av.stave);
          beams.forEach(b => b.setContext(ctx).draw());
          av.tupletObjs.forEach(t => t.setContext(ctx).draw());
          av.notes.forEach(n => drawn.push({ n, stave: av.stave, k: av.k, line }));
        });
      }
      /* 운지 (위) · 가사 (아래) · 스티킹 (아래) */
      const stDone = new Set();                        /* 손 · 발이 같은 칸이면 스티킹은 한 번만 */
      drawn.forEach(({ n, stave, k, line }) => {
        if (n.__rest && !n.__fg) return;
        const L = lines[line][k]; let cx = n.getAbsoluteX() + 5; try { const b = n.getNoteHeadBeginX(), e = n.getNoteHeadEndX(); if (isFinite(b) && isFinite(e) && e > b) cx = (b + e) / 2; } catch (err) { /* 음표 머리 가운데 (임시표가 있어도) */ }
        if (n.__fg != null && n.__fg !== '') texts.push(txt(svg, spec.chordAbove ? cx - 4 : cx, stave.getYForLine(0) - L.above - 14, n.__fg, spec.chordAbove ? 'sheet-ch' : 'sheet-fg'));
        if (n.__rest) return;
        let yb = stave.getYForLine(4) + L.below + 18;
        if (n.__lyric) { texts.push(txt(svg, cx, yb, n.__lyric, 'sheet-ly')); yb += 18; }
        if (n.__st && !stDone.has(k + ':' + Math.round(n.__at * 1000))) { stDone.add(k + ':' + Math.round(n.__at * 1000)); texts.push(txt(svg, cx, yb, n.__st, 'sheet-st')); }
      });
      if (spec.chordAbove) texts.forEach(t => { if (t && t.getAttribute('class') === 'sheet-ch') t.setAttribute('text-anchor', 'start'); });
      if (svg) {
        svg.setAttribute('viewBox', '0 0 ' + totalW + ' ' + (y + 4));
        svg.style.width = '100%'; svg.style.height = 'auto'; svg.style.maxWidth = Math.round(totalW * 1.25) + 'px';
      }
      /* 연주 중 표시: 같은 시각(at)에 시작하는 음표 */
      const byAt = new Map();
      drawn.forEach(({ n }) => {
        if (n.__rest) return;
        const el = noteEl(div, n); if (!el) return;
        const key = Math.round(n.__at * 1000);
        if (!byAt.has(key)) byAt.set(key, []);
        byAt.get(key).push(el);
      });
      let cur = [];
      return {
        el: div,
        /* 적힌 음 (점검용): 시각 · 보표 · VexFlow 키 */
        notes: drawn.filter(x => !x.n.__rest).map(({ n, k }) => ({ at: n.__at, staff: k, keys: n.getKeys ? n.getKeys() : [] })),
        highlight(at) {
          cur.forEach(e => e.classList.remove('cur')); cur = [];
          if (at == null || at < 0) return;
          cur = byAt.get(Math.round(at * 1000)) || [];
          cur.forEach(e => e.classList.add('cur'));
        }
      };
    } catch (e) {
      console.warn('연습 악보 렌더링 실패', e);
      return null;
    }
  }
  function groupTriplets(notes) {
    const out = []; let i = 0;
    while (i < notes.length) {
      if (isTrip(notes[i].__d)) {
        const g = [notes[i]]; let sum = notes[i].__d; let j = i + 1;
        while (j < notes.length && sum < 1 - EPS && isTrip(notes[j].__d)) { g.push(notes[j]); sum += notes[j].__d; j++; }
        if (Math.abs(sum - 1) < EPS) out.push(g);
        i = j;
      } else i++;
    }
    return out;
  }
  /* 박 단위로 꼬리를 잇는다 (8분 · 16분 · 셋잇단) */
  function beamsFor(VF, notes) {
    const groups = new Map();
    notes.forEach(n => {
      if (n.__rest || n.__d >= 1 - EPS || /^(q|4|h|2|w|1)$/.test(n.getDuration ? n.getDuration() : '')) return;   /* 4분음표(셋잇단 4분 포함)는 빔을 걸지 않는다 */
      const b = Math.floor(n.__at + EPS);
      if (!groups.has(b)) groups.set(b, []);
      groups.get(b).push(n);
    });
    const out = [];
    groups.forEach(g => { if (g.length >= 2) { try { out.push(new VF.Beam(g)); } catch (e) { /* ignore */ } } });
    return out;
  }
  function noteEl(div, n) {
    try { const e = n.getAttribute && n.getAttribute('el'); if (e && e.classList) return e; } catch (e) { /* ignore */ }
    try { const id = n.getAttribute('id'); return div.querySelector('#vf-' + id) || div.querySelector('[id="' + id + '"]'); } catch (e) { return null; }
  }
  function txt(svg, x, y, s, cls) {
    if (!svg) return null;
    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('class', cls); t.setAttribute('text-anchor', 'middle');
    t.textContent = s; svg.appendChild(t); return t;
  }
  GH.render.sheet = sheet;
})();
