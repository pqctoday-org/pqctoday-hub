// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Lock, Unlock } from 'lucide-react'
import { clsx } from 'clsx'
import { useTLSStore } from '@/store/tls-learning.store'

// Key-share sizes (encap key / ciphertext in bytes) per group
const GROUP_KEY_SHARE: Record<string, { ek: number; ct: number }> = {
  X25519MLKEM768: { ek: 1184, ct: 1088 },
  X448MLKEM1024: { ek: 1600, ct: 1568 },
  SecP256r1MLKEM768: { ek: 1249, ct: 1153 },
  SecP384r1MLKEM1024: { ek: 1665, ct: 1633 },
  MLKEM512: { ek: 800, ct: 768 },
  MLKEM768: { ek: 1184, ct: 1088 },
  MLKEM1024: { ek: 1568, ct: 1568 },
  X25519: { ek: 32, ct: 32 },
  P256: { ek: 65, ct: 65 },
  P384: { ek: 97, ct: 97 },
}

// Signature sizes by cert selection
const SIG_BYTES: Record<string, string> = {
  mldsa44: '2,420 B',
  mldsa65: '3,293 B',
  mldsa87: '4,595 B',
  rsa2048: '256 B',
  rsa4096: '512 B',
  ecdsa256: '72 B (DER)',
  'slhdsa-sha2-128s': '7,856 B',
  'slhdsa-sha2-192s': '16,224 B',
  'slhdsa-sha2-256s': '29,792 B',
}

const MESSAGES = [
  {
    label: 'ClientHello',
    sublabel: '+ key_share (encapsulation key), supported_groups',
    rfcRef: 'RFC 8446 §4.1.1',
    direction: 'right' as const,
    encrypted: false,
    mtls: false,
  },
  {
    label: 'ServerHello',
    sublabel: '+ key_share (ciphertext for KEM / ECDH response)',
    rfcRef: 'RFC 8446 §4.1.3',
    direction: 'left' as const,
    encrypted: false,
    mtls: false,
  },
  {
    label: '{EncryptedExtensions}',
    sublabel: '',
    rfcRef: 'RFC 8446 §4.3.1',
    direction: 'left' as const,
    encrypted: true,
    mtls: false,
  },
  {
    label: '{CertificateRequest}',
    sublabel: 'mTLS: server requests client cert',
    rfcRef: 'RFC 8446 §4.3.2',
    direction: 'left' as const,
    encrypted: true,
    mtls: true,
  },
  {
    label: '{Certificate}',
    sublabel: 'Server identity',
    rfcRef: 'RFC 8446 §4.4.2',
    direction: 'left' as const,
    encrypted: true,
    mtls: false,
  },
  {
    label: '{CertificateVerify}',
    sublabel: 'Signature proof (ML-DSA / SLH-DSA / ECDSA)',
    rfcRef: 'RFC 8446 §4.4.3',
    direction: 'left' as const,
    encrypted: true,
    mtls: false,
  },
  {
    label: '{Finished}',
    sublabel: 'Server handshake MAC',
    rfcRef: 'RFC 8446 §4.4.4',
    direction: 'left' as const,
    encrypted: true,
    mtls: false,
  },
  {
    label: '{Certificate}',
    sublabel: 'Client identity (mTLS)',
    rfcRef: 'RFC 8446 §4.4.2',
    direction: 'right' as const,
    encrypted: true,
    mtls: true,
  },
  {
    label: '{CertificateVerify}',
    sublabel: 'Client signature (mTLS)',
    rfcRef: 'RFC 8446 §4.4.3',
    direction: 'right' as const,
    encrypted: true,
    mtls: true,
  },
  {
    label: '{Finished}',
    sublabel: 'Client handshake MAC',
    rfcRef: 'RFC 8446 §4.4.4',
    direction: 'right' as const,
    encrypted: true,
    mtls: false,
  },
  {
    label: 'Application Data',
    sublabel: 'Encrypted with traffic keys',
    rfcRef: 'RFC 8446 §7.3',
    direction: 'both' as const,
    encrypted: true,
    mtls: false,
  },
]

