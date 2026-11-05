// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { FileCheck2, Lock, LockOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'

/**
 * Closure & Handover Register — a local educational draft. Every standing capability
 * is represented by a sample owner/date entry and self-selected acknowledgments.
 * Completion checks presence only; it does not verify transfer or acceptance.
 */

const OWNERS = [
  'Crypto Gov Owner',
  'Supplier Risk',
  'SOC Manager',
  'Risk / GRC',
  'Architecture',
  'SteerCo',
]

interface Capability {
  id: string
  label: string
}
const CAPABILITIES: Capability[] = [
  { id: 'cbom', label: 'CBOM + continuous discovery' },
  { id: 'vendor', label: 'Vendor governance cadence' },
  { id: 'soc', label: 'SOC detection content (crypto drift)' },
  { id: 'kri', label: 'KRI / board reporting' },
  { id: 'agility', label: 'Crypto-agility OKRs' },
]

const CRITERIA = [
  { id: 'maturity', label: 'Maturity ≥ Level 4 across domains' },
  { id: 'tier1', label: 'Tier-1 systems 100% verified' },
  { id: 'tier2', label: 'Tier-2 sample verified, failures cleared' },
  { id: 'residual', label: 'Residual risk accepted by SteerCo (owner + re-eval date)' },
]

export function ClosureHandoverRegister() {
  const [owner, setOwner] = useState<Record<string, string>>({})
  const [date, setDate] = useState<Record<string, string>>({})
  const [crit, setCrit] = useState<Set<string>>(new Set())

  const allOwned = CAPABILITIES.every((c) => owner[c.id] && date[c.id])
  const allCrit = CRITERIA.every((c) => crit.has(c.id))
  const ready = allOwned && allCrit

  const ownedCount = CAPABILITIES.filter((c) => owner[c.id] && date[c.id]).length

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <h3 className="mb-1 font-semibold text-foreground">
          Sample closure &amp; BAU handover checklist
        </h3>
        <p className="text-sm text-muted-foreground">
          Use fictional owners, dates and acknowledgments to explore a closure discussion. This
          local draft records your entries; it does not evaluate evidence, approve closure or
          archive a dossier. Production tools must retain the actual supporting records and ongoing
          ownership.
        </p>
      </div>

      <div className="glass-panel p-4">
        <h4 className="mb-2 text-sm font-semibold text-foreground">
          Handover register ({ownedCount}/{CAPABILITIES.length} assigned)
        </h4>
        <div className="space-y-2">
          {CAPABILITIES.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-foreground">{c.label}</span>
              <span className="flex items-center gap-1.5">
                <FilterDropdown
                  items={OWNERS}
                  selectedId={owner[c.id] ?? ''}
                  onSelect={(id) => setOwner((p) => ({ ...p, [c.id]: id === 'All' ? '' : id }))}
                  defaultLabel="owner…"
                  defaultIcon={null}
                  ariaLabel={`Owner for ${c.label}`}
                  noContainer
                  size="sm"
                />
                <input
                  type="date"
                  aria-label={`Handover date for ${c.label}`}
                  value={date[c.id] ?? ''}
                  onChange={(e) => setDate((p) => ({ ...p, [c.id]: e.target.value }))}
                  className="rounded border border-border bg-transparent px-1.5 py-1 text-xs text-foreground"
                />
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-4">
        <h4 className="mb-2 text-sm font-semibold text-foreground">Closure criteria</h4>
        <div className="space-y-1.5">
          {CRITERIA.map((c) => (
            <Button
              key={c.id}
              variant="ghost"
              onClick={() =>
                setCrit((prev) => {
                  const next = new Set(prev)
                  if (next.has(c.id)) next.delete(c.id)
                  else next.add(c.id)
                  return next
                })
              }
              className={`h-auto w-full justify-start whitespace-normal border p-2 text-left text-sm ${
                crit.has(c.id)
                  ? 'border-status-success/40 bg-status-success/5 text-status-success'
                  : 'border-border text-foreground'
              }`}
            >
              {crit.has(c.id) ? '☑' : '☐'} <span className="ml-1">{c.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <div
        className={`glass-panel border p-4 ${ready ? 'border-status-success/40' : 'border-status-warning/30'}`}
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          {ready ? (
            <>
              <Lock size={16} className="text-status-success" />
              <span className="text-status-success">
                Sample checklist entries complete — closure not assessed
              </span>
            </>
          ) : (
            <>
              <LockOpen size={16} className="text-status-warning" />
              <span className="text-status-warning">Sample checklist entries incomplete</span>
            </>
          )}
        </div>
        {ready ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <FileCheck2 size={12} /> Local sample entries complete. No closure record or evidence
            dossier has been generated or archived.
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            Outstanding:{' '}
            {!allOwned && `${CAPABILITIES.length - ownedCount} capability(ies) unassigned`}
            {!allOwned && !allCrit && '; '}
            {!allCrit && `${CRITERIA.length - crit.size} acknowledgment(s) unselected`}.
          </p>
        )}
      </div>
    </div>
  )
}
