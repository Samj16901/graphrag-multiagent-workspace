const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class MultiAgentService {
  constructor() {
    this.agents = new Map();
    this.conversations = new Map();
    this.isInitialized = false;
    this.ollamaEndpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
    
    // Initialize default agents
    this.initializeDefaultAgents();
  }

  async initialize() {
    try {
      // Test Ollama connection
      await this.testOllamaConnection();
      this.isInitialized = true;
      console.log('Multi-Agent Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Multi-Agent Service:', error);
      throw error;
    }
  }

  async testOllamaConnection() {
    try {
      const response = await axios.get(`${this.ollamaEndpoint}/api/tags`);
      console.log('Ollama available for multi-agent system');
      return true;
    } catch (error) {
      console.warn('Ollama not available for agents:', error.message);
      return false;
    }
  }

  initializeDefaultAgents() {
    // Research Agent - specializes in document analysis and information extraction
    this.agents.set('research', {
      id: 'research',
      name: 'Research Agent',
      role: 'Document Analyzer and Information Researcher',
      model: process.env.RESEARCH_MODEL || 'llama3.2:latest',
      systemPrompt: `You are a Research Agent specialized in analyzing documents and extracting key information. Your responsibilities include:
- Analyzing documents for key insights and patterns
- Extracting relevant facts and data points
- Summarizing complex information
- Identifying important entities and relationships
- Providing evidence-based answers with citations

Always provide detailed, accurate, and well-sourced responses. When referencing information, cite the source documents.`,
      capabilities: ['document_analysis', 'information_extraction', 'summarization', 'fact_checking'],
      temperature: 0.1,
      maxTokens: 2000
    });

    // Strategy Agent - focuses on high-level planning and decision making
    this.agents.set('strategy', {
      id: 'strategy',
      name: 'Strategy Agent',
      role: 'Strategic Planner and Decision Maker',
      model: process.env.STRATEGY_MODEL || 'llama3.2:latest',
      systemPrompt: `You are a Strategy Agent focused on high-level planning and strategic thinking. Your responsibilities include:
- Developing comprehensive strategies and plans
- Making strategic decisions based on available information
- Identifying opportunities and risks
- Coordinating between different aspects of a project
- Providing executive-level insights and recommendations

Think strategically and consider long-term implications of decisions. Provide actionable recommendations with clear reasoning.`,
      capabilities: ['strategic_planning', 'decision_making', 'risk_assessment', 'coordination'],
      temperature: 0.3,
      maxTokens: 2000
    });

    // Technical Agent - handles technical implementation and coding tasks
    this.agents.set('technical', {
      id: 'technical',
      name: 'Technical Agent',
      role: 'Technical Implementation Specialist',
      model: process.env.TECHNICAL_MODEL || 'llama3.2:latest',
      systemPrompt: `You are a Technical Agent specialized in technical implementation and problem-solving. Your responsibilities include:
- Providing technical solutions and implementations
- Writing and reviewing code
- Troubleshooting technical issues
- Designing system architectures
- Explaining technical concepts clearly

Focus on practical, implementable solutions with proper technical justification. Provide code examples when relevant.`,
      capabilities: ['coding', 'system_design', 'troubleshooting', 'technical_analysis'],
      temperature: 0.2,
      maxTokens: 3000
    });

    // Communication Agent - manages user interaction and coordination
    this.agents.set('communication', {
      id: 'communication',
      name: 'Communication Agent',
      role: 'User Interface and Coordination Specialist',
      model: process.env.COMMUNICATION_MODEL || 'llama3.2:latest',
      systemPrompt: `You are a Communication Agent responsible for user interaction and agent coordination. Your responsibilities include:
- Facilitating clear communication with users
- Coordinating between different agents
- Synthesizing information from multiple sources
- Presenting information in user-friendly formats
- Managing conversation flow and context

Focus on clear, helpful communication and effective coordination between agents and users.`,
      capabilities: ['user_interface', 'coordination', 'synthesis', 'presentation'],
      temperature: 0.4,
      maxTokens: 2000
    });
  }

  async createConversation(userId, title = 'New Conversation') {
    const conversationId = uuidv4();
    const conversation = {
      id: conversationId,
      userId,
      title,
      messages: [],
      agents: new Set(),
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      context: new Map()
    };

    this.conversations.set(conversationId, conversation);
    return conversationId;
  }

  async sendMessage(conversationId, message, userId, targetAgent = null) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Add user message to conversation
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      userId
    };

    conversation.messages.push(userMessage);
    conversation.lastActivity = new Date().toISOString();

    // Determine which agents should respond
    const respondingAgents = targetAgent ? [targetAgent] : this.selectRespondingAgents(message);

    const responses = [];
    
    for (const agentId of respondingAgents) {
      const agent = this.agents.get(agentId);
      if (!agent) continue;

      try {
        const response = await this.generateAgentResponse(agent, conversation, message);
        
        const agentMessage = {
          id: uuidv4(),
          role: 'agent',
          agentId: agent.id,
          agentName: agent.name,
          content: response,
          timestamp: new Date().toISOString(),
          capabilities: agent.capabilities
        };

        conversation.messages.push(agentMessage);
        conversation.agents.add(agentId);
        responses.push(agentMessage);
      } catch (error) {
        console.error(`Error generating response from agent ${agentId}:`, error);
      }
    }

    return responses;
  }

  selectRespondingAgents(message) {
    const message_lower = message.toLowerCase();
    const selectedAgents = [];

    // Simple keyword-based agent selection (can be enhanced with ML)
    if (message_lower.includes('document') || message_lower.includes('research') || message_lower.includes('analyze')) {
      selectedAgents.push('research');
    }
    
    if (message_lower.includes('strategy') || message_lower.includes('plan') || message_lower.includes('decision')) {
      selectedAgents.push('strategy');
    }
    
    if (message_lower.includes('code') || message_lower.includes('technical') || message_lower.includes('implement')) {
      selectedAgents.push('technical');
    }

    // Always include communication agent for coordination
    if (!selectedAgents.includes('communication')) {
      selectedAgents.push('communication');
    }

    // If no specific agents selected, use communication agent
    return selectedAgents.length > 1 ? selectedAgents : ['communication'];
  }

  async generateAgentResponse(agent, conversation, currentMessage) {
    try {
      // Build context from conversation history
      const context = this.buildConversationContext(conversation, agent);
      
      // Create prompt for the agent
      const prompt = this.buildAgentPrompt(agent, context, currentMessage);

      // Generate response using Ollama
      const response = await axios.post(`${this.ollamaEndpoint}/api/generate`, {
        model: agent.model,
        prompt,
        stream: false,
        options: {
          temperature: agent.temperature,
          max_tokens: agent.maxTokens
        }
      });

      return response.data.response.trim();
    } catch (error) {
      console.error(`Error generating response for agent ${agent.id}:`, error);
      return `I apologize, but I'm experiencing technical difficulties. Please try again later.`;
    }
  }

  buildConversationContext(conversation, agent) {
    // Get recent messages (last 10 or last 2000 characters)
    const recentMessages = conversation.messages
      .slice(-10)
      .map(msg => {
        if (msg.role === 'user') {
          return `User: ${msg.content}`;
        } else if (msg.role === 'agent') {
          return `${msg.agentName}: ${msg.content}`;
        }
        return '';
      })
      .filter(msg => msg.length > 0)
      .join('\n\n');

    return recentMessages;
  }

  buildAgentPrompt(agent, context, currentMessage) {
    const prompt = `${agent.systemPrompt}

Conversation Context:
${context}

Current User Message: ${currentMessage}

As the ${agent.name}, provide a helpful response based on your role and capabilities. Consider the conversation context and collaborate effectively with other agents when needed.

Response:`;

    return prompt;
  }

  async initiateAgentCollaboration(conversationId, task, participatingAgents) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const collaborationId = uuidv4();
    const collaborationMessage = {
      id: collaborationId,
      role: 'system',
      content: `Multi-agent collaboration initiated for task: ${task}`,
      timestamp: new Date().toISOString(),
      collaboratingAgents: participatingAgents
    };

    conversation.messages.push(collaborationMessage);

    const responses = [];

    // Each agent provides their perspective on the task
    for (const agentId of participatingAgents) {
      const agent = this.agents.get(agentId);
      if (!agent) continue;

      const collaborationPrompt = `${agent.systemPrompt}

You are participating in a multi-agent collaboration for the following task:
${task}

Other participating agents: ${participatingAgents.filter(id => id !== agentId).map(id => this.agents.get(id)?.name).join(', ')}

Provide your perspective and contribution to this collaborative task, considering how your expertise complements the other agents.

Your contribution:`;

      try {
        const response = await axios.post(`${this.ollamaEndpoint}/api/generate`, {
          model: agent.model,
          prompt: collaborationPrompt,
          stream: false,
          options: {
            temperature: agent.temperature,
            max_tokens: agent.maxTokens
          }
        });

        const agentMessage = {
          id: uuidv4(),
          role: 'agent',
          agentId: agent.id,
          agentName: agent.name,
          content: response.data.response.trim(),
          timestamp: new Date().toISOString(),
          collaborationId,
          capabilities: agent.capabilities
        };

        conversation.messages.push(agentMessage);
        responses.push(agentMessage);
      } catch (error) {
        console.error(`Error in collaboration from agent ${agentId}:`, error);
      }
    }

    return {
      collaborationId,
      task,
      responses
    };
  }

  getConversation(conversationId) {
    return this.conversations.get(conversationId);
  }

  getUserConversations(userId) {
    return Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId)
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
  }

  getAvailableAgents() {
    return Array.from(this.agents.values()).map(agent => ({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      capabilities: agent.capabilities
    }));
  }

  addCustomAgent(agentConfig) {
    const agentId = agentConfig.id || uuidv4();
    this.agents.set(agentId, {
      id: agentId,
      name: agentConfig.name,
      role: agentConfig.role,
      model: agentConfig.model || 'llama3.2:latest',
      systemPrompt: agentConfig.systemPrompt,
      capabilities: agentConfig.capabilities || [],
      temperature: agentConfig.temperature || 0.3,
      maxTokens: agentConfig.maxTokens || 2000
    });

    return agentId;
  }

  // New method for processing user messages with multiple agents
  async processMessage(message, agentId = 'communication', conversationId = null) {
    try {
      // Create or get conversation
      let conversation;
      if (conversationId && this.conversations.has(conversationId)) {
        conversation = this.conversations.get(conversationId);
      } else {
        const newConversationId = uuidv4();
        conversation = {
          id: newConversationId,
          userId: 'default',
          title: 'Agent Conversation',
          messages: [],
          agents: new Set(),
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          context: new Map()
        };
        this.conversations.set(newConversationId, conversation);
      }

      // Get the target agent
      const agent = this.agents.get(agentId);
      if (!agent) {
        return {
          response: `Agent ${agentId} not found. Available agents: ${Array.from(this.agents.keys()).join(', ')}`,
          agentId,
          conversationId: conversation.id
        };
      }

      // Generate response
      const response = await this.generateAgentResponse(agent, conversation, message);
      
      // Add messages to conversation
      const userMessage = {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };

      const agentMessage = {
        id: uuidv4(),
        role: 'agent',
        agentId: agent.id,
        agentName: agent.name,
        content: response,
        timestamp: new Date().toISOString(),
        capabilities: agent.capabilities
      };

      conversation.messages.push(userMessage, agentMessage);
      conversation.lastActivity = new Date().toISOString();
      conversation.agents.add(agentId);

      return {
        response,
        agentId,
        agentName: agent.name,
        conversationId: conversation.id,
        capabilities: agent.capabilities,
        confidence: 0.85
      };

    } catch (error) {
      console.error('Error processing message:', error);
      return {
        response: 'I apologize, but I encountered an error processing your message. Please try again.',
        agentId,
        conversationId: conversationId || 'error',
        error: error.message
      };
    }
  }

  // Enhanced conversation starter that returns proper response format
  async startConversation(topic, participants = ['research', 'strategy']) {
    try {
      const conversationId = uuidv4();
      const conversation = {
        id: conversationId,
        userId: 'default',
        title: topic,
        messages: [],
        agents: new Set(),
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        context: new Map()
      };

      this.conversations.set(conversationId, conversation);

      const responses = [];

      // Each agent provides their initial perspective
      for (const agentId of participants) {
        const agent = this.agents.get(agentId);
        if (!agent) continue;

        const initialPrompt = `${agent.systemPrompt}

You are starting a new collaborative conversation about: "${topic}"

Other participating agents: ${participants.filter(id => id !== agentId).map(id => this.agents.get(id)?.name).join(', ')}

Provide a brief introduction of how you would approach this topic from your expertise area. Keep it concise but informative.

Your introduction:`;

        try {
          const response = await axios.post(`${this.ollamaEndpoint}/api/generate`, {
            model: agent.model,
            prompt: initialPrompt,
            stream: false,
            options: {
              temperature: agent.temperature,
              max_tokens: 300 // Shorter responses for introductions
            }
          });

          const agentMessage = {
            id: uuidv4(),
            role: 'agent',
            agentId: agent.id,
            agentName: agent.name,
            content: response.data.response.trim(),
            timestamp: new Date().toISOString(),
            capabilities: agent.capabilities
          };

          conversation.messages.push(agentMessage);
          conversation.agents.add(agentId);
          responses.push(agentMessage);

        } catch (error) {
          console.error(`Error getting initial response from agent ${agentId}:`, error);
        }
      }

      conversation.lastActivity = new Date().toISOString();

      return {
        conversationId,
        topic,
        participants,
        responses,
        message: `Started conversation with ${participants.length} agents`
      };

    } catch (error) {
      console.error('Error starting conversation:', error);
      throw error;
    }
  }

  // Enhanced Ollama-powered methods for deeper integration
  async processGraphRAGQuery(question, perspective = 'technical') {
    try {
      const contextPrompt = `You are an expert DMSMS (Diminishing Manufacturing Sources & Material Shortages) analyst with access to a comprehensive knowledge graph. 

Question: ${question}
Perspective: ${perspective}

Provide a detailed response that includes:
1. Direct answer to the question
2. Related concepts and connections from the DMSMS knowledge graph
3. Practical recommendations
4. Risk assessment if applicable
5. References to relevant standards or best practices

Focus on actionable insights and technical accuracy. Include specific component examples when relevant.

Response:`;

      const response = await axios.post(`${this.ollamaEndpoint}/api/generate`, {
        model: 'llama3.2:latest',
        prompt: contextPrompt,
        stream: false,
        options: {
          temperature: 0.2,
          max_tokens: 1500
        }
      });

      // Simulate knowledge graph connections
      const relatedNodes = this.generateRelatedGraphNodes(question);

      return {
        answer: response.data.response.trim(),
        perspective,
        confidence: 0.85,
        relatedNodes,
        sources: ['DMSMS Knowledge Base', 'Component Lifecycle Data', 'Industry Standards'],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('GraphRAG query processing error:', error);
      return {
        answer: 'I apologize, but I encountered an error processing your GraphRAG query. Please try again.',
        perspective,
        confidence: 0,
        relatedNodes: [],
        sources: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  async generateKnowledgeGraph(topic, content = '') {
    try {
      const graphPrompt = `Generate a knowledge graph for the topic: "${topic}"

${content ? `Additional context: ${content}` : ''}

Create a comprehensive knowledge graph for DMSMS (Diminishing Manufacturing Sources & Material Shortages) analysis. 

Return a JSON structure with:
- nodes: Array of nodes with id, label, type, color, size, description
- links: Array of connections with source, target, strength
- metadata: Graph information

Focus on DMSMS concepts like:
- Risk Assessment
- Supply Chain Analysis  
- Component Lifecycle
- Obsolescence Management
- Mitigation Strategies
- Market Intelligence
- Quality Assurance
- Cost Analysis
- Vendor Management
- Regulatory Compliance

Make the graph comprehensive and interconnected. Use colors: #ff6b6b (critical), #4ecdc4 (process), #45b7d1 (data), #96ceb4 (strategy), #feca57 (warning).

Return only valid JSON:`;

      const response = await axios.post(`${this.ollamaEndpoint}/api/generate`, {
        model: 'llama3.2:latest',
        prompt: graphPrompt,
        stream: false,
        options: {
          temperature: 0.3,
          max_tokens: 2000
        }
      });

      // Try to parse the response as JSON, fallback to default structure
      let graphData;
      try {
        graphData = JSON.parse(response.data.response.trim());
      } catch (parseError) {
        console.warn('Failed to parse generated graph JSON, using fallback');
        graphData = this.generateFallbackGraph(topic);
      }

      // Validate and enhance the graph structure
      graphData = this.validateAndEnhanceGraph(graphData, topic);

      return graphData;
    } catch (error) {
      console.error('Knowledge graph generation error:', error);
      return this.generateFallbackGraph(topic);
    }
  }

  async analyzeDocument(content, analysisType = 'comprehensive') {
    try {
      const analysisPrompt = `Analyze the following document with focus on DMSMS (Diminishing Manufacturing Sources & Material Shortages) aspects:

Document Content:
${content.substring(0, 3000)}${content.length > 3000 ? '...' : ''}

Analysis Type: ${analysisType}

Provide a ${analysisType} analysis including:
1. Key DMSMS risks identified
2. Component obsolescence concerns
3. Supply chain vulnerabilities  
4. Recommended mitigation strategies
5. Risk severity assessment (High/Medium/Low)
6. Timeline considerations
7. Cost impact estimates
8. Regulatory compliance notes

Format the response as structured insights with clear recommendations.

Analysis:`;

      const response = await axios.post(`${this.ollamaEndpoint}/api/generate`, {
        model: 'llama3.2:latest',
        prompt: analysisPrompt,
        stream: false,
        options: {
          temperature: 0.1,
          max_tokens: 2000
        }
      });

      return {
        analysis: response.data.response.trim(),
        analysisType,
        documentLength: content.length,
        riskLevel: this.extractRiskLevel(response.data.response),
        keyFindings: this.extractKeyFindings(response.data.response),
        recommendations: this.extractRecommendations(response.data.response),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Document analysis error:', error);
      return {
        analysis: 'Document analysis encountered an error. Please try again.',
        analysisType,
        documentLength: content.length,
        riskLevel: 'Unknown',
        keyFindings: [],
        recommendations: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  generateRelatedGraphNodes(question) {
    // Generate contextually relevant nodes based on question keywords
    const keywords = question.toLowerCase();
    const allNodes = [
      { id: 'risk_assessment', label: 'Risk Assessment', type: 'process', relevance: 0.9 },
      { id: 'supply_chain', label: 'Supply Chain Analysis', type: 'analysis', relevance: 0.8 },
      { id: 'component_lifecycle', label: 'Component Lifecycle', type: 'management', relevance: 0.85 },
      { id: 'obsolescence', label: 'Obsolescence Management', type: 'strategy', relevance: 0.9 },
      { id: 'vendor_mgmt', label: 'Vendor Management', type: 'process', relevance: 0.7 },
      { id: 'cost_analysis', label: 'Cost Analysis', type: 'financial', relevance: 0.75 },
      { id: 'compliance', label: 'Regulatory Compliance', type: 'legal', relevance: 0.6 },
      { id: 'mitigation', label: 'Mitigation Strategies', type: 'strategy', relevance: 0.8 }
    ];

    // Filter based on relevance to question
    const relevantNodes = allNodes.filter(node => {
      const nodeKeywords = node.label.toLowerCase();
      return keywords.includes('risk') && nodeKeywords.includes('risk') ||
             keywords.includes('supply') && nodeKeywords.includes('supply') ||
             keywords.includes('component') && nodeKeywords.includes('component') ||
             keywords.includes('cost') && nodeKeywords.includes('cost') ||
             keywords.includes('vendor') && nodeKeywords.includes('vendor') ||
             node.relevance > 0.7;
    }).slice(0, 5);

    return relevantNodes;
  }

  generateFallbackGraph(topic) {
    return {
      nodes: [
        { id: 'root', label: topic, type: 'root', color: '#ff6b6b', size: 25, description: `Central concept for ${topic}` },
        { id: 'risk', label: 'Risk Assessment', type: 'process', color: '#4ecdc4', size: 20, description: 'Systematic risk evaluation' },
        { id: 'supply', label: 'Supply Chain', type: 'analysis', color: '#45b7d1', size: 18, description: 'Supply chain management' },
        { id: 'lifecycle', label: 'Component Lifecycle', type: 'management', color: '#96ceb4', size: 16, description: 'Lifecycle tracking' },
        { id: 'obsolescence', label: 'Obsolescence', type: 'concern', color: '#feca57', size: 15, description: 'Obsolescence management' }
      ],
      links: [
        { source: 'root', target: 'risk', strength: 1.0 },
        { source: 'root', target: 'supply', strength: 0.9 },
        { source: 'root', target: 'lifecycle', strength: 0.8 },
        { source: 'risk', target: 'obsolescence', strength: 0.7 }
      ],
      metadata: {
        topic,
        nodeCount: 5,
        generatedAt: new Date().toISOString(),
        source: 'fallback'
      }
    };
  }

  validateAndEnhanceGraph(graphData, topic) {
    // Ensure required structure
    if (!graphData.nodes) graphData.nodes = [];
    if (!graphData.links) graphData.links = [];
    if (!graphData.metadata) graphData.metadata = {};

    // Add metadata
    graphData.metadata.topic = topic;
    graphData.metadata.nodeCount = graphData.nodes.length;
    graphData.metadata.generatedAt = new Date().toISOString();

    // Validate nodes have required fields
    graphData.nodes = graphData.nodes.map(node => ({
      id: node.id || `node_${Math.random().toString(36).substr(2, 9)}`,
      label: node.label || 'Unknown',
      type: node.type || 'concept',
      color: node.color || '#45b7d1',
      size: node.size || 15,
      description: node.description || `${node.label} concept`
    }));

    return graphData;
  }

  extractRiskLevel(analysisText) {
    const text = analysisText.toLowerCase();
    if (text.includes('high risk') || text.includes('critical')) return 'High';
    if (text.includes('medium risk') || text.includes('moderate')) return 'Medium';
    if (text.includes('low risk') || text.includes('minimal')) return 'Low';
    return 'Medium'; // default
  }

  extractKeyFindings(analysisText) {
    // Simple extraction of key points
    const lines = analysisText.split('\n');
    return lines
      .filter(line => line.includes('identified') || line.includes('concern') || line.includes('risk'))
      .slice(0, 3)
      .map(line => line.trim());
  }

  extractRecommendations(analysisText) {
    // Simple extraction of recommendations
    const lines = analysisText.split('\n');
    return lines
      .filter(line => line.includes('recommend') || line.includes('suggest') || line.includes('should'))
      .slice(0, 3)
      .map(line => line.trim());
  }
}

module.exports = MultiAgentService;
