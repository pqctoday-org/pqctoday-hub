// SPDX-License-Identifier: GPL-3.0-only
import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  AlertTriangle,
  ExternalLink,
  EyeOff,
  CheckSquare,
  Square,
  Scale,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { SoftwareItem } from '../../types/MigrateTypes'
import { LAYERS } from './InfrastructureStack'
import { CertBadges, renderFipsStatus, renderPqcSupport, renderQuantumTech } from './migrateHelpers'
import { certsByProduct } from '../../data/certificationXrefData'
import { AskAssistantButton } from '../ui/AskAssistantButton'
import { UpdateProductButton } from '../ui/UpdateProductButton'
import { buildProductUpdateUrl } from '@/utils/endorsement'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { TrustScoreBadge } from '@/components/ui/TrustScoreBadge'

interface SoftwareCardProps {
  item: SoftwareItem
  index?: number
  onHide?: (key: string) => void
  isSelected?: boolean
  onToggleSelect?: (key: string) => void
  isCompared?: boolean
  onToggleCompare?: (key: string) => void
  maxCompareReached?: boolean
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
  isCompared,
  onToggleCompare,
  maxCompareReached,
}: SoftwareCardProps) => {
  const { migrateBookmarks, toggleMigrateBookmark } = useBookmarkStore()
  const isBookmarked = migrateBookmarks.includes(item.softwareName)
  const key = `${item.softwareName}::${item.categoryId}`
  const [isExpandedMobile, setIsExpandedMobile] = useState(false)

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

        <div className="ml-auto flex items-center">
          <button
            type="button"
            aria-label={
              isBookmarked
                ? `Remove ${item.softwareName} bookmark`
                : `Bookmark ${item.softwareName}`
            }
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark for quick access'}
            onClick={() => toggleMigrateBookmark(item.softwareName)}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded transition-colors"
          >
            {isBookmarked ? (
              <BookmarkCheck size={14} className="text-primary" />
            ) : (
              <Bookmark size={14} className="text-muted-foreground/40 hover:text-primary" />
            )}
          </button>
          {onHide && (
            <button
              type="button"
              aria-label="Hide this product"
              title="Hide this product"
              onClick={() => onHide(key)}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <EyeOff size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Product name + version */}
      <h3 className="text-sm font-semibold text-foreground mb-0.5 leading-snug line-clamp-2">
        {item.softwareName}
      </h3>
      {item.latestVersion && (
        <span className="text-xs text-muted-foreground mb-1">{item.latestVersion}</span>
      )}
      <span className="text-xs text-muted-foreground/70 mb-3">{item.categoryName}</span>

      {/* Badges row & Metadata */}
      <div className="flex flex-col mb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Always visible on mobile and desktop */}
          <TrustScoreBadge resourceType="migrate" resourceId={item.softwareName} size="sm" />
          {renderPqcSupport(item.pqcSupport)}
          
          {/* Progressively Disclosed on Mobile */}
          <div className={`flex flex-wrap items-center gap-2 ${isExpandedMobile ? 'flex' : 'hidden md:flex'}`}>
            {renderFipsStatus(item.fipsValidated)}
            {renderQuantumTech(item.quantumTech)}
            <CertBadges certs={certsByProduct.get(item.softwareName) || []} />
            {item.evidenceFlags && item.evidenceFlags.length > 0 && (
              <span
                title={`${item.evidenceFlags.length} evidence notice${item.evidenceFlags.length > 1 ? 's' : ''}`}
                className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded border border-status-warning/30 bg-status-warning/10 text-status-warning"
              >
                <AlertTriangle size={10} /> {item.evidenceFlags.length}
              </span>
            )}
          </div>
        </div>

        {/* Expandable Mobile Toggle */}
        <div className="md:hidden mt-3 mb-1">
          <button
            onClick={() => setIsExpandedMobile(!isExpandedMobile)}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors"
          >
            {isExpandedMobile ? (
              <>Hide Details <ChevronUp size={14} /></>
            ) : (
              <>View Details <ChevronDown size={14} /></>
            )}
          </button>
        </div>

        {/* Metadata - hidden on mobile unless expanded */}
        <div className={`text-xs text-muted-foreground space-y-1 mt-3 md:block ${isExpandedMobile ? 'block' : 'hidden'}`}>
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
        <UpdateProductButton
          updateUrl={buildProductUpdateUrl({
            productName: item.softwareName,
            categoryName: item.categoryName,
            currentPqcSupport: item.pqcSupport || 'Unknown',
            productDetails: [
              `**Version:** ${item.latestVersion || 'N/A'}`,
              `**FIPS:** ${item.fipsValidated || 'N/A'}`,
            ].join('\n'),
            pageUrl: `/migrate?q=${encodeURIComponent(item.softwareName)}`,
          })}
          resourceLabel={item.softwareName}
        />
        <AskAssistantButton
          variant="text"
          label="Ask"
          question={`What PQC algorithms does ${item.softwareName} support${item.categoryName ? ` (${item.categoryName})` : ''}?${item.pqcCapabilityDescription ? ` Capabilities: ${item.pqcCapabilityDescription}` : ''}${item.fipsValidated && item.fipsValidated !== 'No' ? ` FIPS status: ${item.fipsValidated}.` : ''}`}
        />

        {onToggleCompare && (
          <button
            type="button"
            aria-label={isCompared ? 'Remove from comparison' : 'Add to comparison'}
            title={
              maxCompareReached && !isCompared
                ? 'Max 3 reached'
                : isCompared
                  ? 'Remove from comparison'
                  : 'Add to comparison'
            }
            disabled={maxCompareReached && !isCompared}
            onClick={() => onToggleCompare(key)}
            className={`p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
              isCompared
                ? 'text-secondary bg-secondary/10'
                : 'text-muted-foreground/40 hover:text-secondary hover:bg-secondary/10'
            }`}
          >
            <Scale size={16} />
          </button>
        )}
        {onToggleSelect && (
          <button
            type="button"
            aria-label={isSelected ? 'Remove from My Products' : 'Add to My Products'}
            title={isSelected ? 'Remove from My Products' : 'Add to My Products'}
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
