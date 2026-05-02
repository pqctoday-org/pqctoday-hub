// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
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
  PanelLeft,
  Network,
  ArrowRight,
} from 'lucide-react'
import clsx from 'clsx'
import { LogsTab } from './LogsTab'
import { PageHeader } from '../common/PageHeader'
import { Button } from '../ui/button'
import { CopyButton } from '@/components/ui/CopyButton'
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
  const { editingFile, activeTab, structuredLogs, setActiveTab } = useOpenSSLStore()
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
      {workbenchCollapsed && (
        <Button
          variant="outline"
          onClick={() => setWorkbenchCollapsed(false)}
          className="fixed bottom-4 left-4 z-30 flex items-center gap-1.5 rounded-full bg-card border border-border shadow-glow px-3 py-2 text-xs font-medium text-foreground lg:hidden"
          aria-label="Expand workbench panel"
        >
          <PanelLeft size={14} />
          Workbench
        </Button>
      )}

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
          {/* Cross-link to TLS Simulator — always visible */}
          <div className="mt-3 rounded-lg border border-border bg-muted/20 px-3 py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Network size={12} className="shrink-0" />
              <span>Generated a cert? Test it in the TLS Simulator.</span>
            </div>
            <Link
              to="/playground?tool=tls-simulator"
              className="text-xs text-primary underline hover:text-primary/80 shrink-0 flex items-center gap-0.5"
            >
              TLS Simulator <ArrowRight size={10} />
            </Link>
          </div>

          {/* File Editor Section (Only visible when editing) */}
          <FileEditor key={editingFile?.name} />

          {/* File Viewer Section (Only visible when viewing) */}
          <FileViewer />

          <div className={showTerminal ? 'flex-1 min-h-0' : 'shrink-0'}>
            <div className="glass-panel h-full flex flex-col overflow-hidden">
              <div className="flex items-center gap-1 border-b border-border px-3 py-1.5 bg-muted/20">
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab('terminal')}
                  className={`h-auto flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === 'terminal'
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Terminal size={12} />
                  Terminal
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setActiveTab('logs')}
                  className={`h-auto flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === 'logs'
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileText size={12} />
                  Log
                  {structuredLogs.length > 0 && (
                    <span className="ml-1 text-[10px] bg-primary/20 text-primary rounded px-1">
                      {structuredLogs.length}
                    </span>
                  )}
                </Button>
              </div>
              <div className="p-2 border-b border-border bg-muted/50 flex items-center justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowTerminal(!showTerminal)}
                  title={showTerminal ? 'Hide Panel' : 'Show Panel'}
                  aria-label={showTerminal ? 'Hide Panel' : 'Show Panel'}
                >
                  {showTerminal ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </Button>
              </div>
              {showTerminal && (
                <div className="flex-1 overflow-hidden">
                  {structuredLogs.length === 0 ? (
                    <div className="flex flex-col items-start justify-center h-full p-6 gap-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Terminal size={16} />
                        <span className="text-sm font-medium">OpenSSL Studio — ready</span>
                      </div>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Select a command category on the left and configure your parameters, or copy
                        and paste one of these to get started:
                      </p>
                      <div className="flex flex-col gap-2 w-full max-w-sm">
                        {[
                          { cmd: 'openssl version', label: 'Check OpenSSL version' },
                          {
                            cmd: 'openssl genpkey -algorithm ml-dsa-65 -out ml_dsa.key',
                            label: 'Generate ML-DSA-65 key',
                          },
                          {
                            cmd: 'openssl genpkey -algorithm ed25519 -out ed25519.key',
                            label: 'Generate Ed25519 key',
                          },
                        ].map(({ cmd, label }) => (
                          <div
                            key={cmd}
                            className="flex flex-col items-start rounded-lg border border-border bg-muted/20 px-3 py-2 text-left relative group"
                          >
                            <span className="text-xs font-mono text-primary pr-8">{cmd}</span>
                            <span className="text-[11px] text-muted-foreground mt-0.5">
                              {label}
                            </span>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <CopyButton text={cmd} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : activeTab === 'terminal' ? (
                    <TerminalOutput />
                  ) : (
                    <LogsTab />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
