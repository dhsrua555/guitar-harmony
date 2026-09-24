/* 실제 악기 녹음 샘플: 필요한 악기만 받아서 풀어 두고, 가장 가까운 음을 골라 음높이만 살짝 옮겨 쓴다.
   드럼 · 콘트라베이스는 타격을 한 파일에 이어 붙인 묶음(sprite)과 위치표(JSON)로 받는다.
   다 받기 전에는 synth.js 의 합성음이 대신 소리를 낸다. 출처와 라이선스는 audio/samples/CREDITS.md */
(function () {
  'use strict';
  const GH = window.GH = window.GH || {};
  const BASE = 'audio/samples/';
  const LETTER = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midiOfName = n => { const m = /^([A-G])(s?)(-?\d)$/.exec(n); return m ? 12 * (Number(m[3]) + 1) + LETTER[m[1]] + (m[2] ? 1 : 0) : null; };
  /* gain: 기본 음량, bright: 가장 셀 때의 밝기(저역통과 Hz), release: 손을 뗄 때 사라지는 시간(초) */
  const INST = {
    steel: { ko: '어쿠스틱 기타', notes: 'D2 E2 Fs2 Gs2 As2 C3 D3 E3 Fs3 Gs3 As3 C4 D4 E4 Fs4 Gs4 As4 C5 D5', gain: 0.95, bright: 14000, soft: 2600, release: 0.16 },
    nylon: { ko: '클래식 기타', notes: 'D2 E2 Fs2 Gs2 A2 B2 Cs3 D3 E3 Fs3 G3 A3 B3 Cs4 Ds4 E4 Fs4 Gs4 A4 B4 Cs5 D5 E5 Fs5 Gs5 As5', gain: 1.1, bright: 11000, soft: 2200, release: 0.18 },
    electric: { ko: '일렉 기타', notes: 'Cs2 E2 Fs2 A2 C3 Ds3 Fs3 A3 C4 Ds4 Fs4 A4 C5 Ds5 Fs5 A5 C6', gain: 1.5, bright: 12000, soft: 2400, release: 0.14 },
    piano: { ko: '피아노', notes: 'A1 C2 Ds2 Fs2 A2 C3 Ds3 Fs3 A3 C4 Ds4 Fs4 A4 C5 Ds5 Fs5 A5 C6 Ds6 Fs6 A6 C7', gain: 1.0, bright: 16000, soft: 2400, release: 0.32 },
    bass: { ko: '일렉 베이스', notes: 'E1 G1 As1 Cs2 E2 G2 As2 Cs3 E3 G3 As3 Cs4', gain: 1.1, bright: 6000, soft: 1400, release: 0.1 },
    upright: { ko: '콘트라베이스', sprite: 'upright/pizz', gain: 1.1, bright: 5200, soft: 1500, release: 0.1 },
    drums: { ko: '드럼', sprite: 'drums/kit' }
  };
  Object.keys(INST).forEach(id => { if (INST[id].notes) INST[id].list = INST[id].notes.split(' ').map(n => ({ name: n, midi: midiOfName(n) })); });
  const KIT = ['kick', 'snare', 'rim', 'hat', 'hatopen', 'pedal', 'ride', 'shaker'];
  const st = {}; /* id → {raw: Promise, ready, voices | kit, loading, failed} */
  const listeners = new Set();
  const emit = () => listeners.forEach(fn => { try { fn(); } catch (e) { /* ignore */ } });
  const enabled = () => !GH.state || GH.state.get().sound !== 'synth';

  const get = url => fetch(url).then(r => { if (!r.ok) throw new Error(r.status + ' ' + url); return r; });
  function prefetch(id) {
    const I = INST[id]; if (!I) return null;
    const s = st[id] || (st[id] = {});
    if (!s.raw) {
      s.raw = (I.sprite
        ? Promise.all([get(BASE + I.sprite + '.mp3').then(r => r.arrayBuffer()), get(BASE + I.sprite + '.json').then(r => r.json())])
        : Promise.all(I.list.map(n => get(BASE + id + '/' + n.name + '.mp3').then(r => r.arrayBuffer()))))
        .catch(e => { s.error = e; s.raw = null; throw e; });
    }
    return s.raw;
  }
  function decode(c, ab) { return new Promise((res, rej) => { try { const p = c.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); } catch (e) { rej(e); } }); }
  /* 디코더가 앞에 붙이는 짧은 무음을 건너뛸 위치 */
  function onsetOf(buf) {
    const d = buf.getChannelData(0); let peak = 0;
    for (let i = 0; i < Math.min(d.length, buf.sampleRate * 0.5); i++) peak = Math.max(peak, Math.abs(d[i]));
    const th = Math.max(0.0015, peak * 0.02);
    for (let i = 0; i < d.length; i++) if (Math.abs(d[i]) > th) return Math.max(0, (i - Math.round(buf.sampleRate * 0.0008)) / buf.sampleRate);
    return 0;
  }
  /* 묶음 파일: 첫 타격이 실제로 들리는 곳과 위치표의 차이만큼 모든 위치를 옮긴다 */
  function setupSprite(s, buf, map) {
    const shift = Math.max(-0.005, Math.min(0.08, onsetOf(buf) - map.lead - 0.0002));
    s.shift = shift;
    if (map.hits) {
      s.kit = {};
      Object.keys(map.hits).forEach(k => { s.kit[k] = map.hits[k].map(([t, d, lv]) => ({ buf, offset: t + shift, end: t + shift + d, lv })); });
    } else {
      const by = {};
      map.notes.forEach(([midi, lv, t, d]) => { (by[midi] = by[midi] || []).push({ midi, buf, offset: t + shift, end: t + shift + d, lv }); });
      s.voices = Object.keys(by).map(Number).sort((a, b) => a - b).map(midi => ({ midi, layers: by[midi].sort((a, b) => a.lv - b.lv) }));
    }
  }
  function ensure(id) {
    const I = INST[id]; if (!I) return Promise.resolve(false);
    const s = st[id] || (st[id] = {});
    if (s.ready) return Promise.resolve(true);
    if (s.loading) return s.loading;
    const c = GH.audio && GH.audio.context && GH.audio.context(); if (!c) return Promise.resolve(false);
    s.loading = (prefetch(id) || Promise.reject(new Error('fetch')))
      .then(raw => I.sprite
        ? decode(c, raw[0]).then(buf => setupSprite(s, buf, raw[1]))
        : Promise.all(raw.map(ab => decode(c, ab))).then(bufs => {
          s.voices = bufs.map((buf, i) => ({ midi: I.list[i].midi, buf, offset: onsetOf(buf) })).sort((a, b) => a.midi - b.midi);
        }))
      .then(() => { s.ready = true; s.loading = null; emit(); return true; })
      .catch(e => { console.warn('샘플을 불러오지 못해 합성음을 씁니다:', id, e && e.message); s.loading = null; s.raw = null; s.failed = (s.failed || 0) + 1; emit(); return false; });
    return s.loading;
  }
  /* 준비가 안 됐으면 불러오기를 시작하고 false */
  function readyOrLoad(id) {
    const s = st[id];
    if (s && s.ready) return true;
    if (!s || (!s.loading && (s.failed || 0) < 3)) ensure(id);
    return false;
  }
  /* 세기 층 고르기: 목표 세기(0~1)와 로그로 가장 가까운 층들 가운데 방금 쓴 것은 피한다 */
  function pickLayer(list, target, s, key) {
    const t = Math.max(0.005, target);
    const scored = list.map((v, i) => ({ v, i, d: Math.abs(Math.log(v.lv / t)) })).sort((a, b) => a.d - b.d);
    const near = scored.filter(x => x.d <= scored[0].d + 0.35).slice(0, 3);
    const last = s.last || (s.last = {});
    let pool = near.filter(x => x.i !== last[key]); if (!pool.length) pool = near;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    last[key] = pick.i;
    return pick.v;
  }
  /* 가장 가까운 녹음 (없으면 불러오기를 시작하고 null). 세기 층이 있으면 vel 로 고른다 */
  function voice(id, midi, vel) {
    if (!readyOrLoad(id)) return null;
    const s = st[id];
    let best = s.voices[0];
    for (const v of s.voices) if (Math.abs(v.midi - midi) < Math.abs(best.midi - midi)) best = v;
    if (!best.layers) return best;
    return pickLayer(best.layers, Math.pow(Math.min(1, vel == null ? 0.8 : vel), 1.25), s, best.midi);
  }
  /* 드럼 한 타 (vel 0~1.3) */
  function hit(kind, vel) {
    if (KIT.indexOf(kind) < 0 || !readyOrLoad('drums')) return null;
    const list = st.drums.kit[kind]; if (!list || !list.length) return null;
    return pickLayer(list, Math.pow(Math.min(1.2, Math.max(0.03, vel)), 1.6), st.drums, kind);
  }
  /* 여러 악기가 준비될 때까지 (길어도 ms 까지만) 기다린다 */
  function whenReady(ids, ms) {
    return Promise.race([Promise.all(ids.map(id => ensure(id))), new Promise(res => setTimeout(res, ms || 3000))]);
  }
  const status = id => { const s = st[id]; return !s ? 'idle' : s.ready ? 'ready' : s.loading ? 'loading' : s.failed ? 'error' : s.raw ? 'fetched' : 'idle'; };
  GH.samples = { INST, KIT, enabled, prefetch, ensure, whenReady, voice, hit, status, onChange: fn => listeners.add(fn), midiOfName, _st: st };
})();
