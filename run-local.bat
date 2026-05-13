@echo off
echo ============================================
echo  Khoi dong Vietlott AI Predictor (Local)
echo ============================================
cd /d "d:\Automator_Prj\Vlot\vietlott"

echo Kiem tra thu vien...
call npm install

echo.
echo Khoi dong server Vite...
echo Truy cap: http://localhost:5173
echo ============================================
npm run dev
