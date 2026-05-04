// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Zap, Clock, Sparkles, Building2, X } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { TopicSelector } from './components/TopicSelector'
import type { QuizCategory, QuizMode, QuizCategoryMeta } from './types'

const SECONDS_PER_QUESTION = 45
const QUICK_POOL_THRESHOLD_MIN = 15

const DIFFICULTY_OPTIONS = [
  { id: 'beginner', label: 'Beginner', color: 'text-status-success', bg: 'bg-status-success' },
  {
    id: 'intermediate',
    label: 'Intermediate',
    color: 'text-status-warning',
    bg: 'bg-status-warning',
  },
  { id: 'advanced', label: 'Advanced', color: 'text-destructive', bg: 'bg-destructive' },
] as const

interface QuizIntroProps {
  previousScores?: Record<string, number>
  onStart: (mode: QuizMode, categories: QuizCategory[], timeMinutes?: number) => void
  quizMetadata?: { filename: string; lastUpdate: Date } | null
  totalPoolSize?: number
  quickPoolSize?: number
  categories: QuizCategoryMeta[]
  /** Pre-selected categories based on the active learning persona */
  initialCategories?: QuizCategory[]
  /** Label of the active persona for the suggestion banner */
  personaLabel?: string
  /** Active industry filter from persona store (null = no filter) */
  industryFilter: string | null
  onClearIndustryFilter: () => void
  selectedDifficulties: string[]
  onToggleDifficulty: (difficulty: string) => void
}

export const QuizIntro: React.FC<QuizIntroProps> = ({
  previousScores,
  onStart,
  quizMetadata,
  totalPoolSize,
  quickPoolSize,
  categories,
  initialCategories,
  personaLabel,
  industryFilter,
  onClearIndustryFilter,
  selectedDifficulties,
  onToggleDifficulty,
}) => {
  const [selectedCategories, setSelectedCategories] = useState<QuizCategory[]>(
    initialCategories ?? []
  )
  const [timeMinutes, setTimeMinutes] = useState(15)

  const questionCount = Math.round((timeMinutes * 60) / SECONDS_PER_QUESTION)
  const isQuickPool = timeMinutes <= QUICK_POOL_THRESHOLD_MIN
  const activePoolSize = isQuickPool ? quickPoolSize || 0 : totalPoolSize || 0

  const handleToggleCategory = (categoryId: QuizCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((c) => c !== categoryId) : [...prev, categoryId]
    )
  }

  const handleStartTimed = () => {
    onStart('timed', [], timeMinutes)
  }

  const handleQuickPick = () => {
    setTimeMinutes(5)
  }

  const handleStartCategory = () => {
    onStart('category', selectedCategories)
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gradient">PQC Knowledge Quiz</h2>
        <p className="text-muted-foreground">
          Test your understanding of post-quantum cryptography across {categories.length} topic
          areas.
        </p>
        {quizMetadata && (
          <div className="hidden lg:flex items-center justify-center gap-3 text-[10px] md:text-xs text-muted-foreground/60 mt-3 font-mono">
            <p>
              Data Source: {quizMetadata.filename} • Updated:{' '}
              {quizMetadata.lastUpdate.toLocaleDateString()}
            </p>
          </div>
        )}
      </motion.div>

      {/* Industry filter banner */}
      {industryFilter && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-3 flex items-center justify-between bg-primary/5 border-primary/30"
        >
          <span className="flex items-center gap-2 text-sm text-foreground">
            <Building2 size={16} className="text-primary" />
            Quiz filtered for: <span className="font-semibold">{industryFilter}</span>
          </span>
          <Button
            variant="ghost"
            onClick={onClearIndustryFilter}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
            Clear
          </Button>
        </motion.div>
      )}

      {/* Time-based quiz selection */}
      <div>
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
          All Topics
        </h3>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="glass-panel p-5"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Clock size={20} />
            </div>
            <div>
              <h4 className="font-bold text-foreground">How much time do you have?</h4>
              <p className="text-xs text-muted-foreground">
                We&apos;ll pick the right number of questions
              </p>
            </div>
          </div>

          {/* Time slider */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>5 min</span>
              <span className="text-sm font-semibold text-foreground">{timeMinutes} min</span>
              <span>45 min</span>
            </div>
            <input
              type="range"
              min={5}
              max={45}
              step={5}
              value={timeMinutes}
              onChange={(e) => setTimeMinutes(Number(e.target.value))}
              data-workshop-target="quiz-duration-slider"
              className="w-full accent-primary h-2 rounded-lg cursor-pointer"
              aria-label="Quiz duration in minutes"
              aria-valuemin={5}
              aria-valuemax={45}
              aria-valuenow={timeMinutes}
              aria-valuetext={`${timeMinutes} minutes, ${questionCount} questions`}
            />
          </div>

          {/* Live readout */}
          <p className="text-sm text-muted-foreground mb-5 text-center">
            <span className="font-semibold text-foreground">{questionCount} questions</span>
            {' from '}
            {activePoolSize > 0 ? activePoolSize : '...'} pool
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleQuickPick} className="gap-1.5">
              <Zap size={14} />
              Quick Pick (5 min)
            </Button>
            <div className="flex-grow" />
            <Button
              variant="gradient"
              onClick={handleStartTimed}
              data-action="start-quiz-timed"
              data-workshop-target="quiz-start-timed"
            >
              Start Quiz
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Difficulty filter */}
      <div data-workshop-target="quiz-difficulty-row">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
          Difficulty
        </h3>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTY_OPTIONS.map((opt) => {
            const isActive = selectedDifficulties.includes(opt.id)
            return (
              <Button
                variant="ghost"
                key={opt.id}
                onClick={() => onToggleDifficulty(opt.id)}
                data-workshop-target={`quiz-difficulty-${opt.id}`}
                className={clsx(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all border',
                  isActive
                    ? `${opt.bg}/15 ${opt.color} border-current`
                    : 'bg-muted/30 text-muted-foreground border-transparent opacity-50'
                )}
              >
                {opt.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Topic selection */}
      <div data-workshop-target="quiz-topic-grid">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            {initialCategories && initialCategories.length > 0
              ? 'Select Topics'
              : 'Or Select Topics'}
          </h3>
          {personaLabel && initialCategories && initialCategories.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <Sparkles size={12} />
              Filtered for {personaLabel}
            </span>
          )}
        </div>
        <TopicSelector
          categories={categories}
          selectedCategories={selectedCategories}
          onToggleCategory={handleToggleCategory}
          previousScores={previousScores}
        />

        {selectedCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center justify-between"
          >
            <span className="text-sm text-muted-foreground">
              {selectedCategories.length} topic{selectedCategories.length > 1 ? 's' : ''} selected
            </span>
            <Button
              variant="gradient"
              onClick={handleStartCategory}
              data-action="start-quiz-category"
              data-workshop-target="quiz-start-category"
            >
              <Brain size={16} className="mr-2" />
              Start Quiz
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
