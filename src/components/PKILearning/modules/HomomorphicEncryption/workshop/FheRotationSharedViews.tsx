// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EvidenceCite } from '../components/FheEvidenceCite'
import {
  ROTATION_MEASURED,
  ROTATION_NEW_SECRETS,
  ROTATION_SESSIONS,
  ROTATION_STATE_ROWS,
  ROTATION_STEPS,
  SHARED_MEASURED,
  SHARED_STEPS,
  type RotationViz,
  type SharedViz,
  rotationAttempt,
  sharedOutcome,
  type RotationNewSecret,
  type RotationSession,
} from './fheRotationSharedData'

/* ------------------------------------------------------------------ */
/*  Small shared pieces                                                */
/* ------------------------------------------------------------------ */

const Stepper: React.FC<{
  label: string
  steps: { id: string; title: string }[]
  index: number
  onChange: (i: number) => void
}> = ({ label, steps, index, onChange }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <p className="text-xs text-muted-foreground" id={`${label}-steps`}>
        Step {index + 1} of {steps.length}
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={index === 0}
          onClick={() => onChange(index - 1)}
          aria-label={`${label}: previous step`}
        >
          <ChevronLeft size={14} className="mr-1" />
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={index === steps.length - 1}
          onClick={() => onChange(index + 1)}
          aria-label={`${label}: next step`}
        >
          Next
          <ChevronRight size={14} className="ml-1" />
        </Button>
      </div>
    </div>
    <ol className="flex flex-wrap gap-1.5" aria-labelledby={`${label}-steps`}>
      {steps.map((s, i) => (
        <li key={s.id}>
          <Button
            size="sm"
            variant={i === index ? 'default' : 'outline'}
            aria-current={i === index ? 'step' : undefined}
            aria-label={`${label} step ${i + 1}: ${s.title}`}
            onClick={() => onChange(i)}
            className="h-8 w-8 p-0 font-mono"
          >
            {i + 1}
          </Button>
        </li>
      ))}
    </ol>
  </div>
)

const OutcomeBadge: React.FC<{ ok: boolean }> = ({ ok }) =>
  ok ? (
    <span className="inline-flex items-center gap-1 font-semibold text-status-success">
      <CheckCircle2 size={14} aria-hidden="true" /> Allowed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 font-semibold text-status-error">
      <XCircle size={14} aria-hidden="true" /> Refused
    </span>
  )

const Toggle: React.FC<{
  group: string
  options: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
}> = ({ group, options, value, onChange }) => (
  <div className="flex flex-wrap gap-2" role="group" aria-label={group}>
    {options.map((o) => (
      <Button
        key={o.id}
        size="sm"
        variant={o.id === value ? 'default' : 'outline'}
        aria-pressed={o.id === value}
        onClick={() => onChange(o.id)}
        className="h-auto whitespace-normal text-left"
      >
        {o.label}
      </Button>
    ))}
  </div>
)

/* ------------------------------------------------------------------ */
/*  Illustrations: what each party holds after the current step        */
/* ------------------------------------------------------------------ */

type ChipState = 'on' | 'off' | 'gone'

/** A small labelled box for a key or a record; the state is also written in words. */
const Chip: React.FC<{ label: string; state?: ChipState; note?: string }> = ({
  label,
  state = 'on',
  note,
}) => (
  <span
    className={`inline-flex flex-wrap items-center gap-x-1.5 rounded border px-2 py-1 text-[11px] ${
      state === 'on'
        ? 'border-primary/50 bg-primary/10 text-foreground'
        : state === 'gone'
          ? 'border-dashed border-destructive/50 bg-destructive/5 text-muted-foreground'
          : 'border-dashed border-border text-muted-foreground'
    }`}
  >
    <span className={`font-mono ${state === 'gone' ? 'line-through' : ''}`}>{label}</span>
    {note && <span className="text-[10px]">{note}</span>}
  </span>
)

const Party: React.FC<{ title: string; sub: string; children: React.ReactNode }> = ({
  title,
  sub,
  children,
}) => (
  <div className="rounded-md border border-border bg-background/60 p-2 space-y-1.5 min-w-0">
    <p className="text-xs font-semibold text-foreground">
      {title} <span className="font-normal text-muted-foreground">{sub}</span>
    </p>
    <div className="flex flex-wrap gap-1.5">{children}</div>
  </div>
)

