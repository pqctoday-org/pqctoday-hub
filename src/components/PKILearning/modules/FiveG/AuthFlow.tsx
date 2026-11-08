// SPDX-License-Identifier: AGPL-3.0-only
import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { Step } from '../DigitalAssets/components/StepWizard'
import { StepWizard } from '../DigitalAssets/components/StepWizard'
import {
  WorkshopOperationLog,
  type LogEntry,
} from '@/components/PKILearning/common/WorkshopOperationLog'
import { Button } from '@/components/ui/button'
import { FIVE_G_CONSTANTS } from './constants'
import { AuthDiagram } from './components/AuthDiagram'
import {
  fiveGService,
  type AuthenticationSnapshot,
  type AuthenticationStage,
} from './services/FiveGService'
import { Info } from 'lucide-react'

interface AuthFlowProps {
  onBack: () => void
}
type Sample = ReturnType<typeof fiveGService.createAuthenticationSample>
const STAGES: AuthenticationStage[] = [
  'retrieve_creds',
  'gen_rand',
  'compute_milenage',
  'compute_autn',
  'derive_kausf',
  'verify_ue',
  'verify_seaf',
  'verify_ausf',
]

function stagePassed(
  value: AuthenticationSnapshot,
  stage: AuthenticationStage | undefined
): boolean {
  return Object.entries(value.stageComplete).some(([id, passed]) => id === stage && passed === true)
}

