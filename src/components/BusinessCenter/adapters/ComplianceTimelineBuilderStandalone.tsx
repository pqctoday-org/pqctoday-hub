// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo } from 'react'
import { Globe, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ComplianceTimelineBuilder } from '@/components/PKILearning/modules/ComplianceStrategy/components/ComplianceTimelineBuilder'
import { JURISDICTIONS } from '@/components/PKILearning/modules/ComplianceStrategy/data/jurisdictions'

/**
 * Zero-prop wrapper around {@link ComplianceTimelineBuilder} for the Command
 * Center artifact drawer and /business/tools/:id route. Provides a compact
 * jurisdiction picker because the full {@link ComplianceTimelineBuilder}
 * requires a `selectedJurisdictions` prop that the workshop normally supplies
 * from its Step 1 JurisdictionMapper.
 */
export function ComplianceTimelineBuilderStandalone() {
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([])

  const byRegion = useMemo(() => {
    const map = new Map<string, typeof JURISDICTIONS>()
    for (const j of JURISDICTIONS) {
      const list = map.get(j.region) ?? []
      list.push(j)
      map.set(j.region, list)
    }
    return Array.from(map.entries())
  }, [])

  const toggle = (id: string) => {
    setSelectedJurisdictions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Select jurisdictions</h3>
          <span className="text-xs text-muted-foreground">
            ({selectedJurisdictions.length} selected)
          </span>
          {selectedJurisdictions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setSelectedJurisdictions([])}
            >
              Clear
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {byRegion.map(([region, list]) => (
            <div key={region}>
              <div className="text-xs font-medium text-muted-foreground mb-1.5">{region}</div>
              <div className="flex flex-wrap gap-1.5">
                {list.map((j) => {
                  const active = selectedJurisdictions.includes(j.id)
                  return (
                    <Button
                      key={j.id}
                      variant={active ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => toggle(j.id)}
                      className="h-7 px-2.5 text-xs"
                    >
                      {active && <Check size={12} className="mr-1" />}
                      {j.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ComplianceTimelineBuilder selectedJurisdictions={selectedJurisdictions} />
    </div>
  )
}

export default ComplianceTimelineBuilderStandalone
