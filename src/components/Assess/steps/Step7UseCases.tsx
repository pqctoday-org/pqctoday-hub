// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'

import { Info } from 'lucide-react'

import { useAssessmentStore } from '../../../store/useAssessmentStore'

import { AVAILABLE_USE_CASES } from '../../../hooks/assessmentData'

import { industryUseCaseConfigs, getIndustryConfigs } from '../../../data/industryAssessConfig'

import { Button } from '../../ui/button'

import clsx from 'clsx'

import { PersonaHint } from './PersonaHint'

const Step7UseCases = () => {
  const { cryptoUseCases, toggleCryptoUseCase, useCasesUnknown, setUseCasesUnknown, industry } =
    useAssessmentStore()

  const industryUseCases = useMemo(
    () => getIndustryConfigs(industryUseCaseConfigs, industry),
    [industry]
  )
  const industryUseCaseLabelSet = useMemo(
    () => new Set(industryUseCases.map((uc) => uc.label)),
    [industryUseCases]
  )
  const industrySpecificUseCaseLabels = useMemo(() => {
    const set = new Set<string>()
    for (const cfg of industryUseCaseConfigs) {
      if (cfg.industries.length > 0 && cfg.industries.length <= 2) {
        set.add(cfg.label)
      }
    }
    return set
  }, [])
  const universalUseCases = useMemo(
    () =>
      AVAILABLE_USE_CASES.filter(
        (uc) =>
          !industryUseCaseLabelSet.has(uc) &&
          (industry === 'Other' || !industry || !industrySpecificUseCaseLabels.has(uc))
      ),
    [industryUseCaseLabelSet, industry, industrySpecificUseCaseLabels]
  )

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">Where do you use cryptography?</h3>
      <p className="text-sm text-muted-foreground">
        Select all cryptographic use cases in your organization. This helps prioritize which
        migrations are most urgent.
      </p>

      <PersonaHint stepKey="use-cases" />

      {/* I don't know — Step 3 model */}
      <Button
        variant="ghost"
        aria-pressed={useCasesUnknown}
        onClick={() => setUseCasesUnknown(!useCasesUnknown)}
        className={clsx(
          'w-full h-auto p-3 justify-start gap-2 whitespace-normal border',
          useCasesUnknown
            ? 'border-muted-foreground bg-muted/20 text-foreground hover:bg-muted/20'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground hover:bg-transparent'
        )}
      >
        <Info size={14} className="shrink-0" />
        I&apos;m not sure — help me choose
      </Button>
      {useCasesUnknown && (
        <p className="text-xs text-muted-foreground italic">
          Recommended for {industry || 'your industry'}. You can adjust any selection.
        </p>
      )}

      <div className="space-y-4">
        {industryUseCases.length > 0 && (
          <>
            <div className="glass-panel p-3 border-l-4 border-l-primary">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-primary shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Showing use cases common in the{' '}
                  <strong className="text-foreground">{industry}</strong> sector.
                </p>
              </div>
            </div>
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-2"
              role="group"
              aria-label={`${industry} use cases`}
            >
              {industryUseCases.map((uc) => (
                <Button
                  key={uc.id}
                  variant="ghost"
                  aria-pressed={cryptoUseCases.includes(uc.label)}
                  onClick={() => toggleCryptoUseCase(uc.label)}
                  className={clsx(
                    'h-auto p-3 justify-start border',
                    cryptoUseCases.includes(uc.label)
                      ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                      : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-transparent'
                  )}
                >
                  {uc.label}
                </Button>
              ))}
            </div>
          </>
        )}

        {universalUseCases.length > 0 && (
          <div className={clsx(industryUseCases.length > 0 && 'border-t border-border pt-3 mt-2')}>
            {industryUseCases.length > 0 && (
              <p className="text-xs text-muted-foreground font-medium mb-2">General use cases</p>
            )}
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-2"
              role="group"
              aria-label="General cryptographic use cases"
            >
              {universalUseCases.map((uc) => (
                <Button
                  key={uc}
                  variant="ghost"
                  aria-pressed={cryptoUseCases.includes(uc)}
                  onClick={() => toggleCryptoUseCase(uc)}
                  className={clsx(
                    'h-auto p-3 justify-start border',
                    cryptoUseCases.includes(uc)
                      ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                      : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-transparent'
                  )}
                >
                  {uc}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export { Step7UseCases }
