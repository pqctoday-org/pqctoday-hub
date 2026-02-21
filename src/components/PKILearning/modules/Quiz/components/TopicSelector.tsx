import React from 'react'
import { motion } from 'framer-motion'
import {
  Shield,
  Layers,
  FileCheck,
  Route,
  Scale,
  Network,
  AlertTriangle,
  Key,
  Bitcoin,
  Lock,
  Award,
  Fingerprint,
  Radio,
} from 'lucide-react'
import clsx from 'clsx'
import type { QuizCategoryMeta, QuizCategory } from '../types'

const iconMap: Record<string, React.ElementType> = {
  Shield,
  Layers,
  FileCheck,
  Route,
  Scale,
  Network,
  AlertTriangle,
  Key,
  Bitcoin,
  Lock,
  Award,
  Fingerprint,
  Radio,
}

interface TopicSelectorProps {
  categories: QuizCategoryMeta[]
  selectedCategories: QuizCategory[]
  onToggleCategory: (categoryId: QuizCategory) => void
  previousScores?: Record<string, number>
}

export const TopicSelector: React.FC<TopicSelectorProps> = ({
  categories,
  selectedCategories,
  onToggleCategory,
  previousScores,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {categories.map((category, index) => {
        const isSelected = selectedCategories.includes(category.id)
        const Icon = iconMap[category.icon] ?? Shield
        const prevScore = previousScores?.[category.id]

        return (
          <motion.button
            key={category.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            onClick={() => onToggleCategory(category.id)}
            className={clsx(
              'glass-panel p-4 text-left transition-all cursor-pointer',
              isSelected
                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                : 'hover:border-secondary/50'
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div
                className={clsx(
                  'p-2 rounded-lg',
                  isSelected ? 'bg-primary/10 text-primary' : 'bg-white/5 text-muted-foreground'
                )}
              >
                <Icon size={18} />
              </div>
              {prevScore !== undefined && (
                <span
                  className={clsx(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    prevScore >= 80
                      ? 'bg-success/10 text-success'
                      : prevScore >= 60
                        ? 'bg-warning/10 text-warning'
                        : 'bg-destructive/10 text-destructive'
                  )}
                >
                  Best: {prevScore}%
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-foreground mb-1">{category.label}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {category.description}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{category.questionCount} questions</p>
          </motion.button>
        )
      })}
    </div>
  )
}
