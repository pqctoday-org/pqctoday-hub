// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useMemo, useRef } from 'react'
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
  ShieldCheck,
  ClipboardCheck,
  ArrowRight,
  BookCheck,
  CalendarCheck,
  Landmark,
  CheckCircle2,
  CircleDashed,
  ListChecks,
} from 'lucide-react'
import { Link } from 'react-router'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Radar, Siren } from 'lucide-react'
import { ThreatClassBadge, ShorTierBadge } from './ThreatClassBadges'
import { getSocUseCases, getIrPlaybooks, getShorTier, SHOR_TIER_DEFS } from './threatClassification'
import { formatSocCite, SOC_CTI_SECTION, SOC_LEARN_MODULE_HREF } from '@/data/socQuantumPlaybook'
import { getAttackProfiles } from '@/data/implementationAttackProfiles'
import { NOT_YET_SPECIFIED, UNRATED_CRITICALITY } from '@/data/threatRowRules'
import {
  claimsCheckedText,
  formatSourceCaveat,
  getSourceCaveat,
  getThreatLineage,
  secondSourceLines,
  sourceFactLines,
  sourceIdentityText,
} from '@/data/threatClaimStatus'

/** An at-risk / PQC field, or an honest "not yet specified" when blank. */
const SpecifiedOrNot = ({ value }: { value: string }) =>
  value.trim() ? (
    <p className="text-sm font-mono text-foreground/80 break-words">{value}</p>
  ) : (
    <p className="text-sm italic text-muted-foreground">{NOT_YET_SPECIFIED}</p>
  )

interface ThreatDetailDialogProps {
  threat: ThreatItem
  onClose: () => void
}

