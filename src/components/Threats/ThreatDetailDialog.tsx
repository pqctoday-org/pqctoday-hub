import React from 'react'
import { ShieldAlert, X, Lock, Cpu, ExternalLink, BookOpen } from 'lucide-react'
import type { ThreatItem } from '../../data/threatsData'
import { StatusBadge } from '../common/StatusBadge'
import { MODULE_CATALOG } from '../PKILearning/moduleData'

interface ThreatDetailDialogProps {
  threat: ThreatItem
  onClose: () => void
}

export const ThreatDetailDialog: React.FC<ThreatDetailDialogProps> = ({ threat, onClose }) => {
  if (!threat) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="threat-dialog-title"
        className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
      >
        <div className="p-6 border-b border-border flex justify-between items-start sticky top-0 bg-card z-10">
          <div>
            <h2
              id="threat-dialog-title"
              className="text-xl font-bold text-gradient flex items-center gap-2"
            >
              <ShieldAlert className="w-5 h-5 text-primary" />
              {threat.threatId}
              <StatusBadge status={threat.status} size="sm" />
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{threat.industry}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Description
            </h3>
            <p className="text-foreground leading-relaxed">{threat.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
              <h3 className="text-sm font-semibold text-status-error mb-2 flex items-center gap-2">
                <Lock size={14} /> At-Risk Cryptography
              </h3>
              <p className="text-sm font-mono text-foreground/80 break-words">
                {threat.cryptoAtRisk}
              </p>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                <Cpu size={14} /> PQC Mitigation
              </h3>
              <p className="text-sm font-mono text-foreground/80 break-words">
                {threat.pqcReplacement}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Criticality
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  threat.criticality.toLowerCase() === 'critical'
                    ? 'bg-status-error text-status-error border border-status-error'
                    : threat.criticality.toLowerCase() === 'high'
                      ? 'bg-status-error text-status-error border border-status-error'
                      : 'bg-status-warning text-status-warning border border-status-warning'
                }`}
              >
                {threat.criticality}
              </span>
            </div>
          </div>

          {threat.sourceUrl && (
            <div className="pt-4 border-t border-border mt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Reference Source
              </h3>
              <a
                href={threat.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline text-sm truncate"
              >
                <ExternalLink size={14} />
                {threat.mainSource || 'View Source'}
              </a>
            </div>
          )}

          {threat.relatedModules && threat.relatedModules.length > 0 && (
            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <BookOpen size={14} /> Learn More
              </h3>
              <div className="flex flex-wrap gap-2">
                {threat.relatedModules.map((slug) => {
                  const mod = MODULE_CATALOG[slug]
                  if (!mod) return null
                  return (
                    <a
                      key={slug}
                      href={`/learn/${slug}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                      <BookOpen size={11} />
                      {mod.title}
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
        role="button"
        tabIndex={-1}
      />
    </div>
  )
}
