// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo } from 'react'
import { Globe, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ComplianceTimelineBuilder } from '@/components/PKILearning/modules/ComplianceStrategy/components/ComplianceTimelineBuilder'
import { JURISDICTIONS } from '@/components/PKILearning/modules/ComplianceStrategy/data/jurisdictions'
import { useAssessmentSnapshot } from '@/hooks/assessment/useAssessmentSnapshot'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'

/**
 * Zero-prop wrapper around {@link ComplianceTimelineBuilder} for the Command
 * Center artifact drawer and /business/tools/:id route. Provides a compact
 * jurisdiction picker because the full {@link ComplianceTimelineBuilder}
 * requires a `selectedJurisdictions` prop that the workshop normally supplies
 * from its Step 1 JurisdictionMapper.
 */
function deriveJurisdictionIdsFromCountry(country: string | undefined): string[] {
  if (!country) return []
  const lc = country.toLowerCase()
  return JURISDICTIONS.filter((j) => j.countryNames.some((n) => n.toLowerCase() === lc)).map(
    (j) => j.id
  )
}

export function ComplianceTimelineBuilderStandalone() {
  const { input, result } = useAssessmentSnapshot()
  const assessmentJurisdictionIds = deriveJurisdictionIdsFromCountry(input?.country)

  const [selectedJurisdictions, setSelectedJurisdictions] =
    useState<string[]>(assessmentJurisdictionIds)
  const [seededFromAssessment, setSeededFromAssessment] = useState(
    assessmentJurisdictionIds.length > 0
  )

  // PQC-required frameworks the user selected, with deadlines, surfaced as a
  // hint above the jurisdiction picker — not auto-applied because frameworks
  // are not 1:1 with jurisdictions.
  const pqcImpacts = (result?.complianceImpacts ?? []).filter((c) => c.requiresPQC === true)

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
      {seededFromAssessment && (
        <PreFilledBanner
          summary={`Jurisdiction pre-selected from your assessment country: ${input?.country}.${pqcImpacts.length > 0 ? ` ${pqcImpacts.length} PQC-required framework${pqcImpacts.length !== 1 ? 's' : ''} also identified.` : ''}`}
          onClear={() => {
            setSelectedJurisdictions([])
            setSeededFromAssessment(false)
          }}
        />
      )}

      {pqcImpacts.length > 0 && (
        <div className="glass-panel p-3 border-l-4 border-status-warning">
          <div className="text-xs font-semibold text-foreground mb-1.5">
            Frameworks requiring PQC (from your assessment)
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            {pqcImpacts.map((c) => (
              <li key={c.framework}>
                <span className="font-medium text-foreground">{c.framework}</span>
                {c.deadline && <span> — deadline: {c.deadline}</span>}
                {c.notes && <span className="text-muted-foreground/80"> · {c.notes}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

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
