import React, { useState, useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { HANDSHAKE_KEM_OPTIONS, HANDSHAKE_SIG_OPTIONS, calculateHandshakeSizes } from '../constants'

const IPV6_MIN_MTU = 1280
const DTLS_RECORD_OVERHEAD = 13

export const DTLSHandshakeVisualizer: React.FC = () => {
  const [kemId, setKemId] = useState('x25519')
  const [sigId, setSigId] = useState('ecdsa-p256')

  const sizes = useMemo(() => calculateHandshakeSizes(kemId, sigId), [kemId, sigId])
  const classicalSizes = useMemo(() => calculateHandshakeSizes('x25519', 'ecdsa-p256'), [])

  const effectiveMTU = IPV6_MIN_MTU - DTLS_RECORD_OVERHEAD
  const fragmentCount = Math.ceil(sizes.totalBytes / effectiveMTU)
  const classicalFragments = Math.ceil(classicalSizes.totalBytes / effectiveMTU)
  const overheadPct = (
    ((sizes.totalBytes - classicalSizes.totalBytes) / classicalSizes.totalBytes) *
    100
  ).toFixed(0)
  const exceedsMTU = sizes.totalBytes > effectiveMTU

  const messages = [
    { label: 'ClientHello', bytes: sizes.clientHello, direction: 'right' as const },
    { label: 'ServerHello', bytes: sizes.serverHello, direction: 'left' as const },
    { label: 'EncryptedExtensions', bytes: sizes.encryptedExtensions, direction: 'left' as const },
    { label: 'Certificate', bytes: sizes.certificate, direction: 'left' as const },
    { label: 'CertificateVerify', bytes: sizes.certificateVerify, direction: 'left' as const },
    { label: 'Finished', bytes: sizes.finished, direction: 'left' as const },
  ]

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Configure a DTLS 1.3 handshake by selecting KEM and signature algorithms. Compare the total
        handshake size against classical baselines and observe the fragmentation impact.
      </p>

      {/* Algorithm Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel p-4">
          <div className="text-sm font-bold text-foreground mb-3">Key Exchange (KEM)</div>
          <div className="space-y-2">
            {HANDSHAKE_KEM_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setKemId(opt.id)}
                className={`w-full p-2 rounded-lg border text-left transition-colors text-sm ${
                  opt.id === kemId
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/30'
                }`}
              >
                <div className="font-medium">{opt.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {opt.category === 'classical'
                    ? 'Classical'
                    : opt.category === 'hybrid'
                      ? 'Hybrid'
                      : 'Post-Quantum'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel p-4">
          <div className="text-sm font-bold text-foreground mb-3">Authentication (Signature)</div>
          <div className="space-y-2">
            {HANDSHAKE_SIG_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSigId(opt.id)}
                className={`w-full p-2 rounded-lg border text-left transition-colors text-sm ${
                  opt.id === sigId
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/30'
                }`}
              >
                <div className="font-medium">{opt.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {opt.category === 'classical'
                    ? 'Classical'
                    : opt.category === 'hybrid'
                      ? 'Hybrid'
                      : 'Post-Quantum'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Handshake Flow */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-4">DTLS 1.3 Handshake Messages</div>
        <div className="space-y-2">
          {messages.map((msg) => {
            const pct = Math.max((msg.bytes / sizes.totalBytes) * 100, 3)
            const isLargest = msg.bytes === Math.max(...messages.map((m) => m.bytes))
            return (
              <div key={msg.label}>
                <div className="flex items-center justify-between text-[10px] mb-0.5">
                  <span className="text-muted-foreground flex items-center gap-1">
                    {msg.direction === 'right' ? 'Client \u2192 Server' : 'Server \u2192 Client'}
                    {' \u2014 '}
                    {msg.label}
                  </span>
                  <span className="font-mono text-foreground">{msg.bytes.toLocaleString()} B</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      isLargest ? 'bg-primary/70' : 'bg-success/50'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Total */}
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Total Handshake</span>
            <span className="text-lg font-bold font-mono text-primary">
              {sizes.totalBytes.toLocaleString()} B
            </span>
          </div>
        </div>
      </div>

      {/* Comparison Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <div className="text-[10px] text-muted-foreground">Classical Baseline</div>
          <div className="text-sm font-bold font-mono text-foreground">
            {classicalSizes.totalBytes.toLocaleString()} B
          </div>
          <div className="text-[10px] text-muted-foreground">X25519 + ECDSA P-256</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-primary/20">
          <div className="text-[10px] text-muted-foreground">Your Configuration</div>
          <div className="text-sm font-bold font-mono text-primary">
            {sizes.totalBytes.toLocaleString()} B
          </div>
          <div className="text-[10px] text-muted-foreground">
            {kemId === 'x25519' && sigId === 'ecdsa-p256'
              ? 'Same as baseline'
              : `+${overheadPct}% overhead`}
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <div className="text-[10px] text-muted-foreground">DTLS Fragments (1,280 B MTU)</div>
          <div className="text-sm font-bold font-mono text-foreground">
            {fragmentCount} fragments
          </div>
          <div className="text-[10px] text-muted-foreground">
            Classical: {classicalFragments} fragment{classicalFragments !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* MTU Warning */}
      {exceedsMTU && (
        <div className="flex items-start gap-3 bg-warning/10 rounded-lg p-4 border border-warning/30">
          <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-foreground">Fragmentation Required</div>
            <p className="text-xs text-muted-foreground mt-1">
              The handshake ({sizes.totalBytes.toLocaleString()} B) exceeds the IPv6 minimum MTU (
              {IPV6_MIN_MTU} B), requiring {fragmentCount} DTLS fragments. Each fragment is a
              potential point of failure on lossy wireless networks. Consider session resumption
              (PSK) to eliminate the certificate exchange on reconnection.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
