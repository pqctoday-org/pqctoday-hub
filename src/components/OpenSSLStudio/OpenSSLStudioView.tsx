import { useState } from 'react'
import { Workbench } from './Workbench'
import { WorkbenchFileManager } from './components/WorkbenchFileManager'
import { TerminalOutput } from './TerminalOutput'
import { FileEditor } from './FileEditor'
import { FileViewer } from './components/FileViewer'
import { Terminal, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { LogsTab } from './LogsTab'

import { useOpenSSLStore } from './store'

export const OpenSSLStudioView = () => {
  const [showTerminal, setShowTerminal] = useState(true)
  const [category, setCategory] = useState<
    | 'genpkey'
    | 'req'
    | 'x509'
    | 'enc'
    | 'dgst'
    | 'hash'
    | 'rand'
    | 'version'
    | 'files'
    | 'kem'
    | 'pkcs12'
  >('genpkey')
  const { editingFile, activeTab } = useOpenSSLStore()

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="mb-6 shrink-0">
        <h2 className="text-3xl font-bold text-gradient mb-2 flex items-center gap-3">
          <Terminal className="text-primary" aria-hidden="true" />
          OpenSSL Studio
        </h2>
        <p className="text-muted-foreground">
          Interactive OpenSSL v3.6.0 environment running entirely in your browser via WebAssembly.
        </p>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left Pane: Workbench (Command Builder & Preview) */}
        <div className="col-span-12 lg:col-span-4 glass-panel flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border bg-muted">
            <h3 className="font-bold text-foreground flex items-center gap-2">Workbench</h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <Workbench category={category} setCategory={setCategory} />
          </div>
        </div>

        {/* Right Pane: File Manager, File Editor, & Terminal Output */}
        <div className="col-span-12 lg:col-span-8 flex flex-col min-h-0">
          {/* File Manager (Always Visible) */}
          <div className="glass-panel p-4 mb-6 shrink-0 max-h-[300px] overflow-y-auto custom-scrollbar">
            <WorkbenchFileManager />
          </div>

          {/* File Editor Section (Only visible when editing) */}
          <FileEditor key={editingFile?.name} />

          {/* File Viewer Section (Only visible when viewing) */}
          <FileViewer />

          <div className={showTerminal ? 'flex-1 min-h-0' : 'shrink-0'}>
            <div className="glass-panel h-full flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border bg-muted flex items-center justify-between">
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
                  className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
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
