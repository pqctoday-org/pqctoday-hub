// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Key Ladder Explorer.
 *
 * Pick a scheme and walk its key ladder rung by rung. For each rung the tool shows the
 * primitive the specification names, where the specification says so, and, for the public-key
 * rungs, which NIST IR 8547 table lists that kind of primitive. No score and no estimate:
 * everything shown is a statement of a specification or of the NIST table.
 */
import { useMemo, useState } from 'react'
import { KeyRound, Lock, FileSignature } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AACS_DATE,
  AACS_EDITION,
  CI_PLUS_DATE,
  CI_PLUS_EDITION,
  NIST_TRANSITION,
  RUNGS_BY_SCHEME,
  type LadderRung,
} from '../data/ladderData'

const SCHEMES: { id: LadderRung['scheme']; label: string; edition: string }[] = [
  { id: 'AACS', label: 'AACS', edition: `${AACS_EDITION} (${AACS_DATE})` },
  { id: 'CI Plus', label: 'CI Plus', edition: `${CI_PLUS_EDITION} (${CI_PLUS_DATE})` },
]

const KIND_LABEL: Record<LadderRung['kind'], string> = {
  symmetric: 'symmetric',
  'public-key': 'public-key',
  hash: 'hash',
}

export const KeyLadderExplorer = () => {
  const [scheme, setScheme] = useState<LadderRung['scheme']>('AACS')
  const rungs = useMemo(() => RUNGS_BY_SCHEME(scheme), [scheme])
  const [selectedId, setSelectedId] = useState<string>(rungs[0].id)
  const selected = rungs.find((r) => r.id === selectedId) ?? rungs[0]
  const publicKeyCount = rungs.filter((r) => r.kind === 'public-key').length
  const edition = SCHEMES.find((s) => s.id === scheme)?.edition ?? ''

  const pick = (id: LadderRung['scheme']) => {
    setScheme(id)
    setSelectedId(RUNGS_BY_SCHEME(id)[0].id)
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <KeyRound size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">Key Ladder Explorer</h3>
            <p className="text-sm text-muted-foreground">
              Which primitive does each rung of the ladder use, and where does a public-key
              primitive sit?
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Scheme">
          {SCHEMES.map((s) => (
            <Button
              key={s.id}
              type="button"
              variant={scheme === s.id ? 'gradient' : 'outline'}
              onClick={() => pick(s.id)}
              className="px-3 py-1 text-xs"
              aria-pressed={scheme === s.id}
            >
              {s.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Edition read: {edition}.</p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-2xl font-bold text-foreground">{rungs.length}</p>
            <p className="text-sm text-muted-foreground">rungs in this ladder</p>
          </div>
          <div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/30">
            <p className="text-2xl font-bold text-status-warning">{publicKeyCount}</p>
            <p className="text-sm text-muted-foreground">
              rungs that use a public-key primitive of a kind NIST IR 8547 lists
            </p>
          </div>
        </div>
      </section>

      <section className="glass-panel p-6 space-y-4">
        <ol className="space-y-2">
          {rungs.map((r) => (
            <li key={r.id}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSelectedId(r.id)}
                aria-pressed={selected.id === r.id}
                className={`w-full h-auto justify-start text-left p-3 rounded-lg border flex items-start gap-3 ${
                  selected.id === r.id
                    ? 'bg-primary/10 border-primary/40'
                    : 'bg-muted/30 border-border hover:bg-muted/50'
                }`}
              >
                <span className="mt-0.5 text-muted-foreground">
                  {r.kind === 'public-key' ? <FileSignature size={16} /> : <Lock size={16} />}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    {r.order}. {r.name}
                  </span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {r.primitive} · {KIND_LABEL[r.kind]}
                  </span>
                </span>
              </Button>
            </li>
          ))}
        </ol>
      </section>

      <section className="glass-panel p-6 space-y-3" aria-live="polite">
        <h4 className="font-semibold">{selected.name}</h4>
        <p className="text-sm text-muted-foreground">{selected.what}</p>
        <dl className="grid gap-3 sm:grid-cols-3 text-sm">
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Primitive</dt>
            <dd className="mt-1 text-foreground">{selected.primitive}</dd>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Where the specification says it
            </dt>
            <dd className="mt-1 text-foreground">{selected.where}</dd>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border border-border">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              NIST IR 8547 table
            </dt>
            <dd className="mt-1 text-foreground">
              {selected.nistTable ??
                'Not a signature or key-establishment scheme; not in Table 2 or Table 4'}
            </dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          {NIST_TRANSITION.document} ({NIST_TRANSITION.date}): {NIST_TRANSITION.summary}{' '}
          {NIST_TRANSITION.scope} The pairing in the last box is this lesson’s, not the
          specification’s: neither edition mentions quantum computing.
        </p>
      </section>
    </div>
  )
}
