// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Transition Planner.
 *
 * Choose a verifier that can or cannot change, a transition option and a new algorithm. The
 * step shows raw public-key and signature sizes from the algorithm registry and the sourced
 * sentences for the choices. It gives no timeline and no recommendation.
 */
import { useState } from 'react'
import { Link } from 'react-router'
import { Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClaimLine, ReadingNote } from '../components/ClaimLine'
import {
  CURRENT_ALGORITHM,
  NEW_ALGORITHMS,
  OPTIONS,
  VERIFIERS,
  rawRows,
  rawSum,
  type OptionKind,
  type VerifierKind,
} from '../data/transitionData'

export const TransitionPlanner = () => {
  const [verifier, setVerifier] = useState<VerifierKind>('updatable')
  const [option, setOption] = useState<OptionKind>('second-block')
  const [algorithmId, setAlgorithmId] = useState(NEW_ALGORITHMS[1].registryId)

  const v = VERIFIERS.find((x) => x.id === verifier) ?? VERIFIERS[0]
  const o = OPTIONS.find((x) => x.id === option) ?? OPTIONS[0]
  const a = NEW_ALGORITHMS.find((x) => x.registryId === algorithmId) ?? NEW_ALGORITHMS[0]
  const rows = rawRows(option, algorithmId)
  const sum = rawSum(rows)

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Scale size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">Transition Planner</h3>
            <p className="text-sm text-muted-foreground">
              Which choices does a change from {CURRENT_ALGORITHM} involve, and what do the
              documents say about each?
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">The verifier on the device</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Verifier">
            {VERIFIERS.map((x) => (
              <Button
                key={x.id}
                type="button"
                variant={verifier === x.id ? 'gradient' : 'outline'}
                onClick={() => setVerifier(x.id)}
                className="px-3 py-1 text-xs"
                aria-pressed={verifier === x.id}
              >
                {x.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Transition option</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Transition option">
            {OPTIONS.map((x) => (
              <Button
                key={x.id}
                type="button"
                variant={option === x.id ? 'gradient' : 'outline'}
                onClick={() => setOption(x.id)}
                className="px-3 py-1 text-xs"
                aria-pressed={option === x.id}
              >
                {x.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">New algorithm</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="New algorithm">
            {NEW_ALGORITHMS.map((x) => (
              <Button
                key={x.registryId}
                type="button"
                variant={algorithmId === x.registryId ? 'gradient' : 'outline'}
                onClick={() => setAlgorithmId(x.registryId)}
                className="px-3 py-1 text-xs"
                aria-pressed={algorithmId === x.registryId}
              >
                {x.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-panel p-6 space-y-3" aria-live="polite">
        <h4 className="font-semibold text-foreground">Raw sizes for this choice</h4>
        <p className="text-sm text-muted-foreground">{o.summary}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-1 pr-4 font-medium">Algorithm</th>
                <th className="py-1 pr-4 font-medium">Public key (bytes)</th>
                <th className="py-1 font-medium">Signature (bytes)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-border">
                  <td className="py-1 pr-4 text-foreground">{r.label}</td>
                  <td className="py-1 pr-4">{r.publicKeyBytes.toLocaleString('en-US')}</td>
                  <td className="py-1">{r.signatureBytes.toLocaleString('en-US')}</td>
                </tr>
              ))}
              {rows.length > 1 ? (
                <tr className="border-t border-border font-medium">
                  <td className="py-1 pr-4 text-foreground">Sum of the rows above</td>
                  <td className="py-1 pr-4">{sum.publicKeyBytes.toLocaleString('en-US')}</td>
                  <td className="py-1">{sum.signatureBytes.toLocaleString('en-US')}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Raw algorithm sizes from the algorithm registry. No certificates, envelopes, timestamps or
          log proofs are counted, the composite draft&rsquo;s own encoding is not counted, and the
          step computes no total for an update.
        </p>
      </section>

      <section className="glass-panel p-6 space-y-3">
        <h4 className="font-semibold text-foreground">
          What the documents say about these choices
        </h4>
        {[...v.claims, ...o.claims, ...a.claims]
          .filter((id, i, all) => all.indexOf(id) === i)
          .map((id) => (
            <ClaimLine key={id} id={id} />
          ))}
        <ReadingNote>
          <p>
            {verifier === 'rom'
              ? 'In this lesson’s reading, a verifier that cannot change checks only the algorithms it shipped with, so a second signature or a composite signature helps only if that verifier already knows the new algorithm.'
              : 'In this lesson’s reading, an updatable verifier can be changed to accept a new algorithm; whether and when to do so is a decision this step does not make.'}{' '}
            For LMS state management, see{' '}
            <Link to="/learn/stateful-signatures" className="text-primary hover:underline">
              Stateful Signatures
            </Link>
            .
          </p>
        </ReadingNote>
      </section>
    </div>
  )
}
