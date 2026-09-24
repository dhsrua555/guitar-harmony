/* 연습 › 멜로디 화음 쌓기 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, section, select, callout } = GH.ui; const N = GH.notes; const HM = GH.harmony;

  const MAX_VOICES = 3;
  const DEFAULT_PANS = [-0.5, 0.5, -0.2];
  const newVoice = i => ({ mode: 'diatonic', size: ['3', '6', '8'][i] || '3', par: 'M3', dir: i === 0 ? 1 : -1, pan: DEFAULT_PANS[i] || 0, mute: false, solo: false });
  const state = {
    notes: [60, 62, 64, 65, 67, 69, 71, 72], names: [], input: 'piano', text: '', fromParam: null, keyParam: null, scaleParam: null,
    key: null, scale: 'ionian', tempo: 92, loop: false,
    melody: { pan: 0, mute: false, solo: false },
    voices: [newVoice(0)],
    ds: { voice: 0, gap: 'auto', allowOpen: true, maxFret: 15, octave: 0 }
  };
  const PRESETS = [
    ['3도 위', [{ size: '3', dir: 1 }]],
    ['6도 아래', [{ size: '6', dir: -1 }]],
    ['3도 + 5도 위 (3화음)', [{ size: '3', dir: 1 }, { size: '5', dir: 1 }]],
    ['3도 위 + 옥타브 아래', [{ size: '3', dir: 1 }, { size: '8', dir: -1 }]],
    ['평행 완전4도 아래', [{ mode: 'parallel', par: 'P4', dir: -1 }]]
  ];

  /* ---- 재생 ---- */
  let timers = [];
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  GH.events.on('player-stop', clearTimers);
  function audible(part) {
    const parts = [state.melody].concat(state.voices);
    const anySolo = parts.some(p => p.solo);
    return anySolo ? part.solo : !part.mute;
  }
  function playColumns(res, from, to, onCol) {
    GH.player.stop();
    const A = GH.audio; if (!A.context()) return;
    const beat = 60 / state.tempo; const t0 = A.now() + 0.08;
    const pass = start => {
      for (let i = from; i < to; i++) {
        const at = start + (i - from) * beat;
        if (audible(state.melody)) A.pluck(res.melody[i].midi, at, beat * 0.96, { gain: 1, pan: state.melody.pan, bus: 'melody' });
        res.voices.forEach((notes, v) => { if (audible(state.voices[v])) A.pluck(notes[i].midi, at + 0.004 * (v + 1), beat * 0.96, { gain: 0.82, pan: state.voices[v].pan, bus: 'melody' }); });
        if (onCol) timers.push(setTimeout(() => onCol(i), Math.max(0, (at - A.now()) * 1000)));
      }
      const end = start + (to - from) * beat;
      timers.push(setTimeout(() => {
        if (state.loop && to - from > 1) pass(end);
        else if (onCol) onCol(-1);
      }, Math.max(0, (end - A.now() - (state.loop ? 0.25 : 0)) * 1000)));
    };
    pass(t0);
  }

  function voiceColors() {
    const cs = getComputedStyle(document.documentElement);
    return [0, 1, 2, 3].map(i => (cs.getPropertyValue('--voice-' + i) || '').trim() || ['#1b1c1e', '#2f6fb0', '#c2562e', '#3c8a5a'][i]);
  }

  GH.pages['/tools/harmony'] = {
    title: '멜로디 화음 쌓기',
    staff: true,
    render(el, params) {
      const A = GH.app; const qy = params.query || {};
      GH.melodyInput.applyQuery(state, qy);
      if (qy.key && qy.key !== state.keyParam && N.pcOf(qy.key) != null) { state.keyParam = qy.key; state.key = N.normalize(qy.key); }
      if (qy.scale && qy.scale !== state.scaleParam && HM.isHeptatonic(qy.scale)) { state.scaleParam = qy.scale; state.scale = qy.scale; }
      const key = state.key || A.key(); const pref = A.pref(key);
      const rerender = () => GH.router.rerender();

      el.appendChild(h('h1', null, '멜로디 화음 쌓기'));
      el.appendChild(h('p', { class: 'muted' }, '멜로디 위나 아래에 3도, 5도, 6도 간격의 화음 성부를 최대 세 개까지 쌓습니다. 다이어토닉은 스케일 안의 음만 쓰기 때문에 장3도와 단3도가 음마다 자동으로 바뀌고, 평행은 모든 음을 같은 반음 간격으로 옮깁니다. 성부마다 소리를 끄거나 따로 들을 수 있습니다.'));

      /* ---- 입력 ---- */
      const input = GH.melodyInput.render({ state, pref, onChange: rerender });
      el.appendChild(h('div', { class: 'toolbar' },
        input.controls[0],
        h('label', null, '키', A.rootSelect(key, v => { state.key = v; rerender(); })),
        h('label', null, '스케일', A.scaleSelect(state.scale, v => { state.scale = v; rerender(); }, s => s.intervals.length === 7)),
        input.controls.slice(1)));
      el.appendChild(input.panel);
      el.appendChild(input.seq);
      if (!state.notes.length) { el.appendChild(GH.ui.empty('멜로디를 넣으면 화음 성부를 만들어 줍니다.')); return; }

      const res = HM.build(state.notes, key, state.scale, state.voices, state.names);
      const colors = voiceColors();

      /* ---- 성부 설정 ---- */
      const partControls = (part, idx) => {
        const panLabel = h('span', { class: 'mono pan-label' });
        const setPanLabel = v => { panLabel.textContent = Math.abs(v) < 0.05 ? '가운데' : (v < 0 ? '왼쪽 ' : '오른쪽 ') + Math.round(Math.abs(v) * 100); };
        setPanLabel(part.pan);
        const toggle = (label, prop, cls) => h('button', { class: 'btn small toggle ' + cls + (part[prop] ? ' active' : ''), type: 'button', 'aria-pressed': part[prop] ? 'true' : 'false', onclick: () => { part[prop] = !part[prop]; rerender(); } }, label);
        return [
          h('label', null, '팬', h('input', { type: 'range', min: -1, max: 1, step: 0.1, value: part.pan, style: 'width:96px', 'aria-label': (idx < 0 ? '멜로디' : '성부 ' + (idx + 1)) + ' 팬', oninput: e => { part.pan = Number(e.target.value); setPanLabel(part.pan); } }), panLabel),
          toggle('뮤트', 'mute', 'mute'), toggle('솔로', 'solo', 'solo')
        ];
      };
      const rows = h('div', { class: 'voice-rows' });
      rows.appendChild(h('div', { class: 'voice-row' }, h('span', { class: 'voice-tag', style: '--vc:' + colors[0] }, '멜로디'), h('span', { class: 'muted voice-desc' }, '입력한 음 그대로'), partControls(state.melody, -1)));
      state.voices.forEach((v, i) => {
        const sizeSel = v.mode === 'parallel'
          ? select({ options: HM.PARALLEL_ORDER.map(k => ({ value: k, label: HM.PARALLEL[k].ko + ' (' + HM.PARALLEL[k].semis + '반음)' })), value: v.par, onChange: x => { v.par = x; rerender(); } })
          : select({ options: HM.SIZE_ORDER.map(k => ({ value: k, label: HM.SIZES[k].ko })), value: v.size, onChange: x => { v.size = x; rerender(); } });
        rows.appendChild(h('div', { class: 'voice-row' },
          h('span', { class: 'voice-tag', style: '--vc:' + colors[i + 1] }, '성부 ' + (i + 1)),
          h('label', null, '방식', select({ options: [{ value: 'diatonic', label: '다이어토닉 (스케일 안)' }, { value: 'parallel', label: '평행 (고정 반음)' }], value: v.mode, onChange: x => { v.mode = x; rerender(); } })),
          h('label', null, '간격', sizeSel),
          h('label', null, '방향', select({ options: [{ value: '1', label: '위' }, { value: '-1', label: '아래' }], value: String(v.dir), onChange: x => { v.dir = Number(x); rerender(); } })),
          partControls(v, i),
          h('button', { class: 'btn small', type: 'button', 'aria-label': '성부 ' + (i + 1) + ' 삭제', onclick: () => { state.voices.splice(i, 1); rerender(); } }, '삭제')));
      });
      const presetRow = h('div', { class: 'row', style: 'gap:6px' }, h('span', { class: 'muted', style: 'font-size:.84rem' }, '빠른 설정'),
        PRESETS.map(([label, list]) => h('button', { class: 'chip', type: 'button', onclick: () => { state.voices = list.map((p, i) => Object.assign(newVoice(i), p)); rerender(); } }, label)));
      el.appendChild(section('성부',
        presetRow, rows,
        state.voices.length < MAX_VOICES ? h('button', { class: 'btn small', type: 'button', style: 'margin-top:8px', onclick: () => { state.voices.push(newVoice(state.voices.length)); rerender(); } }, '＋ 성부 추가') : h('p', { class: 'muted', style: 'font-size:.84rem' }, '성부는 멜로디 외에 세 개까지 쌓을 수 있습니다.')));

      /* ---- 재생 ---- */
      const tempoLabel = h('span', { class: 'mono' }, state.tempo);
      let staffView = null;
      const highlight = i => {
        grid.querySelectorAll('[data-col]').forEach(c => c.classList.toggle('current', Number(c.dataset.col) === i));
        if (staffView) staffView.highlight(i);
      };
      el.appendChild(h('div', { class: 'toolbar' },
        A.playBtn('▶ 전체 재생', () => playColumns(res, 0, state.notes.length, highlight), 'primary'), A.stopBtn(),
        h('label', null, '템포', h('input', { type: 'range', min: 40, max: 200, value: state.tempo, oninput: e => { state.tempo = Number(e.target.value); tempoLabel.textContent = state.tempo; } }), tempoLabel),
        h('label', null, h('input', { type: 'checkbox', checked: state.loop, onchange: e => { state.loop = e.target.checked; } }), '반복'),
        h('span', { class: 'muted', style: 'font-size:.84rem' }, '열 번호를 누르면 그 박의 화음만 들립니다.')));

      /* ---- 오선 ---- */
      const columns = state.notes.map((m, i) => [{ midi: res.melody[i].midi, name: res.melody[i].name, voice: 0, outOfScale: res.melody[i].outOfScale }]
        .concat(res.voices.map((notes, v) => ({ midi: notes[i].midi, name: notes[i].name, voice: v + 1, outOfScale: notes[i].outOfScale }))));
      staffView = GH.render.voicesStaff(columns, { pref, colors, width: Math.min(1180, el.clientWidth || 1000) });
      const staffBox = staffView ? staffView.el : h('p', { class: 'muted' }, GH.render.hasVexFlow() ? '오선을 그릴 수 없습니다.' : '오선 표기는 VexFlow 라이브러리를 인터넷에서 불러와야 합니다. 온라인 상태에서 다시 열어 주세요.');

      /* ---- 음정 표 ---- */
      const grid = h('table', { class: 'table harm-grid' });
      const head = h('tr', null, h('th', null, ''), state.notes.map((m, i) => h('th', { 'data-col': i }, h('button', { class: 'col-btn', type: 'button', title: (i + 1) + '번째 화음 듣기', onclick: () => playColumns(res, i, i + 1, highlight) }, i + 1))));
      const melRow = h('tr', null, h('th', { class: 'row-head' }, h('span', { class: 'voice-dot', style: 'background:' + colors[0] }), '멜로디'),
        res.melody.map((m, i) => h('td', { 'data-col': i, class: m.outOfScale ? 'oos' : '' }, h('b', null, N.pretty(m.name)), h('small', null, m.label), m.outOfScale ? h('em', null, '스케일 밖') : null)));
      const vRows = res.voices.map((notes, v) => h('tr', null, h('th', { class: 'row-head' }, h('span', { class: 'voice-dot', style: 'background:' + colors[v + 1] }), '성부 ' + (v + 1)),
        notes.map((n, i) => h('td', { 'data-col': i, class: n.outOfScale ? 'oos' : '' }, h('b', null, N.pretty(n.name)), h('span', { class: 'iv-tag', style: '--vc:' + colors[v + 1], title: n.iv ? n.iv.ko : '' }, n.iv ? n.iv.en : '?'), n.outOfScale ? h('em', null, '스케일 밖') : null))));
      grid.appendChild(h('thead', null, head));
      grid.appendChild(h('tbody', null, vRows.slice().reverse().filter((r, k) => state.voices[state.voices.length - 1 - k].dir > 0), melRow, vRows.filter((r, k) => state.voices[k].dir < 0)));
      const summary = res.voices.map((notes, v) => {
        const count = {}; notes.forEach(n => { const k = n.iv ? n.iv.en : '?'; count[k] = (count[k] || 0) + 1; });
        return h('li', null, h('span', { class: 'voice-dot', style: 'background:' + colors[v + 1] }), h('b', null, '성부 ' + (v + 1)), ' · ' + HM.cfgLabel(state.voices[v]) + ' · ', Object.entries(count).map(([k, c]) => k + ' ×' + c).join(', '));
      });
      el.appendChild(section('결과',
        h('div', { class: 'legend' }, [h('span', null, h('span', { class: 'sw', style: 'background:' + colors[0] }), '멜로디')].concat(state.voices.map((v, i) => h('span', null, h('span', { class: 'sw', style: 'background:' + colors[i + 1] }), '성부 ' + (i + 1))))),
        staffBox,
        h('div', { class: 'table-wrap', style: 'margin-top:12px' }, grid),
        summary.length ? h('ul', { class: 'plain harm-summary' }, summary) : null,
        h('p', { class: 'muted', style: 'font-size:.86rem' }, '음정 표기: M 장, m 단, P 완전, d 감, A 증. 멜로디가 스케일 밖 음이면 기준 스케일 음에서 변한 반음만큼 화음도 함께 옮겨, 멜로디와 화음 사이의 음정이 유지됩니다.')));

      /* ---- 기타 더블스탑: 멜로디 + 성부 하나 ---- */
      if (res.voices.length) {
        const ds = state.ds; if (ds.voice >= res.voices.length) ds.voice = 0;
        const vNotes = res.voices[ds.voice];
        const steps = res.melody.map((m, i) => {
          const v = vNotes[i]; const up = v.midi > m.midi;
          const lo = (up ? m.midi : v.midi) + ds.octave, hi = (up ? v.midi : m.midi) + ds.octave;
          return { lo, hi, num: v.iv ? v.iv.num : 3, labels: up ? [N.pretty(v.name), N.pretty(m.name)] : [N.pretty(m.name), N.pretty(v.name)] };
        });
        const dsBox = GH.doublestops.view(steps, { gap: ds.gap, allowOpen: ds.allowOpen, maxFret: ds.maxFret, tempo: () => state.tempo, pref });
        el.appendChild(section('기타 더블스탑으로 치기',
          h('p', { class: 'muted' }, '멜로디와 성부 하나를 두 줄에 나눠 동시에 누르는 운지로 바꿉니다. 두 음의 프렛 차이는 3칸 이하로 제한하고, 앞 운지에서 손이 가장 적게 움직이는 자리를 골라 이어 줍니다. 튜닝과 카포는 설정을 따릅니다.'),
          h('div', { class: 'toolbar' },
            h('label', null, '성부', select({ options: res.voices.map((v, i) => ({ value: i, label: '성부 ' + (i + 1) + ' · ' + HM.cfgLabel(state.voices[i]) })), value: ds.voice, onChange: v => { ds.voice = Number(v); rerender(); } })),
            h('label', null, '줄 규칙', select({ options: GH.doublestops.GAP_OPTIONS, value: ds.gap, onChange: v => { ds.gap = v; rerender(); } })),
            h('label', null, '최대', select({ options: GH.doublestops.FRET_OPTIONS, value: ds.maxFret, onChange: v => { ds.maxFret = Number(v); rerender(); } })),
            h('label', null, '옥타브', select({ options: [{ value: 0, label: '입력한 높이' }, { value: 12, label: '한 옥타브 위' }, { value: -12, label: '한 옥타브 아래' }], value: ds.octave, onChange: v => { ds.octave = Number(v); rerender(); } })),
            h('label', null, h('input', { type: 'checkbox', checked: ds.allowOpen, onchange: e => { ds.allowOpen = e.target.checked; rerender(); } }), '개방현 허용')),
          dsBox,
          h('div', { class: 'toc' }, h('a', { href: '#/guitar/doublestops' }, '스케일 더블스탑 패턴 연습 →'))));
      }
      el.appendChild(callout(h('b', null, '듣는 요령. '), '다이어토닉 3도 위는 가장 무난한 화음입니다. 장3도와 단3도가 섞이며 키 안에서 자연스럽게 움직입니다. 6도 아래는 3도 위를 한 옥타브 내린 것과 같은 음이라 더 넓게 들립니다. 5도 위에서 7번째 음 위에 감5도가 생기는 곳은 긴장이 큰 자리라 짧게 지나가는 편이 좋습니다.'));
      el.appendChild(h('div', { class: 'toc' },
        h('a', { href: GH.router.href('/tools/melody', { notes: GH.melodyInput.toText(state.notes, pref, state.names), key }) }, '이 멜로디에 코드 붙이기 →'),
        h('a', { href: A.intervalHref ? A.intervalHref('3', key) : '#/theory/intervals' }, '음정 이론 →')));
    }
  };
})();
