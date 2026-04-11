import React, { useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { MODULE_CATALOG, WORKSHOP_STEPS } from '../moduleData'
import { CuriousSummaryBanner } from './CuriousSummaryBanner'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PERSONAS } from '@/data/learningPersonas'
import { EndorseButton } from '@/components/ui/EndorseButton'
import { FlagButton } from '@/components/ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CuriousModuleViewProps {
  moduleId: string
}

export const CuriousModuleView: React.FC<CuriousModuleViewProps> = ({ moduleId }) => {
  const navigate = useNavigate()
  const moduleMeta = MODULE_CATALOG[moduleId] // eslint-disable-line security/detect-object-injection
  const { updateModuleProgress, markStepComplete, modules } = useModuleStore()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const isCompleted = modules[moduleId]?.status === 'completed'

  // Mark module as reviewed AND credit all workshop steps for belt progression
  const markModuleReviewed = useCallback(
    (id: string) => {
      updateModuleProgress(id, { status: 'completed' })
      const steps = WORKSHOP_STEPS[id] // eslint-disable-line security/detect-object-injection
      if (steps) {
        for (const step of steps) {
          markStepComplete(id, step.id)
        }
      }
    },
    [updateModuleProgress, markStepComplete]
  )

  const handleMarkReviewed = () => {
    markModuleReviewed(moduleId)
  }

  // Find next/prev using persona path ordering (fall back to curious path)
  const { prevModuleId, nextModuleId } = useMemo(() => {
    const personaKey = selectedPersona ?? 'curious'
    const persona = PERSONAS[personaKey] // eslint-disable-line security/detect-object-injection
    const path = persona?.recommendedPath ?? PERSONAS.curious.recommendedPath
    const idx = path.indexOf(moduleId)
    if (idx === -1) return { prevModuleId: null, nextModuleId: null }
    return {
      prevModuleId: idx > 0 ? path[idx - 1] : null,
      nextModuleId: idx < path.length - 1 ? path[idx + 1] : null,
    }
  }, [moduleId, selectedPersona])

  // Mark this module as completed when they click Next.
  // For Curious persona, we just view the summary.
  const handleNext = () => {
    markModuleReviewed(moduleId)
    if (nextModuleId) {
      navigate(`/learn/${nextModuleId}`)
    } else {
      navigate('/learn')
    }
  }

  if (!moduleMeta) return null

  return (
    <div className="space-y-6 animate-fade-in w-full pb-12 mt-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full">
          <h1 className="text-3xl font-bold text-gradient">{moduleMeta.title}</h1>
          <p className="text-muted-foreground mt-2 text-lg">{moduleMeta.description}</p>
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <EndorseButton
                endorseUrl={buildEndorsementUrl({
                  category: 'learn-module-endorsement',
                  title: `Endorse: ${moduleMeta.title}`,
                  resourceType: 'Learning Module',
                  resourceId: moduleId,
                  resourceDetails: `**Module:** ${moduleMeta.title}\n**Description:** ${moduleMeta.description}`,
                  pageUrl: `/learn/${moduleId}`,
                })}
                resourceLabel={moduleMeta.title}
                resourceType="Module"
              />
              <FlagButton
                flagUrl={buildFlagUrl({
                  category: 'learn-module-endorsement',
                  title: `Flag: ${moduleMeta.title}`,
                  resourceType: 'Learning Module',
                  resourceId: moduleId,
                  resourceDetails: `**Module:** ${moduleMeta.title}\n**Description:** ${moduleMeta.description}`,
                  pageUrl: `/learn/${moduleId}`,
                })}
                resourceLabel={moduleMeta.title}
                resourceType="Module"
              />
            </div>
            <Button
              variant="ghost"
              onClick={handleMarkReviewed}
              disabled={isCompleted}
              className={`px-3 py-1.5 rounded-md font-medium text-sm transition-colors flex items-center gap-2 ${
                isCompleted
                  ? 'bg-status-success/20 text-status-success cursor-default border border-status-success/30'
                  : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 cursor-pointer'
              }`}
            >
              <CheckCircle size={16} />
              {isCompleted ? 'Reviewed ✓' : 'Mark as Reviewed'}
            </Button>
          </div>
        </div>
      </div>

      <CuriousSummaryBanner moduleId={moduleId} isFullPage={true} />

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-12 pt-6 border-t border-border">
        {prevModuleId ? (
          <Button
            variant="ghost"
            type="button"
            onClick={() => navigate(`/learn/${prevModuleId}`)}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-5 py-2.5 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Previous Module
          </Button>
        ) : (
          <div className="hidden sm:block" />
        )}

        {nextModuleId ? (
          <Button
            variant="ghost"
            type="button"
            onClick={handleNext}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-2.5 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Next Module
            <ArrowRight size={16} />
          </Button>
        ) : (
          <Button
            variant="ghost"
            type="button"
            onClick={handleNext}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-2.5 bg-accent text-accent-foreground font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
          >
            Finish Path
          </Button>
        )}
      </div>

      {PERSONAS.curious.recommendedPath.includes(moduleId) && (
        <div className="mt-8 p-6 glass-panel border border-primary/20 bg-primary/5 rounded-xl text-center">
          <h3 className="text-xl font-semibold mb-2">Want to learn more?</h3>
          <p className="text-muted-foreground mb-4">
            Dive deeper into the details with an interactive beginner workshop for this module.
          </p>
          <Button
            variant="ghost"
            onClick={() => navigate(`/learn/${moduleId}?diveDeeper=true&tab=workshop`)}
            className="px-6 py-2.5 bg-background border border-border hover:border-primary hover:text-primary transition-all rounded-lg font-medium shadow-sm"
          >
            Dive Deeper
          </Button>
        </div>
      )}
    </div>
  )
}