export const AuthFlow: React.FC<AuthFlowProps> = ({ onBack }) => {
  const sampleRef = useRef<Sample | null>(null)
  const sample = () =>
    sampleRef.current ?? (sampleRef.current = fiveGService.createAuthenticationSample())
  const [snapshot, setSnapshot] = useState<AuthenticationSnapshot>(() => sample().getSnapshot())
  const [currentStep, setCurrentStep] = useState(0)
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const busyRef = useRef(false)
  const mounted = useRef(false)
  const revision = useRef(0)

  const invalidateRevision = useCallback(() => {
    revision.current++
  }, [])
  useEffect(() => {
    mounted.current = true
    // Strict-mode effect replay may have disposed the initial, still-empty instance.
    if (!sampleRef.current) sampleRef.current = fiveGService.createAuthenticationSample()
    return () => {
      mounted.current = false
      invalidateRevision()
      sampleRef.current?.dispose()
      sampleRef.current = null
    }
  }, [invalidateRevision])

  const withdrawOutput = () => {
    invalidateRevision()
    setOutput(null)
    setError(null)
    setLogs([])
  }
  const edit = (update: (context: Sample) => AuthenticationSnapshot, earliestStep: number) => {
    withdrawOutput()
    setSnapshot(update(sample()))
    setCurrentStep((current) => Math.min(current, earliestStep))
  }
  const sessionAction = (
    action: 'newChallenge' | 'replayLastChallenge' | 'reset',
    step: number
  ) => {
    if (busyRef.current) return
    withdrawOutput()
    const context = sample()
    setSnapshot(
      action === 'newChallenge'
        ? context.newChallenge()
        : action === 'replayLastChallenge'
          ? context.replayLastChallenge()
          : context.reset()
    )
    setCurrentStep(step)
  }
  const executeStep = async () => {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    withdrawOutput()
    const context = sample()
    const generation = revision.current
    const stage = STAGES.at(currentStep)
    const isCurrent = () =>
      mounted.current && revision.current === generation && sampleRef.current === context
    const startedAt = performance.now()
    setLogs([{ status: 'pending', message: 'Running the current local authentication check' }])
    try {
      if (!stage) throw new Error('Unknown authentication sample activity')
      const operation = context.execute(stage)
      const pending = context.getSnapshot()
      const pendingComplete = {
        ...pending.stageComplete,
        ...Object.fromEntries(STAGES.slice(currentStep).map((id) => [id, false])),
      }
      setSnapshot({ ...pending, accepted: false, stageComplete: pendingComplete })
      const result = await operation
      if (!isCurrent()) return
      setSnapshot(result.snapshot)
      if (!stagePassed(result.snapshot, stage))
        throw new Error('The current sample activity did not complete')
      setOutput(result.output)
      setLogs([
        {
          status: 'success',
          message: result.output,
          durationMs: Math.round(performance.now() - startedAt),
        },
      ])
    } catch (cause) {
      if (!isCurrent()) return
      setSnapshot(context.getSnapshot())
      const message = cause instanceof Error ? cause.message : String(cause)
      const kind =
        cause instanceof Error && 'kind' in cause && typeof cause.kind === 'string'
          ? `${cause.kind}: `
          : ''
      setError(kind + message)
      setLogs([{ status: 'error', message: `Sample check incomplete: ${message}` }])
    } finally {
      // Input edits invalidate results, but do not release the outstanding operation's lock.
      if (mounted.current) {
        busyRef.current = false
        setBusy(false)
      }
    }
  }
  const move = (next: number) => {
    if (busyRef.current) return
    withdrawOutput()
    if (next < 0) onBack()
    else setCurrentStep(Math.min(next, STAGES.length - 1))
  }
  const accepted =
    snapshot.accepted &&
    snapshot.consumed &&
    snapshot.stageComplete.verify_ue &&
    snapshot.stageComplete.verify_seaf &&
    snapshot.stageComplete.verify_ausf &&
    !busy &&
    !error
  const steps: Step[] = FIVE_G_CONSTANTS.AUTH_STEPS.map((step, index) => ({
    ...step,
    language: 'javascript',
    actionLabel: 'Run sample activity',
    diagram: <AuthDiagram step={index} />,
  }))
  const stage = STAGES.at(currentStep)
  const complete =
    stagePassed(snapshot, stage) && !busy && !error && (stage !== 'verify_ausf' || accepted)

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground">
        <Info size={13} className="shrink-0" />
        <p>
          This local 5G-AKA authentication-check sample uses browser software MILENAGE and key
          derivation, not a live USIM, HSM or network. Its fictional single subscriber accepts only
          the exact next sequence value, then increments without wrapping. Reset is a local sample
          reset, not production resynchronization or durable replay protection. KSEAF, KAMF and NAS
          security mode are not executed.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <section
          className="rounded-lg border border-border p-3 min-w-0"
          aria-label="Home-network sample inputs"
        >
          <h3 className="font-semibold text-sm">Home network — fixed sample credential copy</h3>
          <p className="text-xs break-all">K: {snapshot.networkKHex || 'Not loaded'}</p>
          <p className="text-xs break-all">OPc: {snapshot.networkOPcHex || 'Not computed'}</p>
          <label className="block text-xs mt-2" htmlFor="auth-network-sqn">
            Challenge network SQN (hex)
          </label>
          <input
            id="auth-network-sqn"
            className="w-full rounded border border-border bg-background p-2 font-mono text-xs"
            value={snapshot.networkSqnHex}
            onChange={(event) => edit((context) => context.setChallengeSqn(event.target.value), 1)}
          />
          <p className="text-xs mt-1">
            Next network SQN: <span className="font-mono">{snapshot.nextNetworkSqnHex}</span>
          </p>
        </section>
        <section
          className="rounded-lg border border-border p-3 min-w-0"
          aria-label="Subscriber sample inputs"
        >
          <h3 className="font-semibold text-sm">
            Subscriber / UE — independent fixed credential copy
          </h3>
          <p className="text-xs break-all">K: {snapshot.subscriberKHex || 'Not loaded'}</p>
          <p className="text-xs break-all">OPc: {snapshot.subscriberOPcHex || 'Not computed'}</p>
          <p className="text-xs mt-2">
            UE next expected SQN: <strong className="font-mono">{snapshot.ueNextSqnHex}</strong>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            The UE recomputes from its own credentials and received RAND/AUTN. Failed checks do not
            advance this counter or release a response.
          </p>
        </section>
      </div>
      <div className="rounded-lg border border-border p-3 space-y-3 min-w-0">
        <h3 className="font-semibold text-sm">
          Actual sender outputs and separately received values
        </h3>
        <p className="text-xs break-all">Network RAND: {snapshot.randHex || 'Not generated'}</p>
        <p className="text-xs break-all">
          Authentic network AUTN: {snapshot.autnHex || 'Not constructed'}
        </p>
        <label className="block text-xs" htmlFor="auth-received-autn">
          Received UE AUTN (editable hex)
        </label>
        <input
          id="auth-received-autn"
          className="w-full rounded border border-border bg-background p-2 font-mono text-xs"
          value={snapshot.receivedAutnHex}
          onChange={(event) => edit((context) => context.setReceivedAutn(event.target.value), 5)}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={!snapshot.autnHex}
          onClick={() => edit((context) => context.setReceivedAutn(snapshot.autnHex), 5)}
        >
          Restore authentic AUTN
        </Button>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            ['Home KAUSF', snapshot.kausfHex],
            ['Home XRES*', snapshot.xresStarHex],
            ['Home HXRES*', snapshot.hxresStarHex],
            ['Serving HRES*', snapshot.hresStarHex],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="font-semibold">{label}</dt>
              <dd className="font-mono break-all">{value || 'Not derived for this challenge'}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs break-all">
          UE computed RES*: {snapshot.ueResStarHex || 'Not released by a passing UE check'}
        </p>
        <label className="block text-xs" htmlFor="auth-received-response">
          Received network RES* (editable hex)
        </label>
        <input
          id="auth-received-response"
          className="w-full rounded border border-border bg-background p-2 font-mono text-xs"
          value={snapshot.receivedResStarHex}
          onChange={(event) =>
            edit((context) => context.setReceivedResponse(event.target.value), 6)
          }
        />
        <Button
          variant="outline"
          size="sm"
          disabled={!snapshot.ueResStarHex}
          onClick={() => edit((context) => context.setReceivedResponse(snapshot.ueResStarHex), 6)}
        >
          Restore genuine UE response
        </Button>
        <p className="text-xs text-muted-foreground">
          Edits withdraw dependent checks immediately. Restore restores bytes, not sequence state or
          a consumed challenge. Production tools need independently scoped MAC, sequence,
          serving-network and home-network results; a sample pass does not assess a deployment.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={busy || !snapshot.stageComplete.retrieve_creds}
          onClick={() => sessionAction('newChallenge', 1)}
        >
          New sample challenge
        </Button>
        <Button
          variant="outline"
          disabled={busy || !snapshot.canReplay}
          onClick={() => sessionAction('replayLastChallenge', 5)}
        >
          Replay last accepted challenge
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => sessionAction('reset', 0)}>
          Reset fictional session
        </Button>
      </div>
      <StepWizard
        steps={steps}
        currentStepIndex={currentStep}
        onExecute={executeStep}
        output={output}
        isExecuting={busy}
        error={error}
        isStepComplete={complete}
        onNext={() => move(currentStep + 1)}
        onBack={() => move(currentStep - 1)}
        onComplete={onBack}
        completeLabel="Return to flow chooser"
      />
      {accepted && (
        <div
          role="status"
          className="rounded border border-status-success/40 bg-status-success/10 p-3 text-sm"
        >
          Local sample authentication accepted — UE, serving-network and home-network checks passed
          for this challenge; pending challenge consumed.
        </div>
      )}
      {logs.length > 0 && <WorkshopOperationLog entries={logs} className="mt-4 max-h-40" />}
    </div>
  )
}
