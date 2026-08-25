// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, ChevronDown, HelpCircle } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import {
  STEP_META,
  TRACK_INFO,
  type AssessStepKey,
  type AssessTrack,
} from '@/components/Assess/redesign/assessFlowModel'
import { useAssessFlow } from '@/components/Assess/redesign/useAssessFlow'
import { summarizeAnswer } from '@/components/Assess/redesign/reviewModel'
import {
  AVAILABLE_INDUSTRIES,
  DATA_SENSITIVITY_SCORES,
  AVAILABLE_USE_CASES,
  COUNTRY_PLANNING_MANDATE,
} from '@/hooks/assessmentData'
import { ALL_JURISDICTIONS } from '@/data/jurisdictionsData'
import { complianceFrameworks, type ComplianceFramework } from '@/data/complianceData'
import {
  applicableFrameworks,
  isProfileEmpty,
  TIER_META,
  type ApplicabilityTier,
  type ApplicabilityResult,
} from '@/utils/applicabilityEngine'
import { LAYERS } from '@/data/infrastructureLayers'
import { timelineData, transformToGanttData } from '@/data/timelineData'
import {
  industryUseCaseConfigs,
  industryRetentionConfigs,
  universalRetentionConfigs,
  getIndustryConfigs,
} from '@/data/industryAssessConfig'

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

// Same 6 real options + descriptions StepCredentialLifetime.tsx's own
// `options` array carries — a step-scoped literal, not worth an ESLint
// exception (same precedent as MIGRATION_STATUSES above).
const CREDENTIAL_LIFETIME_OPTIONS: { id: string; label: string; description: string }[] = [
  {
    id: 'under-1y',
    label: 'Under 1 year',
    description: 'Short-lived tokens, ACME auto-renewed certificates',
  },
  { id: '1-3y', label: '1–3 years', description: 'Standard TLS / end-entity certificates' },
  {
    id: '3-10y',
    label: '3–10 years',
    description: 'Code signing certificates, intermediate CA certificates',
  },
  {
    id: '10-25y',
    label: '10–25 years',
    description: 'Root CA certificates, long-lived PKI infrastructure',
  },
  {
    id: '25-plus',
    label: '25+ years',
    description: 'Government, aerospace, or critical infrastructure credentials',
  },
  {
    id: 'indefinite',
    label: 'Indefinite / permanent',
    description: 'Blockchain transactions, immutable audit logs, legal records',
  },
]

// Same 4+4 real options Step9OrgScale.tsx's own systemOptions/teamOptions
// arrays carry.
type ScaleBucket = '1-10' | '11-50' | '51-200' | '200-plus'
const SYSTEM_COUNT_OPTIONS: { value: ScaleBucket; label: string }[] = [
  { value: '1-10', label: '1-10 systems' },
  { value: '11-50', label: '11-50 systems' },
  { value: '51-200', label: '51-200 systems' },
  { value: '200-plus', label: '200+ systems' },
]
const TEAM_SIZE_OPTIONS: { value: ScaleBucket; label: string }[] = [
  { value: '1-10', label: '1-10 engineers' },
  { value: '11-50', label: '11-50 engineers' },
  { value: '51-200', label: '51-200 engineers' },
  { value: '200-plus', label: '200+ engineers' },
]

// Same 3 real options + default descriptions Step10CryptoAgility.tsx's own
// `options` array carries (persona-varying descriptions are a desktop-only
// refinement, same as MIGRATION_STATUSES's docstring already explains).
type AgilityValue = 'fully-abstracted' | 'partially-abstracted' | 'hardcoded'
const AGILITY_OPTIONS: { value: AgilityValue; label: string; description: string }[] = [
  {
    value: 'fully-abstracted',
    label: 'Fully Abstracted',
    description: 'Crypto library wrappers or config-driven — easy to swap algorithms.',
  },
  {
    value: 'partially-abstracted',
    label: 'Partially Abstracted',
    description: 'Some systems use wrappers, others have algorithms hardcoded.',
  },
  {
    value: 'hardcoded',
    label: 'Hardcoded Throughout',
    description: 'Algorithms are embedded directly in application code.',
  },
]

