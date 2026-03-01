// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '../ui/button'
import type { LibraryEnrichment } from '../../data/libraryEnrichmentData'

interface DocumentAnalysisProps {
  enrichment: LibraryEnrichment
}

type TagVariant =
  | 'default'
  | 'primary'
  | 'destructive'
  | 'warning'
  | 'info'
  | 'secondary'
  | 'accent'

const TAG_STYLES: Record<TagVariant, string> = {
  default: 'bg-muted/30 text-muted-foreground border border-border',
  primary: 'bg-primary/10 text-primary border border-primary/20',
  destructive: 'bg-destructive/10 text-destructive border border-destructive/20',
  warning: 'bg-status-warning/10 text-status-warning border border-status-warning/20',
  info: 'bg-status-info/10 text-status-info border border-status-info/20',
  secondary: 'bg-secondary/10 text-secondary border border-secondary/30',
  accent: 'bg-accent/10 text-accent border border-accent/30',
}

function DimensionText({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </h5>
      <p className="text-sm text-foreground leading-relaxed">{value}</p>
    </div>
  )
}

function DimensionTags({
  label,
  items,
  variant = 'default',
}: {
  label: string
  items: string[]
  variant?: TagVariant
}) {
  return (
    <div>
      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </h5>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <span
            key={item}
            className={clsx(
              'inline-flex items-center px-1.5 py-0.5 rounded text-xs',
              TAG_STYLES[variant]
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

export const DocumentAnalysis = ({ enrichment }: DocumentAnalysisProps) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="glass-panel p-3">
      <Button
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full h-auto items-center justify-between px-1 py-1.5"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
          <Sparkles size={16} className="text-primary" />
          Document Analysis
        </div>
        <ChevronDown
          size={16}
          className={clsx(
            'text-muted-foreground transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </Button>

      {open && (
        <div className="mt-3 space-y-3 pl-1">
          {enrichment.mainTopic && (
            <DimensionText label="Main Topic" value={enrichment.mainTopic} />
          )}

          {enrichment.pqcAlgorithms.length > 0 && (
            <DimensionTags
              label="PQC Algorithms"
              items={enrichment.pqcAlgorithms}
              variant="primary"
            />
          )}

          {enrichment.quantumThreats.length > 0 && (
            <DimensionTags
              label="Quantum Threats"
              items={enrichment.quantumThreats}
              variant="destructive"
            />
          )}

          {enrichment.migrationTimeline && enrichment.migrationTimeline.length > 0 && (
            <DimensionTags
              label="Migration Timeline"
              items={enrichment.migrationTimeline}
              variant="warning"
            />
          )}

          {enrichment.regionsAndBodies && (
            <div>
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Regions & Bodies
              </h5>
              <div className="space-y-1.5">
                {enrichment.regionsAndBodies.regions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-xs text-muted-foreground mr-1">Regions:</span>
                    {enrichment.regionsAndBodies.regions.map((r) => (
                      <span
                        key={r}
                        className={clsx(
                          'inline-flex items-center px-1.5 py-0.5 rounded text-xs',
                          TAG_STYLES.default
                        )}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
                {enrichment.regionsAndBodies.bodies.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="text-xs text-muted-foreground mr-1">Bodies:</span>
                    {enrichment.regionsAndBodies.bodies.map((b) => (
                      <span
                        key={b}
                        className={clsx(
                          'inline-flex items-center px-1.5 py-0.5 rounded text-xs',
                          TAG_STYLES.info
                        )}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {enrichment.leadersContributions.length > 0 && (
            <DimensionTags label="Leaders Mentioned" items={enrichment.leadersContributions} />
          )}

          {enrichment.pqcProducts.length > 0 && (
            <DimensionTags label="PQC Products" items={enrichment.pqcProducts} />
          )}

          {enrichment.protocols.length > 0 && (
            <DimensionTags label="Protocols" items={enrichment.protocols} variant="secondary" />
          )}

          {enrichment.infrastructureLayers.length > 0 && (
            <DimensionTags label="Infrastructure Layers" items={enrichment.infrastructureLayers} />
          )}

          {enrichment.standardizationBodies.length > 0 && (
            <DimensionTags
              label="Standardization Bodies"
              items={enrichment.standardizationBodies}
              variant="info"
            />
          )}

          {enrichment.complianceFrameworks.length > 0 && (
            <DimensionTags
              label="Compliance Frameworks"
              items={enrichment.complianceFrameworks}
              variant="accent"
            />
          )}
        </div>
      )}
    </div>
  )
}
