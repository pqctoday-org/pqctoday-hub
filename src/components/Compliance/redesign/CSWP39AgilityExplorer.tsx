// SPDX-License-Identifier: GPL-3.0-only
//
// Redesigned NIST CSWP.39 explorer: turns a ~10-section vertical dump into a
// navigable, role-aware playbook with three sub-views — the 5-step agility
// cycle, a 4-tier maturity self-check, and an auditor evidence map.

import { useMemo, useState } from 'react'
import {
  RefreshCw,
  FileText,
  GraduationCap,
  Check,
  ExternalLink,
  ArrowRight,
  ChevronRight,
  Database,
} from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { ScrollFadeContainer } from '@/components/ui/ScrollFadeContainer'
import { usePersonaStore } from '@/store/usePersonaStore'
import { MaturityEvidenceGrid } from '../MaturityEvidenceGrid'
import { maturityRequirements } from '@/data/maturityGovernanceData'
import { complianceFrameworks } from '@/data/complianceData'
import {
  CSWP39_STEPS,
  CSWP39_TIERS,
  CSWP39_CROSS_WALK,
  CSWP39_SOURCE_METADATA,
  frameworksForStep,
  type CSWP39Step,
} from '../cswp39Data'
import {
  STEP_OWNERS,
  STEP_TONE,
  SATISFIES_ROWS,
  HYBRID_ROWS,
  DOSSIER_DEFS,
  personaLabel,
} from './cswp39RedesignData'
import { TONES, pillClasses, type Tone } from './tones'

type SubView = 'cycle' | 'maturity' | 'evidence'

const SUB_VIEWS: { id: SubView; label: string }[] = [
  { id: 'cycle', label: 'Agility cycle' },
  { id: 'maturity', label: 'Maturity self-check' },
  { id: 'evidence', label: 'Evidence map' },
]

const TIER_TONE: Record<'error' | 'warning' | 'info' | 'success', Tone> = {
  error: 'error',
  warning: 'warning',
  info: 'info',
  success: 'success',
}

interface CSWP39AgilityExplorerProps {
  /** Jump to the Landscape pillar table pre-filtered to a framework. */
  onNavigateToFramework?: (
    targetTab: 'standards' | 'technical' | 'certification' | 'compliance',
    searchQuery: string
  ) => void
  /** Deep-link into the authoritative-evidence grid, filtered to a source refId. */
  evref?: string
  onClearEvref?: () => void
}

