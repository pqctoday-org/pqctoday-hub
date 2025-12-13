import React, { useState } from 'react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Lock } from 'lucide-react'
import { useTLSStore } from '../../../../../store/tls-learning.store'
import { CryptoLogDisplay } from './CryptoLogDisplay'
import type { TraceEvent } from './CryptoLogDisplay'
import { KeyColumn } from './KeyOverview'

export const TLSNegotiationResults: React.FC = () => {
  const { results, clientConfig, serverConfig } = useTLSStore()
  // If no results, show placeholder
  if (!results) return null

  // Parse Trace
  const events: TraceEvent[] = (results.trace || []).map((t: Partial<TraceEvent>) => ({
    event: t.event || 'unknown',
    details: t.details || '',
    timestamp: t.timestamp,
    // Ensure side is lowercase
    side: t.side ? t.side.toLowerCase() : 'unknown',
  }))

  // Check for success/failure by looking for "established" or "error" events
  const connectionEvent = events.find(
    (e) => e.event === 'established' || (e.side === 'connection' && e.event !== 'error')
  )
  const errorEvent = events.find((e) => e.event === 'error')
  // Success requires: explicit success status OR connection established AND no errors
  const isSuccess =
    (results.status === 'success' || connectionEvent) && !errorEvent && results.status !== 'failed'
  const negotiatedCipher = connectionEvent?.details?.match(/Negotiated: (.+)/)?.[1]

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Status Banner */}
      <div
        className={clsx(
          'p-4 rounded-xl border flex items-center justify-between',
          isSuccess
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-destructive/10 border-destructive/30 text-destructive'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'w-3 h-3 rounded-full animate-pulse',
              isSuccess ? 'bg-green-500' : 'bg-destructive'
            )}
          />
          <span className="font-bold text-lg">
            {isSuccess ? 'Negotiation Successful' : 'Negotiation Failed'}
          </span>
        </div>
        {negotiatedCipher && (
          <span className="font-mono text-sm bg-background/50 px-3 py-1 rounded">
            {negotiatedCipher}
          </span>
        )}
        {errorEvent && !isSuccess && (
          <span className="font-mono text-sm text-destructive">
            {errorEvent.details.substring(0, 100)}
          </span>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-2 gap-6 flex-grow overflow-hidden">
        {/* LEFT COLUMN: Client Side */}
        <div className="flex flex-col gap-6 h-full overflow-hidden">
          {/* 1. Keys */}
          <div className="shrink-0">
            <KeyColumn
              title="Client Keys"
              config={clientConfig}
              trace={events}
              side="client"
              color="blue"
            />
          </div>
          {/* 2. Logs */}
          <div className="flex-grow min-h-0">
            <LogColumn side="client" events={events} theme="blue" />
          </div>
        </div>

        {/* RIGHT COLUMN: Server Side */}
        <div className="flex flex-col gap-6 h-full overflow-hidden">
          {/* 1. Keys */}
          <div className="shrink-0">
            <KeyColumn
              title="Server Keys"
              config={serverConfig}
              trace={events}
              side="server"
              color="purple"
            />
          </div>
          {/* 2. Logs */}
          <div className="flex-grow min-h-0">
            <LogColumn side="server" events={events} theme="purple" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Internal component for each side's column (Logs)
const LogColumn = ({
  side,
  events,
  theme,
}: {
  side: 'client' | 'server'
  events: TraceEvent[]
  theme: 'blue' | 'purple'
}) => {
  const [view, setView] = useState<'protocol' | 'crypto'>('protocol')

  // Filter events for this side
  const myEvents = events.filter((e) => e.side === side)

  const borderColor = theme === 'blue' ? 'border-primary/30' : 'border-tertiary/30'
  const bgColor = theme === 'blue' ? 'bg-primary/10' : 'bg-tertiary/10'
  const textColor = theme === 'blue' ? 'text-primary' : 'text-tertiary'

  // Protocol events are generic 'info', 'error' etc, plus we might want to see 'handshake'
  const protocolEvents = myEvents.filter(
    (e) => !e.event.startsWith('crypto_trace_') && e.event !== 'keylog'
  )
  const cryptoEvents = myEvents.filter(
    (e) => e.event.startsWith('crypto_trace_') || e.event === 'keylog'
  )

  return (
    <div
      className={clsx(
        'flex flex-col h-full rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden',
        borderColor
      )}
    >
      {/* Header / Tabs */}
      <div className={clsx('flex items-center border-b', borderColor)}>
        <button
          onClick={() => setView('protocol')}
          className={clsx(
            'flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-r flex items-center justify-center gap-2',
            borderColor,
            view === 'protocol'
              ? bgColor + ' text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <FileText size={14} /> Protocol Log
        </button>
        <button
          onClick={() => setView('crypto')}
          className={clsx(
            'flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2',
            view === 'crypto'
              ? bgColor + ' text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Lock size={14} /> Crypto Log
        </button>
      </div>

      <div className="flex-grow overflow-auto relative">
        {view === 'protocol' ? (
          <div className="p-4 space-y-3">
            {protocolEvents.length === 0 && (
              <div className="text-muted-foreground italic text-center text-xs py-4">
                No protocol events.
              </div>
            )}
            <AnimatePresence>
              {protocolEvents.map((e, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex gap-3 group"
                >
                  <div className="flex flex-col items-center min-w-[24px]">
                    <div
                      className={clsx(
                        'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border',
                        side === 'client'
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-tertiary/20 border-tertiary text-tertiary'
                      )}
                    >
                      {side === 'client' ? 'C' : 'S'}
                    </div>
                    {i < protocolEvents.length - 1 && (
                      <div className="w-px h-full bg-border my-1 min-h-[10px]" />
                    )}
                  </div>
                  <div className="flex-grow pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-muted-foreground text-[10px] font-mono">
                        [{e.timestamp || '0.00'}]
                      </span>
                      <span
                        className={clsx(
                          'text-[10px] font-bold uppercase tracking-wider',
                          textColor
                        )}
                      >
                        {e.event.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div
                      className={clsx(
                        'p-2 bg-muted/50 rounded border font-mono text-xs break-all transition-colors',
                        e.event === 'error'
                          ? 'border-destructive/50 text-destructive'
                          : 'border-white/5 text-foreground group-hover:border-white/20'
                      )}
                    >
                      {e.details}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <CryptoLogDisplay events={cryptoEvents} title="" />
        )}
      </div>
    </div>
  )
}
