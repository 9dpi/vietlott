@echo off
echo ============================================
echo  Vietlott AI - Tinh nang Tu hoc tu lich su
echo ============================================
cd /d "d:\Automator_Prj\Vlot\vietlott"
git add -A
git commit -m "feat: Nang cap tinh nang Tu Hoc bang cach su dung du lieu lich su

- Them nut 'Hoc tu Du lieu' (Train from History) vao SelfLearningPanel
- Su dung BacktestService de mo phong du doan cho 200 ky quay gan nhat
- Tu dong inject cac du doan mo phong vao PredictionAnalysisService
- Cho phep he thong AI tu dong tim ra insight tu toan bo lich su 1,344 ky ngay ca khi chua co lich su du doan thu cong cua user"
git push origin main
echo.
echo Hoan thanh! Site se cap nhat tai:
echo https://9dpi.github.io/vietlott/
pause
