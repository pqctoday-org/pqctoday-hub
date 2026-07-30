// SPDX-License-Identifier: GPL-3.0-only
/**
 * Federal Mandate Explorer.
 *
 * Answers the question that actually decides a programme's deadline: is this
 * system a National Security System or not? The two answers lead to different
 * instruments, different obligations, and — critically — only one of them
 * carries dated algorithm requirements.
 */
import { useMemo, useState } from 'react'
import { Landmark, ExternalLink, CalendarClock } from 'lucide-react'
import { Link } from 'react-router'
import { FEDERAL_MANDATES } from '../data/mandateData'
import { CNSA_MILESTONES } from '../data/cnsaData'
import { Button } from '@/components/ui/button'

type SystemKind = 'nss' | 'civilian' | 'contractor'

const KINDS: { id: SystemKind; label: string; blurb: string }[] = [
  {
    id: 'nss',
    label: 'National Security System',
    blurb:
      'Follows CNSSP 15 and the CNSA 2.0 dates. This is the only category with dated algorithm requirements.',
  },
  {
    id: 'civilian',
    label: 'Federal civilian system',
    blurb:
      'Follows the QCCPA and the OMB memoranda: inventory and annual reporting of quantum-vulnerable systems, but no algorithm-level deadline of the CNSA kind.',
  },
  {
    id: 'contractor',
    label: 'Nonfederal system handling CUI',
    blurb:
      'Reached by NIST SP 800-171 Rev. 3 (and CMMC where it applies) even with no National Security System involvement at all.',
  },
]

const RELEVANT: Record<SystemKind, string[]> = {
  nss: ['cnssp-15'],
  civilian: ['qccpa', 'omb-m-23-02', 'omb-m-26-15', 'eo-14306'],
  contractor: ['sp-800-171r3'],
}

export const MandateExplorer = () => {
  const [kind, setKind] = useState<SystemKind>('nss')
  const chosen = KINDS.find((k) => k.id === kind) ?? KINDS[0]
  const mandates = useMemo(
    () => FEDERAL_MANDATES.filter((m) => RELEVANT[kind].includes(m.id)),
    [kind]
  )

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Landmark size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">Federal Mandate Explorer</h3>
            <p className="text-sm text-muted-foreground">
              Which instruments bind a system, and whether it has a dated deadline at all.
            </p>
          </div>
        </div>

        <fieldset className="border-0 p-0 m-0">
          <legend className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
            System type
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <Button
                key={k.id}
                type="button"
                variant={kind === k.id ? 'gradient' : 'outline'}
                onClick={() => setKind(k.id)}
                className="px-3 py-1 text-xs"
                aria-pressed={kind === k.id}
              >
                {k.label}
              </Button>
            ))}
          </div>
        </fieldset>

        <p className="text-sm text-muted-foreground">{chosen.blurb}</p>
      </section>

      <section className="space-y-3">
        {mandates.map((m) => (
          <div key={m.id} className="glass-panel p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="font-semibold">{m.label}</h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {m.instrument}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Applies to: {m.appliesTo}</p>
            <p className="mt-2 text-sm text-muted-foreground">{m.obligation}</p>
            <Link
              to={`/library?ref=${encodeURIComponent(m.libraryRef)}`}
              className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink size={12} /> Open the source document
            </Link>
          </div>
        ))}
      </section>

      {kind === 'nss' ? (
        <section className="glass-panel p-6">
          <h4 className="font-semibold inline-flex items-center gap-2">
            <CalendarClock size={16} className="text-primary" /> Your dated milestones
          </h4>
          <ol className="mt-3 space-y-2">
            {CNSA_MILESTONES.map((m) => (
              <li key={m.date} className="text-sm">
                <strong className="text-primary">{m.date}</strong>{' '}
                <span className="text-muted-foreground">{m.requirement}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <section className="glass-panel p-6">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">No dated algorithm mandate applies here.</strong>{' '}
            The obligation is inventory, reporting and migration planning. Programmes in this
            category often adopt the CNSA 2.0 dates voluntarily as a planning anchor — which is
            reasonable, as long as it is not described to auditors as a requirement.
          </p>
        </section>
      )}
    </div>
  )
}
