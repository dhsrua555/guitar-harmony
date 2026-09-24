/* 실제 악기 녹음 샘플: 필요한 악기만 받아서 풀어 두고, 가장 가까운 음을 골라 음높이만 살짝 옮겨 쓴다.
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
    bass: { ko: '베이스', notes: 'E1 G1 As1 Cs2 E2 G2 As2 Cs3 E3 G3 As3 Cs4', gain: 2.5, bright: 6000, soft: 1400, release: 0.1 }
  };
  Object.keys(INST).forEach(id => { INST[id].list = INST[id].notes.split(' ').map(n => ({ name: n, midi: midiOfName(n) })); });
  const st = {}; /* id → {raw: Promise, ready: bool, voices: [{midi, buf, offset}], error} */
  const listeners = new Set();
  const emit = () => listeners.forEach(fn => { try { fn(); } catch (e) { /* ignore */ } });

  function prefetch(id) {
    const I = INST[id]; if (!I) return null;
    const s = st[id] || (st[id] = {});
    if (!s.raw) {
      s.raw = Promise.all(I.list.map(n => fetch(BASE + id + '/' + n.name + '.mp3').then(r => { if (!r.ok) throw new Error(r.status + ' ' + n.name); return r.arrayBuffer(); })))
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
  function ensure(id) {
    const I = INST[id]; if (!I) return Promise.resolve(false);
    const s = st[id] || (st[id] = {});
    if (s.ready) return Promise.resolve(true);
    if (s.loading) return s.loading;
    const c = GH.audio && GH.audio.context && GH.audio.context(); if (!c) return Promise.resolve(false);
    s.loading = (prefetch(id) || Promise.reject(new Error('fetch')))
      .then(list => Promise.all(list.map(ab => decode(c, ab))))
      .then(bufs => {
        s.voices = bufs.map((buf, i) => ({ midi: I.list[i].midi, buf, offset: onsetOf(buf) })).sort((a, b) => a.midi - b.midi);
        s.ready = true; s.loading = null; emit(); return true;
      })
      .catch(e => { console.warn('샘플을 불러오지 못해 합성음을 씁니다:', id, e && e.message); s.loading = null; s.raw = null; s.failed = (s.failed || 0) + 1; emit(); return false; });
    return s.loading;
  }
  /* 가장 가까운 녹음 (없으면 불러오기를 시작하고 null) */
  function voice(id, midi) {
    const s = st[id];
    if (!s || !s.ready) { if (!s || (!s.loading && (s.failed || 0) < 3)) ensure(id); return null; }
    let best = s.voices[0];
    for (const v of s.voices) if (Math.abs(v.midi - midi) < Math.abs(best.midi - midi)) best = v;
    return best;
  }
  const status = id => { const s = st[id]; return !s ? 'idle' : s.ready ? 'ready' : s.loading ? 'loading' : s.failed ? 'error' : s.raw ? 'fetched' : 'idle'; };
  GH.samples = { INST, prefetch, ensure, voice, status, onChange: fn => listeners.add(fn), midiOfName };
})();
