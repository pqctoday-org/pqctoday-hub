// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { getIndustryIcon } from './threatsHelper'
import type { ThreatItem } from '../../data/threatsData'
import { ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface IndustryStackProps {
  activeLayer: string
  onSelectLayer: (layer: string) => void
  items: ThreatItem[] // Filtered data matching current constraints
  expandedContent: React.ReactNode // Content injected when expanded (usually a table/grid)
}

export const IndustryStack = ({
  activeLayer,
  onSelectLayer,
  items,
  expandedContent,
}: IndustryStackProps) => {
  // Compute unique industries from the available threats
  const partitions = useMemo(() => {
    // Collect all available industries from the threats dataset
    const rawInds = items.map((i) => i.industry)
    const unique = Array.from(new Set(rawInds)).sort()

    return unique.map((ind, index) => {
      // Pick dynamic color based on index to differentiate layers visually
      const colors = [
        'from-primary/20 to-info/20 border-primary/50 text-primary',
        'from-info/20 to-primary/20 border-info/50 text-info',
        'from-secondary/20 to-secondary/10 border-secondary/50 text-secondary',
        'from-accent/20 to-accent/10 border-accent/50 text-accent',
        'from-tertiary/20 to-tertiary/10 border-tertiary/50 text-tertiary',
        'from-success/20 to-accent/20 border-success/50 text-success',
        'from-warning/20 to-warning/10 border-warning/50 text-warning',
        'from-destructive/20 to-destructive/10 border-destructive/50 text-destructive',
      ]

      const theme = colors[index % colors.length]
      const [bgGradient, bgParams, borderColor, iconColor] = theme.split(' ')

      const threatsInLayer = items.filter((t) => t.industry === ind)
      const criticalCount = threatsInLayer.filter(
        (t) => t.criticality === 'Critical' || t.criticality === 'High'
      ).length

      return {
        id: ind,
        label: ind,
        icon: getIndustryIcon(ind, 24),
        description: `${threatsInLayer.length} threats cataloged`,
        color: `${bgGradient} ${bgParams}`,
        borderColor,
        activeColor: 'bg-card border-primary shadow-[0_0_15px_hsl(var(--primary)/0.5)]',
        iconColor,
        criticalCount,
        count: threatsInLayer.length,
      }
    })
  }, [items])

  if (partitions.length === 0) return null

  const handleSelect = (layerId: string) => {
    const newLayer = activeLayer === layerId ? 'All' : layerId
    onSelectLayer(newLayer)
  }

  return (
    <div className="w-full mb-10">
      <div className="flex flex-col gap-3 p-6 bg-card border border-border rounded-2xl shadow-2xl relative">
        <div className="absolute left-1/2 top-10 bottom-10 w-px bg-gradient-to-b from-primary/20 via-primary/20 to-muted-foreground/20 -translate-x-1/2 z-0 hidden md:block" />

        {partitions.map((layer, index) => {
          const isActive = activeLayer === layer.id
          const isFaded = activeLayer !== 'All' && !isActive

          return (
            <div
              key={layer.id}
              style={{
                zIndex: isActive ? partitions.length + 10 : partitions.length - index,
              }}
              className="transition-all duration-500 ease-in-out relative flex flex-col opacity-100"
            >
              <Button
                variant="ghost"
                onClick={() => handleSelect(layer.id)}
                className={`
                  group relative z-10 w-full flex flex-col items-stretch p-4 md:px-8 rounded-xl
                  transition-all duration-300 ease-in-out cursor-pointer
                  ${isActive ? layer.activeColor : `bg-gradient-to-r ${layer.color} border ${layer.borderColor} hover:scale-[1.01] hover:brightness-110`}
                  ${isFaded ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}
                `}
                style={{ transformOrigin: 'center' }}
              >
                <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                  <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                  <div className="flex items-center gap-4 shrink-0">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-lg bg-background/50 backdrop-blur border border-border/30 shadow-inner transition-colors ${
                        isActive
                          ? layer.iconColor
                          : 'text-muted-foreground group-hover:text-foreground'
                      } ${isActive ? 'animate-pulse' : ''}`}
                    >
                      {layer.icon}
                    </div>
                    <div className="text-left">
                      <h4
                        className={`font-bold transition-colors ${isActive ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'}`}
                      >
                        {layer.label}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 hidden md:block">
                        {layer.description}
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-border/40 via-border/20 to-transparent" />

                  <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                    {layer.criticalCount > 0 && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-status-error/10 text-status-error border border-status-error/30">
                        {layer.criticalCount} Critical/High
                      </span>
                    )}
                    <span className="text-xs px-2.5 py-1 rounded-full bg-background/50 text-muted-foreground border border-border/40 tabular-nums">
                      {layer.count} Threats
                    </span>
                    <div
                      className={`flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
                        isActive
                          ? 'bg-background/80 text-foreground border-border'
                          : 'bg-background/40 text-muted-foreground border-transparent group-hover:border-border/50 group-hover:text-foreground/80'
                      }`}
                    >
                      {isActive ? 'Filtered' : 'Click to filter'}
                    </div>
                  </div>
                </div>

                {isActive && expandedContent && (
                  <div
                    role="presentation"
                    className="mt-3 pt-3 w-full border-t border-border/30"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <div className="bg-card rounded-lg border border-border">{expandedContent}</div>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectLayer('All')
                      }}
                      className="mt-3 w-full py-2 text-xs text-muted-foreground hover:text-foreground border border-border/40 rounded-lg hover:bg-background/50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ChevronUp size={14} />
                      Collapse Stack
                    </Button>
                  </div>
                )}
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
