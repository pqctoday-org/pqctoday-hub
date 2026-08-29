// SPDX-License-Identifier: GPL-3.0-only
//
// PKCS#11 v3.2 conformance runner — WS-11. Runs OASIS's own published
// mandatory Profiles v3.2 test cases (Tier A) and per-condition probes of
// whichever profiles an engine actually claims (Tier B) live in the
// browser, against both the C++ and Rust engines' identical raw WASM ABI.
//
// See pkcs11-hsm-playground-ws11-conformance-runner-plan-08282026.md and
// pkcs11-conformance-remaining-gaps-plan-08282026.md for the full design.
// Phases 1-2 built the executor/probe table; Phase 3 wired
// AUTH-M-1-32/CERT-M-1-32 into the executor; this Phase 4 wiring runs all
// four Tier A cases and provisions the fixtures those two need.
import { useState } from 'react'
import { CheckCircle, XCircle, MinusCircle, Copy, ShieldCheck, ListChecks } from 'lucide-react'
import { useHsmContext } from './HsmContext'
import { Button } from '../../ui/button'
import {
  hsm_finalize,
  hsm_initialize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
  hsm_findProfileObjects,
  CKP_BASELINE_PROVIDER,
  CKP_EXTENDED_PROVIDER,
  CKP_AUTHENTICATION_TOKEN,
  CKP_PUBLIC_CERTIFICATES_TOKEN,
  type SoftHSMModule,
} from '../../../wasm/softhsm'
import {
  runXmlTestCase,
  type TestCaseExecutionResult,
} from '../../../wasm/pkcs11ConformanceRunner/xmlTestCaseExecutor'
import {
  runProfileConditionProbes,
  type ProfileClaim,
} from '../../../wasm/pkcs11ConformanceRunner/profileConditions'
import {
  provisionAuthFixture,
  provisionCertFixture,
} from '../../../wasm/pkcs11ConformanceRunner/profileFixtures'
import blM132Xml from '../../../data/pkcs11-profiles/test-cases/BL-M-1-32.xml?raw'
import extM132Xml from '../../../data/pkcs11-profiles/test-cases/EXT-M-1-32.xml?raw'
import authM132Xml from '../../../data/pkcs11-profiles/test-cases/AUTH-M-1-32.xml?raw'
import certM132Xml from '../../../data/pkcs11-profiles/test-cases/CERT-M-1-32.xml?raw'

type RowStatus = 'pass' | 'fail' | 'not-claimed'

interface RunnerRow {
  id: string
  engine: string
  tier: 'A' | 'B'
  name: string
  citation: string
  status: RowStatus
  detail: string
}

interface TierACase {
  id: string
  xml: string
  profile: ProfileClaim
  citation: string
  /** Provisions the token objects this test case's XML assumes pre-exist
   * (OASIS's example never creates them itself) and returns any extra
   * ${...} bindings the executor needs — real PKCS#11 calls, run on the
   * SAME freshly-initialized token the XML then replays against. */
  fixture?: (M: SoftHSMModule, hSession: number) => Record<string, string | number>
}

const TIER_A_CASES: TierACase[] = [
  {
    id: 'BL-M-1-32',
    xml: blM132Xml,
    profile: 'baseline',
    citation: 'Profiles v3.2 §5.1.1 (Baseline Provider mandatory test case)',
  },
  {
    id: 'EXT-M-1-32',
    xml: extM132Xml,
    profile: 'extended',
    citation: 'Profiles v3.2 §5.3.1 (Extended Provider mandatory test case)',
  },
  {
    id: 'AUTH-M-1-32',
    xml: authM132Xml,
    profile: 'authentication',
    citation: 'Profiles v3.2 §5.4.1 (Authentication Token mandatory test case)',
    fixture: (M, hSession) => provisionAuthFixture(M, hSession),
  },
  {
    id: 'CERT-M-1-32',
    xml: certM132Xml,
    profile: 'certificates',
    citation: 'Profiles v3.2 §5.5.1 (Public Certificates Token mandatory test case)',
    fixture: (M, hSession) => {
      provisionCertFixture(M, hSession, certM132Xml)
      return {}
    },
  },
]

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

const StatusIcon = ({ status }: { status: RowStatus }) => {
  if (status === 'pass') return <CheckCircle className="h-4 w-4 text-status-success shrink-0" />
  if (status === 'fail') return <XCircle className="h-4 w-4 text-destructive shrink-0" />
  return <MinusCircle className="h-4 w-4 text-muted-foreground shrink-0" />
}

