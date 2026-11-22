// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection -- keys are the fixed column ids of this table */
/**
 * Step 3: Size comparator.
 *
 * A table of key and signature or ciphertext sizes read from the algorithm registry. The
 * ML-KEM and ML-DSA rows sit next to the Library sentence that states them. No timing
 * figures are shown.
 */
import { useState } from 'react'
import { Ruler } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClaimLine } from '../components/ClaimLine'
import { SIZE_COLUMNS, sizeRows, type SizeColumn } from '../data/workshopData'

const ROWS = sizeRows()
const fmt = (n: number) => n.toLocaleString('en-US')

export const SizeComparator = () => {
  const [column, setColumn] = useState<SizeColumn>('signatureOrCiphertextBytes')
  const max = Math.max(...ROWS.map((r) => r[column]))

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Ruler size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">Size comparator</h3>
            <p className="text-sm text-muted-foreground">
              Compare sizes in bytes across the parameter sets and two classical entries. Values
              come from the Hub&rsquo;s algorithm registry.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Key, signature and ciphertext sizes in bytes</caption>
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th scope="col" className="py-2 pr-3">
                  Algorithm
                </th>
                {SIZE_COLUMNS.map((c) => (
                  <th key={c.id} scope="col" className="py-2 pr-3 text-right">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.name} className="border-b border-border/50" data-row={r.name}>
                  <th scope="row" className="py-2 pr-3 text-left font-medium text-foreground">
                    {r.name}
                  </th>
                  {SIZE_COLUMNS.map((c) => (
                    <td
                      key={c.id}
                      className="py-2 pr-3 text-right tabular-nums text-foreground"
                      data-column={c.id}
                    >
                      {fmt(r[c.id])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Show bars for</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Bar column">
            {SIZE_COLUMNS.map((c) => (
              <Button
                key={c.id}
                type="button"
                variant={column === c.id ? 'gradient' : 'outline'}
                onClick={() => setColumn(c.id)}
                className="text-xs"
              >
                {c.label}
              </Button>
            ))}
          </div>
        </div>

        <ul className="space-y-1.5" aria-label="Size bars">
          {ROWS.map((r) => (
            <li key={r.name} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-28 shrink-0">{r.name}</span>
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${(r[column] / max) * 100}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-foreground w-14 text-right">
                {fmt(r[column])}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass-panel p-6 space-y-3">
        <h3 className="text-lg font-bold text-gradient">Where the sizes are stated</h3>
        <p className="text-sm text-muted-foreground">
          Compare the ML-KEM and ML-DSA rows with these sentences.
        </p>
        {ROWS.filter((r) => r.claim).map((r) => (
          <ClaimLine key={r.name} id={r.claim!} />
        ))}
      </section>
    </div>
  )
}
