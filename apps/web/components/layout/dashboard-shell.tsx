'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { Sidebar } from './sidebar'
import { CommandPalette } from './command-palette'

interface ShellCtx { collapsed: boolean; cmdOpen: boolean; setCmdOpen: (v: boolean) => void }
const Ctx = createContext<ShellCtx>({ collapsed: false, cmdOpen: false, setCmdOpen: () => {} })
export function useShell() { return useContext(Ctx) }

interface Props {
  children: React.ReactNode
  userName?: string
  orgName?: string
}

export function DashboardShell({ children, userName, orgName }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(v => !v) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <Ctx.Provider value={{ collapsed, cmdOpen, setCmdOpen }}>
      <div style={{ display: 'flex', height: '100dvh', width: '100%', overflow: 'hidden' }}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} userName={userName} orgName={orgName}/>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {children}
        </div>
      </div>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)}/>
    </Ctx.Provider>
  )
}
