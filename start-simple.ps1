#!/usr/bin/env pwsh

Write-Host "🚀 Starting DMP Intelligence System..." -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js found: $(node --version)" -ForegroundColor Green

# Check Python
if (-not (Get-Command "python" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python not found. Please install from https://python.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Python found: $(python --version)" -ForegroundColor Green

# Check Poetry
if (-not (Get-Command "poetry" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Poetry not found. Please install from https://python-poetry.org/" -ForegroundColor Red
    Write-Host "   Run: pip install poetry" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Poetry found: $(poetry --version)" -ForegroundColor Green

Write-Host "🔧 Setting up environment..." -ForegroundColor Yellow

# Create venv if needed
if (-not (Test-Path ".venv")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
}

# Activate venv
Write-Host "🔄 Activating virtual environment..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1

Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
npm install

Set-Location "dmp-intellisense-source"
poetry install
Set-Location ".."

Write-Host "🧹 Cleaning up existing processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -eq "node" -or $_.ProcessName -eq "python"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "🚀 Starting services in separate windows..." -ForegroundColor Green
Write-Host "   (Three new PowerShell windows will open)" -ForegroundColor Yellow

# Start Python backend in new window
Write-Host "🔄 Starting Python Backend (Port 5001)..." -ForegroundColor Yellow
Start-Process -FilePath "pwsh" -ArgumentList @(
    "-NoExit", 
    "-Command", 
    "cd '$PWD'; .\.venv\Scripts\Activate.ps1; cd dmp-intellisense-source; Write-Host 'Starting Python Backend...' -ForegroundColor Green; poetry run python run.py"
)

Start-Sleep -Seconds 3

# Start Node.js API in new window  
Write-Host "🔄 Starting Node.js API Server (Port 3001)..." -ForegroundColor Yellow
Start-Process -FilePath "pwsh" -ArgumentList @(
    "-NoExit",
    "-Command", 
    "cd '$PWD\backend'; Write-Host 'Starting Node.js API Server...' -ForegroundColor Green; node app.js"
)

Start-Sleep -Seconds 2

# Start Next.js frontend in new window
Write-Host "🔄 Starting Next.js Frontend (Port 3000)..." -ForegroundColor Yellow  
Start-Process -FilePath "pwsh" -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PWD'; Write-Host 'Starting Next.js Frontend...' -ForegroundColor Green; npm run dev"
)

Write-Host "⏱️ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "🎉 DMP Intelligence System Started!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host "🌐 Frontend:      http://localhost:3000" -ForegroundColor Yellow
Write-Host "🔌 API Server:    http://localhost:3001/api/health" -ForegroundColor Yellow
Write-Host "🐍 Python Backend: http://localhost:5001/api/graph" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Three PowerShell windows have opened for each service" -ForegroundColor Gray
Write-Host "📋 Close each window to stop that service" -ForegroundColor Gray
Write-Host "📋 Press Enter to check service status..." -ForegroundColor Gray
Read-Host

# Quick status check
Write-Host "🔍 Checking service status..." -ForegroundColor Yellow

$services = @(
    @{Name="Frontend"; URL="http://localhost:3000"},
    @{Name="API Server"; URL="http://localhost:3001/api/health"},  
    @{Name="Python Backend"; URL="http://localhost:5001/api/graph"}
)

foreach ($service in $services) {
    try {
        Invoke-WebRequest -Uri $service.URL -TimeoutSec 3 -UseBasicParsing | Out-Null
        Write-Host "✅ $($service.Name) is responding" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($service.Name) is not responding" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎯 Setup complete! Access your application at http://localhost:3000" -ForegroundColor Green