const RotationIllustration: React.FC<{ viz: RotationViz }> = ({ viz }) => (
  <div
    className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-stretch gap-2"
    aria-hidden="true"
    data-testid="rotation-illustration"
  >
    <Party title="Token" sub="holds the secrets">
      <Chip
        label="old seed"
        state={viz.oldSeed === 'held' ? 'on' : 'gone'}
        note={viz.oldSeed === 'held' ? 'held' : 'destroyed'}
      />
      <Chip
        label="new seed"
        state={viz.newSeed === 'held' ? 'on' : 'off'}
        note={viz.newSeed === 'held' ? 'made by the token' : 'not made yet'}
      />
      {viz.manifest && <Chip label="rotation manifest" note="signed" />}
      {viz.retirement && <Chip label="retirement record" note="signed, public" />}
    </Party>
    <div className="flex items-center justify-center text-[11px] text-muted-foreground text-center sm:w-36">
      {viz.arrow ? <span>→ {viz.arrow} →</span> : <span>&nbsp;</span>}
    </div>
    <Party title="FHE server" sub="no secret">
      <Chip
        label="stored ciphertexts"
        note={viz.ciphertexts === 'old' ? 'under the old key' : 'under the new key'}
      />
      <Chip
        label="rotation key"
        state={viz.rotationKey === 'none' ? 'off' : viz.rotationKey === 'deleted' ? 'gone' : 'on'}
        note={
          viz.rotationKey === 'none'
            ? 'not made yet'
            : viz.rotationKey === 'streaming'
              ? 'arriving'
              : viz.rotationKey === 'deleted'
                ? 'deleted'
                : 'present'
        }
      />
    </Party>
  </div>
)

const SharedIllustration: React.FC<{ viz: SharedViz }> = ({ viz }) => (
  <div className="space-y-2" aria-hidden="true" data-testid="shared-illustration">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <Party title="Token A" sub="MX95">
        <Chip label="share A" state={viz.shareA ? 'on' : 'off'} note="never leaves" />
      </Party>
      <Party title="Mac" sub="combiner">
        {viz.combiner === 'nothing' && <Chip label="no secret" state="off" note="and no share" />}
        {viz.combiner === 'key-shares' && <Chip label="key shares" note="2 × 4.10 GB arriving" />}
        {viz.combiner === 'joint-keys' && <Chip label="joint key set" note="7.87 GB, no secret" />}
        {viz.combiner === 'result-ciphertext' && (
          <>
            <Chip label="joint key set" />
            <Chip label="result ciphertext" note="sent to both tokens" />
          </>
        )}
        {viz.combiner === 'result' && (
          <Chip label="result" note="from both shares; one alone: noise" />
        )}
      </Party>
      <Party title="Token B" sub="MX95 Pro">
        <Chip label="share B" state={viz.shareB ? 'on' : 'off'} note="never leaves" />
      </Party>
    </div>
    {viz.arrows.length > 0 && (
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {viz.arrows.map((a) => (
          <li key={`${a.from}${a.to}${a.label}`}>
            <span className="font-mono text-foreground">
              {a.from === 'M' ? 'Mac' : `Token ${a.from}`} →{' '}
              {a.to === 'M' ? 'Mac' : `Token ${a.to}`}
            </span>
            : {a.label}
          </li>
        ))}
      </ul>
    )}
  </div>
)

/* ------------------------------------------------------------------ */
/*  Key rotation                                                       */
/* ------------------------------------------------------------------ */

