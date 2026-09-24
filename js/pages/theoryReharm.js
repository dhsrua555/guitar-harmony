/* 화성학 › 리하모니제이션 (목록 / 상세 route 분리) */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, table, kv, select, callout } = GH.ui; const N = GH.notes;
  const state = { melody: '3' };

  const detailPath = id => '/theory/reharm/' + encodeURIComponent(id);
  const findTechnique = id => GH.data.reharm.find(r => r.id === id);

  function renderList(el) {
    el.appendChild(h('h1', null, '리하모니제이션'));
    el.appendChild(h('p', { class: 'muted' }, '멜로디를 유지한 채 하모니와 베이스의 움직임을 다시 설계하는 기법입니다. 다이어토닉 대리 코드부터 트라이톤 서브, 모달 인터체인지, 콜트레인 체인지까지 분류별로 정리했습니다.'));
    Object.entries(GH.data.reharmCategories).forEach(([category, label]) => {
      const items = GH.data.reharm.filter(r => r.category === category);
      if (!items.length) return;
      const grid = h('div', { class: 'grid cols-3' });
      items.forEach(r => grid.appendChild(h('a', { class: 'card link', href: GH.router.href(detailPath(r.id)), style: 'color:inherit' },
        h('div', { class: 'title' }, r.ko),
        h('div', { class: 'muted', style: 'font-size:.85rem' }, r.en),
        h('p', { style: 'margin:.55rem 0 0' }, r.summary),
        h('div', { style: 'margin-top:6px' }, GH.ui.difficulty(r.level)))));
      el.appendChild(section(label, grid));
    });
  }

  function renderDetail(el, params) {
    const A = GH.app; const qy = params.query || {};
    const all = GH.data.reharm;
    const R = findTechnique(params.id || qy.id);
    if (!R) {
      el.appendChild(GH.ui.empty('리하모니제이션 기법을 찾을 수 없습니다.'));
      el.appendChild(h('p', null, h('a', { href: '#/theory/reharm' }, '리하모니제이션 목록으로')));
      return;
    }
    const key = A.key(); const pref = A.pref(key);
    const idx = all.indexOf(R);
    const previous = all[(idx - 1 + all.length) % all.length];
    const next = all[(idx + 1) % all.length];

    el.appendChild(h('div', { class: 'breadcrumb' }, h('a', { href: '#/theory/reharm' }, '리하모니제이션'), ' › ', GH.data.reharmCategories[R.category]));
    el.appendChild(h('h1', null, R.ko));
    el.appendChild(h('p', { class: 'muted' }, R.en));
    el.appendChild(h('div', { class: 'row' }, GH.ui.difficulty(R.level), GH.ui.badge(GH.data.reharmCategories[R.category], 'accent'), GH.ui.badge('키 ' + N.pretty(key))));
    el.appendChild(h('p', null, h('b', null, R.summary)));
    el.appendChild(h('p', null, R.desc));
    el.appendChild(h('p', null, h('b', null, '적용 포인트: '), R.rule));
    el.appendChild(h('div', { class: 'row', style: 'justify-content:space-between;margin:12px 0' },
      h('a', { class: 'btn small', href: GH.router.href(detailPath(previous.id)), 'aria-label': '이전 리하모니제이션 기법' }, '‹ ' + previous.ko),
      h('span', { class: 'muted' }, (idx + 1) + ' / ' + all.length),
      h('a', { class: 'btn small', href: GH.router.href(detailPath(next.id)), 'aria-label': '다음 리하모니제이션 기법' }, next.ko + ' ›')));

    const ex = R.example;
    const toChords = arr => A.progressionChords({ chords: arr, mode: ex.mode }, key);
    const before = toChords(ex.before), after = toChords(ex.after);
    const stripB = A.chordStrip(before, { link: true }), stripA = A.chordStrip(after, { link: true });
    stripA.querySelectorAll('.prog-cell').forEach((cell, i) => { if (!before[i] || before[i].symbol !== after[i].symbol) cell.classList.add('changed'); });
    const seqA = GH.voicings.voiceLead(after, { kind: 'drop2', strSet: '5-4-3-2' });
    const seqB = GH.voicings.voiceLead(before, { kind: 'drop2', strSet: '5-4-3-2' });
    const playB = () => GH.player.playProgression(A.toPlayable(before, seqB), { tempo: 100, style: 'ballad', onChord: i => stripB.setCurrent(i) });
    const playA = () => GH.player.playProgression(A.toPlayable(after, seqA), { tempo: 100, style: 'ballad', onChord: i => stripA.setCurrent(i) });
    el.appendChild(section('A/B 하모니 비교',
      h('div', { class: 'split', style: 'margin-top:10px' },
        h('div', { class: 'card' }, h('div', { class: 'row', style: 'justify-content:space-between' }, h('h3', { style: 'margin:0' }, 'Original'), A.playBtn('▶ A 듣기', playB)), stripB),
        h('div', { class: 'card', style: 'border-color:var(--accent)' }, h('div', { class: 'row', style: 'justify-content:space-between' }, h('h3', { style: 'margin:0' }, 'Reharm'), h('span', null, A.playBtn('▶ B 듣기', playA, 'primary'), ' ', A.stopBtn())), stripA)),
      h('p', { class: 'muted', style: 'margin-top:6px' }, '강조된 셀이 리하모니제이션으로 바뀐 코드입니다. 코드 심볼을 누르면 코드 상세로 이동합니다.'),
      h('div', { class: 'toc' }, h('a', { href: GH.router.href('/backing', { chords: after.map(c => c.symbol).join(' | '), key }) }, '리하모니제이션 진행으로 백킹 트랙 만들기 →'))));

    const deepParts = [];
    if (R.id === 'tritone_sub' || R.id === 'backdoor' || R.id === 'diatonic_sub') {
      const pairs = [];
      before.forEach((b, i) => { const a = after[i]; if (a && a.symbol !== b.symbol) pairs.push([b, a]); });
      if (pairs.length) deepParts.push(h('div', null, h('h3', null, '공통음 (Common Tones)'), table(['Original', 'Substitute', '공통음', '보이스 리딩'], pairs.map(([b, a]) => { const common = b.notes.filter(n => a.pcs.includes(n.pc)); return [h('span', null, b.symbol + ' ', A.chordPills(b, { name: true })), h('span', null, a.symbol + ' ', A.chordPills(a, { name: true })), common.map(n => N.pretty(n.name)).join(', ') || '없음', common.length >= 2 ? '공통음 유지' : '루트 진행과 해결 방향이 펑션을 결정']; }))));
    }
    const vg = h('div', { class: 'grid diagrams' });
    seqA.forEach((v, i) => { if (v) vg.appendChild(GH.render.chordCard(v, { pref, title: after[i].symbol, sub: v.name })); });
    deepParts.push(h('div', null, h('h3', null, 'Reharm 보이싱 — Drop 2 · 5-4-3-2'), vg));

    const melodyIv = state.melody; const melodyName = N.spell(key, melodyIv); const melodyPc = N.pcOf(melodyName);
    const judge = c => {
      const lm = N.labelMap(c.rootPc, c.quality.intervals); const iv = lm[melodyPc];
      if (iv) return { iv, cls: N.ivClass(iv), text: '코드톤' };
      const rel = N.intervalName(c.rootPc, melodyPc);
      let tens = N.tensionIv(rel);
      if (rel === 'b3' && c.quality.family === 'dominant') tens = '#9';
      const avoid = c.quality.avoid.includes(rel) || c.quality.avoid.includes(N.simpleIv(rel));
      if (avoid) return { iv: tens, cls: 'iv-x', text: '어보이드 노트 (반음 충돌)' };
      const semiAbove = c.pcs.some(p => N.mod(melodyPc - p, 12) === 1) && !/^(b9|#9|b13|#11)$/.test(tens);
      if (c.quality.tensions.includes(tens)) return { iv: tens, cls: 'iv-t', text: '어베일러블 텐션' };
      if (semiAbove) return { iv: tens, cls: 'iv-x', text: '코드톤 반음 위 (주의)' };
      return { iv: tens, cls: 'iv-t', text: '컬러 텐션 (문맥 확인)' };
    };
    deepParts.push(h('div', null, h('h3', null, '멜로디–코드 체크'),
      callout(h('b', null, '체크 포인트. '), '멜로디 음이 새 코드에서 어떤 인터벌인지 확인합니다. 코드톤(1, 3, 5, 7)이나 어베일러블 텐션(9, 13, #11)이면 안정적이고, 어보이드 노트라면 보이싱이나 대리 코드를 다시 선택합니다.'),
      h('div', { class: 'toolbar' }, h('label', null, '멜로디 음 (키 기준)', select({ options: ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'].map(iv => ({ value: iv, label: iv + ' = ' + N.pretty(N.spell(key, iv)) })), value: melodyIv, onChange: v => { state.melody = v; GH.router.rerender(); } })), h('span', { class: 'muted' }, N.pretty(melodyName) + '을 서스테인했을 때의 코드별 인터벌')),
      table(['Reharm 코드', '멜로디 인터벌', '판정'], after.map(c => { const j = judge(c); return [c.symbol, h('span', { class: 'pill ' + j.cls }, j.iv), j.text]; })),
      kv([['관련 코드 퀄리티', h('span', null, (R.related.chords || []).map(q => GH.chords.getQuality(q) ? h('a', { href: A.chordHref(key, q), style: 'margin-right:8px' }, GH.chords.getQuality(q).ko) : null))], ['관련 스케일', h('span', null, (R.related.scales || []).map(s => GH.scales.get(s) ? h('a', { href: A.scaleHref(s, key), style: 'margin-right:8px' }, GH.scales.get(s).ko) : null))]])));

    const dia = GH.chords.diatonic(key, 'ionian', true);
    deepParts.push(h('div', null, h('h3', null, '펑션별 대리 코드 — ' + N.pretty(key) + ' 메이저'), h('p', { class: 'muted' }, '같은 펑션 안의 코드는 서로 대리할 수 있습니다. 아래 항목은 펑션을 강화하거나 컬러를 바꾸는 비다이어토닉 옵션입니다.'),
      h('div', { class: 'grid cols-3' }, [['T 토닉', [0, 2, 5], ['bIIImaj7 (모달 인터체인지)', 'bVImaj7 (모달 인터체인지)', 'I6, I6/9, Imaj9 (퀄리티 변경)']], ['S 서브도미넌트', [3, 1], ['iv6, iv7 (마이너 서브도미넌트)', 'bVII7 (백도어)', 'II7 (V7/V)', 'bIImaj7 (네아폴리탄)']], ['D 도미넌트', [4, 6], ['bII7 (트라이톤 서브)', 'V7alt, V7b9 (알터드)', 'vii°7 (디미니시드)', 'V7sus4 (서스)']]].map(([title, degs, extra]) => h('div', { class: 'card' }, h('h3', { class: title.startsWith('T') ? 'fn-T' : title.startsWith('S') ? 'fn-S' : 'fn-D' }, title), h('div', { class: 'row' }, degs.map(d => h('a', { class: 'btn small', href: A.chordHref(dia[d].root, dia[d].qId) }, dia[d].roman + ' ' + dia[d].chord.symbol))), h('ul', { class: 'plain', style: 'margin-top:8px;font-size:.88rem' }, extra.map(t => h('li', null, t))))))));
    el.appendChild(A.deep('공통음 · 보이스 리딩 · 멜로디 체크 · 대리 코드', deepParts));
  }

  GH.pages['/theory/reharm'] = {
    title: '리하모니제이션',
    render(el, params) {
      params = params || { query: {} };
      const qy = params.query || {};
      /* 기존 #/theory/reharm?id=... 링크와 직접 렌더 테스트 호환 */
      if (qy.id) return renderDetail(el, Object.assign({}, params, { id: qy.id }));
      renderList(el);
    }
  };

  GH.pages['/theory/reharm/:id'] = {
    title: '리하모니제이션',
    render: renderDetail
  };
})();
