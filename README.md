# DMP GraphRAG Multi-Agent Workspace

This workspace integrates the powerful **DMP-Intellisense** system with a modern Next.js + Node.js architecture, providing a comprehensive solution for Diminishing Manufacturing Sources & Material Shortages (DMSMS) management and analysis.

## System Architecture

### 🎯 **DMP-Intellisense Core** (Python Flask - Port 5001)
The main intelligent analysis engine with:
- **3D Knowledge Graph** with 3,053+ nodes
- **AI Chat Interface** with 5 expert perspectives
- **Graph RAG** search capabilities
- **Multi-Agent STORM** discourse system
- **Document Upload & Analysis**
- **Section Enhancement** for DMP documents
- **Real-time Ollama LLM** integration

### 🚀 **Node.js API Server** (Express - Port 3001)
Modern backend providing:
- RESTful API endpoints
- Multi-agent conversation management
- Proxy to DMP-Intellisense services
- Document analysis services
- Health monitoring
- Real-time graph update broadcasts via Socket.io

### 🌐 **Next.js Frontend** (React - Port 3000)
Modern web interface with 2D/3D graph visualization

## 🚀 Complete Startup Guide

Follow these steps **in order** to start the complete system:

### Prerequisites

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **Python** (v3.9 or higher) - [Download](https://python.org/)
3. **Poetry** (Python dependency manager) - [Install](https://python-poetry.org/docs/#installation)
4. **Ollama** (for LLM support) - [Install](https://ollama.ai/)

### Step 1: Environment Setup

```bash
# Clone and enter the workspace
git clone <your-repo-url>
cd graphrag-multiagent-workspace

# Copy environment file
cp .env.local.example .env.local
```

### Step 2: Virtual Environment Setup

**Check if Python venv exists, create if needed:**

```bash
# Windows (PowerShell)
if (!(Test-Path ".venv")) { 
    python -m venv .venv 
}
.venv\Scripts\Activate.ps1

# macOS/Linux
if [ ! -d ".venv" ]; then 
    python3 -m venv .venv 
fi
source .venv/bin/activate
```

### Step 3: Install Dependencies

```bash
# Install Node.js dependencies (for frontend and backend)
npm install

# Install Python dependencies with Poetry
cd dmp-intellisense-source
poetry install
cd ..
```

### Step 4: Start Services (In Order)

**Start all services in separate terminals:**

#### Terminal 1: Python Backend (DMP-Intellisense)
```bash
# Activate venv if not already active
.venv\Scripts\Activate.ps1  # Windows
# source .venv/bin/activate   # macOS/Linux

npm run dev:py
# Starts Python Flask server on http://localhost:5001
```

#### Terminal 2: Node.js API Server
```bash
npm run dev:api
# Starts Express server on http://localhost:3001
```

#### Terminal 3: Next.js Frontend
```bash
npm run dev
# Starts Next.js dev server on http://localhost:3000
```

### Step 5: Verify Services

Open these URLs to verify each service:

- **Frontend**: http://localhost:3000 (main application)
- **API Server**: http://localhost:3001/api/health (health check)  
- **Python Backend**: http://localhost:5001/api/graph (graph data)

### Quick Status Check

```powershell
# Check all services at once
.\check-status.ps1
# or
npm run status
```

### 🎯 One-Command Startup (Alternative)

For convenience, you can use the provided platform-specific scripts:

**Windows PowerShell:**
```powershell
# Automated setup with service monitoring
.\start-dmp-system.ps1
```

**Windows Command Prompt:**
```cmd
# Simple setup (opens multiple windows)
start-dmp-system.bat
```

**macOS/Linux:**
```bash
# Make executable and run
chmod +x start-dmp-system.sh
./start-dmp-system.sh
```

These scripts will:
- ✅ Check prerequisites (Node.js, Python, Poetry)
- ✅ Create virtual environment if needed
- ✅ Install all dependencies automatically
- ✅ Start all services in the correct order
- ✅ Provide status monitoring and cleanup

## 🔧 Development Workflow

## 🔧 Development Workflow

The Python backend now uses [Poetry](https://python-poetry.org/) for dependency management.

### Install dependencies

```bash
cd dmp-intellisense-source
poetry install
```

### Run the backend

```bash
poetry run python run.py
```

### Add a new dependency

```bash
poetry add <package>
```

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### Port Already in Use
```bash
# Kill processes on specific ports
# Windows
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# macOS/Linux  
lsof -ti:3000 | xargs kill -9
```

#### Poetry Not Found
```bash
# Install Poetry
curl -sSL https://install.python-poetry.org | python3 -

# Or using pip
pip install poetry
```

#### Python venv Issues
```bash
# Remove and recreate venv
rm -rf .venv  # or rmdir /s .venv on Windows
python -m venv .venv
```

#### Node Module Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📋 Service Status Check

Use these commands to check if services are running:

```bash
# Check if ports are in use
netstat -an | findstr :3000  # Frontend
netstat -an | findstr :3001  # API Server  
netstat -an | findstr :5001  # Python Backend

# Test API endpoints
curl http://localhost:3001/api/health
curl http://localhost:5001/api/graph
```

## Key Features

### 🤖 **AI-Powered Analysis**
- **5 Expert Perspectives**: Research, Strategy, Technical, Risk, Compliance
- **Graph RAG**: Query 3,053+ knowledge nodes with AI-enhanced responses
- **Multi-Agent Discourse**: Collaborative analysis between AI agents
- **Document Intelligence**: Upload and analyze PDF/DOC files

### 🕸️ **3D Knowledge Visualization**
- Interactive Three.js knowledge graph
- Real-time node relationships
- Click-to-explore functionality
- Automatic rotation and zooming

### 📊 **DMSMS Management**
- Component lifecycle tracking
- Obsolescence planning
- Risk assessment
- Supply chain analysis
- Regulatory compliance

### 🔧 **API Integration**
```javascript
// Query the knowledge graph
GET  /api/graph
POST /api/knowledge/gaps
POST /api/knowledge/mindmap
POST /api/discourse/ollama/start

// Multi-agent conversations
POST /api/agents/query
GET /api/agents

// Document analysis
POST /api/documents/analyze
```

## Technology Stack

- **Backend AI**: Python Flask + Ollama + LangChain
- **API Layer**: Node.js + Express
- **Frontend**: Next.js + React + TypeScript
- **AI Models**: Llama 3.2:1b via Ollama
- **Visualization**: Three.js + D3.js
- **Knowledge Graph**: Graph RAG with vector search

## Prerequisites

- **Python 3.9+** with virtual environment
- **Node.js 18+** and npm
- **Ollama** with llama3.2:1b model
- **macOS/Linux** (Windows via WSL)

## Installation

### Auto Setup (Recommended)
```bash
cd dmp-intellisense-source
./scripts/setup_environment.sh  # Installs everything
./scripts/start_app.sh           # Starts DMP-Intellisense
```

### Manual Setup
```bash
# 1. Setup Python environment
cd dmp-intellisense-source
poetry install

# 2. Install Ollama
brew install ollama
ollama serve &
ollama pull llama3.2:1b

# 3. Setup Node.js
cd ../backend
npm install

# 4. Start services
poetry run python run.py &          # DMP-Intellisense (port 5001)
npm start &                         # Node.js API (port 3001, with Socket.io)

### Environment Variables
- `PYTHON_BACKEND_URL` – override the default `http://localhost:5001` for the Python services

## Usage Examples

### Chat with AI Expert
```bash
curl -X POST http://localhost:3001/api/agents/query \
  -H "Content-Type: application/json" \
  -d '{"message": "Analyze DMSMS risks for electronic components", "agentId": "research"}'
```

### Query Knowledge Graph
```bash
curl -X POST http://localhost:5001/api/knowledge/gaps \
  -H "Content-Type: application/json" \
  -d '{"topic": "component obsolescence"}'
```

## Key URLs

| Service | URL | Description |
|---------|-----|-------------|
| Python Backend | http://localhost:5001 | DMP-Intellisense API |
| Node.js API | http://localhost:3001 | API endpoint |
| Health Check | http://localhost:3001/health | System status |
| Frontend | http://localhost:3000 | Next.js interface |

## Development

The system is production-ready with:
- ✅ Working AI chat with multiple perspectives
- ✅ Interactive 3D knowledge visualization
- ✅ Document upload and analysis
- ✅ Multi-agent collaborative discourse
- ✅ Real-time Graph RAG search
- ✅ Version control for template modifications
- ✅ Comprehensive API endpoints

## Project Structure

```
graphrag-multiagent-workspace/
├── dmp-intellisense-source/     # 🧠 Main AI system (Python)
│   ├── src/                     # Core application code
│   ├── templates/              # Web interface templates  
│   ├── static/                 # CSS, JS, assets
│   ├── scripts/                # Setup and utility scripts
│   └── run.py                  # Main application entry
├── backend/                     # 🔌 Node.js API server
│   ├── services/               # Multi-agent services
│   ├── routes/                 # API routes
│   └── app.js                  # Express server
├── src/                        # 🌐 Next.js frontend
└── package.json               # Next.js configuration
```

This system provides a complete DMSMS management solution with cutting-edge AI capabilities!

## Learn More

- [DMP-Intellisense Documentation](dmp-intellisense-source/docs/)
- [API Integration Guide](INTEGRATION_PLAN.md)
- [Python Quick Start](PYTHON_QUICKSTART.md)

## Local Backend Setup

The Python and Node.js backends can be run independently for development or
testing:

```bash
# Python API (port 5001)
cd dmp-intellisense-source
poetry install
poetry run python run.py

# Node.js proxy (port 3001)
cd backend
npm install
node app.js
```

The Flask application exposes only API endpoints; the previous `/modern` UI has
been deprecated in favor of the Next.js frontend on port 3000.

## Testing

Run backend and frontend tests:

```bash
pytest backend/tests/test_integration.py
npm test
```
