// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useMemo } from 'react'
import { FileText, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ArtifactBuilder } from '@/components/PKILearning/common/executive'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PersonaPitchBanner } from './PersonaPitchBanner'
import { getPitchVariant } from './pitchVariants'
import type { FormData } from './pitchVariants'

const MODULE_ID = 'pqc-business-case'

export const BoardPitchBuilder: React.FC = () => {
  const data = useExecutiveModuleData()
  const { addExecutiveDocument } = useModuleStore()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)

  // Key the variant (and therefore the whole ArtifactBuilder below) on persona
  // so switching roles resets the form state to the new persona's defaults.
  const variant = useMemo(() => getPitchVariant(selectedPersona, data), [selectedPersona, data])

  const renderPreviewBound = useCallback(
    (formData: FormData) => variant.renderPreview(formData, data),
    [variant, data]
  )

  const handleExport = useCallback(
    (formData: FormData) => {
      const markdown = variant.renderPreview(formData, data)
      addExecutiveDocument({
        id: `board-pitch-${selectedPersona ?? 'default'}-${Date.now()}`,
        moduleId: MODULE_ID,
        type: 'board-deck',
        title: variant.title,
        data: markdown,
        createdAt: Date.now(),
      })
    },
    [variant, data, selectedPersona, addExecutiveDocument]
  )

  return (
    <div className="space-y-6">
      <PersonaPitchBanner persona={selectedPersona} objective={variant.objective} />

      <div className="glass-panel p-4 flex items-start gap-3">
        <FileText size={20} className="text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">{variant.title}</p>
          <p className="text-xs text-muted-foreground">
            Every section is pre-populated from your assessment data. Edit any field inline, switch
            to Preview to see the formatted document, then export as Markdown or PPTX.
          </p>
          {data.isAssessmentComplete && (
            <p className="text-xs text-muted-foreground mt-2">
              Need the canonical board brief?{' '}
              <Link
                to="/report"
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                Report Board Brief
                <ExternalLink size={10} />
              </Link>{' '}
              uses the same assessment data as a single-source view.
            </p>
          )}
        </div>
      </div>

      <ArtifactBuilder
        key={selectedPersona ?? 'default'}
        title={variant.title}
        description={variant.description}
        sections={variant.sections}
        onExport={handleExport}
        exportFilename={variant.filename}
        renderPreview={renderPreviewBound}
        exportFormats={['markdown', 'pptx']}
      />
    </div>
  )
}
