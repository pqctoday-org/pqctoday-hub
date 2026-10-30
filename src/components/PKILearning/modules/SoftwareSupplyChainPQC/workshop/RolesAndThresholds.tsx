// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Roles and Thresholds.
 *
 * Set how many keys each TUF role has, its threshold, and how many keys an attacker holds, or
 * choose which Uptane repository an attacker controls. The only computation is counting keys
 * against a threshold; every other line is a sourced sentence shown with its edition.
 */
import { useState } from 'react'
import { Users, ShieldAlert, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClaimLine, ReadingNote } from '../components/ClaimLine'
import {
  MAX_KEYS,
  TUF_ROLES,
  attackerCanSign,
  normaliseRole,
  uptaneOutcome,
  type UptaneAttackerControl,
} from '../data/updateFrameworkData'

type Mode = 'tuf' | 'uptane'

interface RoleSettings {
  keys: number
  threshold: number
  held: number
}

const NUMBERS = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i)

const NumberChoice = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: number
  options: number[]
  onChange: (v: number) => void
}) => (
  <div className="space-y-1">
    <p className="text-xs text-muted-foreground">{label}</p>
    <div className="flex gap-1" role="group" aria-label={label}>
      {options.map((n) => (
        <Button
          key={n}
          type="button"
          variant={value === n ? 'gradient' : 'outline'}
          onClick={() => onChange(n)}
          className="px-2.5 py-1 text-xs"
          aria-pressed={value === n}
        >
          {n}
        </Button>
      ))}
    </div>
  </div>
)

const CONTROL_OPTIONS: { id: UptaneAttackerControl; label: string }[] = [
  { id: 'none', label: 'Neither repository' },
  { id: 'director', label: 'The Director repository' },
  { id: 'image', label: 'The Image repository' },
  { id: 'both', label: 'Both repositories' },
]

