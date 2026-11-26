// SPDX-License-Identifier: AGPL-3.0-only
import React, { useMemo } from 'react'
import { getSectorIcon } from './leadersHelper'
import type { Leader } from '../../data/leadersData'
import { ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SectorStackProps {
  activeLayer: string
  onSelectLayer: (layer: string) => void
  items: Leader[]
  expandedContent: React.ReactNode
}

export const SectorStack = ({
  activeLayer,
  onSelectLayer,
  items,
  expandedContent,
}: SectorStackProps) => {
  const partitions = useMemo(() => {
    // Unique sectors
    const rawSectors = items.map((i) => i.type)
    const unique = Array.from(new Set(rawSectors)).sort()

    return unique.map((sector, index) => {
      const iconColors = ['text-primary-legible', 'text-secondary', 'text-accent-legible']
      const iconColor = iconColors[index % iconColors.length]

      const sectorLeaders = items.filter((t) => t.type === sector)

      return {
        id: sector,
        label: sector,
        icon: getSectorIcon(sector, 24),
        description: `${sectorLeaders.length} leaders identified`,
        iconColor,
        count: sectorLeaders.length,
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
      <div className="flex flex-col gap-3 p-6 bg-card rounded-2xl relative border-2 border-ink shadow-[0_4px_0_hsl(var(--edge))]">
        <div className="absolute left-1/2 top-10 bottom-10 w-px bg-border -translate-x-1/2 z-0 hidden md:block" />

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
              <div
                className={`group relative z-10 w-full rounded-2xl border transition-colors duration-300 ease-in-out ${isActive ? 'border-highlight-border bg-highlight' : 'border-border bg-card hover:bg-muted'} ${isFaded ? 'opacity-40' : 'opacity-100'}`}
                style={{ transformOrigin: 'center' }}
              >
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => handleSelect(layer.id)}
                  aria-expanded={isActive}
                  className="relative z-10 flex h-auto w-full cursor-pointer flex-col items-center justify-between whitespace-normal rounded-2xl p-4 text-left focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid md:flex-row md:px-8"
                >
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full bg-chip transition-colors ${
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

                  <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-background/50 text-muted-foreground border border-border/40 tabular-nums">
                      {layer.count} Leaders
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
                </Button>

                {isActive && expandedContent && (
                  <div className="relative z-20 mx-4 mb-4 border-t border-border/30 pt-3 text-left md:mx-8">
                    <div className="rounded-lg border border-border bg-card">{expandedContent}</div>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => onSelectLayer('All')}
                      className="mt-3 w-full py-2 text-xs text-muted-foreground hover:text-foreground border border-border/40 rounded-lg hover:bg-background/50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ChevronUp size={14} />
                      Collapse Stack
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
