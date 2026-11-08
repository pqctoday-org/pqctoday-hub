// SPDX-License-Identifier: AGPL-3.0-only
import React, { useCallback, useMemo, useState } from 'react'
import { Play, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHSM } from '@/hooks/useHSM'
import { LiveHSMToggle } from '@/components/shared/LiveHSMToggle'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { GateReason } from '@/components/shared/GateReason'
import {
  AVAILABILITY_LABEL,
  ENGINES,
  FLOWS,
  PROVIDERS,
  SIMULATION_NOTICE,
  flowById,
  flowsFor,
  providerById,
  type ExchangeFlow,
  type ProviderId,
} from '../data/cloudKmsExchangeData'
import {
  CLASSICAL_PROFILES,
  HPKE_ENGINE_LABEL,
  HPKE_IMPORT_SUITES,
  effectiveEngine,
  hpkeEngineNote,
  observeAwsHybrid,
  observeAwsMlKem,
  observeClassical,
  observeHpke,
  runAwsHybridEstablishment,
  runAwsMlKemEstablishment,
  runClassicalImport,
  runHpkeImport,
  suiteById,
  v33Supported,
  type HpkeEngine,
  type HpkeImportSuite,
  type Hctx,
  type StepObservations,
} from '../services/cloudKmsExchange'
import { CloudKmsRadioGroup } from './CloudKmsRadioGroup'
import { CloudKmsFlowSteps } from './CloudKmsFlowSteps'
import { CloudKmsFacts } from './CloudKmsFacts'

const LIVE_OPERATIONS = [
  'C_GenerateKeyPair',
  'C_GenerateKey',
  'C_WrapKey',
  'C_UnwrapKey',
  'C_EncapsulateKey',
  'C_DecapsulateKey',
  'C_DeriveKey',
  'C_Encrypt',
  'C_Decrypt',
]

/** One finished run, kept so the comparison list can set flows side by side. */
interface FlowRun {
  flowId: string
  observations: StepObservations
  /** Bytes the third party sends to the provider (or application). */
  sentBytes: number
  sentLabel: string
  verified: boolean
  engineLabel?: string
}

const SUITE_OPTIONS = HPKE_IMPORT_SUITES.map((s) => ({
  value: s.id,
  label: s.label,
  hint: s.apiName,
}))

const ENGINE_OPTIONS = ENGINES.map((e) => ({ value: e.id, label: e.label }))

