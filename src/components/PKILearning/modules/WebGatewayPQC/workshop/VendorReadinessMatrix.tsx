// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo } from 'react'
import { CheckCircle2, Clock, XCircle, Copy, Check } from 'lucide-react'
import { GATEWAY_VENDORS, type GatewayVendor } from '../data/gatewayData'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { Button } from '@/components/ui/button'

const STATUS_STYLES: Record<
  string,
  { icon: React.FC<{ size?: number; className?: string }>; color: string; label: string }
> = {
  production: { icon: CheckCircle2, color: 'text-status-success', label: 'Production' },
  planned: { icon: Clock, color: 'text-status-warning', label: 'Planned' },
  'no-roadmap': { icon: XCircle, color: 'text-status-error', label: 'No Roadmap' },
}

const CATEGORY_LABELS: Record<string, string> = {
  'load-balancer': 'Load Balancer',
  cdn: 'CDN',
  waf: 'WAF / NGFW',
  'reverse-proxy': 'Reverse Proxy',
  'api-gateway': 'API Gateway',
  sase: 'SASE / Zero Trust',
}

export const VendorReadinessMatrix: React.FC = () => {
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)

  const toggleVendor = (id: string) => {
    setSelectedVendors((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedVendors(new Set(GATEWAY_VENDORS.map((v) => v.id)))
  }

  const clearAll = () => {
    setSelectedVendors(new Set())
  }

  const selected = useMemo(
    () => GATEWAY_VENDORS.filter((v) => selectedVendors.has(v.id)),
    [selectedVendors]
  )

  const readinessScore = useMemo(() => {
    if (selected.length === 0) return 0
    const production = selected.filter((v) => v.pqcStatus === 'production').length
    const planned = selected.filter((v) => v.pqcStatus === 'planned').length
    return Math.round(((production + planned * 0.3) / selected.length) * 100)
  }, [selected])

  const gapAnalysis = useMemo(() => {
    const blockers = selected.filter(
      (v) => v.pqcStatus === 'planned' || v.pqcStatus === 'no-roadmap'
    )
    const ready = selected.filter((v) => v.pqcStatus === 'production')
    return { blockers, ready }
  }, [selected])

  const migrationSequence = useMemo(() => {
    return [...selected].sort((a, b) => {
      // Internet-facing first (CDN, LB), then WAF, then reverse proxy, then API gateway, then SASE
      const priority: Record<string, number> = {
        cdn: 1,
        'load-balancer': 2,
        waf: 3,
        'reverse-proxy': 4,
        'api-gateway': 5,
        sase: 6,
      }
      const aPri = priority[a.category] || 99
      const bPri = priority[b.category] || 99
      if (aPri !== bPri) return aPri - bPri
      // Production-ready first
      if (a.pqcStatus === 'production' && b.pqcStatus !== 'production') return -1
      if (b.pqcStatus === 'production' && a.pqcStatus !== 'production') return 1
      return 0
    })
  }, [selected])

  const generateMarkdown = () => {
    const lines: string[] = [
      '# Gateway PQC Readiness Assessment',
      '',
      `**Overall Score:** ${readinessScore}%`,
      `**Products Assessed:** ${selected.length}`,
      '',
      '| Product | Category | PQC Status | Version | Algorithms | FIPS |',
      '|---------|----------|------------|---------|------------|------|',
    ]
    for (const v of migrationSequence) {
      lines.push(
        `| ${v.name} | ${CATEGORY_LABELS[v.category] || v.category} | ${v.pqcStatus} | ${v.pqcVersion} | ${v.algorithms.join(', ') || '\u2014'} | ${v.fipsStatus} |`
      )
    }
    if (gapAnalysis.blockers.length > 0) {
      lines.push('', '## Blockers', '')
      for (const b of gapAnalysis.blockers) {
        lines.push(`- **${b.name}**: ${b.notes}`)
      }
    }
    lines.push('', '## Recommended Migration Sequence', '')
    migrationSequence.forEach((v, idx) => {
      lines.push(`${idx + 1}. ${v.name} (${CATEGORY_LABELS[v.category] || v.category})`)
    })
    return lines.join('\n')
  }

  const handleCopy = async () => {
    const markdown = generateMarkdown()
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Group vendors by category
  const grouped = useMemo(() => {
    const groups: Record<string, GatewayVendor[]> = {}
    for (const v of GATEWAY_VENDORS) {
      const key = v.category
      if (!groups[key]) groups[key] = []
      groups[key].push(v)
    }
    return groups
  }, [])

  return (
    <div className="space-y-6">
      {/* Vendor Selector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Select Your Gateway Products</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={selectAll}
              className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors text-foreground"
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              onClick={clearAll}
              className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors text-foreground"
            >
              Clear
            </Button>
          </div>
        </div>
        <VendorCoverageNotice migrateLayer="Network" className="mb-2" />

        {Object.entries(grouped).map(([category, vendors]) => (
          <div key={category}>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              {CATEGORY_LABELS[category] || category}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {vendors.map((vendor) => {
                const isSelected = selectedVendors.has(vendor.id)
                const statusInfo = STATUS_STYLES[vendor.pqcStatus]
                const StatusIcon = statusInfo.icon
                return (
                  <Button
                    variant="ghost"
                    key={vendor.id}
                    onClick={() => toggleVendor(vendor.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background hover:bg-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="accent-primary shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {vendor.name}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <StatusIcon size={10} className={statusInfo.color} />
                        <span className={statusInfo.color}>{statusInfo.label}</span>
                        {vendor.pqcVersion !== 'TBD' && (
                          <span className="text-muted-foreground ml-1">v{vendor.pqcVersion}</span>
                        )}
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Results */}
      {selected.length > 0 && (
        <>
          {/* Readiness Score */}
          <div className="glass-panel p-6 text-center">
            <div
              className={`text-3xl md:text-5xl font-bold ${
                readinessScore >= 80
                  ? 'text-status-success'
                  : readinessScore >= 50
                    ? 'text-status-warning'
                    : 'text-status-error'
              }`}
            >
              {readinessScore}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">Gateway PQC Readiness Score</div>
            <div className="text-xs text-muted-foreground mt-2">
              {gapAnalysis.ready.length} of {selected.length} products have production PQC support
            </div>
          </div>

          {/* Detail Table */}
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-3">Assessment Detail</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2 pr-3">Product</th>
                    <th className="pb-2 pr-3">Category</th>
                    <th className="pb-2 pr-3">Status</th>
                    <th className="pb-2 pr-3">Version</th>
                    <th className="pb-2 pr-3">Algorithms</th>
                    <th className="pb-2 pr-3">FIPS</th>
                    <th className="pb-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {migrationSequence.map((v) => {
                    const statusInfo = STATUS_STYLES[v.pqcStatus]
                    const StatusIcon = statusInfo.icon
                    return (
                      <tr key={v.id}>
                        <td className="py-1.5 pr-3 font-medium text-foreground">{v.name}</td>
                        <td className="py-1.5 pr-3 text-muted-foreground">
                          {CATEGORY_LABELS[v.category] || v.category}
                        </td>
                        <td className="py-1.5 pr-3">
                          <div className="flex items-center gap-1">
                            <StatusIcon size={10} className={statusInfo.color} />
                            <span className={statusInfo.color}>{statusInfo.label}</span>
                          </div>
                        </td>
                        <td className="py-1.5 pr-3 text-muted-foreground">{v.pqcVersion}</td>
                        <td className="py-1.5 pr-3 font-mono text-muted-foreground">
                          {v.algorithms.join(', ') || '\u2014'}
                        </td>
                        <td className="py-1.5 pr-3 text-muted-foreground">{v.fipsStatus}</td>
                        <td className="py-1.5 text-muted-foreground max-w-[200px] truncate">
                          {v.notes}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gap Analysis */}
          {gapAnalysis.blockers.length > 0 && (
            <div className="glass-panel p-4 space-y-2 border-l-4 border-l-status-warning">
              <h3 className="text-sm font-bold text-foreground">Gap Analysis</h3>
              <p className="text-xs text-muted-foreground">
                These products are blocking full PQC deployment:
              </p>
              {gapAnalysis.blockers.map((v) => (
                <div
                  key={v.id}
                  className="flex items-start gap-2 bg-status-warning/10 rounded-lg p-3"
                >
                  <Clock size={14} className="text-status-warning shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">{v.name}</div>
                    <p className="text-xs text-muted-foreground">{v.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommended Migration Sequence */}
          <div className="glass-panel p-4 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Recommended Migration Sequence</h3>
            <p className="text-xs text-muted-foreground">
              Priority: internet-facing first, then by traffic volume, then FIPS requirements.
            </p>
            <div className="space-y-2">
              {migrationSequence.map((v, idx) => {
                const statusInfo = STATUS_STYLES[v.pqcStatus]
                const StatusIcon = statusInfo.icon
                return (
                  <div key={v.id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-3">
                    <span className="text-sm font-bold text-primary w-6 text-center">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">{v.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {CATEGORY_LABELS[v.category] || v.category}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <StatusIcon size={10} className={statusInfo.color} />
                      <span className={statusInfo.color}>{statusInfo.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Export */}
          <Button
            variant="ghost"
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            {copied ? (
              <>
                <Check size={16} />
                Copied to Clipboard
              </>
            ) : (
              <>
                <Copy size={16} />
                Export as Markdown
              </>
            )}
          </Button>
        </>
      )}

      {selected.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Select the gateway products in your infrastructure to generate a readiness assessment.
        </div>
      )}
    </div>
  )
}
