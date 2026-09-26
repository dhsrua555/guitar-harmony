/* 도움 › 버그 제보함: 제보 글을 만들어 구글 폼으로 보내거나 복사한다 */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  GH.pages = GH.pages || {};
  const { h, clear } = GH.ui;
  /* 구글 폼 (dev/bug_form.gs 로 만든 폼): 게시 주소의 id 와 질문마다의 entry 번호 */
  const FORM = { id: '1FAIpQLSdWYB5ltqLB7tLdHptknigTRAVunEfROBblxish5TJvxN4gZQ', entry: { kind: '1419174521', what: '83820666', steps: '1646830685', page: '656988949', env: '1377571847' } };
  const DRAFT_KEY = 'gh.bug.draft';
  const MAX_URL = 7000;     /* 미리 채운 폼 주소 길이에 여유를 둔 값 */
  const KINDS = [
    { value: 'sound', label: '소리가 안 나거나 이상해요', short: '소리' },
    { value: 'screen', label: '화면이 깨지거나 이상해요', short: '화면' },
    { value: 'button', label: '버튼 · 기능이 안 돼요', short: '기능' },
    { value: 'content', label: '설명 · 이론이 틀렸어요', short: '내용' },
    { value: 'slow', label: '느리거나 멈춰요', short: '느림' },
    { value: 'etc', label: '그 밖의 문제', short: '그 외' }
  ];

  /* ---- 최근 오류: 제보에 함께 붙인다 (페이지 오류는 라우터가 console.error 로 남긴다) ---- */
  const errors = [];
  function remember(msg) {
    msg = String(msg || '').replace(/\s+/g, ' ').trim().slice(0, 200);
    if (!msg || (errors.length && errors[errors.length - 1].msg === msg)) return;
    errors.push({ msg, at: location.hash || '#/' });
    if (errors.length > 5) errors.shift();
  }
  window.addEventListener('error', e => { if (e && e.message) remember(e.message + (e.filename ? ' (' + e.filename.split('/').pop() + ':' + e.lineno + ')' : '')); });
  window.addEventListener('unhandledrejection', e => { const r = e && e.reason; remember('Promise: ' + (r && r.message ? r.message : r)); });
  const origError = console.error;
  console.error = function () {
    try { remember(Array.prototype.map.call(arguments, a => a && a.message ? a.message : typeof a === 'string' ? a : '').filter(Boolean).join(' ')); } catch (e) { /* ignore */ }
    return origError.apply(console, arguments);
  };

  /* ---- 방금 보던 페이지 ---- */
  let lastSeen = null;
  GH.events.on('route', r => { if (r && r.path !== '/bug') lastSeen = { hash: location.hash || '#/', title: (r.page && r.page.title) || '' }; });
  const pageLabel = p => p ? (p.title ? p.title + ' (' + p.hash + ')' : p.hash) : '';

  /* ---- 기기 · 설정 정보 (개인을 알아볼 수 있는 값은 넣지 않는다) ---- */
  function device() {
    const ua = navigator.userAgent || '';
    let os = '', m;
    if (/iPhone|iPod/.test(ua)) os = 'iPhone';
    else if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) os = 'iPad';
    else if ((m = ua.match(/Android\s(\d+)/))) os = 'Android ' + m[1];
    else if (/Windows/.test(ua)) os = 'Windows';
    else if (/CrOS/.test(ua)) os = 'ChromeOS';
    else if (/Mac OS X/.test(ua)) os = 'Mac';
    else if (/Linux/.test(ua)) os = 'Linux';
    if (/iPhone|iPad|iPod/.test(ua) && (m = ua.match(/OS (\d+)[_.](\d+)/))) os += ' · iOS ' + m[1] + '.' + m[2];
    const BROWSERS = [
      [/KAKAOTALK/i, '카카오톡 앱 안'], [/NAVER\(inapp|NAVER\//, '네이버 앱 안'], [/Instagram/, '인스타그램 앱 안'], [/FBAN|FBAV/, '페이스북 앱 안'], [/\bLine\//, '라인 앱 안'],
      [/SamsungBrowser\/(\d+)/, '삼성 인터넷'], [/Whale\/(\d+)/, '웨일'], [/Edg(?:A|iOS)?\/(\d+)/, 'Edge'], [/OPR\/(\d+)/, 'Opera'],
      [/(?:Firefox|FxiOS)\/(\d+)/, 'Firefox'], [/CriOS\/(\d+)/, 'Chrome'], [/Chrome\/(\d+)/, 'Chrome'], [/Version\/(\d+)[\d.]* (?:Mobile\/\S+ )?Safari/, 'Safari']
    ];
    let browser = '';
    for (const [re, name] of BROWSERS) { const x = ua.match(re); if (x) { browser = name + (x[1] ? ' ' + x[1] : ''); break; } }
    return { os: os || '알 수 없는 기기', browser: browser || '알 수 없는 브라우저' };
  }
  function envLines() {
    const s = GH.state.get(), d = device();
    const w = window.innerWidth, ht = window.innerHeight, dpr = Math.round((window.devicePixelRatio || 1) * 100) / 100;
    const sid = GH.state.soundId ? GH.state.soundId() : s.instrument; const inst = GH.audio && GH.audio.PRESETS && GH.audio.PRESETS[sid];
    let sound = s.sound === 'synth' ? '합성음' : '실제 악기 녹음';
    if (s.sound !== 'synth' && GH.samples) { const st = GH.samples.status(sid); sound += ' (' + ({ ready: '받음', loading: '받는 중', error: '받기 실패', fetched: '받는 중' }[st] || '아직 안 받음') + ')'; }
    const set = ['키 ' + GH.notes.pretty(s.key)];
    if (s.tuning !== 'standard') set.push((GH.state.TUNINGS[s.tuning] || {}).label || s.tuning);
    if (Number(s.capo)) set.push('카포 ' + s.capo + '프렛');
    if (s.lefty) set.push('왼손잡이');
    if (s.accidentals !== 'auto') set.push(s.accidentals === 'flat' ? '플랫 우선' : '샵 우선');
    if (s.labelMode === 'name') set.push('지판 라벨 음이름');
    if (s.symbolStyle === 'jazz') set.push('재즈 약식 표기');
    const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    const lines = [
      '기기: ' + d.os + ' · ' + d.browser,
      '화면: ' + w + '×' + ht + (dpr !== 1 ? ' (배율 ' + dpr + ')' : '') + (w < ht ? ' · 세로' : ' · 가로'),
      '사이트: ' + (location.hostname || '로컬 파일'),
      '소리: ' + sound + (inst ? ' · ' + inst.ko : '') + ' · 볼륨 ' + Math.round((Number(s.volume) || 0) * 100) + '%',
      '화면 설정: ' + ({ dark: '다크', light: '크림 페이퍼', auto: '기본' }[s.theme] || s.theme) + ' 테마' + (reduce ? ' · 움직임 줄이기 켬' : ''),
      '설정: ' + set.join(' · ')
    ];
    lines.push(errors.length ? '최근 오류:\n' + errors.slice(-3).map(e => '- ' + e.msg + ' [' + e.at + ']').join('\n') : '최근 오류: 없음');
    return lines;
  }

  /* ---- 제보 글 ---- */
  const kindOf = v => KINDS.find(k => k.value === v);
  function reportText(r) {
    const k = kindOf(r.kind);
    return ['[밴드 & 화성학 버그 제보]',
      '문제 종류: ' + (k ? k.label : '안 고름'),
      '페이지: ' + (r.page || '안 적음'),
      '', '무엇이 이상했나요?', (r.what || '').trim() || '(비어 있음)',
      r.steps && r.steps.trim() ? '\n다시 생기는 방법\n' + r.steps.trim() : null,
      r.env ? '\n기기 정보\n' + r.env : null].filter(x => x != null).join('\n');
  }
  /* ---- 구글 폼으로 보내기 ---- */
  const ready = f => !!(f && f.id && f.entry && f.entry.what);
  const formBase = f => 'https://docs.google.com/forms/d/e/' + f.id;
  function pairs(r, f, short) {
    const k = kindOf(r.kind);
    const v = { kind: k ? k.label : '', what: (r.what || '').trim(), steps: (r.steps || '').trim(), page: r.page || '', env: r.env || '' };
    if (short) { v.what = '(내용이 길어서 복사해 두었어요. 여기에 붙여넣기 해 주세요.)'; v.steps = ''; }
    return Object.keys(v).filter(x => v[x] && f.entry[x]).map(x => ['entry.' + f.entry[x], v[x]]);
  }
  function formBody(r, f) { const p = new URLSearchParams(); pairs(r, f || FORM).forEach(([k, v]) => p.append(k, v)); return p; }
  /* 사이트에서 바로 제출 (로그인 필요 없음). 응답 내용은 읽을 수 없어서 전송만 확인한다 */
  function submit(r, f) { f = f || FORM; return fetch(formBase(f) + '/formResponse', { method: 'POST', mode: 'no-cors', body: formBody(r, f) }); }
  /* 새 창에서 제출할 미리 채운 폼 주소. 너무 길면 짧은 주소 + 붙여넣을 글을 따로 준다 */
  function prefillUrl(r, f, short) { f = f || FORM; return formBase(f) + '/viewform?usp=pp_url&' + pairs(r, f, short).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&'); }
  function openPlan(r, f) {
    const full = prefillUrl(r, f, false);
    if (full.length <= MAX_URL) return { url: full, paste: null };
    return { url: prefillUrl(r, f, true), paste: [(r.what || '').trim(), r.steps && r.steps.trim() ? '\n다시 생기는 방법\n' + r.steps.trim() : ''].join('\n').trim() };
  }
  /* 아티팩트 안에서는 보안 정책이 바로 제출을 막으므로 새 창으로 연다 */
  const canPost = () => typeof fetch === 'function' && /(^|\.)github\.io$|^localhost$|^127\.0\.0\.1$/.test(location.hostname);
  async function copyText(text) {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch (e) { /* 아래 방법으로 */ }
    const back = document.activeElement;
    try {
      const ta = h('textarea', { readonly: '', style: 'position:fixed;left:-9999px;top:0;opacity:0' }); ta.value = text;
      document.body.appendChild(ta); ta.focus({ preventScroll: true }); ta.select();
      const done = document.execCommand('copy'); ta.remove(); return done;
    } catch (e) { return false; }
    finally { if (back && back.focus && document.contains(back)) back.focus({ preventScroll: true }); }
  }

  /* ---- 초안: 이 브라우저에만 남는다 ---- */
  function loadDraft() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {}; } catch (e) { return {}; } }
  function saveDraft(d) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ kind: d.kind, what: d.what, steps: d.steps, page: d.page, withEnv: d.withEnv })); } catch (e) { /* ignore */ } }
  function dropDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ } }
  let st = null, stFrom = null;

  GH.pages['/bug'] = {
    title: '버그 제보',
    render(el) {
      if (!st) st = Object.assign({ kind: '', what: '', steps: '', page: '', withEnv: true, sent: null }, loadDraft(), { sent: null });
      /* 다른 페이지에서 들어왔으면 그 페이지를 채운다 (같은 페이지 다시 그리기는 적은 값 유지) */
      if (lastSeen && lastSeen !== stFrom) { stFrom = lastSeen; st.page = pageLabel(lastSeen); }
      const cur = () => ({ kind: st.kind, what: st.what, steps: st.steps, page: st.page.trim(), env: st.withEnv ? envLines().join('\n') : '' });

      el.appendChild(h('h1', null, '버그 제보함'));
      el.appendChild(h('p', { class: 'muted' }, '이상한 점을 알려 주시면 고칠게요. 칸 두 개만 채우면 되고 로그인은 필요 없어요. 보낸 내용은 사이트 운영자만 봐요.'));
      const post = canPost(), live = ready(FORM);

      const done = h('div', { class: 'bug-done', hidden: !st.sent, role: 'status', 'aria-live': 'polite' });
      const form = h('div', { class: 'bug-form' });
      const step = (n, label, opt, ...body) => h('div', { class: 'bug-step' }, h('div', { class: 'bug-q' }, h('span', { class: 'bug-n', 'aria-hidden': 'true' }, n), h('span', null, label), opt ? h('span', { class: 'bug-opt' }, opt) : null), body);

      /* 1. 종류 */
      const kinds = GH.ui.chips({ options: KINDS.map(k => ({ value: k.value, label: k.label })), value: st.kind, onChange: v => { st.kind = v; changed(); } });
      kinds.classList.add('bug-kinds');
      form.appendChild(step(1, '어떤 문제인가요?', '고르지 않아도 돼요', kinds));

      /* 2. 내용 */
      const whatErr = h('div', { class: 'bug-err', hidden: true }, '무엇이 이상했는지 한 줄이라도 적어 주세요.');
      const count = h('span', { class: 'bug-count' });
      const what = h('textarea', { id: 'bug-what', rows: 5, maxlength: 2000, placeholder: '예: 백킹 트랙에서 재즈를 고르면 드럼이 안 들려요. 베이스는 들려요.', 'aria-label': '무엇이 이상했나요', oninput: e => { st.what = e.target.value; whatErr.hidden = true; what.classList.remove('bad'); changed(); } });
      what.value = st.what;
      form.appendChild(step(2, '무엇이 이상했나요?', null, what, h('div', { class: 'bug-sub' }, h('span', { class: 'bug-tip' }, '“이렇게 될 줄 알았는데 → 이렇게 됐어요”처럼 적으면 금방 찾아요.'), count), whatErr));

      /* 3. 다시 생기는 방법 */
      const steps = h('textarea', { rows: 3, maxlength: 1500, placeholder: '1. 백킹 트랙 페이지로 가요\n2. 스타일에서 재즈를 골라요\n3. 재생을 눌러요', 'aria-label': '어떻게 하면 다시 생기나요', oninput: e => { st.steps = e.target.value; changed(); } });
      steps.value = st.steps;
      form.appendChild(step(3, '어떻게 하면 다시 생기나요?', '선택', steps));

      /* 4. 자동으로 채운 정보 */
      const page = h('input', { type: 'text', value: st.page, placeholder: '예: 코드 진행 페이지', 'aria-label': '문제가 생긴 페이지', oninput: e => { st.page = e.target.value; changed(); } });
      const envBox = h('pre', { class: 'bug-env' });
      const envChk = h('input', { type: 'checkbox', checked: st.withEnv, onchange: e => { st.withEnv = e.target.checked; changed(); } });
      form.appendChild(step(4, '자동으로 채운 정보', '고쳐도 돼요',
        h('label', { class: 'bug-lab' }, '문제가 생긴 페이지'), page,
        h('label', { class: 'bug-check' }, envChk, '기기 · 설정 정보 함께 보내기 (고치는 데 큰 도움이 돼요)'), envBox));

      /* 보내기 */
      const sendLabel = h('span', null, '보내기');
      const send = h('a', { class: 'btn primary bug-send', href: '#/bug', target: post ? null : '_blank', rel: 'noopener', hidden: !live, onclick: onSend }, GH.icon('arrow'), sendLabel);
      const copy = h('button', { class: 'btn', type: 'button', onclick: onCopy }, '내용 복사하기');
      const copyMsg = h('span', { class: 'bug-copied', role: 'status', 'aria-live': 'polite' });
      form.appendChild(h('div', { class: 'bug-actions' }, send, copy, copyMsg));
      form.appendChild(h('p', { class: 'bug-help' }, !live ? ['제보 창구를 준비하고 있어요. 지금은 ', h('b', null, '내용 복사하기'), '를 눌러 사이트를 알려 준 사람에게 메시지로 보내 주세요.']
        : post ? ['누르면 바로 접수돼요. 잘 안 되면 ', h('b', null, '내용 복사하기'), '로 복사해서 사이트를 알려 준 사람에게 메시지로 보내 주세요.']
        : ['누르면 내용이 채워진 구글 폼이 새 창으로 열려요. 거기서 ', h('b', null, '제출'), '을 눌러야 접수돼요.']));
      const previewTxt = h('pre', { class: 'bug-env bug-preview' });
      form.appendChild(h('details', { class: 'bug-more' }, h('summary', null, '보낼 내용 미리 보기'), previewTxt));
      form.appendChild(h('p', { class: 'bug-help' }, '적던 내용은 보낼 때까지 이 브라우저에 잠깐 저장돼요.'));

      el.appendChild(done); el.appendChild(form);
      function showDone(kind) {
        clear(done); done.hidden = false;
        const again = h('button', { class: 'btn small', type: 'button', onclick: () => { st = null; stFrom = null; dropDraft(); GH.router.rerender(); window.scrollTo(0, 0); } }, '새 제보 쓰기');
        const back = lastSeen ? h('a', { class: 'btn small ghost', href: lastSeen.hash }, '보던 페이지로 돌아가기') : null;
        if (kind === 'posted') {
          form.hidden = true;
          done.append(h('b', null, '보냈어요! 고마워요.'), h('p', null, '확인하고 고칠게요. 다른 문제도 있다면 하나씩 따로 보내 주세요.'), h('div', { class: 'bug-actions' }, again, back));
          return;
        }
        if (kind === 'failed') {
          const plan = openPlan(cur());
          done.append(h('b', null, '바로 보내지 못했어요.'), h('p', null, '인터넷 연결을 확인하거나, 아래 버튼으로 구글 폼을 열어 제출해 주세요. 적은 내용이 그대로 채워져요.'),
            h('div', { class: 'bug-actions' }, h('a', { class: 'btn small primary', href: plan.url, target: '_blank', rel: 'noopener', onclick: () => { if (plan.paste) copyText(plan.paste); st.sent = plan.paste ? 'paste' : 'opened'; setTimeout(() => showDone(st.sent), 0); } }, '구글 폼 열어서 보내기')));
          return;
        }
        done.append(h('b', null, '고마워요! 거의 다 됐어요.'),
          h('p', null, kind === 'paste' ? '내용이 길어서 따로 복사해 두었어요. 열린 구글 폼의 “무엇이 이상했나요?” 칸에 붙여넣기 한 뒤 제출을 눌러 주세요.' : '열린 구글 폼에서 내용을 확인하고 제출을 누르면 접수돼요. 창이 안 열렸다면 아래 “내용 복사하기”를 써 주세요.'),
          h('div', { class: 'bug-actions' }, again, back));
      }
      if (st.sent) showDone(st.sent);

      function changed() {
        saveDraft(st);
        const r = cur();
        count.textContent = st.what.length ? st.what.length + ' / 2000' : '';
        envBox.hidden = !st.withEnv; envBox.textContent = r.env;
        previewTxt.textContent = reportText(r);
        if (live && !post) send.href = openPlan(r).url;
      }
      let sending = false;
      function onSend(e) {
        if (post || !st.what.trim()) e.preventDefault();
        if (!st.what.trim()) {
          whatErr.hidden = false; what.classList.add('bad');
          what.focus({ preventScroll: true }); what.scrollIntoView({ block: 'center', behavior: 'smooth' }); return;
        }
        if (!post) {
          const plan = openPlan(cur());
          send.href = plan.url;
          if (plan.paste) copyText(plan.paste);
          st.sent = plan.paste ? 'paste' : 'opened';
          showDone(st.sent);
          return;
        }
        if (sending) return;
        sending = true; send.classList.add('busy'); send.setAttribute('aria-disabled', 'true'); sendLabel.textContent = '보내는 중…';
        submit(cur()).then(() => {
          dropDraft();
          st = Object.assign({ kind: '', what: '', steps: '', withEnv: true }, { page: st.page, sent: 'posted' });
          showDone('posted'); window.scrollTo(0, 0);
        }, () => { st.sent = 'failed'; showDone('failed'); done.scrollIntoView({ block: 'center', behavior: 'smooth' }); })
          .then(() => { sending = false; send.classList.remove('busy'); send.removeAttribute('aria-disabled'); sendLabel.textContent = '보내기'; });
      }
      async function onCopy() {
        const ok = await copyText(reportText(cur()));
        copyMsg.textContent = ok ? '복사했어요. 메시지 창에 붙여넣기 하면 돼요.' : '복사가 막혀 있어요. 아래 미리 보기에서 길게 눌러 복사해 주세요.';
        if (!ok) { const d = form.querySelector('.bug-more'); if (d) d.open = true; }
      }
      changed();
    }
  };
  GH.bug = { FORM, KINDS, ready, formBody, prefillUrl, openPlan, reportText, envLines, device, errors };
})();
