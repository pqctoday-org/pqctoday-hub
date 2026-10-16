// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { computeAssessment } from './assessmentUtils'
import type { AssessmentInput, AssessmentResult } from './assessmentTypes'
import type { PersonaId } from '../data/learningPersonas'
import { isPersonaId } from '../data/personaIds'
import {
  AVAILABLE_INDUSTRIES,
  AVAILABLE_ALGORITHMS,
  AVAILABLE_COMPLIANCE,
  AVAILABLE_USE_CASES,
  AVAILABLE_INFRASTRUCTURE,
} from './assessmentData'
import { REGION_COUNTRIES_MAP } from '../data/personaConfig'
import { EXAMPLE_REPORT_PERSONA, exampleReportResultFor } from '../data/exampleReport'
import { logReportShareLinkOpened } from '../utils/analytics'
import { decodeShareToken, type ReportShareSchemaV1 } from '../utils/reportShareToken'

const VALID_SENSITIVITIES = new Set(['low', 'medium', 'high', 'critical'])
const VALID_MIGRATIONS = new Set(['started', 'planning', 'not-started', 'unknown'])
const VALID_RETENTION = new Set(['under-1y', '1-5y', '5-10y', '10-25y', '25-plus', 'indefinite'])
const VALID_SYSTEM_COUNT = new Set(['1-10', '11-50', '51-200', '200-plus'])
const VALID_TEAM_SIZE = new Set(['1-10', '11-50', '51-200', '200-plus'])
const VALID_AGILITY = new Set(['fully-abstracted', 'partially-abstracted', 'hardcoded', 'unknown'])
const VALID_VENDOR = new Set(['heavy-vendor', 'open-source', 'mixed', 'in-house'])
const VALID_PRESSURE = new Set([
  'within-1y',
  'within-2-3y',
  'internal-deadline',
  'no-deadline',
  'unknown',
])
const VALID_INDUSTRIES = new Set(AVAILABLE_INDUSTRIES)
const VALID_ALGORITHMS = new Set(AVAILABLE_ALGORITHMS)
const VALID_COMPLIANCE = new Set(AVAILABLE_COMPLIANCE)
const VALID_USE_CASES = new Set(AVAILABLE_USE_CASES)
const VALID_INFRA = new Set(AVAILABLE_INFRASTRUCTURE)
const VALID_COUNTRIES = new Set(Object.values(REGION_COUNTRIES_MAP).flat())

function toValidPersona(persona: string | undefined): PersonaId | null {
  return persona && isPersonaId(persona) ? persona : null
}

/**
 * Builds an `AssessmentInput` from a legacy pre-token share schema (v1
 * `reportShareToken`, or the even older `?i=&cy=&c=&…` per-param links — see
 * the two decode branches below). Both formats predate score snapshotting,
 * so there is no sender result to honor; the best we can do is recompute
 * from whatever fields survive validation, the same way
 * `useAssessmentFormStore.getInput()` requires (non-empty industry +
 * migration status, sensitivity present or explicitly unknown). Returns null
 * when the link doesn't carry enough to produce a meaningful report.
 */
