// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo } from 'react'
import { Globe, Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ComplianceTimelineBuilder } from '@/components/PKILearning/modules/ComplianceStrategy/components/ComplianceTimelineBuilder'
import { JURISDICTIONS } from '@/components/PKILearning/modules/ComplianceStrategy/data/jurisdictions'
import { useAssessmentSnapshot } from '@/hooks/assessment/useAssessmentSnapshot'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { useComplianceSelectionStore } from '@/store/useComplianceSelectionStore'
import { complianceFrameworks } from '@/data/complianceData'
import { useBookmarkStore } from '@/store/useBookmarkStore'

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

/** Cross-walk myFrameworks (compliance framework IDs the user starred on
 *  /compliance) to jurisdiction IDs by joining `framework.countries[]` against
 *  `JURISDICTION.countryNames[]`. Returns dedup'd jurisdiction ids. */
function deriveJurisdictionIdsFromFrameworks(myFrameworks: string[]): string[] {
  if (myFrameworks.length === 0) return []
  const frameworkSet = new Set(myFrameworks)
  const countries = new Set<string>()
  for (const fw of complianceFrameworks) {
    if (!frameworkSet.has(fw.id)) continue
    for (const c of fw.countries) countries.add(c.toLowerCase())
  }
  return JURISDICTIONS.filter((j) =>
    j.countryNames.some((n) => countries.has(n.toLowerCase()))
  ).map((j) => j.id)
}

/** Cross-walk myTimelineCountries (country names bookmarked on /timeline) to
 *  jurisdiction IDs by matching against `JURISDICTION.countryNames[]`. */
function deriveJurisdictionIdsFromTimelineCountries(countryNames: string[]): string[] {
  if (countryNames.length === 0) return []
  const countrySet = new Set(countryNames.map((n) => n.toLowerCase()))
  return JURISDICTIONS.filter((j) =>
    j.countryNames.some((n) => countrySet.has(n.toLowerCase()))
  ).map((j) => j.id)
}

function dedupe(...lists: string[][]): string[] {
  return Array.from(new Set(lists.flat()))
}

export function ComplianceTimelineBuilderStandalone() {
  const { input, result } = useAssessmentSnapshot()
  const myFrameworks = useComplianceSelectionStore((s) => s.myFrameworks)
  const toggleMyFramework = useComplianceSelectionStore((s) => s.toggleMyFramework)
  const myTimelineCountries = useBookmarkStore((s) => s.myTimelineCountries)
  const assessmentJurisdictionIds = deriveJurisdictionIdsFromCountry(input?.country)
  const myFrameworkJurisdictionIds = deriveJurisdictionIdsFromFrameworks(myFrameworks)
  const myTimelineJurisdictionIds = deriveJurisdictionIdsFromTimelineCountries(myTimelineCountries)
  const seedJurisdictionIds = dedupe(
    assessmentJurisdictionIds,
    myFrameworkJurisdictionIds,
    myTimelineJurisdictionIds
  )

  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>(seedJurisdictionIds)
  const [seededFromAssessment, setSeededFromAssessment] = useState(seedJurisdictionIds.length > 0)

  // PQC-required frameworks the user selected, with deadlines, surfaced as a
  // hint above the jurisdiction picker — not auto-applied because frameworks
  // are not 1:1 with jurisdictions.
  const pqcImpacts = (result?.complianceImpacts ?? []).filter((c) => c.requiresPQC === true)

  /** Build a sources blurb describing what fed the pre-fill (country, my-frameworks, or both). */
  const seedSources: string[] = []
  if (assessmentJurisdictionIds.length > 0 && input?.country) {
    seedSources.push(`country (${input.country})`)
  }
  if (myFrameworkJurisdictionIds.length > 0) {
    seedSources.push(
      `${myFrameworks.length} framework${myFrameworks.length !== 1 ? 's' : ''} from /compliance`
    )
  }
  if (myTimelineJurisdictionIds.length > 0) {
    seedSources.push(
      `${myTimelineCountries.length} countr${myTimelineCountries.length !== 1 ? 'ies' : 'y'} from /timeline`
    )
  }

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
          summary={`${seedJurisdictionIds.length} jurisdiction${seedJurisdictionIds.length !== 1 ? 's' : ''} pre-selected from ${seedSources.join(' + ')}.${pqcImpacts.length > 0 ? ` ${pqcImpacts.length} PQC-required framework${pqcImpacts.length !== 1 ? 's' : ''} also identified.` : ''}`}
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
            {pqcImpacts.map((c) => {
              const fwId = complianceFrameworks.find(
                (fw) => fw.label === c.framework || fw.id === c.framework
              )?.id
              const isMine = fwId ? myFrameworks.includes(fwId) : false
              return (
                <li key={c.framework} className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{c.framework}</span>
                  {c.deadline && <span>— deadline: {c.deadline}</span>}
                  {c.notes && <span className="text-muted-foreground/80">· {c.notes}</span>}
                  {fwId && (
                    <Button
                      variant={isMine ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-6 px-2 text-[10px] ml-auto"
                      onClick={() => toggleMyFramework(fwId)}
                      title={
                        isMine
                          ? `Remove ${c.framework} from My Frameworks`
                          : `Add ${c.framework} to My Frameworks (saves on /compliance)`
                      }
                    >
                      {isMine ? (
                        <Check size={11} className="mr-1" />
                      ) : (
                        <Plus size={11} className="mr-1" />
                      )}
                      {isMine ? 'Mine' : 'My Frameworks'}
                    </Button>
                  )}
                </li>
              )
            })}
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
