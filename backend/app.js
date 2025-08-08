const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const MultiAgentService = require('./services/multiAgentService');
const gitService = require('./services/gitService');
const { requestToPython, handleError } = require('./services/pythonProxy');

const app = express();
const port = process.env.PORT || 3001;
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:5001';
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
io.on('connection', () => console.log('📡 Socket client connected'));

// simple file logger
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
const logStream = fs.createWriteStream(path.join(logDir, 'backend.log'), { flags: 'a' });
function logError(err) {
  const message = `[${new Date().toISOString()}] ${err.stack || err}\n`;
  logStream.write(message);
}

async function emitGraphUpdate() {
  try {
    const response = await axios.get(`${PYTHON_BACKEND_URL}/graph/all`);
    io.emit('graph-update', response.data);
  } catch (error) {
    console.error('Graph update broadcast error:', error);
    logError(error);
  }
}
// Middleware
const allowedOrigins = [/^http:\/\/localhost:\d+$/];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => o.test(origin))) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());
app.use(express.static('public'));

// Initialize Multi-Agent Service
const multiAgentService = new MultiAgentService();

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'DMP GraphRAG Multi-Agent Backend API',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const [ollamaStatus, pythonStatus] = await Promise.all([
      multiAgentService.testOllamaConnection(),
      axios
        .get(`${PYTHON_BACKEND_URL}/health`)
        .then(() => 'connected')
        .catch(() => 'disconnected')
    ]);

    res.json({
      status: 'healthy',
      services: {
        multiAgent: multiAgentService.isInitialized,
        ollama: ollamaStatus ? 'connected' : 'disconnected',
        python: pythonStatus
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      status: 'healthy',
      services: {
        multiAgent: multiAgentService.isInitialized,
        ollama: 'error',
        python: 'error'
      },
      timestamp: new Date().toISOString()
    });
  }
});

