import React from 'react'
import { CopyButton } from './CopyButton'
import {
  detectCryptoType,
  getCryptoColorClass,
  isBitcoinAddress,
  isEthereumAddress,
  isSolanaAddress,
  isHexValue,
} from '../utils/outputFormatters'

interface OutputFormatterProps {
  output: string
  className?: string
}

export const OutputFormatter: React.FC<OutputFormatterProps> = ({ output, className = '' }) => {
  const lines = output.split('\n')

  const formatLine = (line: string, index: number) => {
    // Check for labeled values (e.g., "Address: 1A1zP1...")
    const labelMatch = line.match(/^([^:]+):\s*(.+)$/)

    if (labelMatch) {
      const [, label, value] = labelMatch
      const trimmedValue = value.trim()

      // Detect crypto type
      if (isBitcoinAddress(trimmedValue)) {
        return (
          <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <span className="text-muted-foreground">{label}:</span>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <code className="text-yellow-400 font-mono text-sm break-all">{trimmedValue}</code>
              <CopyButton text={trimmedValue} label="" className="shrink-0" />
            </div>
          </div>
        )
      }

      if (isEthereumAddress(trimmedValue)) {
        return (
          <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <span className="text-muted-foreground">{label}:</span>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <code className="text-blue-400 font-mono text-sm break-all">{trimmedValue}</code>
              <CopyButton text={trimmedValue} label="" className="shrink-0" />
            </div>
          </div>
        )
      }

      if (isSolanaAddress(trimmedValue)) {
        return (
          <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
            <span className="text-muted-foreground">{label}:</span>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <code className="text-purple-400 font-mono text-sm break-all">{trimmedValue}</code>
              <CopyButton text={trimmedValue} label="" className="shrink-0" />
            </div>
          </div>
        )
      }

      if (isHexValue(trimmedValue)) {
        return (
          <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-2 mb-2">
            <span className="text-muted-foreground shrink-0">{label}:</span>
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <code className="text-green-400 font-mono text-sm break-all">{trimmedValue}</code>
              <CopyButton text={trimmedValue} label="" className="shrink-0" />
            </div>
          </div>
        )
      }

      // Regular labeled value
      return (
        <div key={index} className="mb-1">
          <span className="text-muted-foreground">{label}:</span>{' '}
          <span className="text-foreground">{trimmedValue}</span>
        </div>
      )
    }

    // Check for standalone crypto values or hex strings in the line
    const words = line.split(/\s+/)
    const hasCryptoValue = words.some(
      (word) =>
        isBitcoinAddress(word) ||
        isEthereumAddress(word) ||
        isSolanaAddress(word) ||
        isHexValue(word)
    )

    if (hasCryptoValue) {
      return (
        <div key={index} className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            {words.map((word, wordIndex) => {
              const type = detectCryptoType(word)
              if (type !== 'unknown') {
                const colorClass = getCryptoColorClass(type)
                return (
                  <span key={wordIndex} className="inline-flex items-center gap-1 mr-2">
                    <code className={`${colorClass} font-mono text-sm break-all`}>{word}</code>
                    <CopyButton text={word} label="" className="shrink-0" />
                  </span>
                )
              }
              // Check if word is a long hex string (even without 0x prefix)
              if (isHexValue(word)) {
                return (
                  <span key={wordIndex} className="inline-flex items-center gap-1 mr-2">
                    <code className="text-green-400 font-mono text-sm break-all">{word}</code>
                    <CopyButton text={word} label="" className="shrink-0" />
                  </span>
                )
              }
              return <span key={wordIndex}>{word} </span>
            })}
          </div>
        </div>
      )
    }

    // Regular text line
    return (
      <div key={index} className="text-foreground mb-1">
        {line}
      </div>
    )
  }

  return (
    <div className={`space-y-1 ${className}`}>
      {lines.map((line, index) => formatLine(line, index))}
    </div>
  )
}
