/* 기본기 연습 · 베이스 (4현 E A D G)
   gen(o) → [{s 줄(1=G · 4=E), f 프렛, fg 왼손 손가락, x 데드 노트, pk 오른손 표시(없으면 i · m 교대), label 도수}] */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  GH.data = GH.data || {};
  const TUN = [28, 33, 38, 43];                              /* 4번 줄(E1) → 1번 줄(G2) */
  const midiOf = (s, f) => TUN[4 - s] + f;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const nt = (s, f, fg, extra) => Object.assign({ s, f, fg }, extra || {});
  const N = () => GH.notes;
  /* 조의 루트를 E · A 줄에서 편한 자리(3~10프렛)에 */
  function keyRoot(key) {
    const pc = N().pcOf(key || 'C');
    const e = N().mod(pc - 4, 12), a = N().mod(pc - 9, 12);
    const ef = e < 3 ? e + 12 : e, af = a < 3 ? a + 12 : a;
    return Math.abs(ef - 6.5) <= Math.abs(af - 6.5) ? { s: 4, f: ef, midi: 28 + ef } : { s: 3, f: af, midi: 33 + af };
  }
  /* 진행의 코드 루트: E · A 줄 1~12프렛에서 가장 낮은 음 (악보가 오선 안에 머물고 로우 포지션에서 치게),
     같은 음이 두 자리면 앞 코드 자리에 가까운 쪽 */
  function lowRoot(pc, near) {
    const c = [];
    [[4, 28], [3, 33]].forEach(([s, base]) => { for (let f = N().mod(pc - base, 12); f <= 12; f += 12) if (f >= 1) c.push({ s, f, midi: base + f }); });
    c.sort((a, b) => a.midi - b.midi || Math.abs(a.f - near) - Math.abs(b.f - near) || b.s - a.s);
    return c[0];
  }
  /* 코드 루트: E · A 줄 중 near 프렛에 더 가까운 자리 (1프렛 이상) */
  function rootNear(pc, near) {
    const c = [];
    [[4, 28], [3, 33]].forEach(([s, base]) => { for (let f = N().mod(pc - base, 12); f <= 15; f += 12) if (f >= 1) c.push({ s, f, midi: base + f }); });
    c.sort((a, b) => Math.abs(a.f - near) - Math.abs(b.f - near) || b.s - a.s);
    return c[0];
  }
  /* 모양: [줄 차이(-1 = 한 줄 위), 프렛 차이, 손가락, 도수] */
  const SHAPE = {
    maj: [[0, 0, 2, '1'], [-1, -1, 1, '3'], [-1, 2, 4, '5'], [-2, 2, 4, '1']],
    min: [[0, 0, 1, '1'], [0, 3, 4, 'b3'], [-1, 2, 3, '5'], [-2, 2, 3, '1']],
    dom7: [[0, 0, 2, '1'], [-1, -1, 1, '3'], [-1, 2, 4, '5'], [-2, 0, 2, 'b7']],
    m7: [[0, 0, 1, '1'], [0, 3, 4, 'b3'], [-1, 2, 3, '5'], [-2, 0, 1, 'b7']],
    maj7: [[0, 0, 2, '1'], [-1, -1, 1, '3'], [-1, 2, 4, '5'], [-2, 1, 3, '7']],
    r58: [[0, 0, 1, '1'], [-1, 2, 3, '5'], [-2, 2, 3, '1']]
  };
  const shapeAt = (root, q) => SHAPE[q].map(([ds, df, fg, lb]) => nt(root.s + ds, root.f + df, root.f + df === 0 ? 0 : fg, { label: lb }));   /* 개방현이면 손가락 0 */
  /* 창(P ~ P+3) 안에서 음 찾기: 낮은 줄 먼저 */
  function place(midi, P) {
    for (const [lo, hi] of [[P, P + 3], [P - 1, P + 4]]) {
      for (let s = 4; s >= 1; s--) { const f = midi - TUN[4 - s]; if (f >= Math.max(0, lo) && f <= hi) return nt(s, f, f === 0 ? 0 : clamp(f - P + 1, 1, 4)); }
    }
    let best = null; for (let s = 4; s >= 1; s--) { const f = midi - TUN[4 - s]; if (f >= 0 && f <= 20 && (!best || Math.abs(f - P) < Math.abs(best.f - P))) best = nt(s, f, f === 0 ? 0 : clamp(f - P + 1, 1, 4)); }
    return best;
  }
  const PROG = { pop: [[0, 'maj'], [9, 'min'], [5, 'maj'], [7, 'maj']] };
  /* 코드 이름: 키 안의 도수(반음)와 코드 종류로 철자 그대로 (C 키 9 → Am) */
  const DEG_IV = { 0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7' };
  const Q_ID = { maj: 'maj', min: 'min', m7: 'm7', dom7: '7', maj7: 'maj7' };
  const symOf = (key, deg, q) => GH.chords.symbol(N().spell(key, DEG_IV[N().mod(deg, 12)]), Q_ID[q] || q);
  const chordsOf = (key, list) => { let near = 3; return list.map(([deg, q]) => { const root = lowRoot(N().mod(N().pcOf(key) + deg, 12), near); near = root.f; return { root, q, sym: symOf(key, deg, q) }; }); };
  /* 코드가 바뀌는 첫 음에 코드 이름 (ch) — 악보 위에 적고, 연습 중 "지금 코드"로 보여 준다 */
  const tag = (out, i, sym) => { if (out[i]) out[i] = Object.assign({}, out[i], { ch: sym }); };

  const CATS = [
    { id: 'b-hand', inst: 'bass', ko: '오른손 · 운지', en: 'TECHNIQUE', icon: 'bass', desc: '검지 · 중지를 번갈아 치는 투핑거와, 한 손가락 한 프렛 · 시만들 1-2-4 운지를 익혀요.' },
    { id: 'b-tone', inst: 'bass', ko: '스케일 · 코드톤', en: 'SCALE · ARPEGGIO', icon: 'scale', desc: '루트를 가운뎃손가락에 두는 고정 포지션으로 메이저 스케일과 코드톤(1-3-5-7)을 지판에 새겨요.' },
    { id: 'b-groove', inst: 'bass', ko: '그루브', en: 'GROOVE', icon: 'drum', desc: '루트 · 5도 · 옥타브, 데드 노트, 슬랩으로 드럼과 맞물리는 리듬을 만들어요.' },
    { id: 'b-walk', inst: 'bass', ko: '워킹 베이스', en: 'WALKING', icon: 'progression', desc: '4분음표로 코드톤과 반음 어프로치를 이어 재즈 진행 위를 걸어가요.' }
  ];
  const EX = [
    { id: 'b-open', cat: 'b-hand', level: 1, ko: '개방현 투핑거 (i · m 교대)', rh: '8', tempo: [60, 120], opts: { pluck: 'i' },
      goal: '왼손은 쉬고 오른손만. 검지(i)와 중지(m)를 번갈아 줄마다 네 번씩, E 줄에서 G 줄까지 오가요.',
      how: ['엄지는 픽업이나 E 줄 위에 걸쳐 두고, 손가락 끝의 살로 줄을 몸 쪽으로 당겨 쳐요.', '친 손가락은 바로 아래 줄에 닿으며 멈추게 해요 (레스트 스트로크).', 'i · m 순서는 줄을 옮겨도 바꾸지 않아요.'],
      tips: ['두 손가락 소리 크기가 같아야 해요. 녹음해서 들어 보면 차이가 잘 들려요.', '줄을 옮길 때 엄지도 따라 내려오면 높은 줄을 칠 때 낮은 줄이 울리지 않아요.'],
      gen: () => { const out = []; [4, 3, 2, 1, 1, 2, 3, 4].forEach(s => { for (let k = 0; k < 4; k++) out.push(nt(s, 0, 0)); }); return out; } },
    { id: 'b-chroma', cat: 'b-hand', level: 1, ko: '크로매틱 1-2-3-4 (한 손가락 한 프렛)', rh: '8', tempo: [60, 110], opts: { fret: 5, pluck: 'i' },
      goal: '네 손가락이 한 프렛씩 맡는 기본 운지. 베이스는 프렛 간격이 넓어 5프렛 근처에서 시작하는 게 좋아요.',
      how: ['검지를 시작 프렛에 두고 E 줄부터 1-2-3-4.', 'G 줄에서 4-3-2-1로 E 줄까지 내려와요.', '오른손은 i · m 교대 그대로.'],
      tips: ['엄지는 넥 뒤 가운데, 가운뎃손가락 맞은편에 둬요.', '누르지 않는 손가락도 줄 가까이 두면 다음 음이 빨라져요.'],
      gen: o => { const F = o.fret; const out = []; [4, 3, 2, 1].forEach(s => [1, 2, 3, 4].forEach(k => out.push(nt(s, F + k - 1, k)))); [1, 2, 3, 4].forEach(s => [4, 3, 2, 1].forEach(k => out.push(nt(s, F + k - 1, k)))); return out; } },
    { id: 'b-simandl', cat: 'b-hand', level: 2, ko: '시만들 운지 1-2-4', rh: '8', tempo: [60, 100], opts: { fret: 1, pluck: 'i' },
      goal: '낮은 프렛처럼 간격이 넓은 곳에서는 약지 대신 새끼를 써서 1-2-4로 세 프렛을 잡아요. 콘트라베이스에서 온 표준 운지예요.',
      how: ['검지 → 중지(한 프렛 위) → 새끼(두 프렛 위). 약지는 새끼를 옆에서 받쳐 줘요.', 'E 줄부터 G 줄까지 올라갔다 새끼-중지-검지 순서로 내려와요.'],
      tips: ['손가락을 억지로 벌리지 말고 손 전체를 조금 기울이면 편해요.', '1프렛에서 편해지면 3 · 5프렛으로 옮겨 보세요.'],
      gen: o => { const F = o.fret; const out = []; [4, 3, 2, 1].forEach(s => [[0, 1], [1, 2], [2, 4]].forEach(([df, fg]) => out.push(nt(s, F + df, fg)))); [1, 2, 3, 4].forEach(s => [[2, 4], [1, 2], [0, 1]].forEach(([df, fg]) => out.push(nt(s, F + df, fg)))); return out; } },
    { id: 'b-major', cat: 'b-tone', level: 2, ko: '메이저 스케일 한 옥타브 (고정 포지션)', rh: '8', tempo: [60, 120], opts: { key: 'C', pluck: 'i' },
      goal: '루트를 가운뎃손가락에 두면 메이저 스케일 한 옥타브가 손을 옮기지 않고 한 자리에 들어와요. 모든 키에서 같은 모양이에요.',
      how: ['E 줄(또는 A 줄)의 루트를 중지(2)로 짚어요.', '2 · 4 / 1 · 2 · 4 / 1 · 3 · 4 손가락 순서로 옥타브까지 올라갔다 내려와요.'],
      tips: ['키를 바꿔도 모양은 그대로, 자리만 옮겨요. 12키를 모두 해 보세요.', '음 이름을 소리 내어 말하며 치면 지판이 빨리 외워져요.'],
      gen: o => { const r = keyRoot(o.key); const P = r.f - 1; const labels = ['1', '2', '3', '4', '5', '6', '7', '1']; const upN = [0, 2, 4, 5, 7, 9, 11, 12].map((d, i) => Object.assign(place(r.midi + d, P), { label: labels[i] })); return upN.concat(upN.slice().reverse()); } },
    { id: 'b-root58', cat: 'b-groove', level: 2, ko: '루트 · 5도 · 옥타브 (1-5-8-5)', rh: '8', tempo: [60, 120], opts: { key: 'C', pluck: 'i' },
      goal: '팝 · 록에서 가장 많이 쓰는 베이스 모양. 1-6-4-5 진행 위에서 루트, 5도, 옥타브를 8분음표로 쳐요.',
      how: ['검지로 루트, 약지로 5도(한 줄 위 두 프렛 위), 약지를 굴려 옥타브(두 줄 위 두 프렛 위).', '코드가 바뀌면 같은 모양을 새 루트로 옮겨요.'],
      tips: ['드럼 킥과 루트가 같이 떨어진다고 생각하면 그루브가 단단해져요.', '옥타브를 칠 때는 가운데 줄을 검지 옆면으로 살짝 막아 소리가 섞이지 않게.'],
      gen: o => { const out = []; chordsOf(o.key, PROG.pop).forEach(c => { const at = out.length; const sh = shapeAt(c.root, 'r58'); for (let k = 0; k < 2; k++) out.push(sh[0], sh[1], sh[2], sh[1]); tag(out, at, c.sym); }); return out.map(n => Object.assign({}, n)); } },
    { id: 'b-arp', cat: 'b-tone', level: 3, ko: '코드톤 아르페지오 (1-3-5-8)', rh: '4', tempo: [70, 140], opts: { key: 'C', pluck: 'i' },
      goal: '1-6-4-5 진행의 코드마다 1-3-5-8을 쳐요. 메이저는 루트를 중지, 마이너는 검지로 잡는 두 모양을 익혀요.',
      how: ['메이저: 루트(2) → 한 줄 위 한 프렛 아래(1) → 같은 줄 두 프렛 위(4) → 옥타브.', '마이너: 루트(1) → 같은 줄 세 프렛 위(4) → 한 줄 위(3) → 옥타브.'],
      tips: ['코드 이름을 보고 3음이 메이저인지 마이너인지 먼저 떠올린 뒤 모양을 고르세요.'],
      gen: o => { const out = []; chordsOf(o.key, PROG.pop).forEach(c => { const at = out.length; out.push(...shapeAt(c.root, c.q === 'min' ? 'min' : 'maj')); tag(out, at, c.sym); }); return out; } },
    { id: 'b-arp7', cat: 'b-tone', level: 3, ko: '세븐 코드 톤 (ii–V–I, 1-3-5-7)', rh: '4', tempo: [70, 140], opts: { key: 'C', pluck: 'i' },
      goal: '재즈의 기본 진행 ii–V–I 에서 m7 · 7 · maj7 코드톤을 4분음표로. 7음의 자리가 모양마다 달라요.',
      how: ['m7: 1(1) b3(4) 5(3) b7(1)', '7: 1(2) 3(1) 5(4) b7(2)', 'maj7: 1(2) 3(1) 5(4) 7(3), 마지막 마디는 거꾸로 내려와요.'],
      tips: ['b7 과 7 의 한 프렛 차이가 코드의 색을 바꿔요. 소리로 차이를 느껴 보세요.'],
      gen: o => { const cs = chordsOf(o.key, [[2, 'm7'], [7, 'dom7'], [0, 'maj7'], [0, 'maj7']]); const out = []; cs.forEach((c, i) => { const at = out.length; const sh = shapeAt(c.root, c.q); out.push(...(i === 3 ? sh.slice().reverse() : sh)); tag(out, at, c.sym); }); return out; } },
    { id: 'b-walk', cat: 'b-walk', level: 4, ko: '워킹 베이스 (코드톤 + 반음 어프로치)', rh: '4', tempo: [80, 160], opts: { key: 'C', pluck: 'i' },
      goal: 'ii–V–I–VI 네 마디를 4분음표로 걸어가요. 1 · 2 · 3박은 코드톤, 4박은 다음 코드 루트로 가는 반음 어프로치.',
      how: ['1박은 꼭 루트, 2 · 3박은 3음 · 5음.', '4박은 다음 루트의 반음 아래(또는 위) 음으로, 다음 마디 첫 박에 루트로 착지해요.'],
      tips: ['어프로치 음은 스케일 밖이어도 괜찮아요. 다음 박에 바로 해결되기 때문이에요.', '재즈에서는 2 · 4박에 살짝 무게를 두면 스윙감이 살아요.'],
      gen: o => {
        const cs = chordsOf(o.key, [[2, 'm7'], [7, 'dom7'], [0, 'maj7'], [9, 'dom7']]);
        const out = [];
        cs.forEach((c, i) => {
          const sh = shapeAt(c.root, c.q); const next = cs[(i + 1) % cs.length].root;
          const P = c.root.f - (SHAPE[c.q][0][2] - 1);
          const app = place(next.midi + (i % 2 ? 1 : -1), P);
          const at = out.length; out.push(sh[0], sh[1], sh[2], Object.assign(app, { label: i % 2 ? '↓' : '↑' })); tag(out, at, c.sym);
        });
        return out;
      } },
    { id: 'b-dead', cat: 'b-groove', level: 4, ko: '16비트 데드 노트 (펑크)', rh: '16', tempo: [60, 100], opts: { key: 'E', pluck: 'i' },
      goal: '왼손으로 줄을 살짝만 덮어 "툭" 소리만 내는 데드 노트(x)를 16분음표 사이사이에 넣어 펑크 그루브를 만들어요.',
      how: ['x 는 왼손 손가락을 줄 위에 얹기만 하고 누르지 않은 채 쳐요.', '음이 나는 자리와 x 자리 모두 i · m 을 계속 번갈아요.'],
      tips: ['데드 노트는 크게 치지 말고, 음이 나는 자리보다 작게.', '16분음표를 몸으로 세면서(1 e & a) 천천히 시작하세요.'],
      gen: o => {
        const r = keyRoot(o.key); const root = rootNear(N().pcOf(o.key), r.f);
        const R = nt(root.s, root.f, 1, { label: '1' }), O = nt(root.s - 2, root.f + 2, 3, { label: '1' }), F5 = nt(root.s - 1, root.f + 2, 3, { label: '5' }), B7 = nt(root.s - 2, root.f, 1, { label: 'b7' });
        const X = n => Object.assign({}, n, { x: true, label: null });
        const bar = [R, X(R), X(R), O, X(O), R, X(R), B7, R, X(R), F5, X(F5), B7, X(B7), O, X(O)];
        return bar.concat(bar).map(n => Object.assign({}, n));
      } },
    { id: 'b-slap', cat: 'b-groove', level: 5, ko: '슬랩 기초 (엄지 T · 팝 P)', rh: '16', tempo: [60, 100], opts: { key: 'E' },
      goal: '엄지로 낮은 루트를 때리고(T), 검지로 옥타브를 튕기는(P) 슬랩의 기본 옥타브 패턴이에요.',
      how: ['T: 엄지 옆 관절로 넥 끝 부근의 줄을 튕기듯 때려요.', 'P: 검지를 줄 밑에 걸어 위로 당겼다 놓아요.', 'x 는 왼손으로 막은 채 엄지로 친 데드 노트.'],
      tips: ['손목을 문 손잡이 돌리듯 회전시키면 T 와 P 가 자연스럽게 이어져요.', '처음에는 60 BPM 보다 느려도 괜찮아요. 소리가 고르게 나는 게 먼저.'],
      gen: o => {
        const r = keyRoot(o.key); const root = rootNear(N().pcOf(o.key), Math.min(r.f, 7));
        const T = nt(root.s, root.f, 1, { pk: 'T', label: '1' }), P = nt(root.s - 2, root.f + 2, 3, { pk: 'P', label: '1' }), TX = Object.assign({}, T, { x: true, label: null });
        const b7 = nt(root.s - 2, root.f, 1, { pk: 'P', label: 'b7' });
        const bar = [T, TX, P, TX, T, T, P, TX, T, TX, P, TX, T, P, b7, P];
        return bar.concat(bar).map(n => Object.assign({}, n));
      } }
  ];
  /* ---- 더 많은 베이스 연습 ---- */
  const posBox = (o, scaleId, n) => { const rootPc = N().pcOf(o.key || 'A'); const list = GH.positions.npsPositions(rootPc, scaleId, n, TUN); return list[clamp((Number(o.pos || o.box) || 1) - 1, 0, list.length - 1)]; };
  const fingerBox = notes => { const hasOpen = notes.some(x => x.f === 0); const base = hasOpen ? 1 : Math.min(...notes.map(x => x.f)); return notes.map(x => nt(x.s, x.f, x.f === 0 ? 0 : clamp(x.f - base + 1, 1, 4), { label: x.label })); };
  EX.push(
    { id: 'b-perm', cat: 'b-hand', level: 2, ko: '손가락 순서 바꾸기 (베이스 신경분리)', rh: '8', tempo: [60, 110], opts: { fret: 5, perm: '1324', pluck: 'i' },
      goal: '1-2-3-4 순서를 섞은 24가지 조합을 네 줄에서. 왼손 손가락이 따로 움직이게 만드는 신경분리 연습이에요.',
      how: ['위에서 순서를 골라 E 줄 → G 줄 → E 줄로 오르내려요.', '오른손 i · m 교대는 그대로.'],
      tips: ['베이스는 프렛 간격이 넓어 5프렛 위에서 시작하면 편해요.'],
      gen: o => { const order = String(o.perm).split('').map(Number); const out = []; [4, 3, 2, 1].forEach(s => order.forEach(k => out.push(nt(s, o.fret + k - 1, k)))); [1, 2, 3, 4].forEach(s => order.forEach(k => out.push(nt(s, o.fret + k - 1, k)))); return out; } },
    { id: 'b-pent', cat: 'b-tone', level: 2, ko: '마이너 펜타토닉 박스 (베이스)', rh: '8', tempo: [60, 130], opts: { key: 'A', box: 1, pluck: 'i' },
      goal: '줄당 두 음의 펜타토닉 박스를 네 줄에서. 록 · 블루스 · 펑크 베이스 라인의 재료예요.',
      how: ['박스 1은 루트가 E 줄에 있는 모양이에요.', '올라갔다 내려와요.'],
      tips: ['펜타토닉 음만으로도 대부분의 록 베이스 라인을 만들 수 있어요.'],
      gen: o => { const b = fingerBox(posBox(o, 'minor_pent', 2).notes); return b.concat(b.slice().reverse()); } },
    { id: 'b-minor', cat: 'b-tone', level: 2, ko: '내추럴 마이너 스케일 (고정 포지션)', rh: '8', tempo: [60, 120], opts: { key: 'A', pluck: 'i' },
      goal: '루트를 검지에 두면 마이너 스케일 한 옥타브가 1-3-4 / 1-3-4 / 1-3 손가락으로 한 자리에 들어와요.',
      how: ['E 줄(또는 A 줄) 루트를 검지로.', '줄마다 1 · 3 · 4 손가락.'],
      tips: ['메이저(중지 루트)와 마이너(검지 루트) 두 모양을 번갈아 쳐 보세요.'],
      gen: o => { const r = keyRoot(o.key); const P = r.f; const labels = ['1', '2', 'b3', '4', '5', 'b6', 'b7', '1']; const up = [0, 2, 3, 5, 7, 8, 10, 12].map((d, i) => Object.assign(place(r.midi + d, P), { label: labels[i] })); return up.concat(up.slice().reverse()); } },
    { id: 'b-3nps', cat: 'b-tone', level: 3, ko: '3NPS 메이저 스케일 (베이스)', rh: '8t', tempo: [60, 120], opts: { key: 'G', pos: 1, pluck: 'i' },
      goal: '한 줄에 세 음씩 네 줄, 거의 두 옥타브. 포지션을 옮기며 지판 전체를 잇는 연습이에요.',
      how: ['줄마다 세 음: 온-온은 1-2-4, 온-반은 1-3-4 (또는 1-2-4 스트레치).', '셋잇단으로 한 박에 한 줄.'],
      tips: ['낮은 프렛에서 스트레치가 크면 포지션 2 · 3 부터 시작해요.'],
      gen: o => { const p = posBox(o, 'ionian', 3); const out = []; for (let i = 0; i < 4; i++) { const tri = p.notes.slice(i * 3, i * 3 + 3); const a = tri[1].f - tri[0].f, b = tri[2].f - tri[1].f; const fg = tri[0].f === 0 ? tri.map(x => clamp(x.f, 0, 4)) : a === 2 && b === 1 ? [1, 3, 4] : [1, 2, 4]; tri.forEach((x, k) => out.push(nt(x.s, x.f, fg[k], { label: x.label }))); } return out.concat(out.slice().reverse()); } },
    { id: 'b-octave', cat: 'b-groove', level: 2, ko: '디스코 옥타브 (루트 ↔ 옥타브)', rh: '8', tempo: [80, 130], opts: { key: 'A', pluck: 'i' },
      goal: '루트와 한 옥타브 위를 8분음표로 번갈아. 디스코 · 펑크 · 댄스 음악의 대표 베이스 패턴이에요.',
      how: ['검지로 루트, 약지(또는 새끼)로 두 줄 위 두 프렛 위 옥타브.', '1-6-4-5 진행을 따라 모양을 옮겨요.'],
      tips: ['옥타브를 칠 때 가운데 줄이 울리지 않게 검지 옆면으로 막아요.'],
      gen: o => { const out = []; chordsOf(o.key, PROG.pop).forEach(c => { const at = out.length; const sh = shapeAt(c.root, 'r58'); for (let k = 0; k < 4; k++) out.push(sh[0], sh[2]); tag(out, at, c.sym); }); return out.map(n => Object.assign({}, n)); } },
    { id: 'b-boogie', cat: 'b-groove', level: 3, ko: '12마디 블루스 부기 (1-3-5-6-b7-6-5-3)', rh: '8', tempo: [80, 140], opts: { key: 'A', pluck: 'i' },
      goal: '코드마다 1-3-5-6-b7-6-5-3 을 8분음표로 오르내리는 부기 베이스. 12마디 블루스 폼을 몸에 익혀요.',
      how: ['I 네 마디 → IV 두 마디 → I 두 마디 → V · IV · I · V.', '셔플(스윙)로 치면 더 블루스다워요.'],
      tips: ['마디 수를 세면서 코드가 바뀌는 곳을 미리 봐 두세요.'],
      gen: o => { const form = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7]; const kr = lowRoot(N().pcOf(o.key), 3); const out = []; form.forEach(dg => { const at = out.length; const root = lowRoot(N().mod(N().pcOf(o.key) + dg, 12), kr.f); const P = root.f - 1; [0, 4, 7, 9, 10, 9, 7, 4].forEach((x, i) => { const p = place(root.midi + x, P); out.push(Object.assign(p, { label: ['1', '3', '5', '6', 'b7', '6', '5', '3'][i] })); }); tag(out, at, symOf(o.key, dg, 'dom7')); }); return out; } },
    { id: 'b-motown', cat: 'b-walk', level: 4, ko: '모타운 스타일 (코드톤 + 반음 어프로치 8분)', rh: '8', tempo: [80, 130], opts: { key: 'C', pluck: 'i' },
      goal: '8분음표로 코드톤을 돌다가 마디 끝에서 다음 루트로 반음 어프로치. 제임스 제머슨 식 모타운 베이스의 뼈대예요.',
      how: ['1-5-8-5-3-5-6 다음 마지막 음은 다음 루트의 반음 아래.', 'I–vi–ii–V 진행을 반복해요.'],
      tips: ['어프로치 음은 짧게, 다음 루트는 또렷하게.'],
      gen: o => { const cs = chordsOf(o.key, [[0, 'maj'], [9, 'min'], [2, 'min'], [7, 'maj']]); const out = []; cs.forEach((c, i) => { const at = out.length; const next = cs[(i + 1) % cs.length].root; const P = c.root.f - 1; const third = c.q === 'min' ? 3 : 4; [0, 7, 12, 7, third, 7, 9].forEach((x, k) => out.push(Object.assign(place(c.root.midi + x, P), { label: ['1', '5', '1', '5', c.q === 'min' ? 'b3' : '3', '5', '6'][k] }))); out.push(Object.assign(place(next.midi - 1, P), { label: '↑' })); tag(out, at, c.sym); }); return out; } },
    { id: 'b-bossa', cat: 'b-groove', level: 3, ko: '보사노바 베이스 (1 · 5, 점4분 리듬)', fixed: true, rh: '4', tempo: [70, 130], opts: { key: 'C', pluck: 'i' },
      goal: '루트(점4분) – 5도(8분) – 5도(2분). 보사노바 · 라틴 재즈의 기본 베이스 리듬으로 ii–V–I–I 을 쳐요.',
      how: ['1박 루트를 길게, 2박 반에 5도를 짧게, 3박에 5도를 길게.', '손가락 끝의 살로 부드럽게.'],
      tips: ['드럼 없이도 보사 느낌이 나게, 점4분 뒤의 8분을 살짝 앞당기는 느낌으로.'],
      gen: o => { const cs = chordsOf(o.key, [[2, 'min'], [7, 'maj'], [0, 'maj'], [0, 'maj']]); const out = []; cs.forEach(c => { const at = out.length; const P = c.root.f - 1; const r = Object.assign(place(c.root.midi, P), { label: '1' }); const f5 = c.root.s === 3 ? place(c.root.midi - 5, P) : place(c.root.midi + 7, P);   /* A 줄 루트면 아래 5도(E 줄 같은 프렛) */ const five = Object.assign(f5, { label: '5' }); out.push(Object.assign({}, r, { d: 1.5 }), Object.assign({}, five, { d: 0.5 }), Object.assign({}, five, { d: 2 })); tag(out, at, c.sym); }); return out; } },
    { id: 'b-funkoct', cat: 'b-groove', level: 4, ko: '16비트 옥타브 펑크 (고스트 노트)', rh: '16', tempo: [70, 110], opts: { key: 'E', pluck: 'i' },
      goal: '루트 · 옥타브 사이에 데드 노트(x)를 섞은 16분음표 펑크 옥타브. 래리 그레이엄 · 부시 콜린스 스타일 그루브의 기초예요.',
      how: ['R x O x | R R x O | x R O x | R x O O 를 두 마디.', 'x 는 왼손을 얹기만 하고 쳐요.'],
      tips: ['옥타브 음을 짧게 끊으면 그루브가 튀어요.'],
      gen: o => { const r = keyRoot(o.key); const root = rootNear(N().pcOf(o.key), Math.min(r.f, 7)); const R = nt(root.s, root.f, 1, { label: '1' }), O = nt(root.s - 2, root.f + 2, 3, { label: '1' }); const X = n => Object.assign({}, n, { x: true, label: null }); const bar = [R, X(R), O, X(O), R, R, X(R), O, X(O), R, O, X(O), R, X(R), O, O]; return bar.concat(bar).map(n => Object.assign({}, n)); } },
    { id: 'b-inv', cat: 'b-tone', level: 4, ko: '트라이어드 전위 아르페지오 (1-3-5 · 3-5-1 · 5-1-3)', rh: '8t', tempo: [60, 120], opts: { key: 'C', pluck: 'i' },
      goal: '같은 코드를 루트 · 3음 · 5음부터 시작해 세 모양으로. 코드 음을 어느 음에서든 찾아 걷는 워킹 라인의 준비 운동이에요.',
      how: ['I 코드를 1-3-5, 3-5-1, 5-1-3 로 올라갔다 내려와요.', '셋잇단 한 박에 한 모양.'],
      tips: ['손을 옮기지 않고 한 포지션 안에서 찾을 수 있는지 먼저 보세요.'],
      gen: o => { const r = keyRoot(o.key); const P = r.f - 1; const seqs = [[0, 4, 7], [4, 7, 12], [7, 12, 16]]; const lab = { 0: '1', 4: '3', 7: '5', 12: '1', 16: '3' }; const out = []; seqs.concat(seqs.slice().reverse()).forEach(sq => sq.forEach(x => { const p = place(r.midi + x, P); out.push(Object.assign(p, { label: lab[x] })); })); return out; } }
  );
  EX.forEach(e => { e.inst = 'bass'; });
  const ROUTINES = [
    { id: 'b-easy', inst: 'bass', ko: '입문 루틴', min: 10, desc: '투핑거 → 1-2-3-4 → 메이저 스케일 → 루트 · 5도 · 옥타브.', steps: [['b-open', 2], ['b-chroma', 3], ['b-major', 3], ['b-root58', 2]] },
    { id: 'b-mid', inst: 'bass', ko: '중급 루틴', min: 15, desc: '시만들 운지와 코드톤으로 지판을 넓히고 세븐 코드까지.', steps: [['b-simandl', 3], ['b-major', 3], ['b-arp', 3], ['b-arp7', 3], ['b-root58', 3]] },
    { id: 'b-hard', inst: 'bass', ko: '고급 루틴', min: 20, desc: '워킹 · 데드 노트 · 슬랩으로 장르별 그루브까지.', steps: [['b-chroma', 2], ['b-arp7', 3], ['b-walk', 5], ['b-dead', 5], ['b-slap', 5]] }
  ];
  GH.data.techBassTuning = TUN;
  GH.data.techCats = (GH.data.techCats || []).concat(CATS);
  GH.data.technique = (GH.data.technique || []).concat(EX);
  GH.data.techRoutines = (GH.data.techRoutines || []).concat(ROUTINES);
})();
