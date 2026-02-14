import React, { useState, useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, FileText, Check, Copy, Activity } from 'lucide-react'
import { useTLSStore } from '../../../../../store/tls-learning.store'
import { CryptoLogDisplay } from './CryptoLogDisplay'
import type { TraceEvent } from './CryptoLogDisplay'
import { KeyColumn } from './KeyOverview'

export const TLSNegotiationResults: React.FC = () => {
  const { results, clientConfig, serverConfig, addRunToHistory } = useTLSStore()
  const lastRecordedRef = useRef<string | null>(null)

  // Record run to history when simulation completes - MUST be before early return
  useEffect(() => {
    if (!results || results.status === 'idle') return

    // Parse events for recording
    const events: TraceEvent[] = (results.trace || []).map((t: Partial<TraceEvent>) => ({
      event: t.event || 'unknown',
      details: t.details || '',
      timestamp: t.timestamp,
      side: t.side ? t.side.toLowerCase() : 'unknown',
    }))

    // Check for success
    const connectionEvent = events.find(
      (e) => e.event === 'established' || (e.side === 'connection' && e.event !== 'error')
    )
    const errorEvent = events.find((e) => e.event === 'error')
    const isSuccess =
      (results.status === 'success' || connectionEvent) &&
      !errorEvent &&
      results.status !== 'failed'
    const negotiatedCipher = connectionEvent?.details?.match(/Negotiated: (.+)/)?.[1]

    // Calculate overhead
    let totalBytes = 0
    let handshakeBytes = 0
    let appDataBytes = 0
    let handshakeComplete = false
    events.forEach((e) => {
      if (e.event === 'handshake_done') handshakeComplete = true
      if (e.event === 'crypto_trace_state') {
        const match = e.details.match(/^dec (\d+)/)
        if (match) {
          const bytes = parseInt(match[1], 10)
          totalBytes += bytes
          if (!handshakeComplete) handshakeBytes += bytes
          else appDataBytes += bytes
        }
      }
    })

    // Create a unique key for this run to prevent duplicate recording
    const runKey = JSON.stringify({
      cipher: negotiatedCipher,
      totalBytes,
      timestamp: results.trace?.[0]?.details,
    })

    if (lastRecordedRef.current === runKey) return
    lastRecordedRef.current = runKey

    // Extract key exchange and signature from events
    const keyExchangeEvent = events.find((e) => e.details.includes('Key Exchange:'))
    const keyExchange = keyExchangeEvent?.details.match(/Key Exchange: (.+)/)?.[1] || 'Unknown'

    const sigEvent = events.find((e) => e.details.includes('Peer Signature Algorithm:'))
    const signature = sigEvent?.details.match(/Peer Signature Algorithm: (.+)/)?.[1] || 'Unknown'

    // Use the actual negotiated signature as the identity (signature from the peer certificate)
    // Format it nicely - SHA256 usually means RSA-PSS, otherwise use the algorithm name directly
    const formatSignature = (sig: string) => {
      if (sig === 'SHA256') return 'RSA-PSS'
      if (sig === 'SHA384') return 'RSA-PSS'
      if (sig === 'SHA512') return 'RSA-PSS'
      if (sig.includes('ecdsa')) return 'ECDSA'
      return sig.toUpperCase()
    }

    // Both client and server use the same signature type in the default certs
    const identity = formatSignature(signature)

    // Determine CA key type based on identity/signature
    // Default certs: RSA-PSS/ECDSA use RSA CA
    // ML-DSA uses matching ML-DSA CA level (44/65/87)
    // If mTLS is disabled (verifyClient is false), Client CA should be N/A
    const getCaType = (id: string) => {
      if (id.includes('ML-DSA-44')) return 'ML-DSA-44'
      if (id.includes('ML-DSA-65')) return 'ML-DSA-65'
      if (id.includes('ML-DSA-87')) return 'ML-DSA-87'
      if (id.includes('ML-DSA')) return 'ML-DSA-44' // Fallback
      if (id === 'RSA-PSS' || id === 'ECDSA') return 'RSA'
      return 'Unknown'
    }

    const serverCaKeyType = getCaType(identity)

    const clientCaKeyType = serverConfig.verifyClient ? serverCaKeyType : 'N/A'

    addRunToHistory({
      cipher: negotiatedCipher || 'Unknown',
      keyExchange,
      signature,
      clientIdentity: identity,
      serverIdentity: identity,
      clientCaKeyType,
      serverCaKeyType,
      totalBytes,
      handshakeBytes,
      appDataBytes,
      success: isSuccess ?? false,
    })
  }, [results, clientConfig, serverConfig, addRunToHistory])

  // Early return AFTER hooks
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

  // Certificate verification events
  const clientCertVerifyError = events.find(
    (e) => e.side === 'client' && e.event === 'cert_verify_error'
  )
  const serverCertVerifyError = events.find(
    (e) => e.side === 'server' && e.event === 'cert_verify_error'
  )
  const hasCertError = clientCertVerifyError || serverCertVerifyError

  // Success requires: explicit success status OR connection established AND no errors
  const isSuccess =
    (results.status === 'success' || connectionEvent) && !errorEvent && results.status !== 'failed'
  const negotiatedCipher = connectionEvent?.details?.match(/Negotiated: (.+)/)?.[1]

  // Calculate Protocol Overhead from crypto traces
  // Parse "dec XXX" from crypto_trace_state events to get total bytes
  const calculateProtocolOverhead = () => {
    let totalBytes = 0
    let handshakeBytes = 0
    let appDataBytes = 0
    let handshakeComplete = false

    events.forEach((e) => {
      if (e.event === 'handshake_done') {
        handshakeComplete = true
      }

      if (e.event === 'crypto_trace_state') {
        // Parse "dec XXX" format
        const match = e.details.match(/^dec (\d+)/)
        if (match) {
          const bytes = parseInt(match[1], 10)
          totalBytes += bytes
          if (!handshakeComplete) {
            handshakeBytes += bytes
          } else {
            appDataBytes += bytes
          }
        }
      }
    })

    return { totalBytes, handshakeBytes, appDataBytes }
  }

  const overhead = calculateProtocolOverhead()

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Status Banner */}
      <div
        className={clsx(
          'p-4 rounded-xl border flex flex-col gap-2',
          isSuccess
            ? 'bg-success/10 border-success/30 text-success'
            : 'bg-destructive/10 border-destructive/30 text-destructive'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                'w-3 h-3 rounded-full animate-pulse',
                isSuccess ? 'bg-success' : 'bg-destructive'
              )}
            />
            <span className="font-bold text-lg">
              {isSuccess ? 'Negotiation Successful' : 'Negotiation Failed'}
            </span>
          </div>
          {negotiatedCipher && (
            <div className="flex gap-2 text-sm">
              <span className="font-mono bg-background/50 px-3 py-1 rounded border border-border/50">
                Cipher: {negotiatedCipher}
              </span>
              {events
                .find((e) => e.details.includes('Key Exchange:'))
                ?.details.match(/Key Exchange: (.+)/)?.[1] && (
                <span className="font-mono bg-background/50 px-3 py-1 rounded border border-border/50">
                  Group:{' '}
                  {
                    events
                      .find((e) => e.details.includes('Key Exchange:'))
                      ?.details.match(/Key Exchange: (.+)/)?.[1]
                  }
                </span>
              )}
              {events
                .find((e) => e.details.includes('Peer Signature Algorithm:'))
                ?.details.match(/Peer Signature Algorithm: (.+)/)?.[1] && (
                <span className="font-mono bg-background/50 px-3 py-1 rounded border border-border/50">
                  Sig:{' '}
                  {(() => {
                    const raw =
                      events
                        .find((e) => e.details.includes('Peer Signature Algorithm:'))
                        ?.details.match(/Peer Signature Algorithm: (.+)/)?.[1] || ''
                    return raw
                  })()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Certificate Verification Status */}
        {(hasCertError || isSuccess) && (
          <div className="flex gap-4 text-sm pt-2 border-t border-current/20">
            {/* Server Cert Verification (by Client) */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">Server Cert:</span>
              {clientCertVerifyError ? (
                <span className="text-destructive font-medium text-xs">❌ Failed</span>
              ) : (
                <span className="text-success font-medium text-xs">✓ Verified</span>
              )}
            </div>

            {/* Client Cert Verification (by Server - mTLS) */}
            {(serverCertVerifyError || serverConfig.verifyClient) && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">Client Cert:</span>
                {serverCertVerifyError ? (
                  <span className="text-destructive font-medium text-xs">❌ Failed</span>
                ) : isSuccess ? (
                  <span className="text-success font-medium text-xs">✓ Verified</span>
                ) : (
                  <span className="text-warning font-medium text-xs">⚠ Not verified</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Certificate Error Details */}
        {hasCertError && (
          <div className="mt-1 text-xs font-mono bg-black/30 rounded p-2 text-destructive">
            {clientCertVerifyError && <div>Client: {clientCertVerifyError.details}</div>}
            {serverCertVerifyError && <div>Server: {serverCertVerifyError.details}</div>}
          </div>
        )}

        {/* Protocol Overhead - Total Data Exchanged */}
        {overhead.totalBytes > 0 && (
          <div className="flex gap-4 text-sm pt-2 border-t border-current/20">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">Total Data:</span>
              <span className="font-mono bg-background/50 px-2 py-0.5 rounded border border-border/50 text-xs font-bold">
                {(overhead.totalBytes / 1024).toFixed(2)} KB
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">Handshake:</span>
              <span className="font-mono bg-background/50 px-2 py-0.5 rounded border border-border/50 text-xs">
                {(overhead.handshakeBytes / 1024).toFixed(2)} KB
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">App Data:</span>
              <span className="font-mono bg-background/50 px-2 py-0.5 rounded border border-border/50 text-xs">
                {overhead.appDataBytes} B
              </span>
            </div>
          </div>
        )}

        {errorEvent && !isSuccess && !hasCertError && (
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
  const [view, setView] = useState<'protocol' | 'wire' | 'crypto'>('protocol')

  // Filter events for this side (include shared connection/system events)
  const myEvents = events.filter(
    (e) => e.side === side || e.side === 'connection' || e.side === 'system'
  )

  const borderColor = theme === 'blue' ? 'border-primary/30' : 'border-tertiary/30'
  const bgColor = theme === 'blue' ? 'bg-primary/10' : 'bg-tertiary/10'
  const textColor = theme === 'blue' ? 'text-primary' : 'text-tertiary'

  // 1. Wire Data: Raw encrypted bytes only (New Tab)
  const wireEvents = myEvents.filter((e) => e.event === 'wire_data')

  // 2. Crypto Ops: Internal trace details and secrets (Detailed Tab)
  const cryptoEvents = myEvents.filter(
    (e) => e.event.startsWith('crypto_trace_') || e.event === 'keylog'
  )

  // 3. Protocol Log: Handshakes, Alerts, Messages (High-level Tab)
  // Everything that isn't Wire Data or Crypto Ops matches the original "Protocol Log" scope
  const protocolEvents = myEvents.filter(
    (e) => !e.event.startsWith('crypto_trace_') && e.event !== 'keylog' && e.event !== 'wire_data'
  )

  const [copied, setCopied] = useState(false)

  const activeEvents =
    view === 'protocol' ? protocolEvents : view === 'wire' ? wireEvents : cryptoEvents

  const handleCopy = () => {
    const text = activeEvents
      .map(
        (e) =>
          '[' +
          (e.timestamp || '') +
          '] [' +
          e.side.toUpperCase() +
          '] ' +
          e.event +
          ': ' +
          e.details
      )
      .join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
          onClick={() => setView('wire')}
          className={clsx(
            'flex-1 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-r flex items-center justify-center gap-2',
            borderColor,
            view === 'wire'
              ? bgColor + ' text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Activity size={14} /> Wire Data
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
          <Lock size={14} /> Crypto Ops
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            handleCopy()
          }}
          className="px-3 py-3 hover:bg-muted/50 border-l transition-colors text-muted-foreground hover:text-foreground flex items-center justify-center"
          title="Copy Log"
        >
          {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
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
                  transition={{ delay: i * 0.05 }}
                  className="text-xs font-mono"
                >
                  <span className="text-muted-foreground opacity-50 mr-2">
                    {e.timestamp || '00:00:00'}
                  </span>
                  <span
                    className={clsx(
                      'uppercase font-bold mr-2',
                      e.event === 'error'
                        ? 'text-destructive'
                        : e.event === 'handshake_done'
                          ? 'text-success'
                          : textColor
                    )}
                  >
                    [{e.event}]
                  </span>
                  <span className="text-foreground/80 break-words">{e.details}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : view === 'wire' ? (
          <CryptoLogDisplay events={wireEvents} title="Raw Wire Data" />
        ) : (
          <CryptoLogDisplay events={cryptoEvents} title="Crypto Operations" />
        )}
      </div>
    </div>
  )
}