/** Pick who starts a rotation and what the new secret is; the token's answer is shown. */
export const RotationAttemptPanel: React.FC<{ onInteract?: () => void }> = ({ onInteract }) => {
  const [session, setSession] = useState<RotationSession>('so')
  const [newSecret, setNewSecret] = useState<RotationNewSecret>('token-made')
  const out = rotationAttempt(session, newSecret)
  return (
    <div className="glass-panel p-3 space-y-3" data-testid="rotation-attempt">
      <p className="text-sm font-semibold text-foreground">Try to start a rotation</p>
      <p className="text-xs text-muted-foreground">
        The token checks the session first, then the parameter set, whether the seeds differ,
        whether it made the new seed, the decryption policy, the direction and the number of
        targets. The caller sees only the return code; the reason goes to the audit log.
      </p>
      <p className="text-xs text-muted-foreground">Who starts it</p>
      <Toggle
        group="Who starts the rotation"
        options={ROTATION_SESSIONS}
        value={session}
        onChange={(id) => {
          setSession(id as RotationSession)
          onInteract?.()
        }}
      />
      <p className="text-xs text-muted-foreground">What the new secret is</p>
      <Toggle
        group="What the new secret is"
        options={ROTATION_NEW_SECRETS}
        value={newSecret}
        onChange={(id) => {
          setNewSecret(id as RotationNewSecret)
          onInteract?.()
        }}
      />
      <div
        className="rounded-md border border-border bg-background/60 p-3 text-xs space-y-1"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm">
          <OutcomeBadge ok={out.allowed} />
          {out.code && <span className="ml-2 font-mono text-foreground break-all">{out.code}</span>}
        </p>
        <p className="text-muted-foreground" data-testid="rotation-rule">
          {out.rule}
        </p>
      </div>
    </div>
  )
}

