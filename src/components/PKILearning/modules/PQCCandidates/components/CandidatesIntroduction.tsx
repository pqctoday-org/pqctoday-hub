// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import {
  Workflow,
  ShieldCheck,
  Boxes,
  Globe,
  Compass,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  CircleDashed,
  Wrench,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { FAMILY_LIST } from '../data/families'
import { LIFECYCLE_EVENTS } from '../data/rounds'
import { WORLDWIDE_BODIES } from '../data/worldwideBodies'
import { KPQC_CANDIDATES, CACR_CANDIDATES } from '../data/nationalCandidates'

interface CandidatesIntroductionProps {
  onNavigateToWorkshop: () => void
}

const EVENT_KIND_BADGE: Record<string, { label: string; tone: string }> = {
  milestone: { label: 'Milestone', tone: 'bg-primary/10 text-primary border-primary/30' },
  selection: {
    label: 'Selection',
    tone: 'bg-status-info/10 text-status-info border-status-info/30',
  },
  cryptanalysis: {
    label: 'Cryptanalysis',
    tone: 'bg-status-error/10 text-status-error border-status-error/30',
  },
  reparameterisation: {
    label: 'Reparameterisation',
    tone: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  },
  standardisation: {
    label: 'Standardisation',
    tone: 'bg-status-success/10 text-status-success border-status-success/30',
  },
}

