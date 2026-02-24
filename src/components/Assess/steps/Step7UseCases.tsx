import { useMemo } from 'react'

import { Info } from 'lucide-react'

import { useAssessmentStore } from '../../../store/useAssessmentStore'

import { AVAILABLE_USE_CASES } from '../../../hooks/assessmentData'

import { industryUseCaseConfigs, getIndustryConfigs } from '../../../data/industryAssessConfig'

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
      <button
        aria-pressed={useCasesUnknown}
        onClick={() => setUseCasesUnknown(!useCasesUnknown)}
        className={clsx(
          'w-full p-3 rounded-lg border text-left text-sm font-medium transition-colors flex items-center gap-2',
          useCasesUnknown
            ? 'border-muted-foreground bg-muted/20 text-foreground'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground'
        )}
      >
        <Info size={14} className="shrink-0" />I don&apos;t know / None of these
      </button>

      <div className={clsx('space-y-4', useCasesUnknown && 'opacity-40 pointer-events-none')}>
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
                <button
                  key={uc.id}
                  aria-pressed={cryptoUseCases.includes(uc.label)}
                  onClick={() => toggleCryptoUseCase(uc.label)}
                  className={clsx(
                    'p-3 rounded-lg border text-left text-sm font-medium transition-colors',
                    cryptoUseCases.includes(uc.label)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  )}
                >
                  {uc.label}
                </button>
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
                <button
                  key={uc}
                  aria-pressed={cryptoUseCases.includes(uc)}
                  onClick={() => toggleCryptoUseCase(uc)}
                  className={clsx(
                    'p-3 rounded-lg border text-left text-sm font-medium transition-colors',
                    cryptoUseCases.includes(uc)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  )}
                >
                  {uc}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export { Step7UseCases }
