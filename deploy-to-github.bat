@echo off
echo ============================================
echo  Vietlott AI - Fix duplicate buttons
echo ============================================
cd /d "d:\Automator_Prj\Vlot\vietlott"
git add -A
git commit -m "fix: Loai bo nut 'He Thong' bi trung lap

- Xoa nut 'He Thong' vi da co san nut 'Quan Tri' dam nhiem chuc nang mo AdminDashboard tu truoc"
git push origin main
echo.
echo Hoan thanh! Site se cap nhat tai:
echo https://9dpi.github.io/vietlott/
pause
