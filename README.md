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

### 🌐 **Next.js Frontend** (React - Port 3000)
Modern web interface (development ready)

## Quick Start

### 1. Start DMP-Intellisense (Python Backend)
```bash
cd dmp-intellisense-source
source .venv/bin/activate
./scripts/start_app.sh
```
**Access:** http://localhost:5001/modern

### 2. Start Node.js API Server
```bash
cd backend
npm install
npm start
```
**Access:** http://localhost:3001

### 3. Start Next.js Unified Frontend
```bash
npm install
npm run dev
```
**Access:** http://localhost:3000

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
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt

# 2. Install Ollama
brew install ollama
ollama serve &
ollama pull llama3.2:1b

# 3. Setup Node.js
cd ../backend
npm install

# 4. Start services
python3 run.py &          # DMP-Intellisense (port 5001)
npm start &               # Node.js API (port 3001)
```

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

### Access Modern Interface
- **DMP-Intellisense UI**: http://localhost:5001/modern
- **3D Knowledge Graph**: Click "Knowledge Graph" in interface
- **AI Chat**: Select perspective and start chatting
- **Document Upload**: Use the upload feature for analysis

## Key URLs

| Service | URL | Description |
|---------|-----|-------------|
| DMP-Intellisense | http://localhost:5001/modern | Main AI interface |
| Node.js API | http://localhost:3001 | API documentation |
| Health Check | http://localhost:3001/health | System status |
| Knowledge Graph | http://localhost:5001 | Interactive 3D graph |

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
pip install -r requirements.txt
python run.py

# Node.js proxy (port 3001)
cd backend
npm install
node app.js
```

The Flask application exposes only API endpoints; the previous `/modern` UI has
been deprecated in favor of the Next.js frontend on port 3000.
