// SPDX-License-Identifier: GPL-3.0-only
import { useState, useRef, useEffect } from 'react'
import { Code2, Check, Copy } from 'lucide-react'
import { Button } from './button'

const SITE_URL = 'https://www.pqctoday.com'
const SITE_NAME = 'PQC Today'

const EMBED_SNIPPETS = [
  {
    label: 'Text Link',
    code: `<a href="${SITE_URL}" target="_blank" rel="noopener noreferrer">${SITE_NAME} — Post-Quantum Cryptography Education &amp; Migration Planning</a>`,
  },
  {
    label: 'Badge (dark)',
    code: `<a href="${SITE_URL}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:#0f172a;color:#0ea5c8;border-radius:8px;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;text-decoration:none;border:1px solid #1e293b">🔐 ${SITE_NAME}</a>`,
  },
  {
    label: 'Badge (light)',
    code: `<a href="${SITE_URL}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:#f0f9ff;color:#0369a1;border-radius:8px;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;text-decoration:none;border:1px solid #bae6fd">🔐 ${SITE_NAME}</a>`,
  },
  {
    label: 'Markdown',
    code: `[PQC Today — Post-Quantum Cryptography Education & Migration Planning](${SITE_URL})`,
  },
]

interface LinkToUsButtonProps {
  variant?: 'card' | 'inline'
}

export function LinkToUsButton({ variant = 'inline' }: LinkToUsButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (variant === 'card') {
    return (
      <>
        <Button
          variant="ghost"
          type="button"
          onClick={() => setIsOpen(true)}
          className="glass-panel p-3 flex items-center gap-3 hover:border-accent/50 transition-colors text-left w-full"
        >
          <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0">
            <Code2 size={18} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-foreground">Link to Us</h4>
            <p className="text-xs text-muted-foreground leading-snug">
              Get an embed code to link to PQC Today from your website, blog, or README.
            </p>
          </div>
        </Button>
        {isOpen && <LinkToUsModal onClose={() => setIsOpen(false)} />}
      </>
    )
  }

  // inline variant (for About page links list)
  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 text-primary hover:underline hover:text-primary/80 transition-colors"
      >
        <Code2 size={16} />
        Link to Us — Get Embed Code
      </Button>
      {isOpen && <LinkToUsModal onClose={() => setIsOpen(false)} />}
    </>
  )
}

function LinkToUsModal({ onClose }: { onClose: () => void }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const copySnippet = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch {
      /* clipboard may fail in some contexts */
    }
  }

  return (
    <div className="fixed inset-0 embed-backdrop z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        ref={panelRef}
        className="glass-panel p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
        role="dialog"
        aria-label="Link to Us — embed code"
      >
        <div className="flex items-center gap-3 mb-4">
          <Code2 className="text-accent" size={24} />
          <h2 className="text-xl font-semibold">Link to Us</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Copy any snippet below to link to PQC Today from your website, blog, or README.
        </p>

        <div className="space-y-4">
          {EMBED_SNIPPETS.map((snippet, i) => (
            <div key={snippet.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-foreground">{snippet.label}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copySnippet(snippet.code, i)}
                  className="h-7 px-2 text-xs gap-1"
                >
                  {copiedIndex === i ? (
                    <>
                      <Check size={12} className="text-status-success" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="text-xs bg-muted/30 border border-border rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all text-muted-foreground font-mono">
                {snippet.code}
              </pre>
              {snippet.label === 'Badge (dark)' && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Preview:</span>
                  <a
                    href={SITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      background: '#0f172a',
                      color: '#0ea5c8',
                      borderRadius: 8,
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: 'none',
                      border: '1px solid #1e293b',
                    }}
                  >
                    🔐 {SITE_NAME}
                  </a>
                </div>
              )}
              {snippet.label === 'Badge (light)' && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Preview:</span>
                  <a
                    href={SITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      background: '#f0f9ff',
                      color: '#0369a1',
                      borderRadius: 8,
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: 'none',
                      border: '1px solid #bae6fd',
                    }}
                  >
                    🔐 {SITE_NAME}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
