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
      /* 세션별 기초 코스: 여섯 장, 레슨 · 위젯 · 문제가 모두 있고, 세션에 안 맞는 말(기타 지판 설명)이 없다 */
      const C = GH.course; const BAN = { bass: /기타로|기타에서|기타 줄|카포|6번 줄|5번 줄/, keys: /기타|프렛|번 줄|지판|카포/, drums: /기타|프렛|번 줄|지판|카포/, vocal: /기타|프렛|번 줄|지판|카포/ };
      const sessBad = [];
      C.SESSIONS.forEach(sid => {
        const chs = C.chapters(sid); if (chs.length !== 6) sessBad.push(sid + ': ' + chs.length + '장');
        chs.forEach(ch => ch.lessons.forEach(l => {
          if (!l || !l.id || !l.title || !l.lead || !(l.body || []).length || !(l.try || []).length) { sessBad.push(sid + '/' + (l && l.id) + ': 빈 레슨'); return; }
          if (l.widget && !C.WIDGETS[l.widget.type]) sessBad.push(sid + '/' + l.id + ': 위젯 ' + l.widget.type);
          if (l.widget && l.widget.type === 'practice' && !GH.data.technique.some(e => e.id === l.widget.id)) sessBad.push(sid + '/' + l.id + ': 연습 ' + l.widget.id);
          if (l.quiz && !(l.quiz.answer >= 0 && l.quiz.answer < l.quiz.options.length)) sessBad.push(sid + '/' + l.id + ': 문제');
          const txt = [l.title, l.lead, l.remember || ''].concat(l.body, l.try).join(' ');
          if (BAN[sid] && BAN[sid].test(txt)) sessBad.push(sid + '/' + l.id + ': ' + txt.match(BAN[sid])[0]);
        }));
      });
      ok(!sessBad.length, 'course per session: 6 chapters, lessons · widgets · quizzes, session wording ' + sessBad.slice(0, 6).join(', '));
      const firsts = C.SESSIONS.map(sid => { const pl = G.plan({ level: 'new', goals: ['theory', 'rhythm'], sessions: [sid] }); return pl[0] && pl[0].course && pl[0].inst.includes(sid) && pl.filter(m => m.inst && m.inst.includes(sid)).length >= 4 && pl.every(m => !m.inst || m.inst.includes(sid)); });
      ok(firsts.every(Boolean), 'guide: beginners start with their own session course, other sessions stay out ' + firsts.join(','));
      const adv = C.SESSIONS.map(sid => G.plan({ level: 'player', goals: ['rhythm', 'solo'], sessions: [sid] }).filter(m => m.inst && m.inst.includes(sid)).length);
      ok(adv.every(n => n >= 4), 'guide: advanced plans lean on session missions ' + adv.join(','));
      const two = G.plan({ level: 'new', goals: ['ear'], sessions: ['vocal', 'keys'] });
      ok(two[0].inst.includes('vocal') && two.some(m => m.inst && m.inst.includes('keys')), 'guide: first session leads, second session mixed in');
      ok(G.MISSIONS.filter(m => m.course).every(m => { const sid = m.inst[0]; return C.chapters(sid).some(ch => '/learn/' + ch.lessons[0].id === m.route && C.missionIdOf(sid, ch) === m.id); }), 'guide: course missions match each session chapter');
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
    /* 버그 제보함 */
    const B = GH.bug;
    ok(GH.search.query('버그').some(x => x.route === '#/bug'), 'search 버그 → #/bug');
    const br = { kind: 'sound', what: '드럼이 안 들려요\n둘째 줄', steps: '1. 재생', page: '백킹 트랙 (#/backing)', env: B.envLines().join('\n') };
    const fakeForm = { id: 'TESTID', entry: { kind: '11', what: '22', steps: '33', page: '44', env: '55' } };
    const body = B.formBody(br, fakeForm);
    ok(body.get('entry.11') === '소리가 안 나거나 이상해요' && body.get('entry.22') === br.what && body.get('entry.44') === br.page && body.get('entry.55').startsWith('기기: '), 'bug form body');
    ok(!B.formBody({ what: 'x' }, fakeForm).has('entry.11') && !B.formBody({ what: 'x' }, fakeForm).has('entry.33'), 'bug form body skips empty');
    const pu = B.prefillUrl(br, fakeForm);
    ok(pu.startsWith('https://docs.google.com/forms/d/e/TESTID/viewform?usp=pp_url&entry.') && !/ /.test(pu) && decodeURIComponent(pu.match(/entry\.22=([^&]+)/)[1]) === br.what, 'bug prefill url');
    ok(B.reportText(br).includes('드럼이 안 들려요') && B.reportText(br).includes('기기 정보'), 'bug report text');
    const longPlan = B.openPlan(Object.assign({}, br, { what: '가'.repeat(1500) }), fakeForm);
    ok(longPlan.url.length <= 7000 && longPlan.paste && longPlan.paste.length >= 1500, 'bug long report → short url + paste (' + longPlan.url.length + ')');
    ok(B.openPlan(br, fakeForm).paste === null, 'bug short report → full url');
    ok(B.envLines().some(l => l.startsWith('기기: ')), 'bug env lines');
    /* 기본기 연습 (세션 5개) */
    const T = GH.technique, TD = GH.data.technique;
    const byT = id => TD.find(e => e.id === id);
    const B_ = (id, q) => { const ex = byT(id); return T.build(ex, T.options(ex, q || {})); };
    ok(GH.data.techInst.length === 5 && GH.data.techInst.every(I => TD.filter(e => e.inst === I.id).length >= 9 && GH.data.techCats.some(c => c.inst === I.id) && GH.data.techRoutines.filter(r => r.inst === I.id).length === 3) && !GH.data.techSources,
      'technique: 5 sessions × (exercises, categories, 3 routines), no source lists ' + GH.data.techInst.map(I => I.id + ' ' + TD.filter(e => e.inst === I.id).length).join(' · '));
    ok(new Set(TD.map(e => e.id)).size === TD.length && TD.every(e => GH.data.techCats.some(c => c.id === e.cat && c.inst === e.inst) && !('src' in e) && e.how.length && e.tips.length && e.tempo.length === 2 && e.level >= 1 && e.level <= 5), 'technique metadata (unique ids, category, how, tips, tempo; no per-exercise source)');
    ok([1, 2, 3, 4, 5].every(lv => TD.some(e => e.level === lv)), 'technique levels 1-5 all used');
    ok(GH.data.techRoutines.every(r => r.steps.every(([id]) => { const e = byT(id); return e && e.inst === r.inst; })), 'technique routines reference own-session exercises');
    const techBad = [];
    const KIT = new Set(['kick', 'snare', 'hat', 'hatopen', 'pedal', 'ride', 'crash', 'tom1', 'tom2', 'tom3', 'rim']);
    TD.forEach(ex => (T.rhOptions(ex) || [null]).forEach(rh => {
      const B = T.build(ex, T.options(ex, rh ? { rh } : {}));
      const total = B.seq.reduce((a, s) => a + s.d, 0);
      let good = B.seq.length > 0 && total > 0 && B.seq.every((s, i) => i === 0 || s.at > B.seq[i - 1].at - 1e-9);
      if (B.kind === 'fretted') good = good && B.notes.every(n => n.s >= 1 && n.s <= B.NS && n.f >= 0 && n.f <= 17 && (typeof n.fg === 'string' || (n.fg >= 0 && n.fg <= 4)) && (n.t ? !n.pk : !!n.pk) && n.midi >= (ex.inst === 'bass' ? 28 : 40) && n.midi <= (ex.inst === 'bass' ? 70 : 88));
      if (B.kind === 'keys') good = good && B.rh.concat(B.lh).every(n => (n.rest ? !n.m.length : n.m.length) && n.fg.length === n.m.length && n.m.every(m => m >= 21 && m <= 108) && n.fg.every(f => f >= 1 && f <= 5)) && (B.rh.length === 0 || B.lh.length === 0 || Math.abs(B.rh.reduce((a, n) => a + n.d, 0) - B.lh.reduce((a, n) => a + n.d, 0)) < 1e-6);
      if (B.kind === 'drums') good = good && B.seq.every(s => s.hits.every(x => KIT.has(x.k))) && Math.abs(total / 4 - Math.round(total / 4)) < 1e-6;
      if (B.kind === 'vocal') good = good && B.seq.every(s => s.rest || (s.midi >= 40 && s.midi <= 84 && s.syl)) && Math.abs(total / 4 - Math.round(total / 4)) < 1e-6;
      if (!good) techBad.push(ex.id + (rh ? '/' + rh : ''));
    }));
    ok(!techBad.length, 'technique notes valid for every exercise × rhythm ' + techBad.join(','));
    const pcsOf = (k, sc) => new Set(GH.scales.pcs(N.pcOf(k), sc));
    const pentBad = [], npsBad = [];
    N.SHARP_NAMES.forEach(k => {
      const mp = pcsOf(k, 'minor_pent'), ae = pcsOf(k, 'aeolian');
      for (let b = 1; b <= 5; b++) { const ns = B_('pent-box', { key: k, box: String(b) }).notes; const midis = ns.slice(0, 12).map(n => n.midi); if (ns.length !== 24 || !midis.every((m, i) => mp.has(m % 12) && (i === 0 || m > midis[i - 1]))) pentBad.push(k + b); }
      for (let q = 1; q <= 7; q++) { const ns = B_('legato-3nps', { key: k, pos: String(q) }).notes; const midis = ns.slice(0, 18).map(n => n.midi); if (ns.length !== 36 || !midis.every((m, i) => ae.has(m % 12) && (i === 0 || m > midis[i - 1])) || ns.filter((n, i) => i < 18 && i % 3 === 0).some(n => n.t)) npsBad.push(k + q); }
    });
    ok(!pentBad.length, 'guitar pentatonic boxes 12 keys × 5 (in scale, ascending) ' + pentBad.join(','));
    ok(!npsBad.length, 'guitar 3NPS 12 keys × 7 (in scale, picked first of each string) ' + npsBad.join(','));
    ok(new Set(GH.data.techPerms).size === 24 && GH.data.techAllPerms.every(p => GH.data.techPerms.includes(p)), 'guitar 24 finger permutations');
    ok(B_('pick-open').notes.every((n, i) => n.pk === (i % 2 ? 'u' : 'd')) && B_('pick-cross', { pick: 'u' }).notes[0].pk === 'u', 'guitar alternate picking d/u, start up');
    const tr = B_('trill').notes;
    ok(tr.length === 48 && tr.filter(n => n.pk).length === 6 && Math.abs(tr.reduce((a, e) => a + e.d, 0) - 12) < 1e-6, 'guitar trill: 6 pairs, one pick each, 3 bars');
    const pm = B_('perm', { perm: '1423', fret: '7' }).notes;
    ok(pm.slice(0, 4).map(n => n.fg).join('') === '1423' && pm.slice(0, 4).map(n => n.f).join(',') === '7,10,8,9', 'guitar perm 1-4-2-3 at fret 7');
    /* 베이스 */
    const bScaleBad = N.SHARP_NAMES.filter(k => { const ns = B_('b-major', { key: k }).notes; const r = ns[0].midi; return ns.slice(0, 8).map(n => n.midi - r).join(',') !== '0,2,4,5,7,9,11,12' || ns[0].fg !== 2 || !ns.every(n => n.fg >= 1 && n.fg <= 4); });
    ok(!bScaleBad.length, 'bass major scale 12 keys (intervals, root on finger 2) ' + bScaleBad.join(','));
    const arp7 = B_('b-arp7', { key: 'C' }).notes.map(n => N.mod(n.midi, 12));
    ok(arp7.slice(0, 12).join(',') === '2,5,9,0,7,11,2,5,0,4,7,11', 'bass ii–V–I chord tones in C');
    const walk = B_('b-walk', { key: 'F' }).notes;
    ok([0, 1, 2, 3].every(b => { const nextRoot = walk[((b + 1) % 4) * 4].midi; return Math.abs(walk[b * 4 + 3].midi - nextRoot) === 1; }), 'bass walking: beat 4 is a half step from the next root');
    ok(B_('b-open').notes.every((n, i) => n.pk === (i % 2 ? 'm' : 'i')) && B_('b-slap').notes.some(n => n.pk === 'T') && B_('b-dead').notes.some(n => n.x), 'bass i/m alternation, slap T/P, dead notes');
    /* 키보드 */
    const hn = B_('k-hanon', { hands: 'rh' }).rh;
    ok(hn.slice(0, 8).map(n => n.m[0]).join(',') === '60,64,65,67,69,67,65,64' && hn.slice(0, 8).map(n => n.fg[0]).join('') === '12345432' && hn.length === 112, 'keys Hanon No.1 figure (C E F G A G F E, 1-2-3-4-5-4-3-2)');
    const ks = B_('k-scale', { key: 'C', hands: 'both' });
    ok(ks.rh.length === 29 && ks.rh.slice(0, 15).map(n => n.fg[0]).join('') === '123123412312345' && ks.lh.slice(0, 15).map(n => n.fg[0]).join('') === '543213214321321' && ks.rh[14].m[0] === 84, 'keys C major 2-octave scale fingering (RH · LH)');
    ok(B_('k-scale', { key: 'F' }).rh.slice(0, 15).map(n => n.fg[0]).join('') === '123412312341234', 'keys F major RH fingering');
    const cad = B_('k-cadence', { key: 'C' }).rh.map(n => n.m.join('-'));
    ok(cad.join(' ') === '60-64-67 60-65-69 59-62-67 60-64-67' && B_('k-cadence', { key: 'C', mode: 'minor' }).rh[2].m.includes(59), 'keys cadence I–IV–V–I voicings, minor V with leading tone');
    const kc = B_('k-chrom').rh; ok(kc.length === 48 && kc.every((n, i) => i === 0 || Math.abs(n.m[0] - kc[i - 1].m[0]) === 1) && kc[1].fg[0] === 3, 'keys chromatic scale (half steps, 3 on black keys)');
    const alb = B_('k-alberti'); ok(Math.abs(alb.rh.reduce((a, n) => a + n.d, 0) - alb.lh.reduce((a, n) => a + n.d, 0)) < 1e-6 && alb.seq.length > 16, 'keys Alberti bass: hands same length, merged onsets');
    /* 드럼 */
    const para = B_('d-para', { rh: '16' }).seq;
    ok(para.slice(0, 8).map(s => s.st).join('') === 'RLRRLRLL' && para[0].hits[0].acc && !para[1].hits[0].acc && para[4].hits[0].acc, 'drums paradiddle sticking & accents');
    const b8 = B_('d-8beat').seq; ok(b8.length === 16 && b8[2].hits.some(x => x.k === 'snare') && b8[0].hits.some(x => x.k === 'kick') && b8.every(s => s.hits.some(x => x.k === 'hat')), 'drums 8-beat groove lanes');
    const sw = B_('d-swing').seq; ok(Math.abs(sw[0].d - 1 / 3) < 1e-9 && sw[3].hits.some(x => x.k === 'pedal') && sw[5].hits.some(x => x.k === 'ride'), 'drums swing ride triplets + hi-hat 2 · 4');
    const lin = B_('d-linear').seq; ok(lin.every(s => s.hits.length === 1), 'drums linear: one limb per slot');
    const dCombo = TD.filter(e => e.cat === 'd-combo'), dChop = TD.filter(e => e.cat === 'd-chop');
    ok(dCombo.length >= 6 && dChop.length >= 6 && dCombo.every(e => { const q = B_(e.id).seq; return !e.handsOnly && q.some(s => s.st === 'K' && s.hits.some(x => x.k === 'kick')) && q.some(s => /[RL]/.test(s.st || '')); }), 'drums combinations: hands + kick in one line (' + dCombo.length + ' combos · ' + dChop.length + ' chops)');
    const rlk = B_('d-rlk').seq; ok(Math.abs(rlk[0].d - 1 / 3) < 1e-9 && rlk.slice(0, 6).map(s => s.st).join('') === 'RLKRLK' && rlk[2].hits[0].k === 'kick' && rlk[0].hits[0].acc, 'drums R L K triplet combo');
    const toms = B_('d-rlk-toms').seq; ok(['snare', 'tom1', 'tom2', 'tom3'].every((k, b) => toms[b * 3].hits[0].k === k) && toms[2].hits[0].k === 'kick', 'drums R L K around the toms');
    const t34 = B_('d-3over4').seq; ok(t34.length === 48 && t34.every((s, i) => !!s.hits[0].acc === (i % 3 === 0)), 'drums 3 over 4 accents every three 16ths');
    ok(B_('d-six').seq.slice(0, 6).map(s => s.st).join('') === 'RLLRRL' && dChop.filter(e => e.handsOnly).length >= 5 && !byT('d-six-kit').handsOnly, 'drums chops: six stroke roll, hands-only flags');
    /* 보컬 */
    const v5 = B_('v-five', { voice: 'alto', steps: '5' });
    ok(v5.seq[0].midi === 60 && v5.seq[0].syl === '도' && v5.seq[4].syl === '솔' && v5.trs.join(',') === '0,1,2,3,4,5,4,3,2,1', 'vocal 5-tone scale: starts on C, solfège, key steps up & down');
    ok(B_('v-five', { voice: 'bari' }).seq[0].midi === 48 && B_('v-five', { syl: 'vowel' }).seq[1].syl === '아', 'vocal voice range & vowel option');
    const oG = T.options(byT('v-five'), { voice: 'alto', start: 'G' }), vG = T.build(byT('v-five'), oG);
    const oGm = T.options(byT('v-five'), { voice: 'alto', start: 'G', syl: 'solfa' });
    ok(vG.seq[0].midi === 55 && vG.seq[0].name === 'G' && vG.seq[0].syl === '솔' && vG.seq[2].name === 'B' && vG.seq[2].syl === '시' && T.build(byT('v-five'), oGm).seq[0].syl === '도', 'vocal start key G: note names and fixed-do lyrics follow the notes, movable-do on request');
    const o5 = T.options(byT('v-five'), {}), L2 = T.vocalLabels(T.build(byT('v-five'), o5), o5, 2);
    ok(L2[0].name === 'D' && L2[0].syl === '레' && L2[2].name === 'F#' && L2[2].syl === '파♯', 'vocal key step +2: sheet names and lyrics move to D major');
    const ohb = T.options(byT('v-harmony-below'), {}); ok(ohb.guide === 'line' && T.options(byT('v-harmony'), {}).guide === 'line' && T.options(byT('v-five'), {}).guide === 'mine', 'vocal harmony drills: piano plays the other line by default');
    const vh = B_('v-harmony').seq; ok(vh.slice(0, 8).every(s => s.gmidi != null && (s.midi - s.gmidi === 3 || s.midi - s.gmidi === 4)), 'vocal harmony: sung line a diatonic 3rd above the guide');
    ok(B_('v-chrom').seq.slice(8).some(s => /♭/.test(s.syl)), 'vocal chromatic: flats on the way down');
    /* 그림 · 악보 */
    const kit = GH.render.drumkit(); kit.highlight([{ k: 'snare', st: 'L' }]);
    ok(kit.el.querySelectorAll('.kit-pad').length === 9 && kit.el.querySelector('.kit-snare.cur .kit-hand').textContent === 'L', 'drum kit view: 9 pads, highlight with sticking');
    const pno = GH.render.piano({ from: 48, to: 72 }); pno.highlightMany([60, 64]); ok(pno.querySelectorAll('g.current').length === 2, 'piano highlightMany');
    const fb4 = GH.render.fretboard({ tuning: GH.data.techBassTuning, from: 0, to: 5, notes: [{ s: 4, f: 3, label: '1' }] }); ok(fb4.svg.querySelectorAll('.stringname').length === 4, 'fretboard with 4 strings (bass)');
    const tab4 = GH.render.tab({ notes: B_('b-chroma').notes.slice(0, 8) }, { strings: 4 }); ok(tab4.el.querySelectorAll('.finger').length === 8, 'bass TAB (4 strings) with fingers');
    const tabT = GH.render.tab({ notes: pm.slice(0, 8) }, {});
    ok(tabT.el.querySelectorAll('.finger').length === 8 && tabT.el.querySelectorAll('.pick').length === 8, 'tab shows fingers and picks');
    if (window.Vex) {
      const shB = GH.render.sheet({ kind: 'drum', slots: B_('d-8beat').seq }); ok(!!shB, 'drum sheet renders');
      const shK = GH.render.sheet({ kind: 'grand', rh: ks.rh.map(n => ({ at: n.at, d: n.d, m: n.m, fg: n.fg.join('') })), lh: ks.lh.map(n => ({ at: n.at, d: n.d, m: n.m })) }); ok(!!shK, 'grand staff renders');
    }
    ok(GH.search.query('신경분리').some(x => x.route === '#/technique/guitar/perm' || x.route === '#/technique/guitar'), 'search 신경분리');
    ok(GH.search.query('하논').some(x => x.route === '#/technique/keys/k-hanon') && GH.search.query('패러디들').some(x => /technique\/drums/.test(x.route)) && GH.search.query('찹').some(x => x.route === '#/drums/chops'), 'search 하논 · 패러디들 · 찹');
    /* 세션 설문 */
    const GG = GH.guide;
    ok(GG.SESSIONS.length === 5 && GG.plan({ level: 'new', goals: ['guitar', 'rhythm'], sessions: ['drums'] }).every(m => !m.inst || m.inst.includes('drums')) && GG.plan({ level: 'new', goals: ['guitar', 'rhythm'], sessions: ['drums'] }).some(m => m.inst && m.inst.includes('drums')), 'guide: drum session → drum missions, no guitar-only missions');
    ok(GG.plan({ level: 'new', goals: ['guitar'], sessions: [] }).every(m => !m.inst || m.inst.includes('guitar')), 'guide: no session chosen → guitar (as before)');
    ok(GG.levelText(GG.LEVELS[1], 'drums').ko === '기본 비트는 쳐요' && GG.levelText(GG.LEVELS[1], 'guitar').ko === '코드 몇 개는 잡아요', 'guide: level text per session');
    /* 용어집 분류 */
    ok(GH.data.glossaryCats.length >= 8 && GH.data.glossary.every(g => GH.data.glossaryCats.some(c => c.id === g.cat && c.terms.includes(g.ko))), 'glossary: every term in exactly a named category');
    /* 멜로디 격자 → 코드 진행 추천 */
    const MG = GH.melodyGrid; const ex = MG.EXAMPLES.twinkle.notes.map(([s, l, m]) => ({ s, l, m }));
    const mst = MG.state(); Object.assign(mst, { bars: 4, res: 2, hr: 1, sevenths: false });
    const gk = MG.guessKeys(ex); ok(gk[0].pc === 0, 'melody grid: key of 작은 별 = C');
    const pr = MG.progressions(ex, 'C');
    ok(pr.length === 5 && new Set(pr.map(p => p.chords.map(c => c.symbol).join(' '))).size === 5 && pr.every((p, i) => i === 0 || p.score <= pr[i - 1].score + 1e-9), 'melody grid: 5 distinct ranked progressions');
    ok(pr[0].chords.length === 4 && pr[0].chords[0].symbol === 'C' && pr[0].chords[3].symbol === 'C' && pr[0].pct >= 70, 'melody grid: top progression starts and ends on C (' + pr[0].chords.map(c => c.symbol).join(' ') + ', ' + pr[0].pct + '%)');
    Object.assign(mst, { hr: 2 }); ok(MG.progressions(ex, 'C')[0].chords.length === 8, 'melody grid: two chords per bar'); Object.assign(mst, { hr: 1 });
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
      '/songs/:id/bar/:bar': { id: 'autumn', bar: '2' },
      '/technique/:inst/:id': { inst: 'guitar', id: 'chroma-1234' },
      '/technique/:inst': { inst: 'guitar' }
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
    GH.data.technique.forEach(x => { variants.push(['/technique/:inst/:id', { inst: x.inst, id: x.id, query: {} }]); variants.push(['/technique/:inst/:id', { inst: x.inst, id: x.id, query: { rh: '16', key: 'E', box: '5', pos: '7', fret: '12', perm: '4312', pick: 'u', string: '4', hands: 'both', oct: '2', mode: 'minor', kick: 'v5', voice: 'bari', steps: '8', syl: 'vowel', guide: 'off' } }]); });
    GH.data.techInst.forEach(I => variants.push(['/technique/:inst', { inst: I.id, query: {} }]));
    variants.push(['/technique/:inst/:id', { inst: 'guitar', id: 'perm', query: { routine: 'g-mid', step: '2' } }], ['/technique/:inst/:id', { inst: 'guitar', id: 'nope', query: {} }], ['/technique/:inst', { inst: 'guitar', query: { r: 'g-hard' } }], ['/technique/:inst', { inst: 'nope', query: {} }], ['/technique/:inst/:id', { inst: 'bass', id: 'chroma-1234', query: {} }]);
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
