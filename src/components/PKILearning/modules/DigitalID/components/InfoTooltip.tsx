import React, { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { EUDI_GLOSSARY } from '../constants'

interface InfoTooltipProps {
  term: keyof typeof EUDI_GLOSSARY
  className?: string
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ term, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false)

  // eslint-disable-next-line security/detect-object-injection
  const definition = EUDI_GLOSSARY[term]

  return (
    <span className={`relative inline-block ${className}`}>
      <button
        type="button"
        className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        aria-label={`Information about ${term}`}
      >
        <span className="underline decoration-dotted">{term}</span>
        <HelpCircle size={14} className="ml-1" />
      </button>

      {isVisible && (
        <div
          className="absolute z-50 w-64 p-3 mt-2 text-sm bg-background border border-white/20 rounded-lg shadow-lg"
          role="tooltip"
        >
          <div className="font-semibold text-primary mb-1">{term}</div>
          <div className="text-muted-foreground">{definition}</div>
        </div>
      )}
    </span>
  )
}