export const CandidatesIntroduction: React.FC<CandidatesIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  const drillDowns = WORLDWIDE_BODIES.filter((b) => b.depth === 'drill-down')
  const surveys = WORLDWIDE_BODIES.filter((b) => b.depth === 'survey')

  return (
    <div className="space-y-6 w-full">
      {/* Section 1 — Rolling process */}
      <section id="rolling-process" className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Workflow size={20} /> Standardisation is a rolling process
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          Post-quantum cryptography is not a single 2024 event. NIST has already published one KEM
          and three signatures, picked an alternate KEM, and is mid-flight on a signature on-ramp.
          Korea, China, and Japan each run parallel national tracks. International bodies (ISO/IEC,
          IETF, ETSI) layer compatibility and protocol bindings on top. New candidates will keep
          arriving — the operational question is not <em>which algorithm wins</em> but{' '}
          <em>how fast your stack can absorb the next one</em>.
        </p>
        <div className="space-y-2">
          {LIFECYCLE_EVENTS.slice(0, 8).map((evt) => {
            const badge = EVENT_KIND_BADGE[evt.kind]
            return (
              <div
                key={evt.id}
                className="flex items-start gap-3 rounded-md border border-border bg-card/50 p-3"
              >
                <div className="font-mono text-xs text-muted-foreground w-24 shrink-0 pt-0.5">
                  {evt.date}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${badge.tone}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{evt.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{evt.detail}</p>
                </div>
              </div>
            )
          })}
          <p className="text-xs text-muted-foreground italic pt-2">
            …and counting. The cryptanalysis timeline workshop step shows every event including the
            2025 wedge attack and ongoing reparameterisations.
          </p>
        </div>
      </section>

      {/* Section 2 — How candidates are validated */}
      <section id="validation" className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <ShieldCheck size={20} /> How candidates are validated
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          NIST evaluates submissions on four axes — security, performance, implementation
          characteristics, and intellectual property — then opens each round to public
          cryptanalysis. Attacks are not a failure of the process; they are the point. The 2022 SIKE
          break, the 2022 Rainbow break, the 2025 Ran wedge attack on UOV-family schemes — each
          event reshaped the field, eliminated some candidates, and forced others to reparameterise.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <div className="text-sm font-bold text-foreground mb-1">Security</div>
            <p className="text-xs text-muted-foreground">
              Reductions to a well-studied hard problem; tight ROM / QROM proofs; resistance to
              known attacks and side-channels.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <div className="text-sm font-bold text-foreground mb-1">Performance</div>
            <p className="text-xs text-muted-foreground">
              Key, signature, and ciphertext sizes; signing / verification / encapsulation cost;
              behaviour under constrained-device budgets.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <div className="text-sm font-bold text-foreground mb-1">
              Implementation characteristics
            </div>
            <p className="text-xs text-muted-foreground">
              Constant-time feasibility, hardware portability, side-channel resistance, ease of
              integration with existing TLS / X.509 / PKCS#11 stacks.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-4">
            <div className="text-sm font-bold text-foreground mb-1">Intellectual property</div>
            <p className="text-xs text-muted-foreground">
              Submission teams disclose patent claims; encumbered schemes face higher scrutiny.
              History: RSA's patent expiry shaped early PKI deployments.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-status-warning/30 bg-status-warning/5 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-status-warning shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-status-warning mb-1">
                Cryptanalysis is a feature, not a failure
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                When the Ran wedge attack revealed an exterior-product weakness in characteristic-2
                UOV parameter sets, three of UOV's four parameter sets fell below their security
                target, MAYO-2 lost ~30 bits, and most SNOVA parameter sets broke. The process
                worked: NIST surfaced the attack, teams proposed odd-characteristic
                reparameterisations, the surviving constructions are now better-understood.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — Four math families */}
      <section id="families" className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Boxes size={20} /> Four math families on the table
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          The nine third-round survivors break down into four mathematical families. Diversity
          across families is the entire point — if lattice math falls, the portfolio survives. The
          workshop's <strong>Family Math Explainer</strong> step shows animated visualisations of
          each construction.
        </p>
        <div className="space-y-3">
          {FAMILY_LIST.map((fam) => (
            <div
              key={fam.id}
              className={`rounded-lg border ${fam.borderClass} ${fam.bgClass} p-4 space-y-2`}
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <h3 className={`text-base font-bold ${fam.colorClass}`}>{fam.label}</h3>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {fam.candidateIds.join(' · ').toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-foreground/85 italic leading-relaxed">{fam.tagline}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                    Hardness
                  </div>
                  <p className="text-xs text-foreground/80 leading-snug">{fam.hardness}</p>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                    Why kept
                  </div>
                  <p className="text-xs text-foreground/80 leading-snug">{fam.whyKept}</p>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
                    Open concerns
                  </div>
                  <p className="text-xs text-foreground/80 leading-snug">{fam.openConcerns}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 4 — Worldwide parallel processes */}
      <section id="worldwide" className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Globe size={20} /> Worldwide parallel processes
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          NIST is not the only show. Korea, China, and Japan each run national tracks; international
          bodies (ISO/IEC, IETF, ETSI) layer compatibility and protocol bindings on top; and
          regional regulators (BSI, ANSSI) overlay deployment guidance. Different jurisdictions will
          ship different combinations of these outputs — your migration plan needs to know which
          ones apply to you.
        </p>
        <div className="space-y-3">
          {drillDowns.map((body) => (
            <div
              key={body.id}
              className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <h3 className="text-base font-bold text-primary">{body.name}</h3>
                <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
                  {body.region}
                </span>
              </div>
              <p className="text-sm text-foreground/85 italic">{body.role}</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{body.detail}</p>
              {body.id === 'kpqc' && KPQC_CANDIDATES.length > 0 && (
                <div className="mt-2 rounded border border-border bg-card/40 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">
                    KpqC finalists
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {KPQC_CANDIDATES.map((c) => (
                      <div key={c.id} className="text-xs">
                        <span className="font-semibold text-foreground">{c.name}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          · {c.kind} · {c.family}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {body.id === 'cacr-china' && CACR_CANDIDATES.length > 0 && (
                <div className="mt-2 rounded border border-border bg-card/40 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">
                    CACR finalists
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CACR_CANDIDATES.map((c) => (
                      <div key={c.id} className="text-xs">
                        <span className="font-semibold text-foreground">{c.name}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          · {c.kind} · {c.family}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <a
                href={body.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Reference <ArrowRight size={12} />
              </a>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-border bg-card/40 p-4">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-3">
            Other bodies tracking PQC
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {surveys.map((body) => (
              <div key={body.id} className="text-xs">
                <div className="font-semibold text-foreground">{body.name}</div>
                <div className="text-muted-foreground italic mb-1">{body.region}</div>
                <p className="text-muted-foreground leading-snug">{body.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 — What's coming next */}
      <section id="whats-next" className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Compass size={20} /> What's coming next
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          NIST signals a longer expected timeline for any multivariate standardisation, and is
          unlikely to standardise any of them without a further round of evaluation. Lattice (HAWK),
          isogeny (SQIsign), and the MPCitH candidates are on the faster track — earliest projected
          standardisation window is 2027. Korea targets 2029. ISO adoption will follow.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-status-success/30 bg-status-success/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-status-success" />
              <span className="text-sm font-bold text-status-success">Likely 2027 winners</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              HAWK, SQIsign, and at least one MPCitH scheme (likely FAEST or MQOM) are positioned
              for earliest standardisation.
            </p>
          </div>
          <div className="rounded-lg border border-status-warning/30 bg-status-warning/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CircleDashed size={16} className="text-status-warning" />
              <span className="text-sm font-bold text-status-warning">Extended track</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Multivariate (UOV / MAYO / QR-UOV / SNOVA) — needs another evaluation round to settle
              post-wedge-attack parameters.
            </p>
          </div>
          <div className="rounded-lg border border-status-info/30 bg-status-info/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wrench size={16} className="text-status-info" />
              <span className="text-sm font-bold text-status-info">Post-2030 cycles</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              KEM diversification beyond ML-KEM + HQC; long-tail review cycles for hardness
              assumptions that mature into the standardisation pipeline.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="gradient" onClick={onNavigateToWorkshop} className="gap-2">
            Explore the workshop <ArrowRight size={16} />
          </Button>
        </div>
      </section>

      <ReadingCompleteButton />
    </div>
  )
}
