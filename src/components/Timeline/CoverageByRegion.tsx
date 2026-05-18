// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { Globe } from 'lucide-react'
import type { GanttCountryData } from '../../types/timeline'
import type { Region } from '../../store/usePersonaStore'
import { REGION_COUNTRIES_MAP } from '../../data/personaConfig'
import { Button } from '../ui/button'

const REGION_DISPLAY: { id: Region; label: string }[] = [
  { id: 'americas', label: 'Americas' },
  { id: 'eu', label: 'EU' },
  { id: 'mena', label: 'MENA' },
  { id: 'apac', label: 'APAC' },
  { id: 'global', label: 'Global' },
]

interface RegionStats {
  countries: number
  events: number
  lastUpdate: Date | null
}

function computeRegionStats(data: GanttCountryData[], region: Region): RegionStats {
  // eslint-disable-next-line security/detect-object-injection
  const allowed = new Set(REGION_COUNTRIES_MAP[region])
  const rows = data.filter((d) => allowed.has(d.country.countryName))
  const countries = rows.length
  let events = 0
  let latest = 0
  for (const row of rows) {
    for (const body of row.country.bodies) {
      events += body.events.length
      for (const ev of body.events) {
        if (!ev.sourceDate) continue
        const t = new Date(ev.sourceDate).getTime()
        if (Number.isFinite(t) && t > latest) latest = t
      }
    }
  }
  return { countries, events, lastUpdate: latest > 0 ? new Date(latest) : null }
}

interface Props {
  data: GanttCountryData[]
  selectedRegion: string
  onSelectRegion: (region: string) => void
}

export const CoverageByRegion = ({ data, selectedRegion, onSelectRegion }: Props) => {
  const stats = useMemo(
    () => REGION_DISPLAY.map((r) => ({ ...r, ...computeRegionStats(data, r.id) })),
    [data]
  )

  return (
    <section
      aria-label="Coverage by region"
      className="mt-3 rounded-lg border border-border bg-card/50 p-3"
      data-testid="timeline-coverage-by-region"
    >
      <div className="flex items-center gap-2 mb-2">
        <Globe size={13} className="text-primary" aria-hidden="true" />
        <h3 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          Coverage by region
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {stats.map((s) => {
          const active = selectedRegion === s.id
          const isAll = selectedRegion === 'All'
          const dim = !active && !isAll
          return (
            <Button
              key={s.id}
              variant="ghost"
              type="button"
              onClick={() => onSelectRegion(active ? 'All' : s.id)}
              aria-pressed={active}
              className={`h-auto flex flex-col items-start text-left rounded-md border px-3 py-2 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary ${
                active
                  ? 'border-primary bg-primary/[0.08] hover:bg-primary/[0.12]'
                  : dim
                    ? 'border-border bg-background/50 text-muted-foreground hover:border-primary/40 hover:bg-muted/30'
                    : 'border-border bg-background hover:border-primary/40 hover:bg-muted/30'
              }`}
            >
              <div
                className={`text-[11px] font-bold uppercase tracking-wider ${active ? 'text-primary' : 'text-foreground'}`}
              >
                {s.label}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-sm font-semibold text-foreground">{s.events}</span>
                <span className="text-[10px] text-muted-foreground">
                  event{s.events === 1 ? '' : 's'}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {s.countries} countr{s.countries === 1 ? 'y' : 'ies'}
                {s.lastUpdate && ` · ${s.lastUpdate.toLocaleDateString()}`}
              </div>
            </Button>
          )
        })}
      </div>
    </section>
  )
}
