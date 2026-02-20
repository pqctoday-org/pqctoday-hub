import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Zap, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QUIZ_CATEGORIES } from '@/data/quizData'
import { TopicSelector } from './components/TopicSelector'
import type { QuizCategory, QuizMode } from './types'

interface QuizIntroProps {
  previousScores?: Record<string, number>
  onStart: (mode: QuizMode, categories: QuizCategory[]) => void
  quizMetadata?: { filename: string; lastUpdate: Date } | null
  totalQuestions?: number
  quickPoolSize?: number
}

export const QuizIntro: React.FC<QuizIntroProps> = ({
  previousScores,
  onStart,
  quizMetadata,
  totalQuestions,
  quickPoolSize,
}) => {
  const [selectedCategories, setSelectedCategories] = useState<QuizCategory[]>([])

  const handleToggleCategory = (categoryId: QuizCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((c) => c !== categoryId) : [...prev, categoryId]
    )
  }

  const handleStartQuick = () => {
    onStart('quick', [])
  }

  const handleStartFull = () => {
    onStart('full', [])
  }

  const handleStartCategory = () => {
    onStart('category', selectedCategories)
  }

  const fullCount = totalQuestions || 80
  const fullTimeMin = Math.round(fullCount * 0.56)

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl md:text-3xl font-bold mb-2 text-gradient">PQC Knowledge Quiz</h2>
        <p className="text-muted-foreground">
          Test your understanding of post-quantum cryptography across 8 topic areas.
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

      {/* All Topics modes */}
      <div>
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
          All Topics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="glass-panel p-5 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Zap size={20} />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Quick Quiz</h4>
                <p className="text-xs text-muted-foreground">
                  20 questions from {quickPoolSize || '~120'} pool, ~15 min
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4 flex-grow">
              A random sample across all categories with guaranteed topic coverage.
            </p>
            <Button variant="gradient" className="w-full" onClick={handleStartQuick}>
              Start Quick Quiz
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="glass-panel p-5 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                <BookOpen size={20} />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Full Assessment</h4>
                <p className="text-xs text-muted-foreground">
                  {fullCount} questions, ~{fullTimeMin} min
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4 flex-grow">
              Every question in the bank. Comprehensive coverage of all PQC topics.
            </p>
            <Button variant="outline" className="w-full" onClick={handleStartFull}>
              Start Full Assessment
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Topic selection */}
      <div>
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">
          Or Select Topics
        </h3>
        <TopicSelector
          categories={QUIZ_CATEGORIES}
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
            <Button variant="gradient" onClick={handleStartCategory}>
              <Brain size={16} className="mr-2" />
              Start Quiz
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
