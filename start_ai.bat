@echo off
echo 🔥 Starting Gemma AI with UI...

cd /d %~dp0

echo Activating virtual environment...
call gemma_qlora\Scripts\activate

echo Starting API server on port 8000...
start "AI Server" /MIN cmd /k "call gemma_qlora\Scripts\activate && uvicorn server:app --host 0.0.0.0 --port 8000"

timeout /t 1 >nul

echo Starting UI server on port 8080...
start "UI Server" /MIN cmd /k "cd ui && python -m http.server 8080"

timeout /t 2 >nul

echo.
echo ✅ AI is running!
echo 📡 API: http://localhost:8000
echo 🌐 UI: http://localhost:8080

REM Open browser in detached mode (won't close with terminals)
start "" http://localhost:8080

echo.
echo Press any key to stop all servers...
pause >nul

echo Stopping servers...
taskkill /FI "WindowTitle eq AI Server*" /T /F >nul 2>&1
taskkill /FI "WindowTitle eq UI Server*" /T /F >nul 2>&1
echo.
echo ✅ Servers stopped. Browser remains open.
echo 👋 Goodbye!