export const ThreatDetailDialog: React.FC<ThreatDetailDialogProps> = ({ threat, onClose }) => {
  // Implementation-attack surface of the recommended PQC replacement(s) — cross-linked
  // from the single-source attack-profile data (no duplication of the Algorithms tab).
  const replacementAttackProfiles = useMemo(
    () => getAttackProfiles(threat.pqcReplacement),
    [threat.pqcReplacement]
  )

  const sourceCaveat = useMemo(
    () => getSourceCaveat(threat.threatId, threat.secondarySources),
    [threat.threatId, threat.secondarySources]
  )
  const secondSources = useMemo(
    () => secondSourceLines(threat.secondarySources),
    [threat.secondarySources]
  )
  const lineage = useMemo(() => getThreatLineage(threat.threatId), [threat.threatId])
  const claimsLine = claimsCheckedText(lineage)
  const sourceFacts = sourceFactLines(threat)

  // Set when the CTI pointer closes the dialog to scroll to the Horizon
  // section: focus must not return to (and scroll back to) the trigger row.
  const jumpingToHorizon = useRef(false)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (!threat) return null

  return (
    <FocusLock returnFocus={() => (jumpingToHorizon.current ? { preventScroll: true } : true)}>
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
              className="text-muted-foreground hover:text-foreground transition-colors min-h-[44px] min-w-[44px] p-2.5 md:min-h-0 md:min-w-0 md:p-1"
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
                <SpecifiedOrNot value={threat.cryptoAtRisk} />
              </div>

              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
                  <Cpu size={14} /> PQC Mitigation
                </h3>
                <SpecifiedOrNot value={threat.pqcReplacement} />
              </div>
            </div>

            {replacementAttackProfiles.length > 0 && (
              <div className="bg-status-warning/10 p-4 rounded-lg border border-status-warning/20">
                <h3 className="text-sm font-semibold text-status-warning mb-2 flex items-center gap-2">
                  <ShieldAlert size={14} /> Implementation pitfalls of the PQC replacement
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Migrating the algorithm isn&apos;t enough — these PQC algorithms have documented
                  implementation-level attack surfaces (side-channel, fault injection, RNG). Harden
                  against them during rollout.
                </p>
                <div className="space-y-1.5">
                  {replacementAttackProfiles.map((p) => {
                    const evidence = p.attacks.filter((a) => a.status === 'yes').length
                    return (
                      <div
                        key={p.algorithm}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-medium text-foreground">{p.algorithm}</span>
                        <span className="text-muted-foreground">
                          {evidence} attack {evidence === 1 ? 'category' : 'categories'} with
                          evidence
                        </span>
                      </div>
                    )
                  })}
                </div>
                <Link
                  to="/algorithms?tab=validation&section=attacks"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Full attack profiles &amp; countermeasures <ArrowRight size={12} />
                </Link>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Criticality
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      threat.criticality.toLowerCase() === 'critical'
                        ? 'bg-status-error text-status-error border border-status-error'
                        : threat.criticality.toLowerCase() === 'high'
                          ? 'bg-status-error text-status-error border border-status-error'
                          : threat.criticality === UNRATED_CRITICALITY
                            ? 'bg-muted/40 text-muted-foreground border border-border'
                            : 'bg-status-warning text-status-warning border border-status-warning'
                    }`}
                  >
                    {threat.criticality}
                  </span>
                  {/* Derived dimensions — Threats #2 (class) / #4 (Shor tier) */}
                  <ThreatClassBadge threat={threat} />
                  <ShorTierBadge threat={threat} />
                </div>
                {/* Shor-resource tier explanation — Threats #4 */}
                <p className="text-xs text-muted-foreground mt-2">
                  {SHOR_TIER_DEFS[getShorTier(threat)].blurb}
                </p>
              </div>
            </div>

            {/* Evidence — lineage, not scores (ruling R2 / UX-4). What the
              reader can check: is the cited document the one this row names,
              how many of the row's claims it was found to state, which
              approved second sources state the rest, and when the row was
              last verified. No extraction-confidence or "accuracy"
              percentages: those were scores about the extraction, not
              evidence about the claim. data_quality_notes is NOT rendered —
              it is the maintenance log, written for maintainers. */}
            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <ShieldCheck size={14} className="text-primary" /> Evidence
              </h3>
              {threat.sourceUrl ? (
                <a
                  href={threat.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-2 text-primary hover:underline text-sm break-words"
                >
                  <ExternalLink size={14} className="mt-0.5 shrink-0" />
                  <span>
                    {threat.mainSource || 'View Source'}
                    {threat.sourceMirrorOf && (
                      <span className="text-muted-foreground">
                        {' '}
                        (mirror of {threat.sourceMirrorOf})
                      </span>
                    )}
                  </span>
                </a>
              ) : (
                threat.mainSource && <p className="text-sm text-foreground">{threat.mainSource}</p>
              )}
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-1.5">
                  {lineage.sourceConfirmed ? (
                    <CheckCircle2
                      size={12}
                      className="mt-0.5 shrink-0 text-status-success"
                      aria-hidden="true"
                    />
                  ) : (
                    <CircleDashed size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                  )}
                  <span>{sourceIdentityText(lineage)}</span>
                </li>
                {claimsLine && (
                  <li className="flex items-start gap-1.5">
                    <ListChecks size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>{claimsLine}</span>
                  </li>
                )}
                {sourceFacts.map((f) => (
                  <li key={f.key} className="flex items-start gap-1.5">
                    {f.key === 'peer' ? (
                      <BookCheck size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <Landmark size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                    )}
                    <span>{f.text}</span>
                  </li>
                ))}
                {threat.lastVerified && (
                  <li className="flex items-start gap-1.5">
                    <CalendarCheck size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                    <span>Last verified {threat.lastVerified}</span>
                  </li>
                )}
              </ul>
              {/* Reader caveat from the claim ledger: the cited document
                  does not itself state this entry's quantum-specific
                  points. Never "the source disagrees" — see
                  threatClaimStatus.ts. */}
              {sourceCaveat && (
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {formatSourceCaveat(sourceCaveat)}
                </p>
              )}
              {/* Approved second sources: an independent document checked
                  word for word to state these claims (review queue). */}
              {secondSources.map((s) => (
                <p key={s.ref} className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  <Link
                    to={`/library?ref=${encodeURIComponent(s.ref)}`}
                    className="text-primary hover:underline"
                  >
                    {s.text}
                  </Link>
                </p>
              ))}
            </div>

            {/* Detection / SOC + Incident-Response — Threats #3 / #6 */}
            <div className="pt-4 border-t border-border mt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Radar size={14} className="text-primary" /> Detection &amp; Response
              </h3>
              <Tabs defaultValue="detection">
                <TabsList>
                  <TabsTrigger value="detection" className="gap-1.5">
                    <Radar size={13} aria-hidden="true" /> Detection / SOC
                  </TabsTrigger>
                  <TabsTrigger value="response" className="gap-1.5">
                    <Siren size={13} aria-hidden="true" /> Incident Response
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="detection">
                  <p className="text-xs text-muted-foreground mb-3">
                    SOC detection use cases that apply to this threat&apos;s class, from the Applied
                    Quantum PQC Migration Framework v3.0 &ldquo;SOC Implementation&rdquo; section.
                  </p>
                  <ul className="space-y-2.5">
                    {getSocUseCases(threat).map((uc) => (
                      <li
                        key={uc.id}
                        className="bg-muted/30 rounded-lg border border-border/50 p-3"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            {uc.code}
                          </span>
                          <span className="text-xs font-semibold text-foreground">{uc.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{uc.summary}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Source: {formatSocCite(uc.source)}
                          {uc.sourceHeading !== uc.title && (
                            <> (titled &ldquo;{uc.sourceHeading}&rdquo; in v3.0)</>
                          )}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-muted-foreground mt-3">
                    Tracking progress toward a CRQC is threat intelligence, not a detection use case
                    ({SOC_CTI_SECTION.title}, {formatSocCite(SOC_CTI_SECTION.source)}) — see the{' '}
                    <a
                      href="#crqc-threat-horizon"
                      onClick={(e) => {
                        e.preventDefault()
                        jumpingToHorizon.current = true
                        onClose()
                        document
                          .getElementById('crqc-threat-horizon')
                          ?.scrollIntoView({ block: 'start' })
                      }}
                      className="text-primary hover:underline"
                    >
                      CRQC Threat Horizon
                    </a>{' '}
                    on this page.
                  </p>
                </TabsContent>

                <TabsContent value="response">
                  <p className="text-xs text-muted-foreground mb-3">
                    Incident-response playbooks from the same source that apply to this
                    threat&apos;s class.
                  </p>
                  <ul className="space-y-2.5">
                    {getIrPlaybooks(threat).map((pb) => (
                      <li
                        key={pb.id}
                        className="bg-muted/30 rounded-lg border border-border/50 p-3"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Siren size={14} className="text-status-error shrink-0" />
                          <span className="text-sm font-semibold text-foreground">
                            Playbook {pb.number}: {pb.title}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          <span className="font-semibold text-foreground/80">Trigger:</span>{' '}
                          {pb.trigger}
                        </p>
                        <p className="text-xs text-muted-foreground">{pb.summary}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Source: {formatSocCite(pb.source)}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={SOC_LEARN_MODULE_HREF}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    Learn: SOC Implementation for PQC
                    <ArrowRight size={12} />
                  </Link>
                </TabsContent>
              </Tabs>
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
            {/* Run Assessment CTA — part of the scrolling content now (UX-19).
              It used to sit outside the scroll pane, pinned above the footer,
              permanently covering ~90px of the dialog on every threat. */}
            <div className="pt-4 border-t border-border mt-4">
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center gap-3">
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
                  className="inline-flex min-h-[44px] items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-secondary to-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shrink-0 md:min-h-0"
                >
                  Run Assessment
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
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
                pageUrl: `/threats?id=${encodeURIComponent(threat.threatId)}`,
              })}
              resourceLabel={threat.threatId}
              resourceType="Threat"
              label="Endorse"
              variant="text"
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
                pageUrl: `/threats?id=${encodeURIComponent(threat.threatId)}`,
              })}
              resourceLabel={threat.threatId}
              resourceType="Threat"
              label="Flag"
              variant="text"
            />
            {/* Text labels, not icon-only buttons (UX-19). */}
            <AskAssistantButton
              variant="text"
              className="min-h-[44px]"
              label="Ask Assistant"
              question={`What are the recommended PQC mitigations for ${threat.threatId} in the ${threat.industry} sector? Criticality: ${threat.criticality}. Crypto at risk: ${threat.cryptoAtRisk}. Recommended replacement: ${threat.pqcReplacement}.`}
            />
          </div>
        </div>
      </div>
    </FocusLock>
  )
}