export const Pkcs11ConformanceRunner = () => {
  const { moduleRef, crossCheckModuleRef, engineMode, hSessionRef, slotRef } = useHsmContext()
  const [rows, setRows] = useState<RunnerRow[]>([])
  const [loading, setLoading] = useState(false)
  const [ran, setRan] = useState(false)

  const runConformance = async () => {
    setLoading(true)
    setRan(true)

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
        const claims = new Set<ProfileClaim>()
        if (profileObjects.some((p) => p.profileId === CKP_BASELINE_PROVIDER))
          claims.add('baseline')
        if (profileObjects.some((p) => p.profileId === CKP_EXTENDED_PROVIDER))
          claims.add('extended')
        if (profileObjects.some((p) => p.profileId === CKP_AUTHENTICATION_TOKEN))
          claims.add('authentication')
        if (profileObjects.some((p) => p.profileId === CKP_PUBLIC_CERTIFICATES_TOKEN))
          claims.add('certificates')

        // Tier A — a FRESH C_InitToken before every case, not just a
        // Finalize/Initialize: CERT-M-1-32's unauthenticated find expects
        // its own fixture objects at index 0/1, which only holds if no
        // earlier case's token objects (e.g. AUTH-M-1-32's public key) are
        // still on the token. C_InitToken wipes the slot's prior token
        // outright, so each case starts from a genuinely clean token.
        for (const tc of TIER_A_CASES) {
          if (!claims.has(tc.profile)) {
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
          const result = await runXmlTestCase(M, tc.id, tc.xml, eName === 'C++' ? 'cpp' : 'rust', {
            Pin: 'user1234',
            ...fixtureBindings,
          })
          newRows.push({
            id: `${tc.id}-${eName}`,
            engine: eName,
            tier: 'A',
            name: tc.id,
            citation: tc.citation,
            status: result.pass ? 'pass' : 'fail',
            detail: summarizeTestCase(tc.id, result),
          })
        }

        // Tier B needs a live session again — Tier A's last test case left
        // the module finalized.
        hsm_initialize(M)
        const slot1 = hsm_getFirstSlot(M)
        const tierBSlot = hsm_initToken(M, slot1, '12345678', 'SoftHSM3')
        const tierBSession = hsm_openUserSession(M, tierBSlot, '12345678', 'user1234')
        const probeResults = runProfileConditionProbes(M, tierBSession, tierBSlot, claims)
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
        // Restore context state so other tabs (which read hSessionRef/
        // slotRef directly) keep working after a conformance run.
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

    setRows(newRows)
    setLoading(false)
  }

  const pass = rows.filter((r) => r.status === 'pass').length
  const fail = rows.filter((r) => r.status === 'fail').length
  const notClaimed = rows.filter((r) => r.status === 'not-claimed').length

  const handleCopyReport = () => {
    const lines = rows.map(
      (r) => `[${r.status.toUpperCase()}] ${r.engine} ${r.name} (${r.citation}): ${r.detail}`
    )
    lines.push(
      '',
      `Result: ${pass} pass, ${fail} fail, ${notClaimed} not-claimed (of ${rows.length} rows)`
    )
    navigator.clipboard.writeText(lines.join('\n'))
  }

  return (
    <div className="space-y-4" data-testid="pkcs11-conformance-runner">
      <p className="text-sm text-muted-foreground">
        Runs OASIS&apos;s own published mandatory PKCS#11 v3.2 Profiles conformance test cases (Tier
        A) plus a probe of every numbered condition of the profiles each engine actually claims
        (Tier B) — entirely in-browser, against the raw WASM ABI. See the methodology below for what
        this does and doesn&apos;t cover.
      </p>

      <div className="flex items-center gap-2">
        <Button
          onClick={runConformance}
          disabled={loading}
          variant="outline"
          className="border-secondary/50 text-secondary hover:bg-secondary/10"
          data-testid="pkcs11-conformance-run-button"
        >
          <ShieldCheck className={`mr-2 h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
          {loading ? 'Running conformance checks…' : 'Run Conformance Checks'}
        </Button>
        {ran && !loading && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopyReport}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            title="Copy report"
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
      </div>

      {ran && !loading && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
            fail === 0
              ? 'bg-status-success/10 border border-status-success/30 text-status-success'
              : 'bg-destructive/10 border border-destructive/30 text-destructive'
          }`}
          data-testid="pkcs11-conformance-summary"
        >
          {fail === 0 ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {pass}/{rows.length} rows conformant
          {fail > 0 && ` — ${fail} failed`}
          {notClaimed > 0 && ` — ${notClaimed} not claimed by either engine`}
        </div>
      )}

      {rows.length > 0 && (
        <div className="bg-background border border-border rounded-lg overflow-hidden divide-y divide-border/50 max-h-96 overflow-y-auto">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-start gap-2 px-3 py-2"
              data-testid="pkcs11-conformance-row"
              data-status={r.status}
            >
              <StatusIcon status={r.status} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                    {r.engine}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                    Tier {r.tier}
                  </span>
                  <span className="text-xs font-medium truncate">{r.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                    {r.citation}
                  </span>
                </div>
                <p
                  className={`text-[11px] mt-0.5 font-mono break-all ${
                    r.status === 'fail' ? 'text-destructive' : 'text-muted-foreground'
                  }`}
                >
                  {r.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-border/50 bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
        <p className="flex items-center gap-1.5 font-medium text-foreground">
          <ListChecks className="h-3.5 w-3.5" /> Coverage
        </p>
        <p>
          Tier A: {TIER_A_CASES.length} OASIS mandatory test cases wired (
          {TIER_A_CASES.map((t) => t.id).join(', ')}) — AUTH-M-1-32 and CERT-M-1-32 each provision
          the token objects their own XML assumes pre-exist (a real RSA key pair; a data object plus
          a certificate) before running. A row renders as not-claimed only for a profile the engine
          genuinely doesn&apos;t publish a CKO_PROFILE for.
        </p>
        <p>
          Tier B: up to 28 Baseline + 6 Extended + 8 Authentication Token + 5 Public Certificates
          Token condition probes per engine, gated on each engine&apos;s own claimed profiles.
        </p>
        <p>
          Not run in-browser: the C++ engine&apos;s native 815-row conformance suite
          (p11_v32_compliance_test.cpp), the Rust engine&apos;s native 976-check suite
          (test_p11_conformance.js), and the 49-scenario cross-engine differential harness — all
          native-only by construction (dlopen/fork/filesystem token store). Their evidence stays in
          pqctoday-hsm&apos;s own checked-in reports, not duplicated here.
        </p>
      </div>
    </div>
  )
}
