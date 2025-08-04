const express = require('express');
const cors = require('cors');
const path = require('path');
const MultiAgentService = require('./services/multiAgentService');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
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
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    services: {
      multiAgent: multiAgentService.isInitialized,
      ollama: 'checking...'
    },
    timestamp: new Date().toISOString()
  });
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
  } catch (error) {
    console.error('Agent query error:', error);
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

// Document analysis endpoints
app.post('/api/documents/analyze', async (req, res) => {
  try {
    const { content, type = 'dmp' } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Document content is required' });
    }

    // Use research agent for document analysis
    const analysis = await multiAgentService.processMessage(
      `Analyze this ${type} document: ${content.substring(0, 1000)}...`,
      'research'
    );

    res.json({
      analysis: analysis.response,
      insights: [
        'Document contains DMSMS management procedures',
        'Lifecycle planning strategies identified',
        'Risk assessment framework present'
      ],
      confidence: 0.89
    });
  } catch (error) {
    console.error('Document analysis error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Proxy to Python DMP-Intellisense backend
app.all('/api/dmp/*', async (req, res) => {
  try {
    const axios = require('axios');
    const pythonBackendUrl = 'http://localhost:5001'; // Updated to correct port
    const path = req.path.replace('/api/dmp', '');
    
    const config = {
      method: req.method.toLowerCase(),
      url: `${pythonBackendUrl}${path}`,
      params: req.query,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      }
    };

    // Add body for POST/PUT requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      config.data = req.body;
    }
    
    const response = await axios(config);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('DMP-Intellisense proxy error:', error);
    res.status(502).json({ 
      error: 'DMP-Intellisense backend unavailable',
      details: 'Make sure the DMP-Intellisense Python service is running on port 5001',
      service: 'DMP-Intellisense Flask App'
    });
  }
});

// Direct proxy to DMP-Intellisense modern interface
app.get('/dmp-interface', (req, res) => {
  res.redirect('http://localhost:5001/modern');
});

// Proxy specific DMP-Intellisense API endpoints
app.all('/api/knowledge/*', async (req, res) => {
  try {
    const axios = require('axios');
    const pythonBackendUrl = 'http://localhost:5001';
    
    const config = {
      method: req.method.toLowerCase(),
      url: `${pythonBackendUrl}${req.path}`,
      params: req.query,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      }
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      config.data = req.body;
    }
    
    const response = await axios(config);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Knowledge API proxy error:', error);
    res.status(502).json({ 
      error: 'Knowledge API unavailable',
      details: error.message
    });
  }
});

app.all('/api/discourse/*', async (req, res) => {
  try {
    const axios = require('axios');
    const pythonBackendUrl = 'http://localhost:5001';
    
    const config = {
      method: req.method.toLowerCase(),
      url: `${pythonBackendUrl}${req.path}`,
      params: req.query,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      }
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      config.data = req.body;
    }
    
    const response = await axios(config);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Discourse API proxy error:', error);
    res.status(502).json({ 
      error: 'Discourse API unavailable',
      details: error.message
    });
  }
});

// Initialize and start server
async function startServer() {
  try {
    console.log('🚀 Initializing DMP GraphRAG Multi-Agent Backend...');
    
    // Initialize multi-agent service
    await multiAgentService.initialize();
    
    app.listen(port, () => {
      console.log('✅ Backend services initialized successfully');
      console.log(`🌐 Node.js API Server: http://localhost:${port}`);
      console.log('📊 Available endpoints:');
      console.log('   - GET  /health - Health check');
      console.log('   - POST /api/agents/query - Query specific agent');
      console.log('   - GET  /api/agents - List all agents');
      console.log('   - POST /api/graph/query - Graph RAG query (simulated)');
      console.log('   - GET  /api/graph/nodes - Get knowledge graph nodes');
      console.log('   - POST /api/documents/analyze - Analyze documents');
      console.log('   - ALL  /api/dmp/* - Proxy to DMP-Intellisense backend');
      console.log('   - ALL  /api/knowledge/* - Knowledge graph operations');
      console.log('   - ALL  /api/discourse/* - Multi-agent discourse');
      console.log('   - GET  /dmp-interface - Redirect to DMP-Intellisense UI');
      console.log('');
      console.log('🔗 DMP-Intellisense Modern Interface: http://localhost:5001/modern');
      console.log('🔗 DMP-Intellisense Main Canvas: http://localhost:5001');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
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
