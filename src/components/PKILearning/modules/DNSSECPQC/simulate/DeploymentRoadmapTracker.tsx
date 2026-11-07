// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { CheckCircle2, Circle, ExternalLink } from 'lucide-react'
import { Link } from 'react-router'

interface RoadmapStep {
  id: string
  label: string
  detail: string
  done: boolean
  source: string
}

const CLOUDFLARE_STEPS: RoadmapStep[] = [
  {
    id: 'resolver-validation',
    label: 'Resolver-side validation',
    detail: '1.1.1.1 validates ML-DSA-44 (algorithm 18) by default against dnstest.dev.',
    done: true,
    source: 'Cloudflare blog, 2026-09-10',
  },
  {
    id: 'authoritative-signing',
    label: 'Authoritative-side signing support',
    detail: 'Zones need to be signable with ML-DSA, not just validatable.',
    done: false,
    source: "Cloudflare's stated next step",
  },
  {
    id: 'registrar-ds',
    label: 'Registrar DS-record support',
    detail:
      'Parent-zone delegation needs algorithm-18 DS records for the trust chain to reach a signed zone.',
    done: false,
    source: "Cloudflare's stated next step",
  },
  {
    id: 'full-pq',
    label: "Cloudflare's own PQ security target",
    detail:
      'Company-wide target, not a DNSSEC-specific date. Full end-to-end PQ DNSSEC also needs the root to become a trusted PQ anchor and other registries/registrars to adopt algorithm 18 — beyond what Cloudflare alone can deliver.',
    done: false,
    source: '~2029, Cloudflare blog',
  },
]

export const DeploymentRoadmapTracker: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {CLOUDFLARE_STEPS.map((step) => (
          <div
            key={step.id}
            className={`rounded-lg p-4 border flex items-start gap-3 ${
              step.done ? 'bg-success/5 border-success/30' : 'bg-muted/50 border-border'
            }`}
          >
            {step.done ? (
              <CheckCircle2 size={20} className="text-success shrink-0 mt-0.5" />
            ) : (
              <Circle size={20} className="text-muted-foreground shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-foreground">{step.label}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{step.source}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-warning/5 rounded-lg p-4 border border-warning/20 space-y-2">
        <h4 className="font-bold text-warning text-sm mb-1">
          A separate, broader scenario: the root zone&apos;s own algorithm rollovers
        </h4>
        <p className="text-xs text-muted-foreground">
          The DNS root zone&apos;s own algorithm change is a different, larger-scope migration than
          Cloudflare&apos;s roadmap above, and it has two distinct steps that should not be
          confused.
        </p>
        <p className="text-xs text-muted-foreground">
          <strong>First rollover (ICANN/IANA plan, classical).</strong> IANA&apos;s proposal of 3
          February 2026 sets a multi-year plan that starts with generating a new ECDSA Root KSK in
          2027 and ends with retiring the RSA Root KSK in 2029. After the comment period closed on 6
          April 2026, ICANN org said it will proceed with the rollover as proposed. ECDSA is a
          classical algorithm, so this plan does not make the root post-quantum.
        </p>
        <p className="text-xs text-muted-foreground">
          <strong>Second rollover (a dated, conditional scenario).</strong> In its December 2023
          comments on ICANN&apos;s draft study, Verisign reasoned that, with root KSK rollovers
          planned about five years apart and US government migration dates as early as 2035, the
          second root zone algorithm rollover &ldquo;in the mid-2030s may well involve the
          incorporation of post-quantum cryptography&rdquo;. That is a planning scenario from 2023,
          not an ICANN/IANA plan and not a forecast of when the root will move. Don&apos;t read
          Cloudflare&apos;s ~2029 target as a prediction for the whole DNS ecosystem either.
        </p>
      </div>

      <Link
        to="/algorithms?tab=support&protocol=dnssec"
        className="flex items-center gap-2 text-xs text-primary hover:underline"
      >
        See the live, continuously-tracked deployment record on the Protocol Support matrix{' '}
        <ExternalLink size={12} />
      </Link>
    </div>
  )
}
