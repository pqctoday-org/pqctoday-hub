import { Info } from 'lucide-react'
import { Link } from 'react-router'
import type { DomainId } from '@/data/migrationAssets'
import { migrateDomainForLayer, migrateDomainHref } from '@/utils/migrateLinks'

interface VendorCoverageNoticeProps {
  /** Migrate catalog layer ID — e.g., 'Hardware', 'Network', 'Security Stack', 'AppServers', 'Libraries', 'SecSoftware', 'Database', 'OS' */
  migrateLayer: string
  /**
   * Migrate workbench domain to open (`/migrate?domain=`). When omitted it is
   * derived from `migrateLayer` via the catalog's own layer fallback.
   */
  migrateDomain?: DomainId
  className?: string
}

export function VendorCoverageNotice({
  migrateLayer,
  migrateDomain,
  className,
}: VendorCoverageNoticeProps) {
  const href = migrateDomainHref(migrateDomain ?? migrateDomainForLayer(migrateLayer))

  return (
    <div
      className={`glass-panel p-3 border-l-4 border-l-status-info flex gap-3 items-start${className ? ` ${className}` : ''}`}
    >
      <Info className="h-4 w-4 text-status-info mt-0.5 shrink-0" />
      <p className="text-sm text-muted-foreground leading-relaxed">
        Products shown here are a representative selection — not an exhaustive list. For the full
        vendor landscape with PQC readiness status, visit the{' '}
        <span className="font-medium text-foreground">Tools &amp; Products</span> tab in this module
        or browse the{' '}
        <Link to={href} className="text-primary underline underline-offset-2 hover:text-primary/80">
          Migrate catalog →
        </Link>
      </p>
    </div>
  )
}
