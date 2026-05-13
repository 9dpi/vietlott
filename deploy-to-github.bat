@echo off
echo ============================================
echo  Vietlott AI - Fix App crash
echo ============================================
cd /d "d:\Automator_Prj\Vlot\vietlott"
git add -A
git commit -m "fix: Khac phuc loi 'revealedDraw is not defined'

- Xoa han modal SimulationResultModal o cuoi App.tsx (do tinh nang Mo Phong da bi an, khien bien revealedDraw khong ton tai va danh sap toan bo App)"
git push origin main
echo.
echo Hoan thanh! Site se cap nhat tai:
echo https://9dpi.github.io/vietlott/
pause
