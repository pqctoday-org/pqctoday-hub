// SPDX-License-Identifier: GPL-3.0-only
import { useRef, useState } from 'react'
import { Info, Lock } from 'lucide-react'
import { useAchievementStore } from '@/store/useAchievementStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { ACHIEVEMENT_CATALOG, ACHIEVEMENT_COUNT } from '@/data/achievementCatalog'
import { PERSONA_EXCLUDED_ACHIEVEMENTS } from '@/data/personaConfig'
import { achievementIconMap } from '@/data/achievementIcons'
import type { AchievementCategory, AchievementRarity } from '@/types/AchievementTypes'
import { Button } from '@/components/ui/button'

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  consistency: 'Consistency',
  'workshop-depth': 'Depth',
  'cross-feature': 'Exploration',
  business: 'Business',
}

const CATEGORY_INFO: Record<AchievementCategory, string> = {
  consistency:
    'Build learning streaks by visiting on consecutive days, reach visit milestones (10–100 days), and discover a secret comeback badge.',
  'workshop-depth':
    'Complete workshop steps and modules, finish a full track, generate keys and certificates, spend 30+ min in a module, and answer quiz questions.',
  'cross-feature':
    'Use the Playground, chat with the PQC Assistant, complete an assessment, explore compliance frameworks, plan migrations, and visit 5+ sections.',
  business:
    'Use Command Center tools including ROI calculators, policy generators, audit checklists, and governance builders.',
}

const CATEGORY_ORDER: AchievementCategory[] = [
  'consistency',
  'workshop-depth',
  'cross-feature',
  'business',
]

const RARITY_RING: Record<AchievementRarity, string> = {
  common: '',
  uncommon: 'ring-1 ring-primary/30',
  rare: 'ring-1 ring-primary/50',
  epic: 'ring-2 ring-primary',
}

function CategoryInfoButton({ category }: { category: AchievementCategory }) {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const show = () => {
    clearTimeout(timeoutRef.current)
    setOpen(true)
  }
  const hide = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <Button
        variant="ghost"
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center -m-4 p-4 text-muted-foreground/50 hover:text-primary transition-colors"
        aria-label={`How to earn ${CATEGORY_LABELS[category]} badges`}
      >
        <Info size={10} />
      </Button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-52 rounded-md border border-border bg-card p-2 shadow-lg text-[10px] text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground mb-0.5">{CATEGORY_LABELS[category]} badges</p>
          {/* eslint-disable-next-line security/detect-object-injection */}
          <p>{CATEGORY_INFO[category]}</p>
        </div>
      )}
    </div>
  )
}

export function AchievementBadgeGrid() {
  const unlocked = useAchievementStore((s) => s.unlocked)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const [tooltip, setTooltip] = useState<string | null>(null)

  const unlockedIds = new Set(unlocked.map((u) => u.id))
  // eslint-disable-next-line security/detect-object-injection
  const excludedIds = new Set(selectedPersona ? PERSONA_EXCLUDED_ACHIEVEMENTS[selectedPersona] : [])
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
              <span className="text-[9px] font-mono text-muted-foreground shrink-0 flex items-center gap-1 w-[72px]">
                <CategoryInfoButton category={category} />
                {label}
              </span>
              <div className="flex flex-wrap gap-1">
                {achievements.map((achievement) => {
                  const isEarned = unlockedIds.has(achievement.id)
                  const isSecret = achievement.secret && !isEarned
                  const isExcluded = excludedIds.has(achievement.id) && !isEarned
                  const IconComponent = isSecret ? Lock : achievementIconMap[achievement.icon]

                  return (
                    <div
                      key={achievement.id}
                      className="relative"
                      onMouseEnter={() =>
                        setTooltip(
                          isSecret
                            ? `${achievement.id}: ???`
                            : isExcluded
                              ? `${achievement.title}: Not available for this path`
                              : `${achievement.title}: ${achievement.description}`
                        )
                      }
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <div
                        className={`p-1 rounded transition-all ${
                          isEarned
                            ? `bg-primary/15 ${RARITY_RING[achievement.rarity]}`
                            : isExcluded
                              ? 'opacity-10'
                              : 'opacity-25'
                        }`}
                        title={
                          isSecret
                            ? '???'
                            : isExcluded
                              ? `${achievement.title}: Not available for this path`
                              : `${achievement.title}: ${achievement.description}`
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