/** The seven steps of a rotation, with the state of each thing after the step. */
export const RotationView: React.FC<{ onInteract: () => void }> = ({ onInteract }) => {
  const [index, setIndex] = useState(0)
  const step = ROTATION_STEPS[index] // eslint-disable-line security/detect-object-injection
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        <strong className="text-foreground">What you&apos;ll see: </strong>
        How a token moves stored ciphertexts to a new key without decrypting them, step by step with
        the measured sizes and times, and what the token refuses. Measured with the software token
        in a container on a Mac, not on a board (
        <EvidenceCite of={ROTATION_MEASURED.evidence}>rotation run</EvidenceCite>).
      </p>
      <Stepper
        label="Rotation"
        steps={ROTATION_STEPS}
        index={index}
        onChange={(i) => {
          setIndex(i)
          onInteract()
        }}
      />
      <div className="glass-panel p-3 space-y-3" data-testid="rotation-step">
        <RotationIllustration viz={step.viz} />
        <p className="text-xs font-mono text-muted-foreground">{step.actor}</p>
        <h4 className="text-sm font-bold text-foreground">{step.title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
        {step.numbers && (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {step.numbers.map((n) => (
              <div key={n.label} className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">{n.label}:</dt>
                <dd className="font-mono text-foreground">{n.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="border-t border-border pt-2">
          <p className="text-xs font-semibold text-muted-foreground mb-1">State after this step</p>
          <dl className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
            {ROTATION_STATE_ROWS.map((r) => (
              <React.Fragment key={r.key}>
                <dt className="text-muted-foreground">{r.label}</dt>
                <dd className="text-foreground">{step.state[r.key]}</dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
      </div>
      <RotationAttemptPanel onInteract={onInteract} />
      <div className="glass-panel p-3 bg-muted/30 text-xs text-muted-foreground space-y-1">
        <p>
          <strong className="text-foreground">Measured, N = 2¹⁶:</strong> the rotation key is{' '}
          {ROTATION_MEASURED.keyBytes.toLocaleString('en-US')} B (
          {ROTATION_MEASURED.streamedBytes.toLocaleString('en-US')} B streamed in{' '}
          {ROTATION_MEASURED.streamCalls} calls), not the{' '}
          {Math.round(ROTATION_MEASURED.bootstrappingLevelKeyBytes / 1e6)} MB of a
          bootstrapping-level key, because stored ciphertexts sit at the lower levels. One switch
          took {ROTATION_MEASURED.top.switchMs} ms at the top level and{' '}
          {ROTATION_MEASURED.bottom.switchMs} ms at level 0 on the Mac; precision went{' '}
          {ROTATION_MEASURED.top.before} → {ROTATION_MEASURED.top.after} bits and{' '}
          {ROTATION_MEASURED.bottom.before} → {ROTATION_MEASURED.bottom.after} bits.
        </p>
        <p>
          <strong className="text-foreground">Not established:</strong> whether a holder of the old
          secret can read a switched ciphertext without the original. One possible fix, adding a
          fresh encryption of zero after switching, is reasoning, not a sourced result, and is not
          built.
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Shared (2-of-2) decryption                                         */
/* ------------------------------------------------------------------ */

/** Toggle "approvals independent" and "flooding"; the measured outcome is shown. */
export const SharedSwitchesPanel: React.FC<{ onInteract?: () => void }> = ({ onInteract }) => {
  const [independent, setIndependent] = useState(true)
  const [flooding, setFlooding] = useState(false)
  const out = sharedOutcome(independent, flooding)
  return (
    <div className="glass-panel p-3 space-y-3" data-testid="shared-switches">
      <p className="text-sm font-semibold text-foreground">What does sharing fix, and what not?</p>
      <p className="text-xs text-muted-foreground">Approvals for the two tokens</p>
      <Toggle
        group="Approvals for the two tokens"
        options={[
          { id: 'independent', label: 'Independent (two approvers)' },
          { id: 'same', label: 'Not independent (one approver for both)' },
        ]}
        value={independent ? 'independent' : 'same'}
        onChange={(id) => {
          setIndependent(id === 'independent')
          onInteract?.()
        }}
      />
      <p className="text-xs text-muted-foreground">Flooding of the partial decryptions</p>
      <Toggle
        group="Flooding of the partial decryptions"
        options={[
          { id: 'off', label: 'Off' },
          { id: 'on', label: 'On (sized for 30-bit statistical security)' },
        ]}
        value={flooding ? 'on' : 'off'}
        onChange={(id) => {
          setFlooding(id === 'on')
          onInteract?.()
        }}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3" role="status" aria-live="polite">
        <div className="rounded-md border border-border bg-background/60 p-3 text-xs space-y-1">
          <p className="text-sm font-semibold">
            <span
              className={out.requester.tone === 'ok' ? 'text-status-success' : 'text-status-error'}
            >
              {out.requester.tone === 'ok'
                ? 'Compromised requester: stopped'
                : 'Compromised requester: not stopped'}
            </span>
          </p>
          <p className="text-muted-foreground" data-testid="shared-requester">
            {out.requester.text}
          </p>
        </div>
        <div className="rounded-md border border-border bg-background/60 p-3 text-xs space-y-1">
          <p className="text-sm font-semibold">
            <span className="text-status-warning">Result for its reader: </span>
            <span className="font-mono text-foreground" data-testid="shared-bits">
              {out.result.bits} bits
            </span>
          </p>
          <p className="text-muted-foreground" data-testid="shared-result">
            {out.result.text}
          </p>
        </div>
      </div>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
        {out.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  )
}

export const SharedDecryptView: React.FC<{ onInteract: () => void }> = ({ onInteract }) => {
  const [index, setIndex] = useState(0)
  const step = SHARED_STEPS[index] // eslint-disable-line security/detect-object-injection
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        <strong className="text-foreground">What you&apos;ll see: </strong>
        Two boards each hold a share of the CKKS secret, so decrypting needs both. Step through what
        each sends and costs, then switch the approvals and the flooding to see what sharing fixes
        and what it does not. A Lattigo prototype with both parties in one process on a Mac, at the
        real parameters, not a token or board run (
        <EvidenceCite of={SHARED_MEASURED.evidence}>threshold study</EvidenceCite>).
      </p>
      <Stepper
        label="Shared decryption"
        steps={SHARED_STEPS}
        index={index}
        onChange={(i) => {
          setIndex(i)
          onInteract()
        }}
      />
      <div className="glass-panel p-3 space-y-3" data-testid="shared-step">
        <SharedIllustration viz={step.viz} />
        <p className="text-xs font-mono text-muted-foreground">{step.actor}</p>
        <h4 className="text-sm font-bold text-foreground">{step.title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
        {step.numbers && (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {step.numbers.map((n) => (
              <div key={n.label} className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">{n.label}:</dt>
                <dd className="font-mono text-foreground">{n.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <SharedSwitchesPanel onInteract={onInteract} />
    </div>
  )
}
