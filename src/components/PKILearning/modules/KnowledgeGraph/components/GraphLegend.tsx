// SPDX-License-Identifier: GPL-3.0-only

import { ENTITY_CONFIG } from './nodes/EntityNode'
import type { EntityType } from '../data/graphTypes'

interface GraphLegendProps {
  visibleTypes?: EntityType[]
  hiddenTypes?: Set<EntityType>
  onToggleType?: (type: EntityType) => void
}

const TYPE_LABELS: Record<EntityType, string> = {
  library: 'Library Standards',
  compliance: 'Compliance Frameworks',
  timeline: 'Timeline Events',
  threat: 'Threats',
  software: 'Software Products',
  certification: 'Certifications',
  leader: 'Industry Leaders',
  glossary: 'Glossary Terms',
  module: 'Learning Modules',
  quiz: 'Quiz Categories',
  country: 'Countries',
  source: 'Authoritative Sources',
  algorithm: 'Algorithms',
  track: 'Learning Tracks',
  persona: 'Learning Personas',
}

export function GraphLegend({ visibleTypes, hiddenTypes, onToggleType }: GraphLegendProps) {
  const types = visibleTypes ?? (Object.keys(ENTITY_CONFIG) as EntityType[])

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[10px]">
      {types.map((type) => {
        const config = ENTITY_CONFIG[type]
        const Icon = config.icon
        const isHidden = hiddenTypes?.has(type) ?? false
        const label = TYPE_LABELS[type]

        if (onToggleType) {
          return (
            <button
              key={type}
              onClick={() => onToggleType(type)}
              title={isHidden ? `Show ${label}` : `Hide ${label}`}
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 min-h-[32px] transition-opacity cursor-pointer hover:bg-muted/50 ${
                isHidden ? 'opacity-35' : 'opacity-100'
              }`}
            >
              <Icon className={`w-3 h-3 ${config.text}`} />
              <span className="text-muted-foreground">{label}</span>
            </button>
          )
        }

        return (
          <div key={type} className="flex items-center gap-1">
            <Icon className={`w-3 h-3 ${config.text}`} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        )
      })}
    </div>
  )
}
