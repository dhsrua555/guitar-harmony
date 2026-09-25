/* 기타 › 트라이어드 · 아르페지오 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, select, chips } = GH.ui; const N = GH.notes;
  const state = { pos: 0, labelMode: 'iv' };
  GH.pages['/guitar/triads'] = {
    title: '트라이어드 · 아르페지오',
    staff: true,
    render(el, params) {
      const A = GH.app; const qy = params.query || {}; const st = GH.state.get();
      const root = N.parseNote(qy.root) ? N.normalize(qy.root) : A.key();
      const triadQuality = GH.chords.getQuality(qy.q);
      const q = triadQuality && triadQuality.intervals.length === 3 ? qy.q : 'maj';
      const arpQ = GH.chords.getQuality(qy.arpQ) ? qy.arpQ : 'maj7';
      const go = patch => GH.router.go('/guitar/triads', Object.assign({ root, q, arpQ }, patch));
      const pref = A.pref(root);
      el.appendChild(h('h1', null, '트라이어드와 아르페지오'));
      if (GH.instView) el.appendChild(GH.instView.switcher('triads', 'guitar'));
      el.appendChild(h('p', { class: 'muted' }, '현 세트별 트라이어드 인버전은 네오소울, 컴핑, 코드 멜로디의 필수 어휘입니다. 아르페지오는 코드톤을 한 음씩 연주하는 것으로, 릭과 코드를 잇는 다리가 됩니다.'));
      if (!GH.state.isStandardTuning()) el.appendChild(GH.ui.notice('트라이어드 코드 폼은 스탠다드 튜닝 기준입니다. 아래 아르페지오 지판과 포지션은 현재 튜닝(' + GH.state.TUNINGS[st.tuning].label + ')에 맞춰 표시합니다.'));
      const tb = h('div', { class: 'toolbar' },
        h('label', null, '루트', A.rootSelect(root, v => go({ root: v }))),
        h('label', null, '트라이어드', A.qualitySelect(q, v => go({ q: v }), quality => quality.intervals.length === 3)),
        h('label', null, '라벨', select({ options: [{ value: 'iv', label: '도수' }, { value: 'name', label: '음이름' }], value: state.labelMode, onChange: v => { state.labelMode = v; GH.router.rerender(); } })));
      el.appendChild(tb);
      const chord = GH.chords.buildChord(root, q);
      el.appendChild(h('div', { class: 'row', style: 'margin-bottom:8px' }, h('span', { class: 'symbol-big' }, chord.symbol), A.chordPills(chord, { name: true }), A.chordPills(chord), A.ivLegend()));
      /* 클로즈 트라이어드 */
      const closed = GH.voicings.generate(root, q, 'triad');
      const bySet = GH.util.groupBy(closed, v => v.strSet);
      const sec = section('클로즈 트라이어드 (현 세트별 인버전)', h('p', { class: 'muted' }, '인접한 3줄에서 기본형, 1전위, 2전위. 같은 줄 세트 안에서 세 폼을 이어서 치면 지판을 따라 올라가는 연습이 됩니다.'));
      ['6-5-4', '5-4-3', '4-3-2', '3-2-1'].forEach(set => {
        const g = (bySet[set] || []).sort((a, b) => a.baseFret - b.baseFret);
        if (!g.length) return;
        sec.appendChild(h('h3', null, set + '번줄'));
        const grid = h('div', { class: 'grid diagrams' });
        g.forEach(v => grid.appendChild(GH.render.chordCard(v, { labelMode: state.labelMode, pref, sub: GH.voicings.INV_KO[v.invIndex] + ' · ' + v.baseFret + 'fr' })));
        sec.appendChild(grid);
        sec.appendChild(h('div', { style: 'margin:4px 0 10px' }, A.playBtn('▶ 이 세트 인버전 순서대로', () => {
          GH.player.playProgression(g.map(v => ({ midi: v.midi.filter(m => m != null), bass: null, beats: 2 })), { tempo: 100, style: 'ballad' });
        })));
      });
      el.appendChild(sec);
      /* 스프레드 */
      const spread = GH.voicings.generate(root, q, 'spread');
      const sp = section('스프레드 (오픈) 트라이어드', h('p', { class: 'muted' }, '가운데 음을 옥타브 내려 넓게 펼친 트라이어드. 줄을 하나 건너뛰어 잡으며, 에릭 존슨과 네오소울 스타일의 맑은 소리가 납니다.'));
      const sgrid = h('div', { class: 'grid diagrams' });
      spread.sort((a, b) => a.baseFret - b.baseFret).slice(0, 18).forEach(v => sgrid.appendChild(GH.render.chordCard(v, { labelMode: state.labelMode, pref, sub: v.strSet + '줄 · ' + GH.voicings.INV_KO[v.invIndex] })));
      sp.appendChild(sgrid);
      el.appendChild(sp);
      /* 아르페지오 */
      const arp = GH.chords.buildChord(root, arpQ);
      const pcMap = {}; arp.notes.forEach(n => { pcMap[n.pc] = { label: n.iv, cls: n.cls }; });
      const relScale = (GH.scales.forChord(arpQ)[0] || { scale: GH.scales.get('ionian') }).scale;
      const positionScale = relScale.intervals.length === 7 ? relScale.id : 'ionian';
      const tuning = GH.state.tuningMidi();
      const cagedWindows = GH.positions.supportsCaged(tuning);
      const windows = cagedWindows ? GH.positions.caged(arp.rootPc, positionScale, tuning) : GH.positions.npsPositions(arp.rootPc, positionScale, 3, tuning);
      if (state.pos > windows.length) state.pos = 0;
      const posChips = chips({ options: [{ value: 0, label: '지판 전체' }].concat(windows.map((w, i) => ({ value: i + 1, label: w.name }))), value: state.pos, onChange: v => { state.pos = v; GH.router.rerender(); } });
      const win = state.pos ? windows[state.pos - 1] : null;
      const fb = GH.render.fretboard({ pcMap, pref, to: 22, window: win ? [win.lo, win.hi] : null, filter: win ? (s, f) => (f >= win.lo && f <= win.hi) ? null : 'dim' : null });
      const arpSec = section('아르페지오 (코드톤 포지션)',
        h('p', { class: 'muted' }, '세븐 코드의 코드톤을 지판 전체에 표시합니다. ' + (cagedWindows ? 'CAGED 포지션' : '튜닝에 맞춘 3NPS(줄당 3음) 포지션') + '를 고르면 그 포지션의 아르페지오만 남습니다. 코드 위에서 아르페지오만으로 솔로해 보면 코드톤의 위치가 손에 익습니다.'),
        h('div', { class: 'toolbar' }, h('label', null, '코드', A.qualitySelect(arpQ, v => { state.pos = 0; go({ arpQ: v }); })), h('span', { class: 'symbol-big', style: 'font-size:1.3rem' }, arp.symbol),
          A.playBtn('▶ 아르페지오 듣기', () => {
            const base = 48 + arp.rootPc;
            const playablePosition = win ? win.notes.filter(n => pcMap[n.pc] && n.f >= (Number(st.capo) || 0)) : [];
            const notes = win ? playablePosition.map(n => n.midi) : arp.notes.map(n => base + N.mod(n.pc - arp.rootPc, 12)).concat([base + 12]);
            const asc = notes.slice().sort((a, b) => a - b);
            GH.player.playNotes(asc.concat(asc.slice(0, -1).reverse()), { tempo: 180, onNote: (i, m) => { if (win && i >= 0) { const seq = asc.concat(asc.slice(0, -1).reverse()); const target = playablePosition.find(n => n.midi === seq[i]); fb.highlight(target ? target.s : null, target ? target.f : null); } else fb.highlight(null); } });
          }, 'primary'), A.stopBtn()),
        posChips, fb.el, h('div', { style: 'margin-top:6px' }, A.ivLegend()));
      el.appendChild(arpSec);
      el.appendChild(GH.ui.callout('연습 아이디어: ii-V-I 진행에서 각 코드의 아르페지오를 한 포지션 안에서만 연주해 보세요. 코드가 바뀔 때 가장 가까운 코드톤으로 이동하는 습관이 보이스 리딩 감각을 만듭니다.'));
    }
  };
})();
