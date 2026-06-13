// SPDX-License-Identifier: GPL-3.0-only
/**
 * Two-Track sequencing lesson (Applied Quantum §5, p.94–114).
 *
 * Teaches that a PQC migration program runs as two *parallel* workstreams with
 * different drivers, urgency, and standards readiness — not one monolithic
 * cutover. The split mirrors the canonical phase model's HNDL / HNFL framing
 * (`@/data/frameworkPhases` p3 crosswalk) and the threat split already taught in
 * the Quantum Threats module (linked below).
 *
 * Track B (Confidentiality / KEM) defends against Harvest-Now-Decrypt-Later:
 * data captured today is decrypted once a CRQC exists, so the clock is already
 * running and KEM migration is the urgent track. Track A (Authenticity /
 * Signatures) defends against Harvest-Now-Forge-Later: a forged signature only
 * has value at use-time, so the urgency is gated on CRQC arrival and on PQC
 * signature standards / PKI readiness rather than on data captured today.
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { Lock, FileSignature, ArrowRight, Layers, ClipboardCheck, ShieldAlert } from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'

interface TrackRow {
  label: string
  kem: string
  sig: string
}

const COMPARISON: TrackRow[] = [
  {
    label: 'Threat driver',
    kem: 'Harvest-Now-Decrypt-Later (HNDL) — ciphertext captured today is broken retroactively.',
    sig: 'Harvest-Now-Forge-Later (HNFL) — a forged signature only has value at use-time.',
  },
  {
    label: 'Clock',
    kem: 'Already running. Anything with a long secrecy lifetime is at risk now.',
    sig: 'Starts at CRQC arrival. Short-lived signatures rotate out before then.',
  },
  {
    label: 'Primary target',
    kem: 'Key establishment / encryption: TLS, VPN/IPsec, stored-data KEK wrapping.',
    sig: 'Authentication / integrity: PKI, code-signing, firmware, document signing.',
  },
  {
    label: 'NIST standard',
    kem: 'ML-KEM (FIPS 203) — stable since Aug 2024.',
    sig: 'ML-DSA (FIPS 204) / SLH-DSA (FIPS 205); on-ramp signatures still maturing.',
  },
  {
    label: 'Sequencing rule',
    kem: 'Lead. Prioritise by data secrecy-lifetime vs. Mosca window.',
    sig: 'Follow / parallel. Gate on PKI readiness, HSM support, and standards finalisation.',
  },
]

const TrackCard: React.FC<{
  icon: React.ReactNode
  track: string
  title: string
  subtitle: string
  accent: string
  bullets: string[]
}> = ({ icon, track, title, subtitle, accent, bullets }) => (
  <div className={`rounded-lg p-4 border ${accent}`}>
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 rounded-lg bg-background/60">{icon}</div>
      <div>
        <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {track}
        </div>
        <div className="text-sm font-bold text-foreground">{title}</div>
      </div>
    </div>
    <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
    <ul className="space-y-1.5">
      {bullets.map((b) => (
        <li key={b} className="flex items-start gap-2 text-xs text-foreground/80">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
          <span>{b}</span>
        </li>
      ))}
    </ul>
  </div>
)

export const TwoTrackSequencing: React.FC = () => (
  <div className="space-y-8 w-full">
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Layers size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Sequence the Program as Two Tracks</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          A PQC migration is <strong>not one cutover</strong>. It is two parallel workstreams with
          different drivers, different clocks, and different standards readiness. Confusing them
          leads programs either to over-invest early in signatures (where the threat is gated on a{' '}
          <InlineTooltip term="CRQC">CRQC</InlineTooltip> that does not yet exist) or to
          under-prioritise confidentiality (where the{' '}
          <InlineTooltip term="HNDL">Harvest-Now-Decrypt-Later</InlineTooltip> clock is already
          running).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TrackCard
            icon={<Lock size={20} className="text-primary" />}
            track="Track B — lead"
            title="Confidentiality (KEM)"
            subtitle="Defends against Harvest-Now-Decrypt-Later."
            accent="border-primary/30 bg-primary/5"
            bullets={[
              'Migrate key establishment first: TLS, VPN/IPsec, stored-data key wrapping.',
              'Prioritise by data secrecy-lifetime — long-lived secrets are already exposed.',
              'ML-KEM (FIPS 203) is standardised; hybrid (X25519+ML-KEM) is deployable now.',
            ]}
          />
          <TrackCard
            icon={<FileSignature size={20} className="text-secondary" />}
            track="Track A — follow / parallel"
            title="Authenticity (Signatures)"
            subtitle="Defends against Harvest-Now-Forge-Later."
            accent="border-secondary/30 bg-secondary/5"
            bullets={[
              'Migrate signing & PKI: code-signing, firmware, document & certificate signing.',
              'Urgency is gated on CRQC arrival, PKI/HSM readiness, and standards finalisation.',
              'ML-DSA / SLH-DSA (FIPS 204/205) plus on-ramp candidates still maturing.',
            ]}
          />
        </div>
      </div>
    </section>

    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <ShieldAlert size={24} className="text-primary" />
        </div>
        <h3 className="text-lg font-bold text-gradient">Track-A vs Track-B at a glance</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-3 font-semibold text-muted-foreground"> </th>
              <th className="py-2 px-3 font-semibold text-primary">
                Track B — Confidentiality (KEM)
              </th>
              <th className="py-2 pl-3 font-semibold text-secondary">
                Track A — Authenticity (Signatures)
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row) => (
              <tr key={row.label} className="border-b border-border/50 align-top">
                <td className="py-2 pr-3 font-medium text-foreground whitespace-nowrap">
                  {row.label}
                </td>
                <td className="py-2 px-3 text-foreground/80">{row.kem}</td>
                <td className="py-2 pl-3 text-foreground/80">{row.sig}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Rule of thumb: <strong>lead with KEM</strong> ordered by data secrecy-lifetime, run
        signatures in parallel gated on PKI readiness, and never block the confidentiality track
        waiting on signature-standard finalisation.
      </p>
    </section>

    <section className="glass-panel p-6 border-secondary/20">
      <h3 className="text-lg font-bold text-gradient mb-3">Where this connects</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Link
          to="/learn/quantum-threats"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <ShieldAlert size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Quantum Threats</div>
            <div className="text-xs text-muted-foreground">
              The HNDL vs HNFL threat split in depth
            </div>
          </div>
        </Link>
        <Link
          to="/assess"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <ClipboardCheck size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Risk Assessment</div>
            <div className="text-xs text-muted-foreground">
              Produces a sequenced Track-A / Track-B backlog
            </div>
          </div>
        </Link>
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
        Source: Applied Quantum PQC Migration Framework §5 (Migration Execution).
        <ArrowRight size={12} className="shrink-0" />
      </p>
    </section>
  </div>
)
