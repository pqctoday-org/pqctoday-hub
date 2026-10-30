// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Provenance Algorithm Check.
 *
 * Pick a signature algorithm and see whether C2PA 2.4 allows it for generating new claim
 * signatures. Every verdict follows from the specification’s allowed list; the tool adds no
 * rating and no timeline.
 */
import { useState } from 'react'
import { BadgeCheck, BadgeX, Stamp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { C2PA_EDITION, C2PA_FACTS, CANDIDATES, COSE_PQ_DOCUMENTS } from '../data/provenanceData'

export const ProvenanceAlgorithmCheck = () => {
  const [selectedId, setSelectedId] = useState(CANDIDATES[0].id)
  const c = CANDIDATES.find((x) => x.id === selectedId) ?? CANDIDATES[0]

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Stamp size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">Provenance Algorithm Check</h3>
            <p className="text-sm text-muted-foreground">
              Is this algorithm allowed for new claim signatures in {C2PA_EDITION}?
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Candidate algorithm">
          {CANDIDATES.map((x) => (
            <Button
              key={x.id}
              type="button"
              variant={selectedId === x.id ? 'gradient' : 'outline'}
              onClick={() => setSelectedId(x.id)}
              className="px-3 py-1 text-xs"
              aria-pressed={selectedId === x.id}
            >
              {x.label}
            </Button>
          ))}
        </div>
      </section>

      <section className="glass-panel p-6 space-y-3" aria-live="polite">
        <div
          className={`p-4 rounded-lg border flex items-start gap-3 ${
            c.onC2paList
              ? 'bg-status-success/10 border-status-success/30'
              : 'bg-status-warning/10 border-status-warning/30'
          }`}
        >
          {c.onC2paList ? (
            <BadgeCheck size={20} className="text-status-success shrink-0" />
          ) : (
            <BadgeX size={20} className="text-status-warning shrink-0" />
          )}
          <div>
            <p className="font-semibold text-foreground">
              {c.label}: {c.onC2paList ? 'on the allowed list' : 'not on the allowed list'}
            </p>
            <p className="text-sm text-muted-foreground">{c.detail}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{C2PA_FACTS.deprecatedList}</p>
      </section>

      <section className="glass-panel p-6 space-y-3">
        <h4 className="font-semibold">What a post-quantum signature would also touch</h4>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>{C2PA_FACTS.cose}</li>
          <li>{COSE_PQ_DOCUMENTS.mlDsa}</li>
          <li>{COSE_PQ_DOCUMENTS.slhDsa}</li>
          <li>{C2PA_FACTS.trust}</li>
          <li>{C2PA_FACTS.revocation}</li>
          <li>{C2PA_FACTS.timestamp}</li>
        </ul>
        <p className="text-xs text-muted-foreground">
          The signature algorithm is one piece of the trust chain. This tool states the pieces the
          specification names and gives no timeline for changing any of them.
        </p>
      </section>
    </div>
  )
}
