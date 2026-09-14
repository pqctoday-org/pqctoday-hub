// SPDX-License-Identifier: GPL-3.0-only
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

      <div className="bg-warning/5 rounded-lg p-4 border border-warning/20">
        <h4 className="font-bold text-warning text-sm mb-1">A separate, broader estimate</h4>
        <p className="text-xs text-muted-foreground">
          The DNS root zone&apos;s own algorithm rollover is a different, larger-scope migration
          than Cloudflare&apos;s roadmap above &mdash; Verisign estimates the{' '}
          <strong>mid-2030s</strong> as the realistic window for that step, since every delegation
          up to the root needs PQ support (the order in which levels migrate isn&apos;t fixed).
          Don&apos;t read Cloudflare&apos;s ~2029 target as a prediction for the whole DNS
          ecosystem.
        </p>
      </div>

      <Link
        to="/algorithms"
        className="flex items-center gap-2 text-xs text-primary hover:underline"
      >
        See the live, continuously-tracked deployment record on the Protocol Support matrix{' '}
        <ExternalLink size={12} />
      </Link>
    </div>
  )
}
