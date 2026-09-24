/* 솔로 프레이즈 만들기: 코드톤 타겟 + 어프로치 / 인클로저 / 패싱 / 이웃음으로 진행 위의 라인을 만든다 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const N = GH.notes; const mod = N.mod;

  const TARGETS = { auto: '가이드 톤 (3음·7음 중 가까운 쪽)', 3: '3음', 7: '7음', 1: '루트', 5: '5음' };
  const APPROACHES = {
    none: { ko: '없음 (바로 도착)', notes: 0 },
    below: { ko: '반음 아래 어프로치', notes: 1 },
    above: { ko: '반음 위 어프로치', notes: 1 },
    scaleAbove: { ko: '스케일 위 어프로치', notes: 1 },
    scaleBelow: { ko: '스케일 아래 어프로치', notes: 1 },
    enclosure: { ko: '인클로저 (스케일 위 → 반음 아래)', notes: 2 },
    enclosureChrom: { ko: '크로매틱 인클로저 (반음 위 → 반음 아래)', notes: 2 },
    doubleBelow: { ko: '더블 크로매틱 (아래에서 반음씩 둘)', notes: 2 },
    doubleAbove: { ko: '더블 크로매틱 (위에서 반음씩 둘)', notes: 2 }
  };
  const FILLERS = { arpeggio: '아르페지오 (코드톤으로 채우기)', scale: '스케일로 채우기', passing: '스케일 + 반음 패싱 노트', neighbor: '이웃음 (타겟 주변 맴돌기)' };
  const ROLES = {
    target: { ko: '타겟', en: 'T', desc: '강박에 놓는 코드톤' },
    ct: { ko: '코드톤', en: 'CT', desc: '코드 구성음' },
    st: { ko: '스케일음', en: 'S', desc: '코드 스케일 안의 음' },
    pt: { ko: '패싱', en: 'P', desc: '두 음 사이를 반음으로 잇는 경과음' },
    ap: { ko: '어프로치', en: 'A', desc: '다음 타겟 바로 앞에서 반음·스케일로 다가가는 음' },
    en: { ko: '인클로저', en: 'E', desc: '타겟을 위아래에서 감싸는 음' },
    nt: { ko: '이웃음', en: 'N', desc: '타겟에서 한 칸 벗어났다 돌아오는 음' }
  };

  /* 코드가 키 안에 있으면 키의 음 집합, 아니면 그 코드의 기본 코드 스케일 */
  function chordScalePcs(chord, keyPc, mode) {
    const keyPcs = GH.scales.pcs(keyPc, mode === 'minor' ? 'aeolian' : 'ionian');
    if (chord.pcs.every(p => keyPcs.includes(p))) return keyPcs;
    const fit = GH.scales.forChord(chord.qId)[0];
    return fit ? GH.scales.pcs(chord.rootPc, fit.scale.id) : keyPcs;
  }
  const nearestPc = (pc, ref) => { let m = ref - mod(ref - pc, 12); if (ref - m > 6) m += 12; return m; };
  function toneOf(chord, which) {
    const find = re => chord.notes.find(n => re.test(n.iv));
    const pick = which === '3' ? find(/^(b3|3|4|2)$/) : which === '7' ? (find(/^(bb7|b7|7)$/) || find(/^6$/) || find(/^(b3|3)$/)) : which === '5' ? find(/^(b5|5|#5)$/) : find(/^1$/);
    return pick || chord.notes[0];
  }
  function clamp(m, lo, hi) { while (m < lo) m += 12; while (m > hi) m -= 12; return m; }

  /* 타겟 음 목록 (보이스 리딩: 앞 타겟에서 가장 가까운 옥타브) */
  function targets(chords, o) {
    let ref = o.start; const out = [];
    chords.forEach(c => {
      let cand;
      if (o.target === 'auto') cand = [toneOf(c, '3'), toneOf(c, '7')];
      else cand = [toneOf(c, String(o.target))];
      let best = null;
      cand.forEach(n => { const m = clamp(nearestPc(n.pc, ref), o.lo, o.hi); if (!best || Math.abs(m - ref) < Math.abs(best.m - ref)) best = { m, n }; });
      out.push(best); ref = best.m;
    });
    return out;
  }
  function scaleStep(m, pcs, dir) { let x = m; for (let k = 0; k < 12; k++) { x += dir; if (pcs.includes(mod(x, 12))) return x; } return m + dir; }
  function approach(kind, t, pcs) {
    switch (kind) {
      case 'below': return [[t - 1, 'ap']];
      case 'above': return [[t + 1, 'ap']];
      case 'scaleAbove': return [[scaleStep(t, pcs, 1), 'ap']];
      case 'scaleBelow': return [[scaleStep(t, pcs, -1), 'ap']];
      case 'enclosure': return [[scaleStep(t, pcs, 1), 'en'], [t - 1, 'en']];
      case 'enclosureChrom': return [[t + 1, 'en'], [t - 1, 'en']];
      case 'doubleBelow': return [[t - 2, 'ap'], [t - 1, 'ap']];
      case 'doubleAbove': return [[t + 2, 'ap'], [t + 1, 'ap']];
      default: return [];
    }
  }
  /* a 에서 시작해 goal 쪽으로 count 개 음을 채운다 (a 는 포함하지 않음) */
  function fill(kind, a, goal, count, chordPcs, scalePcs, o, side) {
    const out = []; let cur = a; let dir = goal >= a ? 1 : -1; if (goal === a) dir = 1;
    const pool = kind === 'arpeggio' ? chordPcs : scalePcs;
    /* 목표가 출발음과 거의 같으면 제자리에서 맴돌지 않도록 올라갔다 내려오는 아치 모양으로 */
    if (kind !== 'neighbor' && Math.abs(goal - a) <= 2 && count >= 3) {
      /* side: 어프로치가 들어오는 쪽. 끝음을 목표보다 한 칸 바깥(end)에 두면 어프로치로 자연스럽게 되돌아온다 */
      let sd = side || 1; if ((sd > 0 && a + 7 > o.hi) || (sd < 0 && a - 7 < o.lo)) sd = -sd;
      const end = scaleStep(goal, pool, sd);
      let e = 0, x = a; while ((sd > 0 ? x < end : x > end) && e < 12) { x = scaleStep(x, pool, sd); e++; }
      const k = Math.min(count, Math.ceil((count + e) / 2));
      for (let i = 0; i < count; i++) { cur = scaleStep(cur, pool, i < k ? sd : -sd); out.push([cur, null]); }
      return out;
    }
    for (let k = 0; k < count; k++) {
      if (kind === 'neighbor') {
        const phase = k % 4; /* 위 이웃 → 타겟 → 아래(반음) 이웃 → 타겟 */
        const m = phase === 0 ? scaleStep(a, scalePcs, 1) : phase === 2 ? a - 1 : a;
        out.push([m, phase === 1 || phase === 3 ? 'ct' : 'nt']); cur = m; continue;
      }
      /* 목표에서 너무 멀어지면 목표 쪽으로 방향을 돌린다 (라인이 다음 어프로치 근처에 머물도록) */
      const reach = kind === 'arpeggio' ? 5 : 3;
      const toward = goal >= cur ? 1 : -1;
      if (dir !== toward && Math.abs(cur - goal) >= reach) dir = toward;
      let next = scaleStep(cur, pool, dir);
      /* 목표를 지나치거나 음역을 벗어나면 방향을 바꾼다 */
      if ((dir > 0 && next > goal && cur <= goal && k < count - 1) || next > o.hi) { dir = -1; next = scaleStep(cur, pool, dir); }
      else if ((dir < 0 && next < goal && cur >= goal && k < count - 1) || next < o.lo) { dir = 1; next = scaleStep(cur, pool, dir); }
      let role = null;
      if (kind === 'passing' && k % 2 === 0 && Math.abs(next - cur) === 2) { next = cur + dir; role = 'pt'; }
      out.push([next, role]); cur = next;
    }
    return out;
  }
  /* chords: 코드 객체 [{root, rootPc, qId, notes, pcs, beats, symbol}]
     o: {key, mode, target, approach, filler, step(박, 기본 0.5), lo, hi, start}
     반환: [{midi, d, role, ci, ch?}] */
  function build(chords, o) {
    o = Object.assign({ target: 'auto', approach: 'below', filler: 'scale', step: 0.5, lo: 52, hi: 76, start: 64, mode: 'major' }, o || {});
    const keyPc = N.pcOf(o.key || 'C');
    const T = targets(chords, o);
    const line = [];
    chords.forEach((c, ci) => {
      const beats = c.beats || 4; const slots = Math.max(1, Math.round(beats / o.step));
      const cPcs = c.pcs; const sPcs = chordScalePcs(c, keyPc, o.mode);
      const t = T[ci].m;
      const push = (m, role, d) => line.push({ midi: clamp(m, o.lo - 2, o.hi + 2), d: d || o.step, role, ci });
      if (ci === chords.length - 1) { push(t, 'target', beats); return; }
      const next = chords[ci + 1]; const nt = T[ci + 1].m;
      let ap = approach(o.approach, nt, chordScalePcs(next, keyPc, o.mode));
      if (ap.length > slots - 1) ap = ap.slice(ap.length - (slots - 1));
      const mid = slots - 1 - ap.length;
      push(t, 'target');
      const goal = ap.length ? ap[0][0] : nt;
      const fills = fill(o.filler, t, goal, mid, cPcs, sPcs, o, ap.length ? (goal >= nt ? 1 : -1) : 1);
      /* 어프로치 첫 음과 같은 음이 바로 앞에 오면 한 칸 비켜 준다 (같은 음 반복 방지) */
      if (fills.length && fills[fills.length - 1][0] === goal) {
        const prev = fills.length > 1 ? fills[fills.length - 2][0] : t;
        let alt = scaleStep(goal, sPcs, goal >= nt ? 1 : -1); if (alt === prev) alt = scaleStep(goal, sPcs, goal >= nt ? -1 : 1);
        fills[fills.length - 1] = [alt, null];
      }
      fills.forEach(([m, role]) => push(m, role));
      ap.forEach(([m, role]) => push(m, role));
    });
    /* 역할이 비어 있는 음은 실제 음으로 분류 */
    line.forEach(n => {
      const c = chords[n.ci]; const pc = mod(n.midi, 12);
      if (!n.role) n.role = c.pcs.includes(pc) ? 'ct' : chordScalePcs(c, keyPc, o.mode).includes(pc) ? 'st' : 'pt';
      const lm = N.labelMap(c.rootPc, c.quality.intervals);
      n.iv = lm[pc] || N.tensionIv(N.intervalName(c.rootPc, pc));
    });
    let prevCi = -1; line.forEach(n => { if (n.ci !== prevCi) { n.ch = chords[n.ci].symbol; prevCi = n.ci; } });
    return line;
  }
  GH.phrase = { TARGETS, APPROACHES, FILLERS, ROLES, build, chordScalePcs };
})();
