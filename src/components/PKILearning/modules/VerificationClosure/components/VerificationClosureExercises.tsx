// SPDX-License-Identifier: AGPL-3.0-only
import type { FC } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onNavigateToWorkshop?: (step?: number) => void
}

const EXERCISES: {
  title: string
  badge: string
  prompt: string
  evidenceCheck: string
  step: number
  cta: string
}[] = [
  {
    title: '1. Verify Classical Removal After Hybrid Cutover',
    badge: 'Decommission',
    prompt:
      'An RSA-2048 TLS key has been replaced by an ML-KEM hybrid, and the change ticket is closed. Why is the migration still not "done", and what is the missing step?',
    evidenceCheck:
      'A closed change ticket proves workflow completion, not cryptographic retirement. In production, collect independent observation evidence — active/passive TLS handshake captures confirming classical-only cipher/group fallback is rejected and key-store/HSM destruction logs — before logging retirement.',
    step: 0,
    cta: 'Walk the decommission steps',
  },
  {
    title: '2. Estate-Scale Verification & Module Evidence',
    badge: 'Coverage',
    prompt:
      'You have 4,000 systems across three tiers. How much do you verify per tier, and what counts as proof for a Tier-1 system?',
    evidenceCheck:
      'Verify Tier-1 business-critical services at 100% using observed handshake/signature telemetry plus active CMVP FIPS 140-3 certificate & Security Policy checks (distinguishing ACVP algorithm vectors from module-level validation, and never accepting marketing claims). Sample lower tiers per wave and widen scope on any failure.',
    step: 1,
    cta: 'Plan coverage',
  },
  {
    title: '3. BAU Capability Handover & Residual Risk',
    badge: 'Program Closure',
    prompt:
      'The program is finishing. List the standing capabilities that must transfer to a permanent owner before you can close — and who accepts the residual risk (for example, on a records archiving and retrieval service protecting long-lived records).',
    evidenceCheck:
      'Distinguish the business service (archiving and retrieval service) from the protected assets (long-lived records). Closure requires named permanent owners for CBOM, continuous discovery, vendor/CMVP tracking, SOC drift rules, and KRIs, plus a signed residual-risk acceptance with a re-evaluation date and an archived evidence dossier. A Hub handover export is an educational template, not actual closure sign-off.',
    step: 2,
    cta: 'Build the handover register',
  },
]

export const VerificationClosureExercises: FC<Props> = ({ onNavigateToWorkshop }) => (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">
      Verification and closure are where programs quietly fail. Reason through each scenario and its
      evidence requirements, then practice in the corresponding Workshop tool.
    </p>
    {EXERCISES.map((ex, i) => (
      <div key={i} className="glass-panel p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">{ex.title}</h3>
          <span className="text-[10px] px-2 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary font-semibold">
            {ex.badge}
          </span>
        </div>
        <p className="text-sm text-foreground/90">{ex.prompt}</p>
        <div className="bg-muted/40 rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">GRC decision &amp; evidence check:</strong>{' '}
            {ex.evidenceCheck}
          </p>
        </div>
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToWorkshop?.(ex.step)}
            className="gap-1.5 border-primary text-primary hover:bg-primary/10"
          >
            {ex.cta} <ArrowRight size={13} />
          </Button>
        </div>
      </div>
    ))}
  </div>
)
