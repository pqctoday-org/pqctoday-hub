// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useRef, useState } from 'react'
import type { Step } from '../DigitalAssets/components/StepWizard'
import { StepWizard } from '../DigitalAssets/components/StepWizard'
import {
  WorkshopOperationLog,
  type LogEntry,
} from '@/components/PKILearning/common/WorkshopOperationLog'
import { FIVE_G_CONSTANTS } from './constants'
import { ProvisioningDiagram } from './components/ProvisioningDiagram'
import { fiveGService } from './services/FiveGService'
import { Info } from 'lucide-react'

interface ProvisioningFlowProps {
  onBack: () => void
}

type ImportedSample = Awaited<ReturnType<typeof fiveGService.importAtUDM>>

export const ProvisioningFlow: React.FC<ProvisioningFlowProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [keys, setKeys] = useState<{ k?: string; opc?: string }>({})
  const [envelopeText, setEnvelopeText] = useState('')
  const [transportKey, setTransportKey] = useState<CryptoKey | null>(null)
  const [accepted, setAccepted] = useState<ImportedSample | null>(null)
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [complete, setComplete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const busyRef = useRef(false)
  const mounted = useRef(false)
  const revision = useRef(0)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      revision.current++
    }
  }, [])

  // Results belong to the current inputs and step, not the shared wizard's accumulated trace.
  const invalidateResult = () => {
    revision.current++
    setAccepted(null)
    setComplete(false)
    setOutput(null)
    setError(null)
    setLogs([])
  }
  const clearTransport = () => {
    setEnvelopeText('')
    setTransportKey(null)
  }

  const executeStep = async () => {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    invalidateResult()
    const runRevision = revision.current
    const stepId = FIVE_G_CONSTANTS.PROVISIONING_STEPS[currentStep].id
    const input = { ...keys }
    const serializedInput = envelopeText
    const localKey = transportKey
    const isCurrent = () => mounted.current && revision.current === runRevision
    const startedAt = performance.now()
    setLogs([{ status: 'pending', message: 'Running current sample activity' }])
    try {
      let result: string
      if (stepId === 'gen_k') {
        setKeys({})
        clearTransport()
        const k = await fiveGService.generateSubKey()
        if (!isCurrent()) return
        setKeys({ k })
        result = `[SAMPLE CALCULATION] Browser-generated subscriber key K:\n${k}\nGenerated with Web Crypto getRandomValues; no factory HSM is inspected.`
      } else if (stepId === 'compute_opc_sim') {
        setKeys({ k: input.k })
        clearTransport()
        if (!input.k) throw new Error('Generate K first')
        const opc = await fiveGService.computeOPc(input.k)
        if (!isCurrent()) return
        setKeys({ k: input.k, opc })
        result = `[SAMPLE CALCULATION] Computed OPc:\n${opc}\nBound to the current K and sample Operator OP.`
      } else if (stepId === 'personalize_sim') {
        if (!input.k || !input.opc) throw new Error('Generate K and compute OPc first')
        result = await fiveGService.personalizeUSIM(input.k, input.opc)
      } else if (stepId === 'encrypt_transport') {
        clearTransport()
        if (!input.k || !input.opc) throw new Error('Generate K and compute OPc first')
        const encrypted = await fiveGService.encryptTransport(input.k, input.opc)
        if (!isCurrent()) return
        setEnvelopeText(JSON.stringify(encrypted.envelope, null, 2))
        setTransportKey(encrypted.transportKey)
        result =
          'Browser WebCrypto AES-128-GCM encrypted this sample record. The editable envelope contains the nonce and ciphertext/tag; its nonextractable transport key stays separately in browser memory.'
      } else if (stepId === 'import_udm') {
        if (!localKey || !serializedInput) throw new Error('Encrypt a sample envelope first')
        const imported = await fiveGService.importAtUDM(
          serializedInput,
          localKey,
          '310260123456789'
        )
        if (!isCurrent()) return
        setAccepted(imported)
        result =
          'Authenticated and validated the current sample envelope; accepted one in-memory sample record. No card or subscriber database was written.'
      } else {
        throw new Error('Unknown provisioning activity')
      }
      if (!isCurrent()) return
      setOutput(result)
      setComplete(true)
      setLogs([
        {
          status: 'success',
          message:
            stepId === 'personalize_sim'
              ? 'Card process walkthrough viewed — no card write'
              : result,
          durationMs: Math.round(performance.now() - startedAt),
        },
      ])
    } catch (cause) {
      if (!isCurrent()) return
      const message = cause instanceof Error ? cause.message : String(cause)
      setError(message)
      setLogs([{ status: 'error', message: `Sample incomplete: ${message}` }])
    } finally {
      if (mounted.current) {
        busyRef.current = false
        setBusy(false)
      }
    }
  }

  const move = (nextStep: number) => {
    if (busyRef.current) return
    invalidateResult()
    setCurrentStep(nextStep)
  }
  const steps: Step[] = FIVE_G_CONSTANTS.PROVISIONING_STEPS.map((step, index) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    code: step.code,
    language: 'javascript',
    actionLabel:
      step.id === 'personalize_sim'
        ? 'Show process walkthrough'
        : step.id === 'encrypt_transport'
          ? 'Encrypt sample envelope'
          : step.id === 'import_udm'
            ? 'Authenticate and import sample'
            : 'Run sample calculation',
    diagram: <ProvisioningDiagram step={index} accepted={accepted !== null} />,
    customControls: ['encrypt_transport', 'import_udm'].includes(step.id) ? (
      <div className="space-y-2">
        <label htmlFor="provisioning-envelope" className="block text-sm font-medium">
          Serialized transport envelope
        </label>
        <textarea
          id="provisioning-envelope"
          value={envelopeText}
          onChange={(event) => {
            invalidateResult()
            setEnvelopeText(event.target.value)
          }}
          rows={9}
          spellCheck={false}
          className="w-full min-w-0 rounded border border-border bg-background p-3 font-mono text-xs break-all"
        />
        <p className="text-xs text-muted-foreground">
          Edit the ciphertext or tag to test rejection, then restore the valid envelope and retry.
          The matching transport key stays separate and is not serialized here.
        </p>
      </div>
    ) : undefined,
  }))

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/40 text-xs text-muted-foreground">
        <Info size={13} className="shrink-0" />
        <span>
          Use fictional sample keys only. Browser WebCrypto encrypts and authenticates a local
          AES-128-GCM envelope; the receiver checks its identity and K/OPc relationship before
          accepting an in-memory record. Card personalization and database storage remain
          walkthroughs. This does not establish manufacturer identity, key distribution, replay
          protection, HSM residency or deployed subscriber readiness. With your production tools,
          evaluate protected key handling, supported transport formats and per-record rejection
          using positive and tampered samples.
        </span>
      </div>
      <StepWizard
        steps={steps}
        currentStepIndex={currentStep}
        onExecute={executeStep}
        output={output}
        isExecuting={busy}
        error={error}
        isStepComplete={complete}
        onNext={() => {
          if (complete && currentStep < steps.length - 1) move(currentStep + 1)
        }}
        onBack={() => {
          if (currentStep > 0) move(currentStep - 1)
          else onBack()
        }}
        onComplete={onBack}
        completeLabel="Finish provisioning sample"
      />
      {accepted && (
        <section
          aria-label="Accepted in-memory sample record"
          className="rounded border border-success/40 p-3 space-y-2"
        >
          <h3 className="font-semibold">Accepted in-memory sample record</h3>
          <pre className="text-xs whitespace-pre-wrap break-all">
            {JSON.stringify(accepted.record, null, 2)}
          </pre>
          <ul className="text-xs space-y-1">
            {Object.entries(accepted.checks).map(([name, outcome]) => (
              <li key={name}>
                {name}: {outcome}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Sample acceptance only; no UDM database or card write.
          </p>
        </section>
      )}
      <WorkshopOperationLog entries={logs} className="mt-4 max-h-40" />
    </div>
  )
}
