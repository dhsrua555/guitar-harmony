/* 화성학 › 모드 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, table, kv, select, callout, tabs } = GH.ui; const N = GH.notes;
  const state = { mode: 'dorian', tab: 'diatonic' };

  function modeInfo(m, r) {
    const A = GH.app; const info = GH.data.modes[m.id] || {}; const notes = GH.scales.notes(r, m.id); const rp = N.pcOf(r);
    return h('div', { class: 'card' },
      h('div', { class: 'row' }, h('span', { class: 'symbol-big', style: 'font-size:1.3rem;color:' + (info.color || 'inherit') }, N.pretty(r) + ' ' + m.ko), h('span', { class: 'muted' }, m.en)),
      h('div', { class: 'row', style: 'margin:6px 0' }, GH.ui.pills(notes.map(n => ({ label: N.pretty(n.name), cls: m.characteristic.includes(n.label) ? 'iv-1' : 'iv-s' }))), GH.ui.pills(notes.map(n => ({ label: n.label, cls: m.characteristic.includes(n.label) ? 'iv-1' : 'iv-s' })))),
      kv([['특징음', m.characteristic.join(', ') || '–'], ['사운드', info.mood || ''], ['대표 코드', info.chord || m.chords.join(', ')], ['뱀프', info.vampText || ''], ['레퍼런스 곡', info.songs ? h('ul', { class: 'plain' }, info.songs.map(s => h('li', null, s))) : ''], ['연주 팁', info.tip || '']]),
      h('p', null, m.desc),
      h('div', { class: 'row' },
        A.playBtn('▶ 스케일 듣기', () => { const base = 48 + rp; const mm = m.intervals.map(iv => base + N.ivSemi(iv)).concat([base + 12]); GH.player.playNotes(mm.concat(mm.slice(0, -1).reverse()), { tempo: 150 }); }, 'primary'),
        info.vamp ? A.playBtn('▶ 뱀프 듣기 (반복)', () => { const chords = info.vamp.map(rm => GH.chords.romanToChord(rm, r, 'major')).filter(Boolean).map(c => Object.assign(c, { beats: 4 })); GH.player.playProgression(A.toPlayable(chords), { tempo: 96, style: m.id === 'dorian' || m.id === 'mixolydian' ? 'funk' : 'soul', loop: true }); }) : null,
        A.stopBtn(), h('a', { class: 'btn small', href: A.scaleHref(m.id, r) }, '기타 포지션 →'), h('a', { class: 'btn small', href: A.theoryScaleHref(m.id, r) }, '스케일 상세 →')));
  }

  const page = {
    title: '모드',
    render(el, params) {
      const A = GH.app; const qy = params.query || {};
      const root = qy.root || A.key(); const pref = A.pref(root); const rootPc = N.pcOf(root);
      const requested = params.id || qy.mode;
      if (requested && GH.scales.get(requested)) {
        state.mode = requested;
        if (!qy.tab) {
          const linked = GH.scales.get(requested);
          state.tab = linked.parent === 'melodic_minor' ? 'mm' : linked.parent === 'harmonic_minor' ? 'hm' : 'diatonic';
        }
      }
      if (qy.tab) state.tab = qy.tab;
      const cur = GH.scales.get(state.mode);
      if (params.id || (qy.mode && !qy.tab)) {
        el.appendChild(h('div', { class: 'breadcrumb' }, h('a', { href: '#/theory/modes' }, '모드'), ' › ', cur.ko));
        el.appendChild(h('h1', null, N.pretty(root) + ' ' + cur.ko));
        el.appendChild(h('p', { class: 'muted' }, '특징음, 대표 코드, 뱀프와 연주 문맥을 한 화면에서 확인합니다.'));
        el.appendChild(h('div', { class: 'toolbar' }, h('label', null, '으뜸음', A.rootSelect(root, v => GH.router.go('/theory/modes/' + encodeURIComponent(cur.id), { root: v })) ), h('a', { class: 'btn small', href: '#/theory/modes' }, '모드 비교표 →')));
        el.appendChild(modeInfo(cur, root));
        return;
      }
      el.appendChild(h('h1', null, '모드 (선법)'));
      el.appendChild(h('p', { class: 'muted' }, '특정 음을 으뜸음으로 삼아 고유한 도수 구조와 중심감을 만드는 음계입니다. 밝기 순서, 평행·상대 비교로 차이를 먼저 보고 각 모드의 상세 페이지로 들어가세요.'));
      el.appendChild(callout(h('b', null, '두 가지 관점. '), h('b', null, '상대 접근'), ': C 메이저와 D 도리안처럼 같은 음 집합을 다른 으뜸음으로 보는 방식. ', h('b', null, '평행 접근'), ': C 아이오니안과 C 도리안처럼 같은 으뜸음에서 다른 도수를 비교하는 방식입니다. 실제 연주에서는 특징음과 중심 코드를 함께 듣는 것이 중요합니다.'));
      el.appendChild(tabs([{ id: 'diatonic', label: '메이저 스케일의 7모드' }, { id: 'parallel', label: '평행 비교표' }, { id: 'relative', label: '상대 비교표' }, { id: 'mm', label: '멜로딕 마이너 모드' }, { id: 'hm', label: '하모닉 마이너 모드' }, { id: 'modal', label: '모달 하모니' }], state.tab, id => GH.router.go('/theory/modes', { root, mode: state.mode, tab: id })));
      const body = h('div'); el.appendChild(body);
      const M = GH.data.modes;
      if (state.tab === 'diatonic') {
        const order = GH.data.diatonicModeOrder;
        const bright = h('div', { class: 'brightness' });
        order.forEach(id => { const m = GH.scales.get(id); const info = M[id]; bright.appendChild(h('a', { class: 'm', href: A.modeHref(id, root), style: 'background:' + info.color }, m.ko.split(' ')[0], h('small', null, '특징음 ' + (m.characteristic[0] || '')))); });
        body.appendChild(section('밝기 스펙트럼', h('p', { class: 'muted' }, '리디안에서 로크리안으로 갈수록 보편적으로 밝은 색채에서 어두운 색채로 들립니다. 오른쪽으로 옮겨 갈 때마다 도수 하나가 반음 내려갑니다: ♯4→4, 7→♭7, 3→♭3, 6→♭6, 2→♭2, 5→♭5.'), bright));
        body.appendChild(h('div', { class: 'toolbar' }, h('label', null, '으뜸음', A.rootSelect(root, v => GH.router.go('/theory/modes', { root: v, tab: 'diatonic' })))));
      } else if (state.tab === 'parallel') {
        const order = GH.data.diatonicModeOrder;
        const ion = GH.scales.get('ionian').intervals.map(N.ivSemi);
        body.appendChild(h('div', { class: 'toolbar' }, h('label', null, '으뜸음', A.rootSelect(root, v => GH.router.go('/theory/modes', { root: v, tab: 'parallel' })))));
        body.appendChild(section(N.pretty(root) + ' 기준 7모드 (평행 비교)', h('p', { class: 'muted' }, '같은 으뜸음에서 각 모드를 비교합니다. 아이오니안과 달라지는 음을 강조했습니다.'),
          table(['모드', '1', '2', '3', '4', '5', '6', '7', '듣기'], order.map(id => { const m = GH.scales.get(id); const notes = GH.scales.notes(root, id); return { onClick: () => GH.router.go('/theory/modes/' + encodeURIComponent(id), { root }), cells: [h('a', { href: A.modeHref(id, root), style: 'color:' + M[id].color }, m.ko.split(' ')[0])].concat(notes.map((n, i) => h('span', { class: 'pill ' + (N.ivSemi(n.iv) !== ion[i] ? 'iv-1' : 'iv-s') }, N.pretty(n.name) + ' ' + n.label))).concat([A.playBtn('▶', e => { e.stopPropagation(); const base = 48 + rootPc; GH.player.playNotes(m.intervals.map(iv => base + N.ivSemi(iv)).concat([base + 12]), { tempo: 150 }); })]) }; }))));
      } else if (state.tab === 'relative') {
        const dia = GH.chords.diatonic(root, 'ionian', true);
        body.appendChild(h('div', { class: 'toolbar' }, h('label', null, '모체 메이저 스케일', A.rootSelect(root, v => GH.router.go('/theory/modes', { root: v, tab: 'relative' })))));
        body.appendChild(section(N.pretty(root) + ' 메이저 스케일에서 파생되는 모드 (상대 비교)', h('p', { class: 'muted' }, '같은 7개 음을 다른 음에서 시작합니다. 각 모드의 토닉 코드는 그 도수의 다이어토닉 7화음입니다.'),
          table(['도수', '모드', '음', '토닉 코드', '대표 코드 / 용도'], ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'].map((id, i) => { const m = GH.scales.get(id); const r = dia[i].root; const notes = GH.scales.notes(r, id); return { onClick: () => GH.router.go('/theory/modes/' + encodeURIComponent(id), { root: r }), cells: [dia[i].roman, h('a', { href: A.modeHref(id, r) }, N.pretty(r) + ' ' + m.ko.split(' ')[0]), GH.ui.pills(notes.map(n => ({ label: N.pretty(n.name), cls: n.cls }))), h('a', { href: A.chordHref(r, dia[i].qId) }, dia[i].chord.symbol), m.usage] }; }))));
      } else if (state.tab === 'mm' || state.tab === 'hm') {
        const parent = state.tab === 'mm' ? 'melodic_minor' : 'harmonic_minor';
        const modes = GH.scales.modesOf(parent);
        body.appendChild(h('div', { class: 'toolbar' }, h('label', null, '으뜸음', A.rootSelect(root, v => GH.router.go('/theory/modes', { root: v, tab: state.tab })))));
        body.appendChild(section(GH.scales.get(parent).ko + '의 7모드', h('p', { class: 'muted' }, state.tab === 'mm' ? '연주에서 자주 활용되는 출발점은 4번째 리디안 도미넌트, 6번째 로크리안 ♮2, 7번째 알터드입니다.' : '하모닉 마이너의 5번째 모드인 프리지안 도미넌트는 마이너 키의 V7 문맥에서 대표적으로 쓰입니다.'),
          table(['#', '모드', '음 (' + N.pretty(root) + ' 기준)', '코드', '용도', ''], modes.map(m => { const notes = GH.scales.notes(root, m.id); return { onClick: () => GH.router.go('/theory/modes/' + encodeURIComponent(m.id), { root }), cells: [m.modeIndex, h('a', { href: A.modeHref(m.id, root) }, m.ko), GH.ui.pills(notes.map(n => ({ label: n.label, cls: m.characteristic.includes(n.label) ? 'iv-1' : 'iv-s' }))), m.chords.slice(0, 3).join(', '), m.usage, A.playBtn('▶', e => { e.stopPropagation(); const base = 48 + rootPc; GH.player.playNotes(m.intervals.map(iv => base + N.ivSemi(iv)).concat([base + 12]), { tempo: 150 }); })] }; }))));
      } else {
        body.appendChild(section('모달 하모니란', h('p', null, '기능 화성(T–S–D)의 긴장과 해결 대신, 한 모드의 색깔을 유지하는 화성입니다. 특징음이 들어간 코드를 강조하고, 도미넌트의 트라이톤 해결을 피하며, 뱀프나 페달 포인트로 중심음을 붙잡습니다.'),
          table(['모드', '뱀프 (모달 진행)', '피할 것', '특징'], [['도리안', 'i7 – IV7, i7 – ii7', 'bVI (에올리안으로 들림)', 'IV7의 장3도 = 특징음 6'], ['프리지안', 'i – bII, i – bII – bIII', 'V7', 'bII 코드가 특징음 b2를 담는다'], ['리디안', 'I – II, Imaj7 – II7', 'IV, V (아이오니안으로 해결)', 'II 코드의 3음 = 특징음 #4'], ['믹솔리디안', 'I – bVII, I7 – IV', 'V7 → I (메이저 해결)', 'bVII의 루트 = 특징음 b7'], ['에올리안', 'i – bVII, i – bVI – bVII', 'V7 (하모닉 마이너로 들림)', 'bVI의 루트 = 특징음 b6']])));
        body.appendChild(section('모달 인터체인지와의 차이', h('p', null, '모달 하모니는 곡이나 섹션의 중심이 특정 모드에 머무는 것이고, 모달 인터체인지는 기존 조성의 중심을 유지한 채 평행 모드에서 코드를 차용하는 것입니다.'), h('a', { href: A.reharmHref('modal_interchange') }, '모달 인터체인지 →')));
        body.appendChild(section('페달 포인트와 뱀프', h('p', null, '베이스를 모드의 토닉에 고정하고 위의 다이어토닉 코드를 바꿔 중심감을 유지합니다. 재즈의 So What 뱀프, 펑크의 원 코드 그루브, 록의 오픈 스트링 리프에서 비슷한 중심감을 들을 수 있습니다.'),
          h('div', { class: 'row' }, ['dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian'].map(id => { const info = M[id]; return A.playBtn('▶ ' + GH.scales.get(id).ko.split(' ')[0] + ' 뱀프', () => { const chords = info.vamp.map(rm => GH.chords.romanToChord(rm, root, 'major')).filter(Boolean).map(c => Object.assign(c, { beats: 4 })); GH.player.playProgression(A.toPlayable(chords), { tempo: 96, style: id === 'dorian' || id === 'mixolydian' ? 'funk' : 'soul', loop: true }); }); }), A.stopBtn())));
      }
    }
  };
  GH.pages['/theory/modes'] = page;
  GH.pages['/theory/modes/:id'] = page;
})();
