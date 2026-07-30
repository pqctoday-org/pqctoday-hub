// SPDX-License-Identifier: GPL-3.0-only
/**
 * Sector Regulation Timeline.
 *
 * The financial sector's PQC guidance is published by a dozen bodies across as
 * many jurisdictions, and which ones bind you depends entirely on where you are
 * regulated. This filters the set down to the ones that actually apply, and
 * links each to its cached document in the Library.
 */
import { useMemo, useState } from 'react'
import { Scale, ExternalLink } from 'lucide-react'
import { Link } from 'react-router'
import { SECTOR_BODIES, EPC_CITED_EMERGING } from '../data/bankingData'
import { FilterDropdown } from '@/components/common/FilterDropdown'

const JURISDICTIONS = [
  { id: 'all', label: 'All jurisdictions' },
  ...Array.from(new Set(SECTOR_BODIES.map((b) => b.jurisdiction))).map((j) => ({
    id: j,
    label: j,
  })),
]

export const SectorRegulationTimeline = () => {
  const [jurisdiction, setJurisdiction] = useState('all')

  const shown = useMemo(
    () =>
      jurisdiction === 'all'
        ? SECTOR_BODIES
        : SECTOR_BODIES.filter((b) => b.jurisdiction === jurisdiction),
    [jurisdiction]
  )

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Scale size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gradient">Sector Regulation Timeline</h3>
            <p className="text-sm text-muted-foreground">
              Who publishes financial-sector PQC direction, and which of it binds you.
            </p>
          </div>
        </div>
        <div className="max-w-xs">
          <FilterDropdown
            label="Jurisdiction"
            selectedId={jurisdiction}
            onSelect={setJurisdiction}
            items={JURISDICTIONS}
          />
        </div>
      </section>

      <ol className="space-y-3">
        {shown.map((b) => (
          <li key={b.id} className="glass-panel p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="font-semibold">{b.label}</h4>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {b.jurisdiction}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{b.contribution}</p>
            <Link
              to={`/library?ref=${encodeURIComponent(b.libraryRef)}`}
              className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink size={12} /> Open the source document
            </Link>
          </li>
        ))}
      </ol>

      <section className="glass-panel p-6">
        <h4 className="font-semibold">Published since, not yet in this catalogue</h4>
        <p className="mt-1 text-sm text-muted-foreground">
          EPC 342-08 v16.0.1 (June 2026) points at these. They are named here rather than
          summarised, because this module cites nothing it has not read.
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
          {EPC_CITED_EMERGING.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
