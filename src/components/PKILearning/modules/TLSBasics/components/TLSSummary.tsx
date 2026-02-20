import React from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import type { TraceEvent } from './CryptoLogDisplay'

interface TLSSummaryProps {
  events: TraceEvent[]
  status: 'success' | 'failed' | 'error' | 'idle'
  mTLSEnabled: boolean
}

export const TLSSummary: React.FC<TLSSummaryProps> = ({ events, status, mTLSEnabled }) => {
  if (status === 'idle') return null

  // Extract negotiated parameters
  const connectionEvent = events.find(
    (e) => e.event === 'established' || (e.side === 'connection' && e.event !== 'error')
  )
  const cipher = connectionEvent?.details?.match(/Negotiated: (.+)/)?.[1]
  const keyExchangeEvent = events.find((e) => e.details.includes('Key Exchange:'))
  const keyExchange = keyExchangeEvent?.details.match(/Key Exchange: (.+)/)?.[1]
  const sigEvent = events.find((e) => e.details.includes('Peer Signature Algorithm:'))
  const signature = sigEvent?.details.match(/Peer Signature Algorithm: (.+)/)?.[1]

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

  // Classify key exchange
  const isHybrid =
    keyExchange &&
    keyExchange.toLowerCase().includes('mlkem') &&
    (keyExchange.toLowerCase().includes('x25519') || keyExchange.toLowerCase().includes('secp'))
  const isPQC =
    keyExchange &&
    !isHybrid &&
    (keyExchange.toLowerCase().includes('mlkem') || keyExchange.toLowerCase().includes('kyber'))

  // Format signature name
  const formatSig = (sig: string) => {
    if (sig === 'SHA256' || sig === 'SHA384' || sig === 'SHA512') return 'RSA-PSS'
    if (sig.toLowerCase().includes('ecdsa')) return 'ECDSA'
    return sig.toUpperCase()
  }

  const isSuccess = status === 'success'

  return (
    <div className="glass-panel p-4 mb-4 border-l-4 border-l-primary/50">
      <div className="flex items-start gap-3">
        {isSuccess ? (
          <CheckCircle size={20} className="text-success shrink-0 mt-0.5" />
        ) : (
          <XCircle size={20} className="text-destructive shrink-0 mt-0.5" />
        )}
        <div className="text-sm text-foreground/80 leading-relaxed">
          {isSuccess ? (
            <>
              <p>
                Your TLS 1.3 handshake completed successfully.
                {cipher && (
                  <>
                    {' '}
                    The client and server negotiated{' '}
                    <strong className="text-foreground">{cipher}</strong>
                  </>
                )}
                {keyExchange && (
                  <>
                    {' '}
                    using <strong className="text-foreground">{keyExchange}</strong> key exchange
                  </>
                )}
                {signature && (
                  <>
                    . The server authenticated with{' '}
                    <strong className="text-foreground">{formatSig(signature)}</strong>
                  </>
                )}
                .
              </p>
              {totalBytes > 0 && (
                <p className="mt-1">
                  The handshake exchanged{' '}
                  <strong className="text-foreground">
                    {(handshakeBytes / 1024).toFixed(2)} KB
                  </strong>{' '}
                  of data.
                  {appDataBytes > 0 && (
                    <>
                      {' '}
                      Application data used{' '}
                      <strong className="text-foreground">{appDataBytes} bytes</strong>.
                    </>
                  )}
                </p>
              )}
              {isHybrid && (
                <p className="mt-1 text-warning">
                  You used hybrid key exchange, combining classical ECDH with post-quantum ML-KEM
                  for security against both classical and quantum attacks.
                </p>
              )}
              {isPQC && (
                <p className="mt-1 text-success">
                  You used a pure post-quantum key exchange (ML-KEM), providing quantum resistance
                  without a classical fallback.
                </p>
              )}
              {mTLSEnabled && (
                <p className="mt-1 text-primary">
                  Mutual TLS was enabled — both client and server authenticated with certificates.
                </p>
              )}
            </>
          ) : (
            <p>
              The TLS handshake failed.{' '}
              {events.find((e) => e.event === 'cert_verify_error')
                ? 'A certificate verification error occurred. Check that the trusted Root CA matches the peer certificate.'
                : 'Check the protocol log below for details on the negotiation failure.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
