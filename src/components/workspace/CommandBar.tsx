'use client'

import { useState, useEffect } from 'react'
import { Command } from 'cmdk'
import { useWorkspace } from '@/workspace/WorkspaceCtx'

interface CommandBarProps {
  isOpen: boolean
  onClose: () => void
  onCommand: (command: string, args?: unknown) => void
}

export default function CommandBar({ isOpen, onClose, onCommand }: CommandBarProps) {
  const [search, setSearch] = useState('')
  const { activeTab, openFiles } = useWorkspace()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', down)
      return () => document.removeEventListener('keydown', down)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const commands = [
    {
      id: 'new-file',
      label: 'New File',
      description: 'Create a new file',
      shortcut: 'Ctrl+N'
    },
    {
      id: 'save',
      label: 'Save',
      description: 'Save current file',
      shortcut: 'Ctrl+S',
      disabled: !activeTab
    },
    {
      id: 'save-all',
      label: 'Save All',
      description: 'Save all open files',
      shortcut: 'Ctrl+Shift+S',
      disabled: openFiles.length === 0
    },
    {
      id: 'rename',
      label: 'Rename File',
      description: 'Rename current file',
      disabled: !activeTab
    },
    {
      id: 'delete',
      label: 'Delete File',
      description: 'Delete current file',
      disabled: !activeTab
    },
    {
      id: 'commit',
      label: 'Commit Changes',
      description: 'Commit all changes to git',
      shortcut: 'Ctrl+Shift+C'
    },
    {
      id: 'diff',
      label: 'Open Diff',
      description: 'Show diff for current file',
      disabled: !activeTab
    },
    {
      id: 'ask-agent',
      label: 'Ask Agent',
      description: 'Get AI assistance with current file',
      shortcut: 'Ctrl+Shift+A',
      disabled: !activeTab
    }
  ]

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <Command className="relative w-full max-w-lg rounded-lg border bg-white shadow-lg">
        <Command.Input
          placeholder="Type a command..."
          value={search}
          onValueChange={setSearch}
          className="w-full px-4 py-3 text-sm outline-none border-b"
        />
        <Command.List className="max-h-96 overflow-auto">
          <Command.Empty className="p-4 text-center text-gray-500">
            No commands found.
          </Command.Empty>
          {filteredCommands.map(cmd => (
            <Command.Item
              key={cmd.id}
              disabled={cmd.disabled}
              onSelect={() => {
                if (!cmd.disabled) {
                  onCommand(cmd.id)
                  onClose()
                }
              }}
              className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div>
                <div className="font-medium">{cmd.label}</div>
                <div className="text-xs text-gray-600">{cmd.description}</div>
              </div>
              {cmd.shortcut && (
                <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  {cmd.shortcut}
                </div>
              )}
            </Command.Item>
          ))}
        </Command.List>
      </Command>
    </div>
  )
}