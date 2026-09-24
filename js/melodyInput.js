/* 공용 멜로디 입력: 피아노 건반 / 기타 지판 / 글자 입력. 멜로디 → 코드, 멜로디 화음 쌓기 페이지가 같이 쓴다 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const { h, select } = GH.ui; const N = GH.notes;

  /* "C D E F G A B C5" → midi 목록. 옥타브 숫자를 적으면 그 뒤로 이어진다 (기본 4) */
  function parseText(text) {
    const out = []; const names = []; const bad = []; let oct = 4;
    String(text || '').split(/[\s,]+/).filter(Boolean).forEach(tok => {
      const m = /^([A-Ga-g](?:##|#|bb|b|♯|♭)?)(-?\d)?$/.exec(tok);
      if (!m) { bad.push(tok); return; }
      if (m[2]) oct = Number(m[2]);
      const pc = N.pcOf(m[1]); if (pc == null) { bad.push(tok); return; }
      out.push((oct + 1) * 12 + pc); names.push(N.normalize(m[1].replace('♯', '#').replace('♭', 'b')));
    });
    return { midis: out, names, bad };
  }
  /* midi 목록 → 주소에 넣을 글자 ("C4 D4 E4") */
  function toText(midis, pref, names) { return midis.map((m, i) => names && names[i] ? names[i] + (Math.floor(m / 12) - 1) : N.midiName(m, pref || 'sharp')).join(' '); }

  /* st.names: 글자로 입력한 음의 철자 (notes 와 같은 순서, 건반·지판 입력은 null) */
  function syncNames(st) { if (!Array.isArray(st.names)) st.names = []; while (st.names.length < st.notes.length) st.names.push(null); st.names.length = st.notes.length; }
  /* opts: {state: {notes, names, input, text}, pref, onChange(), max, emptyText}
     반환: {controls: [툴바에 넣을 노드], panel: 입력 영역, seq: 현재 멜로디 카드} */
  function render(opts) {
    const st = opts.state; const pref = opts.pref || 'sharp'; const max = opts.max || 32;
    syncNames(st);
    const changed = () => opts.onChange && opts.onChange();
    const add = m => { if (st.notes.length >= max) return; st.notes.push(m); st.names.push(null); changed(); };
    const btn = (label, fn) => h('button', { class: 'btn small', type: 'button', onclick: fn }, label);

    const seqRow = h('div', { class: 'melody-seq' });
    if (!st.notes.length) seqRow.appendChild(h('span', { class: 'muted' }, opts.emptyText || '건반이나 지판을 눌러 멜로디를 넣으세요.'));
    st.notes.forEach((m, i) => seqRow.appendChild(h('button', { class: 'pill iv-s mnote', type: 'button', title: '누르면 삭제', onclick: () => { st.notes.splice(i, 1); st.names.splice(i, 1); changed(); } }, N.pretty(st.names[i] ? st.names[i] + (Math.floor(m / 12) - 1) : N.midiName(m, pref)))));
    const seq = h('div', { class: 'card', style: 'margin-top:10px' }, h('div', { class: 'row' }, h('b', null, '멜로디'), seqRow));

    const controls = [
      h('label', null, '입력', select({ options: [{ value: 'piano', label: '피아노 건반' }, { value: 'fret', label: '기타 지판' }, { value: 'text', label: '글자로 (C D E …)' }], value: st.input, onChange: v => { st.input = v; changed(); } })),
      btn('마지막 음 지우기', () => { st.notes.pop(); st.names.pop(); changed(); }),
      btn('전부 지우기', () => { st.notes = []; st.names = []; changed(); })
    ];

    let panel;
    if (st.input === 'fret') {
      panel = h('div', null, GH.render.fretboard({ pref, to: 15, labelMode: 'name', onClick: (s, f, midi) => add(midi) }).el);
    } else if (st.input === 'text') {
      const input = h('input', { type: 'text', placeholder: '예: C D E F G A B C5 (옥타브 숫자는 선택)', value: st.text || toText(st.notes, pref, st.names), style: 'flex:1 1 260px' });
      const apply = () => { const r = parseText(input.value); if (r.bad.length) { alert('읽을 수 없는 음: ' + r.bad.join(', ')); return; } st.notes = r.midis.slice(0, max); st.names = r.names.slice(0, max); st.text = ''; changed(); };
      input.addEventListener('keydown', e => { if (e.key === 'Enter') apply(); });
      panel = h('div', { class: 'toolbar' }, input, h('button', { class: 'btn small', type: 'button', onclick: apply }, '적용'));
    } else {
      const onMidi = {}; st.notes.forEach(m => { onMidi[m] = { label: N.noteName(N.mod(m, 12), pref), cls: 'iv-s' }; });
      panel = h('div', { class: 'card', style: 'padding:12px' }, GH.render.piano({ from: 48, to: 79, pref, onMidi, onClick: add }), h('p', { class: 'muted', style: 'margin:8px 0 0;font-size:.82rem' }, '건반을 누르면 소리가 나며 멜로디 끝에 추가됩니다.'));
    }
    return { controls, panel, seq };
  }
  /* 주소의 notes 값이 바뀌었을 때만 멜로디를 덮어쓴다 (같은 주소로 다시 그릴 때 편집 내용을 지키기 위해) */
  function applyQuery(st, qy) {
    if (qy.notes && qy.notes !== st.fromParam) { st.fromParam = qy.notes; const r = parseText(qy.notes); if (r.midis.length) { st.notes = r.midis; st.names = r.names; } }
  }
  GH.melodyInput = { parseText, toText, render, applyQuery };
})();
