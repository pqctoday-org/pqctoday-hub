// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import {
  Network,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  CheckSquare,
  Square,
  X,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { PAYMENT_NETWORKS } from '../data/paymentNetworkData'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import {
  PQC_POSTURE_COLORS,
  PQC_POSTURE_LABELS,
  RADAR_AXES,
  type PaymentNetwork,
} from '../data/emvConstants'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const REGION_ITEMS = [
  { id: 'All', label: 'All Regions' },
  { id: 'Americas', label: 'Americas' },
  { id: 'Asia-Pacific', label: 'Asia-Pacific' },
]

const POSTURE_ITEMS = [
  { id: 'All', label: 'All Postures' },
  { id: 'active-pilot', label: 'Active Pilot' },
  { id: 'research', label: 'Research' },
  { id: 'announced', label: 'Announced' },
  { id: 'no-public-stance', label: 'No Public Stance' },
]

const OFFLINE_ITEMS = [
  { id: 'All', label: 'All' },
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
]

const COMPARE_ROWS = [
  'Cards',
  'Volume',
  'Offline Auth',
  'Token Platform',
  'PQC Posture',
  'PQC Timeline',
] as const

/** Format large numbers for summary stats */
function sumCards(networks: PaymentNetwork[]): string {
  const total = networks.reduce((s, n) => s + n.cardsInCirculationNum, 0)
  if (total >= 1_000_000_000) return `${(total / 1_000_000_000).toFixed(1)}B`
  if (total >= 1_000_000) return `${(total / 1_000_000).toFixed(0)}M`
  return total.toLocaleString()
}

// ---------------------------------------------------------------------------
// Radar Chart (SVG)
// ---------------------------------------------------------------------------

const RADAR_SIZE = 220
const RADAR_CX = RADAR_SIZE / 2
const RADAR_CY = RADAR_SIZE / 2
const RADAR_R = 80

const NETWORK_STROKE_COLORS: Record<string, string> = {
  visa: '#3b82f6',
  mastercard: '#f59e0b',
  amex: '#10b981',
  unionpay: '#ef4444',
  discover: '#8b5cf6',
}

function radarPoint(axisIndex: number, value: number, total: number): [number, number] {
  const angle = (Math.PI * 2 * axisIndex) / total - Math.PI / 2
  const r = (value / 5) * RADAR_R
  return [RADAR_CX + r * Math.cos(angle), RADAR_CY + r * Math.sin(angle)]
}

function radarPolygon(network: PaymentNetwork): string {
  const scores = RADAR_AXES.map((a) => network.radarScores[a.key])
  return scores.map((s, i) => radarPoint(i, s, scores.length).join(',')).join(' ')
}

