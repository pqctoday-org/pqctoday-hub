import { useState } from 'react'
import { Workbench } from './Workbench'
import { CommandPreview } from './CommandPreview'
import { TerminalOutput } from './TerminalOutput'
import { FileEditor } from './FileEditor'
import { Terminal, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { LogsTab } from './LogsTab'

import { useOpenSSLStore } from './store'

export const OpenSSLStudioView = () => {
  const [showTerminal, setShowTerminal] = useState(true)
  const { editingFile, activeTab } = useOpenSSLStore()

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-fade-in">
      <div className="mb-6 shrink-0">
        <h2 className="text-3xl font-bold text-gradient mb-2 flex items-center gap-3">
          <Terminal className="text-primary" aria-hidden="true" />
          OpenSSL Studio
        </h2>
        <p className="text-muted-foreground">
          Interactive OpenSSL v3.5.4 environment running entirely in your browser via WebAssembly.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left Pane: Workbench (Command Builder) */}
        <div className="col-span-12 lg:col-span-4 glass-panel flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-white/5">
            <h3 className="font-bold text-foreground flex items-center gap-2">Workbench</h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <Workbench />
          </div>
        </div>

        {/* Right Pane: Command Preview, File Editor, & Terminal Output */}
        <div className="col-span-12 lg:col-span-8 flex flex-col min-h-0">
          <CommandPreview />

          {/* File Editor Section (Only visible when editing) */}
          <FileEditor key={editingFile?.name} />

          <div className={showTerminal ? 'flex-1 min-h-0' : 'shrink-0'}>
            <div className="glass-panel h-full flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  {activeTab === 'terminal' ? (
                    <>
                      <Terminal size={16} />
                      Terminal Output
                    </>
                  ) : (
                    <>
                      <FileText size={16} />
                      Operation Log
                    </>
                  )}
                </h3>
                <button
                  onClick={() => setShowTerminal(!showTerminal)}
                  className="p-1.5 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground transition-colors"
                  title={showTerminal ? 'Hide Panel' : 'Show Panel'}
                >
                  {showTerminal ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </div>
              {showTerminal && (
                <div className="flex-1 overflow-hidden">
                  {activeTab === 'terminal' ? <TerminalOutput /> : <LogsTab />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
