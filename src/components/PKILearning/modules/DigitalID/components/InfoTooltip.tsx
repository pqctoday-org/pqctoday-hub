import React, { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { HelpCircle } from 'lucide-react'
import { EUDI_GLOSSARY } from '../constants'

interface InfoTooltipProps {
  term: keyof typeof EUDI_GLOSSARY
  className?: string
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ term, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // eslint-disable-next-line security/detect-object-injection
  const definition = EUDI_GLOSSARY[term]

  const open = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setTooltipStyle({ top: rect.bottom + 8, left: rect.left + rect.width / 2 })
    }
    setIsVisible(true)
  }, [])

  const close = useCallback(() => setIsVisible(false), [])

  useEffect(() => {
    if (!isVisible) return
    const handleScroll = () => close()
    window.addEventListener('scroll', handleScroll, { capture: true })
    return () => window.removeEventListener('scroll', handleScroll, { capture: true })
  }, [isVisible, close])

  return (
    <span className={`inline ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        aria-label={`Information about ${term}`}
      >
        <span className="underline decoration-dotted">{term}</span>
        <HelpCircle size={14} className="ml-1" />
      </button>

      {isVisible &&
        tooltipStyle &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              zIndex: 9999,
              transform: 'translateX(-50%)',
              ...tooltipStyle,
            }}
            className="w-64 p-3 text-sm bg-background border border-border rounded-lg shadow-lg print:hidden"
            role="tooltip"
          >
            <div className="font-semibold text-primary mb-1">{term}</div>
            <div className="text-muted-foreground">{definition}</div>
          </div>,
          document.body
        )}
    </span>
  )
}
