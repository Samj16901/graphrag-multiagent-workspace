import { NextRequest, NextResponse } from 'next/server'

// Mock agent service - in real implementation this would call an AI service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { path, content, instruction } = body

    if (!path || !content || !instruction) {
      return NextResponse.json({ 
        error: 'Path, content, and instruction are required' 
      }, { status: 400 })
    }

    // Mock AI response - replace with actual AI service call
    const mockResponse = generateMockPatch(content, instruction)

    return NextResponse.json({
      type: 'file',
      payload: mockResponse,
      instruction,
      path
    })
  } catch (error) {
    console.error('Error in /api/agent/patch:', error)
    return NextResponse.json({ error: 'Failed to generate patch' }, { status: 500 })
  }
}

function generateMockPatch(content: string, instruction: string): string {
  // Simple mock - in real implementation, this would call an AI service
  const lines = content.split('\n')
  
  if (instruction.toLowerCase().includes('add') && instruction.toLowerCase().includes('header')) {
    return `# AI Generated Header\n\n${content}`
  }
  
  if (instruction.toLowerCase().includes('comment')) {
    return lines.map(line => {
      if (line.trim() && !line.startsWith('#') && !line.startsWith('//')) {
        return `${line} // AI comment: ${instruction}`
      }
      return line
    }).join('\n')
  }
  
  if (instruction.toLowerCase().includes('improve') || instruction.toLowerCase().includes('enhance')) {
    const enhanced = lines.map((line, index) => {
      if (index === 0 && !line.startsWith('#')) {
        return `# Enhanced Content\n\n${line}`
      }
      return line
    }).join('\n')
    
    return enhanced + '\n\n---\n*Content enhanced by AI assistant*'
  }
  
  // Default: just add a comment at the end
  return content + '\n\n<!-- AI modification: ' + instruction + ' -->'
}