const RadarChart: React.FC<{ networks: PaymentNetwork[] }> = ({ networks }) => {
  const axisCount = RADAR_AXES.length

  return (
    <svg
      viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
      className="w-full max-w-[280px] mx-auto"
      role="img"
      aria-label="Radar chart comparing network scores"
    >
      {/* Background rings */}
      {[1, 2, 3, 4, 5].map((ring) => (
        <polygon
          key={ring}
          points={Array.from({ length: axisCount })
            .map((_, i) => radarPoint(i, ring, axisCount).join(','))
            .join(' ')}
          fill="none"
          className="stroke-border"
          strokeWidth={0.5}
          opacity={0.5}
        />
      ))}

      {/* Axis lines */}
      {RADAR_AXES.map((_, i) => {
        const [x, y] = radarPoint(i, 5, axisCount)
        return (
          <line
            key={i}
            x1={RADAR_CX}
            y1={RADAR_CY}
            x2={x}
            y2={y}
            className="stroke-border"
            strokeWidth={0.5}
            opacity={0.5}
          />
        )
      })}

      {/* Axis labels */}
      {RADAR_AXES.map((axis, i) => {
        const [x, y] = radarPoint(i, 5.8, axisCount)
        return (
          <text
            key={axis.key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground"
            fontSize={7}
          >
            {axis.label}
          </text>
        )
      })}

      {/* Network polygons */}
      {networks.map((net) => (
        <polygon
          key={net.id}
          points={radarPolygon(net)}
          fill={NETWORK_STROKE_COLORS[net.id] ?? '#888'}
          fillOpacity={0.12}
          stroke={NETWORK_STROKE_COLORS[net.id] ?? '#888'}
          strokeWidth={1.5}
        />
      ))}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// NetworkComparator
// ---------------------------------------------------------------------------

export const NetworkComparator: React.FC = () => {
  const [regionFilter, setRegionFilter] = useState('All')
  const [postureFilter, setPostureFilter] = useState('All')
  const [offlineFilter, setOfflineFilter] = useState('All')
  const [compareMode, setCompareMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleSelected = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 3) {
        next.add(id)
      }
      return next
    })
  }, [])

  const filtered = useMemo(() => {
    return PAYMENT_NETWORKS.filter((n) => {
      if (regionFilter !== 'All' && n.headquartersRegion !== regionFilter) return false
      if (postureFilter !== 'All' && n.pqcPosture !== postureFilter) return false
      if (offlineFilter !== 'All') {
        const want = offlineFilter === 'yes'
        if (n.offlineAuthSupported !== want) return false
      }
      return true
    })
  }, [regionFilter, postureFilter, offlineFilter])

  const comparedNetworks = useMemo(
    () => PAYMENT_NETWORKS.filter((n) => selected.has(n.id)),
    [selected]
  )

  // Summary stats
  const totalCards = sumCards(filtered)
  const activePqcCount = filtered.filter((n) => n.pqcPosture === 'active-pilot').length
  const totalVolume = filtered.reduce((s, n) => {
    const match = n.annualTransactionVolume.match(/([\d.]+)/)
    return s + (match ? parseFloat(match[1]) : 0)
  }, 0)

  const compareValue = (net: PaymentNetwork, row: (typeof COMPARE_ROWS)[number]): string => {
    switch (row) {
      case 'Cards':
        return net.cardsInCirculation
      case 'Volume':
        return net.annualTransactionVolume
      case 'Offline Auth':
        return net.offlineAuthSupported ? 'Yes' : 'No'
      case 'Token Platform':
        return net.tokenizationPlatform
      case 'PQC Posture':
        return PQC_POSTURE_LABELS[net.pqcPosture]
      case 'PQC Timeline':
        return net.pqcTimeline
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterDropdown
          items={REGION_ITEMS}
          selectedId={regionFilter}
          onSelect={setRegionFilter}
          label="Region"
          noContainer
        />
        <FilterDropdown
          items={POSTURE_ITEMS}
          selectedId={postureFilter}
          onSelect={setPostureFilter}
          label="PQC Posture"
          noContainer
        />
        <FilterDropdown
          items={OFFLINE_ITEMS}
          selectedId={offlineFilter}
          onSelect={setOfflineFilter}
          label="Offline Auth"
          noContainer
        />
        <div className="ml-auto">
          <Button
            variant={compareMode ? 'gradient' : 'outline'}
            size="sm"
            onClick={() => {
              setCompareMode((p) => !p)
              if (compareMode) setSelected(new Set())
            }}
          >
            <BarChart3 size={16} className="mr-1" />
            {compareMode ? 'Exit Compare' : 'Compare'}
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 text-center">
          <CreditCard size={20} className="mx-auto text-primary mb-1" />
          <div className="text-2xl font-bold text-foreground">{totalCards}</div>
          <div className="text-xs text-muted-foreground">Total Cards at Risk</div>
        </div>
        <div className="glass-panel p-4 text-center">
          <ShieldCheck size={20} className="mx-auto text-status-success mb-1" />
          <div className="text-2xl font-bold text-foreground">{activePqcCount}</div>
          <div className="text-xs text-muted-foreground">Active PQC Programs</div>
        </div>
        <div className="glass-panel p-4 text-center">
          <TrendingUp size={20} className="mx-auto text-primary mb-1" />
          <div className="text-2xl font-bold text-foreground">${totalVolume.toFixed(1)}T</div>
          <div className="text-xs text-muted-foreground">Transaction Volume</div>
        </div>
      </div>

      {compareMode && selected.size > 0 && (
        <p className="text-sm text-muted-foreground">
          {selected.size}/3 networks selected for comparison.{' '}
          {selected.size < 2 && 'Select at least 2 to compare.'}
        </p>
      )}

      {/* Network cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((net) => {
          const isChecked = selected.has(net.id)
          return (
            <div
              key={net.id}
              className={`glass-panel p-4 space-y-3 transition-all ${
                compareMode && isChecked ? 'ring-2 ring-primary' : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {compareMode && (
                    <Button
                      variant="ghost"
                      onClick={() => toggleSelected(net.id)}
                      className="shrink-0"
                      aria-label={isChecked ? `Deselect ${net.name}` : `Select ${net.name}`}
                    >
                      {isChecked ? (
                        <CheckSquare size={18} className="text-primary" />
                      ) : (
                        <Square size={18} className="text-muted-foreground" />
                      )}
                    </Button>
                  )}
                  <div>
                    <h4 className="font-semibold text-foreground">{net.name}</h4>
                    <span className="text-xs text-muted-foreground">
                      {net.abbreviation} &middot; {net.headquartersRegion}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${PQC_POSTURE_COLORS[net.pqcPosture]}`}
                >
                  {PQC_POSTURE_LABELS[net.pqcPosture]}
                </span>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  <CreditCard size={14} className="inline mr-1" />
                  {net.cardsInCirculation}
                </span>
                <span className="text-muted-foreground">
                  <TrendingUp size={14} className="inline mr-1" />
                  {net.annualTransactionVolume}
                </span>
              </div>

              {/* Crypto summary */}
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  <span className="font-medium text-secondary">Offline:</span>{' '}
                  {net.currentCrypto.offlineAuth.join(', ')}
                </div>
                <div>
                  <span className="font-medium text-secondary">Online:</span>{' '}
                  {net.currentCrypto.onlineAuth.join(', ')}
                </div>
              </div>

              {/* Initiatives */}
              <div>
                <h5 className="text-xs font-medium text-secondary mb-1">PQC Initiatives</h5>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                  {net.pqcInitiatives.map((init, i) => (
                    <li key={i}>{init}</li>
                  ))}
                </ul>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Network size={32} className="mx-auto mb-2 opacity-50" />
            No networks match the current filters.
          </div>
        )}
      </div>

      {/* Side-by-side comparison */}
      {compareMode && comparedNetworks.length >= 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Side-by-Side Comparison</h3>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              <X size={14} className="mr-1" /> Clear
            </Button>
          </div>
          <VendorCoverageNotice migrateLayer="AppServers" className="mb-2" />

          {/* Comparison table */}
          <div className="glass-panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-muted-foreground font-medium">Metric</th>
                  {comparedNetworks.map((net) => (
                    <th key={net.id} className="text-left p-3 text-foreground font-semibold">
                      {net.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row} className="border-b border-border last:border-0">
                    <td className="p-3 text-muted-foreground font-medium">{row}</td>
                    {comparedNetworks.map((net) => (
                      <td key={net.id} className="p-3 text-foreground">
                        {row === 'PQC Posture' ? (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${PQC_POSTURE_COLORS[net.pqcPosture]}`}
                          >
                            {compareValue(net, row)}
                          </span>
                        ) : (
                          compareValue(net, row)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Radar scores row */}
                {RADAR_AXES.map((axis) => (
                  <tr key={axis.key} className="border-b border-border last:border-0">
                    <td className="p-3 text-muted-foreground font-medium">{axis.label}</td>
                    {comparedNetworks.map((net) => (
                      <td key={net.id} className="p-3 text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${(net.radarScores[axis.key] / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-5 text-right">
                            {net.radarScores[axis.key]}/5
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Radar chart overlay */}
          <div className="glass-panel p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3 text-center">
              Risk Profile Overlay
            </h4>
            <RadarChart networks={comparedNetworks} />
            <div className="flex justify-center gap-4 mt-3">
              {comparedNetworks.map((net) => (
                <div key={net.id} className="flex items-center gap-1.5 text-xs text-foreground">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: NETWORK_STROKE_COLORS[net.id] }}
                  />
                  {net.abbreviation}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
