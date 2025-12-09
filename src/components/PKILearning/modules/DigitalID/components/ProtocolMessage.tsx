import React, { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'

interface ProtocolMessageProps {
  title: string
  message: object | string
  format?: 'json' | 'cbor' | 'text'
  collapsible?: boolean
  defaultExpanded?: boolean
}

export const ProtocolMessage: React.FC<ProtocolMessageProps> = ({
  title,
  message,
  format = 'json',
  collapsible = true,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [copied, setCopied] = useState(false)

  const formattedMessage = typeof message === 'string' ? message : JSON.stringify(message, null, 2)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formattedMessage)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden bg-black/20">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-white/5 border-b border-white/10">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
          onClick={() => collapsible && setIsExpanded(!isExpanded)}
          disabled={!collapsible}
        >
          {collapsible && (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
          {title}
          <span className="text-xs text-muted-foreground ml-2">({format.toUpperCase()})</span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-primary transition-colors rounded hover:bg-white/5"
          aria-label="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="overflow-x-auto">
          {format === 'cbor' ? (
            <div className="p-4 font-mono text-sm text-muted-foreground">
              <div className="text-xs text-primary mb-2">CBOR (Hex):</div>
              <div className="break-all">{formattedMessage}</div>
            </div>
          ) : (
            <pre className="p-4 text-sm text-muted-foreground overflow-x-auto bg-black/30 rounded-b">
              <code className="language-json">{formattedMessage}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
