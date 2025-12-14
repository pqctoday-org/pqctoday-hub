import React, { useState } from 'react'
import { Settings, FileText, Check, Shield, Lock, Copy } from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

export interface TraceEvent {
  side: string
  event: string
  details: string
  timestamp?: string
}

interface Props {
  events: TraceEvent[]
  title?: string
}

export const CryptoLogDisplay: React.FC<Props> = ({ events, title }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [copied, setCopied] = useState(false)

  // Filter events
  const filteredEvents = events.filter((evt) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase().replace(/\s/g, '')
    const content = evt.details.toLowerCase().replace(/\s/g, '')
    const type = evt.event.toLowerCase()
    return content.includes(search) || type.includes(search)
  })

  const formatDetails = (details: string, type: string) => {
    // Simple hex dump formatting or key-value highlighting
    if (type === 'keylog') {
      const parts = details.split(' ')
      return (
        <div className="font-mono text-xs">
          <span className="text-warning font-bold">{parts[0]}</span>{' '}
          <span className="text-primary">{parts[1]}</span>{' '}
          <span className="text-success break-all">{parts.slice(2).join(' ')}</span>
        </div>
      )
    }

    // Formatter for Hex Data (clear/encrypted)
    // Check if it's a long hex string (common in crypto traces)
    // We assume 'details' is the content string.
    // If it contains "Length: X", we might want to skip or parse.
    // But our C trace usually sends the hex string directly or specific messages.

    // Simple Hex+ASCII viewer
    const isHex = /^[0-9A-Fa-f\s]+$/.test(details) && details.length > 20

    if (isHex || type.includes('data')) {
      // Clean spaces if any
      const cleanHex = details.replace(/\s/g, '')
      const rows = []
      for (let i = 0; i < cleanHex.length; i += 32) {
        const chunk = cleanHex.slice(i, i + 32)
        const bytes = []
        const ascii = []

        for (let j = 0; j < chunk.length; j += 2) {
          const byteHex = chunk.slice(j, j + 2)
          const byteVal = parseInt(byteHex, 16)
          bytes.push(byteHex)
          ascii.push(byteVal >= 32 && byteVal <= 126 ? String.fromCharCode(byteVal) : '.')
        }

        // Pad last row
        const hexPart = bytes.join(' ').padEnd(47, ' ')
        const asciiPart = ascii.join('')

        rows.push(
          <div key={i} className="flex gap-4">
            <span className="text-muted-foreground select-none">
              {i.toString(16).padStart(4, '0')}
            </span>
            <span className="text-primary">{hexPart}</span>
            <span className="text-warning opacity-70 border-l border-border pl-2">{asciiPart}</span>
          </div>
        )
      }

      return (
        <div className="font-mono text-[10px] whitespace-pre bg-muted/50 p-2 rounded border border-border">
          {rows}
        </div>
      )
    }

    return (
      <pre className="font-mono text-[10px] whitespace-pre-wrap break-all text-muted-foreground">
        {details}
      </pre>
    )
  }

  const getIcon = (type: string) => {
    if (type === 'keylog') return <Lock size={14} className="text-warning" />
    if (type.includes('data')) return <FileText size={14} className="text-primary" />
    if (type.includes('state')) return <Shield size={14} className="text-success" />
    return <Settings size={14} className="text-muted-foreground" />
  }

  const handleCopy = () => {
    const text = filteredEvents
      .map((e) => '[' + e.side.toUpperCase() + '] ' + e.event + ': ' + e.details)
      .join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // This part of the diff seems to belong to a parent component or a different context.
  // I'm integrating the button changes into the existing CryptoLogDisplay header.
  // The `view` state and `handleCopyProtocol` are not defined in this component,
  // so I'm assuming the user wants to replace the existing copy button with the new structure.
  // Given the context, I'll assume the `Lock` icon is for the main crypto log copy,
  // and the `view === 'protocol'` part is a separate feature not directly in this component.

  return (
    <div className="flex flex-col h-full">
      {title && (
        <div className="shrink-0 p-2 border-b border-border bg-background/50 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
              {title}
            </h3>

            {/* Search Input - Integrated in Header */}
            <div className="relative group flex-grow max-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <Settings
                  size={12}
                  className="text-muted-foreground group-focus-within:text-primary transition-colors"
                />
              </div>
              <input
                type="text"
                placeholder="Find (Hex)..."
                className="block w-full pl-7 pr-2 py-1 bg-muted border border-border rounded text-[10px] text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono h-6"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors ml-1"
              title="Copy Log"
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      )}

      <div className="flex-grow overflow-auto p-4 space-y-3">
        {events.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">No logs recorded.</div>
        )}

        {events.length > 0 && filteredEvents.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">No matches found.</div>
        )}

        <AnimatePresence>
          {filteredEvents.map((evt: TraceEvent, idx: number) => (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ delay: idx * 0.02 }}
              key={idx}
              className="flex gap-3 text-sm group"
            >
              <div className="mt-1 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                {getIcon(evt.event)}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs uppercase text-muted-foreground">
                    {evt.event.replace('crypto_trace_', '').replace(/_/g, ' ')}
                  </span>
                  <span
                    className={clsx(
                      'text-[10px] px-1.5 py-0.5 rounded border',
                      evt.side === 'client'
                        ? 'border-primary/30 text-primary'
                        : evt.side === 'server'
                          ? 'border-tertiary/30 text-tertiary'
                          : 'border-border text-muted-foreground'
                    )}
                  >
                    {evt.side}
                  </span>
                </div>
                <div className="bg-muted/30 rounded border border-border p-2 overflow-x-auto">
                  {formatDetails(evt.details, evt.event)}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
