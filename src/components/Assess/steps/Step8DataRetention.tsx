// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'

import { Info } from 'lucide-react'

import { useAssessmentStore } from '../../../store/useAssessmentStore'

import {
  industryRetentionConfigs,
  universalRetentionConfigs,
  getIndustryConfigs,
} from '../../../data/industryAssessConfig'

import { InlineTooltip } from '../../ui/InlineTooltip'

import { Button } from '../../ui/button'

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
      <Button
        variant="ghost"
        aria-pressed={retentionUnknown}
        onClick={() => setRetentionUnknown(!retentionUnknown)}
        className={clsx(
          'w-full h-auto p-3 justify-start gap-2 whitespace-normal border',
          retentionUnknown
            ? 'border-muted-foreground bg-muted/20 text-foreground hover:bg-muted/20'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground hover:bg-transparent'
        )}
      >
        <Info size={14} className="shrink-0" />
        I&apos;m not sure — help me choose
      </Button>
      {retentionUnknown && (
        <p className="text-xs text-muted-foreground italic">
          Recommended for {industry || 'your industry'}. You can adjust any selection.
        </p>
      )}

      <div className="space-y-4">
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
                <Button
                  key={opt.id}
                  variant="ghost"
                  aria-pressed={dataRetention.includes(opt.id)}
                  onClick={() => toggleDataRetention(opt.id)}
                  className={clsx(
                    'w-full h-auto p-4 flex-col items-start whitespace-normal border',
                    dataRetention.includes(opt.id)
                      ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                      : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-transparent'
                  )}
                >
                  <span className="font-bold text-sm">{opt.label}</span>
                  <p className="text-xs mt-1 opacity-80">{opt.description}</p>
                </Button>
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
                <Button
                  key={opt.id}
                  variant="ghost"
                  aria-pressed={dataRetention.includes(opt.id)}
                  onClick={() => toggleDataRetention(opt.id)}
                  className={clsx(
                    'w-full h-auto p-4 flex-col items-start whitespace-normal border',
                    dataRetention.includes(opt.id)
                      ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                      : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-transparent'
                  )}
                >
                  <span className="font-bold text-sm">{opt.label}</span>
                  <p className="text-xs mt-1 opacity-80">{opt.description}</p>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export { Step8DataRetention }
