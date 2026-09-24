/* DOM 유틸리티, 공용 UI 컴포넌트, 이벤트 버스 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  GH.pages = GH.pages || {};

  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(x => append(el, x)); return; }
    if (c instanceof Node) { el.appendChild(c); return; }
    el.appendChild(document.createTextNode(String(c)));
  }
  function applyAttrs(el, attrs, isSvg) {
    if (!attrs) return;
    for (const k of Object.keys(attrs)) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') { if (isSvg) el.setAttribute('class', v); else el.className = v; }
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (!isSvg && (k === 'value' || k === 'checked' || k === 'selected' || k === 'disabled' || k === 'hidden')) el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    applyAttrs(el, attrs, false);
    append(el, children);
    return el;
  }
  const SVG_NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, ...children) {
    const el = document.createElementNS(SVG_NS, tag);
    applyAttrs(el, attrs, true);
    append(el, children);
    return el;
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

  /* ---- 이벤트 버스 ---- */
  const listeners = {};
  const events = {
    on(name, fn) { (listeners[name] = listeners[name] || []).push(fn); return () => events.off(name, fn); },
    off(name, fn) { const l = listeners[name]; if (!l) return; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); },
    emit(name, data) { (listeners[name] || []).slice().forEach(fn => { try { fn(data); } catch (e) { console.error(e); } }); }
  };

  /* ---- 공용 컴포넌트 ---- */
  function select(opts) {
    const el = h('select', { onchange: e => opts.onChange && opts.onChange(e.target.value), title: opts.title });
    (opts.options || []).forEach(o => {
      const isObj = typeof o === 'object';
      const value = isObj ? o.value : o, label = isObj ? o.label : o;
      const op = h('option', { value }, label);
      if (String(value) === String(opts.value)) op.selected = true;
      el.appendChild(op);
    });
    return el;
  }
  function chips(opts) {
    const wrap = h('div', { class: 'chips' });
    const multi = !!opts.multi;
    let value = multi ? new Set(opts.value || []) : opts.value;
    const render = () => {
      clear(wrap);
      (opts.options || []).forEach(o => {
        const isObj = typeof o === 'object';
        const v = isObj ? o.value : o, label = isObj ? o.label : o;
        const active = multi ? value.has(v) : String(value) === String(v);
        wrap.appendChild(h('button', {
          class: 'chip' + (active ? ' active' : ''), type: 'button',
          onclick: () => {
            if (multi) { if (value.has(v)) value.delete(v); else value.add(v); opts.onChange && opts.onChange([...value]); }
            else { value = v; opts.onChange && opts.onChange(v); }
            render();
          }
        }, label));
      });
    };
    render();
    wrap.setValue = v => { value = multi ? new Set(v) : v; render(); };
    return wrap;
  }
  function button(label, onClick, cls) { return h('button', { class: 'btn ' + (cls || ''), type: 'button', onclick: onClick }, label); }
  function section(title, ...content) { return h('section', { class: 'section' }, title ? h('h2', null, title) : null, content); }
  function table(headers, rows, opts) {
    const t = h('table', { class: 'table' },
      headers ? h('thead', null, h('tr', null, headers.map(x => h('th', null, x)))) : null,
      h('tbody', null, rows.map(r => {
        const cells = Array.isArray(r) ? r : r.cells;
        const cls = Array.isArray(r) ? '' : (r.class || '');
        const onClick = (!Array.isArray(r) && r.onClick) || null;
        const onKeydown = onClick ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } } : null;
        return h('tr', { class: cls, onclick: onClick, onkeydown: onKeydown, role: onClick ? 'button' : null, tabindex: onClick ? 0 : null }, cells.map(c => h('td', null, c)));
      })));
    return opts && opts.wrap === false ? t : h('div', { class: 'table-wrap' }, t);
  }
  function badge(text, cls) { return h('span', { class: 'badge ' + (cls || '') }, text); }
  function empty(text) { return h('div', { class: 'empty' }, text); }
  function notice(...content) { return h('div', { class: 'notice' }, content); }
  function callout(...content) { return h('div', { class: 'callout' }, content); }
  function kv(pairs) {
    return h('dl', { class: 'kv' }, pairs.filter(p => p && p[1] != null && p[1] !== '').map(p => [h('dt', null, p[0]), h('dd', null, p[1])]));
  }
  function link(href, text, cls) { return h('a', { href, class: cls }, text); }
  function tabs(items, initial, onChange) {
    const bar = h('div', { class: 'tabs', role: 'tablist' });
    let active = initial || (items[0] && items[0].id);
    const render = () => {
      clear(bar);
      items.forEach(it => bar.appendChild(h('button', { class: it.id === active ? 'active' : '', type: 'button', role: 'tab', 'aria-selected': it.id === active ? 'true' : 'false', onclick: () => { active = it.id; render(); onChange(active); } }, it.label)));
    };
    render();
    return bar;
  }
  function legend(items) {
    return h('div', { class: 'legend' }, items.map(i => h('span', { class: i.cls }, h('span', { class: 'sw' }), i.label)));
  }
  function pills(notes, opts) {
    /* notes: [{label, cls, title}] */
    return h('div', { class: 'note-list' }, notes.map(n => h('span', { class: 'pill ' + (n.cls || 'iv-s') + (n.dim ? ' dim' : ''), title: n.title || '' }, n.label)));
  }
  /* 난이도: 셈여림 기호 다섯 단계. p 여리게(입문) → ff 아주 세게(고급). 사이트 전체가 같은 배지를 쓴다 */
  const LEVELS = { 1: { dyn: 'p', ko: '입문' }, 2: { dyn: 'mp', ko: '기초' }, 3: { dyn: 'mf', ko: '중급' }, 4: { dyn: 'f', ko: '중상급' }, 5: { dyn: 'ff', ko: '고급' } };
  function level(n) {
    const L = LEVELS[n]; if (!L) return null;
    return h('span', { class: 'lvl lv' + n, title: '난이도 ' + L.dyn + ' · ' + L.ko + ' (5단계 중 ' + n + '단계)' }, h('i', { class: 'dyn', 'aria-hidden': 'true' }, L.dyn), L.ko);
  }
  function difficulty(n) { return level(n); }
  function noteDifficulty(n) { return h('span', { class: 'difficulty', title: '난이도 ' + n + '/5', 'aria-label': '난이도 ' + n + '/5' }, [1, 2, 3, 4, 5].map(i => GH.icon('note', { cls: i <= n ? 'on' : 'off' }))); }

  /* ---- 유틸 ---- */
  const util = {
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    uniq: arr => [...new Set(arr)],
    mod: (n, m) => ((n % m) + m) % m,
    debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; },
    groupBy(arr, fn) { const o = {}; arr.forEach(x => { const k = fn(x); (o[k] = o[k] || []).push(x); }); return o; },
    range(a, b) { const r = []; for (let i = a; i < b; i++) r.push(i); return r; },
    shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    qs(obj) { return Object.entries(obj).filter(([, v]) => v != null && v !== '').map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&'); }
  };

  /* 숫자 직접 입력: [−] [숫자] 단위 [+]. 범위를 벗어나면 가장 가까운 값으로 맞춘다.
     opts: {value, min, max, step, onChange(v), suffix, label(읽어 주는 이름), id, live(입력하는 동안에도 반영), big(한 번에 크게 움직이는 폭), width(ch)} */
  function numberInput(opts) {
    const min = opts.min == null ? -Infinity : opts.min, max = opts.max == null ? Infinity : opts.max, step = opts.step || 1;
    const dec = String(step).includes('.') ? String(step).split('.')[1].length : 0;
    const fit = v => { if (!isFinite(v)) return cur; v = Math.round(v / step) * step; return Number(Math.max(min, Math.min(max, v)).toFixed(dec)); };
    let cur = null; cur = fit(Number(opts.value));
    const width = opts.width || Math.max(3, String(isFinite(max) ? max : cur).length + (dec ? dec + 1 : 0) + 1);
    const input = h('input', { type: 'number', class: 'num-input', inputmode: dec ? 'decimal' : 'numeric', min: isFinite(min) ? min : null, max: isFinite(max) ? max : null, step, value: cur, id: opts.id || null, 'aria-label': opts.label || null, style: 'width:' + (width + 1.6) + 'ch' });
    const commit = (v, fire) => { const nv = fit(v); input.value = nv; if (nv !== cur) { cur = nv; if (fire !== false && opts.onChange) opts.onChange(nv); } };
    input.addEventListener('change', () => commit(Number(input.value)));
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commit(Number(input.value)); } });
    input.addEventListener('focus', () => { try { input.select(); } catch (e) { /* ignore */ } });
    if (opts.live) {
      let t = 0;
      input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { const v = Number(input.value); if (input.value !== '' && v >= min && v <= max) commit(v); }, 450); });
    }
    /* 누르고 있으면 계속 움직인다 */
    const stepper = (sign, text) => {
      let timer = 0, rep = 0;
      const stop = () => { clearTimeout(timer); clearInterval(rep); timer = 0; rep = 0; };
      const b = h('button', { class: 'num-step', type: 'button', 'aria-label': (opts.label || '값') + (sign > 0 ? ' 올리기' : ' 내리기'), tabindex: -1 }, text);
      b.addEventListener('pointerdown', e => { e.preventDefault(); commit(cur + sign * step); timer = setTimeout(() => { rep = setInterval(() => commit(cur + sign * (opts.big || step)), 70); }, 420); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, stop));
      b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commit(cur + sign * step); } });
      return b;
    };
    const wrap = h('span', { class: 'num-field' }, stepper(-1, '−'), input, opts.suffix ? h('span', { class: 'num-suffix' }, opts.suffix) : null, stepper(1, '+'));
    wrap.input = input;
    wrap.value = () => cur;
    wrap.setValue = v => { cur = fit(Number(v)); input.value = cur; };
    return wrap;
  }
  /* 슬라이더 + 숫자 입력 (서로 따라 움직임). opts: {value, min, max, step, onInput(v), suffix, label, sliderWidth} */
  function rangeNumber(opts) {
    let num = null;
    const range = h('input', { type: 'range', min: opts.min, max: opts.max, step: opts.step || 1, value: opts.value, 'aria-label': opts.label || null, style: opts.sliderWidth ? 'width:' + opts.sliderWidth : null,
      oninput: e => { const v = Number(e.target.value); num.setValue(v); opts.onInput(num.value()); } });
    num = numberInput({ value: opts.value, min: opts.min, max: opts.max, step: opts.step, suffix: opts.suffix, label: opts.label, live: true, big: opts.big, onChange: v => { range.value = v; opts.onInput(v); } });
    const wrap = h('span', { class: 'range-num' }, range, num);
    wrap.setValue = v => { range.value = v; num.setValue(v); };
    wrap.value = () => num.value();
    return wrap;
  }

  GH.ui = { h, svg, clear, select, chips, button, section, table, badge, empty, notice, callout, kv, link, tabs, legend, pills, difficulty, level, LEVELS, noteDifficulty, numberInput, rangeNumber };
  GH.events = events;
  GH.util = util;
})();
