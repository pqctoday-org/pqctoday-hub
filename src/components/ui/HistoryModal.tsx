// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, GitBranch, ExternalLink, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Button } from './button'
import { useIsEmbedded } from '../../embed/EmbedProvider'
import { useModalPosition } from '../../hooks/useModalPosition'

interface GitHubIssue {
  number: number
  title: string
  html_url: string
  state: 'open' | 'closed'
  created_at: string
  closed_at: string | null
  labels: { name: string; color: string }[]
  body: string | null
}

interface HistoryModalProps {
  isOpen: boolean
  onClose: () => void
  itemId: string
  itemLabel: string // e.g. "LM-001 · pqc-101" or "PT-001 · slh-dsa"
  version?: string
  lastReviewed?: string
  ghLabel: string // e.g. "lm-001" or "pt-001"
}

const SEVERITY_ORDER = ['high', 'medium', 'low']

function extractSeverity(labels: GitHubIssue['labels']): string {
  for (const sev of SEVERITY_ORDER) {
    if (labels.some((l) => l.name === sev)) return sev
  }
  return ''
}

function extractDimension(labels: GitHubIssue['labels']): string {
  const dims = [
    'accuracy',
    'completeness',
    'freshness',
    'education_value',
    'library_xref_accuracy',
    'product_xref_accuracy',
    'library_xref_freshness',
    'product_xref_freshness',
  ]
  const found = labels.find((l) => dims.includes(l.name))
  return found ? found.name.replace(/_/g, ' ') : ''
}

export const HistoryModal = ({
  isOpen,
  onClose,
  itemLabel,
  version,
  lastReviewed,
  ghLabel,
}: HistoryModalProps) => {
  const isEmbedded = useIsEmbedded()
  const positionStyle = useModalPosition(isEmbedded)

  const [ghIssues, setGhIssues] = useState<GitHubIssue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !ghLabel) return
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(
          `https://api.github.com/repos/pqctoday/pqctoday-hub/issues?labels=${encodeURIComponent(ghLabel)}&state=all&per_page=30`
        )
        if (!response.ok) throw new Error(`GitHub API error: ${response.status}`)
        const data = await response.json()
        setGhIssues(data)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isOpen, ghLabel])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const openIssues = ghIssues.filter((i) => i.state === 'open')
  const closedIssues = ghIssues.filter((i) => i.state === 'closed')

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 embed-backdrop bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-panel p-6 max-w-2xl w-full max-h-[80dvh] overflow-y-auto z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-modal-title"
            style={{ ...positionStyle, zIndex: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <GitBranch size={20} className="text-primary shrink-0" />
                <div>
                  <h2 id="history-modal-title" className="text-lg font-bold leading-tight">
                    Revision History
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{itemLabel}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
                <X size={20} />
              </Button>
            </div>

            {/* Version + last reviewed */}
            <div className="flex items-center gap-4 px-3 py-2 rounded-lg bg-muted/20 border border-border mb-4 text-xs">
              {version && (
                <span className="text-foreground font-mono">
                  v<span className="font-bold">{version}</span>
                </span>
              )}
              {lastReviewed && (
                <span className="text-muted-foreground">Last reviewed: {lastReviewed}</span>
              )}
              <span className="ml-auto text-muted-foreground font-mono text-[10px]">{ghLabel}</span>
            </div>

            {/* Body */}
            {loading && (
              <div className="flex items-center justify-center py-10 gap-3 text-muted-foreground">
                <Clock size={16} className="animate-spin" />
                <span className="text-sm">Fetching revision history…</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 py-6 text-status-error text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {!loading && !error && ghIssues.length === 0 && (
              <div className="flex flex-col items-center py-10 gap-3 text-muted-foreground">
                <CheckCircle size={24} className="text-status-success" />
                <p className="text-sm">No revision issues — this item is up to date.</p>
              </div>
            )}

            {!loading && !error && ghIssues.length > 0 && (
              <div className="space-y-4">
                {openIssues.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-status-warning uppercase tracking-widest mb-2">
                      Open ({openIssues.length})
                    </h3>
                    <div className="space-y-2">
                      {openIssues.map((issue) => (
                        <IssueCard key={issue.number} issue={issue} />
                      ))}
                    </div>
                  </div>
                )}

                {closedIssues.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-status-success uppercase tracking-widest mb-2">
                      Closed ({closedIssues.length})
                    </h3>
                    <div className="space-y-2">
                      {closedIssues.map((issue) => (
                        <IssueCard key={issue.number} issue={issue} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

const IssueCard = ({ issue }: { issue: GitHubIssue }) => {
  const dimension = extractDimension(issue.labels)
  const severity = extractSeverity(issue.labels)
  const isOpen = issue.state === 'open'

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg glass-panel hover:border-primary/30 transition-colors">
      <div className="shrink-0 mt-0.5">
        {isOpen ? (
          <AlertCircle size={14} className="text-status-warning" />
        ) : (
          <CheckCircle size={14} className="text-status-success" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <span className="text-xs font-mono text-muted-foreground">#{issue.number}</span>
          {dimension && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
              {dimension}
            </span>
          )}
          {severity && (
            <span
              className={
                `text-[10px] px-1.5 py-0.5 rounded font-medium ` +
                (severity === 'high'
                  ? 'bg-status-error/15 text-status-error'
                  : severity === 'medium'
                    ? 'bg-status-warning/15 text-status-warning'
                    : 'bg-muted/50 text-muted-foreground')
              }
            >
              {severity}
            </span>
          )}
        </div>
        <p className="text-xs text-foreground leading-snug">{issue.title}</p>
        <p className="text-[10px] text-muted-foreground mt-1">
          Opened {issue.created_at.slice(0, 10)}
          {issue.closed_at ? ` · Closed ${issue.closed_at.slice(0, 10)}` : ''}
        </p>
      </div>
      <a
        href={issue.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 text-primary hover:text-primary/80 transition-colors mt-0.5"
        aria-label={`View issue #${issue.number} on GitHub`}
      >
        <ExternalLink size={13} />
      </a>
    </div>
  )
}
