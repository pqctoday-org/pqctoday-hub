import React, { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { ModuleItem } from '../ModuleCard'
import { CuriousSummaryBanner } from './CuriousSummaryBanner'
import { useModuleStore } from '../../../store/useModuleStore'

interface CuriousStackCarouselProps {
  modules: ModuleItem[]
}

export const CuriousStackCarousel: React.FC<CuriousStackCarouselProps> = ({ modules }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { updateModuleProgress } = useModuleStore()

  if (!modules || modules.length === 0) return null

  const currentModule = modules[currentIndex] // eslint-disable-line security/detect-object-injection
  const hasNext = currentIndex < modules.length - 1
  const hasPrev = currentIndex > 0

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
        <div>
          <h3 className="text-xl font-bold text-foreground">{currentModule.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{currentModule.description}</p>
        </div>
        <div className="text-xs font-semibold text-muted-foreground px-3 py-1 rounded-full bg-muted border border-border whitespace-nowrap">
          Module {currentIndex + 1} of {modules.length}
        </div>
      </div>

      <CuriousSummaryBanner moduleId={currentModule.id} isFullPage={true} />

      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t border-border mt-2 px-2">
        <button
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
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!hasNext}
          className={`flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-2.5 font-semibold rounded-lg transition-colors ${
            hasNext
              ? 'bg-primary text-black hover:bg-primary/90 shadow-sm cursor-pointer'
              : 'bg-muted text-muted-foreground/40 cursor-not-allowed'
          }`}
        >
          Next
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
