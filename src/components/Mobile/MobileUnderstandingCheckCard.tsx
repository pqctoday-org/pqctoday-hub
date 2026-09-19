// SPDX-License-Identifier: GPL-3.0-only
/** Round 9, wave 2 (2026-09-19) — phone twin of shared/UnderstandingCheckCard (same data, mobile chrome). */
import { Link } from 'react-router'
import { GraduationCap, ArrowRight } from 'lucide-react'
import { quizCategories } from '@/data/quizDataLoader'

export function MobileUnderstandingCheckCard({
  moduleId,
  moduleTitle,
}: {
  moduleId: string
  moduleTitle: string
}) {
  const cat = quizCategories.find((c) => c.id === moduleId)
  if (!cat || cat.questionCount === 0) return null
  return (
    <section
      aria-label="Check your understanding"
      data-testid="understanding-check"
      className="rounded-xl border border-border bg-card p-3.5"
    >
      <div className="flex items-center gap-2">
        <GraduationCap size={15} className="shrink-0 text-primary" aria-hidden="true" />
        <h2 className="text-[13px] font-semibold text-foreground">Check your understanding</h2>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {cat.questionCount} {cat.questionCount === 1 ? 'question' : 'questions'} on {moduleTitle},
        with answers.
      </p>
      <Link
        to={`/learn/quiz?category=${moduleId}`}
        className="mt-1.5 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-primary"
      >
        Take the quiz
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </section>
  )
}
