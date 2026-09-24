"""드럼 킷과 콘트라베이스 녹음 묶음 만들기.
타격 하나하나를 다듬어(앞 무음 제거, 길이 맞춤, 끝 페이드) 한 파일에 이어 붙이고, 위치표를 JSON 으로 남긴다.

- 드럼: Virtuosity Drums (Versilian Studios, Karoryfer Samples, CC0). 킥 · 스네어 · 오버헤드 마이크를 섞어 스테레오로
- 콘트라베이스: D. Smolken 의 1958 Otto Rubner 더블베이스 피치카토 (CC0)

사용: python dev/build_kit.py <ffmpeg 경로> [drums] [upright]
출처와 라이선스는 audio/samples/CREDITS.md 참고.
"""
import os, sys, json, subprocess, urllib.request
import numpy as np

FF = sys.argv[1] if len(sys.argv) > 1 else 'ffmpeg'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'dev', '.sample-cache')
OUT = os.path.join(ROOT, 'audio', 'samples')
SR = 44100
LEAD = 0.05   # 파일 맨 앞 무음 (디코더가 앞에 붙이는 지연은 재생할 때 재서 맞춘다)
GAP = 0.08    # 타격 사이 무음
VD = 'https://raw.githubusercontent.com/sfzinstruments/virtuosity_drums/master/Samples/'
DB = 'https://raw.githubusercontent.com/sfzinstruments/dsmolken.double-bass/master/pizz/'

# 종류: (북, 주법, [(세기 번호, 라운드로빈 번호)], 길이(초), 페이드(초))
KIT = [
    ('kick', 'kick', 'snon', [(v, r) for v in (1, 2, 3, 4) for r in (1, 2)], 0.9, 0.35),
    ('snare', 'snare', 'center', [(v, 0) for v in (4, 9, 14, 19, 24, 28, 32, 35)], 0.9, 0.4),
    ('rim', 'snare', 'crossstick', [(v, 0) for v in (3, 7, 11, 15)], 0.5, 0.2),
    ('hat', 'hh', 'closed', [(v, r) for v in (1, 2, 3, 4) for r in (1, 2)], 0.45, 0.2),
    ('hatopen', 'hh', 'half', [(v, r) for v in (2, 3, 4) for r in (1, 2)], 1.1, 0.5),
    ('pedal', 'hh', 'pedal', [(v, r) for v in (1, 2, 3) for r in (1, 2)], 0.5, 0.2),
    ('ride', 'ride', 'ride', [(v, r) for v in (1, 2, 3) for r in (1, 2, 3, 4)], 2.6, 1.4),
]
SHAKER = ['LShaker_Shake1D_rr%d' % r for r in (1, 2, 3, 4)] + ['LShaker_Shake1U_rr%d' % r for r in (1, 2, 3, 4)]
BASS_NOTES = [('c1', 24), ('eb1', 27), ('g1', 31), ('bb1', 34), ('d2', 38), ('f2', 41), ('a2', 45), ('c3', 48), ('e3', 52), ('g3', 55), ('a3', 57)]


