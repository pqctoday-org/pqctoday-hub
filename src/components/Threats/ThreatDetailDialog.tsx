// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect } from 'react'
import {
  ShieldAlert,
  X,
  Lock,
  Cpu,
  ExternalLink,
  BookOpen,
  Sparkles,
  Target,
  Clock,
  DollarSign,
  Shield,
  ClipboardCheck,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ThreatItem } from '../../data/threatsData'
import { StatusBadge } from '../common/StatusBadge'
import { MODULE_CATALOG } from '../PKILearning/moduleData'
import { AskAssistantButton } from '../ui/AskAssistantButton'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { threatEnrichmentData } from '@/data/threatEnrichmentData'
import FocusLock from 'react-focus-lock'
import { Button } from '@/components/ui/button'

interface ThreatDetailDialogProps {
  threat: ThreatItem
  onClose: () => void
}

export const ThreatDetailDialog: React.FC<ThreatDetailDialogProps> = ({ threat, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (!threat) return null

  return (
    <FocusLock returnFocus>
      <div className="fixed inset-0 embed-backdrop z-50 flex items-center justify-center p-4">
        {/* Isolated backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[-1]"
          onClick={onClose}
          aria-hidden="true"
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="threat-dialog-title"
          className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col relative"
        >
          <div className="p-6 border-b border-border flex justify-between items-start sticky top-0 bg-card z-10 shrink-0">
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
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Close details"
            >
              <X size={20} />
            </Button>
          </div>

          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
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

            {/* Threat Enrichment Analysis */}
            {(() => {
              const enrichment = threatEnrichmentData[threat.threatId]
              if (!enrichment) return null
              const hasAttack = enrichment.attackClassification.length > 0
              const hasTimeline = enrichment.exploitationTimeline.length > 0
              const hasFinancial = enrichment.financialImpact.length > 0
              const hasCountermeasure = enrichment.countermeasureEffectiveness.length > 0
              const hasAny = hasAttack || hasTimeline || hasFinancial || hasCountermeasure
              if (!hasAny) return null
              return (
                <div className="pt-4 border-t border-border mt-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Sparkles size={14} className="text-primary" /> Threat Analysis
                  </h3>
                  <div className="space-y-3">
                    {hasAttack && (
                      <div className="flex items-start gap-2">
                        <Target size={14} className="text-status-error mt-0.5 shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">
                            Attack Classification
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {enrichment.attackClassification.map((c) => (
                              <span
                                key={c}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-status-error/10 text-status-error border border-status-error/20"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {hasTimeline && (
                      <div className="flex items-start gap-2">
                        <Clock size={14} className="text-status-warning mt-0.5 shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">
                            Exploitation Timeline
                          </span>
                          <ul className="mt-1 space-y-0.5">
                            {enrichment.exploitationTimeline.map((t, i) => (
                              <li key={i} className="text-xs text-foreground">
                                {t}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {hasFinancial && (
                      <div className="flex items-start gap-2">
                        <DollarSign size={14} className="text-primary mt-0.5 shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">
                            Financial Impact
                          </span>
                          <ul className="mt-1 space-y-0.5">
                            {enrichment.financialImpact.map((f, i) => (
                              <li key={i} className="text-xs text-foreground">
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                    {hasCountermeasure && (
                      <div className="flex items-start gap-2">
                        <Shield size={14} className="text-status-success mt-0.5 shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">
                            Countermeasure Effectiveness
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {enrichment.countermeasureEffectiveness.map((c) => (
                              <span
                                key={c}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-status-success/10 text-status-success border border-status-success/20"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

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
              <div className="pt-4 border-t border-border mt-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <BookOpen size={14} /> Learn More
                </h3>
                <div className="flex flex-wrap gap-2">
                  {threat.relatedModules.map((slug) => {
                    // eslint-disable-next-line security/detect-object-injection
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

          {/* Run Assessment CTA */}
          <div className="mx-6 mb-4 p-4 rounded-lg border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <ClipboardCheck size={14} className="text-primary shrink-0" />
                Does this threat apply to your organization?
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Run the PQC Risk Assessment to see your exposure score and migration priorities.
              </p>
            </div>
            <Link
              to="/assess"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-secondary to-primary text-primary-foreground rounded-lg hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200 shrink-0"
            >
              Run Assessment
              <ArrowRight size={12} />
            </Link>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="p-4 border-t bg-card sticky bottom-0 z-10 shrink-0 flex flex-wrap justify-end gap-2 items-center">
            <EndorseButton
              endorseUrl={buildEndorsementUrl({
                category: 'threat-endorsement',
                title: `Endorse: ${threat.threatId} — ${threat.industry}`,
                resourceType: 'Threat Assessment',
                resourceId: threat.threatId,
                resourceDetails: [
                  `**Threat ID:** ${threat.threatId}`,
                  `**Industry:** ${threat.industry}`,
                  `**Criticality:** ${threat.criticality}`,
                  `**At-Risk Crypto:** ${threat.cryptoAtRisk}`,
                  `**PQC Mitigation:** ${threat.pqcReplacement}`,
                ].join('\n'),
                pageUrl: `/threats?threat=${encodeURIComponent(threat.threatId)}`,
              })}
              resourceLabel={threat.threatId}
              resourceType="Threat"
              label="Endorse"
            />
            <FlagButton
              flagUrl={buildFlagUrl({
                category: 'threat-endorsement',
                title: `Flag: ${threat.threatId} — ${threat.industry}`,
                resourceType: 'Threat Assessment',
                resourceId: threat.threatId,
                resourceDetails: [
                  `**Threat ID:** ${threat.threatId}`,
                  `**Industry:** ${threat.industry}`,
                  `**Criticality:** ${threat.criticality}`,
                  `**At-Risk Crypto:** ${threat.cryptoAtRisk}`,
                  `**PQC Mitigation:** ${threat.pqcReplacement}`,
                ].join('\n'),
                pageUrl: `/threats?threat=${encodeURIComponent(threat.threatId)}`,
              })}
              resourceLabel={threat.threatId}
              resourceType="Threat"
              label="Flag"
            />
            <AskAssistantButton
              label="Ask Assistant"
              question={`What are the recommended PQC mitigations for ${threat.threatId} in the ${threat.industry} sector? Criticality: ${threat.criticality}. Crypto at risk: ${threat.cryptoAtRisk}. Recommended replacement: ${threat.pqcReplacement}.`}
            />
          </div>
        </div>
      </div>
    </FocusLock>
  )
}
