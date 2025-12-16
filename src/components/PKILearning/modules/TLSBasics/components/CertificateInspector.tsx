import React, { useState, useEffect } from 'react'
import { X, Search, Loader2, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { openSSLService } from '../../../../../services/crypto/OpenSSLService'

interface CertificateInspectorProps {
  isOpen: boolean
  onClose: () => void
  pem: string
  title: string
}

export const CertificateInspector: React.FC<CertificateInspectorProps> = ({
  isOpen,
  onClose,
  pem,
  title,
}) => {
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree')
  const [parsedOutput, setParsedOutput] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && pem) {
      parseCertificate(pem)
    } else {
      setParsedOutput(null)
      setError(null)
    }
  }, [isOpen, pem])

  const parseCertificate = async (certPem: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const fileName = 'inspect.pem'
      const file = {
        name: fileName,
        data: new TextEncoder().encode(certPem),
      }

      // Quick check if it's a CSR or Cert
      const isCsr = certPem.includes('BEGIN CERTIFICATE REQUEST')
      const command = isCsr
        ? `openssl req -in ${fileName} -text -noout`
        : `openssl x509 -in ${fileName} -text -noout`

      const result = await openSSLService.execute(command, [file])

      if (result.error) {
        setError(result.stderr || result.error)
      } else {
        setParsedOutput(result.stdout)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse certificate')
    } finally {
      setIsLoading(false)
    }
  }

  // --- Tree View Components (Reused logic) ---

  const TreeNode: React.FC<{
    label: string
    value?: string
    children?: React.ReactNode
    defaultOpen?: boolean
  }> = ({ label, value, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen)
    const hasChildren = !!children

    return (
      <div className="text-xs">
        <div
          role={hasChildren ? 'button' : undefined}
          tabIndex={hasChildren ? 0 : undefined}
          className={`flex items-start gap-1 py-0.5 ${hasChildren ? 'cursor-pointer hover:bg-muted/10' : ''}`}
          onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation()
              setIsOpen(!isOpen)
            }
          }}
          onKeyDown={(e) => {
            if (hasChildren && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              setIsOpen(!isOpen)
            }
          }}
        >
          {hasChildren && (
            <span className="text-muted-foreground mt-0.5">
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          )}
          {!hasChildren && <span className="w-[14px]" />}
          <span className="text-primary font-medium">{label}:</span>
          {value && <span className="text-foreground ml-1 break-all">{value}</span>}
        </div>
        {hasChildren && isOpen && (
          <div className="ml-4 border-l border-border pl-2">{children}</div>
        )}
      </div>
    )
  }

  type TreeNodeData =
    | { type: 'text'; content: string }
    | { type: 'leaf'; label: string; value: string }
    | { type: 'node'; label: string; value?: string; children: TreeNodeData[] }

  const ParsedTree: React.FC<{ output: string }> = ({ output }) => {
    const lines = output.split('\n')

    const parseLines = (
      lines: string[],
      startIdx: number = 0,
      baseIndent: number = 0
    ): { nodes: TreeNodeData[]; endIdx: number } => {
      const nodes: TreeNodeData[] = []
      let i = startIdx

      while (i < lines.length) {
        // eslint-disable-next-line security/detect-object-injection
        const line = lines[i]
        if (!line.trim()) {
          i++
          continue
        }

        const indent = line.search(/\S/)
        if (indent < baseIndent && i > startIdx) break

        const trimmed = line.trim()
        const match = trimmed.match(/^([^:]+):\s*(.*)$/)

        if (match) {
          const key = match[1].trim()
          const value = match[2].trim()

          let hasNested = false
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1]
            const nextIndent = nextLine.search(/\S/)
            hasNested = nextIndent > indent && !!nextLine.trim()
          }

          if (hasNested) {
            const { nodes: children, endIdx } = parseLines(lines, i + 1, indent + 1)
            nodes.push({ type: 'node', label: key, value: value || undefined, children })
            i = endIdx
          } else {
            nodes.push({ type: 'leaf', label: key, value: value || '(empty)' })
            i++
          }
        } else {
          nodes.push({ type: 'text', content: trimmed })
          i++
        }
      }
      return { nodes, endIdx: i }
    }

    const { nodes } = parseLines(lines)

    const renderNode = (node: TreeNodeData, idx: number, depth: number = 0): React.ReactNode => {
      if (node.type === 'text') {
        return (
          <div key={idx} className="text-muted-foreground py-0.5 ml-4">
            {node.content}
          </div>
        )
      }
      if (node.type === 'leaf') {
        return <TreeNode key={idx} label={node.label} value={node.value} />
      }
      if (node.type === 'node') {
        if (depth === 0) {
          return (
            <div key={idx} className="mb-2">
              <div className="text-xs py-0.5">
                <span className="text-primary font-bold">{node.label}:</span>
                {node.value && <span className="text-foreground ml-1">{node.value}</span>}
              </div>
              <div className="ml-4 border-l border-border pl-2">
                {node.children.map((child, childIdx) => renderNode(child, childIdx, depth + 1))}
              </div>
            </div>
          )
        }
        return (
          <TreeNode key={idx} label={node.label} value={node.value} defaultOpen={depth < 2}>
            {node.children.map((child, childIdx) => renderNode(child, childIdx, depth + 1))}
          </TreeNode>
        )
      }
      return null
    }

    return <div className="space-y-1">{nodes.map((node, idx) => renderNode(node, idx, 0))}</div>
  }

  // --- Main Render ---

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card w-full max-w-3xl h-[80vh] flex flex-col rounded-xl border border-border shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-full">
                  <Search size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{title}</h3>
                  <p className="text-xs text-muted-foreground">OpenSSL Certificate Inspector</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {parsedOutput && (
                  <div className="flex bg-muted rounded p-1 mr-2">
                    <button
                      onClick={() => setViewMode('tree')}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                        viewMode === 'tree'
                          ? 'bg-background shadow text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Tree View
                    </button>
                    <button
                      onClick={() => setViewMode('raw')}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                        viewMode === 'raw'
                          ? 'bg-background shadow text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Raw Text
                    </button>
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-hidden relative bg-muted/10">
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <Loader2 size={32} className="animate-spin mb-2 text-primary" />
                  <p className="text-sm">Parsing Certificate Structure...</p>
                </div>
              ) : error ? (
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 max-w-md text-center">
                    <AlertTriangle size={32} className="mx-auto mb-4 text-destructive" />
                    <h4 className="text-destructive font-bold mb-2">Parsing Failed</h4>
                    <p className="text-sm text-destructive/80 font-mono whitespace-pre-wrap">
                      {error}
                    </p>
                  </div>
                </div>
              ) : parsedOutput ? (
                <div className="h-full overflow-auto p-6 font-mono text-xs custom-scrollbar">
                  {viewMode === 'tree' ? (
                    <ParsedTree output={parsedOutput} />
                  ) : (
                    <pre className="whitespace-pre-wrap break-all text-muted-foreground">
                      {parsedOutput}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground opacity-50">
                  <p>No content to display</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t bg-muted/30 text-[10px] text-muted-foreground flex justify-between">
              <span>Powered by OpenSSL 3.6.0 (WASM)</span>
              <span className="font-mono">{pem.length} bytes loaded</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
