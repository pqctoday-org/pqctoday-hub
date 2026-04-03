// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { getSectorIcon } from './leadersHelper'
import type { Leader } from '../../data/leadersData'
import { ChevronUp } from 'lucide-react'

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
      const colors = [
        'from-primary/20 to-info/20 border-primary/50 text-primary',
        'from-secondary/20 to-secondary/10 border-secondary/50 text-secondary',
        'from-accent/20 to-accent/10 border-accent/50 text-accent',
      ]

      const theme = colors[index % colors.length]
      const [bgGradient, bgParams, borderColor, iconColor] = theme.split(' ')

      const sectorLeaders = items.filter((t) => t.type === sector)

      return {
        id: sector,
        label: sector,
        icon: getSectorIcon(sector, 24),
        description: `${sectorLeaders.length} leaders identified`,
        color: `${bgGradient} ${bgParams}`,
        borderColor,
        activeColor: 'bg-card border-primary shadow-[0_0_15px_hsl(var(--primary)/0.5)]',
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
              <button
                onClick={() => handleSelect(layer.id)}
                className={`group relative z-10 w-full flex flex-col items-stretch p-4 md:px-8 rounded-xl transition-all duration-300 ease-in-out cursor-pointer ${isActive ? layer.activeColor : `bg-gradient-to-r ${layer.color} border ${layer.borderColor} hover:scale-[1.01] hover:brightness-110`} ${isFaded ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
                style={{ transformOrigin: 'center' }}
              >
                <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                  <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between w-full">
                  <div className="flex items-center gap-4 w-full md:w-auto">
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
                </div>

                {isActive && expandedContent && (
                  <div
                    role="presentation"
                    className="mt-3 pt-3 w-full border-t border-border/30 text-left cursor-default"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <div className="bg-card rounded-lg border border-border relative z-20 pointer-events-auto">
                      {expandedContent}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectLayer('All')
                      }}
                      className="mt-3 w-full py-2 text-xs text-muted-foreground hover:text-foreground border border-border/40 rounded-lg hover:bg-background/50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ChevronUp size={14} />
                      Collapse Stack
                    </button>
                  </div>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
