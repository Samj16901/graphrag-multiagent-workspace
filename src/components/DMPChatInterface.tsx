'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function DMPChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your DMP Intelligence assistant. I can help you analyze DMSMS data, explore the knowledge graph, and answer questions about obsolescence management.',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
      // Simulate API call to DMP Intelligence backend
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Generate contextual response based on input
      const response = generateDMPResponse(input.trim())
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      console.error('Chat error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const generateDMPResponse = (userInput: string): string => {
    const input = userInput.toLowerCase()
    
    if (input.includes('graph') || input.includes('node') || input.includes('connection')) {
      return 'The knowledge graph shows key DMSMS relationships. Try dragging nodes to explore connections, or hover over them for detailed information. The current graph displays 6 core components with 9 interconnections.'
    }
    
    if (input.includes('obsolete') || input.includes('eol') || input.includes('end of life')) {
      return 'Obsolescence management is critical for DMSMS. Our system tracks End-of-Life (EOL) notices, identifies at-risk components, and recommends mitigation strategies including redesign, lifetime buys, or alternative sourcing.'
    }
    
    if (input.includes('cost') || input.includes('budget') || input.includes('price')) {
      return 'Cost analysis considers multiple factors: current component prices, projected future costs, redesign expenses, and opportunity costs. Our framework helps optimize total cost of ownership over the system lifecycle.'
    }
    
    if (input.includes('risk') || input.includes('assessment') || input.includes('analysis')) {
      return 'Risk assessment evaluates supply chain vulnerabilities, technical risks, and business impact. We use a multi-criteria approach considering probability, impact, and time horizon to prioritize mitigation efforts.'
    }
    
    if (input.includes('supplier') || input.includes('vendor') || input.includes('source')) {
      return 'Supplier management involves monitoring OEM health, diversifying supply sources, and maintaining alternative supplier relationships. Our system tracks supplier viability and recommends sourcing strategies.'
    }
    
    if (input.includes('help') || input.includes('what') || input.includes('how')) {
      return 'I can help with DMSMS analysis, component obsolescence tracking, cost optimization, risk assessment, and supplier management. Try asking about specific components, mitigation strategies, or graph exploration.'
    }
    
    // Default response
    return `Based on your query about "${userInput}", I recommend exploring the knowledge graph for related DMSMS concepts. You can also ask me about specific obsolescence scenarios, cost analysis, or risk mitigation strategies.`
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-white mb-2">
          💬 DMP Assistant
        </h3>
        <p className="text-gray-300 text-sm">
          Ask about DMSMS analysis, obsolescence management, or explore the knowledge graph
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-[400px] max-h-[500px]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-100'
              }`}
            >
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
                <span>Analyzing...</span>
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
          onKeyPress={handleKeyPress}
          placeholder="Ask about DMSMS, obsolescence, costs, risks..."
          className="flex-1 p-3 bg-gray-700 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  )
}