export function CSWP39AgilityExplorer({
  onNavigateToFramework,
  evref,
  onClearEvref,
}: CSWP39AgilityExplorerProps) {
  const persona = usePersonaStore((s) => s.selectedPersona)
  const [view, setView] = useState<SubView>(evref ? 'evidence' : 'cycle')
  const [stepId, setStepId] = useState<CSWP39Step['id']>('govern')
  const [tier, setTier] = useState(2)
  const [openDossier, setOpenDossier] = useState<string | null>(null)

  // A fresh evref deep-link (e.g. from a Landscape drawer crosswalk) snaps to
  // the evidence view so the filtered grid is visible. Adjusting state during
  // render on a prop change is the React-recommended pattern (vs. an effect).
  const [prevEvref, setPrevEvref] = useState(evref)
  if (evref !== prevEvref) {
    setPrevEvref(evref)
    if (evref) setView('evidence')
  }

  const ownedSteps = useMemo(
    () =>
      persona
        ? CSWP39_STEPS.filter((s) => STEP_OWNERS[s.id].includes(persona)).map((s) => s.title)
        : [],
    [persona]
  )

  return (
    <div className="space-y-4" id="cswp39-cross-walk">
      {/* Compact hero */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RefreshCw size={20} />
          </span>
          <div>
            <h2 className="text-base font-bold text-foreground">
              NIST CSWP.39 — Achieving Cryptographic Agility
            </h2>
            <p className="text-xs text-muted-foreground">
              A continuously repeated 5-step process · 4-tier maturity model ·{' '}
              {CSWP39_SOURCE_METADATA.documentVersion} · {CSWP39_SOURCE_METADATA.publicationDate}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={CSWP39_SOURCE_METADATA.localPdfPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/30"
          >
            <FileText size={13} />
            PDF
          </a>
          <Link
            to="/learn/standards-bodies"
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
          >
            <GraduationCap size={13} />
            Learn module
          </Link>
        </div>
      </div>

      {/* Role lens */}
      {persona && ownedSteps.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs">
          <span className="font-semibold uppercase tracking-wide text-muted-foreground">
            Role lens
          </span>
          <span className="text-foreground/90">
            As <span className="font-semibold text-primary">{personaLabel(persona)}</span>, you own{' '}
            <span className="font-semibold text-foreground">{ownedSteps.join(' · ')}</span> in this
            playbook.
          </span>
        </div>
      )}

      {/* Sub-nav */}
      <ScrollFadeContainer>
        <div
          className="inline-flex rounded-xl border border-input bg-muted/40 p-1"
          role="tablist"
          aria-label="CSWP.39 views"
        >
          {SUB_VIEWS.map((v) => (
            <Button
              key={v.id}
              type="button"
              variant="ghost"
              role="tab"
              aria-selected={view === v.id}
              onClick={() => setView(v.id)}
              className={`h-auto rounded-lg px-3 py-1.5 text-xs font-semibold ${
                view === v.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {v.label}
            </Button>
          ))}
        </div>
      </ScrollFadeContainer>

      {view === 'cycle' && (
        <CycleView
          persona={persona}
          stepId={stepId}
          onStepChange={setStepId}
          onNavigateToFramework={onNavigateToFramework}
        />
      )}
      {view === 'maturity' && <MaturityView tier={tier} onTierChange={setTier} />}
      {view === 'evidence' && (
        <EvidenceView
          openDossier={openDossier}
          onToggleDossier={setOpenDossier}
          evref={evref}
          onClearEvref={onClearEvref}
        />
      )}
    </div>
  )
}

// ── D1: Agility cycle ───────────────────────────────────────────────────────

function CycleView({
  persona,
  stepId,
  onStepChange,
  onNavigateToFramework,
}: {
  persona: ReturnType<typeof usePersonaStore.getState>['selectedPersona']
  stepId: CSWP39Step['id']
  onStepChange: (id: CSWP39Step['id']) => void
  onNavigateToFramework?: CSWP39AgilityExplorerProps['onNavigateToFramework']
}) {
  const sel = CSWP39_STEPS.find((s) => s.id === stepId) ?? CSWP39_STEPS[0]
  const selTone = STEP_TONE[sel.id]
  const crosswalk = CSWP39_CROSS_WALK.find((c) => c.stepId === sel.id)?.frameworks ?? []
  const owners = STEP_OWNERS[sel.id]
  // Live, data-driven — reflects each compliance row's own cswp39_tags
  // (unlike CSWP39_CROSS_WALK above, which is hand-curated and static).
  const liveFrameworks = useMemo(() => frameworksForStep(sel.id, complianceFrameworks), [sel.id])

  return (
    <div className="space-y-4">
      {/* 5-step flow */}
      <div className="flex flex-col items-stretch gap-2 sm:flex-row">
        {CSWP39_STEPS.map((s, i) => {
          const tone = TONES[STEP_TONE[s.id]]
          const active = s.id === stepId
          const owned = persona ? STEP_OWNERS[s.id].includes(persona) : false
          return (
            <div key={s.id} className="flex flex-1 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                aria-pressed={active}
                onClick={() => onStepChange(s.id)}
                className={`flex h-auto flex-1 flex-col items-center gap-1.5 whitespace-normal rounded-xl border p-3 ${
                  active
                    ? `${tone.border} ${tone.softBg}`
                    : owned
                      ? `${tone.border} bg-muted/20`
                      : 'border-border bg-card'
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-extrabold ${
                    active ? `${tone.solidBg} ${tone.onSolid}` : `bg-muted ${tone.text}`
                  }`}
                >
                  {s.number}
                </span>
                <span className="text-center text-[11.5px] font-bold leading-tight text-foreground">
                  {s.title}
                </span>
                {owned && !active && (
                  <span className="text-[8.5px] font-bold uppercase tracking-wide text-primary">
                    Your step
                  </span>
                )}
              </Button>
              {i < CSWP39_STEPS.length - 1 && (
                <ArrowRight size={14} className="hidden shrink-0 text-muted-foreground sm:block" />
              )}
            </div>
          )
        })}
      </div>
      <p className="text-right text-[11px] italic text-muted-foreground">
        The cycle repeats continuously — agility is never &lsquo;done&rsquo;.
      </p>

      {/* Selected-step detail */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h3 className="text-base font-bold text-foreground">{sel.title}</h3>
          <span className={pillClasses(selTone)}>{sel.cpmPillar}</span>
          <span className="font-mono text-[11px] text-muted-foreground">{sel.sectionRef}</span>
        </div>
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{sel.explainer}</p>

        <div className="grid gap-5 md:grid-cols-2">
          {/* What it requires */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What it requires
            </h4>
            <ul className="space-y-1.5">
              {sel.requirements.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/90">
                  <Check size={13} className="mt-0.5 shrink-0 text-status-success" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Maps to frameworks + owned by */}
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Maps to frameworks
              </h4>
              <div className="space-y-1.5">
                {crosswalk.map((fw) => (
                  <Button
                    key={fw.label}
                    type="button"
                    variant="ghost"
                    onClick={() => onNavigateToFramework?.(fw.targetTab, fw.searchQuery)}
                    className="flex h-auto w-full items-center gap-2 whitespace-normal rounded-lg border border-border bg-muted/20 px-3 py-2 text-left hover:border-primary/30"
                  >
                    <span className="text-xs font-semibold text-foreground">{fw.label}</span>
                    <span className="min-w-0 flex-1 truncate text-[10.5px] text-muted-foreground">
                      {fw.hint}
                    </span>
                    <ExternalLink size={12} className="shrink-0 text-muted-foreground" />
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Frameworks tagged for this step
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                  {liveFrameworks.length}
                </span>
              </h4>
              {liveFrameworks.length > 0 ? (
                <div className="space-y-1.5">
                  {liveFrameworks.map((fw) => (
                    <Button
                      key={fw.id}
                      type="button"
                      variant="ghost"
                      onClick={() => onNavigateToFramework?.('compliance', fw.label)}
                      className="flex h-auto w-full items-center gap-2 whitespace-normal rounded-lg border border-border bg-muted/20 px-3 py-2 text-left hover:border-primary/30"
                    >
                      <span className="text-xs font-semibold text-foreground">{fw.label}</span>
                      <span className="min-w-0 flex-1 truncate text-[10.5px] text-muted-foreground">
                        {fw.enforcementBody}
                      </span>
                      <ExternalLink size={12} className="shrink-0 text-muted-foreground" />
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-border bg-muted/10 px-3 py-2 text-[11px] text-muted-foreground">
                  No compliance rows are tagged {sel.cpmPillar.toLowerCase()} yet.
                </p>
              )}
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Owned by
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {owners.map((pid) => {
                  const mine = pid === persona
                  return (
                    <span
                      key={pid}
                      className={`rounded-md border px-2.5 py-1 text-[10px] font-semibold ${
                        mine
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-input text-muted-foreground'
                      }`}
                    >
                      {personaLabel(pid)}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── D2: Maturity self-check ─────────────────────────────────────────────────

function MaturityView({ tier, onTierChange }: { tier: number; onTierChange: (t: number) => void }) {
  const cur = CSWP39_TIERS.find((t) => t.level === tier) ?? CSWP39_TIERS[0]
  const next = CSWP39_TIERS.find((t) => t.level === tier + 1)
  const atTop = !next

  return (
    <div className="space-y-4">
      {/* Tier selector */}
      <div className="flex flex-col gap-2 sm:flex-row">
        {CSWP39_TIERS.map((t) => {
          const tone = TONES[TIER_TONE[t.tone]]
          const reached = t.level <= tier
          const active = t.level === tier
          return (
            <Button
              key={t.level}
              type="button"
              variant="ghost"
              aria-pressed={active}
              onClick={() => onTierChange(t.level)}
              className={`h-auto flex-1 flex-col items-center whitespace-normal rounded-xl border p-3 ${
                active
                  ? `${tone.border} ${tone.softBg}`
                  : reached
                    ? `${tone.border} bg-muted/20`
                    : 'border-border bg-card'
              }`}
            >
              <span
                className={`text-[9px] font-bold uppercase tracking-wide ${reached ? tone.text : 'text-muted-foreground'}`}
              >
                Tier {t.level}
              </span>
              <span
                className={`text-sm font-bold ${reached ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                {t.name}
              </span>
            </Button>
          )
        })}
      </div>

      {/* You are here + to reach next */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${TONES[TIER_TONE[cur.tone]].solidBg}`} />
            <h3 className="text-sm font-bold text-foreground">You are here · {cur.name}</h3>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{cur.characteristics}</p>
        </div>

        {atTop ? (
          <div className="rounded-2xl border border-status-success/40 bg-status-success/5 p-5">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-status-success">
              <Check size={15} />
              Top tier reached
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Sustain adaptive agility: keep policy-as-code enforcement, continuous CMVP/ACVP sync,
              and board-level attestation running.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-5">
            <h3 className="mb-2 text-sm font-bold text-foreground">To reach {next!.name}</h3>
            <ul className="space-y-1.5">
              {next!.howToReach.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/90">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-input text-[9px] text-muted-foreground">
                    {i + 1}
                  </span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// ── D3: Evidence map ────────────────────────────────────────────────────────

function EvidenceView({
  openDossier,
  onToggleDossier,
  evref,
  onClearEvref,
}: {
  openDossier: string | null
  onToggleDossier: (id: string | null) => void
  evref?: string
  onClearEvref?: () => void
}) {
  const uniqueSources = useMemo(() => new Set(maturityRequirements.map((r) => r.refId)).size, [])
  const cswpRequirements = useMemo(
    () =>
      maturityRequirements.filter(
        (r) => /CSWP\s*39/i.test(r.sourceName) || /CSWP\s*39/i.test(r.refId)
      ),
    []
  )
  const kpi = useMemo(() => {
    // 4 levels × 5 pillars = 20 cells in the canonical agility grid.
    const populated = new Set(cswpRequirements.map((r) => `${r.maturityLevel}:${r.pillar}`)).size
    const confidenceMap = { low: 25, medium: 60, high: 95 } as const
    const confidenceSum = cswpRequirements.reduce(
      (sum, r) => sum + (confidenceMap[r.confidence] ?? 0),
      0
    )
    const meanConfidence = cswpRequirements.length
      ? Math.round(confidenceSum / cswpRequirements.length)
      : 0
    return {
      coverage: Math.round((populated / 20) * 100),
      populated,
      total: 20,
      meanConfidence,
      recordCount: cswpRequirements.length,
    }
  }, [cswpRequirements])

  return (
    <div className="space-y-5">
      {/* Authoritative evidence — the real LLM-extracted governance corpus. */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Database size={18} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Authoritative Evidence — {maturityRequirements.length} requirements from{' '}
              {uniqueSources} sources
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              LLM-extracted governance obligations mapped to each CSWP.39 pillar and maturity tier.
              Click any highlighted cell to see sourced requirements.
            </p>
          </div>
        </div>
        <div className="mb-4 grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-3">
          <KpiCell
            label="CSWP-39 grid coverage"
            value={`${kpi.coverage}%`}
            sub={`${kpi.populated}/${kpi.total} cells populated`}
          />
          <KpiCell
            label="Mean confidence"
            value={`${kpi.meanConfidence}/100`}
            sub={
              kpi.recordCount > 0
                ? 'across extracted CSWP-39 requirements'
                : 'no CSWP-39 requirements extracted yet'
            }
          />
          <KpiCell
            label="CSWP-39 source records"
            value={String(kpi.recordCount)}
            sub="rows in the CSWP-39 slice"
          />
        </div>
        <MaturityEvidenceGrid
          requirements={maturityRequirements}
          initialRefFilter={evref}
          onClearRefFilter={onClearEvref}
        />
      </section>

      {/* Satisfies table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <ScrollFadeContainer>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-muted/40 text-[10.5px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Regulation</th>
                  <th className="px-4 py-2.5 font-semibold">Obligation</th>
                  <th className="px-4 py-2.5 font-semibold">Deliverable that satisfies it</th>
                  <th className="px-4 py-2.5 font-semibold">Phase</th>
                </tr>
              </thead>
              <tbody>
                {SATISFIES_ROWS.map((r) => (
                  <tr key={r.regulation} className="border-t border-border/60">
                    <td className="px-4 py-2.5 font-semibold text-foreground">{r.regulation}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.obligation}</td>
                    <td className="px-4 py-2.5 font-medium text-status-success">{r.deliverable}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex rounded-md border border-status-info/40 bg-status-info/10 px-2 py-0.5 text-[10px] font-semibold text-status-info">
                        {r.phase}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollFadeContainer>
      </div>

      {/* Hybrid vs pure-PQC */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Hybrid vs pure-PQC stance
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {HYBRID_ROWS.map((h) => (
            <div key={h.regime} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-foreground">{h.regime}</span>
                <span className={pillClasses(h.tone)}>{h.stance}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground/80">{h.jurisdiction}</span> —{' '}
                {h.position}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Auditor evidence dossiers */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Auditor evidence dossiers
        </h3>
        <div className="space-y-2">
          {DOSSIER_DEFS.map((d) => {
            const open = openDossier === d.id
            return (
              <div
                key={d.id}
                className={`overflow-hidden rounded-xl border bg-card ${
                  open ? 'border-status-success/40' : 'border-border'
                }`}
              >
                <Button
                  type="button"
                  variant="ghost"
                  aria-expanded={open}
                  onClick={() => onToggleDossier(open ? null : d.id)}
                  className="flex h-auto w-full items-center gap-2.5 whitespace-normal rounded-none px-4 py-3 text-left"
                >
                  <ChevronRight
                    size={15}
                    className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`}
                  />
                  <span className="text-sm font-semibold text-foreground">{d.regulation}</span>
                  <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
                    {d.focus}
                  </span>
                </Button>
                {open && (
                  <ul className="space-y-1.5 border-t border-border bg-muted/20 px-4 py-3">
                    {d.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground/90">
                        <Check size={13} className="mt-0.5 shrink-0 text-status-success" />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function KpiCell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xl font-extrabold text-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
  )
}
