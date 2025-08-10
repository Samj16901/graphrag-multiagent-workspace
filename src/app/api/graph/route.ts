import { NextRequest, NextResponse } from 'next/server'

// API route to proxy graph data from backend
export async function GET() {
  try {
    // Forward request to backend API (Node.js proxy on port 3001)
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/api/graph`)
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`)
    }
    
    const graphData = await response.json()
    
    return NextResponse.json(graphData)
  } catch (error) {
    console.error('Graph API error:', error)
    
    // Return fallback mock data for development
    const mockData = {
      nodes: [
        { id: 'dmsms_core', x: 0, y: 0, z: 0, color: '#4ecdc4' },
        { id: 'risk_assessment', x: 10, y: 5, z: 2, color: '#feca57' },
        { id: 'supply_chain', x: -8, y: 8, z: -3, color: '#fd79a8' },
        { id: 'obsolescence', x: 12, y: -6, z: 4, color: '#ff7675' },
        { id: 'mitigation', x: -10, y: -4, z: 1, color: '#74b9ff' }
      ],
      links: [
        { source: 'dmsms_core', target: 'risk_assessment' },
        { source: 'dmsms_core', target: 'supply_chain' },
        { source: 'dmsms_core', target: 'obsolescence' },
        { source: 'risk_assessment', target: 'mitigation' },
        { source: 'supply_chain', target: 'mitigation' }
      ]
    }
    
    return NextResponse.json(mockData)
  }
}

// Support POST for querying specific nodes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/api/graph/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`)
    }
    
    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Graph query API error:', error)
    return NextResponse.json({ error: 'Failed to query graph' }, { status: 500 })
  }
}