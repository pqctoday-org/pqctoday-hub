// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Shared author
/**
 * Optional workshop step `change-analyzer` (plan r1 Workshop 4): pick a change
 * to the Orrin N7, predict the kind of review it needs, then compare with the
 * likely affected evidence and candidate routes in each scheme. It classifies
 * likely affected evidence; it never makes a certification determination.
 */
import { useState, type FC } from 'react'
import { CheckCircle2, HelpCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CertWorkshopStepProps } from '../data/types'
import { ANCHOR_SCENARIO } from '../data/anchorScenario'
import { CHANGE_CASES, CHANGE_KINDS, type ChangeKind } from '../data/sharedData'
import { Callout, FictionalBadge } from '../components/sections/CoreSections'

export const ChangeAnalyzer: FC<CertWorkshopStepProps> = ({ config }) => {
  const cfgChange = config?.change
  const initial = CHANGE_CASES.find((c) => c.id === cfgChange)?.id ?? CHANGE_CASES[0]?.id ?? ''
  const [changeId, setChangeId] = useState(initial)
  const [guesses, setGuesses] = useState<Record<string, ChangeKind>>({})
  const change = CHANGE_CASES.find((c) => c.id === changeId)
  if (!change) return null
  const guess = guesses[change.id]
  const right = guess !== undefined && change.likely.includes(guess)

  return (
    <div className="space-y-6">
      <div className="glass-panel space-y-2 p-5">
        <h3 className="text-lg font-semibold text-foreground">PQC change analyzer</h3>
        <p className="text-sm text-muted-foreground">
          Eleven changes to the {ANCHOR_SCENARIO.name}
          <FictionalBadge />. For each, predict what kind of review it needs, then compare with the
          evidence each scheme would look at.
        </p>
        <Callout tone="warning">
          <p>
            This is not a certification determination. It classifies likely affected evidence and
            the questions to ask; the lab proposes a route and the authority decides.
          </p>
        </Callout>
      </div>

      <section className="glass-panel space-y-3 p-5" aria-label="Changes">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a change">
          {CHANGE_CASES.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={c.id === changeId ? 'gradient' : 'outline'}
              aria-pressed={c.id === changeId}
              onClick={() => setChangeId(c.id)}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </section>

      <section className="glass-panel space-y-4 p-5" aria-labelledby="change-title">
        <h4 id="change-title" className="font-semibold text-foreground">
          {change.label}
        </h4>
        <p className="text-sm text-foreground/85">{change.detail}</p>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground">Your prediction</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Your prediction">
            {CHANGE_KINDS.map((k) => (
              <Button
                key={k.id}
                size="sm"
                variant={guess === k.id ? 'gradient' : 'outline'}
                aria-pressed={guess === k.id}
                onClick={() => setGuesses((prev) => ({ ...prev, [change.id]: k.id }))}
              >
                {k.label}
              </Button>
            ))}
          </div>
        </div>

        {guess ? (
          <div className="space-y-4" aria-live="polite">
            <Callout
              tone={right ? 'success' : 'error'}
              title={
                right
                  ? 'Defensible'
                  : `Reconsider — likely: ${change.likely
                      .map((k) => CHANGE_KINDS.find((x) => x.id === k)?.label.toLowerCase())
                      .join(' or ')}`
              }
            >
              <p>{change.explanation}</p>
            </Callout>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr>
                    <th className="p-3 font-semibold">Scheme</th>
                    <th className="p-3 font-semibold">Evidence likely affected</th>
                    <th className="p-3 font-semibold">Candidate routes to discuss</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ['FIPS 140-3 / CMVP', change.fips],
                      ['CC / EUCC', change.ccEucc],
                      ['PCI PTS HSM', change.pci],
                    ] as const
                  ).map(([scheme, impact]) => (
                    <tr key={scheme} className="border-t border-border align-top">
                      <td className="p-3 font-semibold text-foreground">{scheme}</td>
                      <td className="p-3">{impact.affected}</td>
                      <td className="p-3">{impact.candidates}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="flex items-start gap-2 text-xs text-foreground">
              <HelpCircle size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <strong>Ask the lab / certification body:</strong> {change.ask}
              </span>
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Make a prediction to see the analysis.</p>
        )}
      </section>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {Object.keys(guesses).length === CHANGE_CASES.length ? (
          <CheckCircle2 size={14} className="text-status-success" aria-hidden="true" />
        ) : (
          <XCircle size={14} className="text-muted-foreground" aria-hidden="true" />
        )}
        {Object.keys(guesses).length} of {CHANGE_CASES.length} changes analysed ·{' '}
        {CHANGE_CASES.filter((c) => guesses[c.id] && c.likely.includes(guesses[c.id])).length}{' '}
        defensible
      </p>
    </div>
  )
}
