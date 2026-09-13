// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { getAlgorithm } from '@/data/algorithmProperties'
import { Button } from '@/components/ui/button'

const DNS_UDP_LIMIT_BYTES = 1232

interface SizeRow {
  id: string
  label: string
  bytes: number
  pq: boolean
  note: string
}

const ROWS: SizeRow[] = [
  {
    id: 'RSA-2048',
    label: getAlgorithm('RSA-2048').name,
    bytes: getAlgorithm('RSA-2048').signatureOrCiphertextBytes ?? 0,
    pq: false,
    note: 'Classical, quantum-vulnerable. Today’s common DNSSEC algorithm.',
  },
  {
    id: 'ECDSA P-256',
    label: getAlgorithm('ECDSA P-256').name,
    bytes: getAlgorithm('ECDSA P-256').signatureOrCiphertextBytes ?? 0,
    pq: false,
    note: 'Classical, quantum-vulnerable (RFC 6605). The most compact DNSSEC algorithm in use today.',
  },
  {
    id: 'Ed25519',
    label: getAlgorithm('Ed25519').name,
    bytes: getAlgorithm('Ed25519').signatureOrCiphertextBytes ?? 0,
    pq: false,
    note: 'Classical, quantum-vulnerable. Also DNSSEC-compatible, similarly compact.',
  },
  {
    id: 'ML-DSA-44',
    label: getAlgorithm('ML-DSA-44').name,
    bytes: getAlgorithm('ML-DSA-44').signatureOrCiphertextBytes ?? 0,
    pq: true,
    note: 'IANA DNSSEC algorithm 18. Cloudflare’s 1.1.1.1 pilot. Exceeds the UDP ceiling.',
  },
  {
    id: 'SLH-DSA-SHA2-128s',
    label: getAlgorithm('SLH-DSA-SHA2-128s').name,
    bytes: getAlgorithm('SLH-DSA-SHA2-128s').signatureOrCiphertextBytes ?? 0,
    pq: true,
    note: 'Raw signature size shown. A separate SLH-DSA Merkle Tree Ladder proposal (draft-fregly-dnsop-slh-dsa-mtl-dnssec) amortizes this cost across queries using Merkle proofs.',
  },
]

interface SignatureSizeExplorerProps {
  initialHighlight?: string
}

export const SignatureSizeExplorer: React.FC<SignatureSizeExplorerProps> = ({
  initialHighlight,
}) => {
  const [highlighted, setHighlighted] = useState<string | undefined>(initialHighlight)
  const maxBytes = Math.max(...ROWS.map((r) => r.bytes), DNS_UDP_LIMIT_BYTES)

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 border-border">
        <p className="text-xs text-muted-foreground">
          Signature size is a major constraint on this migration. Click a row to highlight it
          against a common conservative UDP payload limit of{' '}
          <strong>{DNS_UDP_LIMIT_BYTES.toLocaleString()} bytes</strong> (RFC 9715 recommends up to
          1,400 bytes) &mdash; a response over the advertised limit needs another transport,
          normally TCP.
        </p>
      </div>

      <div className="space-y-3">
        {ROWS.map((row) => {
          const widthPercent = (row.bytes / maxBytes) * 100
          const overLimit = row.bytes > DNS_UDP_LIMIT_BYTES
          const isHighlighted = highlighted === row.id
          return (
            <Button
              key={row.id}
              variant="ghost"
              onClick={() => setHighlighted(row.id)}
              className={`w-full h-auto block text-left space-y-1 rounded-lg p-3 border transition-colors whitespace-normal ${
                isHighlighted
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-muted/30 border-border hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground flex items-center gap-2">
                  {row.label}
                  {row.pq && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/20 text-secondary border border-secondary/40 font-bold">
                      PQ
                    </span>
                  )}
                </span>
                <span
                  className={`font-bold ${overLimit ? 'text-warning' : 'text-muted-foreground'}`}
                >
                  {row.bytes.toLocaleString()} B{overLimit ? ' — needs TCP' : ''}
                </span>
              </div>
              <div className="h-3 bg-muted/50 rounded-full overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    overLimit ? 'bg-warning/70' : 'bg-primary/60'
                  }`}
                  style={{ width: `${widthPercent}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 border-l-2 border-dashed border-destructive/70"
                  style={{ left: `${(DNS_UDP_LIMIT_BYTES / maxBytes) * 100}%` }}
                  title={`DNS UDP ceiling: ${DNS_UDP_LIMIT_BYTES.toLocaleString()} B`}
                />
              </div>
              {isHighlighted && <p className="text-xs text-muted-foreground pt-1">{row.note}</p>}
            </Button>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Dashed line marks a common conservative 1,232-byte UDP payload limit. Both post-quantum
        options shown exceed it &mdash; ML-DSA-44 by roughly 2&times;, SLH-DSA-SHA2-128s by more
        than 6&times; &mdash; while the classical signatures shown fit below it. A complete DNS
        response also carries other data, so signature size alone doesn&apos;t guarantee the whole
        response fits.
      </p>
    </div>
  )
}
