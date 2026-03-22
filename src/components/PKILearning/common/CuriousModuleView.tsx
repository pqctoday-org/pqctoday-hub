import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { MODULE_CATALOG, MODULE_TRACKS, MODULE_TO_TRACK } from '../moduleData'
import { CuriousSummaryBanner } from './CuriousSummaryBanner'
import { useModuleStore } from '@/store/useModuleStore'
import { PERSONAS } from '@/data/learningPersonas'
import { EndorseButton } from '@/components/ui/EndorseButton'
import { FlagButton } from '@/components/ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { CheckCircle } from 'lucide-react'

interface CuriousModuleViewProps {
  moduleId: string
}

export const CuriousModuleView: React.FC<CuriousModuleViewProps> = ({ moduleId }) => {
  const navigate = useNavigate()
  const moduleMeta = MODULE_CATALOG[moduleId] // eslint-disable-line security/detect-object-injection
  const { updateModuleProgress, modules } = useModuleStore()
  const isCompleted = modules[moduleId]?.status === 'completed'

  const handleMarkReviewed = () => {
    updateModuleProgress(moduleId, { status: 'completed' })
  }

  // Find next/prev in the same track
  const { prevModuleId, nextModuleId } = useMemo(() => {
    const trackName = MODULE_TO_TRACK[moduleId] // eslint-disable-line security/detect-object-injection
    if (!trackName) return { prevModuleId: null, nextModuleId: null }
    const trackObj = MODULE_TRACKS.find((t) => t.track === trackName)
    if (!trackObj) return { prevModuleId: null, nextModuleId: null }

    const idx = trackObj.modules.findIndex((m) => m.id === moduleId)
    return {
      prevModuleId: idx > 0 ? trackObj.modules[idx - 1].id : null,
      nextModuleId:
        idx < trackObj.modules.length - 1 && idx !== -1 ? trackObj.modules[idx + 1].id : null,
    }
  }, [moduleId])

  // Mark this module as completed when they click Next.
  // For Curious persona, we just view the summary.
  const handleNext = () => {
    updateModuleProgress(moduleId, { status: 'completed' })
    if (nextModuleId) {
      navigate(`/learn/${nextModuleId}`)
    } else {
      navigate('/learn')
    }
  }

  if (!moduleMeta) return null

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-12 mt-4">
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
            <button
              onClick={handleMarkReviewed}
              disabled={isCompleted}
              className={`px-3 py-1.5 rounded-md font-medium text-sm transition-colors flex items-center gap-2 ${
                isCompleted
                  ? 'bg-green-500/20 text-green-500 dark:text-green-400 cursor-default border border-green-500/30'
                  : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 cursor-pointer'
              }`}
            >
              <CheckCircle size={16} />
              {isCompleted ? 'Reviewed ✓' : 'Mark as Reviewed'}
            </button>
          </div>
        </div>
      </div>

      <CuriousSummaryBanner moduleId={moduleId} isFullPage={true} />

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-12 pt-6 border-t border-border">
        {prevModuleId ? (
          <button
            type="button"
            onClick={() => navigate(`/learn/${prevModuleId}`)}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-5 py-2.5 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Previous Module
          </button>
        ) : (
          <div className="hidden sm:block" />
        )}

        {nextModuleId ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-2.5 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Next Module
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 py-2.5 bg-accent text-accent-foreground font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
          >
            Finish Track
          </button>
        )}
      </div>

      {PERSONAS.curious.recommendedPath.includes(moduleId) && (
        <div className="mt-8 p-6 glass-panel border border-primary/20 bg-primary/5 rounded-xl text-center">
          <h3 className="text-xl font-semibold mb-2">Want to learn more?</h3>
          <p className="text-muted-foreground mb-4">
            Dive deeper into the details with an interactive beginner workshop for this module.
          </p>
          <button
            onClick={() => navigate(`/learn/${moduleId}?diveDeeper=true&tab=workshop`)}
            className="px-6 py-2.5 bg-background border border-border hover:border-primary hover:text-primary transition-all rounded-lg font-medium shadow-sm"
          >
            Dive Deeper
          </button>
        </div>
      )}
    </div>
  )
}
