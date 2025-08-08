import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

function isValidPath(filePath: string): boolean {
  // Normalize path and check for path traversal
  const normalizedPath = path.normalize(filePath)
  return !normalizedPath.includes('..') && !path.isAbsolute(normalizedPath)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json({ error: 'Path parameter is required' }, { status: 400 })
    }

    if (!isValidPath(filePath)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    const fullPath = path.join(process.cwd(), filePath)
    
    try {
      const content = await fs.readFile(fullPath, 'utf8')
      return NextResponse.json({ content, path: filePath })
    } catch (readError) {
      if ((readError as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
      throw readError
    }
  } catch (error) {
    console.error('Error in /api/files/get:', error)
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 })
  }
}