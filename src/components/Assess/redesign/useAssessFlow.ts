// SPDX-License-Identifier: AGPL-3.0-only
//
// Wizard navigation for the Assess redesign. Renders RENDER_ORDER_* but reads /
// writes store.currentStep through the track-relative mapping so the legacy
// wizard and the redesign agree on what "step N" means (resume, ?step, analytics).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, type SetURLSearchParams } from 'react-router'
import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { usePersonaStore } from '../../../store/usePersonaStore'
import { logAssessStart, logAssessStep } from '../../../utils/analytics'
import {
  renderOrderFor,
  storeIndexOf,
  keyAtStoreIndex,
  STEP_VALIDATORS,
  STEP_META,
  hasAnswer,
  isStepAnswered,
  PROFICIENCY_SUGGEST_MAP,
  type AssessStepKey,
  type AssessTrack,
} from './assessFlowModel'

interface UseAssessFlowArgs {
  mode: AssessTrack
  /** Called when Continue is pressed (and valid) on the LAST render step. */
  onLastStep: () => void
  /** Embed-isolated URL param pair. When the wizard runs inside the sim embed the
   *  parent backs these with local state so the hook's ?step read/write never
   *  touches the real /simulation route. Omitted standalone → uses the page URL. */
  searchParams?: URLSearchParams
  setSearchParams?: SetURLSearchParams
}

export interface AssessFlow {
  renderOrder: readonly AssessStepKey[]
  total: number
  stepIdx: number
  activeKey: AssessStepKey
  /** Furthest render step the rail may jump to: the furthest step the reader has
   *  walked to OR holds an answer for (so Edit Answers / a loaded estate is not
   *  locked behind Continue). */
  maxIdx: number
  /** Furthest render step the reader has actually walked to (or, for an already
   *  fully answered set, the last). Freely-optional steps before it count as
   *  passed even when left blank. */
  visitedIdx: number
  /** Steps answered, optional ones included — the count the step rail shows. */
  answeredCount: number
  /** Steps answered, required ones only. */
  requiredAnsweredCount: number
  attempted: boolean
  isValid: (key: AssessStepKey) => boolean
  canProceed: boolean
  next: () => void
  back: () => void
  jumpTo: (renderIdx: number) => void
  /** Render index a step occupies, or -1. */
  renderIndexOf: (key: AssessStepKey) => number
}

