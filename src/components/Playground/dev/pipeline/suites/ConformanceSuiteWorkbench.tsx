// SPDX-License-Identifier: GPL-3.0-only
//
// ConformanceSuiteWorkbench — the Build tab's PKCS#11 v3.2 Profiles
// conformance suite inside the shared Builder/Code shell (design handoff
// design_handoff_kmip_pkcs11_playground §3.6, D6). Palette = Tier A cases
// (checkbox each), Tier B condition probes and Mechanism Coverage toggles;
// canvas = the summary banner + rows; aside = selection, the "not run in-
// browser" disclosure and the methodology. Code = a generated Python driver
// that runs the same selection through the `pkcs11_conformance` bridge.
// Execution is hsm/conformance/usePkcs11Conformance.ts — the same OASIS XML
// replay + probe sequences as before; e2e/pkcs11-conformance.local.spec.ts's
// testids are preserved.
import { useMemo, useState } from 'react'
import { CheckCircle, XCircle, MinusCircle, Copy, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { usePersonaStore } from '@/store/usePersonaStore'
import {
  usePkcs11Conformance,
  TIER_A_CASES,
  TIER_B_GROUPS,
  type RowStatus,
} from '../../../hsm/conformance/usePkcs11Conformance'
import { SuiteShell, type SuiteView, type CodeRunOutput } from './SuiteShell'
import { emitConformanceSuite } from './suiteCodegen'
import { createConformanceBridge, runSuiteScript } from './suiteBridges'

const StatusIcon = ({ status }: { status: RowStatus }) => {
  if (status === 'pass') return <CheckCircle className="h-4 w-4 text-status-success shrink-0" />
  if (status === 'fail') return <XCircle className="h-4 w-4 text-destructive shrink-0" />
  return <MinusCircle className="h-4 w-4 text-muted-foreground shrink-0" />
}

export const ConformanceSuiteWorkbench = () => {
  const role = usePersonaStore((s) => s.selectedPersona)
  const suite = usePkcs11Conformance()
  const {
    rows,
    loading,
    ran,
    selection,
    toggleCase,
    setTierB,
    setCoverage,
    run,
    pass,
    fail,
    notClaimed,
    reportText,
    engineMode,
  } = suite
  const [view, setView] = useState<SuiteView>('builder')
  const [codeRunning, setCodeRunning] = useState(false)
  const [codeOutput, setCodeOutput] = useState<CodeRunOutput | null>(null)

  const code = useMemo(() => emitConformanceSuite(selection, engineMode), [selection, engineMode])

  if (role === 'curious' || role === 'executive') return null

  const runCode = async () => {
    setCodeRunning(true)
    setCodeOutput(null)
    try {
      setCodeOutput(
        await runSuiteScript(code, { pkcs11_conformance: createConformanceBridge(suite) })
      )
    } catch (e) {
      setCodeOutput({ ok: false, text: `Could not run: ${(e as Error).message}` })
    } finally {
      setCodeRunning(false)
    }
  }

  const running = loading || codeRunning
  const nothingSelected = selection.tierA.size === 0 && !selection.tierB && !selection.coverage
  const tierBCount = TIER_B_GROUPS.reduce((n, g) => n + g.probes, 0)

  const palette = (
    <>
      <div>
        <div className="text-xs font-semibold uppercase text-muted-foreground mb-1.5">
          Tier A · mandatory
        </div>
        <div className="space-y-1">
          {TIER_A_CASES.map((tc) => {
            const row = rows.find((r) => r.name === tc.id)
            return (
              <label
                key={tc.id}
                className="flex items-start gap-2 p-1.5 rounded-md hover:bg-muted/50 cursor-pointer text-xs"
                data-testid={`pkcs11-conformance-case-${tc.id}`}
              >
                <input
                  type="checkbox"
                  aria-label={tc.id}
                  className="mt-0.5 accent-primary"
                  checked={selection.tierA.has(tc.id)}
                  onChange={() => toggleCase(tc.id)}
                />
                <span className="flex-1 min-w-0">
                  <span className="block font-mono font-medium text-foreground">{tc.id}</span>
                  <span className="block text-[10.5px] text-muted-foreground">
                    {tc.label}
                    {row && (
                      <>
                        {' · '}
                        <span
                          className={
                            row.status === 'pass'
                              ? 'text-status-success'
                              : row.status === 'fail'
                                ? 'text-destructive'
                                : 'text-muted-foreground'
                          }
                        >
                          {row.status}
                        </span>
                      </>
                    )}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </div>
      <div>
        <label className="flex items-start gap-2 p-1.5 rounded-md hover:bg-muted/50 cursor-pointer text-xs">
          <input
            type="checkbox"
            aria-label="Tier B condition probes"
            className="mt-0.5 accent-primary"
            checked={selection.tierB}
            onChange={(e) => setTierB(e.target.checked)}
          />
          <span className="flex-1 min-w-0">
            <span className="block font-medium text-foreground">Tier B · condition probes</span>
            <span className="block text-[10.5px] text-muted-foreground">
              up to {tierBCount} checks, per claimed profile
            </span>
          </span>
        </label>
        <div className="pl-7 space-y-0.5">
          {TIER_B_GROUPS.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between text-[10.5px] text-muted-foreground"
            >
              <span>{g.label}</span>
              <span className="font-mono">{g.probes}</span>
            </div>
          ))}
        </div>
      </div>
      <label className="flex items-start gap-2 p-1.5 rounded-md hover:bg-muted/50 cursor-pointer text-xs">
        <input
          type="checkbox"
          aria-label="Mechanism Coverage probes"
          className="mt-0.5 accent-primary"
          checked={selection.coverage}
          onChange={(e) => setCoverage(e.target.checked)}
        />
        <span className="flex-1 min-w-0">
          <span className="block font-medium text-foreground">Mechanism Coverage</span>
          <span className="block text-[10.5px] text-muted-foreground">
            CKA_SEED determinism — §6.67.4 / §6.68.4 / §6.69.2
          </span>
        </span>
      </label>
      <div className="mt-auto pt-3 border-t text-[10.5px] text-muted-foreground">
        <div className="font-semibold uppercase mb-1">Engine</div>
        <div className="font-mono">
          {engineMode === 'cpp' ? 'C++' : engineMode === 'rust' ? 'Rust' : 'C++ + Rust (dual)'}
        </div>
      </div>
    </>
  )

  const canvas = (
    <div className="space-y-3" data-testid="pkcs11-conformance-runner">
      <div>
        <h3 className="text-base font-bold">PKCS#11 v3.2 Conformance Runner</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Runs OASIS&apos;s own published mandatory Profiles v3.2 test cases (Tier A) plus a probe
          of every numbered condition of the profiles each engine actually claims (Tier B) —
          entirely in-browser, against the raw WASM ABI.
        </p>
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

      {rows.length > 0 ? (
        <div className="bg-background border border-border rounded-lg overflow-hidden divide-y divide-border/50 max-h-[50vh] overflow-y-auto">
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
                    {r.tier === 'Coverage' ? 'Mechanism Coverage' : `Tier ${r.tier}`}
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
      ) : (
        <p className="p-8 text-center text-xs text-muted-foreground/60 italic border border-dashed rounded-lg">
          {loading
            ? 'Running conformance checks…'
            : 'No rows yet. Pick cases on the left and press Run.'}
        </p>
      )}
    </div>
  )

  const aside = (
    <>
      <Card className="p-3.5">
        <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Selection</div>
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tier A</span>
            <span className="font-mono">
              {selection.tierA.size}/{TIER_A_CASES.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tier B</span>
            <span className="font-mono">
              {selection.tierB ? `${TIER_B_GROUPS.length} groups` : 'off'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Coverage</span>
            <span className="font-mono">{selection.coverage ? 'on' : 'off'}</span>
          </div>
          {ran && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last run</span>
              <span className="font-mono">
                {pass}✓ {fail}✗ {notClaimed}–
              </span>
            </div>
          )}
        </div>
      </Card>
      <Card className="p-3.5 text-[11px] text-muted-foreground space-y-1.5">
        <p className="flex items-center gap-1.5 font-medium text-foreground">
          <ListChecks className="h-3.5 w-3.5" /> Not run in-browser
        </p>
        <p>
          The C++ engine&apos;s native 815-row conformance suite, the Rust engine&apos;s native
          976-check suite and the 49-scenario cross-engine differential harness are native-only by
          construction (dlopen/fork/filesystem token store). Their evidence lives in
          pqctoday-hsm&apos;s own checked-in reports.
        </p>
      </Card>
      <Card className="p-3.5 text-[11px] text-muted-foreground space-y-1.5">
        <p className="font-medium text-foreground">Methodology</p>
        <p>
          Tier A replays OASIS&apos;s own XML test cases verbatim on a freshly initialised token per
          case; AUTH-M-1-32 and CERT-M-1-32 provision the objects their XML assumes. A row is
          not-claimed only for a profile the engine genuinely publishes no CKO_PROFILE for.
        </p>
        <p>
          Tier B probes every numbered condition of each claimed profile (Baseline 17, Extended 6,
          Auth Token 8, Cert Token 5, HKDF TLS 6) plus one Complete Provider union check; unclaimed
          profiles render no row.
        </p>
        <p>
          Mechanism Coverage is gated only on C_GetMechanismList — deterministic PQC key generation
          from CKA_SEED (ML-DSA, ML-KEM, SLH-DSA), the two-calls-same-seed-same-key check the spec
          requires and no other suite here tests.
        </p>
      </Card>
    </>
  )

  return (
    <SuiteShell
      title="PKCS#11 v3.2 Conformance Runner"
      subtitle="OASIS Profiles v3.2 — Tier A mandatory cases · Tier B condition probes · Mechanism Coverage"
      actions={
        ran && !loading ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void navigator.clipboard.writeText(reportText())}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            title="Copy report"
          >
            <Copy className="h-4 w-4" />
          </Button>
        ) : null
      }
      running={running}
      runLabel="Run Conformance Checks"
      runTestId="pkcs11-conformance-run-button"
      runDisabled={view === 'builder' && nothingSelected}
      runTitle={
        view === 'code'
          ? 'Run the generated script through the pkcs11_conformance bridge'
          : nothingSelected
            ? 'Select at least one case or probe group first'
            : 'Run the selected cases and probes'
      }
      onRun={() => (view === 'code' ? void runCode() : void run())}
      palette={palette}
      canvas={canvas}
      aside={aside}
      code={code}
      downloadName="pkcs11-conformance.py"
      codeOutput={codeOutput}
      view={view}
      onViewChange={setView}
      testId="conformance-suite-workbench"
    />
  )
}
