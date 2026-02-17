import React from 'react'
import { ExternalLink, Landmark, Building2 } from 'lucide-react'
import type { MigrationReference } from '../../types/MigrateTypes'

interface MigrationReferencesProps {
  references: MigrationReference[]
}

export const MigrationReferences: React.FC<MigrationReferencesProps> = ({ references }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Authoritative Frameworks</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {references.map((ref) => (
          <a
            key={ref.name}
            href={ref.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-lg bg-card hover:bg-muted/50 transition-colors border border-border group"
            title={ref.description}
          >
            <div className="flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
              {ref.type === 'Government' ? <Landmark size={16} /> : <Building2 size={16} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-foreground truncate">
                {ref.organization}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">{ref.name}</div>
            </div>
            <ExternalLink
              size={12}
              className="flex-shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors"
            />
          </a>
        ))}
      </div>
    </div>
  )
}
