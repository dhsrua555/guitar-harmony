/* 리듬 표시: VexFlow 타악기 보표 + 타임라인 (탭 결과 표시용) */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h } = GH.ui;
  GH.render = GH.render || {};
  const vf = () => (GH.render.vexflow ? GH.render.vexflow() : (window.Vex && window.Vex.Flow ? window.Vex.Flow : null));

  /* events: GH.rhythm.parse 결과. opts: {width, time(박자표 표시), height}. 반환 {el, setCurrent(i)} 또는 null */
  function rhythmStaff(events, opts) {
    const VF = vf(); if (!VF) return null;
    opts = opts || {};
    try {
      const { Renderer, Stave, StaveNote, Voice, Formatter, Beam, Dot, Tuplet, Fraction } = VF;
      const W = opts.width || 420, H = opts.height || 96;
      const div = document.createElement('div'); div.className = 'rhythm-staff';
      const r = new Renderer(div, Renderer.Backends.SVG); r.resize(W, H);
      const ctx = r.getContext();
      const stave = new Stave(4, Math.max(0, (H - 90) / 2), W - 8);
      if (opts.time !== false) { stave.addClef('percussion'); if (GH.render.addTime) GH.render.addTime(VF, stave); else stave.addTimeSignature('4/4'); }
      stave.setContext(ctx).draw();
      const notes = events.map(e => {
        const n = new StaveNote({ keys: ['b/4'], duration: e.vf + (e.rest ? 'r' : ''), clef: 'percussion', auto_stem: false, stem_direction: 1 });
        if (e.dot) { try { Dot.buildAndAttach([n], { all: true }); } catch (err) { /* ignore */ } }
        return n;
      });
      const tuplets = [];
      for (let i = 0; i < events.length; i++) if (events[i].trip && events[i + 1] && events[i + 1].trip && events[i + 2] && events[i + 2].trip) { tuplets.push(new Tuplet(notes.slice(i, i + 3))); i += 2; }
      const voice = new Voice({ num_beats: 4, beat_value: 4 }).setStrict(false); voice.addTickables(notes);
      const beams = Beam.generateBeams(notes, { groups: [new Fraction(1, 4)], beam_rests: false, stem_direction: 1 });
      new Formatter().joinVoices([voice]).format([voice], stave.getNoteEndX() - stave.getNoteStartX() - 12);
      voice.draw(ctx, stave);
      beams.forEach(b => b.setContext(ctx).draw());
      tuplets.forEach(t => t.setContext(ctx).draw());
      const els = notes.map(n => { try { return n.getSVGElement ? n.getSVGElement() : null; } catch (err) { return null; } });
      let cur = -1;
      return { el: div, setCurrent(i) { if (els[cur]) els[cur].classList.remove('current'); cur = i; if (els[cur]) els[cur].classList.add('current'); } };
    } catch (e) { console.warn('리듬 보표 실패', e); return null; }
  }

  /* 타임라인: 한 마디를 가로 막대로, 음마다 칸. 반환 {el, setCurrent(i), grade(items, taps, start, spb, bars), reset()} */
  function rhythmTimeline(events, opts) {
    opts = opts || {};
    const total = events.total || 4;
    const el = h('div', { class: 'rhythm-line' + (opts.small ? ' small' : ''), 'aria-hidden': 'true' });
    for (let b = 1; b < total; b++) el.appendChild(h('span', { class: 'rl-beat', style: 'left:' + (b / total * 100) + '%' }));
    const cells = events.map((e, i) => {
      const c = h('span', { class: 'rl-note' + (e.rest ? ' rest' : '') + (e.pos % 1 === 0 ? ' on' : ''), style: 'left:' + (e.pos / total * 100) + '%;width:' + (e.d / total * 100) + '%' }, h('i'));
      el.appendChild(c); return c;
    });
    const tapLayer = h('span', { class: 'rl-taps' }); el.appendChild(tapLayer);
    let cur = -1;
    return {
      el,
      setCurrent(i) { if (cells[cur]) cells[cur].classList.remove('current'); cur = i; if (cells[cur]) cells[cur].classList.add('current'); },
      reset() { cells.forEach(c => c.classList.remove('good', 'early', 'late', 'veryEarly', 'veryLate', 'miss', 'current')); GH.ui.clear(tapLayer); },
      /* items: GH.rhythm.score().items (마지막 마디 기준으로 표시), taps: 절대 시각, barStart/spb 로 위치 계산 */
      grade(items, taps, barStart, spb, latency) {
        this.reset();
        items.forEach(it => { if (cells[it.i]) cells[it.i].classList.add(it.grade); });
        taps.forEach(t => { const beat = (t - (latency || 0) - barStart) / spb; if (beat < -0.3 || beat > total + 0.3) return; tapLayer.appendChild(h('span', { class: 'rl-tap', style: 'left:' + Math.max(0, Math.min(100, beat / total * 100)) + '%' })); });
      }
    };
  }
  /* 문제 보기용 작은 리듬: 오선이 있으면 오선, 없으면 타임라인 */
  function rhythmMini(p) {
    const ev = GH.rhythm.parse(p);
    const st = rhythmStaff(ev, { width: 250, height: 80, time: false });
    return st ? st.el : rhythmTimeline(ev, { small: true }).el;
  }
  GH.render.rhythmStaff = rhythmStaff;
  GH.render.rhythmTimeline = rhythmTimeline;
  GH.render.rhythmMini = rhythmMini;
})();
