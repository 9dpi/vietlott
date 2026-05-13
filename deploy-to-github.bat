@echo off
echo ============================================
echo  Vietlott AI Predictor - GitHub Deployment
echo ============================================
echo.

cd /d "d:\Automator_Prj\Vlot\vietlott"

echo [1/5] Checking git status...
git status

echo.
echo [2/5] Setting remote origin to https://github.com/9dpi/vietlott.git
git remote remove origin 2>nul
git remote add origin https://github.com/9dpi/vietlott.git

echo.
echo [3/5] Staging all files...
git add -A

echo.
echo [4/5] Committing...
git commit -m "feat: Add auto-fetch, backtest engine, self-learning system

- Auto-fetch: Automatically retrieves lottery results based on draw schedule
  (Power 6/55: Tue/Thu/Sat, Mega 6/45: Wed/Fri/Sun at 18:00 ICT)
- Backtest: Full statistical backtesting with HOT/COLD/BALANCED/RANDOM strategies,
  match distribution charts, prize analysis, and performance metrics
- Self-Learning: Tracks prediction accuracy over time, identifies patterns,
  and generates improvement recommendations from historical data
- GitHub Actions: Auto-deploy to GitHub Pages on push to main
- Type fixes: Consistent use of predictedNumbers field throughout services"

echo.
echo [5/5] Pushing to GitHub...
git push -u origin main

echo.
echo ============================================
echo  Deployment script complete!
echo  Enable GitHub Pages in: Settings > Pages
echo  Source: GitHub Actions
echo ============================================
pause
