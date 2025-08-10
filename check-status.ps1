#!/usr/bin/env pwsh

Write-Host "🔍 DMP Intelligence System Status Check" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Function to test URL with timeout
function Test-ServiceUrl {
    param($url, $name, $timeout = 5)
    
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec $timeout -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $name is running ($url)" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "❌ $name is not responding ($url)" -ForegroundColor Red
        return $false
    }
}

# Function to check if port is in use
function Test-PortInUse {
    param($port)
    try {
        $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        return $connection -ne $null
    } catch {
        return $false
    }
}

Write-Host "🔍 Checking ports..." -ForegroundColor Yellow

$ports = @(
    @{Port=3000; Service="Next.js Frontend"},
    @{Port=3001; Service="Node.js API Server"}, 
    @{Port=5001; Service="Python Backend"}
)

$portsOpen = 0
foreach ($portInfo in $ports) {
    if (Test-PortInUse $portInfo.Port) {
        Write-Host "✅ Port $($portInfo.Port) is in use ($($portInfo.Service))" -ForegroundColor Green
        $portsOpen++
    } else {
        Write-Host "❌ Port $($portInfo.Port) is not in use ($($portInfo.Service))" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🌐 Testing service endpoints..." -ForegroundColor Yellow

$services = @(
    @{Url="http://localhost:3000"; Name="Frontend"},
    @{Url="http://localhost:3001/api/health"; Name="API Health Check"},
    @{Url="http://localhost:5001/api/graph"; Name="Python Backend"}
)

$servicesRunning = 0
foreach ($service in $services) {
    if (Test-ServiceUrl -url $service.Url -name $service.Name) {
        $servicesRunning++
    }
}

Write-Host ""
Write-Host "📊 System Status Summary" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "Ports Open: $portsOpen/3" -ForegroundColor $(if ($portsOpen -eq 3) { "Green" } else { "Yellow" })
Write-Host "Services Running: $servicesRunning/3" -ForegroundColor $(if ($servicesRunning -eq 3) { "Green" } else { "Yellow" })

if ($servicesRunning -eq 3) {
    Write-Host ""
    Write-Host "🎉 All services are running! Access at:" -ForegroundColor Green
    Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Yellow
    Write-Host "🔌 API: http://localhost:3001" -ForegroundColor Yellow
    Write-Host "🐍 Python Backend: http://localhost:5001" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "⚠️ Some services are not running. Try:" -ForegroundColor Yellow
    Write-Host "   .\start-dmp-system.ps1" -ForegroundColor Gray
    Write-Host "   or follow manual setup in README.md" -ForegroundColor Gray
}

Write-Host ""
