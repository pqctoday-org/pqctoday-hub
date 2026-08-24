// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ChevronDown, LayoutDashboard, PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useBusinessMetrics } from '@/components/BusinessCenter/hooks/useBusinessMetrics'
import { ActionItemsSection } from '@/components/BusinessCenter/sections/ActionItemsSection'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import {
  computeZoneTiers,
  computeStepTiers,
  missingForNextTier,
  TIER_LABELS,
  primaryStepForZone,
  type MaturityTier,
} from '@/components/BusinessCenter/lib/cswp39Tier'
import { CSWP39_ZONE_DETAILS, type ZoneId } from '@/data/cswp39ZoneData'

const TIER_STYLES: Record<MaturityTier, string> = {
  1: 'bg-muted text-muted-foreground border-border',
  2: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  3: 'bg-status-info/15 text-status-info border-status-info/30',
  4: 'bg-status-success/15 text-status-success border-status-success/30',
}

// Same 4 board-level questions BusinessCenterView.tsx's own private
// BOARD_QUESTIONS/TOP_TOOL_IDS literals carry — replicated (module-local
// consts, not exported) rather than imported, matching this session's
// precedent for small real literals living alongside desktop-only JSX.
const BOARD_QUESTIONS: { q: string; desc: string; to: string; cta: string }[] = [
  {
    q: "What's at risk?",
    desc: 'Size your quantum exposure by system and data sensitivity.',
    to: '/assess',
    cta: 'Run risk assessment',
  },
  {
    q: "What's the deadline?",
    desc: 'See the mandates and dates that apply to your sector and region.',
    to: '/compliance?tab=compliance',
    cta: 'Compliance deadlines',
  },
  {
    q: 'What will it cost?',
    desc: 'Model the budget, ROI, and the cost of waiting.',
    to: '/business/tools/roi-calculator',
    cta: 'ROI calculator',
  },
  {
    q: 'Who owns it?',
    desc: 'Assign accountability and set the governance model.',
    to: '/business/tools/raci-builder',
    cta: 'RACI builder',
  },
]
const TOP_TOOL_IDS = ['roi-calculator', 'board-pitch', 'risk-register']

// "Missing for next tier" text is missingForNextTier() (cswp39Tier.ts) — moved
// there 2026-08-24 (audit R1.4) so it reads the same T thresholds and boolean
// gates the tier functions above it use, instead of a parallel copy.

const ZONE_ORDER: ZoneId[] = [
  'governance',
  'assets',
  'management-tools',
  'risk-management',
  'mitigation',
  'migration',
]

/**
 * Mobile Command Center (handoff Phase 8 — Workflow set, design handoff
 * §13). The mockup's framing — 5 CSWP.39 steps with badges, an "N open ·
 * nearest is X" action-items strip, a live Cyber Insurance Lens — doesn't
 * match live code (verified before writing any UI). Real bare `/business`
 * renders 6 Fig-3 zones (Governance/Assets/Management Tools/Data-Centric
 * Risk Management/Mitigation/Migration via computeZoneTiers()), not 5
 * step-badges (that UI exists only on /business/tools/:id). The real action
 * items heading is "Your next steps" with real generated titles — none is
 * "Q3 board update". The Cyber Insurance Lens is real, honestly-caveated
 * code, but was explicitly REMOVED from /business (git: "component file
 * retained") — resurrecting it here would show mobile readers something
 * desktop itself dropped, so it's omitted, per the user's explicit choice.
 * "34 planning tools" is stale — real count is 37 (BUSINESS_TOOLS.length).
 *
 * Scope confirmed with the user: 6 real zones (not a forced 5-step
 * reframing), no insurance lens. "What's missing for the next tier" doesn't
 * exist on desktop at all (TierBadge.tsx only ever shows reasons FOR the
 * achieved tier) — built here as genuinely new UI from the same real
 * threshold constants/boolean gates cswp39Tier.ts's own tier functions use,
 * not invented text (see missingForNextTier above).
 *
 * Reuses real desktop logic/components verbatim: useBusinessMetrics() (the
 * same real hook driving every Command Center panel), ActionItemsSection
 * (explicitly generic — already `max-md:flex-col`, no baked-in desktop-only
 * layout — imported directly), computeZoneTiers/computeStepTiers/
 * TIER_LABELS/ZONE_STEP_CONTRIBUTORS/primaryStepForZone (the real tier
 * computation, so a zone's maturity can never drift from desktop's), and
 * CSWP39_ZONE_DETAILS (the real 6 zone titles/descriptions/CSWP.39 refs).
 * BUSINESS_TOOLS is the real registry (37 tools, corrected from the
 * mockup's stale 34).
 */
