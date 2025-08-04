const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

/**
 * Unified DMP GraphRAG API Server
 * Bridges the Python DMP-Intellisense backend with modern Node.js frontend
 * Provides unified API endpoints for Next.js and other clients
 */

class UnifiedDMPServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3002;
        this.pythonBackendUrl = 'http://localhost:5001';
        
        this.setupMiddleware();
        this.setupRoutes();
    }
    
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../src')));
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                services: {
                    unified_api: true,
                    python_backend: 'checking...'
                },
                timestamp: new Date().toISOString()
            });
        });
        
        // Unified Knowledge Graph API
        this.app.post('/api/knowledge/graph', async (req, res) => {
            try {
                const { query, content, topic } = req.body;
                
                // Call the Python backend mindmap API
                const response = await axios.post(`${this.pythonBackendUrl}/api/knowledge/mindmap`, {
                    content: content || query || topic || 'DMSMS Knowledge Graph'
                });
                
                if (response.data.status === 'success') {
                    // Transform the Python response to match frontend expectations
                    const graphData = {
                        nodes: response.data.mind_map.nodes.map(node => ({
                            id: node.id,
                            label: node.label,
                            type: node.type,
                            position: node.position,
                            color: node.color,
                            size: node.size || 10,
                            connections: []
                        })),
                        links: response.data.mind_map.connections.map(conn => ({
                            source: conn.from,
                            target: conn.to,
                            strength: 1
                        })),
                        metadata: {
                            topic: response.data.topic || 'DMSMS Analysis',
                            nodeCount: response.data.mind_map.nodes.length,
                            generatedAt: new Date().toISOString()
                        }
                    };
                    
                    res.json({
                        status: 'success',
                        data: graphData,
                        source: 'dmp-intellisense-python'
                    });
                } else {
                    throw new Error('Python backend returned error');
                }
                
            } catch (error) {
                console.error('Knowledge graph API error:', error);
                
                // Provide fallback data
                const fallbackData = this.generateFallbackGraphData();
                res.json({
                    status: 'success',
                    data: fallbackData,
                    source: 'fallback',
                    warning: 'Using fallback data due to backend error'
                });
            }
        });
        
        // Graph RAG Query API
        this.app.post('/api/graphrag/query', async (req, res) => {
            try {
                const { question, perspective = 'dmsms_expert' } = req.body;
                
                const response = await axios.post(`${this.pythonBackendUrl}/api/knowledge/graph_rag`, {
                    question,
                    perspective
                });
                
                res.json({
                    status: 'success',
                    answer: response.data.answer || response.data.response,
                    sources: response.data.sources || [],
                    perspective,
                    processingTime: response.data.processing_time
                });
                
            } catch (error) {
                console.error('Graph RAG query error:', error);
                res.status(500).json({
                    status: 'error',
                    error: 'Failed to process Graph RAG query',
                    details: error.message
                });
            }
        });
        
        // Knowledge Search API
        this.app.post('/api/knowledge/search', async (req, res) => {
            try {
                const { query, limit = 10 } = req.body;
                
                const response = await axios.post(`${this.pythonBackendUrl}/api/knowledge/gaps`, {
                    topic: query
                });
                
                res.json({
                    status: 'success',
                    results: response.data.gaps || response.data.results || [],
                    query,
                    resultCount: response.data.gaps?.length || 0
                });
                
            } catch (error) {
                console.error('Knowledge search error:', error);
                res.status(500).json({
                    status: 'error',
                    error: 'Failed to search knowledge base'
                });
            }
        });
        
        // Multi-Agent Discourse API
        this.app.post('/api/discourse/start', async (req, res) => {
            try {
                const { topic, agents = ['research', 'strategy'] } = req.body;
                
                const response = await axios.post(`${this.pythonBackendUrl}/api/discourse/ollama/start`, {
                    topic,
                    agents
                });
                
                res.json({
                    status: 'success',
                    conversationId: response.data.conversation_id,
                    participants: agents,
                    initialResponse: response.data.response
                });
                
            } catch (error) {
                console.error('Discourse start error:', error);
                res.status(500).json({
                    status: 'error',
                    error: 'Failed to start discourse'
                });
            }
        });
        
        // Proxy all other requests to Python backend
        this.app.all('/api/*', async (req, res) => {
            try {
                const config = {
                    method: req.method.toLowerCase(),
                    url: `${this.pythonBackendUrl}${req.path}`,
                    headers: {
                        'Content-Type': 'application/json',
                        ...req.headers
                    },
                    params: req.query,
                    timeout: 30000
                };
                
                if (req.method !== 'GET' && req.method !== 'HEAD') {
                    config.data = req.body;
                }
                
                const response = await axios(config);
                res.status(response.status).json(response.data);
                
            } catch (error) {
                console.error('Proxy error:', error);
                res.status(502).json({
                    error: 'Backend service unavailable',
                    details: error.message
                });
            }
        });
        
        // Serve Next.js frontend (if not running separately)
        this.app.get('/', (req, res) => {
            res.redirect(`${this.pythonBackendUrl}/modern`);
        });
    }
    
    generateFallbackGraphData() {
        return {
            nodes: [
                { id: 'dmsms_root', label: 'DMSMS Management', type: 'root', position: { x: 0, y: 0, z: 0 }, color: '#ff6b6b', size: 20 },
                { id: 'risk_assessment', label: 'Risk Assessment', type: 'category', position: { x: -100, y: 50, z: 0 }, color: '#4ecdc4', size: 15 },
                { id: 'obsolescence_mgmt', label: 'Obsolescence Management', type: 'category', position: { x: 100, y: 50, z: 0 }, color: '#45b7d1', size: 15 },
                { id: 'supply_chain', label: 'Supply Chain Analysis', type: 'category', position: { x: 0, y: 100, z: 50 }, color: '#96ceb4', size: 15 },
                { id: 'cost_analysis', label: 'Cost Analysis', type: 'process', position: { x: -50, y: -50, z: 0 }, color: '#feca57', size: 12 },
                { id: 'mitigation', label: 'Mitigation Strategies', type: 'process', position: { x: 50, y: -50, z: 0 }, color: '#ff9ff3', size: 12 }
            ],
            links: [
                { source: 'dmsms_root', target: 'risk_assessment', strength: 1 },
                { source: 'dmsms_root', target: 'obsolescence_mgmt', strength: 1 },
                { source: 'dmsms_root', target: 'supply_chain', strength: 1 },
                { source: 'dmsms_root', target: 'cost_analysis', strength: 1 },
                { source: 'dmsms_root', target: 'mitigation', strength: 1 },
                { source: 'risk_assessment', target: 'supply_chain', strength: 0.8 },
                { source: 'obsolescence_mgmt', target: 'mitigation', strength: 0.8 }
            ],
            metadata: {
                topic: 'DMSMS Analysis (Fallback)',
                nodeCount: 6,
                generatedAt: new Date().toISOString()
            }
        };
    }
    
    async start() {
        try {
            // Test Python backend connection
            await axios.get(`${this.pythonBackendUrl}/health`);
            console.log('✅ Python backend connected successfully');
        } catch (error) {
            console.warn('⚠️ Python backend not available:', error.message);
        }
        
        this.app.listen(this.port, () => {
            console.log('');
            console.log('🚀 Unified DMP GraphRAG Server Started');
            console.log('=====================================');
            console.log(`🌐 Server: http://localhost:${this.port}`);
            console.log(`🔗 Python Backend: ${this.pythonBackendUrl}`);
            console.log('');
            console.log('📊 Unified API Endpoints:');
            console.log('   POST /api/knowledge/graph - Unified knowledge graph');
            console.log('   POST /api/graphrag/query - Graph RAG queries');
            console.log('   POST /api/knowledge/search - Knowledge search');
            console.log('   POST /api/discourse/start - Multi-agent discourse');
            console.log('   ALL  /api/* - Proxy to Python backend');
            console.log('');
            console.log('🎯 Frontend URLs:');
            console.log(`   📱 Modern Interface: ${this.pythonBackendUrl}/modern`);
            console.log(`   🏠 Main Canvas: ${this.pythonBackendUrl}`);
            console.log('');
        });
    }
}

// Start the server
if (require.main === module) {
    const server = new UnifiedDMPServer();
    server.start().catch(console.error);
}

module.exports = UnifiedDMPServer;
