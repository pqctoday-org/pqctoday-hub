// SPDX-License-Identifier: GPL-3.0-only
//
// usePkcs11Conformance — the PKCS#11 v3.2 Profiles conformance runner's
// state + run logic (WS-11; see pkcs11-hsm-playground-ws11-conformance-
// runner-plan-08282026.md), extracted from Pkcs11ConformanceRunner.tsx on
// 2026-09-02 (design handoff design_handoff_kmip_pkcs11_playground WP-P6b)
// so the Build tab's suite workbench and the Pyodide `pkcs11_conformance`
// bridge drive ONE runner, now with a selection: which Tier A cases, and
// whether Tier B condition probes / Mechanism Coverage probes run.
// Execution is unchanged — OASIS's own XML test cases replayed verbatim
// (Tier A), generated probe sequences (Tier B, Coverage), all against the
// raw WASM ABI of the C++ and/or Rust engine.
import { useCallback, useRef, useState } from 'react'
import { useHsmContext } from '../HsmContext'
import {
  hsm_finalize,
  hsm_initialize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
  hsm_findProfileObjects,
  hsm_getMechanismList,
  CKP_BASELINE_PROVIDER,
  CKP_EXTENDED_PROVIDER,
  CKP_AUTHENTICATION_TOKEN,
  CKP_PUBLIC_CERTIFICATES_TOKEN,
  CKP_COMPLETE_PROVIDER,
  CKP_HKDF_TLS_TOKEN,
  type SoftHSMModule,
} from '@/wasm/softhsm'
import {
  runXmlTestCase,
  type TestCaseExecutionResult,
} from '@/wasm/pkcs11ConformanceRunner/xmlTestCaseExecutor'
import {
  runProfileConditionProbes,
  type ProfileClaim,
} from '@/wasm/pkcs11ConformanceRunner/profileConditions'
import {
  provisionAuthFixture,
  provisionCertFixture,
} from '@/wasm/pkcs11ConformanceRunner/profileFixtures'
import { runMechanismCoverageProbes } from '@/wasm/pkcs11ConformanceRunner/mechanismCoverageProbes'
import blM132Xml from '@/data/pkcs11-profiles/test-cases/BL-M-1-32.xml?raw'
import extM132Xml from '@/data/pkcs11-profiles/test-cases/EXT-M-1-32.xml?raw'
import authM132Xml from '@/data/pkcs11-profiles/test-cases/AUTH-M-1-32.xml?raw'
import certM132Xml from '@/data/pkcs11-profiles/test-cases/CERT-M-1-32.xml?raw'

export type RowStatus = 'pass' | 'fail' | 'not-claimed'

export interface RunnerRow {
  id: string
  engine: string
  tier: 'A' | 'B' | 'Coverage'
  name: string
  citation: string
  status: RowStatus
  detail: string
}

export interface TierACase {
  id: string
  xml: string
  profile: ProfileClaim
  /** Short profile name for the palette. */
  label: string
  citation: string
  /** Provisions the token objects this test case's XML assumes pre-exist
   * (OASIS's example never creates them itself) and returns any extra
   * ${...} bindings the executor needs — real PKCS#11 calls, run on the
   * SAME freshly-initialized token the XML then replays against. */
  fixture?: (M: SoftHSMModule, hSession: number) => Record<string, string | number>
}

export const TIER_A_CASES: TierACase[] = [
  {
    id: 'BL-M-1-32',
    xml: blM132Xml,
    profile: 'baseline',
    label: 'Baseline Provider',
    citation: 'Profiles v3.2 §5.1.1 (Baseline Provider mandatory test case)',
  },
  {
    id: 'EXT-M-1-32',
    xml: extM132Xml,
    profile: 'extended',
    label: 'Extended Provider',
    citation: 'Profiles v3.2 §5.3.1 (Extended Provider mandatory test case)',
  },
  {
    id: 'AUTH-M-1-32',
    xml: authM132Xml,
    profile: 'authentication',
    label: 'Authentication Token',
    citation: 'Profiles v3.2 §5.4.1 (Authentication Token mandatory test case)',
    fixture: (M, hSession) => provisionAuthFixture(M, hSession),
  },
  {
    id: 'CERT-M-1-32',
    xml: certM132Xml,
    profile: 'certificates',
    label: 'Public Certificates Token',
    citation: 'Profiles v3.2 §5.5.1 (Public Certificates Token mandatory test case)',
    fixture: (M, hSession) => {
      provisionCertFixture(M, hSession, certM132Xml)
      return {}
    },
  },
]