def fetch(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        return path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    req = urllib.request.Request(url, headers={'User-Agent': 'guitar-harmony-sample-builder'})
    with urllib.request.urlopen(req, timeout=90) as r, open(path, 'wb') as f:
        f.write(r.read())
    return path


def decode(path, ch):
    raw = subprocess.run([FF, '-v', 'error', '-i', path, '-f', 'f32le', '-ac', str(ch), '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, ch).astype(np.float64)


def encode(x, path, kbps):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    ch = x.shape[1]
    subprocess.run([FF, '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', str(ch), '-i', '-', '-c:a', 'libmp3lame', '-b:a', '%dk' % kbps, '-ar', str(SR), '-ac', str(ch), path],
                   input=x.astype(np.float32).tobytes(), check=True)


def mix(parts):
    n = max(len(p) for p in parts)
    out = np.zeros((n, parts[0].shape[1]))
    for p in parts:
        out[:len(p)] += p
    return out


def trim(x, length, fade):
    mono = np.abs(x).max(axis=1)
    peak = float(mono.max()) or 1.0
    idx = np.nonzero(mono > max(2e-4, peak * 0.02))[0]
    start = max(0, int(idx[0]) - int(SR * 0.001)) if len(idx) else 0
    n = int(SR * length)
    y = x[start:start + n].copy()
    if len(y) < n:
        y = np.concatenate([y, np.zeros((n - len(y), x.shape[1]))])
    k = int(SR * 0.001)
    y[:k] *= np.linspace(0, 1, k)[:, None]
    m = int(SR * fade)
    y[-m:] *= (0.5 * (1 + np.cos(np.linspace(0, np.pi, m))))[:, None]
    return y


def head_rms(y, sec):
    seg = y[:int(SR * sec)]
    return float(np.sqrt(np.mean(seg * seg))) or 1e-9


def kit_hit(drum, art, vl, rr):
    parts = []
    for mic in ('kickmic', 'snaremic', 'oh'):
        name = '%s_%s_%s_vl%d%s.flac' % (mic, drum, art, vl, '_rr%d' % rr if rr else '')
        parts.append(decode(fetch(VD + '%s/%s/%s' % (mic, drum, name), os.path.join(CACHE, 'kit', mic, name)), 2))
    return mix(parts)


def shaker_hit(name):
    parts = []
    for mic, tag in (('close', 'Close'), ('oh', 'Overhead')):
        fn = '%s_%s.wav' % (name, tag)
        parts.append(decode(fetch(VD + 'perc/%s/shaker/%s' % (mic, fn), os.path.join(CACHE, 'kit', 'perc-' + mic, fn)), 2))
    return mix(parts)


def sprite(segments):
    """segments: [(key, y)] -> (한 줄로 이은 신호, [(key, 시작초, 길이초)])"""
    ch = segments[0][1].shape[1]
    out = [np.zeros((int(SR * LEAD), ch))]
    pos = int(SR * LEAD)
    table = []
    for key, y in segments:
        table.append((key, round(pos / SR, 5), round(len(y) / SR, 4)))
        out.append(y)
        out.append(np.zeros((int(SR * GAP), ch)))
        pos += len(y) + int(SR * GAP)
    return np.concatenate(out), table


def build_drums():
    segs = []
    for kind, drum, art, hits, length, fade in KIT:
        for vl, rr in hits:
            segs.append(((kind, 'vl%d rr%d' % (vl, rr)), trim(kit_hit(drum, art, vl, rr), length, fade)))
        print(kind, 'ok', flush=True)
    for name in SHAKER:
        segs.append((('shaker', name), trim(shaker_hit(name), 0.4, 0.15)))
    # 킷 안의 자연스러운 음량 차이는 그대로 두고, 가장 큰 타격이 -1dBFS 가 되게
    top = max(float(np.abs(y).max()) for _, y in segs)
    segs = [(k, y * (0.89 / top)) for k, y in segs]
    # 같은 종류 안에서 세기(앞 60ms 의 RMS)를 가장 센 타격 대비로 적어 둔다
    loud = {}
    for (kind, _), y in segs:
        loud[kind] = max(loud.get(kind, 0), head_rms(y, 0.06))
    data, table = sprite(segs)
    hits = {}
    for ((kind, label), t, d), (_, y) in zip(table, segs):
        hits.setdefault(kind, []).append([t, d, round(head_rms(y, 0.06) / loud[kind], 3)])
    for kind in hits:
        hits[kind].sort(key=lambda h: h[2])
    out = os.path.join(OUT, 'drums', 'kit.mp3')
    encode(data, out, 160)
    with open(os.path.join(OUT, 'drums', 'kit.json'), 'w', encoding='utf-8') as f:
        json.dump({'lead': LEAD, 'hits': hits}, f, separators=(',', ':'))
    print('drums: %.1f s, %d KB' % (len(data) / SR, os.path.getsize(out) // 1024))
    for kind in hits:
        print('  %-8s %s' % (kind, ' '.join('%.2f' % h[2] for h in hits[kind])))
    print('  type level (dBFS rms 60ms):', {k: round(20 * np.log10(v), 1) for k, v in loud.items()})


def build_upright():
    notes = []
    for name, midi in BASS_NOTES:
        layer = {}
        for dyn in ('m', 'f'):
            for rr in ('a', 'b'):
                fn = 'pizz_%s_%s%s.wav' % (name, dyn, rr)
                layer[dyn + rr] = trim(decode(fetch(DB + fn, os.path.join(CACHE, 'upright', fn)), 1), 2.8, 0.9)
        notes.append((midi, layer))
    print('upright fetched', flush=True)
    # 음마다 f 세기의 음량을 가운데 값 쪽으로 70% 맞추고 (m 도 같은 비율로), 전체 최대치를 -1dBFS 로
    fl = np.array([np.mean([head_rms(l['fa'], 0.25), head_rms(l['fb'], 0.25)]) for _, l in notes])
    gains = np.clip((float(np.median(fl)) / fl) ** 0.7, 0.5, 2.0)
    segs = []
    for (midi, layer), g, ref in zip(notes, gains, fl):
        for key in ('ma', 'mb', 'fa', 'fb'):
            segs.append(((midi, key, round(head_rms(layer[key], 0.25) / ref, 3)), layer[key] * g))
    top = max(float(np.abs(y).max()) for _, y in segs)
    segs = [(k, y * (0.89 / top)) for k, y in segs]
    data, table = sprite(segs)
    rows = [[midi, lv, t, d] for ((midi, key, lv), t, d) in table]
    out = os.path.join(OUT, 'upright', 'pizz.mp3')
    encode(data, out, 112)
    with open(os.path.join(OUT, 'upright', 'pizz.json'), 'w', encoding='utf-8') as f:
        json.dump({'lead': LEAD, 'notes': rows}, f, separators=(',', ':'))
    print('upright: %.1f s, %d KB' % (len(data) / SR, os.path.getsize(out) // 1024))
    print('  levels m/f:', ' '.join('%d:%.2f' % (r[0], r[1]) for r in rows if r[1] < 0.99))


if __name__ == '__main__':
    only = set(sys.argv[2:])
    if not only or 'drums' in only:
        build_drums()
    if not only or 'upright' in only:
        build_upright()
