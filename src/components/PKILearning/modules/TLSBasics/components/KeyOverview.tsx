import React from 'react'
import { clsx } from 'clsx'
import { Key, Shield, Lock, Zap, HelpCircle } from 'lucide-react'
import type { TraceEvent } from './CryptoLogDisplay'
import type { TLSConfig } from '../../../../../store/tls-learning.store'

interface KeyColumnProps {
  title: string
  config: TLSConfig
  trace: TraceEvent[]
  side: 'client' | 'server'
  color: 'blue' | 'purple'
}

const SECRET_DESCRIPTIONS: Record<string, string> = {
  CLIENT_HANDSHAKE_TRAFFIC_SECRET: 'Encrypts handshake messages sent by the client',
  SERVER_HANDSHAKE_TRAFFIC_SECRET: 'Encrypts handshake messages sent by the server',
  CLIENT_TRAFFIC_SECRET_0: 'Encrypts application data sent by the client',
  SERVER_TRAFFIC_SECRET_0: 'Encrypts application data sent by the server',
  EXPORTER_SECRET: 'Derived master secret for exporting key material (RFC 5705)',
}

// Helper to categorize key exchange algorithm
const getKeyExchangeType = (algorithm: string): 'classical' | 'pqc' | 'hybrid' => {
  const lower = algorithm.toLowerCase()
  // Hybrid patterns (contain both classical and PQC parts)
  if (lower.includes('mlkem') && (lower.includes('x25519') || lower.includes('secp'))) {
    return 'hybrid'
  }
  // PQC patterns
  if (lower.includes('mlkem') || lower.includes('kyber') || lower.includes('kem')) {
    return 'pqc'
  }
  // Everything else is classical
  return 'classical'
}

const KeyExchangeBadge: React.FC<{ algorithm: string }> = ({ algorithm }) => {
  const type = getKeyExchangeType(algorithm)

  const colors = {
    classical: 'bg-primary/20 border-primary/50 text-primary',
    pqc: 'bg-success/20 border-success/50 text-success',
    hybrid: 'bg-warning/20 border-warning/50 text-warning',
  }

  const labels = {
    classical: 'Classical',
    pqc: 'PQC',
    hybrid: 'Hybrid',
  }

  return (
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line security/detect-object-injection -- type is a fixed union from getKeyExchangeType() */}
      <span className={clsx('text-xs px-2 py-0.5 rounded border font-bold', colors[type])}>
        {/* eslint-disable-next-line security/detect-object-injection -- type is a fixed union from getKeyExchangeType() */}
        {labels[type]}
      </span>
      <span className="font-mono text-xs text-foreground">{algorithm}</span>
    </div>
  )
}

export const KeyColumn: React.FC<KeyColumnProps> = ({ title, config, trace, side, color }) => {
  const borderColor = color === 'blue' ? 'border-primary/30' : 'border-tertiary/30'
  const textColor = color === 'blue' ? 'text-primary' : 'text-tertiary'
  const bgColor = color === 'blue' ? 'bg-primary/5' : 'bg-tertiary/5'

  // Extract key exchange algorithm from trace
  const keyExchangeEvent = trace.find((t) => t.event === 'key_exchange')
  const keyExchangeAlgorithm = keyExchangeEvent?.details.replace('Key Exchange: ', '') || null

  // Extract secrets from keylog events for this side
  // Note: C code now properly attributes keylogs via SSL ex_data
  const secrets = trace
    .filter((t) => t.event === 'keylog' && t.side === side)
    .map((t) => {
      const parts = t.details.split(' ')
      if (parts.length < 3) return null
      return {
        label: parts[0],
        random: parts[1],
        secret: parts.slice(2).join(' '),
      }
    })
    .filter(Boolean) as { label: string; random: string; secret: string }[]

  // Filter secrets to only show the ones relevant for the specific panel
  // Client Panel: CLIENT_ keys and EXPORTER_SECRET
  // Server Panel: SERVER_ keys and EXPORTER_SECRET
  const filteredSecrets = secrets.filter((s) => {
    if (s.label === 'EXPORTER_SECRET') return true
    if (side === 'client') return s.label.startsWith('CLIENT_')
    if (side === 'server') return s.label.startsWith('SERVER_')
    return true
  })

  return (
    <div
      className={clsx(
        'flex flex-col rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden',
        borderColor
      )}
    >
      {/* Header */}
      <div className={clsx('p-3 border-b flex items-center justify-between', borderColor, bgColor)}>
        <h3
          className={clsx(
            'font-bold uppercase tracking-wider text-sm flex items-center gap-2',
            textColor
          )}
        >
          <Key size={16} /> {title}
        </h3>
      </div>

      <div className="flex-grow overflow-auto p-4 space-y-6">
        {/* Key Exchange Info - NEW SECTION */}
        {keyExchangeAlgorithm && (
          <div>
            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1">
              <Zap size={12} /> Key Exchange (Ephemeral)
            </h4>
            <div className="bg-muted/50 rounded border border-border p-2">
              <KeyExchangeBadge algorithm={keyExchangeAlgorithm} />
            </div>
          </div>
        )}

        {/* Static Keys Section */}
        <div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1">
            <Shield size={12} /> Static Keys & Identity
          </h4>
          <div className="space-y-2">
            {/* Certificate */}
            <div className="bg-muted/50 rounded border border-border p-2">
              <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                Certificate (Public Key)
              </div>
              <div className="font-mono text-[10px] text-foreground break-all px-1">
                {config.certificates.certPem ? (
                  config.certificates.certPem.split('\n').slice(1, 2)[0] + '...'
                ) : (
                  <span className="text-muted-foreground italic">None configured</span>
                )}
              </div>
            </div>
            {/* Private Key */}
            <div className="bg-muted/50 rounded border border-border p-2">
              <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">
                Private Key
              </div>
              <div className="font-mono text-[10px] text-foreground break-all px-1">
                {config.certificates.keyPem ? (
                  'Present (Hidden)'
                ) : (
                  <span className="text-muted-foreground italic">None</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Keys Section */}
        <div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1">
            <Lock size={12} /> Derived Session Secrets (HKDF)
          </h4>
          {filteredSecrets.length === 0 ? (
            <div className="text-xs text-muted-foreground italic px-2">
              No secrets established yet.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSecrets.map((s, i) => (
                <div
                  key={i}
                  className="bg-muted/50 rounded border border-border p-2 group hover:border-border/80 transition-colors"
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] font-bold text-warning truncate">{s.label}</span>
                      <div title={SECRET_DESCRIPTIONS[s.label] || 'TLS 1.3 Session Secret'}>
                        <HelpCircle
                          size={10}
                          className="text-muted-foreground hover:text-foreground cursor-help"
                        />
                      </div>
                    </div>
                    <CopyButton text={s.secret} />
                  </div>
                  <div className="font-mono text-[10px] text-foreground break-all bg-background/50 p-1.5 rounded border border-border select-all">
                    {s.secret}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = React.useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="text-[9px] hover:text-foreground text-muted-foreground transition-colors uppercase font-bold tracking-wider"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
