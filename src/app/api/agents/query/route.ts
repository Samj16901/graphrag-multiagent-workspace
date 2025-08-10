import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, agentId = 'research', conversationId } = body

    if (!message) {
      return NextResponse.json({ 
        error: 'Message is required' 
      }, { status: 400 })
    }

    // Forward request to backend API (Node.js server on port 3001)
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/api/agents/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, agentId, conversationId }),
    })

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`)
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Agent query API error:', error)
    
    // Fallback mock response for development
    const { message, agentId = 'research', conversationId } = await request.json().catch(() => ({}))
    return NextResponse.json({
      response: `Mock response to: "${message || 'unknown message'}". Backend connection failed.`,
      agentId: agentId || 'research',
      timestamp: new Date().toISOString(),
      conversationId: conversationId || 'mock-conversation'
    })
  }
}