function buildLegacyInput(fields: {
  industry?: string
  country?: string
  currentCrypto?: string[]
  dataSensitivity?: string[]
  complianceRequirements?: string[]
  migrationStatus?: string
  cryptoUseCases?: string[]
  dataRetention?: string[]
  systemCount?: string
  teamSize?: string
  cryptoAgility?: string
  infrastructure?: string[]
  vendorDependency?: string
  timelinePressure?: string
}): AssessmentInput | null {
  if (!fields.industry || !VALID_INDUSTRIES.has(fields.industry)) return null
  const dataSensitivity = (fields.dataSensitivity ?? []).filter((s) => VALID_SENSITIVITIES.has(s))
  const input: AssessmentInput = {
    industry: fields.industry,
    currentCrypto: (fields.currentCrypto ?? []).filter((a) => VALID_ALGORITHMS.has(a)),
    dataSensitivity,
    complianceRequirements: (fields.complianceRequirements ?? []).filter((f) =>
      VALID_COMPLIANCE.has(f)
    ),
    migrationStatus:
      fields.migrationStatus && VALID_MIGRATIONS.has(fields.migrationStatus)
        ? (fields.migrationStatus as AssessmentInput['migrationStatus'])
        : 'unknown',
  }
  if (dataSensitivity.length === 0) input.sensitivityUnknown = true
  if (fields.country && VALID_COUNTRIES.has(fields.country)) input.country = fields.country
  if (fields.cryptoUseCases) {
    const useCases = fields.cryptoUseCases.filter((uc) => VALID_USE_CASES.has(uc))
    if (useCases.length > 0) input.cryptoUseCases = useCases
  }
  if (fields.dataRetention) {
    const retention = fields.dataRetention.filter((v) => VALID_RETENTION.has(v))
    if (retention.length > 0) input.dataRetention = retention
  }
  if (fields.systemCount && VALID_SYSTEM_COUNT.has(fields.systemCount)) {
    input.systemCount = fields.systemCount as NonNullable<AssessmentInput['systemCount']>
  }
  if (fields.teamSize && VALID_TEAM_SIZE.has(fields.teamSize)) {
    input.teamSize = fields.teamSize as NonNullable<AssessmentInput['teamSize']>
  }
  if (fields.cryptoAgility && VALID_AGILITY.has(fields.cryptoAgility)) {
    input.cryptoAgility = fields.cryptoAgility as NonNullable<AssessmentInput['cryptoAgility']>
  }
  if (fields.infrastructure) {
    const infra = fields.infrastructure.filter((item) => VALID_INFRA.has(item))
    if (infra.length > 0) input.infrastructure = infra
  }
  if (fields.vendorDependency && VALID_VENDOR.has(fields.vendorDependency)) {
    input.vendorDependency = fields.vendorDependency as NonNullable<
      AssessmentInput['vendorDependency']
    >
  }
  if (fields.timelinePressure && VALID_PRESSURE.has(fields.timelinePressure)) {
    input.timelinePressure = fields.timelinePressure as NonNullable<
      AssessmentInput['timelinePressure']
    >
  }
  return input
}

export interface SharedReportView {
  result: AssessmentResult
  persona: PersonaId | null
  approximate: boolean
  /** True when no link was opened: a visitor without a report of their own is
   *  shown the worked example in place of an empty page (see
   *  `sampleReportView`). */
  sample?: boolean
}

/** Query params that make `useResolvedSharedReport` resolve a link. While any
 *  of them is present the link wins and the sample is never substituted. */
export const REPORT_LINK_PARAMS = ['share', 'example', 'i', 'cy', 'a', 's', 'p', 'm', 't', 'v']

/**
 * The worked example, as shown on bare `/report` to a visitor who has not
 * started an assessment. Search engines index `/report`; an empty "No Report
 * Yet" page read to them as a soft 404, and they must see what visitors see,
 * so both get this sample under a banner that says it is one.
 */
export function sampleReportView(livePersona: PersonaId | null): SharedReportView {
  return {
    result: exampleReportResultFor(livePersona),
    persona: livePersona ?? toValidPersona(EXAMPLE_REPORT_PERSONA),
    approximate: false,
    sample: true,
  }
}

/**
 * Resolves a shared/example report link (`?example=1`, `?share=<token>`, or
 * the oldest per-param format) into an ephemeral, in-memory view — decoding
 * NEVER writes into the recipient's own persisted assessment or persona
 * store. Returns `null` when the current URL carries none of these, meaning
 * "render the recipient's own live result instead."
 *
 * Shared by desktop (`ReportView.tsx`) and mobile (`MobileReportView.tsx`,
 * via the prop `ReportView` passes down) so both read the identical
 * resolution instead of mobile silently having none at all — which is what
 * the Executive/GRC split's E2E acceptance surfaced (2026-09-07): a GRC (or
 * any persona's) shared/example link opened on a phone landed on "No Report
 * Yet" instead of the sender's report.
 *
 * Re-resolves on every DISTINCT `searchParams` value (keyed on its string
 * form), not just once at mount — the previous mount-only guard could miss a
 * same-route query change (e.g. tapping a second shared link without
 * navigating away first, which React Router does not remount for).
 */
