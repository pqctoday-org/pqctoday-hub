// SPDX-License-Identifier: GPL-3.0-only
//
// SshComparisonPanel — side-by-side classical vs PQC SSH handshake results.
// Port of sandbox SSHComparisonVisualizer with Hub semantic-token styling.

import {
  CheckCircle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  ExternalLink,
} from 'lucide-react'
import type { SshHandshakeResult } from '@/wasm/openssh'

interface Props {
  classical?: SshHandshakeResult
  pqc?: SshHandshakeResult
}

const SPEC_CITATIONS = [
  {
    label: 'draft-sfluhrer-ssh-mldsa-06',
    href: 'https://datatracker.ietf.org/doc/draft-sfluhrer-ssh-mldsa/',
  },
  { label: 'FIPS 204 (ML-DSA)', href: 'https://doi.org/10.6028/NIST.FIPS.204' },
  { label: 'FIPS 186-5 (ECDSA)', href: 'https://doi.org/10.6028/NIST.FIPS.186-5' },
  { label: 'RFC 8032 (Ed25519)', href: 'https://www.rfc-editor.org/rfc/rfc8032' },
  {
    label: 'PKCS#11 v3.2 (OASIS)',
    href: 'https://docs.oasis-open.org/pkcs11/pkcs11-spec/v3.2/os/pkcs11-spec-v3.2-os.html',
  },
]

function SizeBar({ bytes, max, className }: { bytes: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, (bytes / max) * 100) : 0
  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${className ?? 'bg-primary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-muted-foreground w-16 text-right">{bytes.toLocaleString()} B</span>
    </div>
  )
}

function Pill({ ok, label }: { ok?: boolean; label: string }) {
  if (ok === undefined)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-border bg-muted/40 text-muted-foreground">
        ? {label}
      </span>
    )
  return ok ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-status-success/30 bg-status-success/10 text-status-success">
      <CheckCircle className="h-3 w-3" /> {label}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-status-error/30 bg-status-error/10 text-status-error">
      <XCircle className="h-3 w-3" /> {label}
    </span>
  )
}

function LegCard({
  title,
  result,
  isPqc,
  maxPubBytes,
  maxSigBytes,
}: {
  title: string
  result?: SshHandshakeResult
  isPqc: boolean
  maxPubBytes: number
  maxSigBytes: number
}) {
  const accent = isPqc
    ? {
        bar: 'from-primary to-accent',
        text: 'text-primary',
        ring: 'border-primary/20',
        bar2: 'bg-primary/80',
      }
    : {
        bar: 'from-destructive to-orange-500',
        text: 'text-destructive',
        ring: 'border-destructive/20',
        bar2: 'bg-destructive/60',
      }
  const Icon = isPqc ? ShieldCheck : ShieldAlert

  if (!result) {
    return (
      <div className={`glass-panel p-5 relative overflow-hidden ${accent.ring}`}>
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${accent.bar}`} />
        <div className={`flex items-center gap-2 mb-3`}>
          <Icon className={`w-4 h-4 ${accent.text}`} />
          <h4 className={`text-sm font-bold ${accent.text}`}>{title}</h4>
        </div>
        <p className="text-xs text-muted-foreground italic">
          Not executed — click the matching run button above.
        </p>
      </div>
    )
  }

  if (result.error && !result.connection_ok) {
    return (
      <div className={`glass-panel p-5 relative overflow-hidden border-status-error/20`}>
        <div
          className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-status-error to-orange-500`}
        />
        <div className="flex items-center gap-2 mb-3">
          <XCircle className="w-4 h-4 text-status-error" />
          <h4 className="text-sm font-bold text-status-error">{title}</h4>
        </div>
        <p className="text-xs text-status-error font-mono">{result.error}</p>
      </div>
    )
  }

  return (
    <div className={`glass-panel p-5 relative overflow-hidden ${accent.ring}`}>
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${accent.bar}`} />
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-4 h-4 ${accent.text}`} />
        <h4 className={`text-sm font-bold ${accent.text}`}>{title}</h4>
        <div className="ml-auto flex flex-wrap gap-1">
          <Pill ok={result.connection_ok} label="connected" />
          <Pill ok={result.pkcs11_host_backed} label="pkcs11 host" />
          <Pill ok={result.pkcs11_client_backed} label="pkcs11 client" />
          <Pill ok={result.quantum_safe} label="quantum-safe" />
        </div>
      </div>

      <dl className="space-y-2 text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">KEX</dt>
          <dd className="font-mono text-foreground text-right">{result.kex_algorithm}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Host key</dt>
          <dd className="font-mono text-foreground text-right">{result.host_key_algorithm}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Client auth</dt>
          <dd className="font-mono text-foreground text-right">{result.client_auth_algorithm}</dd>
        </div>

        <div className="pt-2 space-y-1.5">
          <p className="text-muted-foreground font-medium">Host pubkey</p>
          <SizeBar bytes={result.host_pubkey_bytes} max={maxPubBytes} className={accent.bar2} />
        </div>
        <div className="space-y-1.5">
          <p className="text-muted-foreground font-medium">Client pubkey</p>
          <SizeBar bytes={result.client_pubkey_bytes} max={maxPubBytes} className={accent.bar2} />
        </div>
        <div className="space-y-1.5">
          <p className="text-muted-foreground font-medium">Host signature</p>
          <SizeBar bytes={result.host_sig_bytes} max={maxSigBytes} className={accent.bar2} />
        </div>
        <div className="space-y-1.5">
          <p className="text-muted-foreground font-medium">Client signature</p>
          <SizeBar bytes={result.client_sig_bytes} max={maxSigBytes} className={accent.bar2} />
        </div>

        {result.token_module && (
          <div className="flex justify-between gap-4 pt-1">
            <dt className="text-muted-foreground">Token</dt>
            <dd className="font-mono text-muted-foreground text-right truncate">
              {result.token_module}
            </dd>
          </div>
        )}

        <div className="pt-2 border-t border-border/30 flex justify-between items-center">
          <dt className="text-muted-foreground text-xs">Auth wall-time</dt>
          <dd className="font-mono text-foreground text-xs">{result.auth_ms.toFixed(1)} ms</dd>
        </div>
      </dl>
    </div>
  )
}

