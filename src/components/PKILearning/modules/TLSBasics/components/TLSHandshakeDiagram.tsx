import React from 'react'
import { Lock, Unlock } from 'lucide-react'
import { clsx } from 'clsx'

const MESSAGES = [
  {
    label: 'ClientHello',
    sublabel: '+ key_share, supported_groups',
    direction: 'right' as const,
    encrypted: false,
  },
  {
    label: 'ServerHello',
    sublabel: '+ key_share',
    direction: 'left' as const,
    encrypted: false,
  },
  {
    label: '{EncryptedExtensions}',
    sublabel: '',
    direction: 'left' as const,
    encrypted: true,
  },
  {
    label: '{CertificateRequest}*',
    sublabel: 'mTLS optional',
    direction: 'left' as const,
    encrypted: true,
  },
  {
    label: '{Certificate}',
    sublabel: 'Server identity',
    direction: 'left' as const,
    encrypted: true,
  },
  {
    label: '{CertificateVerify}',
    sublabel: 'Signature proof',
    direction: 'left' as const,
    encrypted: true,
  },
  {
    label: '{Finished}',
    sublabel: 'Server handshake MAC',
    direction: 'left' as const,
    encrypted: true,
  },
  {
    label: '{Certificate}*',
    sublabel: 'Client identity (mTLS)',
    direction: 'right' as const,
    encrypted: true,
  },
  {
    label: '{CertificateVerify}*',
    sublabel: 'Client signature (mTLS)',
    direction: 'right' as const,
    encrypted: true,
  },
  {
    label: '{Finished}',
    sublabel: 'Client handshake MAC',
    direction: 'right' as const,
    encrypted: true,
  },
  {
    label: 'Application Data',
    sublabel: 'Encrypted with traffic keys',
    direction: 'both' as const,
    encrypted: true,
  },
]

export const TLSHandshakeDiagram: React.FC = () => {
  return (
    <div className="bg-muted/30 rounded-lg border border-border p-6 overflow-x-auto">
      <div className="min-w-[400px]">
        {/* Column Headers */}
        <div className="flex justify-between mb-4">
          <div className="w-24 text-center">
            <div className="w-16 h-16 mx-auto rounded-xl border-2 border-primary bg-primary/10 flex items-center justify-center mb-2">
              <span className="text-2xl">💻</span>
            </div>
            <span className="text-sm font-bold text-primary">Client</span>
          </div>
          <div className="flex-1" />
          <div className="w-24 text-center">
            <div className="w-16 h-16 mx-auto rounded-xl border-2 border-tertiary bg-tertiary/10 flex items-center justify-center mb-2">
              <span className="text-2xl">🖥️</span>
            </div>
            <span className="text-sm font-bold text-tertiary">Server</span>
          </div>
        </div>

        {/* Vertical lines */}
        <div className="relative">
          {/* Client vertical line */}
          <div className="absolute left-12 top-0 bottom-0 w-px bg-primary/20" />
          {/* Server vertical line */}
          <div className="absolute right-12 top-0 bottom-0 w-px bg-tertiary/20" />

          {/* Encryption boundary marker */}
          <div className="relative flex items-center gap-2 py-2 my-1">
            <div className="flex-1 border-t border-dashed border-success/30" />
            <span className="text-[10px] text-success font-bold uppercase flex items-center gap-1 shrink-0">
              <Lock size={10} /> Encrypted from here
            </span>
            <div className="flex-1 border-t border-dashed border-success/30" />
          </div>

          {/* Messages */}
          <div className="space-y-2">
            {MESSAGES.map((msg, i) => {
              // Insert encryption boundary before first encrypted message
              const showBoundary = i > 0 && msg.encrypted && !MESSAGES[i - 1].encrypted

              return (
                <React.Fragment key={i}>
                  {showBoundary && (
                    <div className="relative flex items-center gap-2 py-2 my-1">
                      <div className="flex-1 border-t border-dashed border-success/30" />
                      <span className="text-[10px] text-success font-bold uppercase flex items-center gap-1 shrink-0">
                        <Lock size={10} /> Handshake keys derived
                      </span>
                      <div className="flex-1 border-t border-dashed border-success/30" />
                    </div>
                  )}
                  <MessageArrow
                    label={msg.label}
                    sublabel={msg.sublabel}
                    direction={msg.direction}
                    encrypted={msg.encrypted}
                  />
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const MessageArrow: React.FC<{
  label: string
  sublabel: string
  direction: 'left' | 'right' | 'both'
  encrypted: boolean
}> = ({ label, sublabel, direction, encrypted }) => {
  return (
    <div className="flex items-center px-12 py-1.5 group">
      {/* Left dot (client) */}
      <div
        className={clsx(
          'w-2 h-2 rounded-full shrink-0',
          direction === 'right' || direction === 'both' ? 'bg-primary' : 'bg-transparent'
        )}
      />

      {/* Arrow line + label */}
      <div className="flex-1 relative mx-2">
        <div
          className={clsx('h-px w-full', encrypted ? 'bg-success/50' : 'bg-muted-foreground/30')}
        />

        {/* Arrowhead */}
        {direction === 'right' && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-y-[4px] border-y-transparent border-l-primary" />
        )}
        {direction === 'left' && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-0 border-r-[6px] border-y-[4px] border-y-transparent border-r-tertiary" />
        )}
        {direction === 'both' && (
          <>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-y-[4px] border-y-transparent border-l-success" />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-0 border-r-[6px] border-y-[4px] border-y-transparent border-r-success" />
          </>
        )}

        {/* Label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2">
          <div className="flex items-center gap-1.5">
            {encrypted ? (
              <Lock size={10} className="text-success shrink-0" />
            ) : (
              <Unlock size={10} className="text-muted-foreground shrink-0" />
            )}
            <span
              className={clsx(
                'text-xs font-mono font-bold whitespace-nowrap',
                encrypted ? 'text-success' : 'text-foreground'
              )}
            >
              {label}
            </span>
          </div>
          {sublabel && (
            <div className="text-[10px] text-muted-foreground text-center whitespace-nowrap">
              {sublabel}
            </div>
          )}
        </div>
      </div>

      {/* Right dot (server) */}
      <div
        className={clsx(
          'w-2 h-2 rounded-full shrink-0',
          direction === 'left' || direction === 'both' ? 'bg-tertiary' : 'bg-transparent'
        )}
      />
    </div>
  )
}
