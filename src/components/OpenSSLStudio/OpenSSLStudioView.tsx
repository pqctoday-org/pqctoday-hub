// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Workbench } from './Workbench'
import { WorkbenchFileManager } from './components/WorkbenchFileManager'
import { TerminalOutput } from './TerminalOutput'
import { FileEditor } from './FileEditor'
import { FileViewer } from './components/FileViewer'
import {
  Terminal,
  ChevronDown,
  ChevronUp,
  FileText,
  Monitor,
  History,
  Lightbulb,
  BookOpen,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { LogsTab } from './LogsTab'
import { PageHeader } from '../common/PageHeader'
import { Button } from '../ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'

import { useOpenSSLStore } from './store'

type QuickCmd = { label: string; cmd: OpenSSLCategory; hint: string }
const DEV_CHEATSHEET: QuickCmd[] = [
  { label: 'genpkey', cmd: 'genpkey', hint: 'Generate PQC or classical private keys' },
  { label: 'req', cmd: 'req', hint: 'Create / inspect certificate signing requests' },
  { label: 'x509', cmd: 'x509', hint: 'Self-sign, view or convert certificates' },
  { label: 'dgst', cmd: 'dgst', hint: 'Hash files + produce digital signatures' },
  { label: 'kem', cmd: 'kem', hint: 'ML-KEM encapsulate / decapsulate' },
  { label: 'enc', cmd: 'enc', hint: 'Symmetric encryption / decryption' },
]
const RESEARCHER_LINKS = [
  { label: 'ML-KEM', to: '/algorithms?highlight=ML-KEM-768&tab=detailed' },
  { label: 'ML-DSA', to: '/algorithms?highlight=ML-DSA-65&tab=detailed' },
  { label: 'TLS 1.3', to: '/library?q=TLS+1.3' },
  { label: 'PKCS#12', to: '/library?q=PKCS12' },
  { label: 'X.509', to: '/library?q=X.509' },
]

type OpenSSLCategory =
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
  | 'lms'
  | 'configutl'
  | 'kdf'

/** Alias map for user-friendly ?cmd= values */
const CMD_ALIASES: Record<string, OpenSSLCategory> = {
  keygen: 'genpkey',
  sign: 'dgst',
  cert: 'x509',
  csr: 'req',
  encrypt: 'enc',
  decrypt: 'enc',
  digest: 'dgst',
  random: 'rand',
  certificate: 'x509',
  key: 'genpkey',
}

const VALID_CATEGORIES = new Set<string>([
  'genpkey',
  'req',
  'x509',
  'enc',
  'dgst',
  'hash',
  'rand',
  'version',
  'files',
  'kem',
  'pkcs12',
  'lms',
  'configutl',
  'kdf',
])

function resolveCmd(param: string | null): OpenSSLCategory {
  if (!param) return 'genpkey'
  const lower = param.toLowerCase()
  if (VALID_CATEGORIES.has(lower)) return lower as OpenSSLCategory
  return CMD_ALIASES[lower] ?? 'genpkey'
}

interface OpenSSLStudioViewProps {
  /** When true, hides PageHeader and desktop banner; uses local state instead of URL params. */
  embedded?: boolean
}

export const OpenSSLStudioView: React.FC<OpenSSLStudioViewProps> = ({ embedded }) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showTerminal, setShowTerminal] = useState(true)
  const [workbenchCollapsed, setWorkbenchCollapsed] = useState(false)
  const [historyCollapsed, setHistoryCollapsed] = useState(true)
  const [category, setCategory] = useState<OpenSSLCategory>(() =>
    embedded ? 'genpkey' : resolveCmd(searchParams.get('cmd'))
  )
  const { editingFile, activeTab, structuredLogs } = useOpenSSLStore()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)

  const handleCategoryChange = useCallback(
    (cat: OpenSSLCategory) => {
      setCategory(cat)
      if (!embedded) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev)
            next.set('cmd', cat)
            return next
          },
          { replace: true }
        )
      }
    },
    [embedded, setSearchParams]
  )

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {!embedded && (
        <PageHeader
          icon={Terminal}
          pageId="openssl-studio"
          title="OpenSSL Studio"
          description="Interactive OpenSSL v3.6.1 environment running entirely in your browser via WebAssembly. Educational use only — not a FIPS-validated module; PQC algorithm validation (FIPS 203/204/205) is pending for the 3.6.x line."
          viewType="Library"
          shareTitle="OpenSSL Studio — Interactive OpenSSL v3.6.1 in Your Browser"
          shareText="Run real OpenSSL 3.6.1 commands — key generation, certificates, KEM, PQC — entirely in your browser via WebAssembly."
        />
      )}

      {/* Desktop recommended banner — visible below lg, hidden when embedded */}
      {!embedded && (
        <div className="lg:hidden glass-panel p-3 mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Monitor size={16} className="shrink-0 text-primary" aria-hidden="true" />
          <span>Best experienced on desktop — scroll down for terminal and file manager.</span>
        </div>
      )}

      {/* Developer cheat sheet / Researcher doc links — persona-aware strip */}
      {!embedded && selectedPersona === 'developer' && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15 text-xs flex-wrap">
          <Lightbulb size={13} className="shrink-0 text-primary" aria-hidden="true" />
          <span className="text-muted-foreground font-medium shrink-0">Quick jump:</span>
          {DEV_CHEATSHEET.map(({ label, cmd, hint }) => (
            <Button
              key={cmd}
              variant="ghost"
              size="sm"
              title={hint}
              onClick={() => handleCategoryChange(cmd)}
              className={clsx(
                'h-auto px-2 py-0.5 text-[11px] font-mono rounded border transition-colors',
                category === cmd
                  ? 'bg-primary/15 border-primary/30 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/20 hover:bg-muted/30'
              )}
            >
              {label}
            </Button>
          ))}
        </div>
      )}
      {!embedded && selectedPersona === 'researcher' && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/15 text-xs flex-wrap">
          <BookOpen size={13} className="shrink-0 text-primary" aria-hidden="true" />
          <span className="text-muted-foreground font-medium shrink-0">Related specs:</span>
          {RESEARCHER_LINKS.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className="h-auto px-2 py-0.5 text-[11px] font-medium rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/20 hover:bg-muted/30 transition-colors"
            >
              {label} ↗
            </Link>
          ))}
        </div>
      )}

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left Pane: Workbench (Command Builder & Preview) */}
        <div className="col-span-12 lg:col-span-4 glass-panel flex flex-col overflow-hidden">
          <div
            className="p-4 border-b border-border bg-muted flex items-center justify-between cursor-pointer lg:cursor-default"
            onClick={() => setWorkbenchCollapsed(!workbenchCollapsed)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setWorkbenchCollapsed(!workbenchCollapsed)
              }
            }}
          >
            <h3 className="font-bold text-foreground flex items-center gap-2">Workbench</h3>
            <span className="lg:hidden text-muted-foreground">
              {workbenchCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </span>
          </div>
          <div
            className={clsx(
              'flex-1 overflow-y-auto custom-scrollbar',
              workbenchCollapsed && 'hidden lg:block'
            )}
          >
            <Workbench category={category} setCategory={handleCategoryChange} />
          </div>

          {/* Command History — collapsible strip at the bottom of left pane */}
          {structuredLogs.length > 0 && (
            <div className="border-t border-border shrink-0">
              <Button
                variant="ghost"
                className="w-full flex items-center justify-between px-4 py-2 text-xs text-muted-foreground hover:bg-muted/40 transition-colors h-auto rounded-none"
                onClick={() => setHistoryCollapsed(!historyCollapsed)}
                aria-expanded={!historyCollapsed}
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <History size={13} />
                  Recent Commands ({structuredLogs.length})
                </span>
                {historyCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
              </Button>
              {!historyCollapsed && (
                <ul className="max-h-48 overflow-y-auto custom-scrollbar divide-y divide-border/50 bg-muted/20">
                  {structuredLogs
                    .slice(-10)
                    .reverse()
                    .map((log) => (
                      <li key={log.id} className="px-4 py-2 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold text-primary truncate">
                            {log.operationType}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 shrink-0 tabular-nums">
                            {log.executionTime.toFixed(0)} ms
                          </span>
                        </div>
                        <p
                          className="text-[10px] font-mono text-muted-foreground truncate"
                          title={log.command}
                        >
                          {log.command}
                        </p>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowTerminal(!showTerminal)}
                  title={showTerminal ? 'Hide Panel' : 'Show Panel'}
                  aria-label={showTerminal ? 'Hide Panel' : 'Show Panel'}
                >
                  {showTerminal ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </Button>
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
