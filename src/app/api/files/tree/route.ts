import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'dir'
  children?: FileNode[]
}

async function buildFileTree(dirPath: string, relativePath: string = ''): Promise<FileNode[]> {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true })
    const nodes: FileNode[] = []

    for (const item of items) {
      // Skip hidden files and node_modules
      if (item.name.startsWith('.') || item.name === 'node_modules') {
        continue
      }

      const itemPath = path.join(dirPath, item.name)
      const nodeRelativePath = path.join(relativePath, item.name)

      if (item.isDirectory()) {
        const children = await buildFileTree(itemPath, nodeRelativePath)
        nodes.push({
          name: item.name,
          path: nodeRelativePath,
          type: 'dir',
          children
        })
      } else {
        nodes.push({
          name: item.name,
          path: nodeRelativePath,
          type: 'file'
        })
      }
    }

    return nodes.sort((a, b) => {
      // Directories first, then files, alphabetically
      if (a.type !== b.type) {
        return a.type === 'dir' ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  } catch (error) {
    console.error('Error building file tree:', error)
    return []
  }
}

export async function GET() {
  try {
    const rootPath = process.cwd()
    const tree = await buildFileTree(rootPath)
    return NextResponse.json(tree)
  } catch (error) {
    console.error('Error in /api/files/tree:', error)
    return NextResponse.json({ error: 'Failed to read file tree' }, { status: 500 })
  }
}