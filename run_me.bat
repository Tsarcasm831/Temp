@echo off
setlocal

REM Change to the directory of this script (project root)
pushd "%~dp0"

REM Detect Python launcher or python
where py >nul 2>&1
if %ERRORLEVEL%==0 (
    set "PYLAUNCH=py"
) else (
    where python >nul 2>&1
    if %ERRORLEVEL%==0 (
        set "PYLAUNCH=python"
    ) else (
        echo Python is not installed or not on PATH.
        echo Please install Python from https://www.python.org/downloads/ and try again.
        pause
        popd
        endlocal
        exit /b 1
    )
)

REM Prefer custom server to set proper MIME types for .jsx/.mjs
if exist "serve.py" (
    start "Naruto RPG - Local Server" cmd /c "%PYLAUNCH% serve.py"
 ) else (
    REM Fallback: Python's built-in server (may mislabel .jsx/.mjs)
    start "Naruto RPG - Local Server" cmd /c "%PYLAUNCH% -m http.server 8000 --bind 127.0.0.1"
 )

REM Small delay to let the server initialize
timeout /t 1 >nul 2>&1

REM Open the page in the default browser
start "" "http://127.0.0.1:8000/index.html"

popd
endlocal
