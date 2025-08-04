#!/bin/bash

echo "🚀 Starting Complete DMP Intelligence System..."
echo "==============================================="

# Check if all necessary directories exist
echo "📁 Checking directories..."
WORKSPACE_DIR="/Users/samjensen/DMP Project/DMP Gen V2/graphrag-multiagent-workspace"
PYTHON_DIR="$WORKSPACE_DIR/dmp-intellisense-source"
BACKEND_DIR="$WORKSPACE_DIR/backend"

if [ ! -d "$WORKSPACE_DIR" ]; then
    echo "❌ Workspace directory not found: $WORKSPACE_DIR"
    exit 1
fi

if [ ! -d "$PYTHON_DIR" ]; then
    echo "❌ Python DMP source not found: $PYTHON_DIR"
    exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found: $BACKEND_DIR"
    exit 1
fi

echo "✅ All directories found"

# Function to start service in background
start_service() {
    local name=$1
    local dir=$2
    local command=$3
    local port=$4
    
    echo "🔄 Starting $name..."
    cd "$dir"
    
    # Kill any existing process on the port
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    
    # Start the service
    eval "$command" &
    local pid=$!
    
    # Wait a moment and check if it started
    sleep 2
    if kill -0 $pid 2>/dev/null; then
        echo "✅ $name started successfully (PID: $pid, Port: $port)"
        echo $pid > "/tmp/dmp_${name}_pid"
    else
        echo "❌ Failed to start $name"
    fi
}

# Start Python DMP-Intellisense Backend
start_service "Python-Backend" "$PYTHON_DIR" "python3 run.py" 5001

# Start Unified Node.js API Bridge
start_service "Unified-API" "$BACKEND_DIR" "npm run dev:unified" 3002

# Start Next.js Frontend
start_service "Next.js-Frontend" "$WORKSPACE_DIR" "npm run dev" 3000

echo ""
echo "🎯 DMP Intelligence System Status:"
echo "=================================="
echo "📱 Next.js Frontend:     http://localhost:3000"
echo "🔗 Unified API:          http://localhost:3002"
echo "🐍 Python Backend:       http://localhost:5001"
echo ""
echo "🎪 Application URLs:"
echo "===================="
echo "🏠 Main DMP Page:        http://localhost:3000/dmp-intelligence"
echo "📊 Python Interface:     http://localhost:5001/modern"
echo "🔍 API Health Check:     http://localhost:3002/health"
echo ""
echo "💡 Quick Test Commands:"
echo "======================="
echo "curl http://localhost:3002/health"
echo "curl -X POST http://localhost:3002/api/knowledge/graph -H 'Content-Type: application/json' -d '{\"topic\": \"DMSMS Test\"}'"
echo ""

# Function to stop all services
cleanup() {
    echo ""
    echo "🛑 Stopping DMP Intelligence System..."
    
    # Stop services by PID
    for service in Python-Backend Unified-API Next.js-Frontend; do
        if [ -f "/tmp/dmp_${service}_pid" ]; then
            pid=$(cat "/tmp/dmp_${service}_pid")
            if kill -0 $pid 2>/dev/null; then
                echo "⏹️  Stopping $service (PID: $pid)"
                kill $pid
            fi
            rm -f "/tmp/dmp_${service}_pid"
        fi
    done
    
    # Kill any remaining processes on our ports
    for port in 3000 3002 5001; do
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    done
    
    echo "✅ All services stopped"
    exit 0
}

# Set up cleanup on script exit
trap cleanup EXIT

echo "🎉 DMP Intelligence System is running!"
echo "Press Ctrl+C to stop all services..."

# Keep script running
while true; do
    sleep 10
    
    # Health check - ensure all services are running
    for port in 3000 3002 5001; do
        if ! curl -s http://localhost:$port/health > /dev/null 2>&1 && ! curl -s http://localhost:$port > /dev/null 2>&1; then
            echo "⚠️  Service on port $port appears to be down"
        fi
    done
done