export function MobileCommandCenterView() {
  const metrics = useBusinessMetrics()
  const [openZone, setOpenZone] = useState<ZoneId | null>(null)

  const zoneTiers = useMemo(() => computeZoneTiers(metrics), [metrics])
  const stepTiers = useMemo(() => computeStepTiers(metrics), [metrics])

  if (metrics.isFullyEmpty) {
    const topTools = TOP_TOOL_IDS.map((id) => BUSINESS_TOOLS.find((t) => t.id === id)).filter(
      (t): t is (typeof BUSINESS_TOOLS)[number] => Boolean(t)
    )
    return (
      <div className="px-4 pb-4 pt-4">
        <div className="mb-1">
          <h1 className="sr-only">Command Center</h1>
        </div>
        <div className="mt-3 glass-panel p-4 text-center">
          <LayoutDashboard
            size={32}
            className="mx-auto mb-3 text-muted-foreground"
            aria-hidden="true"
          />
          <h2 className="text-[14px] font-bold text-foreground">
            Welcome to your PQC Command Center
          </h2>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
            A post-quantum migration is a program, and every program answers the same four
            board-level questions.
          </p>
          <Link
            to="/simulation?run=exec"
            className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-secondary to-primary px-4 text-[11.5px] font-bold text-primary-foreground"
          >
            <PlayCircle size={13} aria-hidden="true" />
            New here? Watch the guided overview
          </Link>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {BOARD_QUESTIONS.map((item) => (
            <Link key={item.q} to={item.to} className="glass-panel p-3">
              <p className="text-[12.5px] font-bold text-foreground">{item.q}</p>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted-foreground">
                {item.desc}
              </p>
              <span className="mt-1 block text-[10.5px] font-semibold text-primary">
                {item.cta} →
              </span>
            </Link>
          ))}
        </div>
        {topTools.length > 0 && (
          <>
            <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Start with these tools
            </p>
            <div className="flex flex-col gap-2">
              {topTools.map((tool) => (
                <Link
                  key={tool.id}
                  to={`/business/tools/${tool.id}`}
                  className="glass-panel flex items-center gap-2.5 p-3"
                >
                  <tool.icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <p className="text-[12px] font-semibold text-foreground">{tool.name}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 pb-4 pt-4">
      <div className="mb-3">
        <h1 className="sr-only">Command Center</h1>
      </div>

      <ActionItemsSection metrics={metrics} cap={3} />

      <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        CSWP.39 posture — 6 zones
      </p>
      <p className="mb-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Each zone's tier is computed from the artifacts you have on file, not self-declared.
      </p>
      <div className="flex flex-col gap-2">
        {ZONE_ORDER.map((zoneId) => {
          const zone = CSWP39_ZONE_DETAILS[zoneId]
          const result = zoneTiers[zoneId]
          const isOpen = openZone === zoneId
          const step = primaryStepForZone(zoneId)
          const missing = missingForNextTier(step, metrics, stepTiers[step].tier)
          return (
            <div key={zoneId} className="glass-panel overflow-hidden">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpenZone((cur) => (cur === zoneId ? null : zoneId))}
                aria-expanded={isOpen}
                className="flex h-auto w-full items-center justify-start gap-2 rounded-none px-3.5 py-2.5 text-left"
              >
                <span className="flex-1 text-[12.5px] font-bold text-foreground">{zone.title}</span>
                <span
                  className={cn(
                    'rounded border px-1.5 py-0.5 text-sim-chip font-semibold',
                    TIER_STYLES[result.tier]
                  )}
                >
                  Tier {result.tier} · {TIER_LABELS[result.tier]}
                </span>
                <ChevronDown
                  size={14}
                  className={cn(
                    'shrink-0 text-muted-foreground transition-transform',
                    isOpen && 'rotate-180'
                  )}
                  aria-hidden="true"
                />
              </Button>
              {isOpen && (
                <div className="flex flex-col gap-2 border-t border-border px-3.5 pb-3 pt-2.5">
                  <p className="text-[10.5px] leading-relaxed text-muted-foreground">{zone.what}</p>
                  {result.reasons.length > 0 && (
                    <ul className="list-disc space-y-0.5 pl-4 text-[10.5px] text-muted-foreground">
                      {result.reasons.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  )}
                  {missing && (
                    <p className="rounded-lg border border-primary/20 bg-primary/5 p-2 text-[10.5px] leading-relaxed text-foreground/80">
                      For {TIER_LABELS[Math.min(4, stepTiers[step].tier + 1) as MaturityTier]}:{' '}
                      {missing}
                    </p>
                  )}
                  <p className="font-mono text-sim-chip text-muted-foreground">{zone.cswpRef}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        Read your maturity here. The {BUSINESS_TOOLS.length} planning tools, the CBOM builder, and
        the artifact drawer that produce these artifacts are on a laptop.
      </p>
    </div>
  )
}