export const RolesAndThresholds = () => {
  const [mode, setMode] = useState<Mode>('tuf')
  const [roles, setRoles] = useState<Record<string, RoleSettings>>(() =>
    Object.fromEntries(
      TUF_ROLES.map((r) => [r.id, { keys: r.defaultKeys, threshold: r.defaultThreshold, held: 0 }])
    )
  )
  const [control, setControl] = useState<UptaneAttackerControl>('director')
  const [fullVerification, setFullVerification] = useState(true)

  const update = (id: string, patch: Partial<RoleSettings>) =>
    setRoles((prev) => {
      // eslint-disable-next-line security/detect-object-injection
      const cur = prev[id]
      const next = { ...cur, ...patch }
      const n = normaliseRole(next.keys, next.threshold)
      return { ...prev, [id]: { ...n, held: Math.min(Math.max(0, next.held), n.keys) } }
    })

  const outcome = uptaneOutcome(control, fullVerification)
  const anyCanSign = TUF_ROLES.some((r) => attackerCanSign(roles[r.id].held, roles[r.id].threshold))

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">Roles and Thresholds</h3>
            <p className="text-sm text-muted-foreground">
              Which roles can an attacker sign for, given the keys they hold?
            </p>
          </div>
        </div>
        <div className="flex gap-1.5" role="group" aria-label="Framework">
          <Button
            type="button"
            variant={mode === 'tuf' ? 'gradient' : 'outline'}
            onClick={() => setMode('tuf')}
            className="px-3 py-1 text-xs"
            aria-pressed={mode === 'tuf'}
          >
            TUF roles
          </Button>
          <Button
            type="button"
            variant={mode === 'uptane' ? 'gradient' : 'outline'}
            onClick={() => setMode('uptane')}
            className="px-3 py-1 text-xs"
            aria-pressed={mode === 'uptane'}
          >
            Uptane repositories
          </Button>
        </div>
      </section>

      {mode === 'tuf' ? (
        <>
          {TUF_ROLES.map((r) => {
            const s = roles[r.id]
            const can = attackerCanSign(s.held, s.threshold)
            return (
              <section key={r.id} className="glass-panel p-6 space-y-3" aria-live="polite">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold text-foreground">{r.name} role</h4>
                  <span
                    className={`text-xs px-2 py-1 rounded border font-bold flex items-center gap-1 ${
                      can
                        ? 'bg-status-warning/10 text-status-warning border-status-warning/30'
                        : 'bg-status-success/10 text-status-success border-status-success/30'
                    }`}
                  >
                    {can ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                    {can
                      ? `Attacker holds ${s.held} of ${s.keys} keys: at or above the threshold of ${s.threshold}, so can sign for this role alone`
                      : `Attacker holds ${s.held} of ${s.keys} keys: below the threshold of ${s.threshold}, so cannot sign for this role alone`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-6">
                  <NumberChoice
                    label="Keys the role has"
                    value={s.keys}
                    options={NUMBERS(1, MAX_KEYS)}
                    onChange={(v) => update(r.id, { keys: v })}
                  />
                  <NumberChoice
                    label="Threshold of signatures"
                    value={s.threshold}
                    options={NUMBERS(1, s.keys)}
                    onChange={(v) => update(r.id, { threshold: v })}
                  />
                  <NumberChoice
                    label="Keys the attacker holds"
                    value={s.held}
                    options={NUMBERS(0, s.keys)}
                    onChange={(v) => update(r.id, { held: v })}
                  />
                </div>
                {can ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      What a signature by this role is, in the specification&rsquo;s words:
                    </p>
                    {r.claims.map((c) => (
                      <ClaimLine key={c} id={c} />
                    ))}
                    {r.id === 'root' ? <ClaimLine id="SC-3.9" /> : null}
                  </div>
                ) : null}
              </section>
            )
          })}
          <section className="glass-panel p-6 space-y-3">
            {!anyCanSign ? <ClaimLine id="SC-3.8" /> : null}
            <ReadingNote>
              <p>
                The yes or no above is counting: the keys held compared with the threshold. It does
                not say what an attacker could do with a role&rsquo;s signature beyond the sentences
                shown, and it does not model key theft, expiry or delegation.
              </p>
            </ReadingNote>
          </section>
        </>
      ) : (
        <>
          <section className="glass-panel p-6 space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">The attacker controls</p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Attacker control">
                {CONTROL_OPTIONS.map((o) => (
                  <Button
                    key={o.id}
                    type="button"
                    variant={control === o.id ? 'gradient' : 'outline'}
                    onClick={() => setControl(o.id)}
                    className="px-3 py-1 text-xs"
                    aria-pressed={control === o.id}
                  >
                    {o.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">The ECU</p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="ECU verification">
                <Button
                  type="button"
                  variant={fullVerification ? 'gradient' : 'outline'}
                  onClick={() => setFullVerification(true)}
                  className="px-3 py-1 text-xs"
                  aria-pressed={fullVerification}
                >
                  Performs full verification
                </Button>
                <Button
                  type="button"
                  variant={!fullVerification ? 'gradient' : 'outline'}
                  onClick={() => setFullVerification(false)}
                  className="px-3 py-1 text-xs"
                  aria-pressed={!fullVerification}
                >
                  Does not
                </Button>
              </div>
            </div>
          </section>

          <section className="glass-panel p-6 space-y-3" aria-live="polite">
            <p className="font-semibold text-foreground">
              {outcome.insideAssumption
                ? 'This is inside the attacker the standard assumes.'
                : 'This is outside the attacker the standard assumes.'}
            </p>
            <p className="text-sm text-muted-foreground">
              {control === 'none'
                ? 'The attacker controls neither repository. The sentence below describes the two repositories.'
                : control === 'both'
                  ? 'The attacker controls the Director and the Image repository. The standard states its assumption about the attacker in the sentence below.'
                  : fullVerification
                    ? 'The attacker controls one repository. The sentences below describe the comparison that full verification performs.'
                    : 'The attacker controls one repository and this ECU does not perform full verification, so the comparison described below is not made on this ECU. The standard says Primary ECUs shall perform it and Secondary ECUs should.'}
            </p>
            {outcome.claims.map((c) => (
              <ClaimLine key={c} id={c} />
            ))}
            <ReadingNote>
              <p>
                This step states which sentences apply to the combination you chose. It does not
                predict what an attacker would achieve, and it does not model a compromised ECU.
              </p>
            </ReadingNote>
          </section>
        </>
      )}
    </div>
  )
}
