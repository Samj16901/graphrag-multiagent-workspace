#!/bin/bash

echo "🚀 Starting DMP Intelligence System (Modern Interface Only)..."
echo "============================================================="

# Navigate to Python DMP directory
PYTHON_DIR="/Users/samjensen/DMP Project/DMP Gen V2/graphrag-multiagent-workspace/dmp-intellisense-source"

if [ ! -d "$PYTHON_DIR" ]; then
    echo "❌ Python DMP source not found: $PYTHON_DIR"
    exit 1
fi

echo "📁 Found Python DMP directory: $PYTHON_DIR"

# Kill any existing process on port 5001
echo "🔄 Checking for existing services on port 5001..."
lsof -ti:5001 | xargs kill -9 2>/dev/null || true

# Start Python DMP system
echo "🐍 Starting Python DMP Backend..."
cd "$PYTHON_DIR"

# Activate virtual environment if it exists
if [ -f ".venv/bin/activate" ]; then
    echo "🔧 Activating virtual environment..."
    source .venv/bin/activate
fi

# Start the Python server
echo "🚀 Launching DMP Enhanced Canvas..."
python3 run.py &
PID=$!

# Wait a moment and check if it started
sleep 3
if kill -0 $PID 2>/dev/null; then
    echo "✅ DMP System started successfully (PID: $PID)"
    echo ""
    echo "🎯 DMP Intelligence System Ready:"
    echo "================================="
    echo "🏠 Main Application:      http://localhost:5001"
    echo "📊 Modern Interface:      http://localhost:5001/modern"
    echo "🔧 API Status:            http://localhost:5001/api/knowledge/graph"
    echo ""
    echo "💡 The system automatically redirects / to /modern"
    echo "💡 Only the /modern route is active - all others redirect here"
    echo ""
else
    echo "❌ Failed to start DMP system"
    exit 1
fi

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping DMP Intelligence System..."
    if kill -0 $PID 2>/dev/null; then
        echo "⏹️  Stopping Python backend (PID: $PID)"
        kill $PID
    fi
    
    # Kill any remaining processes on port 5001
    lsof -ti:5001 | xargs kill -9 2>/dev/null || true
    
    echo "✅ DMP system stopped"
    exit 0
}

# Set up cleanup on script exit
trap cleanup EXIT

echo "🎉 DMP Intelligence System is running on http://localhost:5001/modern"
echo "Press Ctrl+C to stop the service..."

# Keep script running
while true; do
    sleep 10
    
    # Health check
    if ! curl -s http://localhost:5001 > /dev/null 2>&1; then
        echo "⚠️  DMP service appears to be down, restarting..."
        kill $PID 2>/dev/null || true
        cd "$PYTHON_DIR"
        python3 run.py &
        PID=$!
    fi
done
