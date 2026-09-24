/* 첫 방문 인트로 (한 번만, 약 1.9초): 노란 공이 오선에 떨어져 음표가 되고, 원이 퍼지며 사이트가 열린다.
   누르거나 아무 키나 누르면 바로 넘어가고, 움직임 줄이기 설정이면 건너뛴다 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const KEY = 'gh.intro.v1';
  let active = false; const waiting = [];
  const seen = () => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return true; } };
  const mark = () => { try { localStorage.setItem(KEY, '1'); } catch (e) { /* 저장소를 못 쓰면 매번 건너뛴다 */ } };
  const skip = () => (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || /(^|[?&])nointro\b/.test(location.search) || navigator.webdriver;
  const LINES = [70, 90, 110, 130, 150];
  function build() {
    const el = document.createElement('div');
    el.className = 'intro'; el.setAttribute('aria-hidden', 'true');
    /* 모두 고정된 문자열이다 (사용자 입력 없음) */
    el.innerHTML = '<svg class="intro-svg" viewBox="0 0 400 240">' +
      LINES.map((y, i) => '<line class="intro-line" style="animation-delay:' + (i * 0.05).toFixed(2) + 's" x1="20" y1="' + y + '" x2="380" y2="' + y + '"/>').join('') +
      '<line class="intro-stem" x1="211" y1="108" x2="211" y2="48"/>' +
      '<path class="intro-flag" d="M211 48 C 214 62, 232 66, 230 86"/>' +
      '<circle class="intro-ball" cx="200" cy="110" r="15"/>' +
      '</svg><div class="intro-wipe"></div><p class="intro-word">GUITAR &amp; HARMONY</p>';
    return el;
  }
  function finish(el) {
    if (!active) return;
    active = false; mark();
    el.classList.add('out');
    document.documentElement.classList.remove('intro-lock');
    setTimeout(() => el.remove(), 480);
    waiting.splice(0).forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
  }
  function run() {
    if (seen() || skip()) { mark(); return; }
    active = true;
    const el = build();
    document.body.appendChild(el);
    document.documentElement.classList.add('intro-lock');
    /* 원은 음표가 떨어진 자리에서 퍼진다 */
    const svg = el.querySelector('.intro-svg'), wipe = el.querySelector('.intro-wipe');
    if (svg && wipe) { const r = svg.getBoundingClientRect(); wipe.style.left = (r.left + r.width * 0.5) + 'px'; wipe.style.top = (r.top + r.height * 110 / 240) + 'px'; }
    const done = () => finish(el);
    el.addEventListener('click', done);
    window.addEventListener('keydown', done, { once: true });
    setTimeout(done, 1900);
  }
  GH.intro = { active: () => active, after(fn) { if (active) waiting.push(fn); else fn(); } };
  if (document.body) run(); else document.addEventListener('DOMContentLoaded', run);
})();
