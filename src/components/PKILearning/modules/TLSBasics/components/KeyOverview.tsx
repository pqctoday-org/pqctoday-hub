import React from 'react'
import { clsx } from 'clsx'
import { Key, Shield, Lock } from 'lucide-react'
import type { TraceEvent } from './CryptoLogDisplay'
import type { TLSConfig } from '../../../../../store/tls-learning.store'

interface KeyColumnProps {
  title: string
  config: TLSConfig
  trace: TraceEvent[]
  side: 'client' | 'server'
  color: 'blue' | 'purple'
}

export const KeyColumn: React.FC<KeyColumnProps> = ({ title, config, trace, side, color }) => {
  const borderColor = color === 'blue' ? 'border-primary/30' : 'border-tertiary/30'
  const textColor = color === 'blue' ? 'text-primary' : 'text-tertiary'
  const bgColor = color === 'blue' ? 'bg-primary/5' : 'bg-tertiary/5'

  // Extract secrets for this side
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
            <Lock size={12} /> Dynamic Session Secrets
          </h4>
          {secrets.length === 0 ? (
            <div className="text-xs text-muted-foreground italic px-2">
              No secrets established yet.
            </div>
          ) : (
            <div className="space-y-2">
              {secrets.map((s, i) => (
                <div
                  key={i}
                  className="bg-muted/50 rounded border border-border p-2 group hover:border-border/80 transition-colors"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-warning">{s.label}</span>
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
