import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CryptoDisplayProps {
  title: string
  operation: string
  result?: string
  formula?: string
  className?: string
}

export const CryptoDisplay: React.FC<CryptoDisplayProps> = ({
  title,
  operation,
  result,
  formula,
  className = '',
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`border border-primary/20 rounded-lg p-4 bg-primary/5 ${className}`}>
      {/* Title */}
      <div className="text-sm font-semibold text-primary mb-2">{title}</div>

      {/* Formula (if provided) */}
      {formula && (
        <div className="mb-3 p-3 bg-black/20 rounded border border-white/10">
          <div className="text-xs text-muted-foreground mb-1">Formula:</div>
          <div className="font-mono text-sm text-foreground">{formula}</div>
        </div>
      )}

      {/* Operation */}
      <div className="mb-2">
        <div className="text-xs text-muted-foreground mb-1">Operation:</div>
        <div className="font-mono text-sm text-foreground break-all">{operation}</div>
      </div>

      {/* Result (if provided) */}
      {result && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs text-muted-foreground">Result:</div>
            <button
              type="button"
              onClick={() => handleCopy(result)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-primary transition-colors rounded hover:bg-white/5"
              aria-label="Copy result"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="font-mono text-xs text-primary bg-black/30 p-2 rounded break-all max-h-32 overflow-y-auto">
            {result}
          </div>
        </div>
      )}
    </div>
  )
}
