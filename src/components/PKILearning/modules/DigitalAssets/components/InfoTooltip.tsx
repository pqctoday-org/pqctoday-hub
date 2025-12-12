import React, { useState } from 'react'
import { Info } from 'lucide-react'
import { CRYPTO_TOOLTIPS, type CryptoTooltipKey } from '../utils/cryptoConstants'

interface InfoTooltipProps {
  term: CryptoTooltipKey
  className?: string
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ term, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  // eslint-disable-next-line security/detect-object-injection
  const tooltip = CRYPTO_TOOLTIPS[term]

  if (!tooltip) return null

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
        aria-label={`Information about ${tooltip.title}`}
      >
        <span className="font-mono text-sm font-medium">{tooltip.title}</span>
        <Info size={14} className="text-muted-foreground" />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-64 sm:w-80 p-3 mt-2 bg-background border border-border rounded-lg shadow-lg left-1/2 -translate-x-1/2"
          role="tooltip"
        >
          <div className="text-xs text-foreground leading-relaxed">{tooltip.description}</div>
          {/* Arrow */}
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-background border-l border-t border-border rotate-45"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  )
}

interface InlineTooltipProps {
  children: React.ReactNode
  content: string
  className?: string
  align?: 'left' | 'center' | 'right'
}

export const InlineTooltip: React.FC<InlineTooltipProps> = ({
  children,
  content,
  className = '',
  align = 'center',
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const alignClasses = {
    left: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-0',
  }

  const arrowClasses = {
    left: 'left-4',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-4',
  }

  // eslint-disable-next-line security/detect-object-injection
  const alignClass = alignClasses[align]
  // eslint-disable-next-line security/detect-object-injection
  const arrowClass = arrowClasses[align]

  return (
    <div className={`relative inline-block ${className}`}>
      <span
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
        role="button"
        tabIndex={0}
        className="cursor-help border-b border-dotted border-muted-foreground"
      >
        {children}
      </span>

      {isOpen && (
        <div
          className={`absolute z-50 w-48 sm:w-64 p-2 mt-2 bg-background border border-border rounded-lg shadow-lg text-xs text-foreground ${alignClass}`}
          role="tooltip"
        >
          {content}
          {/* Arrow */}
          <div
            className={`absolute -top-2 w-4 h-4 bg-background border-l border-t border-border rotate-45 ${arrowClass}`}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  )
}
