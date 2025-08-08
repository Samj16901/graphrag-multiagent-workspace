import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

function isValidPath(filePath: string): boolean {
  // Normalize path and check for path traversal
  const normalizedPath = path.normalize(filePath)
  return !normalizedPath.includes('..') && !path.isAbsolute(normalizedPath)
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { path: filePath, content } = body

    if (!filePath || typeof content !== 'string') {
      return NextResponse.json({ 
        error: 'Path and content are required' 
      }, { status: 400 })
    }

    if (!isValidPath(filePath)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    const fullPath = path.join(process.cwd(), filePath)
    const directory = path.dirname(fullPath)

    // Ensure directory exists
    await fs.mkdir(directory, { recursive: true })

    // Normalize line endings and write file
    const normalizedContent = content.replace(/\r\n/g, '\n')
    await fs.writeFile(fullPath, normalizedContent, 'utf8')

    return NextResponse.json({ 
      success: true, 
      path: filePath,
      message: 'File saved successfully' 
    })
  } catch (error) {
    console.error('Error in /api/files/put:', error)
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 })
  }
}