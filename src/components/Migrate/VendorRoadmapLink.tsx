// SPDX-License-Identifier: GPL-3.0-only
import { Map as MapIcon } from 'lucide-react'
import type { VendorRoadmap } from '../../types/MigrateTypes'

interface VendorRoadmapLinkProps {
  roadmap: VendorRoadmap | undefined
  size?: 'sm' | 'md'
  showLabel?: boolean
}

export const VendorRoadmapLink = ({
  roadmap,
  size = 'sm',
  showLabel = true,
}: VendorRoadmapLinkProps) => {
  const iconSize = size === 'md' ? 14 : 12

  if (!roadmap || !roadmap.roadmapUrl) {
    return (
      <span className="flex items-center gap-1 text-muted-foreground/40 text-xs">
        <MapIcon size={iconSize} aria-hidden="true" />
        {showLabel && <span>No roadmap published</span>}
      </span>
    )
  }

  return (
    <a
      href={roadmap.roadmapUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={roadmap.roadmapTitle}
      className={
        size === 'md'
          ? 'inline-flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors text-xs font-medium bg-primary/5 px-2.5 py-1.5 rounded-md border border-primary/20'
          : 'flex items-center gap-1 text-primary hover:text-primary/80 text-xs transition-colors'
      }
      aria-label={`View ${roadmap.vendorName} PQC roadmap`}
    >
      <MapIcon size={iconSize} aria-hidden="true" />
      {showLabel && <span>Vendor Roadmap</span>}
      {size === 'md' && roadmap.publishDate && (
        <span className="text-muted-foreground ml-1">({roadmap.publishDate.slice(0, 7)})</span>
      )}
    </a>
  )
}
