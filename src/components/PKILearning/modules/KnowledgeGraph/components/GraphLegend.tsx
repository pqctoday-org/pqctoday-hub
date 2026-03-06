// SPDX-License-Identifier: GPL-3.0-only

import { ENTITY_CONFIG } from './nodes/EntityNode'
import type { EntityType } from '../data/graphTypes'

interface GraphLegendProps {
  visibleTypes?: EntityType[]
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
}

export function GraphLegend({ visibleTypes }: GraphLegendProps) {
  const types = visibleTypes ?? (Object.keys(ENTITY_CONFIG) as EntityType[])

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px]">
      {types.map((type) => {
        const config = ENTITY_CONFIG[type]
        const Icon = config.icon
        return (
          <div key={type} className="flex items-center gap-1">
            <Icon className={`w-3 h-3 ${config.text}`} />
            <span className="text-muted-foreground">{TYPE_LABELS[type]}</span>
          </div>
        )
      })}
    </div>
  )
}
