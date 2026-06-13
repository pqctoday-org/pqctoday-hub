// SPDX-License-Identifier: GPL-3.0-only
//
// VpnComparisonPanel — side-by-side classical / hybrid / pure-PQC IKEv2 handshake
// comparison. Mirrors SshComparisonPanel; all numbers come from ikev2Constants.ts
// (IKE_V2_MODES, IKE_V2_EXCHANGES, IKE_AUTH_SK_BYTES) — never duplicated here.

import { CheckCircle, XCircle, ShieldCheck, ShieldAlert, Network, ExternalLink } from 'lucide-react'
import {
  IKE_V2_MODES,
  IKE_V2_EXCHANGES,
  IKE_AUTH_SK_BYTES,
  type IKEv2Mode,
  type IKEv2ExchangeData,
} from '@/components/PKILearning/modules/VPNSSHModule/data/ikev2Constants'

interface Props {
  /** Highlights the card matching the simulator's currently selected KE mode. */
  selectedMode?: IKEv2Mode
}

// Lint-safe (no computed object access) lookup into IKE_V2_EXCHANGES.
function exchangeFor(mode: IKEv2Mode): IKEv2ExchangeData {
  switch (mode) {
    case 'classical':
      return IKE_V2_EXCHANGES.classical
    case 'hybrid':
      return IKE_V2_EXCHANGES.hybrid
    case 'pure-pqc':
      return IKE_V2_EXCHANGES['pure-pqc']
  }
}

const KEX_QUANTUM_SAFE: Record<IKEv2Mode, boolean> = {
  classical: false,
  hybrid: true,
  'pure-pqc': true,
}

