// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronDown, HelpCircle, Laptop } from 'lucide-react'
import { useNavigate, Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import {
  STEP_META,
  TRACK_INFO,
  type AssessStepKey,
} from '@/components/Assess/redesign/assessFlowModel'
import { useAssessFlow } from '@/components/Assess/redesign/useAssessFlow'
import { summarizeAnswer } from '@/components/Assess/redesign/reviewModel'
import { AVAILABLE_INDUSTRIES, DATA_SENSITIVITY_SCORES } from '@/hooks/assessmentData'
import { ALL_JURISDICTIONS } from '@/data/jurisdictionsData'
import { complianceFrameworks, type ComplianceFramework } from '@/data/complianceData'
import {
  applicableFrameworks,
  isProfileEmpty,
  TIER_META,
  type ApplicabilityTier,
  type ApplicabilityResult,
} from '@/utils/applicabilityEngine'

// Same tier order + informational-omitted filter Step5Compliance.tsx's own
// groupedByTier memo uses — real applicability engine, not a flat unfiltered
// list. Fixes a real bug found in the 2026-08-24 Assess step audit: the
// prior AVAILABLE_COMPLIANCE list was the UNFILTERED 219-row CSV (34 of
// those labels deprecated/obsolete) with no industry/country relevance at
// all, so mobile could offer frameworks desktop's own step would never show.
const COMPLIANCE_TIER_ORDER: ApplicabilityTier[] = [
  'mandatory',
  'recognized',
  'cross-border',
  'advisory',
]

const CRYPTO_CATEGORIES = ['Key Exchange', 'Signatures', 'Symmetric Encryption', 'Hash & MAC']

// Same key→label map Step4Sensitivity.tsx's own SENSITIVITY_BADGE_STYLES
// carries — replicated (a 4-entry literal, not worth an ESLint exception on
// a step component with JSX) so the wording can never drift.
const SENSITIVITY_LABEL: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}
const SENSITIVITY_LEVELS = Object.keys(DATA_SENSITIVITY_SCORES)

type MigrationStatusValue = 'started' | 'planning' | 'not-started'

// Same 3 real options + default descriptions Step6Migration.tsx's own
// `statuses` array carries (the persona-varying description is a desktop-
// only refinement — mobile uses the same defaults every persona falls back
// to).
const MIGRATION_STATUSES: { value: MigrationStatusValue; label: string; description: string }[] = [
  {
    value: 'started',
    label: 'Already Started',
    description: 'We have begun implementing PQC algorithms in production or testing.',
  },
  {
    value: 'planning',
    label: 'Planning to Start',
    description: "We have a roadmap or budget allocated but haven't started implementation.",
  },
  {
    value: 'not-started',
    label: 'Not Started',
    description: 'We have not begun any PQC migration activities.',
  },
]

/**
 * Mobile Assess (handoff Phase 8 — Workflow set, design handoff §10/§11).
 *
 * The target screenshot and its own README prose disagree with each other
 * (screenshot: "1 of 6"; README: "1 of 8"), and a separate stale figure
 * ("14-step comprehensive") appears in both — none of these were trusted.
 * Verified against live code before writing any UI: the real quick track is
 * 6 steps (RENDER_ORDER_QUICK: industry, country, crypto, sensitivity,
 * compliance, migration), the real comprehensive track is 13 steps (not
 * 14), and real Q1 is "What industry are you in?" (industry) — the
 * screenshot's own "Which jurisdiction do you report into?" is actually
 * real Q2, worded slightly differently ("Which jurisdiction applies to your
 * organization?"). The screenshot's quoted worst-case-scoring sentence
 * doesn't exist verbatim anywhere in the codebase, and the real escape-hatch
 * button reads "I'm not sure — help me choose", not "I don't know" — used
 * here instead. Scoring itself is mostly NOT worst-case (only
 * `sensitivityUnknown` is; the rest use persona-aware conservative
 * defaults) — this screen doesn't claim otherwise.
 *
 * Reuses real desktop logic verbatim: useAssessFlow() (the identical
 * navigation/validation hook AssessViewRedesign.tsx itself uses — so
 * `currentStep` indexing, resume state and desktop stay in perfect sync,
 * never a second competing notion of "step 3"), STEP_META (real
 * question/subtitle/why/changesInReport per step — changesInReport is
 * already always-visible on desktop, not tucked into a disclosure as an
 * earlier plan draft assumed; only `why` is real desktop-collapsed content,
 * matched here), useAssessmentStore() (the same persisted, resumable
 * industry/country/crypto/sensitivity/compliance/migration fields and
 * setters every desktop step writes — Rule 2), and the real option data
 * (AVAILABLE_INDUSTRIES, ALL_JURISDICTIONS, DATA_SENSITIVITY_SCORES).
 * Compliance uses the real applicabilityEngine (applicableFrameworks/
 * TIER_META) instead of a flat list — same tiered, profile-relevant set
 * Step5Compliance.tsx computes, fixing a real bug the 2026-08-24 audit
 * found: the prior flat list was the unfiltered 219-row CSV, 34 of those
 * labels deprecated/obsolete, with no relevance filtering at all. Crypto
 * categories (4)
 * and migration-status options (3, with default descriptions) are small
 * real literals replicated from their step components rather than imported,
 * matching this session's established precedent for tiny non-worth-an-
 * exception data.
 *
 * Locks to the quick track — no track chooser — since the comprehensive
 * track's own step (Step11Infrastructure.tsx, 597 lines of multi-select
 * matrices) is a real, honest desktop-only cut, correctly stated below with
 * the corrected 13-step count.
 *
 * Mode-switch guard (2026-08-24 audit fix): useAssessFlow resolves
 * store.currentStep against the `mode` it's given via keyAtStoreIndex — if a
 * desktop user left a comprehensive run in progress and this screen mounted
 * the hook straight at mode:'quick', the comprehensive currentStep wouldn't
 * resolve in quick's renderOrder, and the hook's own snap-to-first-step
 * effect would silently zero their resume position the instant this
 * component rendered. So the hook is kept mounted against the store's own
 * (already in-progress) mode until the user explicitly picks a track here —
 * matching desktop's handleSwitchTrack, which never changes mode without an
 * explicit user action either.
 */
