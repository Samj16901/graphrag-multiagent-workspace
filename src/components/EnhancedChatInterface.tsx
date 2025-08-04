'use client'

import { useState, useRef, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

interface Message {
  id: string
  type: 'user' | 'agent'
  agentId?: string
  agentName?: string
  content: string
  timestamp: Date
  capabilities?: string[]
  confidence?: number
}

interface Agent {
  id: string
  name: string
  role: string
  capabilities: string[]
  model?: string
  status?: 'active' | 'idle' | 'error'
}

interface AgentResponse {
  id: string
  agentId: string
  agentName: string
  content: string
  timestamp: string
  capabilities: string[]
}

export default function EnhancedChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      agentId: 'communication',
      agentName: 'Communication Agent',
      content: "Hello! I'm coordinating our multi-agent DMSMS analysis team. We have Research, Strategy, Technical, and Communication agents ready to assist. How can we help you today?",
      timestamp: new Date(),
      capabilities: ['coordination', 'synthesis']
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['communication'])
  const [collaborationMode, setCollaborationMode] = useState(false)
  const [ollamaStatus, setOllamaStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load available agents and check Ollama status
  useEffect(() => {
    loadAgents()
    checkOllamaStatus()
    const interval = setInterval(checkOllamaStatus, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadAgents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/agents`)
      if (response.ok) {
        const agentData = await response.json()
        setAgents(agentData.map((agent: Agent) => ({ ...agent, status: 'active' as const })))
      }
    } catch (error) {
      console.error('Failed to load agents:', error)
    }
  }

  const checkOllamaStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/health`)
      if (response.ok) {
        const health = await response.json()
        setOllamaStatus(health.services.ollama === 'connected' ? 'connected' : 'disconnected')
      } else {
        setOllamaStatus('disconnected')
      }
    } catch {
      setOllamaStatus('disconnected')
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      if (collaborationMode && selectedAgents.length > 1) {
        // Multi-agent collaboration
        const response = await fetch(`${API_URL}/api/agents/conversation/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            topic: userMessage.content, 
            participants: selectedAgents 
          })
        })

        if (response.ok) {
          const data = await response.json()
          
          // Add agent responses
          if (data.responses) {
            const agentMessages = data.responses.map((resp: AgentResponse) => ({
              id: resp.id,
              type: 'agent' as const,
              agentId: resp.agentId,
              agentName: resp.agentName,
              content: resp.content,
              timestamp: new Date(resp.timestamp),
              capabilities: resp.capabilities,
              confidence: 0.85
            }))
            setMessages(prev => [...prev, ...agentMessages])
          }
        }
      } else {
        // Single agent response
        const targetAgent = selectedAgents[0] || 'communication'
        const response = await fetch(`${API_URL}/api/agents/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: userMessage.content, 
            agentId: targetAgent 
          })
        })

        if (response.ok) {
          const data = await response.json()
          const agent = agents.find(a => a.id === targetAgent)
          
          const agentMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'agent',
            agentId: targetAgent,
            agentName: agent?.name || 'Agent',
            content: data.response || 'I apologize, but I encountered an issue processing your request.',
            timestamp: new Date(),
            capabilities: agent?.capabilities || [],
            confidence: data.confidence || 0.8
          }

          setMessages(prev => [...prev, agentMessage])

          // If there are related nodes, dispatch event to update knowledge graph
          if (data.relatedNodes && data.relatedNodes.length > 0) {
            window.dispatchEvent(new CustomEvent('highlightGraphNodes', { 
              detail: { nodes: data.relatedNodes, query: userMessage.content }
            }))
          }
        }
      }
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        agentId: 'system',
        agentName: 'System',
        content: 'Sorry, I encountered an error processing your request. Please check the Ollama connection and try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      console.error('Chat error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev => {
      if (prev.includes(agentId)) {
        return prev.filter(id => id !== agentId)
      } else {
        return [...prev, agentId]
      }
    })
  }

  const getAgentStatusIcon = (status?: string) => {
    switch (status) {
      case 'active': return '🟢'
      case 'idle': return '🟡'
      case 'error': return '🔴'
      default: return '⚪'
    }
  }

  const getOllamaStatusColor = () => {
    switch (ollamaStatus) {
      case 'connected': return 'text-green-400'
      case 'disconnected': return 'text-red-400'
      case 'checking': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Status */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl font-bold text-white">🤖 Enhanced Multi-Agent Chat</h3>
          <div className={`text-sm ${getOllamaStatusColor()}`}>
            Ollama: {ollamaStatus === 'connected' ? '✅ Connected' : 
                     ollamaStatus === 'disconnected' ? '❌ Disconnected' : 
                     '🔄 Checking...'}
          </div>
        </div>
        <p className="text-gray-300 text-sm">
          Collaborate with specialized DMSMS agents powered by Ollama
        </p>
      </div>

      {/* Agent Selection */}
      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium text-sm">Active Agents:</span>
          <button
            onClick={() => setCollaborationMode(!collaborationMode)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              collaborationMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            {collaborationMode ? 'Collaboration Mode' : 'Single Agent Mode'}
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => toggleAgent(agent.id)}
              className={`text-xs px-3 py-2 rounded-full transition-colors flex items-center gap-1 ${
                selectedAgents.includes(agent.id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {getAgentStatusIcon(agent.status)}
              {agent.name}
            </button>
          ))}
        </div>
        
        {selectedAgents.length > 0 && (
          <div className="mt-2 text-xs text-gray-400">
            Selected: {selectedAgents.map(id => agents.find(a => a.id === id)?.name).join(', ')}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-[300px] max-h-[400px]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
              {message.type === 'agent' && (
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <span className="font-medium text-blue-300">{message.agentName}</span>
                  {message.capabilities && (
                    <span className="text-gray-400">
                      • {message.capabilities.slice(0, 2).join(', ')}
                    </span>
                  )}
                  {message.confidence && (
                    <span className="text-green-400">
                      • {Math.round(message.confidence * 100)}% confident
                    </span>
                  )}
                </div>
              )}
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-100 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>
                  {collaborationMode ? 'Agents collaborating...' : 'Agent thinking...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask about DMSMS, obsolescence, costs, risks... ${
            collaborationMode ? '(Multi-agent mode)' : '(Single agent mode)'
          }`}
          className="flex-1 p-3 bg-gray-700 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          disabled={isLoading || ollamaStatus === 'disconnected'}
        />
        <button
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading || ollamaStatus === 'disconnected'}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '⏳' : '🚀'}
        </button>
      </div>

      {ollamaStatus === 'disconnected' && (
        <div className="mt-2 p-2 bg-red-900 text-red-200 rounded text-sm">
          ⚠️ Ollama is disconnected. Please ensure Ollama is running on localhost:11434
        </div>
      )}
    </div>
  )
}
