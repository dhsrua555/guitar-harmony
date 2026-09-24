/* 멜로디 화음 쌓기: 멜로디의 각 음에 다이어토닉(스케일 안) 또는 평행(고정 반음) 보이스를 만든다 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const N = GH.notes; const mod = N.mod;

  /* 다이어토닉 간격: 스케일 도수를 몇 칸 옮기는지 */
  const SIZES = { 3: { steps: 2, ko: '3도' }, 4: { steps: 3, ko: '4도' }, 5: { steps: 4, ko: '5도' }, 6: { steps: 5, ko: '6도' }, 8: { steps: 7, ko: '옥타브' } };
  const SIZE_ORDER = ['3', '4', '5', '6', '8'];
  /* 평행 간격: 고정 반음 */
  const PARALLEL = { m3: { num: 3, semis: 3, ko: '마이너 3도' }, M3: { num: 3, semis: 4, ko: '메이저 3도' }, P4: { num: 4, semis: 5, ko: '퍼펙트 4도' }, P5: { num: 5, semis: 7, ko: '퍼펙트 5도' }, m6: { num: 6, semis: 8, ko: '마이너 6도' }, M6: { num: 6, semis: 9, ko: '메이저 6도' }, P8: { num: 8, semis: 12, ko: '옥타브' } };
  const PARALLEL_ORDER = ['m3', 'M3', 'P4', 'P5', 'm6', 'M6', 'P8'];

  const isHeptatonic = scaleId => { const s = GH.scales.get(scaleId); return !!s && s.intervals.length === 7; };

  /* 키 + 스케일의 도수 정보 */
  function scaleInfo(keyRoot, scaleId) {
    const notes = GH.scales.notes(keyRoot, scaleId);
    return { keyRoot: N.normalize(keyRoot), scaleId, notes, semis: notes.map(n => N.mod(N.ivSemi(n.iv), 12)), pcs: new Set(notes.map(n => n.pc)), letters: notes.map(n => N.parseNote(n.name).letter) };
  }

  /* 멜로디 한 음을 스케일 위치로 해석.
     스케일 음이면 alt = 0. 밖의 음이면 키 기준의 자연스러운 철자(b3, #4 …)를 정하고, 같은 글자의 스케일 음에서 몇 반음 변했는지(alt)를 기록한다. */
  const CHROMA = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7']; /* 스케일 밖 음의 기본 철자 */
  function locate(midi, info, given) {
    const pc = mod(midi, 12);
    let d = info.notes.findIndex(n => n.pc === pc);
    let name, alt = 0;
    if (d >= 0) name = info.notes[d].name;
    else {
      const keyPc = N.pcOf(info.keyRoot);
      const g = given ? N.parseNote(given) : null;
      name = g && g.pc === pc ? N.normalize(given) : N.spell(info.keyRoot, CHROMA[mod(pc - keyPc, 12)]);
      const letter = N.parseNote(name).letter;
      d = info.letters.indexOf(letter);
      if (d >= 0) { alt = mod(pc - info.notes[d].pc, 12); if (alt > 6) alt -= 12; }
      if (d < 0 || Math.abs(alt) > 2) {
        /* 글자가 맞지 않으면 가장 가까운 아래 스케일 음에서 올린 것으로 본다 */
        let best = 0, bestUp = 12;
        info.notes.forEach((n, j) => { const up = mod(pc - n.pc, 12); if (up < bestUp) { bestUp = up; best = j; } });
        d = best; alt = bestUp; name = N.alter(info.notes[d].name, alt);
      }
    }
    const ref = midi - alt;                    /* 기준이 되는 스케일 음의 실제 높이 */
    const tonic = ref - info.semis[d];         /* 그 옥타브의 으뜸음 높이 */
    const label = (alt > 0 ? '#'.repeat(alt) : alt < 0 ? 'b'.repeat(-alt) : '') + info.notes[d].label;
    return { midi, pc, name, degree: d, alt, tonic, label, outOfScale: alt !== 0 };
  }

  /* 한 음에 대한 보이스 음. cfg: {mode: 'diatonic'|'parallel', size: '3', par: 'M3', dir: 1|-1} */
  function voiceNote(m, cfg, info) {
    const dir = cfg.dir < 0 ? -1 : 1;
    let midi, name;
    if (cfg.mode === 'parallel') {
      const P = PARALLEL[cfg.par] || PARALLEL.M3;
      midi = m.midi + dir * P.semis;
      const li = N.LETTERS.indexOf(N.parseNote(m.name).letter);
      const letter = N.LETTERS[mod(li + dir * (P.num - 1), 7)];
      name = N.spellLetter(letter, mod(midi, 12));
    } else {
      const steps = (SIZES[cfg.size] || SIZES[3]).steps * dir;
      const t = m.degree + steps; const oct = Math.floor(t / 7); const ti = mod(t, 7);
      midi = m.tonic + info.semis[ti] + 12 * oct + m.alt;
      name = N.alter(info.notes[ti].name, m.alt);
    }
    const lowName = dir > 0 ? m.name : name, highName = dir > 0 ? name : m.name;
    const iv = N.intervalBetween(lowName, highName, Math.abs(midi - m.midi));
    /* 소리가 스케일 음과 같아도 철자가 다르면 (E# ≠ F) 스케일 밖으로 본다 */
    const inScale = info.notes.some(n => n.pc === mod(midi, 12) && N.normalize(n.name) === N.normalize(name));
    return { midi, name, iv, outOfScale: !inScale, shifted: m.alt !== 0 };
  }

  /* midis + 키/스케일 + 보이스 설정들 → { info, melody: [locate], voices: [[voiceNote]] }. names: 입력한 철자 (선택) */
  function build(midis, keyRoot, scaleId, cfgs, names) {
    const info = scaleInfo(keyRoot, isHeptatonic(scaleId) ? scaleId : 'ionian');
    const melody = midis.map((m, i) => locate(m, info, names && names[i]));
    const voices = (cfgs || []).map(cfg => melody.map(m => voiceNote(m, cfg, info)));
    return { info, melody, voices };
  }
  const cfgLabel = cfg => cfg.mode === 'parallel' ? '평행 ' + (PARALLEL[cfg.par] || PARALLEL.M3).ko + (cfg.dir < 0 ? ' 아래' : ' 위') : '다이어토닉 ' + (SIZES[cfg.size] || SIZES[3]).ko + (cfg.dir < 0 ? ' 아래' : ' 위');

  GH.harmony = { SIZES, SIZE_ORDER, PARALLEL, PARALLEL_ORDER, isHeptatonic, scaleInfo, locate, voiceNote, build, cfgLabel };
})();
