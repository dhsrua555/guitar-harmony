/* 코드 상세 (/chord/:root/:q) 와 코드 파인더 (/tools/finder) */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, table, kv, callout } = GH.ui; const N = GH.notes;
  GH.pages['/chord/:root/:q'] = {
    title: '코드 상세',
    render(el, params) {
      const A = GH.app;
      const root = N.normalize(params.root); const qId = params.q;
      const chord = GH.chords.buildChord(root, qId);
      if (!chord) { el.appendChild(GH.ui.empty('코드를 찾을 수 없습니다.')); return; }
      const pref = A.pref(root); const q = chord.quality;
      el.appendChild(h('div', { class: 'breadcrumb' }, '코드 상세'));
      el.appendChild(h('div', { class: 'row' }, h('h1', { style: 'margin:0' }, chord.symbol), h('span', { class: 'muted' }, q.ko), h('label', { class: 'muted' }, '루트 ', A.rootSelect(root, v => GH.router.go('/chord/' + encodeURIComponent(v) + '/' + qId))), h('label', { class: 'muted' }, '타입 ', A.qualitySelect(qId, v => GH.router.go('/chord/' + encodeURIComponent(root) + '/' + v)))));
      const rep = GH.voicings.representative(root, qId);
      el.appendChild(h('div', { class: 'card', style: 'margin-top:10px' },
        h('div', { class: 'row' }, A.chordPills(chord, { name: true }), A.chordPills(chord), A.playBtn('▶ 듣기', () => GH.player.playChord(rep ? rep.midi.filter(m => m != null) : chord.pcs.map(p => 48 + p), { arpeggio: true }), 'primary')),
        h('p', null, q.desc),
        kv([['인터벌', q.intervals.map(iv => iv + ' (' + N.intervalKo(iv) + ')').join(', ')], ['텐션', q.tensions.join(', ') || '–'], ['어보이드', q.avoid.join(', ') || '없음'], ['다른 이름', GH.chords.identifyAll(chord.pcs, pref).filter(r => !(r.qId === qId && N.pcOf(r.root) === chord.rootPc)).map(r => r.symbol).join(', ') || '없음']])));
      /* 시각 */
      const on = {}; chord.notes.forEach(n => { on[n.pc] = { label: n.iv, cls: n.cls }; });
      el.appendChild(section('구성음', h('div', { class: 'split' }, h('div', null, GH.render.piano({ from: 48, to: 76, on })), h('div', null, GH.render.fretboard({ pcMap: on, pref, to: 22 }).el)), h('div', { style: 'margin-top:6px' }, A.ivLegend())));
      /* 보이싱 */
      const vs = GH.voicings.forChord(root, qId, ['open', 'caged', 'shell', 'jazz', 'drop2']);
      const pick = []; const seenType = {};
      vs.forEach(v => { seenType[v.type] = (seenType[v.type] || 0) + 1; if (seenType[v.type] <= 3 && pick.length < 10) pick.push(v); });
      el.appendChild(section('기타 보이싱', h('div', { class: 'grid diagrams' }, pick.map(v => GH.render.chordCard(v, { pref }))), h('div', { class: 'row' }, h('a', { class: 'btn small', href: A.voicingsHref(root, qId, 'basic') }, '기본 코드 폼 →'), h('a', { class: 'btn small', href: A.voicingsHref(root, qId, 'advanced') }, '재즈·확장 보이싱 →'), h('a', { class: 'btn small', href: '#/guitar/triads?root=' + encodeURIComponent(root) + '&arpQ=' + encodeURIComponent(qId) }, '아르페지오 →'))));
      /* 스케일 */
      const fits = GH.scales.forChord(qId);
      el.appendChild(section('어울리는 스케일', table(['스케일', '특징', '용도', ''], fits.slice(0, 8).map(f => [h('a', { href: A.scaleHref(f.scale.id, root), style: f.primary ? 'font-weight:700' : '' }, N.pretty(root) + ' ' + f.scale.ko), f.scale.characteristic.join(', ') || '–', f.scale.usage, A.playBtn('▶', () => { const base = 48 + chord.rootPc; GH.player.playNotes(f.scale.intervals.map(iv => base + N.ivSemi(iv)).concat([base + 12]), { tempo: 150 }); })]))));
      /* 진행 */
      const key = A.key();
      const inKey = []; const sameQ = [];
      GH.data.progressions.forEach(p => {
        const chords = A.progressionChords(p, key);
        if (chords.some(c => c.qId === qId && c.rootPc === chord.rootPc)) inKey.push(p);
        else if (chords.some(c => c.qId === qId)) sameQ.push(p);
      });
      const deepBox = h('div');
      deepBox.appendChild(section('이 코드가 나오는 진행', inKey.length ? h('div', null, h('p', { class: 'muted' }, '현재 키 ' + N.pretty(key) + ' 에서 ' + chord.symbol + ' 이(가) 그대로 등장하는 진행:'), h('div', { class: 'toc' }, inKey.map(p => h('a', { href: A.progHref(p.id) }, p.ko)))) : h('p', { class: 'muted' }, '현재 키(' + N.pretty(key) + ')에서 이 코드가 그대로 나오는 진행은 없습니다. 상단 키를 바꿔 보세요.'),
        sameQ.length ? h('div', null, h('p', { class: 'muted', style: 'margin-top:8px' }, '같은 타입(' + q.ko + ')이 다른 도수로 나오는 진행:'), h('div', { class: 'toc' }, sameQ.slice(0, 10).map(p => h('a', { href: A.progHref(p.id) }, p.ko)))) : null));
      /* 릭 */
      const licks = GH.data.licks.filter(l => (l.qIds || []).includes(qId));
      deepBox.appendChild(section('이 코드 퀄리티 위에서 쓰는 릭', licks.length ? h('div', { class: 'list' }, licks.map(l => h('a', { class: 'list-item', href: A.lickHref(l.id), style: 'color:inherit' }, GH.ui.difficulty(l.difficulty), h('div', null, h('div', { class: 'title' }, l.ko), h('div', { class: 'desc' }, '원래 키 ' + N.pretty(l.key) + ' · ' + l.over + ' · ' + GH.data.lickGenres[l.genre] + ' — 릭 페이지에서 ' + N.pretty(root) + '으로 트랜스포즈할 수 있습니다.'))))) : GH.ui.empty('아직 이 퀄리티의 릭이 없습니다.')));
      /* 리하모니 */
      const ideas = { dominant: ['tritone_sub', 'secondary_dominant', 'related_ii', 'tension', 'backdoor'], major: ['diatonic_sub', 'quality_change', 'modal_interchange', 'constant_structure'], minor: ['diatonic_sub', 'related_ii', 'quality_change', 'modal_interchange'], diminished: ['dim_passing', 'secondary_dominant'], augmented: ['quality_change', 'tension'], sus: ['quality_change', 'pedal_point'] }[q.family] || [];
      deepBox.appendChild(section('리하모니 아이디어', h('div', { class: 'toc' }, ideas.map(id => { const r = GH.data.reharm.find(x => x.id === id); return r ? h('a', { href: A.reharmHref(id) }, r.ko) : null; }))));
      el.appendChild(A.deep('더 깊이: 이 코드가 나오는 진행, 릭, 리하모니 아이디어', deepBox));
      el.appendChild(h('div', { class: 'toc' }, h('a', { href: '#/theory/chords?q=' + qId + '&root=' + encodeURIComponent(root) }, '코드 화성학 →'), h('a', { href: A.backingHref(null, root) + '&chords=' + encodeURIComponent(chord.symbol) }, '이 코드로 백킹 트랙 만들기 →')));
    }
  };

  /* ---- 코드 파인더 ---- */
  const finder = { frets: [null, null, null, null, null, null] };
  GH.pages['/tools/finder'] = {
    title: '코드 파인더',
    render(el) {
      const A = GH.app; const pref = A.pref(); const tuning = GH.state.tuningMidi(); const capo = Number(GH.state.get().capo) || 0;
      if (capo) finder.frets = finder.frets.map(f => f != null && f < capo ? null : f);
      el.appendChild(h('h1', null, '코드 파인더'));
      el.appendChild(h('p', { class: 'muted' }, '지판을 눌러 잡은 모양의 코드 이름을 찾습니다. 같은 줄을 다시 누르면 지웁니다. ' + (capo ? '현재 카포 ' + capo + '프렛 기준이며, 개방현은 카포 프렛을 누르세요.' : '개방현은 0프렛 자리(너트 왼쪽)를 누르세요.')));
      const notes = finder.frets.map((f, i) => f == null ? null : { s: 6 - i, f, label: N.noteName((tuning[i] + f) % 12, pref), cls: 'iv-1' }).filter(Boolean);
      const fb = GH.render.fretboard({ notes, pref, to: 22, labelMode: 'name', onClick: (s, f) => { const i = 6 - s; finder.frets[i] = finder.frets[i] === f ? null : f; GH.router.rerender(); } });
      el.appendChild(fb.el);
      const played = finder.frets.filter(f => f != null);
      el.appendChild(h('div', { class: 'row', style: 'margin:10px 0' }, A.playBtn('▶ 듣기', () => GH.player.playChord(finder.frets.map((f, i) => f == null ? null : tuning[i] + f).filter(m => m != null))), A.playBtn('지우기', () => { finder.frets = [null, null, null, null, null, null]; GH.router.rerender(); })));
      if (played.length < 2) { el.appendChild(GH.ui.empty('두 음 이상 눌러 주세요.')); return; }
      const res = GH.voicings.identifyFrets(finder.frets, pref, tuning);
      const midis = finder.frets.map((f, i) => f == null ? null : tuning[i] + f).filter(m => m != null);
      el.appendChild(h('p', null, '누른 음: ', midis.map(m => N.pretty(N.midiName(m, pref))).join(', ')));
      if (!res.length) {
        el.appendChild(GH.ui.notice('정확히 일치하는 코드 이름이 없습니다. 음을 하나 빼거나 더해 보세요. 부분 집합으로 볼 수 있는 코드를 아래에 표시합니다.'));
        const pcs = [...new Set(midis.map(m => m % 12))];
        const partial = [];
        for (let r = 0; r < 12; r++) GH.chords.QUALITIES.forEach(q => { const cp = GH.chords.chordPcs(r, q.id); if (pcs.every(p => cp.includes(p)) && q.intervals.length <= pcs.length + 2) partial.push({ root: N.noteName(r, pref), qId: q.id, symbol: GH.chords.symbol(N.noteName(r, pref), q.id), missing: q.intervals.length - pcs.length }); });
        partial.sort((a, b) => a.missing - b.missing);
        el.appendChild(table(['코드', '빠진 음 수'], partial.slice(0, 12).map(p => [h('a', { href: A.chordHref(p.root, p.qId) }, p.symbol), p.missing])));
        return;
      }
      const bassPc = Math.min(...midis) % 12;
      el.appendChild(section('가능한 이름', table(['코드', '베이스', '구성음', ''], res.map(r => { const c = GH.chords.buildChord(r.root, r.qId); const inv = c.rootPc === bassPc ? '기본위치' : '/' + N.pretty(N.noteName(bassPc, pref)) + ' (전위)'; return [h('a', { href: A.chordHref(r.root, r.qId), style: 'font-weight:700' }, r.symbol), inv, A.chordPills(c, { name: true }), h('a', { class: 'btn small', href: '#/guitar/voicings' }, '보이싱 →')]; }))));
    }
  };
})();
