@echo off
echo ============================================
echo  Vietlott AI - Tich Hop Du Lieu Lich Su
echo ============================================
cd /d "d:\Automator_Prj\Vlot\vietlott"
git add -A
git commit -m "feat: Tich hop toan bo du lieu lich su truc tiep vao app

- Su dung power655.jsonl.txt lam nguon du lieu chinh thong qua Vite asset import (?url)
- Tang muc gioi han lay du lieu tu 100 len 2000 ky (Lay toan bo)
- App se tu dong co 1,344+ ky quay cho Backtest va Self-Learning ma khong can import thu cong"
git push origin main
echo.
echo Hoan thanh! Site se cap nhat tai:
echo https://9dpi.github.io/vietlott/
pause
