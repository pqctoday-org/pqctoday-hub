// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, ArrowRight, BarChart3, Layers } from 'lucide-react'
import type { RoleGuideData, SkillLevel } from './types'
import { Button } from '@/components/ui/button'

const LEVEL_ORDER: SkillLevel[] = ['none', 'basic', 'intermediate', 'advanced']

const LEVEL_LABELS: Record<SkillLevel, string> = {
  none: 'None',
  basic: 'Basic',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

const LEVEL_COLORS: Record<SkillLevel, string> = {
  none: 'bg-status-error/15 text-status-error border-status-error/30',
  basic: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  intermediate: 'bg-primary/15 text-primary border-primary/30',
  advanced: 'bg-status-success/15 text-status-success border-status-success/30',
}

const TARGET_COLORS: Record<string, string> = {
  basic: 'text-status-warning',
  intermediate: 'text-primary',
  advanced: 'text-status-success',
}

interface Props {
  data: RoleGuideData
  onComplete?: () => void
}

export const RoleWhatToLearn: React.FC<Props> = ({ data }) => {
  const [ratings, setRatings] = useState<Record<string, SkillLevel>>(() => {
    const init: Record<string, SkillLevel> = {}
    for (const skill of data.skillGaps) {
      init[skill.id] = 'none'
    }
    return init
  })

  const setRating = (skillId: string, level: SkillLevel) => {
    setRatings((prev) => ({ ...prev, [skillId]: level }))
  }

  const gapSummary = useMemo(() => {
    let totalGap = 0
    let maxGap = 0
    for (const skill of data.skillGaps) {
      const current = LEVEL_ORDER.indexOf(ratings[skill.id] || 'none')
      const target = LEVEL_ORDER.indexOf(skill.targetLevel)
      const gap = Math.max(0, target - current)
      totalGap += gap
      maxGap += target
    }
    return {
      percentage: maxGap > 0 ? Math.round(((maxGap - totalGap) / maxGap) * 100) : 100,
      criticalGaps: data.skillGaps.filter((s) => {
        const current = LEVEL_ORDER.indexOf(ratings[s.id] || 'none')
        const target = LEVEL_ORDER.indexOf(s.targetLevel)
        return target - current >= 2
      }),
    }
  }, [ratings, data.skillGaps])

  // Group skills by category
  const groupedSkills = useMemo(() => {
    const groups: Record<string, typeof data.skillGaps> = {}
    for (const skill of data.skillGaps) {
      if (!groups[skill.category]) groups[skill.category] = []
      groups[skill.category].push(skill)
    }
    return Object.entries(groups)
  }, [data.skillGaps])

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Gap Summary */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" />
            Skills Readiness
          </h3>
          <span className="text-2xl font-bold text-primary">{gapSummary.percentage}%</span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${gapSummary.percentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Rate your current knowledge level for each skill below. The readiness score updates as you
          self-assess.
        </p>
        {gapSummary.criticalGaps.length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-status-error/5 border border-status-error/20">
            <p className="text-xs font-medium text-status-error">
              {gapSummary.criticalGaps.length} critical gap
              {gapSummary.criticalGaps.length !== 1 ? 's' : ''} detected:{' '}
              {gapSummary.criticalGaps.map((s) => s.skill).join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Skills Gap Table */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <BookOpen size={18} className="text-primary" />
          Self-Rate Your Knowledge
        </h3>

        {groupedSkills.map(([category, skills]) => (
          <div key={category} className="mb-6">
            <h4 className="text-sm font-bold text-foreground/90 uppercase tracking-wide mb-3">
              {category}
            </h4>
            <div className="space-y-3">
              {skills.map((skill) => {
                const currentLevel = ratings[skill.id] || 'none'
                return (
                  <div key={skill.id} className="glass-panel p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{skill.skill}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TARGET_COLORS[skill.targetLevel] || 'text-muted-foreground'}`}
                          >
                            Target: {LEVEL_LABELS[skill.targetLevel]}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{skill.description}</p>
                      </div>
                    </div>

                    {/* Rating buttons */}
                    <div className="flex flex-wrap gap-2">
                      {LEVEL_ORDER.map((level) => (
                        <Button
                          variant="ghost"
                          key={level}
                          onClick={() => setRating(skill.id, level)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                            currentLevel === level
                              ? LEVEL_COLORS[level]
                              : 'border-border text-muted-foreground hover:bg-muted/50'
                          }`}
                        >
                          {LEVEL_LABELS[level]}
                        </Button>
                      ))}
                    </div>

                    {/* Linked modules */}
                    {skill.linkedModules.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {skill.linkedModules.map((mod) => (
                          <Link
                            key={mod.id}
                            to={`/learn/${mod.id}`}
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                          >
                            <ArrowRight size={10} />
                            {mod.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Recommended Learning Domains */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Layers size={18} className="text-primary" />
          Recommended Learning Path
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.knowledgeDomains.map((domain, idx) => (
            <div key={domain.name} className="glass-panel p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <h4 className="text-sm font-semibold text-foreground">{domain.name}</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{domain.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {domain.modules.map((mod) => (
                  <Link
                    key={mod.id}
                    to={`/learn/${mod.id}`}
                    className="px-2 py-1 text-[11px] rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    {mod.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
