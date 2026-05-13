@echo off
echo ============================================
echo  Vietlott AI - Cap nhat Bao Mat Passcode
echo ============================================
cd /d "d:\Automator_Prj\Vlot\vietlott"
git add -A
git commit -m "feat: Them man hinh khoa Passcode bao mat

- Yeu cau nhap Passcode (989999) de truy cap vao app
- Su dung sessionStorage de luu trang thai xac thuc: tu dong xoa ngay khi dong trinh duyet
- Giao dien khoa dep mat voi hieu ung animation"
git push origin main
echo.
echo Hoan thanh! Site se cap nhat tai:
echo https://9dpi.github.io/vietlott/
pause
