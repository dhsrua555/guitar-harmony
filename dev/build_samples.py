"""악기 샘플 만들기: 공개 라이선스 녹음을 받아 다듬고(앞 무음 제거, 길이 맞춤, 끝 페이드, 음량 고르기)
모노 128kbps MP3 로 audio/samples/<악기>/ 에 저장한다.

사용: python dev/build_samples.py <ffmpeg 경로>
출처와 라이선스는 audio/samples/CREDITS.md 참고.
"""
import os, sys, subprocess, urllib.request
import numpy as np

FF = sys.argv[1] if len(sys.argv) > 1 else 'ffmpeg'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, 'dev', '.sample-cache')
OUT = os.path.join(ROOT, 'audio', 'samples')
SR = 44100
TJ = 'https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples/'
SAL = 'https://tonejs.github.io/audio/salamander/'

# 악기: (원본 주소 틀, 음 목록, 길이(초), 페이드(초))
INSTRUMENTS = {
    'steel': (TJ + 'guitar-acoustic/{n}.wav', 'D2 E2 Fs2 Gs2 As2 C3 D3 E3 Fs3 Gs3 As3 C4 D4 E4 Fs4 Gs4 As4 C5 D5', 4.5, 0.8),
    'nylon': (TJ + 'guitar-nylon/{n}.wav', 'D2 E2 Fs2 Gs2 A2 B2 Cs3 D3 E3 Fs3 G3 A3 B3 Cs4 Ds4 E4 Fs4 Gs4 A4 B4 Cs5 D5 E5 Fs5 Gs5 As5', 4.2, 0.8),
    'electric': (TJ + 'guitar-electric/{n}.wav', 'Cs2 E2 Fs2 A2 C3 Ds3 Fs3 A3 C4 Ds4 Fs4 A4 C5 Ds5 Fs5 A5 C6', 4.5, 0.8),
    'bass': (TJ + 'bass-electric/{n}.wav', 'E1 G1 As1 Cs2 E2 G2 As2 Cs3 E3 G3 As3 Cs4', 3.2, 0.6),
    'piano': (SAL + '{n}.ogg', 'A1 C2 Ds2 Fs2 A2 C3 Ds3 Fs3 A3 C4 Ds4 Fs4 A4 C5 Ds5 Fs5 A5 C6 Ds6 Fs6 A6 C7', 6.0, 1.3),
}


def fetch(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        return path
    os.makedirs(os.path.dirname(path), exist_ok=True)
    req = urllib.request.Request(url, headers={'User-Agent': 'guitar-harmony-sample-builder'})
    with urllib.request.urlopen(req, timeout=60) as r, open(path, 'wb') as f:
        f.write(r.read())
    return path


def decode(path):
    raw = subprocess.run([FF, '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()


def encode(x, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    subprocess.run([FF, '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '128k', '-ar', str(SR), '-ac', '1', path],
                   input=x.astype(np.float32).tobytes(), check=True)


def prepare(x, length, fade):
    peak = float(np.max(np.abs(x))) or 1.0
    th = max(1e-3, peak * 0.02)
    idx = np.nonzero(np.abs(x) > th)[0]
    start = max(0, int(idx[0]) - int(SR * 0.001)) if len(idx) else 0
    y = x[start:start + int(SR * length)].astype(np.float64)
    if len(y) < int(SR * length):
        y = np.concatenate([y, np.zeros(int(SR * length) - len(y))])
    n_in = int(SR * 0.0015)
    y[:n_in] *= np.linspace(0, 1, n_in)
    n_out = int(SR * fade)
    y[-n_out:] *= 0.5 * (1 + np.cos(np.linspace(0, np.pi, n_out)))
    return y


def rms_head(y, sec=0.25):
    seg = y[:int(SR * sec)]
    return float(np.sqrt(np.mean(seg * seg))) or 1e-6


def main():
    only = set(sys.argv[2:])
    for inst, (tmpl, notes, length, fade) in INSTRUMENTS.items():
        if only and inst not in only:
            continue
        notes = notes.split()
        ys = []
        for n in notes:
            ext = os.path.splitext(tmpl)[1]
            src = fetch(tmpl.format(n=n), os.path.join(CACHE, inst, n + ext))
            ys.append(prepare(decode(src), length, fade))
        # 음마다 음량을 가운데 값 쪽으로 70% 만큼 맞추고 (±6dB 안에서), 악기 전체 최대치를 -1dBFS 로
        levels = np.array([rms_head(y) for y in ys])
        target = float(np.median(levels))
        gains = np.clip((target / levels) ** 0.7, 0.5, 2.0)
        ys = [y * g for y, g in zip(ys, gains)]
        top = max(float(np.max(np.abs(y))) for y in ys)
        norm = 0.89 / top
        total = 0
        for n, y in zip(notes, ys):
            out = os.path.join(OUT, inst, n + '.mp3')
            encode(y * norm, out)
            total += os.path.getsize(out)
        print(f'{inst}: {len(notes)} files, {total // 1024} KB')


if __name__ == '__main__':
    main()
