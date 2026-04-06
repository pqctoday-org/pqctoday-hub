// SPDX-License-Identifier: GPL-3.0-only
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

  // Detect HelloRetryRequest
  const hrrEvent = events.find(
    (e) => e.event === 'hello_retry' || e.event === 'hello_retry_summary'
  )
  const roundTrips = events.find((e) => e.event === 'round_trips')
  const isHRR = !!hrrEvent

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
              {isHRR && (
                <p className="mt-1 text-status-warning">
                  HelloRetryRequest occurred — the server did not support the client&apos;s
                  initially preferred group
                  {keyExchange ? (
                    <>
                      {' '}
                      and retried using <strong className="text-foreground">{keyExchange}</strong>
                    </>
                  ) : null}
                  , adding an extra round trip ({roundTrips?.details || '2'}-RTT instead of 1-RTT).
                  To avoid HRR, make sure both sides list a common group (e.g. X25519) first.
                </p>
              )}
            </>
          ) : (
            <>
              {(() => {
                const certError = events.find((e) => e.event === 'cert_verify_error')
                const errorEvent = events.find((e) => e.event === 'error')
                const errorDetails = errorEvent?.details?.toLowerCase() ?? ''
                const noGroupMatch =
                  errorDetails.includes('no shared group') ||
                  errorDetails.includes('no supported groups') ||
                  errorDetails.includes('no protocols available')
                const noCipherMatch =
                  errorDetails.includes('no cipher') ||
                  errorDetails.includes('no shared cipher') ||
                  errorDetails.includes('no suitable cipher')

                return (
                  <div>
                    <p className="font-medium">The TLS handshake failed.</p>
                    {certError ? (
                      <p className="mt-1 text-status-error">
                        Certificate verification error — the server&apos;s certificate could not be
                        validated. Make sure the Trusted Root CA in the client panel matches the CA
                        that signed the server certificate.
                      </p>
                    ) : noGroupMatch ? (
                      <p className="mt-1 text-status-error">
                        No key exchange group in common — client and server have no shared group.
                        Add a common group (e.g. <strong>X25519</strong>) to both sides.
                      </p>
                    ) : noCipherMatch ? (
                      <p className="mt-1 text-status-error">
                        No cipher suite in common — client and server offered no matching ciphers.
                        Ensure both sides include at least one shared cipher (e.g.{' '}
                        <strong>TLS_AES_256_GCM_SHA384</strong>).
                      </p>
                    ) : (
                      <p className="mt-1 text-muted-foreground">
                        Check the Protocol Log tab below for detailed error messages.
                        {hrrEvent &&
                          ' A HelloRetryRequest occurred but the handshake still failed — the server may not support any of the offered groups.'}
                      </p>
                    )}
                  </div>
                )
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
