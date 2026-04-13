import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { ModuleItem } from '../ModuleCard'
import { CuriousSummaryBanner } from './CuriousSummaryBanner'
import { useModuleStore } from '../../../store/useModuleStore'
import { PERSONAS } from '../../../data/learningPersonas'
import { EndorseButton } from '@/components/ui/EndorseButton'
import { FlagButton } from '@/components/ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CuriousStackCarouselProps {
  modules: ModuleItem[]
  onNextStack?: () => void
}

export const CuriousStackCarousel: React.FC<CuriousStackCarouselProps> = ({
  modules,
  onNextStack,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { updateModuleProgress, modules: globalModules } = useModuleStore()
  const navigate = useNavigate()

  if (!modules || modules.length === 0) return null

  const currentModule = modules[currentIndex] // eslint-disable-line security/detect-object-injection
  const hasNext = currentIndex < modules.length - 1
  const hasPrev = currentIndex > 0

  const isCompleted = globalModules[currentModule.id]?.status === 'completed'

  const handleMarkReviewed = () => {
    updateModuleProgress(currentModule.id, { status: 'completed' })
  }

  const handleNext = () => {
    // Mark as viewed
    updateModuleProgress(currentModule.id, { status: 'completed' })
    if (hasNext) {
      setCurrentIndex((c) => c + 1)
    }
  }

  const handlePrev = () => {
    if (hasPrev) {
      setCurrentIndex((c) => c - 1)
    }
  }

  return (
    <div className="w-full flex flex-col space-y-6 pt-4 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div className="w-full">
          <div className="flex items-center justify-between mb-2 gap-2">
            <h3 className="text-xl font-bold text-foreground min-w-0 flex-1 truncate">
              {currentModule.title}
            </h3>
            <div className="text-xs font-semibold text-muted-foreground px-3 py-1 rounded-full bg-muted border border-border whitespace-nowrap shrink-0">
              Module {currentIndex + 1} of {modules.length}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{currentModule.description}</p>
          <div className="flex flex-wrap items-center gap-4 mt-5">
            <div className="flex items-center gap-2">
              <EndorseButton
                endorseUrl={buildEndorsementUrl({
                  category: 'learn-module-endorsement',
                  title: `Endorse: ${currentModule.title}`,
                  resourceType: 'Learning Module',
                  resourceId: currentModule.id,
                  resourceDetails: `**Module:** ${currentModule.title}\n**Description:** ${currentModule.description}`,
                  pageUrl: `/learn/${currentModule.id}`,
                })}
                resourceLabel={currentModule.title}
                resourceType="Module"
              />
              <FlagButton
                flagUrl={buildFlagUrl({
                  category: 'learn-module-endorsement',
                  title: `Flag: ${currentModule.title}`,
                  resourceType: 'Learning Module',
                  resourceId: currentModule.id,
                  resourceDetails: `**Module:** ${currentModule.title}\n**Description:** ${currentModule.description}`,
                  pageUrl: `/learn/${currentModule.id}`,
                })}
                resourceLabel={currentModule.title}
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

      <CuriousSummaryBanner moduleId={currentModule.id} isFullPage={true} />

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t border-border mt-2 px-2">
        <Button
          variant="ghost"
          type="button"
          onClick={handlePrev}
          disabled={!hasPrev}
          className={`flex items-center justify-center w-full sm:w-auto gap-2 px-5 py-2.5 rounded-lg border transition-colors ${
            hasPrev
              ? 'border-border hover:bg-muted text-foreground cursor-pointer'
              : 'border-transparent text-muted-foreground/30 cursor-not-allowed'
          }`}
        >
          <ArrowLeft size={16} />
          Previous
        </Button>

        {hasNext ? (
          <Button
            variant="gradient"
            type="button"
            onClick={handleNext}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-2.5 font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            Next
            <ArrowRight size={16} />
          </Button>
        ) : onNextStack ? (
          <Button
            variant="gradient"
            type="button"
            onClick={() => {
              updateModuleProgress(currentModule.id, { status: 'completed' })
              onNextStack()
            }}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-2.5 font-semibold rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            Next Track
            <ArrowRight size={16} />
          </Button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate('/learn')}
              className="flex items-center justify-center w-full sm:w-auto gap-2 px-5 py-2.5 rounded-lg"
            >
              Back to Dashboard
            </Button>
            <Button
              variant="gradient"
              type="button"
              onClick={() => {
                updateModuleProgress(currentModule.id, { status: 'completed' })
                navigate('/learn/quiz')
              }}
              className="flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-2.5 font-semibold rounded-lg transition-colors"
            >
              Take the Quiz
              <ArrowRight size={16} />
            </Button>
          </div>
        )}
      </div>

      {PERSONAS.curious.recommendedPath.includes(currentModule.id) && (
        <div className="mt-8 p-6 glass-panel border border-primary/20 bg-primary/5 rounded-xl text-center">
          <h3 className="text-xl font-semibold mb-2">Want to learn more?</h3>
          <p className="text-muted-foreground mb-4">
            Dive deeper into the details with an interactive beginner workshop for this module.
          </p>
          <Button
            variant="ghost"
            onClick={() => navigate(`/learn/${currentModule.id}?diveDeeper=true&tab=workshop`)}
            className="px-6 py-2.5 bg-background border border-border hover:border-primary hover:text-primary transition-all rounded-lg font-medium shadow-sm"
          >
            Dive Deeper
          </Button>
        </div>
      )}
    </div>
  )
}
