import React, { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'
import { CRYPTO_TOOLTIPS, type CryptoTooltipKey } from '../utils/cryptoConstants'

interface InfoTooltipProps {
  term: CryptoTooltipKey
  className?: string
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ term, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  // eslint-disable-next-line security/detect-object-injection
  const tooltip = CRYPTO_TOOLTIPS[term]

  const open = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setTooltipStyle({ top: rect.bottom + 8, left: rect.left + rect.width / 2 })
    }
    setIsOpen(true)
  }, [])

  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (!isOpen) return
    const handleScroll = () => close()
    window.addEventListener('scroll', handleScroll, { capture: true })
    return () => window.removeEventListener('scroll', handleScroll, { capture: true })
  }, [isOpen, close])

  if (!tooltip) return null

  return (
    <span className={`inline ${className}`}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen((prev) => !prev)}
        onMouseEnter={open}
        onMouseLeave={close}
        className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
        aria-label={`Information about ${tooltip.title}`}
      >
        <span className="font-mono text-sm font-medium">{tooltip.title}</span>
        <Info size={14} className="text-muted-foreground" />
      </button>

      {isOpen &&
        tooltipStyle &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              zIndex: 9999,
              transform: 'translateX(-50%)',
              ...tooltipStyle,
            }}
            className="w-64 sm:w-80 p-3 bg-background border border-border rounded-lg shadow-lg print:hidden"
            role="tooltip"
          >
            <div className="text-xs text-foreground leading-relaxed">{tooltip.description}</div>
          </div>,
          document.body
        )}
    </span>
  )
}

interface InlineTooltipProps {
  children: React.ReactNode
  content: string
  className?: string
}

export const InlineTooltip: React.FC<InlineTooltipProps> = ({
  children,
  content,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)

  const open = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setTooltipStyle({ top: rect.bottom + 8, left: rect.left + rect.width / 2 })
    }
    setIsOpen(true)
  }, [])

  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (!isOpen) return
    const handleScroll = () => close()
    window.addEventListener('scroll', handleScroll, { capture: true })
    return () => window.removeEventListener('scroll', handleScroll, { capture: true })
  }, [isOpen, close])

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={open}
        onMouseLeave={close}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen((prev) => !prev)
          }
        }}
        role="button"
        tabIndex={0}
        className={`cursor-help border-b border-dotted border-muted-foreground ${className}`}
      >
        {children}
      </span>

      {isOpen &&
        tooltipStyle &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              zIndex: 9999,
              transform: 'translateX(-50%)',
              ...tooltipStyle,
            }}
            className="w-48 sm:w-64 p-2 bg-background border border-border rounded-lg shadow-lg text-xs text-foreground print:hidden"
            role="tooltip"
          >
            {content}
          </div>,
          document.body
        )}
    </>
  )
}
