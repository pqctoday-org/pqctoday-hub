// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { Building2, Compass } from 'lucide-react'
import type { Leader } from '@/data/leadersData'
import { LEADER_CATEGORIES } from './LeaderCategorySidebar'

// Why each contributor category matters to a risk/governance decision-maker —
// turns a who's-who directory into market-and-mandate intelligence.
const CATEGORY_WHY: Record<string, string> = {
  Government: 'Regulators and agencies that set the mandates and deadlines you must meet.',
  Standards: 'Authors of the FIPS / ISO standards your systems will be audited against.',
  'Industry Vendor': 'Suppliers whose PQC readiness shapes your procurement options.',
  'Industry Adopter': 'Enterprises already migrating — real-world patterns to benchmark against.',
  'Algorithm Inventor': 'Designed the algorithms (ML-KEM, ML-DSA) now entering your stack.',
}

/**
 * Executive-only overview above the Community directory: institutional influence
 * (which organizations contribute most) and a plain legend of why each category
 * matters to a governance reader. Rendered only for the executive persona (caller
 * gates it), so every other role sees the directory exactly as before.
 */
export function LeadersExecutivePanel({ leaders }: { leaders: Leader[] }) {
  const topOrgs = useMemo(() => {
    const counts = new Map<string, number>()
    for (const l of leaders) {
      for (const o of l.organizations) {
        const name = o.trim()
        if (name) counts.set(name, (counts.get(name) ?? 0) + 1)
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [leaders])

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const l of leaders) counts.set(l.category, (counts.get(l.category) ?? 0) + 1)
    return counts
  }, [leaders])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={16} className="text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">Institutional influence</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Organizations with the most contributors here — a quick read on who is driving the
          standards, mandates, and products.
        </p>
        <ol className="space-y-1.5">
          {topOrgs.map(([org, count], i) => (
            <li key={org} className="flex items-center gap-2 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-foreground">{org}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{count}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Compass size={16} className="text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">Why each group matters to you</h2>
        </div>
        <ul className="space-y-2">
          {LEADER_CATEGORIES.map((cat) => (
            <li key={cat} className="text-sm">
              <span className="font-medium text-foreground">{cat}</span>
              <span className="text-muted-foreground"> ({categoryCounts.get(cat) ?? 0})</span>
              <span className="text-muted-foreground">
                {' '}
                — {/* eslint-disable-next-line security/detect-object-injection -- cat is a LEADER_CATEGORIES member */}
                {CATEGORY_WHY[cat]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
