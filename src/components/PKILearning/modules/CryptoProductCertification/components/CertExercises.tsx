// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
/**
 * Exercises tab. Aggregates every owner data file's `exercises` (build spec
 * §4), keeps the ones on the learner's active path (useLearnPathFilter —
 * untagged items are shared), and opens the exercise's workshop step with its
 * optional pre-fill. Authors add exercises in their own data file only.
 */
import { ArrowRight, BookOpen, Play } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useLearnPathFilter } from '@/components/PKILearning/common/useLearnPath'
import { OptionalReferenceBadge } from '@/components/PKILearning/common/LearnPathPicker'
import { ALL_EXERCISES } from '../data/allExercises'
import { EmptyState } from '@/components/ui/empty-state'

interface CertExercisesProps {
  onOpenStep: (stepId: string, config?: Record<string, unknown>) => void
}

export const CertExercises = ({ onOpenStep }: CertExercisesProps) => {
  const navigate = useNavigate()
  const visible = useLearnPathFilter(ALL_EXERCISES)

  return (
    <div className="w-full space-y-6">
      <div className="glass-panel p-6">
        <h2 className="mb-2 text-xl font-bold text-gradient">Guided Exercises</h2>
        <p className="text-sm text-muted-foreground">
          Each exercise opens a workshop step. Only the exercises for your learning path are shown;
          pick &quot;All sections&quot; in the path picker to see every path.
        </p>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No exercises on this path"
          description="Pick “All sections” in the path picker to see every exercise."
        />
      ) : (
        <div className="space-y-4">
          {visible.map((exercise, i) => (
            <div key={exercise.id} className="glass-panel p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">
                      {i + 1}. {exercise.title}
                    </h3>
                    {exercise.optional ? <OptionalReferenceBadge /> : null}
                  </div>
                  <p className="mb-2 text-sm text-foreground/80">{exercise.description}</p>
                  <p className="text-xs text-muted-foreground">
                    <strong>What to observe:</strong> {exercise.observe}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => onOpenStep(exercise.stepId, exercise.config)}
                  className="shrink-0"
                >
                  <Play size={14} className="mr-2" aria-hidden="true" /> Load &amp; Run
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="glass-panel p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="shrink-0 text-primary" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the PQC quiz to check what you have learned.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/learn/quiz')}>
            Take Quiz <ArrowRight size={14} className="ml-2" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