export function useAssessFlow({
  mode,
  onLastStep,
  searchParams: argSearchParams,
  setSearchParams: argSetSearchParams,
}: UseAssessFlowArgs): AssessFlow {
  const store = useAssessmentStore()
  const { currentStep, setStep } = store
  // Prefer the embed-isolated pair when provided; fall back to the page URL
  // (standalone /assess and tests). The internal hook is always called to keep
  // hook order stable, but its writes are unused when the embed pair is passed.
  const [internalSearchParams, internalSetSearchParams] = useSearchParams()
  const searchParams = argSearchParams ?? internalSearchParams
  const setSearchParams = argSetSearchParams ?? internalSetSearchParams
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const experienceLevel = usePersonaStore((s) => s.experienceLevel)
  const [attemptedMap, setAttemptedMap] = useState<Record<string, boolean>>({})
  const renderOrder = useMemo(() => renderOrderFor(mode), [mode])
  const total = renderOrder.length
  // Furthest step walked to, remembered per track. A track that has not been
  // walked yet starts at the last step when every required answer already
  // exists (Edit Answers from the report, a loaded estate), else at the start.
  const startingVisited = useCallback(() => {
    const s = useAssessmentStore.getState()
    const complete = renderOrder.every((k) => STEP_META[k].freelyOptional || STEP_VALIDATORS[k](s))
    return complete ? renderOrder.length - 1 : 0
  }, [renderOrder])
  const [visited, setVisited] = useState<{ mode: AssessTrack; idx: number }>(() => ({
    mode,
    idx: startingVisited(),
  }))
  const visitedIdx = visited.mode === mode ? visited.idx : startingVisited()
  const bumpVisited = useCallback(
    (idx: number) =>
      setVisited((v) => ({
        mode,
        idx: Math.max(v.mode === mode ? v.idx : startingVisited(), idx),
      })),
    [mode, startingVisited]
  )
  // The ?step value this hook itself last wrote. The read effect ignores that
  // value, so a link whose step differs from the stored step cannot make the
  // read and write effects overwrite each other.
  const lastWrittenStep = useRef<string | null>(null)

  const currentKey = keyAtStoreIndex(mode, currentStep)
  const rawStepIdx = currentKey ? renderOrder.indexOf(currentKey) : -1
  const stepIdx = rawStepIdx >= 0 ? rawStepIdx : 0
  // eslint-disable-next-line security/detect-object-injection
  const activeKey = renderOrder[stepIdx]

  const isValid = useCallback((key: AssessStepKey) => STEP_VALIDATORS[key](store), [store])

  const renderIndexOf = useCallback((key: AssessStepKey) => renderOrder.indexOf(key), [renderOrder])

  const goToRenderIdx = useCallback(
    (renderIdx: number) => {
      // eslint-disable-next-line security/detect-object-injection
      const key = renderOrder[renderIdx]
      if (!key) return
      setStep(storeIndexOf(mode, key))
    },
    [renderOrder, mode, setStep]
  )

  // If store.currentStep doesn't resolve into this track (e.g. just after a
  // track switch left it out of range), snap to the first step.
  useEffect(() => {
    if (rawStepIdx < 0) {
      const target = storeIndexOf(mode, renderOrder[0])
      if (currentStep !== target) setStep(target)
    }
  }, [rawStepIdx, mode, renderOrder, currentStep, setStep])

  // Track the furthest render step reached, for jump-to-edit gating.
  useEffect(() => {
    bumpVisited(stepIdx)
  }, [stepIdx, bumpVisited])

  // Every step that already holds an answer is reachable, so a reader who comes
  // back to edit (from the report, or after loading a reference estate) can jump
  // straight to the question instead of pressing Continue through the rest.
  const answeredMaxIdx = renderOrder.reduce(
    (max, k, i) => (hasAnswer(k, store) ? Math.max(max, i) : max),
    0
  )
  const maxIdx = Math.max(visitedIdx, answeredMaxIdx)

  // ?step deep link (read) — same semantics as the legacy wizard.
  useEffect(() => {
    const sp = searchParams.get('step')
    if (sp === null) return
    if (sp === lastWrittenStep.current) return
    const parsed = parseInt(sp, 10)
    if (isNaN(parsed) || parsed < 0) return
    const key = keyAtStoreIndex(mode, parsed)
    if (key && renderOrder.includes(key) && parsed !== currentStep) setStep(parsed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, mode])

  // ?step deep link (write) — mirror currentStep into the URL.
  useEffect(() => {
    const cur = searchParams.get('step')
    if (cur === String(currentStep)) return
    const next = new URLSearchParams(searchParams)
    next.set('step', String(currentStep))
    lastWrittenStep.current = String(currentStep)
    setSearchParams(next, { replace: true })
  }, [currentStep, searchParams, setSearchParams])

  // Persona / proficiency auto-suggest of "I'm not sure" — mirror of the legacy
  // AssessWizard effect, rebound to the redesign's active step key. Only fills a
  // step the user hasn't answered, preserving the auto-prefill for new/curious
  // and executive personas. Deliberately NOT extended to GRC (2026-09-07 split,
  // plan §D) — GRC's comprehensive assessment mode should never auto-fill
  // "I don't know" on the user's behalf.
  useEffect(() => {
    const s = useAssessmentStore.getState()
    const stepKey = activeKey
    if (!stepKey) return

    const isExecutiveSuggest =
      selectedPersona === 'executive' &&
      (stepKey === 'crypto' || stepKey === 'scale' || stepKey === 'agility' || stepKey === 'infra')
    // eslint-disable-next-line security/detect-object-injection
    const stepCategory = PROFICIENCY_SUGGEST_MAP[stepKey]
    const isProficiencySuggest =
      stepCategory !== undefined &&
      (experienceLevel === 'curious' ||
        (experienceLevel === 'basics' && stepCategory === 'technical'))
    if (!isExecutiveSuggest && !isProficiencySuggest) return

    switch (stepKey) {
      case 'crypto':
        if (
          s.currentCryptoCategories.length === 0 &&
          s.currentCrypto.length === 0 &&
          !s.cryptoUnknown
        )
          s.setCryptoUnknown(true)
        break
      case 'sensitivity':
        if (s.dataSensitivity.length === 0 && !s.sensitivityUnknown) s.setSensitivityUnknown(true)
        break
      case 'compliance':
        if (s.complianceRequirements.length === 0 && !s.complianceUnknown)
          s.setComplianceUnknown(true)
        break
      case 'migration':
        if (!s.migrationStatus && !s.migrationUnknown) s.setMigrationUnknown(true)
        break
      case 'use-cases':
        if (s.cryptoUseCases.length === 0 && !s.useCasesUnknown) s.setUseCasesUnknown(true)
        break
      case 'retention':
        if (s.dataRetention.length === 0 && !s.retentionUnknown) s.setRetentionUnknown(true)
        break
      case 'credential-lifetime':
        if (s.credentialLifetime.length === 0 && !s.credentialLifetimeUnknown)
          s.setCredentialLifetimeUnknown(true)
        break
      case 'scale':
        if (!s.systemCount && !s.teamSize && !s.scaleUnknown) s.setScaleUnknown(true)
        break
      case 'agility':
        if (!s.cryptoAgility && !s.agilityUnknown) s.setAgilityUnknown(true)
        break
      case 'infra':
        if (s.infrastructure.length === 0 && !s.infrastructureUnknown)
          s.setInfrastructureUnknown(true)
        break
      case 'timeline':
        if (!s.timelinePressure && !s.timelineUnknown) s.setTimelineUnknown(true)
        break
    }
  }, [activeKey, selectedPersona, experienceLevel])

  // Same definition as the step rail: an optional step counts once it holds an
  // answer or the reader has moved past it.
  const answeredCount = renderOrder.filter((k, i) =>
    isStepAnswered(k, store, i < Math.max(visitedIdx, stepIdx))
  ).length
  const requiredAnsweredCount = renderOrder.filter(
    (k) => !STEP_META[k].freelyOptional && isValid(k)
  ).length

  const next = useCallback(() => {
    const key = activeKey
    if (!isValid(key)) {
      setAttemptedMap((m) => ({ ...m, [key]: true }))
      return
    }
    if (stepIdx === 0) logAssessStart()
    logAssessStep(stepIdx + 1, STEP_META[key].label)
    if (stepIdx >= total - 1) {
      onLastStep()
      return
    }
    bumpVisited(stepIdx + 1)
    goToRenderIdx(stepIdx + 1)
  }, [activeKey, isValid, stepIdx, total, onLastStep, goToRenderIdx, bumpVisited])

  const back = useCallback(() => {
    if (stepIdx > 0) goToRenderIdx(stepIdx - 1)
  }, [stepIdx, goToRenderIdx])

  const jumpTo = useCallback(
    (renderIdx: number) => {
      if (renderIdx <= Math.max(maxIdx, stepIdx)) goToRenderIdx(renderIdx)
    },
    [maxIdx, stepIdx, goToRenderIdx]
  )

  return {
    renderOrder,
    total,
    stepIdx,
    activeKey,
    maxIdx,
    visitedIdx,
    answeredCount,
    requiredAnsweredCount,
    // eslint-disable-next-line security/detect-object-injection
    attempted: !!attemptedMap[activeKey],
    isValid,
    canProceed: isValid(activeKey),
    next,
    back,
    jumpTo,
    renderIndexOf,
  }
}