// Same 4 real fallback options Step13TimelinePressure.tsx's own
// `staticOptions` array carries.
type TimelineValue = 'within-1y' | 'within-2-3y' | 'internal-deadline' | 'no-deadline'
const TIMELINE_STATIC_OPTIONS: { value: TimelineValue; label: string; description: string }[] = [
  {
    value: 'within-1y',
    label: 'Regulatory Deadline Within 1 Year',
    description: 'We have a compliance mandate requiring PQC adoption within 12 months.',
  },
  {
    value: 'within-2-3y',
    label: 'Regulatory Deadline Within 2-3 Years',
    description: 'Our compliance framework requires PQC adoption by 2028-2029.',
  },
  {
    value: 'internal-deadline',
    label: 'Internal Deadline Set',
    description: 'Our organization has set its own PQC migration target date.',
  },
  {
    value: 'no-deadline',
    label: 'No Specific Deadline',
    description: 'We have no regulatory or internal deadline for PQC migration.',
  },
]
const TIMELINE_CURRENT_YEAR = new Date().getFullYear()
// Same derivation Step13TimelinePressure.tsx's own (unexported) helper uses
// to map a country's real deadline year onto the same 3-value pressure scale
// the fallback options use.
function deriveTimelinePressure(
  endYear?: number
): 'within-1y' | 'within-2-3y' | 'internal-deadline' {
  if (!endYear) return 'internal-deadline'
  if (endYear <= TIMELINE_CURRENT_YEAR + 1) return 'within-1y'
  if (endYear <= TIMELINE_CURRENT_YEAR + 3) return 'within-2-3y'
  return 'internal-deadline'
}

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
 * Offers both tracks now (2026-08-24 Assess-step audit, part 2): the first
 * cut of this screen locked to the 6-step quick track because the other 7
 * steps (use-cases, retention, credential-lifetime, scale, agility, infra,
 * timeline) had no mobile UI at all yet — not a deliberate desktop-only
 * design choice, confirmed by reading every real Step*.tsx component before
 * cutting anything, per explicit instruction. All 13 now render here, each
 * reduced to its real FIRST-level choice only — the one genuine gated
 * second-level tier found in the audit (Step11Infrastructure.tsx's per-layer
 * sub-category chips, plus its three sibling flat pickers: a 12-item
 * crypto-library multi-select, a 10-item automation-tool multi-select, and a
 * vendor-dependency radiogroup) is the one real cut, stated in the footer
 * below. Every other step's desktop "second list" turned out on inspection
 * to be a second REPRESENTATION of one flat first-level choice (sensitivity,
 * use-cases, retention all show an industry-specific label set alongside a
 * universal one, both toggling the same field) or a fully independent
 * sibling field (scale's system-count + team-size), not a gated drill-down —
 * so those are kept in full, not trimmed.
 *
 * A track-choice screen (mirrors desktop's quick-vs-comprehensive choice,
 * TRACK_INFO) shows once for a fresh assessment (store.industry === ''); an
 * in-progress run resumes straight into whichever track store.assessmentMode
 * already holds, matching desktop's own resume behavior — no more forced
 * redirect back to quick and no more comprehensive-in-progress interstitial,
 * since comprehensive is now a first-class supported mobile track, not a
 * partially-built one the user had to be steered away from.
 *
 * Reuses real desktop logic verbatim for the 7 new steps too: LAYERS
 * (infra's real 9-layer taxonomy, `@/data/infrastructureLayers` — the same
 * source Step11Infrastructure.tsx, the CBOM scanner and the vendor-risk
 * matrix all read), timelineData/transformToGanttData + the same
 * deriveTimelinePressure mapping Step13TimelinePressure.tsx uses (real
 * per-country deadline phases when the selected country has them, the same
 * 4-option fallback otherwise), and industryUseCaseConfigs/
 * industryRetentionConfigs/universalRetentionConfigs/getIndustryConfigs
 * (`@/data/industryAssessConfig` — the same industry-plus-universal option
 * sets Step7UseCases.tsx/Step8DataRetention.tsx compute from). Credential-
 * lifetime, scale and agility's option literals are small, non-computed
 * arrays replicated from their step components (same non-worth-an-exception
 * precedent as MIGRATION_STATUSES above).
 */
export function MobileAssessView() {
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
  const industryUseCases = useMemo(
    () => getIndustryConfigs(industryUseCaseConfigs, store.industry),
    [store.industry]
  )
  const industryUseCaseLabelSet = useMemo(
    () => new Set(industryUseCases.map((uc) => uc.label)),
    [industryUseCases]
  )
  const industrySpecificUseCaseLabels = useMemo(() => {
    const set = new Set<string>()
    for (const cfg of industryUseCaseConfigs) {
      if (cfg.industries.length > 0 && cfg.industries.length <= 2) set.add(cfg.label)
    }
    return set
  }, [])
  const universalUseCases = useMemo(
    () =>
      AVAILABLE_USE_CASES.filter(
        (uc) =>
          !industryUseCaseLabelSet.has(uc) &&
          (store.industry === 'Other' || !store.industry || !industrySpecificUseCaseLabels.has(uc))
      ),
    [industryUseCaseLabelSet, store.industry, industrySpecificUseCaseLabels]
  )

  const industryRetentionOptions = useMemo(
    () => getIndustryConfigs(industryRetentionConfigs, store.industry),
    [store.industry]
  )
  const filteredUniversalRetentionOptions = useMemo(() => {
    const industryIds = new Set(industryRetentionOptions.map((r) => r.id))
    return universalRetentionConfigs.filter((opt) => !industryIds.has(opt.id))
  }, [industryRetentionOptions])

  const countryDeadlines = useMemo(() => {
    if (!store.country) return []
    const entry = transformToGanttData(timelineData).find(
      (g) => g.country.countryName === store.country
    )
    return entry ? entry.phases.filter((p) => p.phase === 'Deadline') : []
  }, [store.country])
  const timelineMandate = store.country ? COUNTRY_PLANNING_MANDATE[store.country] : undefined

  const [showWhy, setShowWhy] = useState(false)
  const [done, setDone] = useState(store.assessmentStatus === 'complete')
  // Restores the "no silent jump to the report" review moment desktop's own
  // last wizard step goes through (AssessReview.tsx) — this screen used to
  // call markComplete() directly from the last Next tap (an unlogged cut).
  const [showReview, setShowReview] = useState(false)

  // Track choice, mirroring desktop's quick-vs-comprehensive choice
  // (TRACK_INFO). A fresh assessment (no industry answered yet) sees the
  // chooser once; an in-progress run resumes straight into whichever track
  // store.assessmentMode already holds — same resume behavior as desktop.
  const [track, setTrack] = useState<AssessTrack | null>(() =>
    store.industry !== '' ? (store.assessmentMode ?? 'quick') : null
  )
  const chooseTrack = (mode: AssessTrack) => {
    store.setAssessmentMode(mode)
    setTrack(mode)
  }

  const flow = useAssessFlow({
    mode: track ?? 'quick',
    onLastStep: () => setShowReview(true),
  })

  if (!track) {
    return (
      <div className="px-4 pb-4 pt-4">
        <h1 className="text-[17px] font-extrabold leading-tight text-foreground">Assess</h1>
        <p className="mb-5 mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
          Choose how much detail you want in your report.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => chooseTrack('quick')}
            className="h-auto flex-col items-start gap-1 rounded-xl border border-border bg-card p-4 text-left"
          >
            <span className="text-[13.5px] font-extrabold text-foreground">
              {TRACK_INFO.quick.label}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {TRACK_INFO.quick.count} questions · ~{TRACK_INFO.quick.minutes} min
            </span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => chooseTrack('comprehensive')}
            className="h-auto flex-col items-start gap-1 rounded-xl border border-border bg-card p-4 text-left"
          >
            <span className="text-[13.5px] font-extrabold text-foreground">
              {TRACK_INFO.comprehensive.label}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {TRACK_INFO.comprehensive.count} questions · ~{TRACK_INFO.comprehensive.minutes} min
            </span>
          </Button>
        </div>
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
            setTrack(null)
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
        {TRACK_INFO[track].label} · Step {flow.stepIdx + 1} of {flow.total}
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

        {key === 'use-cases' && (
          <>
            {industryUseCases.length > 0 && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Common in {store.industry}
                </p>
                <MultiSelectChips
                  options={industryUseCases.map((uc) => uc.label)}
                  selected={store.cryptoUseCases}
                  onToggle={store.toggleCryptoUseCase}
                />
              </>
            )}
            {universalUseCases.length > 0 && (
              <>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  General use cases
                </p>
                <MultiSelectChips
                  options={universalUseCases}
                  selected={store.cryptoUseCases}
                  onToggle={store.toggleCryptoUseCase}
                />
              </>
            )}
            <UnknownToggle checked={store.useCasesUnknown} onChange={store.setUseCasesUnknown} />
          </>
        )}

        {key === 'retention' && (
          <>
            <div className="flex flex-col gap-1.5">
              {[...industryRetentionOptions, ...filteredUniversalRetentionOptions].map((opt) => {
                const selected = store.dataRetention.includes(opt.id)
                return (
                  <Button
                    key={opt.id}
                    type="button"
                    variant="ghost"
                    onClick={() => store.toggleDataRetention(opt.id)}
                    aria-pressed={selected}
                    className={cn(
                      'h-auto flex-col items-start gap-0.5 whitespace-normal rounded-lg border p-2.5 text-left',
                      selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                    )}
                  >
                    <span className="text-[12px] font-semibold text-foreground">{opt.label}</span>
                    <span className="text-[10.5px] text-muted-foreground">{opt.description}</span>
                  </Button>
                )
              })}
            </div>
            <UnknownToggle checked={store.retentionUnknown} onChange={store.setRetentionUnknown} />
          </>
        )}

        {key === 'credential-lifetime' && (
          <>
            <div className="flex flex-col gap-1.5">
              {CREDENTIAL_LIFETIME_OPTIONS.map((opt) => {
                const selected = store.credentialLifetime.includes(opt.id)
                return (
                  <Button
                    key={opt.id}
                    type="button"
                    variant="ghost"
                    onClick={() => store.toggleCredentialLifetime(opt.id)}
                    aria-pressed={selected}
                    className={cn(
                      'h-auto flex-col items-start gap-0.5 whitespace-normal rounded-lg border p-2.5 text-left',
                      selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                    )}
                  >
                    <span className="text-[12px] font-semibold text-foreground">{opt.label}</span>
                    <span className="text-[10.5px] text-muted-foreground">{opt.description}</span>
                  </Button>
                )
              })}
            </div>
            <UnknownToggle
              checked={store.credentialLifetimeUnknown}
              onChange={store.setCredentialLifetimeUnknown}
            />
          </>
        )}

        {key === 'scale' && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Systems using cryptography
            </p>
            <SingleSelectList
              options={SYSTEM_COUNT_OPTIONS.map((o) => o.value)}
              labels={Object.fromEntries(SYSTEM_COUNT_OPTIONS.map((o) => [o.value, o.label]))}
              value={store.systemCount}
              onChange={(v) => store.setSystemCount(v as ScaleBucket)}
            />
            <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Engineering team size
            </p>
            <SingleSelectList
              options={TEAM_SIZE_OPTIONS.map((o) => o.value)}
              labels={Object.fromEntries(TEAM_SIZE_OPTIONS.map((o) => [o.value, o.label]))}
              value={store.teamSize}
              onChange={(v) => store.setTeamSize(v as ScaleBucket)}
            />
            <UnknownToggle checked={store.scaleUnknown} onChange={store.setScaleUnknown} />
          </>
        )}

        {key === 'agility' && (
          <>
            <div className="flex flex-col gap-1.5">
              {AGILITY_OPTIONS.map((opt) => {
                const selected = store.cryptoAgility === opt.value
                return (
                  <Button
                    key={opt.value}
                    type="button"
                    variant="ghost"
                    onClick={() => store.setCryptoAgility(opt.value)}
                    aria-pressed={selected}
                    className={cn(
                      'h-auto flex-col items-start gap-0.5 whitespace-normal rounded-lg border p-2.5 text-left',
                      selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                    )}
                  >
                    <span className="text-[12px] font-semibold text-foreground">{opt.label}</span>
                    <span className="text-[10.5px] text-muted-foreground">{opt.description}</span>
                  </Button>
                )
              })}
            </div>
            <UnknownToggle checked={store.agilityUnknown} onChange={store.setAgilityUnknown} />
          </>
        )}

        {key === 'infra' && (
          <>
            <MultiSelectChips
              options={LAYERS.map((l) => l.id)}
              labels={Object.fromEntries(LAYERS.map((l) => [l.id, l.label]))}
              selected={store.infrastructure}
              onToggle={store.toggleInfrastructure}
            />
            <UnknownToggle
              checked={store.infrastructureUnknown}
              onChange={store.setInfrastructureUnknown}
            />
          </>
        )}

        {key === 'timeline' && (
          <>
            {countryDeadlines.length > 0 ? (
              <>
                <p className="text-[10.5px] leading-relaxed text-muted-foreground">
                  {timelineMandate === 'SOFT'
                    ? `Deadlines below come from ${store.country}'s official PQC guidance — published targets, not a binding legal mandate.`
                    : timelineMandate === 'HARD'
                      ? `Deadlines below are a binding regulatory mandate from ${store.country}'s official PQC timeline.`
                      : `Deadlines below are sourced from ${store.country}'s official PQC timeline.`}
                </p>
                <div className="flex flex-col gap-1.5">
                  {countryDeadlines.map((phase) => {
                    const derived = deriveTimelinePressure(phase.endYear)
                    const selected = store.timelinePressure === derived
                    return (
                      <Button
                        key={phase.title}
                        type="button"
                        variant="ghost"
                        onClick={() => store.setTimelinePressure(derived)}
                        aria-pressed={selected}
                        className={cn(
                          'h-auto flex-col items-start gap-0.5 whitespace-normal rounded-lg border p-2.5 text-left',
                          selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                        )}
                      >
                        <span className="flex w-full items-center justify-between gap-2">
                          <span className="text-[12px] font-semibold text-foreground">
                            {phase.title}
                          </span>
                          <span className="shrink-0 rounded bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {phase.startYear === phase.endYear
                              ? phase.endYear
                              : `${phase.startYear}–${phase.endYear}`}
                          </span>
                        </span>
                        {phase.description && (
                          <span className="text-[10.5px] text-muted-foreground">
                            {phase.description}
                          </span>
                        )}
                      </Button>
                    )
                  })}
                  {TIMELINE_STATIC_OPTIONS.filter((o) => o.value === 'no-deadline').map((opt) => {
                    const selected = store.timelinePressure === opt.value
                    return (
                      <Button
                        key={opt.value}
                        type="button"
                        variant="ghost"
                        onClick={() => store.setTimelinePressure(opt.value)}
                        aria-pressed={selected}
                        className={cn(
                          'h-auto flex-col items-start gap-0.5 whitespace-normal rounded-lg border p-2.5 text-left',
                          selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                        )}
                      >
                        <span className="text-[12px] font-semibold text-foreground">
                          {opt.label}
                        </span>
                        <span className="text-[10.5px] text-muted-foreground">
                          {opt.description}
                        </span>
                      </Button>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1.5">
                {TIMELINE_STATIC_OPTIONS.map((opt) => {
                  const selected = store.timelinePressure === opt.value
                  return (
                    <Button
                      key={opt.value}
                      type="button"
                      variant="ghost"
                      onClick={() => store.setTimelinePressure(opt.value)}
                      aria-pressed={selected}
                      className={cn(
                        'h-auto flex-col items-start gap-0.5 whitespace-normal rounded-lg border p-2.5 text-left',
                        selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                      )}
                    >
                      <span className="text-[12px] font-semibold text-foreground">{opt.label}</span>
                      <span className="text-[10.5px] text-muted-foreground">{opt.description}</span>
                    </Button>
                  )
                })}
              </div>
            )}
            <UnknownToggle checked={store.timelineUnknown} onChange={store.setTimelineUnknown} />
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

      {key === 'infra' && (
        <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
          Per-layer sub-categories, the crypto-library picker, the automation-tool picker and
          vendor-dependency detail — Step 11&apos;s finer-grained matrices — stay on a laptop.
        </p>
      )}
    </div>
  )
}

function SingleSelectList({
  options,
  labels,
  value,
  onChange,
}: {
  options: string[]
  labels?: Record<string, string>
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
            {labels?.[opt] ?? opt}
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
