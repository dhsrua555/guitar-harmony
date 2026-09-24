/* 기타 › 릭 (목록 + 상세) */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, chips, select, kv, table } = GH.ui; const N = GH.notes;
  const detailState = { tempoRatio: 1, loop: false };

  GH.pages['/guitar/licks'] = {
    title: '릭',
    render(el, params) {
      const A = GH.app; const qy = params.query || {};
      const filter = {
        genre: qy.genre && Object.prototype.hasOwnProperty.call(GH.data.lickGenres, qy.genre) ? qy.genre : 'all',
        context: qy.context && Object.prototype.hasOwnProperty.call(GH.data.lickContexts, qy.context) ? qy.context : 'all',
        level: /^[1-5]$/.test(qy.level || '') ? qy.level : 'all',
        q: qy.q || ''
      };
      const setFilter = (name, value) => {
        const next = Object.assign({}, filter, { [name]: value });
        GH.router.go('/guitar/licks', {
          genre: next.genre === 'all' ? null : next.genre,
          context: next.context === 'all' ? null : next.context,
          level: next.level === 'all' ? null : next.level,
          q: next.q || null
        });
      };
      el.appendChild(h('h1', null, '릭'));
      el.appendChild(h('p', { class: 'muted' }, '장르, 코드 상황, 난이도로 찾습니다. 모든 릭은 TAB과 오선, 느린 재생, 지판 애니메이션, 음마다 코드에 대한 도수 분석을 제공합니다. 릭은 전부 이 사이트를 위해 만든 예제입니다.'));
      const gChips = chips({ options: [{ value: 'all', label: '모든 장르' }].concat(Object.entries(GH.data.lickGenres).map(([k, v]) => ({ value: k, label: v }))), value: filter.genre, onChange: v => setFilter('genre', v) });
      const cChips = chips({ options: [{ value: 'all', label: '모든 상황' }].concat(Object.entries(GH.data.lickContexts).map(([k, v]) => ({ value: k, label: v }))), value: filter.context, onChange: v => setFilter('context', v) });
      const lSel = select({ options: [{ value: 'all', label: '모든 난이도' }, { value: '1', label: 'p 입문' }, { value: '2', label: 'mp 기초' }, { value: '3', label: 'mf 중급' }, { value: '4', label: 'f 중상급' }, { value: '5', label: 'ff 고급' }], value: filter.level, onChange: v => setFilter('level', v) });
      el.appendChild(h('div', { class: 'toolbar', style: 'flex-direction:column;align-items:flex-start;gap:8px' }, gChips, cChips, h('label', null, '난이도', lSel)));
      let list = GH.data.licks.slice();
      if (filter.genre !== 'all') list = list.filter(l => l.genre === filter.genre);
      if (filter.context !== 'all') list = list.filter(l => l.context.includes(filter.context));
      if (filter.level !== 'all') list = list.filter(l => String(l.difficulty) === filter.level);
      if (filter.q) list = list.filter(l => (l.qIds || []).includes(filter.q));
      if (!list.length) { el.appendChild(GH.ui.empty('조건에 맞는 릭이 없습니다.')); return; }
      list.sort((a, b) => a.difficulty - b.difficulty); /* 쉬운 것부터 */
      const wrap = h('div', { class: 'list' });
      list.forEach(l => wrap.appendChild(h('a', { class: 'list-item', href: A.lickHref(l.id), style: 'color:inherit' },
        h('div', { style: 'min-width:70px' }, GH.ui.difficulty(l.difficulty)),
        h('div', { style: 'flex:1' }, h('div', { class: 'title' }, l.ko), h('div', { class: 'desc' }, l.desc),
          h('div', { style: 'margin-top:4px' }, GH.ui.badge(GH.data.lickGenres[l.genre], 'accent'), GH.ui.badge(l.over), GH.ui.badge(GH.scales.get(l.scale).ko), GH.ui.badge(l.tempo + ' BPM'), GH.ui.badge(l.position))))));
      el.appendChild(wrap);
    }
  };

  GH.pages['/guitar/licks/:id'] = {
    title: '릭',
    staff: true,
    render(el, params) {
      const A = GH.app; const qy = params.query || {};
      const lick = GH.data.licks.find(l => l.id === params.id);
      if (!lick) { el.appendChild(GH.ui.empty('릭을 찾을 수 없습니다.')); return; }
      const keyPc = N.pcOf(lick.key);
      const target = qy.to && N.pcOf(qy.to) != null ? N.normalize(qy.to) : lick.key;
      let tr = N.mod(N.pcOf(target) - keyPc, 12); if (tr > 6) tr -= 12;
      const minFret = Math.min(...lick.notes.filter(e => !e.rest).flatMap(e => e.ns ? e.ns.map(p => p[1]) : [e.f]));
      if (minFret + tr < 0) tr += 12;
      const pref = A.pref(target);
      const transposeChord = symbol => {
        const parsed = GH.chords.parseSymbol(symbol); if (!parsed) return null;
        const root = N.noteName(N.mod(N.pcOf(parsed.root) + tr, 12), pref);
        const bass = parsed.bass ? N.noteName(N.mod(N.pcOf(parsed.bass) + tr, 12), pref) : null;
        return GH.chords.buildChord(root, parsed.qId, { bass });
      };
      const chordAt = []; const chordChanges = [];
      let currentChord = null;
      lick.notes.forEach(ev => {
        if (ev.ch) {
          const next = transposeChord(ev.ch);
          if (next) { currentChord = next; chordChanges.push(next); }
        }
        chordAt.push(currentChord);
      });
      const actualChords = chordChanges.filter((c, i, arr) => arr.findIndex(x => x.rootPc === c.rootPc && x.qId === c.qId && N.pcOf(x.bass) === N.pcOf(c.bass)) === i);
      const displayLick = Object.assign({}, lick, { notes: lick.notes.map(ev => {
        if (!ev.ch) return ev;
        const chord = transposeChord(ev.ch);
        return chord ? Object.assign({}, ev, { ch: chord.symbol }) : ev;
      }) });
      el.appendChild(h('div', { class: 'breadcrumb' }, h('a', { href: '#/guitar/licks' }, '릭'), ' › ', GH.data.lickGenres[lick.genre]));
      el.appendChild(h('h1', null, lick.ko));
      el.appendChild(h('div', { class: 'row' }, GH.ui.difficulty(lick.difficulty), GH.ui.badge(GH.data.lickGenres[lick.genre], 'accent'), GH.ui.badge('코드: ' + (chordChanges.length ? chordChanges.map(c => c.symbol).join(' – ') : lick.over)), GH.ui.badge('키 ' + N.pretty(target)), GH.ui.badge(lick.tempo + ' BPM · ' + (lick.feel === 'swing' ? '스윙' : lick.feel === 'shuffle' ? '셔플' : '스트레이트')), GH.ui.badge(lick.position)));
      el.appendChild(h('p', null, lick.desc));
      /* 컨트롤 */
      const tabR = GH.render.tab(displayLick, { transpose: tr });
      /* 템포는 BPM 으로 직접 적는다 (원래 템포에 대한 비율로 저장) */
      const tempoLabel = h('span', { class: 'muted' }, '원래 ' + lick.tempo + ' BPM');
      const tempoRange = GH.ui.rangeNumber({ value: Math.round(lick.tempo * detailState.tempoRatio), min: Math.max(30, Math.round(lick.tempo * 0.3)), max: Math.round(lick.tempo * 1.5), suffix: 'BPM', label: '템포', onInput: v => { detailState.tempoRatio = v / lick.tempo; } });
      let fb = null;
      const play = () => GH.player.playLick(lick, { tempo: lick.tempo * detailState.tempoRatio, loop: detailState.loop, transpose: tr, onNote: (i, ev) => { tabR.highlight(i); if (fb) { if (i < 0 || !ev || ev.rest) fb.highlightMany([]); else fb.highlightMany((ev.ns || [[ev.s, ev.f]]).map(([s, f]) => [s, f + tr])); } } });
      const tb = h('div', { class: 'toolbar' },
        A.playBtn('▶ 재생', play, 'primary'),
        A.playBtn('▶ 느리게 (60%)', () => { detailState.tempoRatio = 0.6; tempoRange.setValue(Math.round(lick.tempo * 0.6)); play(); }),
        A.stopBtn(),
        h('label', null, '템포', tempoRange, tempoLabel),
        h('label', null, h('input', { type: 'checkbox', checked: detailState.loop, onchange: e => { detailState.loop = e.target.checked; } }), '반복'),
        h('label', null, '키 옮기기', A.rootSelect(target, v => GH.router.go('/guitar/licks/' + encodeURIComponent(lick.id), { to: v === lick.key ? null : v }))),
        tr !== 0 ? h('span', { class: 'muted' }, '원래 키 ' + N.pretty(lick.key) + ' → ' + N.pretty(target) + ' (' + (tr > 0 ? '+' : '') + tr + '프렛)') : null);
      el.appendChild(tb);
      /* TAB */
      el.appendChild(section('TAB', h('div', { style: 'overflow-x:auto' }, tabR.el), h('p', { class: 'muted', style: 'font-size:.8rem' }, 'H 해머온, P 풀오프, sl. 슬라이드, full/½ 벤딩, 물결은 비브라토. 아래 스템은 리듬 (꼬리 1개 8분음표, 2개 16분음표).')));
      /* 오선 */
      const staff = GH.render.staff(displayLick, { transpose: tr, pref, width: Math.min(1100, el.clientWidth || 1000), title: lick.ko, style: GH.render.feelMark(lick.tempo, lick.feel) });
      el.appendChild(section('오선', staff || h('p', { class: 'muted' }, GH.render.hasVexFlow() ? '오선을 그릴 수 없습니다.' : '오선 표기는 VexFlow 라이브러리를 인터넷에서 불러와야 합니다. 온라인 상태에서 다시 열어 주세요.')));
      /* 지판 */
      const noteEntries = [];
      lick.notes.forEach((ev, i) => {
        if (ev.rest) return;
        const pairs = ev.ns ? ev.ns : [[ev.s, ev.f]];
        pairs.forEach(([s, f]) => {
          const midi = GH.voicings.STD[6 - s] + f + tr; const pc = N.mod(midi, 12);
          const c = chordAt[i]; let iv = '';
          if (c) { const lm = N.labelMap(c.rootPc, c.quality.intervals); iv = lm[pc] || N.tensionIv(N.intervalName(c.rootPc, pc)); }
          noteEntries.push({ i, s, f: f + tr, midi, pc, iv, name: N.noteName(pc, pref), chord: c, chordSym: c ? c.symbol : '', tech: ev.t, bend: ev.bend });
        });
      });
      const seen = new Set();
      const fbNotes = noteEntries.filter(n => { const k = n.s + ':' + n.f; if (seen.has(k)) return false; seen.add(k); return true; }).map(n => ({ s: n.s, f: n.f, label: n.iv, cls: N.ivClass(n.iv) }));
      const allF = fbNotes.map(n => n.f);
      fb = GH.render.fretboard({ notes: fbNotes, tuning: GH.voicings.STD, capo: 0, pref, from: Math.max(0, Math.min(...allF) - 1) > 1 ? Math.max(0, Math.min(...allF) - 2) : 0, to: Math.min(22, Math.max(...allF) + 2), labelMode: 'degree' });
      el.appendChild(section('지판 (첫 코드 기준 도수)', fb.el, h('div', { style: 'margin-top:6px' }, A.ivLegend()), h('p', { class: 'muted' }, '재생하면 현재 음이 강조됩니다. 라벨은 그 시점 코드에 대한 도수입니다.')));
      /* 분석 */
      const scale = GH.scales.get(lick.scale);
      const scaleChord = actualChords.find(c => (scale.chords || []).includes(c.qId)) || actualChords.find(c => c.rootPc === N.pcOf(target)) || actualChords[0];
      const scaleRoot = scaleChord ? scaleChord.root : target;
      el.appendChild(section('분석', h('p', null, lick.analysis),
        kv([['사용 스케일', h('a', { href: A.scaleHref(lick.scale, scaleRoot) }, N.pretty(scaleRoot) + ' ' + scale.ko)], ['코드', h('span', null, actualChords.map(c => h('a', { href: A.chordHref(c.root, c.qId), style: 'margin-right:8px' }, c.symbol + ' (' + c.quality.ko + ')')))], ['진행', h('span', null, (lick.progressionIds || []).map(id => { const p = GH.data.progressions.find(x => x.id === id); return p ? h('a', { href: A.progHref(id), style: 'margin-right:8px' }, p.ko) : null; }))]]),
        table(['#', '음', '코드', '도수', '기법'], noteEntries.map(n => [n.i + 1, N.pretty(n.name), n.chordSym, h('span', { class: 'pill ' + N.ivClass(n.iv) }, n.iv), (n.tech ? { h: '해머온', p: '풀오프', '/': '슬라이드 ↑', '\\': '슬라이드 ↓', b: '벤딩 ' + (n.bend === 1 ? '½' : n.bend === 3 ? '1½' : 'full'), '~': '비브라토' }[n.tech] : '')]))));
      /* 관련 */
      const related = GH.data.licks.filter(l => l.id !== lick.id && (l.genre === lick.genre || l.context.some(c => lick.context.includes(c)))).slice(0, 6);
      el.appendChild(section('관련 릭', h('div', { class: 'toc' }, related.map(l => h('a', { href: A.lickHref(l.id) }, l.ko)))));
    }
  };
})();
