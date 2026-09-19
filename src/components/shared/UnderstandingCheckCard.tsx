// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 2 (2026-09-19) — "Check your understanding" on a module,
 * rendered whether or not the module is completed. The quiz handoff existed
 * only inside the completion footer, so a reader who had not pressed
 * Complete Module never saw that a question set with answers existed for the
 * module they were on (59 of 65 module ids are quiz categories). Nothing
 * renders for a module with no category or no questions.
 */
import { Link } from 'react-router'
import { GraduationCap, ArrowRight } from 'lucide-react'
import { quizCategories } from '@/data/quizDataLoader'
import { cn } from '@/lib/utils'

interface UnderstandingCheckCardProps {
  moduleId: string
  moduleTitle: string
  className?: string
}

export function UnderstandingCheckCard({
  moduleId,
  moduleTitle,
  className,
}: UnderstandingCheckCardProps) {
  const cat = quizCategories.find((c) => c.id === moduleId)
  if (!cat || cat.questionCount === 0) return null
  return (
    <section
      aria-label="Check your understanding"
      data-testid="understanding-check"
      className={cn('rounded-xl border border-border bg-card p-4 sm:p-5', className)}
    >
      <div className="flex items-center gap-2">
        <GraduationCap size={18} className="shrink-0 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-foreground">Check your understanding</h2>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {cat.questionCount} {cat.questionCount === 1 ? 'question' : 'questions'} on {moduleTitle},
        each with its answer and the reason.
      </p>
      <Link
        to={`/learn/quiz?category=${moduleId}`}
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Take the quiz
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </section>
  )
}
