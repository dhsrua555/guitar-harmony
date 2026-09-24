/* 음이름, 피치 클래스, 인터벌 기초 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const mod = (n, m) => ((n % m) + m) % m;

  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const LETTER_SEMIS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const KO_NAMES = { C: '도', D: '레', E: '미', F: '파', G: '솔', A: '라', B: '시' };

  /* 인터벌 이름 → 도수, 반음 */
  const INTERVALS = {
    '1': { deg: 1, semi: 0 }, 'b2': { deg: 2, semi: 1 }, '2': { deg: 2, semi: 2 }, '#2': { deg: 2, semi: 3 },
    'b3': { deg: 3, semi: 3 }, '3': { deg: 3, semi: 4 }, 'b4': { deg: 4, semi: 4 }, '4': { deg: 4, semi: 5 }, '#4': { deg: 4, semi: 6 },
    'b5': { deg: 5, semi: 6 }, '5': { deg: 5, semi: 7 }, '#5': { deg: 5, semi: 8 }, 'b6': { deg: 6, semi: 8 }, '6': { deg: 6, semi: 9 },
    '#6': { deg: 6, semi: 10 }, 'bb7': { deg: 7, semi: 9 }, 'b7': { deg: 7, semi: 10 }, '7': { deg: 7, semi: 11 },
    'b9': { deg: 9, semi: 13 }, '9': { deg: 9, semi: 14 }, '#9': { deg: 9, semi: 15 }, '11': { deg: 11, semi: 17 }, '#11': { deg: 11, semi: 18 },
    'b13': { deg: 13, semi: 20 }, '13': { deg: 13, semi: 21 }
  };
  const DEG_REF = { 1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11, 9: 14, 11: 17, 13: 21 };
  const PERFECT = new Set([1, 4, 5, 11]);

  function parseNote(name) {
    if (!name) return null;
    const m = /^([A-Ga-g])(##|#|x|bb|b|♯|♭)?$/.exec(String(name).trim());
    if (!m) return null;
    const letter = m[1].toUpperCase();
    let acc = 0; const a = m[2] || '';
    if (a === 'x' || a === '##') acc = 2; else if (a === '#' || a === '♯') acc = 1; else if (a === 'bb') acc = -2; else if (a === 'b' || a === '♭') acc = -1;
    return { letter, acc, pc: mod(LETTER_SEMIS[letter] + acc, 12) };
  }
  const accStr = acc => acc > 0 ? '#'.repeat(acc) : acc < 0 ? 'b'.repeat(-acc) : '';
  function pcOf(name) { const p = parseNote(name); return p ? p.pc : null; }
  function noteName(pc, pref) { return (pref === 'flat' ? FLAT_NAMES : SHARP_NAMES)[mod(pc, 12)]; }
  function normalize(name) { const p = parseNote(name); return p ? p.letter + accStr(p.acc) : name; }
  function pretty(name) { return String(name).replace(/##/g, '𝄪').replace(/#/g, '♯').replace(/bb/g, '𝄫').replace(/(?<=.)b/g, '♭'); }

  /* 루트 + 인터벌 → 이론적으로 맞는 음이름 (예: Bb + b3 = Db, F# + 7 = E#) */
  function spell(rootName, iv) {
    const r = parseNote(rootName); const I = INTERVALS[iv];
    if (!r || !I) return noteName(mod((r ? r.pc : 0) + (I ? I.semi : 0), 12));
    const li = LETTERS.indexOf(r.letter);
    const tl = LETTERS[mod(li + I.deg - 1, 7)];
    const target = mod(r.pc + I.semi, 12);
    let acc = target - LETTER_SEMIS[tl];
    if (acc > 6) acc -= 12; if (acc < -6) acc += 12;
    if (Math.abs(acc) > 2) return noteName(target, acc > 0 ? 'sharp' : 'flat');
    return tl + accStr(acc);
  }
  function transpose(name, semis, pref) { const p = parseNote(name); return noteName(p.pc + semis, pref || (p.acc < 0 ? 'flat' : 'sharp')); }

  /* 인터벌 이름 → 한국어/영어 도수 이름 */
  function intervalKo(iv) {
    const I = INTERVALS[iv]; if (!I) return iv;
    const diff = I.semi - DEG_REF[I.deg];
    let q;
    if (PERFECT.has(I.deg)) q = diff === 0 ? '완전' : diff < 0 ? '감' : '증';
    else q = diff === 0 ? '장' : diff === -1 ? '단' : diff <= -2 ? '감' : '증';
    return q + I.deg + '도';
  }
  function intervalEn(iv) {
    const I = INTERVALS[iv]; if (!I) return iv;
    const diff = I.semi - DEG_REF[I.deg];
    let q;
    if (PERFECT.has(I.deg)) q = diff === 0 ? 'P' : diff < 0 ? 'd' : 'A';
    else q = diff === 0 ? 'M' : diff === -1 ? 'm' : diff <= -2 ? 'd' : 'A';
    return q + I.deg;
  }
  /* 철자가 있는 두 음 사이의 인터벌 이름. low → high, semis = 실제 반음 거리 (0 이상).
     예: ('B', 'F', 6) → { num: 5, q: 'd', en: 'd5', ko: '감5도' } */
  const SIMPLE_SEMI = [0, 2, 4, 5, 7, 9, 11];
  const Q_KO = { P: '완전', M: '장', m: '단', d: '감', A: '증', dd: '겹감', AA: '겹증' };
  function intervalBetween(lowName, highName, semis) {
    const a = parseNote(lowName), b = parseNote(highName);
    if (!a || !b || semis == null || semis < 0) return null;
    const steps = mod(LETTERS.indexOf(b.letter) - LETTERS.indexOf(a.letter), 7);
    const k = Math.max(0, Math.round((semis - SIMPLE_SEMI[steps]) / 12));
    const num = steps + 1 + 7 * k;
    const diff = semis - (SIMPLE_SEMI[steps] + 12 * k);
    const perfect = steps === 0 || steps === 3 || steps === 4;
    let q;
    if (perfect) q = diff === 0 ? 'P' : diff === -1 ? 'd' : diff === 1 ? 'A' : diff < 0 ? 'dd' : 'AA';
    else q = diff === 0 ? 'M' : diff === -1 ? 'm' : diff === -2 ? 'd' : diff === 1 ? 'A' : diff < 0 ? 'dd' : 'AA';
    return { num, q, en: q + num, ko: Q_KO[q] + num + '도', semis };
  }
  /* 음이름에 반음 변화를 더한다 (E + 1 → E#). 임시표가 3개 이상이 되면 이명동음으로 */
  function alter(name, delta, pref) {
    const p = parseNote(name); if (!p) return name;
    const acc = p.acc + delta;
    if (Math.abs(acc) > 2) return noteName(p.pc + delta, pref || (delta > 0 ? 'sharp' : 'flat'));
    return p.letter + accStr(acc);
  }
  /* 글자를 정해 두고 원하는 pc 가 되도록 임시표를 붙인다 (letter 'E', pc 5 → 'E#') */
  function spellLetter(letter, pc, pref) {
    let acc = mod(pc - LETTER_SEMIS[letter], 12); if (acc > 6) acc -= 12;
    if (Math.abs(acc) > 2) return noteName(pc, pref || 'sharp');
    return letter + accStr(acc);
  }
  function ivSemi(iv) { return INTERVALS[iv] ? INTERVALS[iv].semi : 0; }
  function ivPc(iv) { return mod(ivSemi(iv), 12); }
  /* 인터벌 색상 클래스 */
  function ivClass(iv) {
    if (!iv) return 'iv-x';
    if (iv === '1') return 'iv-1';
    if (/^(b3|3|b4)$/.test(iv)) return 'iv-3';
    if (/^(b5|5|#5)$/.test(iv)) return 'iv-5';
    if (/^(bb7|b7|7)$/.test(iv)) return 'iv-7';
    if (/(9|11|13|2|4|6)$/.test(iv)) return 'iv-t';
    return 'iv-s';
  }
  /* 텐션 표기를 단순 도수로 (9→2, 11→4, 13→6) 또는 반대로 */
  function simpleIv(iv) { return iv.replace('13', '6').replace('11', '4').replace('9', '2'); }
  function tensionIv(iv) { return iv.replace(/(^|b|#)6$/, '$113').replace(/(^|b|#)4$/, '$111').replace(/(^|b|#)2$/, '$19'); }

  /* 루트 pc 기준 pc → 인터벌 라벨 맵 */
  function labelMap(rootPc, intervals) {
    const map = {};
    intervals.forEach(iv => { const pc = mod(rootPc + ivSemi(iv), 12); if (map[pc] == null) map[pc] = iv; });
    return map;
  }
  /* 두 pc 사이의 인터벌 이름 (가장 단순한 이름) */
  function intervalName(rootPc, pc) {
    const d = mod(pc - rootPc, 12);
    return ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'][d];
  }

  /* MIDI, 주파수 */
  function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function midiName(m, pref) { return noteName(m % 12, pref) + (Math.floor(m / 12) - 1); }
  function midiFrom(name, octave) { return (octave + 1) * 12 + pcOf(name); }

  const ROOTS_SHARP = SHARP_NAMES.slice();
  const ROOTS_FLAT = FLAT_NAMES.slice();
  function rootList(pref) { return pref === 'flat' ? ROOTS_FLAT : ROOTS_SHARP; }
  /* 선호에 맞춰 루트 이름 정리 (D# ↔ Eb) */
  function rootFor(name, pref) { const p = parseNote(name); if (!p) return name; if (p.acc === 0) return p.letter; return noteName(p.pc, pref); }
  /* 코드 루트로 읽기 좋은 이름: 1,3,8,10 은 플랫 (Db Eb Ab Bb), 6 은 선호에 따라, 나머지는 자연음 */
  function niceName(pc, pref) { pc = mod(pc, 12); if ([1, 3, 8, 10].includes(pc)) return FLAT_NAMES[pc]; if (pc === 6) return pref === 'flat' ? 'Gb' : 'F#'; return SHARP_NAMES[pc]; }
  function koName(name) { const p = parseNote(name); if (!p) return name; return KO_NAMES[p.letter] + (p.acc > 0 ? '♯'.repeat(p.acc) : p.acc < 0 ? '♭'.repeat(-p.acc) : ''); }

  GH.notes = { LETTERS, LETTER_SEMIS, SHARP_NAMES, FLAT_NAMES, INTERVALS, parseNote, pcOf, noteName, normalize, pretty, spell, transpose,
    intervalKo, intervalEn, intervalBetween, alter, spellLetter, ivSemi, ivPc, ivClass, simpleIv, tensionIv, labelMap, intervalName, midiToFreq, midiName, midiFrom, rootList, rootFor, niceName, koName, mod };
})();
