// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'

import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { ALL_JURISDICTIONS, REGION_COUNTRIES_MAP } from '../../../data/jurisdictionsData'
import { Button } from '../../ui/button'
import clsx from 'clsx'
import { usePersonaStore } from '../../../store/usePersonaStore'
import type { EmbeddedStepProps } from '../redesign/assessFlowModel'

const Step2Country = ({ hideHeading = false }: EmbeddedStepProps = {}) => {
  const { country, setCountry } = useAssessmentStore()
  const { selectedRegion } = usePersonaStore()

  const countries = useMemo(() => {
    if (!selectedRegion || selectedRegion === 'global') return ALL_JURISDICTIONS
    const allowed = new Set(REGION_COUNTRIES_MAP[selectedRegion])
    return ALL_JURISDICTIONS.filter((j) => allowed.has(j.name))
  }, [selectedRegion])

  return (
    <div className="space-y-4">
      {!hideHeading && (
        <>
          <h3 className="text-xl font-bold text-foreground">
            Which jurisdiction applies to your organization?
          </h3>
          <p className="text-sm text-muted-foreground">
            Your country&apos;s regulatory timeline will be used to align your migration deadline
            recommendations.
          </p>
        </>
      )}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-2"
        role="radiogroup"
        aria-label="Country selection"
      >
        {countries.map((j) => (
          <Button
            key={j.name}
            variant="ghost"
            role="radio"
            aria-checked={country === j.name}
            onClick={() => setCountry(j.name)}
            className={clsx(
              'h-auto p-3 justify-start gap-2 border',
              country === j.name
                ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-transparent'
            )}
          >
            <img
              src={`https://flagcdn.com/w20/${j.flagCode.toLowerCase()}.png`}
              alt=""
              aria-hidden="true"
              width={20}
              height={15}
              className="rounded-[2px] shrink-0"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
            {j.name}
          </Button>
        ))}
      </div>
    </div>
  )
}

export { Step2Country }
