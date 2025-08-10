#!/usr/bin/env pwsh

Write-Host "🚀 Starting Complete DMP Intelligence System..." -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Function to check if a command exists
function Test-Command {
    param($cmdname)
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Function to check if port is in use
function Test-Port {
    param($port)
    $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
    return $connection.TcpTestSucceeded
}

# Function to kill process on port
function Stop-ProcessOnPort {
    param($port)
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($process) {
        Write-Host "🛑 Stopping process on port $port..." -ForegroundColor Yellow
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js found: $(node --version)" -ForegroundColor Green

# Check Python
if (-not (Test-Command "python")) {
    Write-Host "❌ Python not found. Please install Python from https://python.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Python found: $(python --version)" -ForegroundColor Green

# Check Poetry
if (-not (Test-Command "poetry")) {
    Write-Host "❌ Poetry not found. Installing Poetry..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri https://install.python-poetry.org | python -
    $env:PATH += ";$env:USERPROFILE\.local\bin"
    if (-not (Test-Command "poetry")) {
        Write-Host "❌ Poetry installation failed. Please install manually from https://python-poetry.org/" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Poetry found: $(poetry --version)" -ForegroundColor Green

Write-Host "🔧 Setting up virtual environment..." -ForegroundColor Yellow

# Setup virtual environment
if (-not (Test-Path ".venv")) {
    Write-Host "📦 Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv .venv
}

# Activate virtual environment
Write-Host "🔄 Activating virtual environment..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1

Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow

# Install Node.js dependencies
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
npm install

# Install Python dependencies
Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
Set-Location "dmp-intellisense-source"
poetry install
Set-Location ".."

Write-Host "🧹 Cleaning up existing processes..." -ForegroundColor Yellow

# Clean up existing processes
Stop-ProcessOnPort 3000
Stop-ProcessOnPort 3001  
Stop-ProcessOnPort 5001

Write-Host "🚀 Starting services..." -ForegroundColor Green

# Start Python backend
Write-Host "🔄 Starting Python Backend (Port 5001)..." -ForegroundColor Yellow
$pythonJob = Start-Job -ScriptBlock {
    Set-Location $args[0]
    & .\.venv\Scripts\Activate.ps1
    npm run dev:py
} -ArgumentList $PWD

# Wait a bit for Python backend to start
Start-Sleep -Seconds 5

# Start Node.js API server
Write-Host "🔄 Starting Node.js API Server (Port 3001)..." -ForegroundColor Yellow
$apiJob = Start-Job -ScriptBlock {
    Set-Location $args[0]
    npm run dev:api
} -ArgumentList $PWD

# Wait a bit for API server to start
Start-Sleep -Seconds 3

# Start Next.js frontend
Write-Host "🔄 Starting Next.js Frontend (Port 3000)..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $args[0]
    npm run dev
} -ArgumentList $PWD

Write-Host "⏱️ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "🔍 Checking service status..." -ForegroundColor Yellow

# Check if services are running
$services = @(
    @{Name="Python Backend"; Port=5001; URL="http://localhost:5001/api/graph"},
    @{Name="Node.js API"; Port=3001; URL="http://localhost:3001/api/health"},
    @{Name="Next.js Frontend"; Port=3000; URL="http://localhost:3000"}
)

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri $service.URL -TimeoutSec 5 -UseBasicParsing
        Write-Host "✅ $($service.Name) is running on port $($service.Port)" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($service.Name) is not responding on port $($service.Port)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 DMP Intelligence System Started!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "🌐 Frontend:      http://localhost:3000" -ForegroundColor Yellow
Write-Host "🔌 API Server:    http://localhost:3001/api/health" -ForegroundColor Yellow  
Write-Host "🐍 Python Backend: http://localhost:5001/api/graph" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 To stop all services, close this window or press Ctrl+C" -ForegroundColor Gray
Write-Host "📋 Job IDs - Python: $($pythonJob.Id), API: $($apiJob.Id), Frontend: $($frontendJob.Id)" -ForegroundColor Gray

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 5
        # Check if jobs are still running
        $runningJobs = Get-Job | Where-Object {$_.State -eq 'Running'}
        if ($runningJobs.Count -eq 0) {
            Write-Host "⚠️ All services have stopped" -ForegroundColor Yellow
            break
        }
    }
} finally {
    # Cleanup on exit
    Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
    Stop-Job $pythonJob, $apiJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $pythonJob, $apiJob, $frontendJob -ErrorAction SilentlyContinue
    Write-Host "👋 Goodbye!" -ForegroundColor Green
}
