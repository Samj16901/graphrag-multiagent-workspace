'use client'

import { useEffect, useState, useCallback } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

import FileExplorer from '@/components/workspace/FileExplorer'
import MarkdownEditor from '@/components/workspace/MarkdownEditor'
import CodeEditor from '@/components/workspace/CodeEditor'
import EditorTabs from '@/components/workspace/EditorTabs'
import CommandBar from '@/components/workspace/CommandBar'
import { WorkspaceProvider, useWorkspace } from '@/workspace/WorkspaceCtx'

function WorkspaceContent() {
  const {
    openFiles,
    activeTab,
    dirtyFlags,
    setOpenFiles,
    setActiveTab,
    setDirtyFlag
  } = useWorkspace()
  
  const [fileContents, setFileContents] = useState<Record<string, string>>({})
  const [commandBarOpen, setCommandBarOpen] = useState(false)

  // Load file content
  const loadFile = useCallback(async (path: string) => {
    if (fileContents[path]) return

    try {
      const response = await fetch(`/api/files/get?path=${encodeURIComponent(path)}`)
      const data = await response.json()
      
      if (response.ok) {
        setFileContents(prev => ({ ...prev, [path]: data.content }))
      }
    } catch (error) {
      console.error('Failed to load file:', error)
    }
  }, [fileContents])

  // Save file content
  const saveFile = useCallback(async (path: string) => {
    const content = fileContents[path]
    if (!content) return

    try {
      const response = await fetch('/api/files/put', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, content })
      })

      if (response.ok) {
        setDirtyFlag(path, false)
      }
    } catch (error) {
      console.error('Failed to save file:', error)
    }
  }, [fileContents, setDirtyFlag])

  // Handle file selection from explorer
  const handleFileSelect = (path: string) => {
    if (!openFiles.includes(path)) {
      setOpenFiles([...openFiles, path])
    }
    setActiveTab(path)
    loadFile(path)
  }

  // Handle content changes
  const handleContentChange = (path: string, content: string) => {
    setFileContents(prev => ({ ...prev, [path]: content }))
    setDirtyFlag(path, true)
  }

  // Handle tab operations
  const handleTabClose = (path: string) => {
    const newOpenFiles = openFiles.filter(f => f !== path)
    setOpenFiles(newOpenFiles)
    
    if (activeTab === path) {
      setActiveTab(newOpenFiles.length > 0 ? newOpenFiles[0] : null)
    }
  }

  const handleNewFile = () => {
    const name = prompt('File name:')
    if (name) {
      const path = name.startsWith('/') ? name : `/${name}`
      setFileContents(prev => ({ ...prev, [path]: '' }))
      handleFileSelect(path)
    }
  }

  // Handle commands
  const handleCommand = async (command: string) => {
    switch (command) {
      case 'new-file':
        handleNewFile()
        break
      case 'save':
        if (activeTab) await saveFile(activeTab)
        break
      case 'save-all':
        for (const file of openFiles) {
          if (dirtyFlags[file]) {
            await saveFile(file)
          }
        }
        break
      case 'commit':
        const message = prompt('Commit message:')
        if (message) {
          try {
            const response = await fetch('/api/git/commit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message })
            })
            const result = await response.json()
            alert(response.ok ? `Committed: ${result.sha}` : result.error)
          } catch (error) {
            console.error('Commit failed:', error)
          }
        }
        break
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        setCommandBarOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const currentContent = activeTab ? fileContents[activeTab] || '' : ''
  const isMarkdown = activeTab?.endsWith('.md') || false

  const tabs = openFiles.map(path => ({
    id: path,
    title: path.split('/').pop() || path,
    dirty: dirtyFlags[path] || false
  }))

  return (
    <div className="h-screen flex flex-col">
      {/* Header with tabs */}
      <div className="border-b">
        <EditorTabs
          tabs={tabs}
          activeTab={activeTab || ''}
          onSelect={setActiveTab}
          onClose={handleTabClose}
          onNew={handleNewFile}
          onSave={saveFile}
        />
      </div>

      {/* Main workspace */}
      <div className="flex-1">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={20} minSize={15}>
            <div className="h-full border-r">
              <div className="p-2 border-b bg-gray-50">
                <h3 className="font-semibold text-sm">Explorer</h3>
              </div>
              <FileExplorer onFileSelect={handleFileSelect} />
            </div>
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-gray-300" />
          
          <Panel defaultSize={60}>
            <div className="h-full">
              {activeTab ? (
                isMarkdown ? (
                  <MarkdownEditor
                    value={currentContent}
                    path={activeTab}
                    onChange={(content) => handleContentChange(activeTab, content)}
                  />
                ) : (
                  <CodeEditor
                    value={currentContent}
                    language={getLanguageFromPath(activeTab)}
                    onChange={(content) => content && handleContentChange(activeTab, content)}
                  />
                )
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Select a file to start editing
                </div>
              )}
            </div>
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-gray-300" />
          
          <Panel defaultSize={20} minSize={15}>
            <div className="h-full border-l">
              <div className="p-2 border-b bg-gray-50">
                <h3 className="font-semibold text-sm">Preview / Chat</h3>
              </div>
              <div className="p-4 text-sm text-gray-600">
                Preview and chat functionality coming soon...
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* Command Bar */}
      <CommandBar
        isOpen={commandBarOpen}
        onClose={() => setCommandBarOpen(false)}
        onCommand={handleCommand}
      />
    </div>
  )
}

function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'ts': case 'tsx': return 'typescript'
    case 'js': case 'jsx': return 'javascript'
    case 'py': return 'python'
    case 'md': return 'markdown'
    case 'json': return 'json'
    case 'css': return 'css'
    case 'html': return 'html'
    case 'yml': case 'yaml': return 'yaml'
    default: return 'plaintext'
  }
}

export default function WorkspacePage() {
  return (
    <WorkspaceProvider>
      <WorkspaceContent />
    </WorkspaceProvider>
  )
}
