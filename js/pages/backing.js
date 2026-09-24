/* 연습 › 백킹트랙 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, select, notice, callout } = GH.ui; const N = GH.notes;
  const STYLE_MAP = { soul: 'ballad', gospel: 'pop' };
  const state = { source: 'prog', id: 'ii-V-I', text: 'C | Am7 | F | G7', key: null, tempo: null, style: null, loop: true, countIn: true, drums: true, bass: true, comp: true, metronome: false, mix: { drums: 0.9, bass: 1, chords: 0.8 }, voicing: 'auto' };

  /* "Dm7 G7 | Cmaj7 | Am7 D7" → 코드 목록. '|' 가 없으면 코드 하나가 한 마디 */
  function parseText(text, key) {
    const bad = []; const chords = [];
    const hasBars = text.includes('|');
    const bars = hasBars ? text.split('|').map(s => s.trim()).filter(Boolean) : text.split(/\s+/).filter(Boolean);
    const keyPc = N.pcOf(key);
    bars.forEach(bar => {
      const toks = bar.split(/\s+/).filter(Boolean); if (!toks.length) return;
      const beats = 4 / toks.length;
      toks.forEach(tk => {
        const p = GH.chords.parseSymbol(tk);
        const c = p ? GH.chords.buildChord(p.root, p.qId, { bass: p.bass }) : null;
        if (!c) { bad.push(tk); return; }
        const deg = GH.chords.MAJOR_DEG.indexOf(N.mod(c.rootPc - keyPc, 12));
        const dia = deg >= 0 ? GH.chords.diatonic(key, 'ionian', c.quality.intervals.length >= 4)[deg] : null;
        const same = dia && dia.qId && GH.chords.getQuality(dia.qId).family === c.quality.family;
        const fn = same ? dia.fn : (c.quality.family === 'dominant' ? 'D' : 'X');
        chords.push(Object.assign(c, { beats, fn, roman: same ? dia.roman : '' }));
      });
    });
    return { chords, bad };
  }
  function progGroups() {
    const groups = {}; GH.data.progressions.forEach(p => { const g = p.genres[0] || 'pop'; (groups[g] = groups[g] || []).push(p); });
    return groups;
  }

  GH.pages['/backing'] = {
    title: '백킹 트랙',
    render(el, params) {
      const A = GH.app; const qy = params.query || {}; const S = GH.backing.STYLES;
      if (qy.id && GH.data.progressions.find(p => p.id === qy.id)) { if (qy.id !== state.id || state.source !== 'prog') { state.tempo = null; state.style = null; } state.source = 'prog'; state.id = qy.id; }
      if (qy.chords) { state.source = 'text'; state.text = qy.chords; }
      if (qy.key && N.pcOf(qy.key) != null) state.key = N.normalize(qy.key);
      if (qy.style && S[qy.style]) state.style = qy.style;
      if (qy.tempo && Number(qy.tempo) > 0) state.tempo = Number(qy.tempo);
      const key = state.key || A.key(); const pref = A.pref(key);
      const P = GH.data.progressions.find(p => p.id === state.id) || GH.data.progressions[0];
      let chords = [], bad = [];
      if (state.source === 'text') { const r = parseText(state.text, key); chords = r.chords; bad = r.bad; }
      else chords = A.progressionChords(P, key);
      const pStyle = state.source === 'prog' ? (STYLE_MAP[P.style] || P.style) : null;
      const style = state.style || (pStyle && S[pStyle] ? pStyle : 'pop');
      const tempo = state.tempo || (state.source === 'prog' && P.tempo) || S[style].tempo;
      const go = patch => GH.router.go('/backing', Object.assign({ id: state.source === 'prog' ? state.id : null, chords: state.source === 'text' ? state.text : null, key: state.key, style: state.style, tempo: state.tempo, noscroll: 1 }, patch));

      el.appendChild(h('h1', null, '백킹 트랙'));
      el.appendChild(h('p', { class: 'muted' }, '드럼, 베이스, 컴핑과 함께 솔로와 리듬을 연습합니다. 진행을 고르거나 코드를 직접 입력하고, 그루브와 템포를 바꿔 반복 재생하세요. 재생 중에는 현재 코드와 코드 스케일 후보가 지판에 표시됩니다.'));

      /* ---- 소스 ---- */
      const src = h('div', { class: 'toolbar' });
      src.appendChild(h('label', null, '소스', select({ options: [{ value: 'prog', label: '코드 진행 선택' }, { value: 'text', label: '직접 입력' }], value: state.source, onChange: v => { state.source = v; go({}); } })));
      if (state.source === 'prog') {
        const sel = h('select', { onchange: e => { state.id = e.target.value; state.tempo = null; state.style = null; go({ id: e.target.value, style: null, tempo: null }); } });
        const groups = progGroups();
        Object.keys(GH.data.genres).forEach(g => { const list = groups[g]; if (!list) return; const og = h('optgroup', { label: GH.data.genres[g] }); list.forEach(p => { const o = h('option', { value: p.id }, p.ko); if (p.id === P.id) o.selected = true; og.appendChild(o); }); sel.appendChild(og); });
        src.appendChild(h('label', null, '진행', sel));
      } else {
        const input = h('input', { type: 'text', value: state.text, placeholder: '예: Dm7 G7 | Cmaj7 | Am7 D7 | Gmaj7', style: 'min-width:260px;flex:1 1 320px', onkeydown: e => { if (e.key === 'Enter') { state.text = e.target.value; go({ chords: state.text }); } } });
        src.appendChild(h('label', { style: 'flex:1 1 360px' }, '코드', input));
        src.appendChild(h('button', { class: 'btn small', type: 'button', onclick: () => { state.text = input.value; go({ chords: state.text }); } }, '적용'));
      }
      src.appendChild(h('label', null, '키', A.rootSelect(key, v => { state.key = v; go({ key: v }); })));
      el.appendChild(src);
      if (state.source === 'text') el.appendChild(h('p', { class: 'muted', style: 'margin:-8px 0 12px;font-size:.84rem' }, '세로줄(|)로 마디를 나누고, 한 마디 안의 코드는 박을 나눠 가집니다. 세로줄이 없으면 코드 하나가 한 마디입니다. 슬래시 코드(C/E)와 텐션(G7b9, Cmaj9)도 됩니다.'));
      if (bad.length) el.appendChild(notice('읽을 수 없는 코드: ' + bad.join(', ') + ' — 표기를 확인해 주세요 (예: Dm7, G7, Cmaj7, Bm7b5, F#dim7).'));
      if (!chords.length) { el.appendChild(GH.ui.empty('코드를 입력하면 반주가 만들어집니다.')); return; }

      /* ---- 재생 컨트롤 ---- */
      const voicings = (() => { try { const kind = ['swing', 'bossa', 'funk', 'reggae'].includes(style) ? 'drop2' : 'caged'; return GH.voicings.voiceLead(chords, { kind, strSet: '5-4-3-2' }); } catch (e) { return null; } })();
      const strip = A.chordStrip(chords, { link: true });
      const chart = h('div', { class: 'chart', style: 'margin:12px 0' });
      const cellsByChord = []; let barEl = null, beatsInBar = 0, barIdx = 0;
      chords.forEach((c, i) => {
        if (beatsInBar === 0) { barEl = h('div', { class: 'bar' }, h('div', { class: 'num' }, (barIdx + 1) + '마디')); chart.appendChild(barEl); }
        barEl.appendChild(h('span', { class: 'ch ' + A.fnClass(c.fn), style: 'margin-right:8px' }, c.symbol)); cellsByChord.push(barEl);
        beatsInBar += c.beats; if (beatsInBar >= 4 - 1e-6) { beatsInBar = 0; barIdx++; }
      });
      const dots = h('div', { class: 'beat-dots', 'aria-hidden': 'true' }, [0, 1, 2, 3].map(() => h('span', { class: 'beat-dot' })));
      const nowBox = h('div', { class: 'now-box' });
      const playBtn = h('button', { class: 'btn primary', type: 'button' }, '▶ 시작');
      const setPlaying = on => { playBtn.textContent = on ? '■ 정지' : '▶ 시작'; playBtn.classList.toggle('playing', on); };
      const onBeat = (b, bar) => { dots.querySelectorAll('.beat-dot').forEach((d, i) => { d.classList.toggle('on', i === b); d.classList.toggle('count', bar === -1 && i === b); }); };
      const onChord = i => {
        strip.setCurrent(i);
        chart.querySelectorAll('.bar').forEach(b => b.classList.remove('current'));
        if (i >= 0 && cellsByChord[i]) cellsByChord[i].classList.add('current');
        renderNow(i);
      };
      /* 화면을 열면 드럼 · 베이스 녹음 파일을 미리 받아 둔다 (풀기는 재생할 때) */
      if (GH.samples && GH.samples.enabled()) { GH.samples.prefetch('drums'); GH.samples.prefetch((S[style] && S[style].bassInst) || 'bass'); }
      const start = () => {
        GH.backing.start({ chords, voicings, tempo: state.tempo || tempo, style, loop: state.loop, countIn: state.countIn, drums: state.drums, bass: state.bass, comp: state.comp, metronome: state.metronome, onChord, onBeat, onStop: () => setPlaying(false) });
        Object.entries(state.mix).forEach(([k, v]) => GH.audio.setBusGain(k, v));
        setPlaying(true);
      };
      playBtn.addEventListener('click', () => { if (GH.backing.isPlaying()) GH.backing.stop(); else start(); });
      const tb = h('div', { class: 'toolbar' },
        playBtn,
        h('label', null, '템포', GH.ui.rangeNumber({ value: tempo, min: 30, max: 260, suffix: 'BPM', label: '템포', onInput: v => { state.tempo = v; GH.backing.update({ tempo: v }); } })),
        h('label', null, '그루브', select({ options: GH.backing.STYLE_ORDER.map(id => ({ value: id, label: S[id].ko })), value: style, onChange: v => { state.style = v; if (!state.tempo) { /* 스타일 기본 템포로 */ } GH.backing.update({ style: v }); go({ style: v }); } })),
        h('label', null, h('input', { type: 'checkbox', checked: state.loop, onchange: e => { state.loop = e.target.checked; GH.backing.update({ loop: state.loop }); } }), '반복'),
        h('label', null, h('input', { type: 'checkbox', checked: state.countIn, onchange: e => { state.countIn = e.target.checked; } }), '카운트 인'),
        h('label', null, h('input', { type: 'checkbox', checked: state.metronome, onchange: e => { state.metronome = e.target.checked; GH.backing.update({ metronome: state.metronome }); } }), '메트로놈'));
      el.appendChild(tb);
      /* 믹스 */
      const mixRow = h('div', { class: 'toolbar mix' });
      [['drums', '드럼'], ['bass', '베이스'], ['chords', '컴핑']].forEach(([k, label]) => {
        const on = h('input', { type: 'checkbox', checked: state[k === 'chords' ? 'comp' : k], onchange: e => { state[k === 'chords' ? 'comp' : k] = e.target.checked; GH.backing.update({ [k === 'chords' ? 'comp' : k]: e.target.checked }); } });
        const vol = h('input', { type: 'range', min: 0, max: 1.2, step: 0.05, value: state.mix[k], style: 'width:90px', oninput: e => { state.mix[k] = Number(e.target.value); GH.audio.setBusGain(k, state.mix[k]); } });
        mixRow.appendChild(h('label', null, on, label, vol));
      });
      mixRow.appendChild(h('label', null, '컴핑 음색', select({ options: GH.audio.PRESET_ORDER.map(id => ({ value: id, label: GH.audio.PRESETS[id].ko })), value: GH.state.get().instrument, onChange: v => GH.state.set({ instrument: v }) })));
      mixRow.appendChild(h('span', { class: 'muted', style: 'font-size:.8rem' }, chords.reduce((a, c) => a + c.beats, 0) / 4 + '마디 · 4/4'));
      el.appendChild(mixRow);
      el.appendChild(h('div', { class: 'row', style: 'gap:14px' }, dots, strip));
      el.appendChild(chart);

      /* ---- 현재 코드 ---- */
      function renderNow(i) {
        GH.ui.clear(nowBox);
        const idx = i >= 0 ? i : 0; const c = chords[idx]; if (!c) return;
        const fits = GH.scales.forChord(c.qId); const sc = fits[0] ? fits[0].scale : GH.scales.get('ionian');
        const lm = GH.scales.labelMap(c.rootPc, sc.id); const chordPcs = new Set(c.pcs);
        const pcMap = {}; Object.keys(lm).forEach(pc => { pcMap[pc] = { label: lm[pc], cls: chordPcs.has(Number(pc)) ? N.ivClass(lm[pc]) : 'iv-x' }; });
        nowBox.appendChild(h('div', { class: 'row', style: 'justify-content:space-between' },
          h('div', { class: 'row' }, h('span', { class: 'eyebrow' }, i >= 0 ? '재생 중' : '첫 코드'), h('span', { class: 'symbol-big' }, c.symbol), c.roman ? h('span', { class: 'muted' }, c.roman) : null, h('span', { class: A.fnClass(c.fn) }, GH.chords.FN_KO[c.fn] || '비다이어토닉')),
          h('div', { class: 'row' }, h('a', { class: 'btn small', href: A.chordHref(c.root, c.qId) }, '코드 상세 →'), h('a', { class: 'btn small', href: A.scaleHref(sc.id, c.root) }, '스케일 포지션 →'))));
        nowBox.appendChild(h('p', { class: 'muted', style: 'margin:6px 0' }, '스케일 후보: ', h('b', null, N.pretty(c.root) + ' ' + sc.ko), fits.length > 1 ? ' · 다른 후보: ' + fits.slice(1, 3).map(f => f.scale.ko).join(', ') : '', ' — 실제 선택은 조성과 앞뒤 진행을 함께 고려하세요. 색 있는 음은 코드톤, 회색은 나머지 스케일 음입니다.'));
        nowBox.appendChild(GH.render.fretboard({ pcMap, pref, to: 15 }).el);
      }
      renderNow(-1);
      el.appendChild(section('현재 코드 위에서 연습하기', nowBox, h('div', { style: 'margin-top:6px' }, A.ivLegend())));
      el.appendChild(callout(h('b', null, '연습 아이디어. '), '처음에는 코드톤만으로 한 마디에 두세 음씩 연주해 보세요. 다음에는 코드가 바뀌기 직전에 다음 코드의 코드톤으로 반음·온음 어프로치를 연결합니다. 익숙해지면 템포를 10 BPM씩 올리고, 그루브를 바꿔 같은 진행을 다른 리듬으로 연습해 보세요.'));
      if (state.source === 'prog') el.appendChild(h('div', { class: 'toc' }, h('a', { href: A.progHref(P.id, key) }, '진행 분석 · 보이싱 →'), h('a', { href: '#/ear?tab=root' }, '진행 듣고 근음 맞히기 퀴즈 →')));
    }
  };
})();
