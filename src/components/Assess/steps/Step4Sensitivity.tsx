import { useMemo } from 'react'

import { Info } from 'lucide-react'

import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { usePersonaStore } from '../../../store/usePersonaStore'

import { industrySensitivityConfigs, getIndustryConfigs } from '../../../data/industryAssessConfig'
import { getPersonaStepContent } from '../../../data/personaWizardHints'

import { InlineTooltip } from '../../ui/InlineTooltip'

import { Button } from '../../ui/button'

import clsx from 'clsx'

import { PersonaHint } from './PersonaHint'

const Step4Sensitivity = () => {
  const {
    dataSensitivity,
    toggleDataSensitivity,
    sensitivityUnknown,
    setSensitivityUnknown,
    industry,
  } = useAssessmentStore()

  const persona = usePersonaStore((s) => s.selectedPersona)
  const stepContent = getPersonaStepContent(persona, 'sensitivity')

  const industrySensitivities = useMemo(
    () => getIndustryConfigs(industrySensitivityConfigs, industry),
    [industry]
  )

  const universalLevels = [
    {
      value: 'low',
      label: 'Low',
      description: 'Public data, marketing content, non-sensitive business data',
      color: 'border-success bg-success/10 text-success',
    },
    {
      value: 'medium',
      label: 'Medium',
      description: 'Internal business data, employee information, general customer data',
      color: 'border-primary bg-primary/10 text-primary',
    },
    {
      value: 'high',
      label: 'High',
      description: 'Financial records, health data, personal identifiable information (PII)',
      color: 'border-warning bg-warning/10 text-warning',
    },
    {
      value: 'critical',
      label: 'Critical',
      description: 'State secrets, classified data, long-lived cryptographic keys, nuclear/defense',
      color: 'border-destructive bg-destructive/10 text-destructive',
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        {stepContent.title ?? 'How sensitive is your data?'}
      </h3>
      <p className="text-sm text-muted-foreground">
        {stepContent.description ?? (
          <>
            Data sensitivity determines your exposure to{' '}
            <InlineTooltip term="HNDL">
              &ldquo;Harvest Now, Decrypt Later&rdquo; (HNDL)
            </InlineTooltip>{' '}
            attacks. Select all that apply — your risk is assessed against the highest level
            present.
          </>
        )}
      </p>

      <PersonaHint stepKey="sensitivity" />

      <div className="glass-panel p-4 border-l-4 border-l-warning mb-4">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-warning">HNDL</strong>: Adversaries collect encrypted data today
            and wait for quantum computers to decrypt it. If your data needs to remain confidential
            for 10+ years, the threat is <em>already active</em>.
          </p>
        </div>
      </div>

      {/* ── "I don't know" escape hatch ── */}
      <Button
        variant="ghost"
        aria-pressed={sensitivityUnknown}
        onClick={() => setSensitivityUnknown(!sensitivityUnknown)}
        className={clsx(
          'w-full h-auto p-3 justify-start gap-2 whitespace-normal border',
          sensitivityUnknown
            ? 'border-muted-foreground bg-muted/20 text-foreground hover:bg-muted/20'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground hover:bg-transparent'
        )}
      >
        <Info size={14} className="shrink-0" />I don&apos;t know / Not sure about our data
        sensitivity
      </Button>

      <div className={clsx('space-y-4', sensitivityUnknown && 'opacity-40 pointer-events-none')}>
        {/* ── Industry-specific data types ── */}
        {industrySensitivities.length > 0 && (
          <>
            <div className="glass-panel p-3 border-l-4 border-l-primary">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-primary shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Showing data types common in the{' '}
                  <strong className="text-foreground">{industry}</strong> sector.
                </p>
              </div>
            </div>
            <div
              className="space-y-3"
              role="group"
              aria-label={`${industry} data sensitivity types`}
            >
              {industrySensitivities.map((item) => {
                const level = SENSITIVITY_SCORE_TO_LEVEL[item.sensitivityScore] ?? 'medium'
                // eslint-disable-next-line security/detect-object-injection
                const badge = SENSITIVITY_BADGE_STYLES[level]
                const isSelected = dataSensitivity.includes(level)
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    aria-pressed={isSelected}
                    onClick={() => toggleDataSensitivity(level)}
                    className={clsx(
                      'w-full h-auto p-4 flex-col items-start whitespace-normal border',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                        : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-transparent'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="font-bold text-sm">{item.label}</span>
                      {badge && (
                        <span
                          className={clsx(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
                            badge.text,
                            badge.bg
                          )}
                        >
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1 opacity-80">{item.description}</p>
                  </Button>
                )
              })}
            </div>
          </>
        )}

        {/* ── Universal sensitivity levels ── */}
        <div
          className={clsx(industrySensitivities.length > 0 && 'border-t border-border pt-3 mt-2')}
        >
          {industrySensitivities.length > 0 && (
            <p className="text-xs text-muted-foreground font-medium mb-2">
              General sensitivity levels
            </p>
          )}
          <div className="space-y-3" role="group" aria-label="Data sensitivity levels">
            {universalLevels.map((level) => (
              <Button
                key={level.value}
                variant="ghost"
                aria-pressed={dataSensitivity.includes(level.value)}
                onClick={() => toggleDataSensitivity(level.value)}
                className={clsx(
                  'w-full h-auto p-4 flex-col items-start whitespace-normal border',
                  dataSensitivity.includes(level.value)
                    ? `${level.color} hover:bg-transparent`
                    : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-transparent'
                )}
              >
                <span className="font-bold text-sm">{level.label}</span>
                <p className="text-xs mt-1 opacity-80">{level.description}</p>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export { Step4Sensitivity }

const SENSITIVITY_SCORE_TO_LEVEL: Record<number, 'low' | 'medium' | 'high' | 'critical'> = {
  0: 'low',
  5: 'medium',
  15: 'high',
  25: 'critical',
}
const SENSITIVITY_BADGE_STYLES: Record<string, { text: string; bg: string; label: string }> = {
  low: { text: 'text-success', bg: 'bg-success/15', label: 'Low' },
  medium: { text: 'text-primary', bg: 'bg-primary/15', label: 'Medium' },
  high: { text: 'text-warning', bg: 'bg-warning/15', label: 'High' },
  critical: { text: 'text-destructive', bg: 'bg-destructive/15', label: 'Critical' },
}
