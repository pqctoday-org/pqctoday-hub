// SPDX-License-Identifier: GPL-3.0-only
/**
 * Step 4 — Certificate chain analyzer.
 *
 * FIXED 2026-10-01: each certificate now carries its ISSUER's signature
 * (RFC 5280 §4.1.1.3), the root is shown as stored-not-sent (RFC 8446 §4.4.2),
 * mitigations are delivery modes with their own caveats instead of stacked
 * percentages, C509 is an option, and Merkle Tree Certificates are modelled as
 * an inclusion proof with the relying-party condition spelled out.
 */
import React, { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { AlertTriangle } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { CONSTRAINED_ALGORITHMS } from '../constants'
import { chainSizes, deliveredChainBytes, sigSizesOf, type DeliveryMode } from '../utils/sizing'
import { Button } from '@/components/ui/button'

export interface CertChainConfig {
  rootAlg?: string
  intAlg?: string
  leafAlg?: string
  ramKB?: number
  mode?: DeliveryMode
}

const CERT_ALGS = [
  { id: 'rsa-2048', name: 'RSA-2048 (classical)' },
  ...CONSTRAINED_ALGORITHMS.filter((a) => a.type === 'Signature').map((a) => ({
    id: a.id,
    name: `${a.name}${a.quantumSafe ? '' : ' (classical)'}`,
  })),
]

const MODES: { id: DeliveryMode; name: string; ref: string }[] = [
  { id: 'full', name: 'Full X.509 chain', ref: 'RFC 5280 / RFC 8446 §4.4.2' },
  { id: 'compressed', name: 'Certificate compression', ref: 'RFC 8879' },
  {
    id: 'c509',
    name: 'C509 (CBOR-encoded) certificates',
    ref: 'draft-ietf-cose-cbor-encoded-cert',
  },
  { id: 'raw-key', name: 'Raw public key', ref: 'RFC 7250' },
  { id: 'mtc', name: 'Merkle Tree Certificate', ref: 'draft-ietf-plants-merkle-tree-certs' },
  { id: 'resumption', name: 'PSK resumption (reconnect)', ref: 'RFC 9846 / RFC 9147' },
]

const kb = (b: number) => `${(b / 1024).toFixed(1)} KiB`

export const CertChainAnalyzer: React.FC<{ initial?: CertChainConfig }> = ({ initial }) => {
  const [rootAlg, setRootAlg] = useState(initial?.rootAlg ?? 'ecdsa-p256')
  const [intAlg, setIntAlg] = useState(initial?.intAlg ?? 'ecdsa-p256')
  const [leafAlg, setLeafAlg] = useState(initial?.leafAlg ?? 'ecdsa-p256')
  const [ramKB, setRamKB] = useState(initial?.ramKB ?? 50)
  const [mode, setMode] = useState<DeliveryMode>(initial?.mode ?? 'full')
  const [mtcDepth, setMtcDepth] = useState(20)

  const root = sigSizesOf(rootAlg)
  const int = sigSizesOf(intAlg)
  const leaf = sigSizesOf(leafAlg)
  const chain = useMemo(() => chainSizes(root, int, leaf), [root, int, leaf])
  const delivered = useMemo(
    () => deliveredChainBytes(mode, root, int, leaf, mtcDepth),
    [mode, root, int, leaf, mtcDepth]
  )
  const ramPct = (delivered.bytes / (ramKB * 1024)) * 100

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Choose an algorithm for each level. Each certificate holds its own public key and the{' '}
        <strong>issuer&apos;s</strong> signature, so the intermediate&apos;s size depends on the
        root&apos;s algorithm and the leaf&apos;s on the intermediate&apos;s. The root is the trust
        anchor stored on the device and is not sent.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Level
          label="Root CA (stored on device)"
          value={rootAlg}
          onChange={setRootAlg}
          size={chain.root}
          note="self-signed: own key + own signature"
        />
        <Level
          label="Intermediate CA"
          value={intAlg}
          onChange={setIntAlg}
          size={chain.intermediate}
          note="own key + root's signature"
        />
        <Level
          label="End entity (device or server)"
          value={leafAlg}
          onChange={setLeafAlg}
          size={chain.leaf}
          note="own key + intermediate's signature"
        />
      </div>

      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">Delivery mode</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MODES.map((m) => (
            <Button
              variant="ghost"
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`h-auto flex-col items-start whitespace-normal text-left p-3 rounded-lg border ${
                m.id === mode ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'
              }`}
            >
              <span className="text-sm font-medium text-foreground">{m.name}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{m.ref}</span>
            </Button>
          ))}
        </div>
        {mode === 'mtc' && (
          <label className="block mt-3 text-xs text-muted-foreground">
            Merkle tree depth: {mtcDepth} levels (≈{(2 ** mtcDepth).toLocaleString('en-US')}{' '}
            certificates per batch) → proof {32 * mtcDepth} B
            <input
              type="range"
              aria-label="Merkle tree depth"
              min={10}
              max={30}
              value={mtcDepth}
              onChange={(e) => setMtcDepth(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </label>
        )}
      </div>

      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold text-foreground">Bytes the device must receive</div>
          <div className="text-right">
            {mode !== 'full' && (
              <span className="text-sm text-muted-foreground line-through mr-2">
                {kb(chain.sent)}
              </span>
            )}
            <span className="text-lg font-bold font-mono text-primary">{kb(delivered.bytes)}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{delivered.caveat}</p>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="font-bold text-foreground">Device RAM budget</span>
            <span className="font-mono">{ramKB} KiB</span>
          </div>
          <input
            type="range"
            aria-label="Device RAM budget, kibibytes"
            min={2}
            max={300}
            step={1}
            value={ramKB}
            onChange={(e) => setRamKB(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Class 1 ≈ 10 KiB</span>
            <span>Class 2 ≈ 50 KiB</span>
            <span>Class 3 ≈ 100 KiB</span>
            <span>Class 4 ≥ 300 KiB</span>
          </div>
          <div className="mt-2 w-full bg-muted rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                ramPct > 100 ? 'bg-destructive/70' : ramPct > 50 ? 'bg-warning/70' : 'bg-success/70'
              }`}
              style={{ width: `${Math.min(ramPct, 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Holding the received chain uses {ramPct.toFixed(0)}% of {ramKB} KiB (a verifier that
            streams certificates needs less).
          </div>
          {ramPct > 100 && (
            <div className="flex items-start gap-2 mt-2 text-xs text-destructive">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              The chain alone exceeds the device&apos;s RAM. Try raw public keys, EDHOC with
              credentials by reference, or a smaller signature algorithm.
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Model estimate: ≈300 B of X.509 structure per certificate (≈140 B for C509) plus the exact
        key and signature sizes; real certificates vary with names and extensions. For a deep dive
        on MTC see the{' '}
        <Link to="/learn/merkle-tree-certs" className="text-primary hover:underline">
          Merkle Tree Certificates module
        </Link>
        .
      </p>
    </div>
  )
}

function Level({
  label,
  value,
  onChange,
  size,
  note,
}: {
  label: string
  value: string
  onChange: (id: string) => void
  size: number
  note: string
}) {
  return (
    <div className="glass-panel p-4">
      <FilterDropdown
        label={label}
        items={CERT_ALGS.map((a) => ({ id: a.id, label: a.name }))}
        selectedId={value}
        onSelect={onChange}
        noContainer
        className="w-full"
      />
      <div className="mt-2 text-xs text-muted-foreground">
        Certificate:{' '}
        <span className="font-mono text-foreground">{size.toLocaleString('en-US')} B</span>
      </div>
      <div className="text-[10px] text-muted-foreground">{note}</div>
    </div>
  )
}
