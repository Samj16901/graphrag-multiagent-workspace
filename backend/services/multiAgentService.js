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

  isHealthy() {
    return this.isInitialized;
  }
}

module.exports = MultiAgentService;
