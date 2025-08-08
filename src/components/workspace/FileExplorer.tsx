'use client'

import { useEffect, useState } from 'react'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'dir'
  children?: FileNode[]
}

interface FileExplorerProps {
  onFileSelect?: (path: string) => void
}

export default function FileExplorer({ onFileSelect }: FileExplorerProps) {
  const [tree, setTree] = useState<FileNode[]>([])
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/files/tree')
      .then((r) => r.json())
      .then((data) => setTree(data || []))
      .catch((e) => console.error('Failed to load tree', e))
  }, [])

  const toggleDirectory = (path: string) => {
    const newExpanded = new Set(expandedDirs)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedDirs(newExpanded)
  }

  const handleFileClick = (node: FileNode) => {
    if (node.type === 'file') {
      onFileSelect?.(node.path)
    } else {
      toggleDirectory(node.path)
    }
  }

  const renderNode = (node: FileNode, depth = 0) => {
    const isExpanded = expandedDirs.has(node.path)
    const paddingLeft = depth * 16

    return (
      <div key={node.path}>
        <div
          className="flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer text-sm"
          style={{ paddingLeft: paddingLeft + 8 }}
          onClick={() => handleFileClick(node)}
        >
          {node.type === 'dir' && (
            <span className="w-4 text-center mr-1">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          {node.type === 'file' && (
            <span className="w-4 text-center mr-1 text-gray-400">
              📄
            </span>
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {node.type === 'dir' && isExpanded && node.children?.map(child => 
          renderNode(child, depth + 1)
        )}
      </div>
    )
  }

  return (
    <div className="text-sm overflow-auto">
      {tree.map(node => renderNode(node))}
    </div>
  )
}
