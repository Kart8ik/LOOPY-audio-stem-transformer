@echo off
REM Quick startup script for LOOPY monorepo (Windows)

echo.
echo ======================================================
echo 🚀 LOOPY Audio Stem Transformer - Quick Start
echo ======================================================
echo.

echo Installing dependencies...
echo.

REM Install root dependencies
call npm install

REM Install backend Python dependencies
echo.
echo Installing backend Python dependencies...
cd backend
call pip install -r requirements.txt
cd ..

echo.
echo ======================================================
echo ✅ Installation complete!
echo ======================================================
echo.
echo 🎯 To get started:
echo.
echo Option 1: Run everything together
echo   npm run dev
echo.
echo Option 2: Run frontend only
echo   npm run frontend:dev
echo   (Opens at: http://localhost:5173)
echo.
echo Option 3: Run backend only
echo   npm run backend:dev
echo   (Runs at: http://localhost:3000)
echo.
echo Option 4: Run services separately in different terminals
echo   Terminal 1: npm run frontend:dev
echo   Terminal 2: npm run backend:dev
echo.
pause
