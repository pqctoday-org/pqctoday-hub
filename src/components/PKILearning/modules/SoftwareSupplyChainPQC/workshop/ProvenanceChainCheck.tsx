// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Provenance Chain Check.
 *
 * Follow one artifact from build to verification. At the signature stage, pick an algorithm
 * and see which documents in the status map say something about it, ecosystem by ecosystem;
 * at the verification stage, mark the checks your verifier performs against the three the SLSA
 * page lists. Every line is a sourced sentence; the step adds no rating and no timeline.
 */
import { useState } from 'react'
import { FileSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClaimLine, ReadingNote } from '../components/ClaimLine'
import { ENCODINGS, SIGNATURE_CHOICES, STAGES, VERIFICATION_CHECKS } from '../data/provenanceData'

export const ProvenanceChainCheck = () => {
  const [choiceId, setChoiceId] = useState(SIGNATURE_CHOICES[1].id)
  const [done, setDone] = useState<Record<string, boolean>>({})
  const choice = SIGNATURE_CHOICES.find((c) => c.id === choiceId) ?? SIGNATURE_CHOICES[0]
  const performed = VERIFICATION_CHECKS.filter((c) => done[c.id])
  const missing = VERIFICATION_CHECKS.filter((c) => !done[c.id])

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileSearch size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">Provenance Chain Check</h3>
            <p className="text-sm text-muted-foreground">
              Follow one artifact from build to verification and see what the documents say at the
              signature and at the check.
            </p>
          </div>
        </div>
      </section>

      {STAGES.map((s) => (
        <section key={s.id} className="glass-panel p-6 space-y-3">
          <h4 className="font-semibold text-foreground">{s.title}</h4>

          {s.claims.map((c) => (
            <ClaimLine key={c} id={c} />
          ))}

          {s.id === 'signature' ? (
            <div className="space-y-3" aria-live="polite">
              <p className="text-sm text-muted-foreground">
                The statements above show that these pages name no algorithm for this signature.
                Choose one and see what each ecosystem&rsquo;s document says about it.
              </p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Signature algorithm">
                {SIGNATURE_CHOICES.map((c) => (
                  <Button
                    key={c.id}
                    type="button"
                    variant={choiceId === c.id ? 'gradient' : 'outline'}
                    onClick={() => setChoiceId(c.id)}
                    className="px-3 py-1 text-xs"
                    aria-pressed={choiceId === c.id}
                  >
                    {c.label}
                  </Button>
                ))}
              </div>
              {ENCODINGS.map((e) => {
                const ids = choice.cells[e.id] ?? []
                return (
                  <div key={e.id} className="space-y-2">
                    <h5 className="text-sm font-semibold text-foreground">{e.label}</h5>
                    {ids.length > 0 ? (
                      ids.map((id) => <ClaimLine key={id} id={id} />)
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        This lesson holds no sentence about {choice.label} for this ecosystem. That
                        is not a statement that none exists.
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          ) : null}

          {s.id === 'verification' ? (
            <div className="space-y-3" aria-live="polite">
              <p className="text-sm text-muted-foreground">
                Mark the checks your verifier performs. The page lists these three steps.
              </p>
              <div className="flex flex-col gap-1.5" role="group" aria-label="Verification checks">
                {VERIFICATION_CHECKS.map((c) => (
                  <Button
                    key={c.id}
                    type="button"
                    variant={done[c.id] ? 'gradient' : 'outline'}
                    onClick={() => setDone((p) => ({ ...p, [c.id]: !p[c.id] }))}
                    className="px-3 py-1.5 text-xs justify-start text-left"
                    aria-pressed={!!done[c.id]}
                  >
                    {c.label}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-foreground">
                Your verifier performs {performed.length} of {VERIFICATION_CHECKS.length} of the
                listed checks.
                {missing.length > 0
                  ? ` Not performed: ${missing.map((m) => m.label.toLowerCase()).join('; ')}.`
                  : ''}
              </p>
            </div>
          ) : null}
        </section>
      ))}

      <section className="glass-panel p-6">
        <ReadingNote>
          <p>
            The signature stage shows which sentences exist for the algorithm you chose. It does not
            rate the algorithm or say which one to use, and a missing sentence is a gap in this
            lesson&rsquo;s reading, not a finding about the ecosystem.
          </p>
        </ReadingNote>
      </section>
    </div>
  )
}