const SPEC_CITATIONS = [
  { label: 'RFC 7296 (IKEv2)', href: 'https://www.rfc-editor.org/rfc/rfc7296' },
  { label: 'RFC 9242 (IKE_INTERMEDIATE)', href: 'https://www.rfc-editor.org/rfc/rfc9242' },
  { label: 'RFC 9370 (Multiple KE)', href: 'https://www.rfc-editor.org/rfc/rfc9370' },
  { label: 'RFC 7383 (IKE Fragmentation)', href: 'https://www.rfc-editor.org/rfc/rfc7383' },
  {
    label: 'draft-ietf-ipsecme-ikev2-mlkem',
    href: 'https://datatracker.ietf.org/doc/draft-ietf-ipsecme-ikev2-mlkem/',
  },
  {
    label: 'draft-sfluhrer-ipsecme-ikev2-mldsa',
    href: 'https://datatracker.ietf.org/doc/draft-sfluhrer-ipsecme-ikev2-mldsa/',
  },
  { label: 'RFC 9881 (ML-DSA in X.509)', href: 'https://www.rfc-editor.org/rfc/rfc9881' },
  { label: 'FIPS 203 (ML-KEM)', href: 'https://doi.org/10.6028/NIST.FIPS.203' },
  { label: 'FIPS 204 (ML-DSA)', href: 'https://doi.org/10.6028/NIST.FIPS.204' },
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

function Pill({ ok, label }: { ok: boolean; label: string }) {
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

function kePayloadBytes(exchange: IKEv2ExchangeData, side: 'initiator' | 'responder'): number {
  const msg = side === 'initiator' ? exchange.ikeSaInit.initiator : exchange.ikeSaInit.responder
  return msg.payloads.find((p) => p.abbreviation === 'KE')?.sizeBytes ?? 0
}

function intermediateBytes(exchange: IKEv2ExchangeData): number {
  if (!exchange.ikeIntermediate) return 0
  const sum = (payloads: { sizeBytes: number }[]) => payloads.reduce((a, p) => a + p.sizeBytes, 0)
  return (
    sum(exchange.ikeIntermediate.initiator.payloads) +
    sum(exchange.ikeIntermediate.responder.payloads)
  )
}

function ModeCard({ mode, selected }: { mode: IKEv2Mode; selected: boolean }) {
  const config = IKE_V2_MODES.find((m) => m.id === mode)
  const exchange = exchangeFor(mode)
  const kexSafe = KEX_QUANTUM_SAFE[mode === 'pure-pqc' ? 'pure-pqc' : mode]
  if (!config) return null

  const maxTotal = Math.max(...IKE_V2_MODES.map((m) => exchangeFor(m.id).totalBytes))
  const maxKe = Math.max(
    ...IKE_V2_MODES.flatMap((m) => [
      kePayloadBytes(exchangeFor(m.id), 'initiator'),
      kePayloadBytes(exchangeFor(m.id), 'responder'),
    ])
  )
  const Icon = kexSafe ? ShieldCheck : ShieldAlert
  const accent = kexSafe
    ? { text: 'text-primary', ring: 'border-primary/20', bar: 'from-primary to-accent' }
    : {
        text: 'text-destructive',
        ring: 'border-destructive/20',
        bar: 'from-destructive to-status-warning',
      }

  return (
    <div
      className={`glass-panel p-5 relative overflow-hidden ${accent.ring} ${
        selected ? 'ring-1 ring-primary/50' : ''
      }`}
    >
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${accent.bar}`} />
      <div className="flex items-start gap-2 mb-3">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${accent.text}`} />
        <h4 className={`text-sm font-bold ${accent.text}`}>{config.label}</h4>
        {selected && (
          <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary">
            selected
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        <Pill ok={kexSafe} label="KEX quantum-safe" />
        <Pill ok={kexSafe} label="HNDL-safe" />
      </div>

      <dl className="space-y-2 text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Key exchange</dt>
          <dd className="font-mono text-foreground text-right">{config.dhGroup}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Round trips</dt>
          <dd className="font-mono text-foreground text-right">
            {exchange.roundTrips}
            {exchange.ikeIntermediate ? ' (incl. IKE_INTERMEDIATE)' : ''}
          </dd>
        </div>

        <div className="pt-2 space-y-1.5">
          <p className="text-muted-foreground font-medium">Handshake total (PSK baseline)</p>
          <SizeBar
            bytes={exchange.totalBytes}
            max={maxTotal}
            className={kexSafe ? 'bg-primary/80' : 'bg-destructive/60'}
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-muted-foreground font-medium">KE payload (SA_INIT →)</p>
          <SizeBar
            bytes={kePayloadBytes(exchange, 'initiator')}
            max={maxKe}
            className={kexSafe ? 'bg-primary/80' : 'bg-destructive/60'}
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-muted-foreground font-medium">KE payload (SA_INIT ←)</p>
          <SizeBar
            bytes={kePayloadBytes(exchange, 'responder')}
            max={maxKe}
            className={kexSafe ? 'bg-primary/80' : 'bg-destructive/60'}
          />
        </div>
        {exchange.ikeIntermediate && (
          <div className="space-y-1.5">
            <p className="text-muted-foreground font-medium">Additional KE (IKE_INTERMEDIATE ⇄)</p>
            <SizeBar bytes={intermediateBytes(exchange)} max={maxKe} className="bg-secondary/80" />
          </div>
        )}

        <div className="pt-2 border-t border-border/30">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Authentication is a separate axis: PSK or RSA certificates remain classical in every
            mode — only ML-DSA certificates make IKE_AUTH quantum-safe (see table below).
          </p>
        </div>
      </dl>
    </div>
  )
}

export function VpnComparisonPanel({ selectedMode }: Props) {
  const authEntries = Object.entries(IKE_AUTH_SK_BYTES)
  const maxAuth = Math.max(...authEntries.map(([, b]) => b))

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Network className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          IKEv2 handshake — classical vs hybrid vs pure-PQC
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {IKE_V2_MODES.map((mode) => (
          <ModeCard key={mode.id} mode={mode.id} selected={selectedMode === mode.id} />
        ))}
      </div>

      {/* IKE_AUTH growth per auth method */}
      <div className="glass-panel p-4 space-y-2">
        <h4 className="text-xs font-semibold text-foreground">
          IKE_AUTH growth by authentication method (SK payload, one message)
        </h4>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Certificate authentication adds the peer certificate plus the AUTH signature to the
          encrypted IKE_AUTH payload. ML-DSA pushes IKE_AUTH well past a 1,500 B MTU — this is the
          message that most needs RFC 7383 fragmentation (IKE_SA_INIT cannot fragment at all).
        </p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-1.5 pr-3 text-muted-foreground font-semibold">
                Auth method
              </th>
              <th className="text-left py-1.5 pr-3 text-muted-foreground font-semibold w-full">
                Estimated SK payload
              </th>
              <th className="text-left py-1.5 text-muted-foreground font-semibold whitespace-nowrap">
                Quantum-safe
              </th>
            </tr>
          </thead>
          <tbody>
            {authEntries.map(([method, bytes]) => {
              const isMlDsa = method.startsWith('ML-DSA')
              const isPsk = method === 'PSK'
              return (
                <tr key={method} className="border-b border-border/20">
                  <td className="py-1.5 pr-3 font-mono text-foreground whitespace-nowrap">
                    {method}
                  </td>
                  <td className="py-1.5 pr-3">
                    <SizeBar
                      bytes={bytes}
                      max={maxAuth}
                      className={
                        isMlDsa
                          ? 'bg-primary/80'
                          : isPsk
                            ? 'bg-muted-foreground/50'
                            : 'bg-destructive/60'
                      }
                    />
                  </td>
                  <td className="py-1.5">
                    {isMlDsa || isPsk ? (
                      <span className="text-status-success">✓</span>
                    ) : (
                      <span className="text-status-error">✗</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          ML-KEM key exchange uses IANA-assigned IKEv2 KE Methods 35/36/37 (ML-KEM-512/768/1024);
          the ML-DSA IKEv2 AUTH method (draft-sfluhrer-ipsecme-ikev2-mldsa) has no IANA assignment
          yet. ML-DSA X.509 certificate OIDs are standardised in RFC 9881. PSK authentication is
          symmetric and therefore quantum-resistant, provided the key is distributed securely and
          has sufficient entropy.
        </p>
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
        Migrating IKEv2 to post-quantum cryptography swaps the plaintext key exchange first — that
        is where HNDL bites. Hybrid mode chains ML-KEM-768 (primary KE slot of IKE_SA_INIT) with
        ECP-256 over an extra IKE_INTERMEDIATE round trip (
        {IKE_V2_EXCHANGES.hybrid.totalBytes.toLocaleString()} B /{' '}
        {IKE_V2_EXCHANGES.hybrid.roundTrips} RTT vs{' '}
        {IKE_V2_EXCHANGES.classical.totalBytes.toLocaleString()} B /{' '}
        {IKE_V2_EXCHANGES.classical.roundTrips} RTT classical), re-deriving SKEYSEED per RFC 9370
        §2.2.2 so both algorithms must fall before the session keys do. Pure-PQC drops the classical
        round entirely ({IKE_V2_EXCHANGES['pure-pqc'].totalBytes.toLocaleString()} B /{' '}
        {IKE_V2_EXCHANGES['pure-pqc'].roundTrips} RTT). In this simulator the ML-KEM-768
        encapsulation and decapsulation run as real C_EncapsulateKey / C_DecapsulateKey calls on
        softhsmv3 WASM, keeping the shared secret inside the PKCS#11 token boundary.
      </p>
    </div>
  )
}
