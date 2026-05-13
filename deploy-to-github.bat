@echo off
echo ============================================
echo  Vietlott AI - Push ban dich tieng Viet
echo ============================================
cd /d "d:\Automator_Prj\Vlot\vietlott"
git add -A
git commit -m "feat: Chuyen toan bo giao dien sang tieng Viet

- Header: Ten app va mo ta bang tieng Viet
- Footer: Tuyen bo mien trach nhiem tieng Viet
- Toolbar: Tat ca nut bam (Lam Moi, Tu Dong, Backtest, Tu Hoc, v.v.)
- Dashboard: Phan tich lich su, bang ket qua, heatmap
- PredictionPanel: Chon chien luoc, tao du doan, ket qua AI
- PredictionHistory: Lich su du doan, cot ket qua
- SimulationControls: Che do mo phong
- BacktestPanel: Cau hinh, ket qua, bieu do, bang chi tiet
- SelfLearningPanel: He thong tu hoc, insights, khuyen nghi
- AI_STRATEGIES: Ten chien luoc bang tieng Viet
- Toast messages: Thong bao bang tieng Viet"
git push origin main
echo.
echo Hoan thanh! Kiem tra GitHub Actions tai:
echo https://github.com/9dpi/vietlott/actions
pause
