// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'

import { useAssessmentStore } from '../../../store/useAssessmentStore'

import { timelineData } from '../../../data/timelineData'

import { Button } from '../../ui/button'

import clsx from 'clsx'

import { usePersonaStore } from '../../../store/usePersonaStore'

import { REGION_COUNTRIES_MAP } from '../../../data/personaConfig'

const Step2Country = () => {
  const { country, setCountry } = useAssessmentStore()
  const { selectedRegion } = usePersonaStore()

  const countries = useMemo(() => {
    const seen = new Set<string>()
    const list: Array<{ name: string; flagCode: string }> = []
    timelineData.forEach((c) => {
      if (!seen.has(c.countryName)) {
        seen.add(c.countryName)
        list.push({ name: c.countryName, flagCode: c.flagCode })
      }
    })
    const sorted = list.sort((a, b) => a.name.localeCompare(b.name))
    if (!selectedRegion || selectedRegion === 'global') return sorted
    const allowed = new Set(REGION_COUNTRIES_MAP[selectedRegion])
    return sorted.filter((c) => allowed.has(c.name))
  }, [selectedRegion])

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        Which jurisdiction applies to your organization?
      </h3>
      <p className="text-sm text-muted-foreground">
        Your country&apos;s regulatory timeline will be used to align your migration deadline
        recommendations.
      </p>
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-2"
        role="radiogroup"
        aria-label="Country selection"
      >
        {countries.map((c) => (
          <Button
            key={c.name}
            variant="ghost"
            role="radio"
            aria-checked={country === c.name}
            onClick={() => setCountry(c.name)}
            className={clsx(
              'h-auto p-3 justify-start gap-2 border',
              country === c.name
                ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-transparent'
            )}
          >
            <img
              src={`https://flagcdn.com/w20/${c.flagCode.toLowerCase()}.png`}
              alt=""
              aria-hidden="true"
              width={20}
              height={15}
              className="rounded-[2px] shrink-0"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
            {c.name}
          </Button>
        ))}
      </div>
    </div>
  )
}

export { Step2Country }