export function useResolvedSharedReport(livePersona: PersonaId | null): SharedReportView | null {
  const [searchParams] = useSearchParams()
  const paramsKey = searchParams.toString()
  const [sharedView, setSharedView] = useState<SharedReportView | null>(null)
  const resolvedKeyRef = useRef<string | null>(null)
  const livePersonaRef = useRef(livePersona)
  // Refs are for effects/handlers, never render (React rule) — keep this one
  // current via its own effect rather than assigning it in the render body.
  useEffect(() => {
    livePersonaRef.current = livePersona
  }, [livePersona])

  useEffect(() => {
    if (resolvedKeyRef.current === paramsKey) return
    resolvedKeyRef.current = paramsKey

    // Stable, human-readable entry point for the worked example:
    // `/report?example=1`, equivalent to opening `EXAMPLE_REPORT_URL`. Why a
    // second path rather than just linking the canonical URL: persona hero
    // CTAs are configured in `src/data/personaConfig.ts`, which the nav
    // pulls into the MAIN bundle. `EXAMPLE_REPORT_URL` embeds a token minted
    // at module-eval by `computeAssessment`, so importing it there would
    // drag the whole assessment orchestrator into every route. A static
    // path lets the config reference the example without that cost. Renders
    // under the example's own authored persona so both entry points show
    // the identical report.
    if (searchParams.get('example') === '1') {
      logReportShareLinkOpened()
      setSharedView({
        // GRC sees the comprehensive-track example; everyone else the quick one.
        result: exampleReportResultFor(livePersonaRef.current),
        // Renders under the VIEWER's own persona when one is set, not always
        // the example's authored 'curious' — falls back to the example's own
        // authored persona for a first-time visitor with none selected yet.
        persona: livePersonaRef.current ?? toValidPersona(EXAMPLE_REPORT_PERSONA),
        approximate: false,
      })
      return
    }

    // Current token path: ?share=<base64 v2 token>, or an older v1 token
    // still circulating from before this fix shipped.
    const shareToken = searchParams.get('share')
    if (shareToken) {
      const schema = decodeShareToken(shareToken)
      if (!schema) {
        setSharedView(null)
        return
      }
      if (schema.v === 2) {
        logReportShareLinkOpened()
        setSharedView({
          result: schema.result,
          persona: toValidPersona(schema.persona),
          approximate: false,
        })
        return
      }
      // v1: partial quick-track-only inputs + a score that was never
      // actually honored — recompute best-effort and say so plainly.
      const v1 = schema as ReportShareSchemaV1
      const input = buildLegacyInput(v1)
      if (!input) {
        setSharedView(null)
        return
      }
      logReportShareLinkOpened()
      setSharedView({
        result: computeAssessment(input),
        persona: toValidPersona(v1.persona),
        approximate: true,
      })
      return
    }

    // Legacy individual-param path: ?i=&cy=&c=&d=&f=&m=&u=&r=&s=&t=&a=&n=&v=&p=
    // — predates the token format entirely, so likewise has no score to
    // honor; recompute from whichever fields survive validation.
    const industry = searchParams.get('i')
    if (!industry) {
      setSharedView(null)
      return
    }
    const csv = (key: string): string[] | undefined => searchParams.get(key)?.split(',')
    const input = buildLegacyInput({
      industry,
      country: searchParams.get('cy') ? decodeURIComponent(searchParams.get('cy')!) : undefined,
      currentCrypto: csv('c'),
      dataSensitivity: csv('d'),
      complianceRequirements: csv('f'),
      migrationStatus: searchParams.get('m') ?? undefined,
      cryptoUseCases: csv('u'),
      dataRetention: csv('r'),
      systemCount: searchParams.get('s') ?? undefined,
      teamSize: searchParams.get('t') ?? undefined,
      cryptoAgility: searchParams.get('a') ?? undefined,
      infrastructure: csv('n'),
      vendorDependency: searchParams.get('v') ?? undefined,
      timelinePressure: searchParams.get('p') ?? undefined,
    })
    if (!input) {
      setSharedView(null)
      return
    }
    logReportShareLinkOpened()
    setSharedView({ result: computeAssessment(input), persona: null, approximate: true })
  }, [paramsKey, searchParams])

  return sharedView
}
