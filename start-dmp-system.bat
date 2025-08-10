@echo off
echo.
echo 🚀 Starting DMP Intelligence System...
echo ===============================================

echo 📋 Checking prerequisites...

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install from https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js is installed

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install from https://python.org/
    pause
    exit /b 1
)
echo ✅ Python is installed

REM Check Poetry
poetry --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Poetry not found. Please install from https://python-poetry.org/
    pause
    exit /b 1
)
echo ✅ Poetry is installed

echo.
echo 🔧 Setting up environment...

REM Create virtual environment if it doesn't exist
if not exist .venv (
    echo 📦 Creating Python virtual environment...
    python -m venv .venv
)

REM Activate virtual environment
echo 🔄 Activating virtual environment...
call .venv\Scripts\activate.bat

echo.
echo 📥 Installing dependencies...

REM Install Node.js dependencies
echo 📦 Installing Node.js dependencies...
npm install

REM Install Python dependencies
echo 📦 Installing Python dependencies...
cd dmp-intellisense-source
poetry install
cd ..

echo.
echo 🚀 Starting services...
echo ⚠️ This will open multiple command windows

REM Start Python backend
echo 🔄 Starting Python Backend (Port 5001)...
start "Python Backend" cmd /k "call .venv\Scripts\activate.bat && npm run dev:py"

REM Wait a bit
timeout /t 5 /nobreak >nul

REM Start Node.js API server
echo 🔄 Starting Node.js API Server (Port 3001)...
start "API Server" cmd /k "npm run dev:api"

REM Wait a bit
timeout /t 3 /nobreak >nul

REM Start Next.js frontend
echo 🔄 Starting Next.js Frontend (Port 3000)...
start "Frontend" cmd /k "npm run dev"

echo.
echo ⏱️ Waiting for services to initialize...
timeout /t 10 /nobreak >nul

echo.
echo 🎉 DMP Intelligence System Started!
echo ===============================================
echo 🌐 Frontend:       http://localhost:3000
echo 🔌 API Server:     http://localhost:3001/api/health
echo 🐍 Python Backend: http://localhost:5001/api/graph
echo.
echo 📋 Three command windows should have opened for each service
echo 📋 To stop services, close each command window
echo.
pause
