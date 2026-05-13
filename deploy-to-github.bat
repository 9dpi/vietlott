@echo off
echo ============================================
echo  Vietlott AI - Giao dien quan tri Admin Dashboard
echo ============================================
cd /d "d:\Automator_Prj\Vlot\vietlott"
git add -A
git commit -m "feat: Kich hoat hien thi Admin Dashboard de xem nhat ky

- Them nut 'He Thong' (System Logs) tren thanh cong cu cua App
- Cho phep xem xet toan bo Automation Logs (Fetch, Analyze, Predict, Email) ma he thong tu dong chay ngam
- Theo doi tinh trang bat/tat Automation và do chinh xac hien tai"
git push origin main
echo.
echo Hoan thanh! Site se cap nhat tai:
echo https://9dpi.github.io/vietlott/
pause