// Multi-agent endpoints
app.post('/api/agents/query', async (req, res) => {
  try {
    const { message, agentId = 'research', conversationId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await multiAgentService.processMessage(message, agentId, conversationId);
    res.json(response);
    emitGraphUpdate();
  } catch (error) {
    console.error('Agent query error:', error);
    logError(error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/api/agents', (req, res) => {
  const agents = Array.from(multiAgentService.agents.values()).map(agent => ({
    id: agent.id,
    name: agent.name,
    role: agent.role,
    capabilities: agent.capabilities
  }));
  res.json(agents);
});

app.post('/api/agents/conversation/start', async (req, res) => {
  try {
    const { topic, participants = ['research', 'strategy'] } = req.body;
    const conversation = await multiAgentService.startConversation(topic, participants);
    res.json(conversation);
  } catch (error) {
    console.error('Conversation start error:', error);
    logError(error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Repository and Git endpoints
app.get('/api/files/tree', async (req, res) => {
  try {
    const tree = await gitService.listTree(req.query.path || '');
    res.json(tree);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/files/get', async (req, res) => {
  try {
    const content = await gitService.readFile(req.query.path);
    res.json({ path: req.query.path, content });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/files/put', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    await gitService.writeFile(filePath, content);
    res.json({ path: filePath, status: 'ok' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/git/commit', async (req, res) => {
  try {
    const { message } = req.body;
    const result = await gitService.commit(message || 'update');
    res.json({ result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/git/branch', async (req, res) => {
  try {
    const { name } = req.body;
    const result = await gitService.branch(name);
    res.json({ result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/git/push', async (req, res) => {
  try {
    const { remote = 'origin', branch } = req.body;
    const result = await gitService.push(remote, branch);
    res.json({ result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/git/pr', async (req, res) => {
  try {
    const pr = await gitService.createPullRequest(req.body);
    res.json(pr);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/agent/patch', async (req, res) => {
  try {
    const { path: filePath, content, instruction } = req.body;
    if (!filePath || content === undefined || !instruction) {
      return res.status(400).json({ error: 'path, content and instruction required' });
    }
    const modified = `${content}\n\n// Agent suggestion: ${instruction}\n`;
    res.json({ type: 'file', payload: modified });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Retrieve full knowledge graph
  app.get('/api/graph', async (req, res) => {
    try {
      const response = await axios.get(`${PYTHON_BACKEND_URL}/graph/all`);
      res.json(response.data);
      io.emit('graph-update', response.data);
    } catch (error) {
      console.error('Graph fetch error:', error);
      logError(error);
      res.status(502).json({ error: 'Graph service unavailable', details: error.message });
    }
  });

// Graph RAG endpoints with Ollama integration
app.post('/api/graphrag/query', async (req, res) => {
  try {
    const { question, perspective = 'technical' } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Use Ollama to generate a comprehensive DMSMS response
    const response = await multiAgentService.processGraphRAGQuery(question, perspective);
    res.json(response);
    emitGraphUpdate();
  } catch (error) {
    console.error('GraphRAG query error:', error);
    logError(error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/api/knowledge/graph', async (req, res) => {
  try {
    const { topic, content } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    // Generate knowledge graph using Ollama
    const graphData = await multiAgentService.generateKnowledgeGraph(topic, content);
    res.json({ success: true, data: graphData });
    io.emit('graph-update', graphData);
  } catch (error) {
    console.error('Knowledge graph generation error:', error);
    logError(error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.post('/api/document/analyze', async (req, res) => {
  try {
    const { content, analysisType = 'comprehensive' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Analyze document using Ollama
    const analysis = await multiAgentService.analyzeDocument(content, analysisType);
    res.json(analysis);
    emitGraphUpdate();
  } catch (error) {
    console.error('Document analysis error:', error);
    logError(error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Graph RAG endpoints
app.post('/api/graph/query', async (req, res) => {
  try {
    const { query, perspective = 'technical' } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Simulate Graph RAG response (you can integrate with the Python backend here)
    const response = {
      query,
      perspective,
      results: [
        {
          id: 'node_1',
          title: 'DMSMS Management Process',
          content: 'Comprehensive process for managing diminishing manufacturing sources and material shortages...',
          relevance: 0.95,
          connections: ['node_2', 'node_3']
        },
        {
          id: 'node_2', 
          title: 'Component Lifecycle Management',
          content: 'Strategies for tracking and managing component lifecycles...',
          relevance: 0.88,
          connections: ['node_1', 'node_4']
        }
      ],
      totalNodes: 3053,
      processingTime: '250ms'
    };

    res.json(response);
  } catch (error) {
    console.error('Graph query error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.get('/api/graph/nodes', (req, res) => {
  // Simulate knowledge graph nodes
  const nodes = [
    { id: 'dmsms_1', name: 'DMSMS Management', type: 'process', connections: 12 },
    { id: 'lifecycle_1', name: 'Component Lifecycle', type: 'concept', connections: 8 },
    { id: 'supply_1', name: 'Supply Chain Risk', type: 'risk', connections: 15 },
    { id: 'obsolescence_1', name: 'Obsolescence Planning', type: 'strategy', connections: 10 }
  ];
  
  res.json({ nodes, totalCount: 3053 });
});

// Proxy to Python backend
app.all('/api/dmp/*', async (req, res) => {
  try {
    const { status, data } = await requestToPython({ ...req, path: req.path.replace('/api/dmp', '') });
    res.status(status).json(data);
  } catch (err) {
    console.error('DMP-Intellisense proxy error:', err);
    logError(err);
    handleError(res, err, 'DMP-Intellisense backend');
  }
});

app.all('/api/knowledge/*', async (req, res) => {
  try {
    const { status, data } = await requestToPython(req);
    res.status(status).json(data);
  } catch (err) {
    console.error('Knowledge API proxy error:', err);
    logError(err);
    handleError(res, err, 'Knowledge API');
  }
});

app.all('/api/discourse/*', async (req, res) => {
  try {
    const { status, data } = await requestToPython(req);
    res.status(status).json(data);
  } catch (err) {
    console.error('Discourse API proxy error:', err);
    logError(err);
    handleError(res, err, 'Discourse API');
  }
});

app.all('/api/documents/*', async (req, res) => {
  try {
    const { status, data } = await requestToPython(req);
    res.status(status).json(data);
  } catch (err) {
    console.error('Documents API proxy error:', err);
    logError(err);
    handleError(res, err, 'Documents API');
  }
});

// Initialize and start server
async function startServer() {
  try {
    console.log('🚀 Initializing DMP GraphRAG Multi-Agent Backend...');
    
    // Initialize multi-agent service
    await multiAgentService.initialize();
    
    server.listen(port, () => {
      console.log('✅ Backend services initialized successfully');
      console.log(`🌐 Node.js API Server: http://localhost:${port}`);
      console.log('📊 Available endpoints:');
      console.log('   - GET  /health - Health check');
      console.log('   - POST /api/agents/query - Query specific agent');
      console.log('   - GET  /api/agents - List all agents');
      console.log('   - GET  /api/graph - Retrieve full graph');
      console.log('   - POST /api/graph/query - Graph RAG query (simulated)');
      console.log('   - GET  /api/graph/nodes - Get knowledge graph nodes');
      console.log('   - ALL  /api/dmp/* - Proxy to DMP-Intellisense backend');
      console.log('   - ALL  /api/knowledge/* - Knowledge graph operations');
      console.log('   - ALL  /api/discourse/* - Multi-agent discourse');
      console.log('   - ALL  /api/documents/* - Document operations');
      console.log('');
      console.log(`🔗 DMP-Intellisense API: ${PYTHON_BACKEND_URL}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    logError(error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

module.exports = app;
