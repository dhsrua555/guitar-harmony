/* 기타 › 스케일 포지션 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, select, chips, kv } = GH.ui; const N = GH.notes;
  const state = { scale: 'minor_pent', system: null, pos: 0, pattern: 'ascdesc', tempo: 140, showChordTones: false };

  /* 같은 음고의 여러 핑거링을 하나로 정리한 뒤, 루트에서 다음 루트까지만 반환한다. */
  function oneOctave(notes, rootPc, scale) {
    const byMidi = new Map();
    notes.slice().sort((a, b) => a.midi - b.midi || a.f - b.f || b.s - a.s).forEach(note => {
      if (!byMidi.has(note.midi)) byMidi.set(note.midi, note);
    });
    const semis = Array.from(new Set(scale.intervals.map(N.ivSemi).map(semi => N.mod(semi, 12)))).sort((a, b) => a - b);
    const roots = Array.from(byMidi.values()).filter(note => note.pc === rootPc).sort((a, b) => a.midi - b.midi);
    for (const root of roots) {
      const sequence = semis.concat([12]).map(semi => byMidi.get(root.midi + semi));
      if (sequence.every(Boolean)) return sequence;
    }
    return [];
  }

  GH.pages['/guitar/scales'] = {
    title: '스케일 포지션',
    render(el, params) {
      const A = GH.app; const qy = params.query || {}; const st = GH.state.get();
      const root = qy.root || A.key(); const pref = A.pref(root); const rootPc = N.pcOf(root);
      if (qy.scale && GH.scales.get(qy.scale)) state.scale = qy.scale;
      const sc = GH.scales.get(state.scale);
      const tuning = GH.state.tuningMidi();
      const cagedAvailable = GH.positions.supportsCaged(tuning);
      const systems = GH.positions.systemsFor(sc.id, tuning);
      if (!systems.some(s => s.id === state.system)) state.system = systems[0].id;
      const positions = GH.positions.positions(rootPc, sc.id, state.system, tuning);
      if (state.pos > positions.length) state.pos = 0;
      el.appendChild(h('h1', null, '스케일 포지션'));
      el.appendChild(h('p', { class: 'muted' }, '키와 스케일을 고르면 지판 전체와 포지션별 박스가 나옵니다. 포지션 시스템은 스케일과 현재 튜닝에 맞게 CAGED, 3NPS, 펜타토닉 박스 중에서 고를 수 있습니다.'));
      const tb = h('div', { class: 'toolbar' },
        h('label', null, '루트', A.rootSelect(root, v => GH.router.go('/guitar/scales', { root: v, scale: state.scale }))),
        h('label', null, '스케일', A.scaleSelect(state.scale, v => { state.scale = v; state.pos = 0; GH.router.go('/guitar/scales', { root, scale: v }); })),
        h('label', null, '시스템', select({ options: systems.map(s => ({ value: s.id, label: s.label })), value: state.system, onChange: v => { state.system = v; state.pos = 0; GH.router.rerender(); } })),
        h('label', null, '라벨', select({ options: [{ value: 'degree', label: '도수' }, { value: 'name', label: '음이름' }], value: st.labelMode, onChange: v => GH.state.set({ labelMode: v }) })),
        h('label', null, h('input', { type: 'checkbox', checked: state.showChordTones, onchange: e => { state.showChordTones = e.target.checked; GH.router.rerender(); } }), '코드톤 강조'));
      el.appendChild(tb);
      if (sc.intervals.length === 7 && !cagedAvailable) el.appendChild(GH.ui.notice('현재 튜닝은 줄 간격이 스탠다드와 달라 CAGED 폼을 정확히 적용할 수 없습니다. 3NPS 또는 지판 전체를 사용하세요.'));
      /* 스케일 정보 */
      const notes = GH.scales.notes(root, sc.id);
      const chordsFit = sc.chords.map(q => GH.chords.getQuality(q)).filter(Boolean);
      el.appendChild(h('div', { class: 'card' },
        h('div', { class: 'row' }, h('span', { class: 'symbol-big', style: 'font-size:1.4rem' }, N.pretty(root) + ' ' + sc.ko), h('span', { class: 'muted' }, sc.en)),
        h('div', { class: 'row', style: 'margin:6px 0' }, GH.ui.pills(notes.map(n => ({ label: N.pretty(n.name), cls: n.cls, title: n.label }))), GH.ui.pills(notes.map(n => ({ label: n.label, cls: n.cls })))),
        kv([['공식', GH.scales.formula(sc.id).join(' – ')], ['특징음', sc.characteristic.length ? sc.characteristic.join(', ') : '–'], ['주로 사용하는 코드', h('span', null, chordsFit.map(q => h('a', { href: A.voicingsHref(root, q.id), style: 'margin-right:8px' }, GH.chords.symbol(root, q.id))))], ['용도', sc.usage]]),
        h('p', { class: 'muted', style: 'margin:.4em 0 0' }, sc.desc),
        h('div', { class: 'row', style: 'margin-top:6px' }, h('a', { class: 'btn small', href: A.theoryScaleHref(sc.id, root) }, '이론 페이지 →'), sc.parent !== sc.id || ['ionian', 'melodic_minor', 'harmonic_minor'].includes(sc.parent) ? h('a', { class: 'btn small', href: A.modeHref(sc.id, root) }, '모드 페이지 →') : null)));
      /* 포지션 선택 */
      const posChips = chips({ options: [{ value: 0, label: '전체' }].concat(positions.map((p, i) => ({ value: i + 1, label: p.name }))), value: state.pos, onChange: v => { state.pos = v; GH.router.rerender(); } });
      el.appendChild(h('div', { style: 'margin:12px 0 6px' }, posChips));
      const P = state.pos ? positions[state.pos - 1] : null;
      const lm = GH.scales.labelMap(rootPc, sc.id);
      const chordPcs = state.showChordTones ? new Set((chordsFit[0] ? GH.chords.chordPcs(rootPc, chordsFit[0].id) : [])) : null;
      const pcMap = {};
      Object.keys(lm).forEach(pc => { const iv = lm[pc]; pcMap[pc] = { label: iv, cls: chordPcs ? (chordPcs.has(Number(pc)) ? N.ivClass(iv) : 'iv-x') : N.ivClass(iv) }; });
      const inPos = P ? new Set(P.notes.map(n => n.s + ':' + n.f)) : null;
      const fb = GH.render.fretboard({ pcMap, pref, to: 22, capo: st.capo, window: P ? [P.lo, P.hi] : null, filter: P ? (s, f) => inPos.has(s + ':' + f) ? null : 'dim' : null });
      el.appendChild(fb.el);
      el.appendChild(h('div', { style: 'margin-top:6px' }, A.ivLegend()));
      /* 포지션 박스 */
      if (P) {
        const lo = Math.max(0, P.lo - 1), hi = P.hi + 1;
        const box = GH.render.fretboard({ notes: P.notes.map(n => ({ s: n.s, f: n.f, label: n.label, cls: chordPcs ? (chordPcs.has(n.pc) ? N.ivClass(n.label) : 'iv-x') : N.ivClass(n.label) })), pref, from: lo, to: hi, showStringNames: true });
        el.appendChild(section(P.name + ' 박스', h('div', { style: 'max-width:520px' }, box.el),
          h('p', { class: 'muted' }, '루트(빨강)의 위치를 먼저 외우고, 옆 포지션과 겹치는 음으로 이동합니다. ' + (state.system === 'caged' ? 'CAGED 포지션은 같은 이름의 코드 폼과 겹칩니다.' : state.system === '3nps' ? '한 줄에 세 음이라 손가락 패턴이 규칙적입니다.' : '한 줄에 두 음. 박스 1은 루트가 6번줄에 있는 모양입니다.'))));
      }
      /* 재생 */
      const capo = Math.max(0, Number(st.capo) || 0);
      const playableNotes = (P ? P.notes : GH.positions.inWindow(rootPc, sc.id, 0, 15)).filter(note => note.f >= capo);
      const seqNotes = oneOctave(playableNotes, rootPc, sc);
      const seq = GH.positions.pattern(seqNotes, state.pattern);
      const playButton = A.playBtn('▶ 재생', () => {
        if (!seq.length) return;
        GH.player.playNotes(seq.map(n => n.midi), { tempo: state.tempo, onNote: i => { const n = seq[i]; fb.highlight(n ? n.s : null, n ? n.f : null); } });
      }, 'primary');
      playButton.disabled = !seq.length;
      el.appendChild(section('연습 패턴 재생',
        h('div', { class: 'toolbar' },
          h('label', null, '패턴', select({ options: [{ value: 'asc', label: '상행' }, { value: 'desc', label: '하행' }, { value: 'ascdesc', label: '상행 후 하행' }, { value: 'thirds', label: '3도 시퀀스' }, { value: 'fours', label: '4음 그룹' }, { value: 'triads', label: '트라이어드 시퀀스' }], value: state.pattern, onChange: v => { state.pattern = v; GH.router.rerender(); } })),
          h('label', null, '템포', h('input', { type: 'range', min: 60, max: 240, value: state.tempo, oninput: e => { state.tempo = Number(e.target.value); e.target.nextSibling.textContent = state.tempo; } }), h('span', null, state.tempo)),
          playButton,
          A.playBtn('▶ 백킹 (코드 루프)', () => {
            const q = chordsFit[0] ? chordsFit[0].id : 'maj';
            const v = GH.voicings.representative(root, q);
            GH.player.playProgression([{ midi: v ? v.midi.filter(m => m != null) : [48 + rootPc], bass: 40 + N.mod(rootPc - 4, 12), beats: 4 }], { tempo: Math.min(140, state.tempo), style: /pent|blues/.test(sc.id) ? 'shuffle' : 'soul', loop: true });
          }), A.stopBtn()),
        h('p', { class: 'muted' }, seq.length ? (P ? '선택한 포지션에서 루트부터 한 옥타브를 패턴대로 재생하며 지판에 표시합니다.' : '전체 지판에서 루트부터 한 옥타브를 패턴대로 재생합니다.') : '현재 카포와 포지션 범위에는 완전한 한 옥타브가 없습니다. 다른 포지션을 고르세요.')));
      /* 다른 스케일 빠른 이동 */
      const related = GH.scales.SCALES.filter(s => s.parent === sc.parent && s.id !== sc.id);
      if (related.length) el.appendChild(section('같은 계열의 스케일', h('div', { class: 'toc' }, related.map(s => h('a', { href: A.scaleHref(s.id, root) }, s.ko)))));
    }
  };
})();
