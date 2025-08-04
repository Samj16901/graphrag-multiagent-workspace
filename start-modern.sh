#!/bin/bash

echo "🚀 Starting DMP Intelligence - Modern Interface Only"
echo "===================================================="

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DMP_DIR="$SCRIPT_DIR/dmp-intellisense-source"

# Check if Python DMP directory exists
if [ ! -d "$DMP_DIR" ]; then
    echo "❌ DMP source directory not found: $DMP_DIR"
    exit 1
fi

echo "📁 Found DMP directory: $DMP_DIR"

# Kill any existing process on port 5001
echo "🔄 Stopping any existing services on port 5001..."
lsof -ti:5001 | xargs kill -9 2>/dev/null || true

# Navigate to DMP directory
cd "$DMP_DIR"

# Activate virtual environment if it exists
if [ -f ".venv/bin/activate" ]; then
    echo "🔧 Activating Python virtual environment..."
    source .venv/bin/activate
else
    echo "⚠️  No virtual environment found, using system Python"
fi

# Check if Python dependencies are available
echo "🐍 Checking Python dependencies..."
python3 -c "import flask, flask_cors" 2>/dev/null || {
    echo "❌ Required Python packages not found. Installing..."
    pip3 install flask flask-cors python-dotenv requests
}

# Start the Python DMP system
echo ""
echo "🚀 Starting DMP Intelligence System..."
echo "======================================="
echo ""

python3 run.py &
PYTHON_PID=$!

# Wait a moment for startup
sleep 3

# Check if the process started successfully
if kill -0 $PYTHON_PID 2>/dev/null; then
    echo "✅ DMP Intelligence System started successfully!"
    echo ""
    echo "🎯 Application URLs:"
    echo "==================="
    echo "🏠 Main Interface:        http://localhost:5001/modern"
    echo "🌐 Health Check:         http://localhost:5001/health" 
    echo "📊 API Documentation:    http://localhost:5001/api/knowledge/graph"
    echo ""
    echo "💡 Key Features:"
    echo "=================="
    echo "✨ Interactive D3.js Knowledge Graph"
    echo "🤖 Multi-Agent AI Chat System"
    echo "📈 Real-time DMSMS Analysis"
    echo "🔍 Graph RAG Query System"
    echo ""
    echo "📝 All routes redirect to /modern interface"
    echo "🔄 Only /api/* routes serve actual endpoints"
    echo ""
else
    echo "❌ Failed to start DMP system"
    exit 1
fi

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping DMP Intelligence System..."
    
    if kill -0 $PYTHON_PID 2>/dev/null; then
        echo "⏹️  Stopping Python backend (PID: $PYTHON_PID)"
        kill $PYTHON_PID
        sleep 2
        # Force kill if still running
        kill -9 $PYTHON_PID 2>/dev/null || true
    fi
    
    # Kill any remaining processes on port 5001
    lsof -ti:5001 | xargs kill -9 2>/dev/null || true
    
    echo "✅ DMP system stopped cleanly"
    exit 0
}

# Set up cleanup on script exit
trap cleanup EXIT INT TERM

echo "🎉 DMP Intelligence is now running!"
echo "🌐 Access the modern interface at: http://localhost:5001/modern"
echo ""
echo "Press Ctrl+C to stop the service..."
echo ""

# Keep script running and provide health monitoring
while true; do
    sleep 10
    
    # Health check - restart if service goes down
    if ! kill -0 $PYTHON_PID 2>/dev/null; then
        echo "⚠️  DMP service stopped unexpectedly, attempting restart..."
        cd "$DMP_DIR"
        [ -f ".venv/bin/activate" ] && source .venv/bin/activate
        python3 run.py &
        PYTHON_PID=$!
        sleep 3
        
        if kill -0 $PYTHON_PID 2>/dev/null; then
            echo "✅ DMP service restarted successfully"
        else
            echo "❌ Failed to restart DMP service"
            exit 1
        fi
    fi
done