interface TLSHandshakeDiagramProps {
  /** When provided, mTLS-specific messages are highlighted (true) or dimmed (false).
   *  When undefined (default), all messages render at full opacity with an mTLS indicator. */
  mTLSEnabled?: boolean
}

export const TLSHandshakeDiagram: React.FC<TLSHandshakeDiagramProps> = ({ mTLSEnabled }) => {
  const { clientConfig, serverConfig } = useTLSStore()
  const selectedGroup = clientConfig?.groups?.[0] ?? 'X25519MLKEM768'
  const sigAlg = serverConfig?.signatureAlgorithms?.[0] ?? 'mldsa65'
  const ks = GROUP_KEY_SHARE[selectedGroup] ?? GROUP_KEY_SHARE['X25519MLKEM768']
  const sigSize = SIG_BYTES[sigAlg]

  const dynamicMessages = MESSAGES.map((msg) => {
    if (msg.label === 'ClientHello') {
      return {
        ...msg,
        sublabel: `+ key_share (${selectedGroup}, encap key ${ks.ek} B), supported_groups`,
      }
    }
    if (msg.label === 'ServerHello' && msg.direction === 'left') {
      return {
        ...msg,
        sublabel: `+ key_share (KEM ciphertext / ECDH response, ${ks.ct} B)`,
      }
    }
    if (msg.label === '{CertificateVerify}' && msg.direction === 'left' && sigSize) {
      return {
        ...msg,
        sublabel: `Signature proof — ${sigAlg.toUpperCase()} (${sigSize})`,
      }
    }
    return msg
  })

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

          {/* Messages */}
          <div className="space-y-2">
            {dynamicMessages.map((msg, i) => {
              // Insert encryption boundary before first encrypted message
              const showBoundary = i > 0 && msg.encrypted && !dynamicMessages[i - 1].encrypted

              // Visual state for mTLS messages
              const isMtlsActive =
                msg.mtls && mTLSEnabled === true
                  ? true
                  : msg.mtls && mTLSEnabled === false
                    ? false
                    : null // null = unknown/educational mode

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
                    rfcRef={msg.rfcRef}
                    direction={msg.direction}
                    encrypted={msg.encrypted}
                    mtlsActive={isMtlsActive}
                  />
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* PQC note — dynamic based on current group selection */}
        <p className="mt-4 text-[10px] text-muted-foreground/70 text-center">
          Current group: <span className="font-mono">{selectedGroup}</span> — encap key {ks.ek} B,
          ciphertext {ks.ct} B (classical X25519 uses 32 B each).
          {sigSize && (
            <>
              {' '}
              CertificateVerify: {sigAlg.toUpperCase()} signature {sigSize}.
            </>
          )}
        </p>
      </div>
    </div>
  )
}

const MessageArrow: React.FC<{
  label: string
  sublabel: string
  rfcRef: string
  direction: 'left' | 'right' | 'both'
  encrypted: boolean
  /** null = educational mode (show with indicator), true = active, false = inactive */
  mtlsActive: boolean | null
}> = ({ label, sublabel, rfcRef, direction, encrypted, mtlsActive }) => {
  // When mTLS is explicitly disabled, dim this message
  const isDimmed = mtlsActive === false
  // When mTLS is active, use warning color to distinguish from standard messages
  const isMtlsHighlighted = mtlsActive === true

  return (
    <div className={clsx('flex items-center px-12 py-1.5 group', isDimmed && 'opacity-30')}>
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
                isMtlsHighlighted ? 'text-warning' : encrypted ? 'text-success' : 'text-foreground'
              )}
            >
              {label}
            </span>
            {mtlsActive === null && (
              <span className="text-[8px] text-warning ml-1 font-sans">(mTLS)</span>
            )}
          </div>
          {sublabel && (
            <div className="text-[10px] text-muted-foreground text-center whitespace-nowrap">
              {sublabel}
            </div>
          )}
          <div className="text-[9px] text-muted-foreground/50 text-center whitespace-nowrap font-mono">
            {rfcRef}
          </div>
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
