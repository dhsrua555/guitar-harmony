#!/usr/bin/env bash
# 사용법: bash dev/run.sh <dev 페이지 이름> [가상시간 ms]  → 헤드리스 Edge로 열고 <pre id="out"> 내용을 출력
SP="${LOCALAPPDATA}/Temp/gh-headless"; mkdir -p "$SP"
E="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
PROF="$SP/p-$RANDOM"; rm -rf "$PROF"
"$E" --headless=new --disable-gpu --no-first-run --autoplay-policy=no-user-gesture-required --user-data-dir="$PROF" --virtual-time-budget="${2:-20000}" --dump-dom "http://127.0.0.1:8080/dev/$1?v=$(date +%s)" 2>/dev/null \
 | PYTHONIOENCODING=utf-8 "$USERPROFILE/anaconda3/python.exe" -c "
import sys,re,html
s=sys.stdin.read(); m=re.search(r'<pre id=\"out\"[^>]*>(.*?)</pre>',s,re.S)
print(html.unescape(m.group(1)) if m else '(no output)')"
rm -rf "$PROF"
