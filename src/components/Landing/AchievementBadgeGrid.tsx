// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Lock } from 'lucide-react'
import { useAchievementStore } from '@/store/useAchievementStore'
import { ACHIEVEMENT_CATALOG, ACHIEVEMENT_COUNT } from '@/data/achievementCatalog'
import { achievementIconMap } from '@/data/achievementIcons'
import type { AchievementCategory, AchievementRarity } from '@/types/AchievementTypes'

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  consistency: 'Consistency',
  'workshop-depth': 'Depth',
  'cross-feature': 'Exploration',
}

const CATEGORY_ORDER: AchievementCategory[] = ['consistency', 'workshop-depth', 'cross-feature']

const RARITY_RING: Record<AchievementRarity, string> = {
  common: '',
  uncommon: 'ring-1 ring-primary/30',
  rare: 'ring-1 ring-primary/50',
  epic: 'ring-2 ring-primary',
}

export function AchievementBadgeGrid() {
  const unlocked = useAchievementStore((s) => s.unlocked)
  const [tooltip, setTooltip] = useState<string | null>(null)

  const unlockedIds = new Set(unlocked.map((u) => u.id))
  const earnedCount = unlocked.length

  if (earnedCount === 0) return null

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    achievements: ACHIEVEMENT_CATALOG.filter((a) => a.category === cat),
  }))

  return (
    <div className="mt-3 pt-3 border-t border-border/50">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Achievements
        </p>
        <p className="text-[10px] text-muted-foreground">
          {earnedCount}/{ACHIEVEMENT_COUNT}
        </p>
      </div>

      <div className="space-y-1.5">
        {grouped.map(({ category, label, achievements }) => {
          const catEarned = achievements.filter((a) => unlockedIds.has(a.id)).length
          if (catEarned === 0 && achievements.every((a) => a.secret)) return null

          return (
            <div key={category} className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-muted-foreground w-16 shrink-0 truncate">
                {label}
              </span>
              <div className="flex flex-wrap gap-1">
                {achievements.map((achievement) => {
                  const isEarned = unlockedIds.has(achievement.id)
                  const isSecret = achievement.secret && !isEarned
                  const IconComponent = isSecret ? Lock : achievementIconMap[achievement.icon]

                  return (
                    <div
                      key={achievement.id}
                      className="relative"
                      onMouseEnter={() =>
                        setTooltip(
                          isSecret
                            ? `${achievement.id}: ???`
                            : `${achievement.title}: ${achievement.description}`
                        )
                      }
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <div
                        className={`p-1 rounded transition-all ${
                          isEarned
                            ? `bg-primary/15 ${RARITY_RING[achievement.rarity]}`
                            : 'opacity-25'
                        }`}
                        title={
                          isSecret ? '???' : `${achievement.title}: ${achievement.description}`
                        }
                      >
                        {IconComponent && (
                          <IconComponent
                            size={13}
                            className={isEarned ? 'text-primary' : 'text-muted-foreground'}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Screen-reader summary */}
      <p className="sr-only">
        {earnedCount} of {ACHIEVEMENT_COUNT} achievements earned. {tooltip}
      </p>
    </div>
  )
}