export function MobileAssessView() {
  const navigate = useNavigate()
  const store = useAssessmentStore()
  const selectedRegion = usePersonaStore((s) => s.selectedRegion)
  const complianceGroups = useMemo(() => {
    const profile = { industry: store.industry, country: store.country, region: selectedRegion }
    const results: ApplicabilityResult<ComplianceFramework>[] = isProfileEmpty(profile)
      ? complianceFrameworks.map((fw) => ({ item: fw, tier: 'advisory' as const, reason: '' }))
      : applicableFrameworks(profile).filter((r) => r.tier !== 'informational')
    const groups = new Map<ApplicabilityTier, ComplianceFramework[]>()
    for (const r of results) {
      const tier: ApplicabilityTier = COMPLIANCE_TIER_ORDER.includes(r.tier) ? r.tier : 'advisory'
      const list = groups.get(tier)
      if (list) list.push(r.item)
      else groups.set(tier, [r.item])
    }
    return groups
  }, [store.industry, store.country, selectedRegion])
  const [showWhy, setShowWhy] = useState(false)
  const [done, setDone] = useState(store.assessmentStatus === 'complete')
  // Restores the "no silent jump to the report" review moment desktop's own
  // last wizard step goes through (AssessReview.tsx) — this screen used to
  // call markComplete() directly from the last Next tap (an unlogged cut).
  const [showReview, setShowReview] = useState(false)

  const [pendingResumeChoice] = useState(
    () => store.assessmentMode === 'comprehensive' && store.industry !== ''
  )
  const [resumeResolved, setResumeResolved] = useState(!pendingResumeChoice)

  const flow = useAssessFlow({
    mode: resumeResolved ? 'quick' : (store.assessmentMode ?? 'quick'),
    onLastStep: () => setShowReview(true),
  })

  // Only takes effect once the user has resolved (or never had) a
  // comprehensive-in-progress conflict — never fires during the interstitial.
  useEffect(() => {
    if (resumeResolved && store.assessmentMode !== 'quick') {
      store.setAssessmentMode('quick')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeResolved])

  if (pendingResumeChoice && !resumeResolved) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 pb-4 pt-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Laptop size={20} className="text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-[16px] font-extrabold text-foreground">
          Comprehensive assessment in progress
        </h1>
        <p className="max-w-xs text-[11.5px] leading-relaxed text-muted-foreground">
          You have a comprehensive assessment underway — that track is best finished on a laptop.
          Restarting here switches to the shorter quick track and clears the comprehensive-only
          answers so they don&apos;t affect your score.
        </p>
        <Button
          type="button"
          variant="gradient"
          onClick={() => {
            store.setAssessmentMode('quick')
            store.setStep(0)
            setResumeResolved(true)
          }}
          className="mt-2 h-10 w-full max-w-xs text-[12.5px] font-bold"
        >
          Restart as quick assessment
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-[11px] text-muted-foreground"
        >
          Continue later — leave it as is
        </Button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 pb-4 pt-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-status-success/15">
          <Check size={22} className="text-status-success" aria-hidden="true" />
        </div>
        <h1 className="text-[16px] font-extrabold text-foreground">Assessment complete</h1>
        <p className="max-w-xs text-[11.5px] leading-relaxed text-muted-foreground">
          Your answers are saved. Open the report for your risk score, deadlines and roadmap.
        </p>
        <Link
          to="/report"
          className="mt-2 inline-flex h-10 items-center justify-center rounded-lg bg-gradient-to-r from-secondary to-primary px-5 text-[12.5px] font-bold text-primary-foreground"
        >
          View report
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            store.reset()
            setDone(false)
            setShowWhy(false)
            setShowReview(false)
          }}
          className="mt-1 text-[11px] text-muted-foreground"
        >
          Start over
        </Button>
      </div>
    )
  }

  if (showReview) {
    const answered = flow.renderOrder.filter((k) => flow.isValid(k)).length
    return (
      <div className="px-4 pb-4 pt-4">
        <h1 className="text-[17px] font-extrabold leading-tight text-foreground">
          Review your answers
        </h1>
        <p className="mb-4 mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
          Edit anything before we generate your fast-track report. {answered} of {flow.total}{' '}
          answered.
        </p>

        <div className="flex flex-col gap-2">
          {flow.renderOrder.map((k) => {
            const summary = summarizeAnswer(k, store)
            return (
              <div
                key={k}
                className="flex items-start gap-3 rounded-xl border border-border bg-card px-3.5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-foreground/90">
                    {STEP_META[k].question}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{summary.text}</p>
                </div>
                {summary.isDefault && (
                  <span className="mt-0.5 shrink-0 rounded-full bg-secondary/15 px-1.5 py-0.5 text-sim-chip font-bold text-secondary">
                    Recommended
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-5 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowReview(false)}
            className="h-10 gap-1 text-[12px]"
          >
            <ArrowLeft size={14} aria-hidden="true" /> Back
          </Button>
          <Button
            type="button"
            variant="gradient"
            size="sm"
            onClick={() => {
              store.markComplete()
              setDone(true)
            }}
            className="h-10 flex-1 gap-1 text-[12.5px]"
          >
            Generate my report
            <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>
    )
  }

  const key: AssessStepKey = flow.activeKey
  const meta = STEP_META[key]

  return (
    <div className="px-4 pb-4 pt-4">
      <div className="mb-1">
        <h1 className="text-[17px] font-extrabold leading-tight text-foreground">Assess</h1>
      </div>
      <p className="mb-3 text-[10.5px] font-bold uppercase tracking-wide text-primary">
        {TRACK_INFO.quick.label} · Step {flow.stepIdx + 1} of {flow.total}
      </p>

      <h2 className="text-[19px] font-extrabold leading-snug text-foreground">{meta.question}</h2>
      <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">{meta.subtitle}</p>

      <div className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5">
        <p className="text-[10.5px] leading-relaxed text-foreground/80">{meta.changesInReport}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowWhy((v) => !v)}
        aria-expanded={showWhy}
        className="mt-1 h-7 gap-1 px-1 text-[10.5px] text-muted-foreground"
      >
        <HelpCircle size={11} aria-hidden="true" />
        Why we ask
        <ChevronDown
          size={11}
          className={cn('transition-transform', showWhy && 'rotate-180')}
          aria-hidden="true"
        />
      </Button>
      {showWhy && (
        <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">{meta.why}</p>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {key === 'industry' && (
          <SingleSelectList
            options={AVAILABLE_INDUSTRIES}
            value={store.industry}
            onChange={store.setIndustry}
          />
        )}

        {key === 'country' && (
          <SingleSelectList
            options={ALL_JURISDICTIONS.map((j) => j.name)}
            value={store.country}
            onChange={store.setCountry}
          />
        )}

        {key === 'crypto' && (
          <>
            <MultiSelectChips
              options={CRYPTO_CATEGORIES}
              selected={store.currentCryptoCategories}
              onToggle={store.toggleCryptoCategory}
            />
            <UnknownToggle checked={store.cryptoUnknown} onChange={store.setCryptoUnknown} />
          </>
        )}

        {key === 'sensitivity' && (
          <>
            <MultiSelectChips
              options={SENSITIVITY_LEVELS}
              labels={SENSITIVITY_LABEL}
              selected={store.dataSensitivity}
              onToggle={store.toggleDataSensitivity}
            />
            <UnknownToggle
              checked={store.sensitivityUnknown}
              onChange={store.setSensitivityUnknown}
            />
            {/* Same real explanation Step4Sensitivity.tsx shows under its own
                toggle (2026-08-24 audit R4.6) — without it, the smart-default
                selection that fires when this toggle is checked reads as
                spooky (chips select themselves with no stated reason). */}
            {store.sensitivityUnknown && (
              <p className="text-[10.5px] italic text-muted-foreground">
                Recommended for {store.industry || 'your industry'}. You can adjust any selection.
              </p>
            )}
          </>
        )}

        {key === 'compliance' && (
          <>
            <div className="flex flex-col gap-3">
              {COMPLIANCE_TIER_ORDER.filter(
                (tier) => (complianceGroups.get(tier)?.length ?? 0) > 0
              ).map((tier) => (
                <div key={tier} className="flex flex-col gap-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {TIER_META[tier].label}
                  </p>
                  {complianceGroups.get(tier)!.map((fw) => {
                    const selected = store.complianceRequirements.includes(fw.label)
                    return (
                      <Button
                        key={fw.id}
                        type="button"
                        variant="ghost"
                        onClick={() => store.toggleCompliance(fw.label)}
                        aria-pressed={selected}
                        className={cn(
                          'h-auto flex-col items-start gap-0.5 whitespace-normal rounded-lg border p-2.5 text-left',
                          selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                        )}
                      >
                        <span className="text-[12px] font-semibold text-foreground">
                          {fw.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Deadline: {fw.deadline}
                        </span>
                      </Button>
                    )
                  })}
                </div>
              ))}
            </div>
            <UnknownToggle
              checked={store.complianceUnknown}
              onChange={store.setComplianceUnknown}
              label="Skip — won't change my score much"
            />
          </>
        )}

        {key === 'migration' && (
          <>
            <div className="flex flex-col gap-1.5">
              {MIGRATION_STATUSES.map((s) => {
                const selected = store.migrationStatus === s.value
                return (
                  <Button
                    key={s.value}
                    type="button"
                    variant="ghost"
                    onClick={() => store.setMigrationStatus(s.value)}
                    aria-pressed={selected}
                    className={cn(
                      'h-auto flex-col items-start gap-0.5 rounded-lg border p-2.5 text-left',
                      selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                    )}
                  >
                    <span className="text-[12px] font-semibold text-foreground">{s.label}</span>
                    <span className="text-[10.5px] text-muted-foreground">{s.description}</span>
                  </Button>
                )
              })}
            </div>
            <UnknownToggle checked={store.migrationUnknown} onChange={store.setMigrationUnknown} />
          </>
        )}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={flow.back}
          disabled={flow.stepIdx === 0}
          className="h-10 gap-1 text-[12px]"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Back
        </Button>
        <Button
          type="button"
          variant="gradient"
          size="sm"
          onClick={flow.next}
          disabled={!flow.canProceed}
          className="h-10 flex-1 gap-1 text-[12.5px]"
        >
          {flow.stepIdx === flow.total - 1 ? 'Finish' : 'Next'}
          <ArrowRight size={14} aria-hidden="true" />
        </Button>
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        The 13-step comprehensive assessment — infrastructure layers, crypto agility, and
        multi-select matrices like Step 11's 12-item crypto-library picker — stays on a laptop.
      </p>
    </div>
  )
}

function SingleSelectList({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <>
      {options.map((opt) => {
        const selected = value === opt
        return (
          <Button
            key={opt}
            type="button"
            variant="ghost"
            onClick={() => onChange(opt)}
            aria-pressed={selected}
            className={cn(
              'h-auto justify-start rounded-lg border p-2.5 text-left text-[12.5px] font-semibold text-foreground',
              selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
            )}
          >
            {opt}
          </Button>
        )
      })}
    </>
  )
}

function MultiSelectChips({
  options,
  labels,
  selected,
  onToggle,
}: {
  options: string[]
  labels?: Record<string, string>
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const isSelected = selected.includes(opt)
        return (
          <Button
            key={opt}
            type="button"
            variant="ghost"
            onClick={() => onToggle(opt)}
            aria-pressed={isSelected}
            className={cn(
              'h-9 rounded-full border px-3 text-[11.5px] font-semibold',
              isSelected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-foreground'
            )}
          >
            {labels?.[opt] ?? opt}
          </Button>
        )
      })}
    </div>
  )
}

function UnknownToggle({
  checked,
  onChange,
  label = "I'm not sure — help me choose",
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={cn(
        'mt-1 h-9 justify-start rounded-lg border px-3 text-[11.5px] font-semibold',
        checked
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-card text-foreground'
      )}
    >
      {label}
    </Button>
  )
}
