@echo off
echo.
echo ======================================================
echo LOOPY Audio Stem Transformer - Quick Start
echo ======================================================
echo.

echo Installing frontend dependencies...
call npm install

echo.
echo Setting up backend...
cd backend

REM Check uv
where uv >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing uv...
    pip install uv
)

REM Create venv if not exists
if exist .venv (
    echo Virtual environment already exists
) else (
    echo Creating virtual environment...
    uv venv
)

echo Activating virtual environment...
call .venv\Scripts\activate

echo Installing Python dependencies with uv...
uv pip install -r requirements.txt

cd ..

echo.
echo ⚠️  Make sure ffmpeg is installed and added to PATH
echo ⚠️  Make sure yt-dlp is installed (pip install yt-dlp)
echo.

echo ======================================================
echo ✅ Installation complete!
echo ======================================================
echo.
echo Run the app:
echo   npm run dev
echo.

pause