export const CloudKmsKeyExchange: React.FC = () => {
  const hsm = useHSM()
  const [providerId, setProviderId] = useState<ProviderId>('aws')
  const [flowId, setFlowId] = useState<string>('aws-classical')
  const [engine, setEngine] = useState<HpkeEngine>('v32')
  const [suiteId, setSuiteId] = useState<HpkeImportSuite['id']>('xwing')
  const [senderV32, setSenderV32] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [runs, setRuns] = useState<Record<string, FlowRun>>({})
  // "Not in this engine yet" is an answer about one loaded engine; it only counts while that engine is loaded.
  const [v33MissingFor, setV33MissingFor] = useState<string | null>(null)

  const provider = providerById(providerId)
  const flow = flowById(flowId)
  const suite = suiteById(suiteId)
  const flowOptions = useMemo(
    () => flowsFor(providerId).map((f) => ({ value: f.id, label: f.tabLabel })),
    [providerId]
  )
  const isHpke = flow.kind === 'hpke'
  const v33Missing = v33MissingFor !== null && v33MissingFor === hsm.engine
  const effective = effectiveEngine(engine, suite)
  const engineInfo = ENGINES.find((e) => e.id === engine)!
  const engineNote = hpkeEngineNote(engine, suite)
  const showSenderChoice = isHpke && effective !== 'v32'
  const run = runs[flow.id]

  const selectProvider = useCallback((next: ProviderId) => {
    setProviderId(next)
    setFlowId(flowsFor(next)[0].id)
    setError(null)
  }, [])

  const selectFlow = useCallback((next: string) => {
    setFlowId(next)
    setError(null)
  }, [])

  const runSimulation = useCallback(async () => {
    const M = hsm.moduleRef.current
    const hSession = hsm.hSessionRef.current
    if (!hsm.isReady || !M || !hSession) {
      setError('The HSM session is not ready. Enable the HSM above first.')
      return
    }
    const ctx: Hctx = { M, hSession }
    setRunning(true)
    setError(null)
    // Let the "Running" state paint before the (synchronous) engine calls start.
    await new Promise((resolve) => setTimeout(resolve, 0))
    try {
      let result: FlowRun
      switch (flow.kind) {
        case 'classical': {
          const r = runClassicalImport(ctx, CLASSICAL_PROFILES[flow.providerId])
          result = {
            flowId: flow.id,
            observations: observeClassical(r),
            sentBytes: r.wrappedBytes,
            sentLabel: 'wrapped blob',
            verified: r.matches && r.structureVerified,
          }
          break
        }
        case 'hpke': {
          if (effective === 'v33' && !v33Supported(ctx, hsm.slotRef.current)) {
            setV33MissingFor(hsm.engine)
            throw new Error(
              'Not in this engine yet: the loaded engine does not advertise CKM_COMP_KEM.'
            )
          }
          const r = runHpkeImport(ctx, {
            engine,
            senderEngine: senderV32 && showSenderChoice ? 'v32' : engine,
            suite,
          })
          result = {
            flowId: flow.id,
            observations: observeHpke(r),
            sentBytes: r.wireBytes,
            sentLabel: 'enc ‖ ciphertext',
            verified: r.matches,
            engineLabel: HPKE_ENGINE_LABEL[engine],
          }
          break
        }
        case 'aws-mlkem': {
          const r = runAwsMlKemEstablishment(ctx, 768)
          result = {
            flowId: flow.id,
            observations: observeAwsMlKem(r),
            sentBytes: r.ciphertextBytes + r.wrappedBytes,
            sentLabel: 'ML-KEM ciphertext + AES-KW output',
            verified: r.matches && r.secretsMatch,
          }
          break
        }
        case 'aws-hybrid': {
          const r = runAwsHybridEstablishment(ctx, 768)
          result = {
            flowId: flow.id,
            observations: observeAwsHybrid(r),
            sentBytes: r.wrappedBytes,
            sentLabel: 'AES-KW output (plus the ML-KEM ciphertext and the ECDH public key)',
            verified: r.matches && r.ecdhSecretsMatch && r.mlkemSecretsMatch,
          }
          break
        }
      }
      setRuns((prev) => ({ ...prev, [flow.id]: result }))
      hsm.addStepLog(`${flow.title}: simulation run`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRunning(false)
    }
  }, [engine, effective, flow, hsm, showSenderChoice, senderV32, suite])

  const completed = FLOWS.filter((f) => runs[f.id]).map((f) => ({ flow: f, run: runs[f.id] }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gradient mb-2">Exchanging keys with a cloud KMS</h2>
        <p className="text-sm text-muted-foreground">
          Move a key from a third-party HSM into AWS KMS, Google Cloud KMS or Azure, first the way
          the providers document it today, then with HPKE and a post-quantum KEM. At each step you
          see which call is modelled, which PKCS#11 mechanism runs, how many bytes cross the wire
          and where the key sits.
        </p>
      </div>

      <div
        role="note"
        aria-label="Simulation notice"
        className="glass-panel border border-status-warning/40 bg-status-warning/5 p-3 text-sm"
      >
        <strong>Simulation.</strong> {SIMULATION_NOTICE}
      </div>

      <LiveHSMToggle hsm={hsm} operations={LIVE_OPERATIONS} />

      <div className="glass-panel space-y-4 p-4">
        <CloudKmsRadioGroup
          legend="Provider"
          value={providerId}
          options={PROVIDERS.map((p) => ({ value: p.id, label: p.name }))}
          onChange={selectProvider}
          disabled={running}
        />
        <CloudKmsRadioGroup
          legend="Flow"
          value={flowId}
          options={flowOptions}
          onChange={selectFlow}
          disabled={running}
        />
        {isHpke && (
          <div className="space-y-4 border-t border-border/40 pt-4">
            <CloudKmsRadioGroup
              legend="HPKE suite (KEM with HKDF-SHA256 and AES-256-GCM)"
              value={suiteId}
              options={SUITE_OPTIONS}
              onChange={setSuiteId}
              disabled={running}
            />
            <CloudKmsRadioGroup
              legend="PKCS#11 engine"
              value={engine}
              options={ENGINE_OPTIONS}
              onChange={(e) => {
                setEngine(e)
                setError(null)
              }}
              disabled={running}
            />
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">{engineInfo.label}.</span>{' '}
                {engineInfo.standing}
              </p>
              <p>
                Mechanisms: <span className="font-mono">{engineInfo.mechanisms}</span>
              </p>
              {engineNote && <p>{engineNote}</p>}
              {engine === 'v33' && v33Missing && (
                <p role="status">
                  Not in this engine yet: the loaded engine does not advertise CKM_COMP_KEM.
                </p>
              )}
            </div>
            {showSenderChoice && (
              <label className="flex min-h-[44px] cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={senderV32}
                  disabled={running}
                  onChange={(e) => setSenderV32(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0"
                />
                <span>
                  Interoperability check: the third-party HSM seals with the PKCS#11 v3.2 composed
                  sequence while the provider opens with the engine selected above.
                </span>
              </label>
            )}
          </div>
        )}
      </div>

      <FlowCard flow={flow} observations={run?.observations} />

      <div className="space-y-2">
        <Button
          onClick={() => void runSimulation()}
          disabled={running || !hsm.isReady || (isHpke && effective === 'v33' && v33Missing)}
          className="min-h-[44px]"
        >
          {running ? (
            <Loader2 size={16} className="mr-2 animate-spin" aria-hidden="true" />
          ) : (
            <Play size={16} className="mr-2" aria-hidden="true" />
          )}
          {running ? 'Running…' : 'Run simulation'}
        </Button>
        <GateReason when={!hsm.isReady}>
          Enable the HSM above to run the simulation. Nothing is sent anywhere; the in-browser HSM
          does all the work.
        </GateReason>
        <div role="status" aria-live="polite" className="text-sm">
          {run && !error && (
            <p>
              {run.verified
                ? 'Run finished: the recovered key matches the original.'
                : 'Run finished, but a check failed. See the measured lines below.'}
            </p>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-status-error">
            {error}
          </p>
        )}
      </div>

      <CloudKmsFacts
        heading={`What ${provider.name} documents`}
        claimIds={provider.claimIds}
        note={provider.note}
      />

      {completed.length > 0 && (
        <section aria-label="Measured sizes" className="glass-panel space-y-3 p-4">
          <h4 className="text-sm font-semibold">Measured in your runs</h4>
          <ul className="space-y-2">
            {completed.map(({ flow: f, run: r }) => (
              <li key={f.id} className="rounded-md border border-border/60 p-2 text-sm">
                <p className="font-semibold">{f.title}</p>
                <p className="text-xs text-muted-foreground">
                  {r.sentBytes} bytes sent ({r.sentLabel})
                  {r.engineLabel ? `; engine: ${r.engineLabel}` : ''}; key recovered intact:{' '}
                  {r.verified ? 'yes' : 'no'}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hsm.isReady && (
        <Pkcs11LogPanel
          log={hsm.log}
          onClear={hsm.clearLog}
          defaultOpen={false}
          title="PKCS#11 Call Log: cloud KMS key exchange"
          emptyMessage="Run a simulation to see the PKCS#11 calls it makes."
          filterFns={LIVE_OPERATIONS}
        />
      )}
    </div>
  )
}

function FlowCard({ flow, observations }: { flow: ExchangeFlow; observations?: StepObservations }) {
  return (
    <section aria-labelledby={`flow-${flow.id}`} className="space-y-3">
      <div>
        <h3 id={`flow-${flow.id}`} className="text-base font-bold">
          {flow.title}
        </h3>
        <p className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-xs font-semibold">
          {AVAILABILITY_LABEL[flow.availability]}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{flow.summary}</p>
        <p className="mt-2 text-sm">
          <span className="font-semibold">Verdict.</span> {flow.verdict}
        </p>
      </div>
      <CloudKmsFlowSteps flow={flow} observations={observations} />
    </section>
  )
}