export const TIER_A_IDS: string[] = TIER_A_CASES.map((c) => c.id)

/** Tier B probe groups per profile — counts from profileConditions.ts,
 *  shown in the palette; gating stays discovery-driven at run time. */
export const TIER_B_GROUPS: { id: ProfileClaim; label: string; probes: number }[] = [
  { id: 'baseline', label: 'Baseline', probes: 17 },
  { id: 'extended', label: 'Extended', probes: 6 },
  { id: 'authentication', label: 'Auth Token', probes: 8 },
  { id: 'certificates', label: 'Cert Token', probes: 5 },
  { id: 'hkdf_tls', label: 'HKDF TLS', probes: 6 },
]

export interface ConformanceSelection {
  tierA: Set<string>
  tierB: boolean
  coverage: boolean
}

export const FULL_SELECTION = (): ConformanceSelection => ({
  tierA: new Set(TIER_A_IDS),
  tierB: true,
  coverage: true,
})

const summarizeTestCase = (id: string, result: TestCaseExecutionResult): string => {
  const failing = result.steps.filter(
    (s) => !s.rvOk || s.error || s.findings.some((f) => !f.exempt)
  )
  if (failing.length === 0) return `${id}: all ${result.steps.length} steps conformant`
  return failing
    .map((s) => {
      const bits = [
        !s.rvOk && `rv=${s.rvActual} (expected ${s.rvExpected})`,
        s.error,
        ...s.findings
          .filter((f) => !f.exempt)
          .map((f) => `${f.field}: expected=${f.expected} actual=${f.actual}`),
      ].filter(Boolean)
      return `${s.fn}: ${bits.join('; ')}`
    })
    .join(' | ')
}

