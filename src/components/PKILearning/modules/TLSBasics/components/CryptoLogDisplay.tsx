import React, { useState } from 'react'
import {
  Settings,
  FileText,
  Check,
  Shield,
  Lock,
  Copy,
  ArrowRight,
  ArrowLeft,
  Zap,
  AlertTriangle,
  Activity,
} from 'lucide-react'
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

export const CryptoLogDisplay: React.FC<Props> = ({ events, title = 'Wire Data' }) => {
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

  // TLS 1.3 Record Parser for Wire Data
  const getWireDetails = (
    hexData: string
  ): { type: string; badge: string; color: string; isEncrypted: boolean } | null => {
    // Expected Format: "16 03 01 ..." (Hex Dump)
    const clean = hexData.replace(/\s/g, '').slice(0, 20)
    const typeByte = parseInt(clean.substring(0, 2), 16)
    // const version = clean.substring(2, 6) // Record Layer Version (usually 0303 in TLS 1.3 compat)

    // RFC 8446 Record Types
    if (typeByte === 0x17)
      return {
        type: 'Application Data (TLV 1.3)',
        badge: 'ENCRYPTED',
        color: 'text-purple-400',
        isEncrypted: true,
      }
    if (typeByte === 0x16)
      return {
        type: 'Handshake Record',
        badge: 'CLEARTEXT',
        color: 'text-blue-400',
        isEncrypted: false,
      }
    if (typeByte === 0x15)
      return { type: 'Alert Record', badge: 'ALERT', color: 'text-red-400', isEncrypted: false }
    if (typeByte === 0x14)
      return {
        type: 'ChangeCipherSpec',
        badge: 'COMPAT',
        color: 'text-yellow-400',
        isEncrypted: false,
      }

    return null
  }

  // TLS 1.3 Handshake Message Type detection for App/Decrypted Logs
  const getTLSMessageType = (
    hexData: string
  ): { type: string; color: string; isEncrypted?: boolean } | null => {
    if (hexData.includes('Hello Server') || hexData.includes('Hello Client')) {
      return { type: '🔐 Encrypted App Data', color: 'text-success', isEncrypted: true }
    }
    if (hexData.includes('0000 - 01 00') && hexData.length < 100) {
      return { type: 'close_notify Alert', color: 'text-warning' }
    }
    const match = hexData.match(/0000\s*-\s*([0-9a-fA-F]{2})/)
    if (!match) return null
    const firstByte = parseInt(match[1], 16)
    const messageTypes: Record<number, { type: string; color: string; isEncrypted?: boolean }> = {
      0x01: { type: 'ClientHello', color: 'text-primary' },
      0x02: { type: 'ServerHello', color: 'text-tertiary' },
      0x04: { type: 'NewSessionTicket', color: 'text-muted-foreground', isEncrypted: true },
      0x08: { type: 'EncryptedExtensions', color: 'text-tertiary', isEncrypted: true },
      0x0b: { type: 'Certificate', color: 'text-success' },
      0x0d: { type: 'CertificateRequest', color: 'text-warning' },
      0x0f: { type: 'CertificateVerify', color: 'text-success' },
      0x14: { type: 'Finished', color: 'text-primary', isEncrypted: true },
    }
    if (firstByte === 0x20) return { type: '🔐 App Data', color: 'text-success', isEncrypted: true }
    return messageTypes[firstByte] || null
  }

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

    // For crypto_trace_state with hex dumps, try to detect TLS message type
    if (type === 'crypto_trace_state' && details.includes('0000 -')) {
      const msgType = getTLSMessageType(details)
      return (
        <div>
          {msgType && (
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded border mb-1 inline-block font-bold ${
                msgType.isEncrypted
                  ? 'bg-success/20 border-success/50 text-success'
                  : `bg-muted border-border ${msgType.color}`
              }`}
            >
              {msgType.type}
            </span>
          )}
          <pre className="font-mono text-[10px] whitespace-pre-wrap break-all text-muted-foreground bg-slate-900/40 p-2 rounded">
            {details}
          </pre>
        </div>
      )
    }

    // New format for Internal Buffers (Init/Coder/Key/Data)
    // Distinguish from Wire Data
    const isInternalDump = type.includes('crypto_trace') || type === 'keylog'

    if (isHex && isInternalDump) {
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
            <span className="text-muted-foreground select-none opacity-50">
              {i.toString(16).padStart(4, '0')}
            </span>
            <span className="text-orange-400/80">{hexPart}</span>
            <span className="text-muted-foreground opacity-50 border-l border-border pl-2 border-orange-500/20">
              {asciiPart}
            </span>
          </div>
        )
      }

      return (
        <div className="font-mono text-[10px] whitespace-pre bg-orange-950/20 p-2 rounded border border-orange-500/20">
          <div className="text-[9px] text-orange-400 font-bold mb-1 uppercase opacity-70">
            Internal OpenSSL Buffer
          </div>
          {rows}
        </div>
      )
    }

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
            <span className="text-muted-foreground select-none opacity-50">
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

    // Default Fallback
    return (
      <pre className="font-mono text-[10px] whitespace-pre-wrap break-all text-muted-foreground">
        {details}
      </pre>
    )
  }

  const getIcon = (type: string) => {
    if (type === 'keylog') return <Lock size={14} className="text-warning" />
    if (type === 'wire_data') return <Activity size={14} className="text-purple-400" />
    if (type === 'message_sent') return <ArrowRight size={14} className="text-success" />
    if (type === 'message_received') return <ArrowLeft size={14} className="text-tertiary" />
    if (type === 'handshake_state' || type === 'handshake_start' || type === 'handshake_done')
      return <Zap size={14} className="text-primary" />
    if (type === 'alert') return <AlertTriangle size={14} className="text-destructive" />
    if (type.includes('provider')) return <Settings size={14} className="text-cyan-400" />
    if (type.includes('evp')) return <Zap size={14} className="text-indigo-400" />
    if (type.includes('data')) return <FileText size={14} className="text-primary" />
    if (type.includes('state')) return <Shield size={14} className="text-success" />
    return <Settings size={14} className="text-muted-foreground" />
  }

  // Get semantic badge for event type
  const getEventBadge = (type: string) => {
    if (type === 'wire_data')
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold">
          WIRE
        </span>
      )
    if (type === 'handshake_start')
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">
          START
        </span>
      )
    if (type === 'handshake_done')
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-success/20 text-success font-bold">
          DONE
        </span>
      )
    if (type === 'handshake_state')
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">STATE</span>
      )
    if (type === 'message_sent')
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-success/20 text-success font-bold">
          TX
        </span>
      )
    if (type === 'message_received')
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-tertiary/20 text-tertiary font-bold">
          RX
        </span>
      )
    if (type === 'alert')
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-bold">
          ALERT
        </span>
      )
    if (type === 'keylog')
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-warning/20 text-warning font-bold">
          SECRET
        </span>
      )
    if (type.includes('crypto_trace_provider'))
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold">
          PROVIDER CONF
        </span>
      )
    if (type.includes('crypto_trace_evp'))
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold">
          EVP OP
        </span>
      )
    if (type.includes('crypto_trace_coder'))
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold">
          CODEC
        </span>
      )
    if (type.includes('crypto_trace_init'))
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400 font-bold">
          INIT
        </span>
      )
    if (type.includes('crypto_trace'))
      return (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400/70 font-bold">
          INTERNAL
        </span>
      )
    return null
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
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase text-muted-foreground">
                      {evt.event === 'wire_data'
                        ? 'RAW PACKET'
                        : evt.event.replace('crypto_trace_', '').replace(/_/g, ' ')}
                    </span>
                    {(evt.event === 'wire_data' &&
                      (() => {
                        const info = getWireDetails(evt.details)
                        if (info) {
                          return (
                            <>
                              <span
                                className={clsx(
                                  'text-[9px] px-1.5 py-0.5 rounded font-bold uppercase',
                                  info.isEncrypted
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'bg-blue-500/20 text-blue-400'
                                )}
                              >
                                {info.badge}
                              </span>
                              <span className="text-[10px] text-muted-foreground">{info.type}</span>
                            </>
                          )
                        }
                        return getEventBadge(evt.event)
                      })()) ||
                      getEventBadge(evt.event)}
                  </div>
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
