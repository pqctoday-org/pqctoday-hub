// SPDX-License-Identifier: GPL-3.0-only
/**
 * Command Center primary nav: CSWP.39 Fig 3 — Crypto Agility Strategic Plan.
 *
 * Renders the six zones (Governance band → Assets / Management Tools / Risk
 * Management three-column row → Mitigation / Migration footer) wrapped in the
 * iterative-loop frame. Each zone shows an artifact-count badge ("3/12 created")
 * derived from `metrics`. Clicking a zone scrolls to (and highlights) the
 * matching `<CSWP39ZonePanel>` below.
 */
import React from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CSWP39_ZONE_DETAILS,
  CSWP39_ZONE_ORDER,
  CSWP39_ZONE_STYLES,
  type ZoneId,
} from '@/data/cswp39ZoneData'
import type { BusinessMetrics } from '../hooks/useBusinessMetrics'
import { ZONE_ARTIFACT_TYPES, getArtifactsForZone } from '../lib/cswp39StepMapping'

export interface CommandCenterStrategicPlanProps {
  metrics: BusinessMetrics
  /** Currently-selected zone (for visual highlight on the diagram). */
  activeZone: ZoneId | null
  /** Click handler — typically scrolls to the matching panel below the diagram. */
  onZoneSelect: (zone: ZoneId) => void
}

interface ZoneTileProps {
  zone: ZoneId
  active: boolean
  metrics: BusinessMetrics
  onSelect: (zone: ZoneId) => void
  /** Whether to show the sub-element chip list inside the tile. Governance does;
   *  Assets / Management Tools / Risk Mgmt show as bulleted lists; Mitigation
   *  and Migration are descriptive only. */
  variant: 'chips' | 'list' | 'description'
}