export function usePkcs11Conformance() {
  const { moduleRef, crossCheckModuleRef, engineMode, hSessionRef, slotRef, phase, autoInit } =
    useHsmContext()
  const [rows, setRows] = useState<RunnerRow[]>([])
  const [loading, setLoading] = useState(false)
  const [ran, setRan] = useState(false)
  const [selection, setSelection] = useState<ConformanceSelection>(FULL_SELECTION)
  const [claims, setClaims] = useState<Record<string, ProfileClaim[]>>({})
  const loadingRef = useRef(false)

  const toggleCase = useCallback((id: string) => {
    setSelection((prev) => {
      const tierA = new Set(prev.tierA)
      if (tierA.has(id)) tierA.delete(id)
      else tierA.add(id)
      return { ...prev, tierA }
    })
  }, [])
  const setTierB = useCallback(
    (on: boolean) => setSelection((prev) => ({ ...prev, tierB: on })),
    []
  )
  const setCoverage = useCallback(
    (on: boolean) => setSelection((prev) => ({ ...prev, coverage: on })),
    []
  )

  /** Run the given selection (defaults to the current one) and return the
   *  rows — also streamed into `rows` state for the Builder view. */
  const run = useCallback(
    async (sel?: ConformanceSelection): Promise<RunnerRow[]> => {
      if (loadingRef.current) return []
      const use = sel ?? selection
      loadingRef.current = true
      setLoading(true)
      setRan(true)

      // Self-heal, same as the ACVP suite: a direct ?dtab=conformance deep
      // link mounts this suite before anything initialised the engine, and
      // an engine-mode switch leaves the module null. (Re)initialise rather
      // than dead-end on "Engine setup: Cannot read properties of null".
      if (!moduleRef.current || phase !== 'session_open') {
        const ok = await autoInit()
        if (!ok || !moduleRef.current) {
          const row: RunnerRow = {
            id: 'init-error',
            engine: engineMode,
            tier: 'A',
            name: 'Engine setup',
            citation: '—',
            status: 'fail',
            detail: 'HSM initialization failed. Reload the page and retry.',
          }
          setRows([row])
          setLoading(false)
          loadingRef.current = false
          return [row]
        }
      }

      const engines: { M: SoftHSMModule; name: string }[] = []
      if (engineMode === 'cpp') {
        engines.push({ M: moduleRef.current!, name: 'C++' })
      } else if (engineMode === 'rust') {
        engines.push({ M: moduleRef.current!, name: 'Rust' })
      } else if (engineMode === 'dual') {
        engines.push({ M: moduleRef.current!, name: 'C++' })
        if (crossCheckModuleRef.current) {
          engines.push({ M: crossCheckModuleRef.current, name: 'Rust' })
        }
      }

      const newRows: RunnerRow[] = []
      const newClaims: Record<string, ProfileClaim[]> = {}

      for (const engine of engines) {
        const { M, name: eName } = engine
        try {
          try {
            hsm_finalize(M, hSessionRef.current)
          } catch {
            // best-effort shutdown before a fresh conformance run
          }
          hsm_initialize(M)
          const slot0 = hsm_getFirstSlot(M)
          const initSlot = hsm_initToken(M, slot0, '12345678', 'SoftHSM3')
          const hSession = hsm_openUserSession(M, initSlot, '12345678', 'user1234')

          // Discovery-driven claims — an engine's own CKO_PROFILE objects,
          // never assumed. Both tiers gate on this the same way.
          const profileObjects = hsm_findProfileObjects(M, hSession)
          const claimed = new Set<ProfileClaim>()
          if (profileObjects.some((p) => p.profileId === CKP_BASELINE_PROVIDER))
            claimed.add('baseline')
          if (profileObjects.some((p) => p.profileId === CKP_EXTENDED_PROVIDER))
            claimed.add('extended')
          if (profileObjects.some((p) => p.profileId === CKP_AUTHENTICATION_TOKEN))
            claimed.add('authentication')
          if (profileObjects.some((p) => p.profileId === CKP_PUBLIC_CERTIFICATES_TOKEN))
            claimed.add('certificates')
          if (profileObjects.some((p) => p.profileId === CKP_COMPLETE_PROVIDER))
            claimed.add('complete')
          if (profileObjects.some((p) => p.profileId === CKP_HKDF_TLS_TOKEN))
            claimed.add('hkdf_tls')
          newClaims[eName] = [...claimed]

          // Tier A — a FRESH C_InitToken before every case, not just a
          // Finalize/Initialize: CERT-M-1-32's unauthenticated find expects
          // its own fixture objects at index 0/1, which only holds if no
          // earlier case's token objects are still on the token.
          for (const tc of TIER_A_CASES) {
            if (!use.tierA.has(tc.id)) continue
            if (!claimed.has(tc.profile)) {
              newRows.push({
                id: `${tc.id}-${eName}`,
                engine: eName,
                tier: 'A',
                name: tc.id,
                citation: tc.citation,
                status: 'not-claimed',
                detail: `${eName} does not publish a CKO_PROFILE claiming this profile`,
              })
              continue
            }
            try {
              hsm_finalize(M, hSession)
            } catch {
              // expected from the second case onward
            }
            hsm_initialize(M)
            const caseSlot = hsm_getFirstSlot(M)
            const caseInitSlot = hsm_initToken(M, caseSlot, '12345678', 'SoftHSM3')
            const caseSession = hsm_openUserSession(M, caseInitSlot, '12345678', 'user1234')
            const fixtureBindings = tc.fixture ? tc.fixture(M, caseSession) : {}
            hsm_finalize(M, caseSession)
            const result = await runXmlTestCase(
              M,
              tc.id,
              tc.xml,
              eName === 'C++' ? 'cpp' : 'rust',
              {
                Pin: 'user1234',
                ...fixtureBindings,
              }
            )
            newRows.push({
              id: `${tc.id}-${eName}`,
              engine: eName,
              tier: 'A',
              name: tc.id,
              citation: tc.citation,
              status: result.pass ? 'pass' : 'fail',
              detail: summarizeTestCase(tc.id, result),
            })
            setRows(newRows.slice())
          }

          if (use.tierB) {
            // Tier B needs a live session again — Tier A's last test case
            // left the module finalized.
            hsm_initialize(M)
            const slot1 = hsm_getFirstSlot(M)
            const tierBSlot = hsm_initToken(M, slot1, '12345678', 'SoftHSM3')
            const tierBSession = hsm_openUserSession(M, tierBSlot, '12345678', 'user1234')
            const probeResults = runProfileConditionProbes(M, tierBSession, tierBSlot, claimed)
            for (const p of probeResults) {
              newRows.push({
                id: `${p.id}-${eName}`,
                engine: eName,
                tier: 'B',
                name: p.name,
                citation: p.citation,
                status: p.status,
                detail: p.detail,
              })
            }
            hsm_finalize(M, tierBSession)
            setRows(newRows.slice())
          }

          if (use.coverage) {
            // Mechanism Coverage — real PKCS#11 v3.2 mechanisms neither Tier
            // A/B nor the ACVP suite exercise anywhere (2026-08-31 audit).
            // Gated only on C_GetMechanismList, never on a profile claim.
            hsm_initialize(M)
            const mechCovSlot0 = hsm_getFirstSlot(M)
            const mechCovSlot = hsm_initToken(M, mechCovSlot0, '12345678', 'SoftHSM3')
            const mechCovSession = hsm_openUserSession(M, mechCovSlot, '12345678', 'user1234')
            const mechs = new Set(hsm_getMechanismList(M, mechCovSlot))
            const mechCovResults = runMechanismCoverageProbes(M, mechCovSession, mechCovSlot, mechs)
            for (const p of mechCovResults) {
              newRows.push({
                id: `${p.id}-${eName}`,
                engine: eName,
                tier: 'Coverage',
                name: p.mechanismName,
                citation: p.citation,
                status: p.status,
                detail: p.detail,
              })
            }
            hsm_finalize(M, mechCovSession)
          }

          // Restore context state so the Operate panels (which read
          // hSessionRef/slotRef directly) keep working after a run.
          hsm_initialize(M)
          const restoredSlot = hsm_getFirstSlot(M)
          const finalSlot = hsm_initToken(M, restoredSlot, '12345678', 'SoftHSM3')
          slotRef.current = finalSlot
          hSessionRef.current = hsm_openUserSession(M, finalSlot, '12345678', 'user1234')
        } catch (e) {
          newRows.push({
            id: `${eName}-setup-error`,
            engine: eName,
            tier: 'A',
            name: 'Engine setup',
            citation: '—',
            status: 'fail',
            detail: e instanceof Error ? e.message : String(e),
          })
        }
      }

      setClaims(newClaims)
      setRows(newRows)
      setLoading(false)
      loadingRef.current = false
      return newRows
    },
    [selection, engineMode, moduleRef, crossCheckModuleRef, hSessionRef, slotRef, phase, autoInit]
  )

  const runAll = useCallback(() => run(FULL_SELECTION()), [run])

  const pass = rows.filter((r) => r.status === 'pass').length
  const fail = rows.filter((r) => r.status === 'fail').length
  const notClaimed = rows.filter((r) => r.status === 'not-claimed').length

  const reportText = () => {
    const lines = rows.map(
      (r) => `[${r.status.toUpperCase()}] ${r.engine} ${r.name} (${r.citation}): ${r.detail}`
    )
    lines.push(
      '',
      `Result: ${pass} pass, ${fail} fail, ${notClaimed} not-claimed (of ${rows.length} rows)`
    )
    return lines.join('\n')
  }

  return {
    rows,
    loading,
    ran,
    selection,
    setSelection,
    toggleCase,
    setTierB,
    setCoverage,
    claims,
    run,
    runAll,
    pass,
    fail,
    notClaimed,
    reportText,
    engineMode,
  }
}

export type Pkcs11ConformanceSuite = ReturnType<typeof usePkcs11Conformance>
