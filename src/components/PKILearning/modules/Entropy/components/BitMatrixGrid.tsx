// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback, useMemo } from 'react'
import { Grid3x3, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ViewMode = 'bit' | 'byte'

interface BitMatrixGridProps {
  /** Raw byte data to visualize */
  data: Uint8Array
  /** Number of columns for the bit-level grid (default: auto-calculated) */
  cols?: number
  /** Optional callback when a bit is clicked (enables interactive mode) */
  onToggleBit?: (byteIndex: number, bitIndex: number) => void
  /** Set of flipped bit indices for highlighting (bitIndex = byteIdx * 8 + bit) */
  flippedBits?: Set<number>
  /** Hide the view-mode toggle (always show bit mode) */
  bitOnly?: boolean
  /** Compact mode for embedding in smaller containers */
  compact?: boolean
}

/** Calculate optimal column count based on data length */
function autoCols(byteCount: number, mode: ViewMode): number {
  const totalUnits = mode === 'bit' ? byteCount * 8 : byteCount
  // Target roughly square grids
  const sqrt = Math.ceil(Math.sqrt(totalUnits))
  // Round up to nearest multiple of 8 for bit mode (byte-aligned rows)
  if (mode === 'bit') {
    return Math.min(Math.ceil(sqrt / 8) * 8, 64)
  }
  return Math.min(sqrt, 32)
}

const BitCell: React.FC<{
  value: boolean
  byteIdx: number
  bitIdx: number
  isFlipped: boolean
  interactive: boolean
  onClick?: () => void
  compact: boolean
}> = React.memo(({ value, byteIdx, bitIdx, isFlipped, interactive, onClick, compact }) => {
  const size = compact ? 'w-[5px] h-[5px]' : 'w-[7px] h-[7px]'
  return (
    <div
      className={`${size} rounded-[1px] transition-colors duration-200 ${
        value ? 'bg-primary' : 'bg-muted/60'
      } ${isFlipped ? 'ring-1 ring-warning' : ''} ${
        interactive ? 'cursor-pointer hover:ring-1 hover:ring-primary/50' : ''
      }`}
      onClick={interactive ? onClick : undefined}
      title={`Byte ${byteIdx}, Bit ${bitIdx} = ${value ? '1' : '0'}`}
      aria-label={`Byte ${byteIdx} bit ${bitIdx} is ${value ? '1' : '0'}`}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
    />
  )
})
BitCell.displayName = 'BitCell'

const ByteCell: React.FC<{
  value: number
  byteIdx: number
  compact: boolean
}> = React.memo(({ value, byteIdx, compact }) => {
  const opacity = value / 255
  const size = compact ? 'w-[7px] h-[7px]' : 'w-[10px] h-[10px]'
  return (
    <div
      className={`${size} rounded-[1px]`}
      style={{
        backgroundColor: `hsl(var(--primary) / ${Math.max(opacity, 0.05)})`,
        transition: 'background-color 200ms',
      }}
      title={`Byte ${byteIdx}: 0x${value.toString(16).padStart(2, '0')} (${value})`}
      aria-label={`Byte ${byteIdx} value ${value}`}
    />
  )
})
ByteCell.displayName = 'ByteCell'

const BitMatrixGridInner: React.FC<BitMatrixGridProps> = ({
  data,
  cols,
  onToggleBit,
  flippedBits,
  bitOnly = false,
  compact = false,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('bit')
  const interactive = !!onToggleBit

  const effectiveCols = cols ?? autoCols(data.length, viewMode)

  const bitGrid = useMemo(() => {
    if (viewMode !== 'bit') return null
    const cells: { value: boolean; byteIdx: number; bitIdx: number; globalBit: number }[] = []
    for (let b = 0; b < data.length; b++) {
      for (let bit = 7; bit >= 0; bit--) {
        cells.push({
          value: !!((data[b] >> bit) & 1),
          byteIdx: b,
          bitIdx: 7 - bit,
          globalBit: b * 8 + (7 - bit),
        })
      }
    }
    return cells
  }, [data, viewMode])

  const handleToggle = useCallback(
    (byteIdx: number, bitIdx: number) => {
      onToggleBit?.(byteIdx, bitIdx)
    },
    [onToggleBit]
  )

  const gap = compact ? 'gap-[1px]' : 'gap-[2px]'

  return (
    <div className="space-y-2">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3x3 size={14} className="text-primary" />
          <span className="text-xs font-semibold text-foreground">
            {viewMode === 'bit' ? 'Bit Structure' : 'Byte Intensity'}
          </span>
        </div>
        {!bitOnly && (
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'bit' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={() => setViewMode('bit')}
            >
              <Grid3x3 size={10} className="mr-1" />
              Bits
            </Button>
            <Button
              variant={viewMode === 'byte' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={() => setViewMode('byte')}
            >
              <Layers size={10} className="mr-1" />
              Bytes
            </Button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="bg-muted/20 rounded-lg p-2 border border-border overflow-x-auto">
        {viewMode === 'bit' && bitGrid ? (
          <div
            className={`inline-grid ${gap}`}
            style={{ gridTemplateColumns: `repeat(${effectiveCols}, minmax(0, 1fr))` }}
          >
            {bitGrid.map((cell) => (
              <BitCell
                key={cell.globalBit}
                value={cell.value}
                byteIdx={cell.byteIdx}
                bitIdx={cell.bitIdx}
                isFlipped={flippedBits?.has(cell.globalBit) ?? false}
                interactive={interactive}
                onClick={() => handleToggle(cell.byteIdx, cell.bitIdx)}
                compact={compact}
              />
            ))}
          </div>
        ) : (
          <div
            className={`inline-grid ${gap}`}
            style={{ gridTemplateColumns: `repeat(${effectiveCols}, minmax(0, 1fr))` }}
          >
            {Array.from(data).map((byte, i) => (
              <ByteCell key={i} value={byte} byteIdx={i} compact={compact} />
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        {viewMode === 'bit' ? (
          <>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-[1px] bg-primary" /> 1
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-[1px] bg-muted/60" /> 0
            </span>
            <span className="ml-auto">
              {data.length} bytes ({data.length * 8} bits)
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1">
              <span
                className="inline-block w-2 h-2 rounded-[1px]"
                style={{ backgroundColor: 'hsl(var(--primary) / 0.05)' }}
              />{' '}
              0x00
            </span>
            <span className="flex items-center gap-1">
              <span
                className="inline-block w-2 h-2 rounded-[1px]"
                style={{ backgroundColor: 'hsl(var(--primary) / 1)' }}
              />{' '}
              0xFF
            </span>
            <span className="ml-auto">{data.length} bytes</span>
          </>
        )}
      </div>
    </div>
  )
}

/** Pixel grid visualization of byte data — random data looks like TV static, patterns show structure */
export const BitMatrixGrid = React.memo(BitMatrixGridInner, (prev, next) => {
  if (prev.data.length !== next.data.length) return false
  if (prev.cols !== next.cols) return false
  if (prev.bitOnly !== next.bitOnly) return false
  if (prev.compact !== next.compact) return false
  if (prev.onToggleBit !== next.onToggleBit) return false
  if (prev.flippedBits !== next.flippedBits) return false
  // Compare byte arrays
  for (let i = 0; i < prev.data.length; i++) {
    if (prev.data[i] !== next.data[i]) return false
  }
  return true
})
