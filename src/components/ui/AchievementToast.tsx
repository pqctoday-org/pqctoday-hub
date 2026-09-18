// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useAchievementStore } from '@/store/useAchievementStore'
import { ACHIEVEMENT_MAP } from '@/data/achievementCatalog'
import { achievementIconMap } from '@/data/achievementIcons'
import type { AchievementRarity } from '@/types/AchievementTypes'
import { Button } from '@/components/ui/button'
import { useIsEmbedded } from '@/embed/EmbedProvider'

const RARITY_STYLES: Record<AchievementRarity, string> = {
  common: 'border-border',
  uncommon: 'border-primary/40',
  rare: 'border-primary/60 shadow-lg shadow-primary/15',
  epic: 'border-primary shadow-lg shadow-primary/25',
}

const RARITY_LABELS: Record<AchievementRarity, string> = {
  common: 'Achievement Unlocked',
  uncommon: 'Achievement Unlocked',
  rare: 'Rare Achievement',
  epic: 'Epic Achievement',
}

export function AchievementToast() {
  const isEmbedded = useIsEmbedded()
  const dequeueToast = useAchievementStore((s) => s.dequeueToast)
  const markSeen = useAchievementStore((s) => s.markSeen)
  const toastQueue = useAchievementStore((s) => s.toastQueue)

  const [currentId, setCurrentId] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Dequeue next toast when current one is absent
  useEffect(() => {
    if (currentId || toastQueue.length === 0) return

    // Don't show during guided tour
    let tourCompleted = false
    try {
      tourCompleted = !!localStorage.getItem('pqc-tour-completed')
    } catch {
      // Assume tour not done — suppress
    }
    if (!tourCompleted) return

    const timer = setTimeout(() => {
      const next = dequeueToast()
      if (next) {
        setCurrentId(next)
        setIsVisible(true)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [currentId, toastQueue.length, dequeueToast])

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (!isVisible || !currentId) return
    const timer = setTimeout(() => handleDismiss(), 5000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, currentId])

  const handleDismiss = useCallback(() => {
    if (currentId) {
      markSeen(currentId)
    }
    setIsVisible(false)
    // After exit animation, allow next toast
    setTimeout(() => setCurrentId(null), 400)
  }, [currentId, markSeen])

  const achievement = currentId ? ACHIEVEMENT_MAP[currentId] : null
  if (!achievement) return null

  const IconComponent = achievementIconMap[achievement.icon]
  const rarityStyle = RARITY_STYLES[achievement.rarity]
  const rarityLabel = RARITY_LABELS[achievement.rarity]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          // Wave A (2026-09-18): slide, don't fade. The toast auto-dismisses at
          // 5 s, so any accessibility pass that samples the page around then
          // catches its text at partial opacity — the round-8 sweep logged
          // "Achievement Unlocked" at 1.1–3.7:1 on 16 playground tools, none of
          // them a real defect. A transform-only motion keeps the text at full
          // contrast for its whole life; the panel leaves through the bottom
          // edge instead of dissolving.
          initial={{ y: 96, scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 160, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`${isEmbedded ? 'absolute' : 'fixed'} bottom-6 left-4 right-4 md:right-auto md:left-6 z-toast max-w-xs print:hidden`}
          role="status"
          aria-live="polite"
          aria-label={`Achievement unlocked: ${achievement.title}`}
        >
          <div className={`glass-panel p-4 border ${rarityStyle}`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/20 shrink-0">
                {IconComponent && <IconComponent size={20} className="text-primary" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-0.5">
                  {rarityLabel}
                </p>
                <p className="text-sm font-bold text-foreground">{achievement.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{achievement.description}</p>
              </div>

              <Button
                variant="ghost"
                onClick={handleDismiss}
                className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label="Dismiss achievement notification"
              >
                <X size={14} />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