function ZoneTile({ zone, active, metrics, onSelect, variant }: ZoneTileProps) {
  // eslint-disable-next-line security/detect-object-injection
  const detail = CSWP39_ZONE_DETAILS[zone]
  // eslint-disable-next-line security/detect-object-injection
  const style = CSWP39_ZONE_STYLES[zone]
  // eslint-disable-next-line security/detect-object-injection
  const totalCount = ZONE_ARTIFACT_TYPES[zone].length
  const createdCount = getArtifactsForZone(metrics, zone).length

  return (
    <Button
      variant="ghost"
      onClick={() => onSelect(zone)}
      // whitespace-normal + items-start override Button base's
      // `whitespace-nowrap items-center justify-center`, which would
      // otherwise force `<p>` content onto a single line and spill out of
      // the grid cell. min-w-0 lets the inner div shrink properly.
      className={`h-auto p-3 rounded-lg border-2 transition-all w-full text-left whitespace-normal items-start justify-start min-w-0 ${style.border} ${active ? style.activeBg : style.bg} ${active ? 'ring-2 ring-primary/30' : ''}`}
      aria-pressed={active}
      data-workshop-target={`business-zone-${zone}`}
    >
      <div className="space-y-1.5 w-full min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className={`text-xs font-bold tracking-wider ${style.text}`}>{detail.label}</div>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${style.activeBg} ${style.text}`}
            title={`${createdCount} of ${totalCount} artifact types created`}
          >
            {createdCount}/{totalCount}
          </span>
        </div>

        {variant === 'chips' && (
          <div className="flex flex-wrap gap-1">
            {detail.contains.map((item) => (
              <span
                key={item}
                className={`text-[10px] px-1.5 py-0.5 rounded ${style.activeBg} ${style.text}`}
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {variant === 'list' && (
          <div className="space-y-0.5">
            {detail.contains.map((item) => (
              <div key={item} className="text-[10px] text-muted-foreground">
                · {item}
              </div>
            ))}
          </div>
        )}

        {variant === 'description' && (
          <p className="text-[10px] text-muted-foreground leading-relaxed">{detail.what}</p>
        )}
      </div>
    </Button>
  )
}

export const CommandCenterStrategicPlan: React.FC<CommandCenterStrategicPlanProps> = ({
  metrics,
  activeZone,
  onZoneSelect,
}) => {
  // -1 when no zone is currently open (e.g. the active zone panel was
  // collapsed via handleZoneToggle). CSWP39_ZONE_ORDER.indexOf always
  // resolves for a real ZoneId, so -1 only ever means "nothing open".
  const activeIndex = activeZone ? CSWP39_ZONE_ORDER.indexOf(activeZone) : -1
  const zoneCount = CSWP39_ZONE_ORDER.length

  // "Step N of 6" reflects the currently open zone's position in the
  // canonical loop order. When nothing is open there is no "current step"
  // to report, so the stepper reads "No zone open" rather than implying
  // step 1 is active — the buttons stay fully functional either way (see
  // handlePrevZone/handleNextZone below).
  const stepLabel = activeIndex >= 0 ? `Step ${activeIndex + 1} of ${zoneCount}` : 'No zone open'

  // Wraparound via modulo: Migration (last) → next → Governance (first);
  // Governance (first) → prev → Migration (last). Reuses the same
  // `onZoneSelect` the zone cards call directly, so opening/scrolling
  // behaves identically whether the user clicks a card or the stepper.
  const handlePrevZone = () => {
    if (activeIndex < 0) {
      // Nothing open — "prev" enters the loop at its last step (Migration),
      // the natural predecessor of Governance in the iterative loop.
      onZoneSelect(CSWP39_ZONE_ORDER[zoneCount - 1])
      return
    }
    const prevIndex = (activeIndex - 1 + zoneCount) % zoneCount
    // eslint-disable-next-line security/detect-object-injection -- prevIndex is a modulo-bounded array index, not user input
    onZoneSelect(CSWP39_ZONE_ORDER[prevIndex])
  }

  const handleNextZone = () => {
    if (activeIndex < 0) {
      // Nothing open — "next" enters the loop at its first step (Governance).
      onZoneSelect(CSWP39_ZONE_ORDER[0])
      return
    }
    const nextIndex = (activeIndex + 1) % zoneCount
    // eslint-disable-next-line security/detect-object-injection -- nextIndex is a modulo-bounded array index, not user input
    onZoneSelect(CSWP39_ZONE_ORDER[nextIndex])
  }

  return (
    <div className="glass-panel p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Info size={16} className="text-primary shrink-0" />
        <h3 className="text-lg font-bold text-gradient">CSWP.39 Crypto Agility Strategic Plan</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Click any zone to jump to its artifacts. Counts show how many artifact types in that zone
        you've already produced.
      </p>

      {/* Outer Crypto Agility frame */}
      <div className="border-2 border-primary/50 rounded-xl p-4 space-y-4 relative">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePrevZone}
              aria-label="Previous zone in the iterative loop (wraps from Governance to Migration)"
              data-testid="zone-stepper-prev"
              className="h-6 w-6 p-0 text-primary hover:bg-primary/10 shrink-0"
            >
              <ArrowLeft size={14} />
            </Button>
            <span data-testid="zone-stepper-label">
              Crypto Agility (iterative loop) &mdash; {stepLabel}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleNextZone}
              aria-label="Next zone in the iterative loop (wraps from Migration to Governance)"
              data-testid="zone-stepper-next"
              className="h-6 w-6 p-0 text-primary hover:bg-primary/10 shrink-0"
            >
              <ArrowRight size={14} />
            </Button>
          </div>
          <span className="text-[10px] text-muted-foreground">NIST CSWP.39 Fig. 3</span>
        </div>

        {/* Governance band */}
        <ZoneTile
          zone="governance"
          active={activeZone === 'governance'}
          metrics={metrics}
          onSelect={onZoneSelect}
          variant="chips"
        />

        {/* Middle row: Assets | Management Tools | Risk Management */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          <ZoneTile
            zone="assets"
            active={activeZone === 'assets'}
            metrics={metrics}
            onSelect={onZoneSelect}
            variant="list"
          />
          <ZoneTile
            zone="management-tools"
            active={activeZone === 'management-tools'}
            metrics={metrics}
            onSelect={onZoneSelect}
            variant="list"
          />
          <ZoneTile
            zone="risk-management"
            active={activeZone === 'risk-management'}
            metrics={metrics}
            onSelect={onZoneSelect}
            variant="list"
          />
        </div>

        {/* Automation arrow */}
        <div className="flex justify-center items-center gap-1 text-[10px] text-muted-foreground">
          <ArrowDown size={12} />
          <span>Automation feeds Information Repository</span>
          <ArrowDown size={12} />
        </div>

        {/* Implement row: Mitigation | Migration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ZoneTile
            zone="mitigation"
            active={activeZone === 'mitigation'}
            metrics={metrics}
            onSelect={onZoneSelect}
            variant="description"
          />
          <ZoneTile
            zone="migration"
            active={activeZone === 'migration'}
            metrics={metrics}
            onSelect={onZoneSelect}
            variant="description"
          />
        </div>
      </div>
    </div>
  )
}