export function SshComparisonPanel({ classical, pqc }: Props) {
  const maxPubBytes = Math.max(
    classical?.host_pubkey_bytes ?? 0,
    classical?.client_pubkey_bytes ?? 0,
    pqc?.host_pubkey_bytes ?? 1952,
    pqc?.client_pubkey_bytes ?? 1952,
    32
  )
  const maxSigBytes = Math.max(
    classical?.host_sig_bytes ?? 0,
    classical?.client_sig_bytes ?? 0,
    pqc?.host_sig_bytes ?? 3309,
    pqc?.client_sig_bytes ?? 3309,
    64
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Terminal className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          SSH authentication — side-by-side telemetry
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <LegCard
          title="Classical (ed25519 + curve25519)"
          result={classical}
          isPqc={false}
          maxPubBytes={maxPubBytes}
          maxSigBytes={maxSigBytes}
        />
        <LegCard
          title="PQC (ML-DSA-65 + ML-KEM-768 × X25519)"
          result={pqc}
          isPqc={true}
          maxPubBytes={maxPubBytes}
          maxSigBytes={maxSigBytes}
        />
      </div>

      {/* Spec citations */}
      <div className="flex flex-wrap gap-2 pt-1">
        {SPEC_CITATIONS.map((c) => (
          <a
            key={c.href}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
          >
            <ExternalLink className="h-2.5 w-2.5" />
            {c.label}
          </a>
        ))}
      </div>

      {/* Migration analysis */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        Migrating SSH to post-quantum cryptography replaces classical key exchange (ECDH /
        Curve25519) and signatures (ECDSA / Ed25519) with NIST-standardised ML-KEM-768 hybrid KEX
        and ML-DSA-65 signatures. The host and client keys grow from 32 B (Ed25519) to 1,952 B
        (ML-DSA-65), and signatures from 64 B to 3,309 B — a 52× increase driven by the security
        margin of lattice-based FIPS 204. Both operations are delegated to softhsmv3 via PKCS#11
        v3.2 C_Sign, ensuring private key material never leaves the token boundary.
      </p>
    </div>
  )
}
