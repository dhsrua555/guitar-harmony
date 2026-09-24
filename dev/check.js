/* 자체 점검: 데이터 검증 + 모든 페이지 렌더 스모크 테스트 */
(function () {
  'use strict';
  const out = document.getElementById('out');
  const lines = [];
  let fails = 0;
  const log = s => { lines.push(s); };
  const ok = (cond, msg) => { if (cond) log('OK   ' + msg); else { fails++; log('FAIL ' + msg); } };
  const N = GH.notes;
  try {
    (window.__errors || []).forEach(e => { fails++; log('FAIL script error: ' + e); });
    /* notes */
    ok(N.spell('Bb', 'b3') === 'Db', 'spell Bb b3 = Db (' + N.spell('Bb', 'b3') + ')');
    ok(N.spell('F#', '7') === 'E#', 'spell F# 7 = E# (' + N.spell('F#', '7') + ')');
    ok(N.spell('C', '#11') === 'F#', 'spell C #11 = F#');
    ok(N.spell('A', 'bb7') === 'Gb', 'spell A bb7 = Gb (' + N.spell('A', 'bb7') + ')');
    ok(N.intervalKo('b3') === '마이너 3도' && N.intervalKo('#4') === '어그멘티드 4도' && N.intervalKo('bb7') === '디미니시 7도' && N.intervalKo('1') === '유니즌', 'intervalKo');
    /* chords */
    const c = GH.chords.buildChord('F#', 'm7b5');
    ok(c.notes.map(n => n.name).join(' ') === 'F# A C E', 'F#m7b5 = F# A C E (' + c.notes.map(n => n.name).join(' ') + ')');
    ok(GH.chords.parseSymbol('Bbmaj7/D').qId === 'maj7' && GH.chords.parseSymbol('Bbmaj7/D').bass === 'D', 'parseSymbol Bbmaj7/D');
    ok(GH.chords.parseSymbol('C6/9').qId === '69', 'parseSymbol C6/9');
    ok(GH.chords.parseSymbol('Dm7').qId === 'm7' && GH.chords.parseSymbol('G7#9').qId === '7#9' && GH.chords.parseSymbol('Eø7').qId === 'm7b5', 'parseSymbol variants');
    ok(GH.chords.identify([0, 4, 7, 11])[0] === 'maj7', 'identify maj7');
    ok(GH.chords.QUALITIES.length >= 50 && GH.chords.QUALITIES.every(q => q.category && q.level), 'qualities ' + GH.chords.QUALITIES.length + ' with category/level');
    ok(GH.chords.parseSymbol('Cm13').qId === 'm13' && GH.chords.parseSymbol('G13b9').qId === '13b9' && GH.chords.parseSymbol('Am7add11').qId === 'm7add11' && GH.chords.parseSymbol('E7sus4b9').qId === '7sus4b9', 'parse new qualities');
    (function () { const ids = GH.chords.QUALITIES.map(q => q.id); const dup = ids.filter((x, i) => ids.indexOf(x) !== i); ok(!dup.length, 'no duplicate quality ids ' + dup.join(',')); const keys = {}; let clash = []; GH.chords.QUALITIES.forEach(q => { const k = q.intervals.map(N.ivPc).sort((a, b) => a - b).join(','); (keys[k] = keys[k] || []).push(q.id); }); Object.values(keys).forEach(l => { if (l.length > 1) clash.push(l.join('=')); }); log('     same-pc qualities: ' + clash.join(' | ')); })();
    ok(GH.chords.QUALITIES.every(q => GH.voicings.representative('C', q.id) || GH.voicings.generate('C', q.id, 'drop2').length || q.intervals.length <= 2), 'every quality has a playable voicing');
    ok(typeof GH.backing === 'object' && GH.backing.STYLE_ORDER.every(id => GH.backing.STYLES[id] && GH.backing.STYLES[id].drums.length && GH.backing.STYLES[id].comp.length), 'backing styles defined');
    ok(GH.audio.PRESET_ORDER.every(id => GH.audio.PRESETS[id]), 'audio presets');
    const dia = GH.chords.diatonic('C', 'ionian', true);
    ok(dia.map(d => d.chord.symbol).join(' ') === 'Cmaj7 Dm7 Em7 Fmaj7 G7 Am7 Bm7b5', 'diatonic C major 7ths (' + dia.map(d => d.chord.symbol).join(' ') + ')');
    ok(dia.map(d => d.roman).join(' ') === 'Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7', 'diatonic romans (' + dia.map(d => d.roman).join(' ') + ')');
    const hm = GH.chords.diatonic('A', 'harmonic_minor', true);
    ok(hm[4].chord.symbol === 'E7' && hm[6].chord.symbol === 'G♯dim7', 'A harmonic minor V7 & vii°7 (' + hm[4].chord.symbol + ', ' + hm[6].chord.symbol + ')');
    const r = (s, k, m) => { const x = GH.chords.romanToChord(s, k, m); return x ? x.symbol : 'null'; };
    ok(r('V7/ii', 'C') === 'A7', 'V7/ii in C = A7 (' + r('V7/ii', 'C') + ')');
    ok(r('bII7', 'C') === 'D♭7', 'bII7 = Db7 (' + r('bII7', 'C') + ')');
    ok(r('#iv°7', 'C') === 'F♯dim7', '#iv°7 = F#dim7 (' + r('#iv°7', 'C') + ')');
    ok(r('iiø7', 'A', 'minor') === 'Bm7b5', 'iiø7 in A minor (' + r('iiø7', 'A', 'minor') + ')');
    ok(r('VI7', 'C', 'minor') === 'A♭7', 'VI7 in C minor = Ab7 (' + r('VI7', 'C', 'minor') + ')');
    ok(r('VII', 'A', 'minor') === 'G', 'VII in A minor = G (' + r('VII', 'A', 'minor') + ')');
    ok(r('vii°7', 'A', 'minor') === 'G♯dim7', 'vii°7 in A minor = G#dim7 (' + r('vii°7', 'A', 'minor') + ')');
    ok(r('I7/3', 'C') === 'C7/E', 'I7/3 = C7/E (' + r('I7/3', 'C') + ')');
    ok(r('I6/9', 'C') === 'C6/9', 'I6/9 = C6/9 (' + r('I6/9', 'C') + ')');
    ok(r('V/3', 'C') === 'G/B', 'V/3 = G/B (' + r('V/3', 'C') + ')');
    ok(r('biii7', 'C') === 'E♭m7', 'biii7 = Ebm7 (' + r('biii7', 'C') + ')');
    ok(GH.chords.romanToChord('VI7', 'C').fn === 'D', 'VI7 fn = D');
    /* scales */
    ok(GH.scales.notes('C', 'altered').map(n => n.name).join(' ') === 'C Db D# E Gb Ab Bb', 'C altered spelled (' + GH.scales.notes('C', 'altered').map(n => n.name).join(' ') + ')');
    ok(GH.scales.formula('ionian').join('') === 'WWHWWWH', 'ionian formula');
    ok(GH.scales.forChord('7')[0].scale.id === 'mixolydian', 'forChord 7 → mixolydian first');
    ok(GH.scales.forChord('m7b5').some(f => f.scale.id === 'locrian'), 'forChord m7b5 includes locrian');
    ok(GH.scales.keySignature('Eb').flats === 3 && GH.scales.keySignature('A').sharps === 3 && GH.scales.keySignature('A', true).sharps === 0 && GH.scales.keySignature('A', true).flats === 0, 'keySignature');
    GH.scales.SCALES.forEach(s => { s.chords.forEach(q => { if (!GH.chords.getQuality(q)) { fails++; log('FAIL scale ' + s.id + ' references unknown chord ' + q); } }); });
    GH.chords.QUALITIES.forEach(q => { (q.scales || []).forEach(s => { if (!GH.scales.get(s)) { fails++; log('FAIL quality ' + q.id + ' references unknown scale ' + s); } }); });
    /* voicing shapes */
    let shapeOk = 0;
    GH.data.voicingShapes.forEach(sh => {
      const root = sh.movable ? 'C' : sh.root;
      const v = GH.voicings.fromShape(sh, root);
      if (!v) { fails++; log('FAIL shape null: ' + sh.q + ' ' + sh.name); return; }
      if (!v.valid) { fails++; log('FAIL shape invalid: ' + sh.q + ' ' + sh.name + ' labels=' + JSON.stringify(v.labels)); return; }
      shapeOk++;
    });
    ok(shapeOk === GH.data.voicingShapes.length, 'voicing shapes valid ' + shapeOk + '/' + GH.data.voicingShapes.length);
    /* 무버블 폼을 12 루트로 */
    let cnt = 0; N.SHARP_NAMES.forEach(rt => { GH.data.voicingShapes.filter(s => s.movable).forEach(sh => { const v = GH.voicings.fromShape(sh, rt); if (v && v.valid) cnt++; }); });
    ok(cnt > 12 * 60, 'movable shapes across 12 roots: ' + cnt);
    const d2 = GH.voicings.generate('C', 'maj7', 'drop2');
    ok(d2.length >= 12, 'drop2 Cmaj7 count ' + d2.length + ' (예: ' + (d2[0] ? d2[0].frets.join('-') : '') + ')');
    ok(GH.voicings.generate('G', '7', 'drop3').length >= 6, 'drop3 G7 count ' + GH.voicings.generate('G', '7', 'drop3').length);
    ok(GH.voicings.generate('C', 'maj', 'triad').length >= 12, 'triads C count ' + GH.voicings.generate('C', 'maj', 'triad').length);
    ok(GH.voicings.generate('C', 'maj', 'spread').length >= 6, 'spread C count ' + GH.voicings.generate('C', 'maj', 'spread').length);
    ok(GH.voicings.generate('C', '9', 'drop2').length >= 6, 'drop2 C9 (5음 축약) count ' + GH.voicings.generate('C', '9', 'drop2').length);
    ok(GH.voicings.quartal('D', 'dorian', 3).length >= 6, 'quartal D dorian count ' + GH.voicings.quartal('D', 'dorian', 3).length);
    const vl = GH.voicings.voiceLead(GH.app.progressionChords(GH.data.progressions.find(p => p.id === 'ii-V-I'), 'C'));
    ok(vl.every(Boolean) && vl.length === 4, 'voiceLead ii-V-I: ' + vl.map(v => v ? v.frets.map(f => f == null ? 'x' : f).join('-') : 'null').join(' | '));
    const vlDrop3 = GH.voicings.voiceLead(GH.app.progressionChords(GH.data.progressions.find(p => p.id === 'ii-V-I'), 'C'), { kind: 'drop3', strSet: '6-4-3-2' });
    ok(vlDrop3.every(v => v && v.type === 'drop3' && v.strSet === '6-4-3-2'), 'voiceLead drop3 keeps compatible string set');
    ok(!!GH.voicings.representative('F#', 'm7b5'), 'representative F#m7b5');
    const dropD = [38, 45, 50, 55, 59, 64];
    ok(GH.voicings.identifyFrets([0, 0, null, null, null, null], 'sharp', dropD).some(x => x.root === 'D' && x.qId === '5'), 'finder respects Drop D tuning (open D+A = D5)');
    ok(GH.voicings.identifyFrets([12, 0, null, null, null, null], 'sharp').some(x => x.bassPc === 9), 'finder bass uses lowest sounding MIDI');
    /* progressions */
    GH.data.progressions.forEach(p => {
      ['C', 'Eb', 'F#'].forEach(k => {
        const chords = GH.app.progressionChords(p, k);
        const expect = (p.symbols || p.chords).length;
        if (chords.length !== expect) { fails++; log('FAIL progression ' + p.id + ' key ' + k + ': ' + chords.length + '/' + expect); }
      });
      (p.scales || []).forEach(s => { if (!GH.scales.get(s)) { fails++; log('FAIL progression ' + p.id + ' unknown scale ' + s); } });
    });
    log('     ' + GH.data.progressions.length + ' progressions parsed. jazzblues in F: ' + GH.app.progressionChords(GH.data.progressions.find(p => p.id === 'jazzblues'), 'F').map(c => c.symbol).join(' '));
    log('     bluebossa in C: ' + GH.app.progressionChords(GH.data.progressions.find(p => p.id === 'bluebossa'), 'C').map(c => c.symbol).join(' '));
    log('     coltrane in C: ' + GH.app.progressionChords(GH.data.progressions.find(p => p.id === 'coltrane'), 'C').map(c => c.symbol).join(' '));
    log('     gospel in C: ' + GH.app.progressionChords(GH.data.progressions.find(p => p.id === 'gospelwalkup'), 'C').map(c => c.symbol).join(' '));
    /* interaction/deep-link regressions */
    const modeDeep = document.createElement('div');
    GH.pages['/theory/modes'].render(modeDeep, { query: { mode: 'altered', root: 'G' } });
    ok(modeDeep.textContent.includes('G 알터드'), 'advanced mode deep link opens G altered');
    const hubDeep = document.createElement('div');
    GH.pages['/chord/:root/:q'].render(hubDeep, { root: 'C', q: 'maj7', query: {} });
    ok(!!hubDeep.querySelector('a[href*="arpQ=maj7"]'), 'chord hub preserves quality in arpeggio link');
    const progDeep = document.createElement('div');
    GH.pages['/theory/progressions'].render(progDeep, { query: { id: 'ii-V-I', key: 'C' } });
    ok(!!progDeep.querySelector('a[href*="scale=dorian"][href*="root=D"]') && !!progDeep.querySelector('a[href*="scale=mixolydian"][href*="root=G"]'), 'progression scale links use contextual chord roots');
    const oldPlayProgression = GH.player.playProgression; let livePlayback = null;
    GH.player.playProgression = (chords, opts) => { livePlayback = opts; return {}; };
    const tempoInput = progDeep.querySelector('input[type="range"]');
    const styleLabel = Array.from(progDeep.querySelectorAll('label')).find(label => label.textContent.trim().startsWith('스타일'));
    const playProgression = Array.from(progDeep.querySelectorAll('button')).find(button => button.textContent.includes('재생'));
    if (tempoInput && styleLabel && playProgression) {
      tempoInput.value = 177; tempoInput.dispatchEvent(new Event('input', { bubbles: true }));
      const styleSelect = styleLabel.querySelector('select'); styleSelect.value = 'funk'; styleSelect.dispatchEvent(new Event('change', { bubbles: true }));
      playProgression.click();
    }
    GH.player.playProgression = oldPlayProgression;
    ok(livePlayback && livePlayback.tempo === 177 && livePlayback.style === 'funk', 'progression playback reads live tempo/style controls');
    const progList = document.createElement('div');
    GH.pages['/theory/progressions'].render(progList, { query: {} });
    ok(!!progList.querySelector('a[href*="/theory/progressions/ii-V-I"]') && !Array.from(progList.querySelectorAll('button')).some(button => button.textContent.includes('재생')), 'progression list links to a separate detail page');
    const voicingHome = document.createElement('div');
    GH.pages['/guitar/voicings'].render(voicingHome, { query: {} });
    ok(!!voicingHome.querySelector('a[href*="/guitar/voicings/basic"]') && !!voicingHome.querySelector('a[href*="/guitar/voicings/advanced"]'), 'voicings split into basic and advanced entry pages');
    const songList = document.createElement('div');
    GH.pages['/songs'].render(songList, { query: {} });
    ok(!!songList.querySelector('a[href*="/songs/autumn"]') && !songList.textContent.includes('1마디 코드 분석'), 'song list links to a separate song page');
    const savedAudio = { context: GH.audio.context, now: GH.audio.now, pluck: GH.audio.pluck, stopAll: GH.audio.stopAll };
    let stoppedNote = null;
    GH.audio.context = () => null; GH.audio.now = () => 0; GH.audio.pluck = () => null; GH.audio.stopAll = () => null;
    GH.player.playNotes([60], { onNote: i => { stoppedNote = i; } });
    GH.player.stop();
    Object.assign(GH.audio, savedAudio);
    ok(stoppedNote === -1, 'manual stop clears playback highlights');
    const lickDeep = document.createElement('div');
    GH.pages['/guitar/licks/:id'].render(lickDeep, { id: 'altered-g7', query: {} });
    ok(!!lickDeep.querySelector('a[href*="scale=altered"][href*="root=G"]'), 'lick analysis links altered scale to the played chord root');
    /* reharm */
    GH.data.reharm.forEach(rh => {
      const b = GH.app.progressionChords({ chords: rh.example.before, mode: rh.example.mode }, 'C'), a = GH.app.progressionChords({ chords: rh.example.after, mode: rh.example.mode }, 'C');
      if (b.length !== rh.example.before.length || a.length !== rh.example.after.length) { fails++; log('FAIL reharm ' + rh.id + ' parse'); }
      else log('     reharm ' + rh.id + ': ' + a.map(c => c.symbol).join(' '));
      (rh.related.chords || []).forEach(q => { if (!GH.chords.getQuality(q)) { fails++; log('FAIL reharm ' + rh.id + ' unknown chord ' + q); } });
      (rh.related.scales || []).forEach(s => { if (!GH.scales.get(s)) { fails++; log('FAIL reharm ' + rh.id + ' unknown scale ' + s); } });
    });
    /* licks */
    GH.data.licks.forEach(l => {
      let pos = 0; const probs = [];
      let cur = null;
      l.notes.forEach((ev, i) => {
        if (ev.ch) { const p = GH.chords.parseSymbol(ev.ch); if (!p) probs.push('bad chord ' + ev.ch); else cur = p; }
        if (!ev.rest) { const pairs = ev.ns || [[ev.s, ev.f]]; pairs.forEach(([s, f]) => { if (!(s >= 1 && s <= 6) || !(f >= 0 && f <= 22)) probs.push('bad note ' + i); }); }
        if (!(ev.d > 0)) probs.push('bad dur ' + i);
        pos += ev.d;
      });
      if (Math.abs(pos % 4) > 1e-6) probs.push('total beats ' + pos + ' not multiple of 4');
      if (!GH.scales.get(l.scale)) probs.push('unknown scale ' + l.scale);
      (l.qIds || []).forEach(q => { if (!GH.chords.getQuality(q)) probs.push('unknown q ' + q); });
      (l.progressionIds || []).forEach(p => { if (!GH.data.progressions.find(x => x.id === p)) probs.push('unknown prog ' + p); });
      if (probs.length) { fails++; log('FAIL lick ' + l.id + ': ' + probs.join(', ')); }
      else {
        /* 코드 대비 도수 목록 */
        const ivs = []; cur = null;
        l.notes.forEach(ev => { if (ev.ch) cur = GH.chords.parseSymbol(ev.ch); if (ev.rest || !cur) return; const pairs = ev.ns || [[ev.s, ev.f]]; pairs.forEach(([s, f]) => { const midi = GH.voicings.STD[6 - s] + f; const rp = N.pcOf(cur.root); const lm = N.labelMap(rp, GH.chords.getQuality(cur.qId).intervals); ivs.push(lm[midi % 12] || ('(' + N.intervalName(rp, midi % 12) + ')')); }); });
        log('     lick ' + l.id + ' [' + pos + '박]: ' + ivs.join(' '));
      }
    });
    /* songs */
    GH.data.songs.forEach(s => { s.bars.forEach((b, i) => { b.c.split(' ').forEach(sy => { if (!GH.chords.parseSymbol(sy)) { fails++; log('FAIL song ' + s.id + ' bar ' + (i + 1) + ' chord ' + sy); } }); if (!GH.scales.get(b.scale[1])) { fails++; log('FAIL song ' + s.id + ' scale ' + b.scale[1]); } (b.licks || []).forEach(id => { if (!GH.data.licks.find(l => l.id === id)) { fails++; log('FAIL song ' + s.id + ' lick ' + id); } }); }); });
    /* positions */
    ok(GH.positions.caged(0, 'ionian', GH.voicings.STD).length === 5 && GH.positions.caged(0, 'ionian', GH.voicings.STD).every(p => p.notes.length >= 12), 'caged C ionian 5 windows: ' + GH.positions.caged(0, 'ionian', GH.voicings.STD).map(p => p.name).join(', '));
    ok(GH.positions.npsPositions(9, 'minor_pent', 2, GH.voicings.STD).length === 5, 'minor pent boxes: ' + GH.positions.npsPositions(9, 'minor_pent', 2, GH.voicings.STD).map(p => p.lo + '-' + p.hi).join(', '));
    ok(GH.positions.npsPositions(0, 'ionian', 3, GH.voicings.STD).length === 7, '3nps C ionian 7 positions');
    ok(GH.positions.systemsFor('ionian', GH.voicings.STD).some(s => s.id === 'caged') && !GH.positions.systemsFor('ionian', dropD).some(s => s.id === 'caged'), 'CAGED system only appears for compatible string intervals');
    /* modes data */
    Object.keys(GH.data.modes).forEach(id => { if (!GH.scales.get(id)) { fails++; log('FAIL modes data unknown scale ' + id); } const v = GH.data.modes[id].vamp; if (v) v.forEach(rm => { if (!GH.chords.romanToChord(rm, 'C', 'major')) { fails++; log('FAIL mode vamp parse ' + id + ' ' + rm); } }); });

    /* 멜로디 화음 쌓기 */
    (function () {
      const HM = GH.harmony; const IB = N.intervalBetween;
      ok(IB('B', 'F', 6).en === 'd5' && IB('C', 'E', 4).en === 'M3' && IB('E', 'G', 3).en === 'm3' && IB('C', 'C', 12).en === 'P8' && IB('F', 'B', 6).en === 'A4', 'intervalBetween d5 M3 m3 P8 A4');
      const up3 = HM.build([60, 62, 64, 65, 67], 'C', 'ionian', [{ mode: 'diatonic', size: '3', dir: 1 }]).voices[0];
      ok(up3.map(n => n.name).join(' ') === 'E F G A B' && up3.map(n => n.iv.en).join(' ') === 'M3 m3 m3 M3 M3', 'C major 3rd above = E F G A B (' + up3.map(n => n.name + ':' + n.iv.en).join(' ') + ')');
      ok(up3.map(n => n.midi).join(',') === '64,65,67,69,71', '3rd above midi');
      const b5 = HM.build([71], 'C', 'ionian', [{ mode: 'diatonic', size: '5', dir: 1 }]).voices[0][0];
      ok(b5.name === 'F' && b5.midi === 77 && b5.iv.en === 'd5', '5th above B = F d5 (' + b5.name + ' ' + b5.iv.en + ')');
      const cs = HM.build([61], 'C', 'ionian', [{ mode: 'diatonic', size: '3', dir: 1 }], ['C#']);
      ok(cs.melody[0].outOfScale && cs.melody[0].name === 'C#' && cs.voices[0][0].name === 'E#' && cs.voices[0][0].midi === 65 && cs.voices[0][0].iv.en === 'M3' && cs.voices[0][0].outOfScale, 'C# out of scale → E# M3 (' + cs.voices[0][0].name + ')');
      const bb = HM.build([70], 'C', 'ionian', [{ mode: 'diatonic', size: '3', dir: 1 }]);
      ok(bb.melody[0].name === 'Bb' && bb.voices[0][0].name === 'Db' && bb.voices[0][0].iv.en === 'm3', 'Bb in C → Db m3 (' + bb.voices[0][0].name + ' ' + bb.voices[0][0].iv.en + ')');
      const down3 = HM.build([60], 'C', 'ionian', [{ mode: 'diatonic', size: '3', dir: -1 }]).voices[0][0];
      ok(down3.name === 'A' && down3.midi === 57 && down3.iv.en === 'm3', '3rd below C = A3 m3');
      const hm = HM.build([68], 'A', 'harmonic_minor', [{ mode: 'diatonic', size: '3', dir: 1 }]).voices[0][0];
      ok(hm.name === 'B' && hm.iv.en === 'm3', 'A harmonic minor: G# + 3rd = B m3 (' + hm.name + ')');
      const oct = HM.build([64], 'C', 'ionian', [{ mode: 'diatonic', size: '8', dir: -1 }, { mode: 'diatonic', size: '6', dir: -1 }]).voices;
      ok(oct[0][0].midi === 52 && oct[0][0].iv.en === 'P8' && oct[1][0].name === 'G' && oct[1][0].midi === 55 && oct[1][0].iv.en === 'M6', 'octave below E = E3 P8, 6th below E = G3 M6');
      const db = HM.build([61], 'C', 'ionian', [{ mode: 'diatonic', size: '3', dir: 1 }]).voices[0][0];
      ok(db.name === 'Fb' && db.iv.en === 'm3', 'unspelled 61 in C = Db → Fb m3 (' + db.name + ')');
      ok(GH.melodyInput.parseText('C#4 Bb').names.join(' ') === 'C# Bb', 'parseText keeps spelling');
      const par = HM.build([71, 62], 'C', 'ionian', [{ mode: 'parallel', par: 'M3', dir: 1 }]).voices[0];
      ok(par[0].name === 'D#' && par[0].iv.en === 'M3' && par[0].outOfScale && par[1].name === 'F#' && par[1].iv.en === 'M3', 'parallel M3 above B, D = D#, F# (' + par.map(n => n.name).join(' ') + ')');
      const eb = HM.build([63, 65], 'Eb', 'ionian', [{ mode: 'diatonic', size: '3', dir: 1 }]).voices[0];
      ok(eb.map(n => n.name).join(' ') === 'G Ab', 'Eb major spelled (' + eb.map(n => n.name).join(' ') + ')');
      ok(GH.melodyInput.parseText('C D E5 F').midis.join(',') === '60,62,76,77' && GH.melodyInput.parseText('X1').bad.length === 1, 'melodyInput.parseText');
    })();
    /* 운지 · 더블스탑 */
    (function () {
      const F = GH.fingering;
      const tunings = { std: [40, 45, 50, 55, 59, 64], dropD: [38, 45, 50, 55, 59, 64], openG: [38, 43, 50, 55, 59, 62] };
      const thirds = GH.harmony.build([60, 62, 64, 65, 67, 69, 71, 72], 'C', 'ionian', [{ mode: 'diatonic', size: '3', dir: 1 }]);
      const list = thirds.melody.map((m, i) => [m.midi, thirds.voices[0][i].midi, 3]);
      Object.entries(tunings).forEach(([name, tun]) => [0, 2].forEach(capo => {
        const path = F.pairs(list, { tuning: tun, capo, maxFret: 17 });
        const bad = path.map((p, i) => {
          if (!p) return 'null@' + i;
          const [[sH, fH], [sL, fL]] = p.ns;
          if (tun[6 - sH] + fH !== list[i][1] || tun[6 - sL] + fL !== list[i][0]) return 'pitch@' + i;
          if (fH < capo || fL < capo) return 'capo@' + i;
          if (fH > capo && fL > capo && Math.abs(fH - fL) > 3) return 'span@' + i;
          if (sL - sH !== 1) return 'gap@' + i;
          return null;
        }).filter(Boolean);
        ok(!bad.length, 'double-stop 3rds ' + name + ' capo ' + capo + ' ' + (bad.join(',') || path.map(p => p.ns.map(n => n.join('/')).join('+')).slice(0, 3).join(' ')));
      }));
      const sixths = F.pairs([[60, 69, 6], [62, 71, 6]], { tuning: tunings.std, capo: 0 });
      ok(sixths.every(p => p && p.ns[1][0] - p.ns[0][0] === 2), 'double-stop 6ths skip one string');
      const single = F.single([60, 62, 64, 65, 67], { tuning: tunings.std, window: [5, 9] });
      ok(single.every((c, i) => c && tunings.std[6 - c.s] + c.f === [60, 62, 64, 65, 67][i]), 'single-note fingering pitch');
      const pat = GH.doublestops.scalePattern('C', 'ionian', '3', 3, 2, { maxFret: 15, allowOpen: true });
      ok(pat.length >= 7 && pat.every(s => ['M3', 'm3'].includes(s.iv.en) && GH.state.tuningMidi()[3] + s.fixed[1][1] === s.lo && GH.state.tuningMidi()[4] + s.fixed[0][1] === s.hi), 'C major 3rds on strings 3-2: ' + pat.length + ' steps (' + pat.slice(0, 4).map(s => s.loName + s.hiName + ':' + s.iv.en).join(' ') + ')');
    })();
    /* 솔로 프레이즈 */
    (function () {
      const chords = GH.app.progressionChords(GH.data.progressions.find(p => p.id === 'ii-V-I'), 'C');
      const beats = chords.reduce((a, c) => a + c.beats, 0);
      ['none', 'below', 'above', 'scaleAbove', 'enclosure', 'enclosureChrom', 'doubleBelow'].forEach(ap => ['arpeggio', 'scale', 'passing', 'neighbor'].forEach(fl => {
        const line = GH.phrase.build(chords, { key: 'C', approach: ap, filler: fl, lo: 50, hi: 74, start: 64 });
        const total = line.reduce((a, n) => a + n.d, 0);
        const firsts = chords.map((c, ci) => line.find(n => n.ci === ci));
        const targetsOk = firsts.every((n, ci) => n && n.role === 'target' && chords[ci].pcs.includes(n.midi % 12));
        let apOk = true;
        firsts.slice(1).forEach(t => { const k = line.indexOf(t); const prev = line[k - 1];
          if (ap === 'below' && prev.midi !== t.midi - 1) apOk = false;
          if (ap === 'enclosure' && !(prev.midi === t.midi - 1 && line[k - 2].midi > t.midi)) apOk = false;
          if (ap === 'doubleBelow' && !(prev.midi === t.midi - 1 && line[k - 2].midi === t.midi - 2)) apOk = false; });
        if (Math.abs(total - beats) > 1e-6 || !targetsOk || !apOk) { fails++; log('FAIL phrase ' + ap + '/' + fl + ' total=' + total + ' targets=' + targetsOk + ' approach=' + apOk); }
      }));
      const demo = GH.phrase.build(chords, { key: 'C', approach: 'enclosure', filler: 'scale', lo: 50, hi: 74, start: 64 });
      log('     phrase ii-V-I enclosure: ' + demo.map(n => N.noteName(n.midi % 12) + ':' + GH.phrase.ROLES[n.role].en).join(' '));
    })();
    /* 리듬 */
    (function () {
      const badR = GH.data.rhythms.filter(r => { try { return GH.rhythm.parse(r.p).total !== 4; } catch (e) { return true; } });
      ok(!badR.length, 'rhythm patterns total 4 beats (' + GH.data.rhythms.length + ') ' + badR.map(r => r.id).join(','));
      const badS = GH.data.strums.filter(s => s.p.trim().split(/\s+/).length !== s.grid);
      ok(!badS.length, 'strum patterns match grid ' + badS.map(s => s.id).join(','));
      const sc = GH.rhythm.score([{ time: 0, i: 0 }, { time: 0.5, i: 1 }, { time: 1, i: 2 }], [0.01, 0.62, 1.3]);
      ok(sc.items.map(x => x.grade).join(',') === 'good,veryLate,miss' && sc.extra === 1, 'rhythm score grades ' + sc.items.map(x => x.grade).join(',') + ' extra ' + sc.extra);
    })();
    /* 가이드 */
    (function () {
      const G = GH.guide;
      /* '/learn/:id' 처럼 변수가 있는 경로도 인정 */
      const hasPage = r => !!GH.pages[r] || Object.keys(GH.pages).some(k => k.includes(':') && new RegExp('^' + k.replace(/:[^/]+/g, '[^/]+') + '$').test(r));
      const routesOk = G.MISSIONS.every(m => hasPage(m.route));
      ok(routesOk, 'guide mission routes exist ' + G.MISSIONS.filter(m => !hasPage(m.route)).map(m => m.route).join(','));
      /* 기초 코스: 레슨 id 가 겹치지 않고, 위젯이 모두 있고, 정답 번호가 보기 안에 있다 */
      const lessons = GH.course.lessons();
      ok(new Set(lessons.map(l => l.id)).size === lessons.length, 'course lesson ids unique');
      ok(lessons.every(l => !l.widget || GH.course.WIDGETS[l.widget.type]), 'course widgets exist ' + lessons.filter(l => l.widget && !GH.course.WIDGETS[l.widget.type]).map(l => l.id).join(','));
      ok(lessons.every(l => !l.quiz || (l.quiz.answer >= 0 && l.quiz.answer < l.quiz.options.length)), 'course quiz answers in range');
      G.MISSIONS.filter(m => /^course-/.test(m.id)).forEach(m => ok(lessons.some(l => '/learn/' + l.id === m.route), 'course mission lesson ' + m.route));
      const counts = G.LEVELS.map(l => G.plan({ level: l.id, goals: ['theory', 'guitar', 'ear', 'solo', 'compose', 'rhythm'] }).length);
      ok(counts.every(c => c >= 5), 'guide plan per level ' + counts.join(','));
      ok(G.GOALS.every(g => G.plan({ level: 'chords', goals: [g.id] }).length >= 2), 'guide plan per goal');
    })();
    /* 음악 아이콘 · 리얼북 코드 심볼 */
    (function () {
      const names = GH.icon.names;
      const routes = [].concat(...GH.app.SECTIONS.map(sec => [sec.path].concat(sec.items.map(it => it[0]))));
      const missing = routes.map(r => GH.icon.forRoute(r)).filter(n => !names.includes(n));
      ok(!missing.length, 'route icons exist ' + missing.join(','));
      ok(GH.app.SECTIONS.every(sec => names.includes(sec.icon) && sec.en && sec.color), 'section icon/en/color');
      ok(GH.guide.GOALS.every(g => names.includes(g.icon)), 'goal icons are music icons');
      const el = GH.icon('metronome'); ok(el.tagName.toLowerCase() === 'svg' && el.querySelectorAll('path').length >= 3, 'GH.icon builds svg');
      if (GH.render.chordText) {
        const t = GH.render.chordText('Bbm7b5', 0, 0); const txt = t.textContent;
        ok(txt === 'B♭m7♭5', 'chord symbol Bbm7b5 → ' + txt);
        const t2 = GH.render.chordText('F#7#9/C#', 0, 0).textContent;
        ok(t2 === 'F♯7♯9/C♯', 'chord symbol F#7#9/C# → ' + t2);
        ok(GH.render.chordText('Cmaj7', 0, 0).textContent === 'Cmaj7', 'chord symbol Cmaj7');
      }
      ok(GH.render.feelMark(90, 'shuffle').indexOf('Med. Shuffle') > 0 && GH.render.feelMark(200, 'swing').indexOf('Up Swing') > 0, 'feel mark');
    })();
    /* search */
    const sr = GH.search.query('Cmaj7');
    ok(sr.length && sr[0].type === '코드', 'search Cmaj7 → chord hub');
    ok(GH.search.query('도리안').length > 0, 'search 도리안');
    ok(GH.search.query('ii-V-I').length > 0, 'search ii-V-I');
    /* render all pages */
    const samples = {
      '/chord/:root/:q': { root: 'F#', q: 'm7b5' },
      '/guitar/licks/:id': { id: GH.data.licks[0].id },
      '/theory/progressions/:id': { id: 'ii-V-I' },
      '/theory/reharm/:id': { id: 'tritone_sub' },
      '/theory/intervals/:iv': { iv: '5' },
      '/theory/modes/:id': { id: 'dorian' },
      '/theory/scales/:id': { id: 'ionian' },
      '/songs/:id': { id: 'autumn' },
      '/songs/:id/bar/:bar': { id: 'autumn', bar: '2' }
    };
    Object.keys(GH.pages).forEach(path => {
      const div = document.createElement('div');
      try { GH.pages[path].render(div, Object.assign({ query: {} }, samples[path] || {})); ok(div.childNodes.length > 0, 'render ' + path + ' (' + div.querySelectorAll('*').length + ' nodes)'); }
      catch (e) { fails++; log('FAIL render ' + path + ': ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')); }
    });
    /* 렌더 변형: 다른 탭 */
    const variants = [['/theory/chords', { query: { tab: 'types' } }], ['/theory/chords', { query: { tab: 'diatonic' } }], ['/theory/chords', { query: { tab: 'tension' } }], ['/theory/chords', { query: { tab: 'notation' } }], ['/theory/chords', { query: { tab: 'inversion' } }],
      ['/theory/scales', { query: { tab: 'circle' } }], ['/theory/scales', { query: { tab: 'chordscale' } }], ['/theory/scales', { query: { tab: 'compare' } }], ['/theory/scales', { query: { tab: 'list' } }],
      ['/theory/modes', { query: { tab: 'parallel' } }], ['/theory/modes', { query: { tab: 'relative' } }], ['/theory/modes', { query: { tab: 'mm' } }], ['/theory/modes', { query: { tab: 'hm' } }], ['/theory/modes', { query: { tab: 'modal' } }],
      ['/guitar/scales', { query: { scale: 'ionian' } }], ['/guitar/scales', { query: { scale: 'hw_dim' } }], ['/guitar/voicings', { query: { q: '13', types: 'jazz,drop24,quartal' } }], ['/theory/progressions', { query: { id: 'coltrane' } }], ['/theory/reharm', { query: { id: 'coltrane' } }], ['/songs', { query: { id: 'fbluesjazz' } }], ['/ear', { query: { tab: 'degree' } }], ['/ear', { query: { tab: 'interval' } }], ['/ear', { query: { tab: 'root' } }], ['/ear', { query: { tab: 'chord' } }], ['/ear', { query: { tab: 'mode' } }], ['/ear', { query: { tab: 'prog' } }], ['/backing', { query: { id: 'blues12', key: 'A' } }], ['/backing', { query: { chords: 'Dm7 G7 | Cmaj7 | Xyz' } }], ['/backing', { query: { chords: 'C Am F G' } }], ['/tools/melody', { query: { notes: 'E D C D E E E' } }], ['/tools/harmony', { query: { notes: 'C4 D4 E4 F4 G4 C#4', key: 'C' } }], ['/tools/harmony', { query: { notes: 'A3 B3 C4 G#4', key: 'A', scale: 'harmonic_minor' } }], ['/rhythm', { query: { tab: 'tap' } }], ['/rhythm', { query: { tab: 'strum' } }], ['/ear', { query: { tab: 'rhythm' } }], ['/guitar/phrasing', { query: {} }], ['/guitar/doublestops', { query: {} }], ['/tools/melody', { query: { notes: 'A4 C5 E5 D5', key: 'C' } }], ['/theory/chords', { query: { tab: 'types', group: 'level' } }], ['/theory/reharm', { query: { id: 'tritone_sub' } }]];
    GH.data.licks.forEach(l => variants.push(['/guitar/licks/:id', { id: l.id, query: {} }]));
    variants.forEach(([path, params]) => { const div = document.createElement('div'); try { GH.pages[path].render(div, params); ok(true, 'render ' + path + ' ' + JSON.stringify(params)); } catch (e) { fails++; log('FAIL render ' + path + ' ' + JSON.stringify(params) + ': ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')); } });
    /* 12 키로 허브 렌더 */
    N.SHARP_NAMES.concat(N.FLAT_NAMES).forEach(rt => { ['maj7', '7', 'm7', 'm7b5', 'dim7', '7alt', '13sus4'].forEach(q => { const div = document.createElement('div'); try { GH.pages['/chord/:root/:q'].render(div, { root: rt, q, query: {} }); } catch (e) { fails++; log('FAIL hub ' + rt + ' ' + q + ': ' + e.message); } }); });
    log('     hub 12키 × 7타입 렌더 완료');
  } catch (e) {
    fails++; log('FAIL exception: ' + e.message + '\n' + e.stack);
  }
  (window.__errors || []).forEach(e => { if (!lines.includes('FAIL script error: ' + e)) { fails++; log('FAIL late error: ' + e); } });
  log('\nRESULT: ' + (fails ? fails + ' FAIL' : 'ALL OK'));
  out.textContent = lines.join('\n');
  window.__checkDone = true;
})();
