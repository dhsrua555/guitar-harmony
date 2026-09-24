@echo off
rem 로컬 서버로 사이트 열기 (Python 필요). index.html 을 직접 열어도 됩니다.
cd /d "%~dp0"
set PY=python
where python >nul 2>nul
if errorlevel 1 (
  if exist "%USERPROFILE%\anaconda3\python.exe" set PY="%USERPROFILE%\anaconda3\python.exe"
)
rem 서버가 뜬 뒤(1초) 브라우저를 연다. 이 창을 닫으면 서버가 멈춥니다.
start "" /b cmd /c "timeout /t 1 >nul & start "" http://localhost:8080/"
%PY% -m http.server 8080 --bind 127.0.0.1
