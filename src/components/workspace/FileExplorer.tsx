'use client'

import { useEffect, useState } from 'react'

interface FileNode {
  name: string
  path: string
  type: 'file' | 'dir'
  children?: FileNode[]
}

export default function FileExplorer() {
  const [tree, setTree] = useState<FileNode[]>([])

  useEffect(() => {
    fetch('/api/files/tree')
      .then((r) => r.json())
      .then((data) => setTree(data || []))
      .catch((e) => console.error('Failed to load tree', e))
  }, [])

  const renderNode = (node: FileNode) => (
    <div key={node.path} className="ml-2">
      <div>{node.name}</div>
      {node.type === 'dir' && node.children?.map(renderNode)}
    </div>
  )

  return <div className="text-sm">{tree.map(renderNode)}</div>
}
