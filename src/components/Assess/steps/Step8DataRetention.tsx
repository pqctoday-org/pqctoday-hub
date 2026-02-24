import { useMemo } from 'react'

import { Info } from 'lucide-react'

import { useAssessmentStore } from '../../../store/useAssessmentStore'

import {
  industryRetentionConfigs,
  universalRetentionConfigs,
  getIndustryConfigs,
} from '../../../data/industryAssessConfig'

import { InlineTooltip } from '../../ui/InlineTooltip'

import clsx from 'clsx'

import { PersonaHint } from './PersonaHint'

const Step8DataRetention = () => {
  const { dataRetention, toggleDataRetention, retentionUnknown, setRetentionUnknown, industry } =
    useAssessmentStore()

  const industryRetentionOptions = useMemo(
    () => getIndustryConfigs(industryRetentionConfigs, industry),
    [industry]
  )
  const industryRetentionIdSet = useMemo(
    () => new Set(industryRetentionOptions.map((r) => r.id)),
    [industryRetentionOptions]
  )
  const filteredUniversalOptions = useMemo(
    () => universalRetentionConfigs.filter((opt) => !industryRetentionIdSet.has(opt.id)),
    [industryRetentionIdSet]
  )

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        How long must your data stay confidential?
      </h3>
      <p className="text-sm text-muted-foreground">
        Select all categories that apply — <InlineTooltip term="HNDL">HNDL</InlineTooltip> risk is
        assessed against the longest period.
      </p>

      <PersonaHint stepKey="retention" />

      <div className="glass-panel p-4 border-l-4 border-l-warning mb-4">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            If your encrypted data needs to remain confidential past ~2035, adversaries may already
            be harvesting it today for future quantum decryption.
          </p>
        </div>
      </div>

      {/* I don't know escape hatch */}
      <button
        aria-pressed={retentionUnknown}
        onClick={() => setRetentionUnknown(!retentionUnknown)}
        className={clsx(
          'w-full p-3 rounded-lg border text-left text-sm font-medium transition-colors flex items-center gap-2',
          retentionUnknown
            ? 'border-muted-foreground bg-muted/20 text-foreground'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground'
        )}
      >
        <Info size={14} className="shrink-0" />I don&apos;t know / Our retention policies are
        undefined
      </button>

      <div className={clsx('space-y-4', retentionUnknown && 'opacity-40 pointer-events-none')}>
        {industryRetentionOptions.length > 0 && (
          <>
            <div className="glass-panel p-3 border-l-4 border-l-primary">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-primary shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Showing retention periods common in the{' '}
                  <strong className="text-foreground">{industry}</strong> sector.
                </p>
              </div>
            </div>
            <div className="space-y-3" role="group" aria-label={`${industry} retention periods`}>
              {industryRetentionOptions.map((opt) => (
                <button
                  key={opt.id}
                  aria-pressed={dataRetention.includes(opt.id)}
                  onClick={() => toggleDataRetention(opt.id)}
                  className={clsx(
                    'w-full p-4 rounded-lg border text-left transition-colors',
                    dataRetention.includes(opt.id)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  )}
                >
                  <span className="font-bold text-sm">{opt.label}</span>
                  <p className="text-xs mt-1 opacity-80">{opt.description}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {filteredUniversalOptions.length > 0 && (
          <div
            className={clsx(
              industryRetentionOptions.length > 0 && 'border-t border-border pt-3 mt-2'
            )}
          >
            {industryRetentionOptions.length > 0 && (
              <p className="text-xs text-muted-foreground font-medium mb-2">General ranges</p>
            )}
            <div className="space-y-3" role="group" aria-label="General data retention periods">
              {filteredUniversalOptions.map((opt) => (
                <button
                  key={opt.id}
                  aria-pressed={dataRetention.includes(opt.id)}
                  onClick={() => toggleDataRetention(opt.id)}
                  className={clsx(
                    'w-full p-4 rounded-lg border text-left transition-colors',
                    dataRetention.includes(opt.id)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  )}
                >
                  <span className="font-bold text-sm">{opt.label}</span>
                  <p className="text-xs mt-1 opacity-80">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export { Step8DataRetention }
