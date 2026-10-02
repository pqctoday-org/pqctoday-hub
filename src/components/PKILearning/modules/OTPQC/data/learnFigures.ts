// SPDX-License-Identifier: GPL-3.0-only
/**
 * Every number the Learn tab, the exercises and rag-summary.md quote about a
 * workshop result is computed HERE from the same functions the workshop runs
 * (plan rule: "every number in Learn text must equal what the workshop
 * computes"). learnFigures.test.ts pins these values and checks that the
 * literal strings in rag-summary.md / the exercises match them, so a formula
 * change cannot silently leave stale prose behind.
 */
import { SV_SAMPLE_RATES, svSampleIntervalMicros } from './otProtocolData'
import { defaultAssessments, rankZones } from './zoneConduitData'
import { DEFAULT_SUBSTATION, planSubstation, type SubstationProfile } from './substationData'
import { CONSEQUENCE_SCENARIOS, scoreScenario, defaultInputs } from './consequenceData'
import { DEFAULT_ROADMAP, roadmapSummary, type RoadmapInputs } from './roadmapData'
import { getScheme, planSigning, DEFAULT_SIGNING_PLAN } from './signingLabData'

/** SV sample spacing at each IEC 61869-9 rate (µs). */
export const svIntervals = SV_SAMPLE_RATES.map((rate) => ({
  rate,
  micros: svSampleIntervalMicros(rate),
}))

/** Step 2 defaults, ranked. */
export const zoneRanking = rankZones(defaultAssessments()).map((a) => ({
  id: a.zone.id,
  name: a.zone.name,
  priority: a.priority,
  forgery: a.forgery,
  hndl: a.hndl,
  driver: a.driver,
}))

/** Step 3 exercise profile: high-impact transmission substation on fibre with full IEC 62351. */
export const EXERCISE_SUBSTATION: SubstationProfile = {
  ...DEFAULT_SUBSTATION,
  type: 'transmission',
  iedCount: 80,
  connectivity: 'fiber',
  iec62351Level: 'full',
  nercCipImpact: 'high',
}

export const substationDefault = planSubstation(DEFAULT_SUBSTATION).map((r) => ({
  id: r.zone.id,
  priority: r.priority,
}))
export const substationExercise = planSubstation(EXERCISE_SUBSTATION).map((r) => ({
  id: r.zone.id,
  priority: r.priority,
  effort: r.effort,
}))

/** Step 4 default scores per scenario. */
export const consequenceDefaults = Object.fromEntries(
  CONSEQUENCE_SCENARIOS.map((s) => [s.id, scoreScenario(s)])
)

/** Step 4 exercise: the gas pipeline with PQC firmware signing. */
export const gasWithPqcFirmware = (() => {
  const s = CONSEQUENCE_SCENARIOS.find((x) => x.id === 'gas-pipeline')!
  return scoreScenario(s, { ...defaultInputs(s), firmwareSigning: 'pqc' })
})()

/** Step 5 defaults and the large-fleet exercise. */
export const roadmapDefault = roadmapSummary(DEFAULT_ROADMAP)
export const EXERCISE_ROADMAP: RoadmapInputs = { ...DEFAULT_ROADMAP, siteCount: 400 }
export const roadmapLargeFleet = roadmapSummary(EXERCISE_ROADMAP)

/** Step 6: default firmware plan and the project-signing exercise. */
export const signingDefault = planSigning(DEFAULT_SIGNING_PLAN)
export const signingProjectLms = planSigning({
  scheme: 'lms-h10-w8',
  use: 'project',
  signaturesPerYear: 5000,
  statePartitions: 1,
  serviceYears: 15,
})
export const lmsH20Bytes = getScheme('lms-h20-w8').signatureBytes
export const mldsa87Bytes = getScheme('ml-dsa-87').signatureBytes
