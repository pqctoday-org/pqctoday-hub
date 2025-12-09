import React, { useState, useEffect, useRef } from 'react'
import { X, FileText, ChevronDown, ChevronRight, ArrowRightLeft } from 'lucide-react'
import { openSSLService } from '../../../services/crypto/OpenSSLService'
import { useOpenSSLStore } from '../store'

export const FileViewer: React.FC = () => {
  const { viewingFile, setViewingFile } = useOpenSSLStore()
  const [viewMode, setViewMode] = useState<'tree' | 'hex' | 'text'>('tree')
  const [parsedOutput, setParsedOutput] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const viewerRef = useRef<HTMLDivElement>(null)

  const isCertificate =
    viewingFile?.name.endsWith('.crt') ||
    viewingFile?.name.endsWith('.pem') ||
    viewingFile?.name.endsWith('.cert') ||
    viewingFile?.name.endsWith('.key')
  const isCSR = viewingFile?.name.endsWith('.csr')

  useEffect(() => {
    if (!viewingFile) return

    if (isCertificate || isCSR) {
      setViewMode('tree')
      parseCertificate()
    } else {
      // Default to text if content is string, otherwise hex
      setViewMode(typeof viewingFile.content === 'string' ? 'text' : 'hex')
    }

    // Scroll into view when file is selected
    if (viewerRef.current) {
      viewerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingFile])

  const parseCertificate = async () => {
    if (!viewingFile) return

    setIsParsing(true)
    setError(null)
    setParsedOutput(null)

    try {
      const content =
        typeof viewingFile.content === 'string'
          ? new TextEncoder().encode(viewingFile.content)
          : viewingFile.content

      const inputFile = {
        name: viewingFile.name,
        data: content,
      }

      let command = isCSR
        ? `openssl req -in ${viewingFile.name} -text -noout`
        : `openssl x509 -in ${viewingFile.name} -text -noout`

      let result = await openSSLService.execute(command, [inputFile])
      // console.log('OpenSSL Result (First Attempt):', result)

      // If x509 failed and it's a PEM/KEY file, try parsing as Key
      if (
        result.error &&
        (viewingFile.name.endsWith('.pem') || viewingFile.name.endsWith('.key'))
      ) {
        // console.log('x509 parsing failed, trying as pkey...')
        command = `openssl pkey -in ${viewingFile.name} -text -noout`
        result = await openSSLService.execute(command, [inputFile])
        // console.log('OpenSSL Result (Second Attempt):', result)
      }

      if (result.error) {
        // console.error('OpenSSL Error:', result.error)
        setError(result.error)
      } else {
        // console.log('OpenSSL Output:', result.stdout)
        setParsedOutput(result.stdout)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse file'
      setError(errorMessage)
    } finally {
      setIsParsing(false)
    }
  }

  // Tree node component
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
          className={`flex items-start gap-1 py-0.5 ${hasChildren ? 'cursor-pointer hover:bg-accent' : ''}`}
          onClick={() => hasChildren && setIsOpen(!isOpen)}
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
          {value && <span className="text-foreground">{value}</span>}
        </div>
        {hasChildren && isOpen && (
          <div className="ml-4 border-l border-border pl-2">{children}</div>
        )}
      </div>
    )
  }

  // Parse OpenSSL text output
  type TreeNodeData =
    | { type: 'text'; content: string }
    | { type: 'leaf'; label: string; value: string }
    | { type: 'node'; label: string; value?: string; children: TreeNodeData[] }

  const ParsedCertView: React.FC<{ output: string }> = ({ output }) => {
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

        if (indent < baseIndent && i > startIdx) {
          break
        }

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
          <TreeNode key={idx} label={node.label} value={node.value} defaultOpen={depth < 3}>
            {node.children.map((child, childIdx) => renderNode(child, childIdx, depth + 1))}
          </TreeNode>
        )
      }

      return null
    }

    return <div className="space-y-1">{nodes.map((node, idx) => renderNode(node, idx, 0))}</div>
  }

  const formatHex = (data: Uint8Array) => {
    const lines: string[] = []
    for (let i = 0; i < data.length; i += 16) {
      const offset = i.toString(16).padStart(8, '0')
      const chunk = data.slice(i, i + 16)
      const hexPart = Array.from(chunk)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ')
        .padEnd(48, ' ')
      const asciiPart = Array.from(chunk)
        .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
        .join('')
      lines.push(`${offset}  ${hexPart}  |${asciiPart}|`)
    }
    return lines.join('\n')
  }

  const toggleViewMode = () => {
    if (isCertificate || isCSR) {
      // Cycle: Tree -> Hex -> Text -> Tree
      if (viewMode === 'tree') setViewMode('hex')
      else if (viewMode === 'hex') setViewMode('text')
      else setViewMode('tree')
    } else {
      // Toggle Hex <-> Text
      setViewMode(viewMode === 'hex' ? 'text' : 'hex')
    }
  }

  if (!viewingFile) return null

  const fileContentString =
    typeof viewingFile.content === 'string'
      ? viewingFile.content
      : new TextDecoder().decode(viewingFile.content)

  return (
    <div
      ref={viewerRef}
      className="glass-panel flex flex-col overflow-hidden mb-6 animate-fade-in shrink-0 h-96 border border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]"
    >
      {/* Header */}
      <div className="p-3 border-b border-border bg-muted flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-primary/20 text-primary">
            <FileText size={16} />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              {viewingFile.name}
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground uppercase">
                {viewingFile.type}
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleViewMode}
            className="px-3 py-1.5 rounded text-xs font-medium flex items-center gap-2 bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition-colors border border-input"
            title="Switch View Mode"
          >
            <ArrowRightLeft size={12} />
            {viewMode.toUpperCase()}
          </button>
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={() => setViewingFile(null)}
            className="p-1.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Close Viewer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-0 overflow-hidden flex flex-col relative">
        <div className="flex-1 w-full bg-background p-4 font-mono text-sm text-foreground/90 overflow-y-auto custom-scrollbar">
          {(isCertificate || isCSR) && viewMode === 'tree' ? (
            isParsing ? (
              <div className="text-center text-muted-foreground py-8">Parsing file...</div>
            ) : error ? (
              <div className="text-red-400 whitespace-pre-wrap">{error}</div>
            ) : parsedOutput ? (
              <ParsedCertView output={parsedOutput} />
            ) : (
              <div className="text-center text-muted-foreground py-8">No output</div>
            )
          ) : viewMode === 'text' ? (
            <pre className="text-xs text-foreground/90 whitespace-pre-wrap font-mono">
              {fileContentString}
            </pre>
          ) : (
            <pre className="text-xs text-muted-foreground whitespace-pre overflow-x-auto">
              {formatHex(
                typeof viewingFile.content === 'string'
                  ? new TextEncoder().encode(viewingFile.content)
                  : viewingFile.content
              )}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
