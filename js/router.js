/* 해시 라우터 + 앱 내 뒤로가기 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  GH.pages = GH.pages || {};
  let current = null;
  let depth = 0;            /* 이 앱 안에서 쌓은 히스토리 깊이 (history.state 로 추적) */
  function parse() {
    let hash = location.hash || '#/';
    if (hash.startsWith('#')) hash = hash.slice(1);
    if (!hash.startsWith('/')) hash = '/' + hash;
    const qi = hash.indexOf('?');
    const path = qi >= 0 ? hash.slice(0, qi) : hash;
    const qs = qi >= 0 ? hash.slice(qi + 1) : '';
    const query = {};
    qs.split('&').filter(Boolean).forEach(p => {
      const eq = p.indexOf('=');
      const rawK = eq >= 0 ? p.slice(0, eq) : p;
      const rawV = eq >= 0 ? p.slice(eq + 1) : '';
      try { query[decodeURIComponent(rawK)] = decodeURIComponent(rawV.replace(/\+/g, ' ')); }
      catch (e) { query[rawK] = rawV.replace(/\+/g, ' '); }
    });
    return { path: path.replace(/\/+$/, '') || '/', query };
  }
  function match(path) {
    if (GH.pages[path]) return { page: GH.pages[path], params: {} };
    for (const pat of Object.keys(GH.pages)) {
      if (!pat.includes(':')) continue;
      const a = pat.split('/'), b = path.split('/');
      if (a.length !== b.length) continue;
      const params = {}; let ok = true;
      for (let i = 0; i < a.length; i++) {
        if (a[i].startsWith(':')) { try { params[a[i].slice(1)] = decodeURIComponent(b[i]); } catch (e) { params[a[i].slice(1)] = b[i]; } }
        else if (a[i] !== b[i]) { ok = false; break; }
      }
      if (ok) return { page: GH.pages[pat], params };
    }
    return null;
  }
  /* 히스토리 엔트리에 깊이를 기록해 두면 뒤로/앞으로 이동을 구분할 수 있다 */
  function stamp(replace, first) {
    let s = null;
    try { s = history.state; } catch (e) { /* ignore */ }
    if (s && typeof s.ghDepth === 'number') { depth = s.ghDepth; return; }
    if (!replace) depth = first ? 0 : depth + 1;
    try { history.replaceState({ ghDepth: depth }, ''); } catch (e) { /* ignore */ }
  }
  function render(options) {
    options = options || {};
    const { path, query } = parse();
    const m = match(path) || { page: GH.pages['/404'] || GH.pages['/'], params: {} };
    if (GH.player) GH.player.stop();
    const app = document.getElementById('app');
    GH.ui.clear(app);
    const prev = current;
    current = { path, query, params: m.params, page: m.page };
    stamp(options.replace, !prev);
    try { m.page.render(app, Object.assign({}, m.params, { query })); }
    catch (e) { console.error(e); app.appendChild(GH.ui.notice('페이지를 그리는 중 오류가 났습니다: ' + e.message)); }
    document.title = (m.page.title ? m.page.title + ' · ' : '') + '기타 & 화성학';
    /* 진입 모션: 다른 페이지로 옮길 때만 */
    if (!prev || prev.path !== path) { app.classList.remove('page-enter'); void app.offsetWidth; app.classList.add('page-enter'); }
    GH.events.emit('route', current);
    if (!query.noscroll) {
      window.scrollTo(0, 0);
      if (options.focus) app.focus({ preventScroll: true });
    }
  }
  /* 이동. 같은 경로 안에서의 변화(탭, 필터, 마디 선택)는 히스토리를 쌓지 않고 바꿔치기한다 */
  function go(path, query, opts) {
    opts = opts || {};
    const qs = query ? GH.util.qs(query) : '';
    const next = '#' + path + (qs ? '?' + qs : '');
    const here = parse();
    const replace = opts.replace != null ? opts.replace : (here.path === path);
    if (location.hash === next) { render({ replace: true }); return; }
    if (replace) {
      try { history.replaceState({ ghDepth: depth }, '', next); } catch (e) { location.hash = next; return; }
      render({ replace: true });
    } else {
      location.hash = next;
    }
  }
  function back() {
    if (depth > 0) { history.back(); return; }
    const r = current || parse();
    /* 더 돌아갈 곳이 없으면 상위 허브 또는 홈으로 */
    const parent = r.path === '/' ? null : (GH.app && GH.app.parentOf ? GH.app.parentOf(r.path) : '/');
    if (parent && parent !== r.path) go(parent); else go('/');
  }
  function href(path, query) { const qs = query ? GH.util.qs(query) : ''; return '#' + path + (qs ? '?' + qs : ''); }
  function rerender() { render({ replace: true }); }
  function currentRoute() { return current; }
  window.addEventListener('hashchange', () => render({ focus: true }));
  window.addEventListener('popstate', () => { /* hashchange 가 뒤따르므로 여기서는 깊이만 갱신 */ try { const s = history.state; if (s && typeof s.ghDepth === 'number') depth = s.ghDepth; } catch (e) { /* ignore */ } });
  GH.router = { parse, render, go, back, href, rerender, current: currentRoute, depth: () => depth };
})();
