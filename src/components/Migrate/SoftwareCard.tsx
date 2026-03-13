// SPDX-License-Identifier: GPL-3.0-only
import { motion } from 'framer-motion'
import { ExternalLink, EyeOff, CheckSquare, Square } from 'lucide-react'
import type { SoftwareItem } from '../../types/MigrateTypes'
import { LAYERS } from './InfrastructureStack'
import { renderFipsStatus, renderPqcSupport } from './migrateHelpers'
import { AskAssistantButton } from '../ui/AskAssistantButton'

interface SoftwareCardProps {
  item: SoftwareItem
  index?: number
  onHide?: (key: string) => void
  isSelected?: boolean
  onToggleSelect?: (key: string) => void
}

const PRIORITY_COLORS: Record<string, string> = {
  Critical: 'text-status-error',
  High: 'text-status-warning',
  Medium: 'text-primary',
  Low: 'text-muted-foreground',
}

export const SoftwareCard = ({
  item,
  index = 0,
  onHide,
  isSelected,
  onToggleSelect,
}: SoftwareCardProps) => {
  const key = `${item.softwareName}::${item.categoryId}`

  // Find the primary layer (first in comma-separated list)
  const layerIds = item.infrastructureLayer.split(',').map((l) => l.trim())
  const primaryLayer = LAYERS.find((l) => layerIds.includes(l.id))
  const LayerIcon = primaryLayer?.icon

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="glass-panel p-5 flex flex-col h-full hover:border-secondary/50 transition-colors bg-card/50 relative"
    >
      {/* Top row: layer badge + status + hide */}
      <div className="flex items-center gap-2 mb-3">
        {primaryLayer && LayerIcon && (
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/20 border ${primaryLayer.borderColor} ${primaryLayer.iconColor} text-xs`}
            title={layerIds.map((id) => LAYERS.find((l) => l.id === id)?.label ?? id).join(', ')}
          >
            <LayerIcon size={12} />
            <span className="hidden sm:inline">{primaryLayer.label}</span>
          </div>
        )}

        {item.status && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${
              item.status === 'New'
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-status-warning/10 text-status-warning border-status-warning/20'
            }`}
          >
            {item.status}
          </span>
        )}

        {onHide && (
          <button
            type="button"
            aria-label="Hide this product"
            onClick={() => onHide(key)}
            className="ml-auto p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <EyeOff size={14} />
          </button>
        )}
      </div>

      {/* Product name + version */}
      <h3 className="text-sm font-semibold text-foreground mb-0.5 leading-snug line-clamp-2">
        {item.softwareName}
      </h3>
      {item.latestVersion && (
        <span className="text-xs text-muted-foreground mb-1">{item.latestVersion}</span>
      )}
      <span className="text-xs text-muted-foreground/70 mb-3">{item.categoryName}</span>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {renderPqcSupport(item.pqcSupport)}
        {renderFipsStatus(item.fipsValidated)}
      </div>

      {/* Metadata */}
      <div className="text-xs text-muted-foreground space-y-1 mb-3">
        {item.license && (
          <p>
            License: <span className="text-foreground">{item.license}</span>
          </p>
        )}
        {item.pqcMigrationPriority && (
          <p>
            Priority:{' '}
            <span
              className={`font-medium ${PRIORITY_COLORS[item.pqcMigrationPriority] ?? 'text-muted-foreground'}`}
            >
              {item.pqcMigrationPriority}
            </span>
          </p>
        )}
        {item.primaryPlatforms && (
          <p className="line-clamp-1">
            Platforms: <span className="text-foreground">{item.primaryPlatforms}</span>
          </p>
        )}
      </div>

      {/* Footer: links + select */}
      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border">
        {item.repositoryUrl && (
          <a
            href={item.repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:text-primary/80 text-xs transition-colors"
            aria-label={`Open ${item.softwareName} repository`}
          >
            <ExternalLink size={12} /> Repo
          </a>
        )}
        <AskAssistantButton
          variant="text"
          label="Ask"
          question={`What PQC algorithms does ${item.softwareName} support${item.categoryName ? ` (${item.categoryName})` : ''}?${item.pqcCapabilityDescription ? ` Capabilities: ${item.pqcCapabilityDescription}` : ''}${item.fipsValidated && item.fipsValidated !== 'No' ? ` FIPS status: ${item.fipsValidated}.` : ''}`}
        />

        {onToggleSelect && (
          <button
            type="button"
            aria-label={isSelected ? 'Remove from My Products' : 'Add to My Products'}
            onClick={() => onToggleSelect(key)}
            className={`ml-auto p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded transition-colors ${
              isSelected
                ? 'text-primary hover:text-primary/80'
                : 'text-muted-foreground/40 hover:text-primary'
            }`}
          >
            {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
          </button>
        )}
      </div>
    </motion.article>
  )
}
