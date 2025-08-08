'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export interface WorkspaceState {
  openFiles: string[]
  activeTab: string | null
  dirtyFlags: Record<string, boolean>
  currentRepo: string
}

interface WorkspaceContextType extends WorkspaceState {
  setOpenFiles: (files: string[]) => void
  setActiveTab: (tab: string | null) => void
  setDirtyFlag: (path: string, dirty: boolean) => void
  setCurrentRepo: (repo: string) => void
}

const WorkspaceCtx = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [openFiles, setOpenFiles] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [dirtyFlags, setDirtyFlags] = useState<Record<string, boolean>>({})
  const [currentRepo, setCurrentRepo] = useState('')

  const setDirtyFlag = (path: string, dirty: boolean) =>
    setDirtyFlags((flags) => ({ ...flags, [path]: dirty }))

  return (
    <WorkspaceCtx.Provider
      value={{
        openFiles,
        activeTab,
        dirtyFlags,
        currentRepo,
        setOpenFiles,
        setActiveTab,
        setDirtyFlag,
        setCurrentRepo
      }}
    >
      {children}
    </WorkspaceCtx.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceCtx)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}

export default WorkspaceCtx
