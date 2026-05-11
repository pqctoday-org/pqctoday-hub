// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useEffect, useCallback, useState } from 'react'
import {
  ArrowRight,
  Info,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Import,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { useComplianceSelectionStore } from '../../../store/useComplianceSelectionStore'
import { usePersonaStore } from '../../../store/usePersonaStore'
import { complianceFrameworks, type ComplianceFramework } from '../../../data/complianceData'
import { deadlineUrgency, urgencyColor } from '../../../utils/deadlineUrgency'
import {
  applicableFrameworks,
  isProfileEmpty,
  type ApplicabilityResult,
  type ApplicabilityTier,
} from '../../../utils/applicabilityEngine'
import { TIER_STYLES } from '../../applicability/parts/tierStyles'
import { Button } from '../../ui/button'
import { PersonaHint } from './PersonaHint'
import { useSemanticSearch } from '@/services/search/useSemanticSearch'

// Tiers shown in the assess step — informational omitted (too noisy for selection).
const TIER_ORDER: ApplicabilityTier[] = ['mandatory', 'recognized', 'cross-border', 'advisory']

const Step5Compliance = () => {
  const {
    complianceRequirements,
    toggleCompliance,
    setComplianceRequirements,
    complianceUnknown,
    setComplianceUnknown,
    industry,
    importComplianceSelection,
    setImportComplianceSelection,
  } = useAssessmentStore()
  const country = useAssessmentStore((s) => s.country)
  const { selectedRegion } = usePersonaStore()

  const myFrameworks = useComplianceSelectionStore((s) => s.myFrameworks)
  const toggleMyFramework = useComplianceSelectionStore((s) => s.toggleMyFramework)

  // Group applicable frameworks by tier (mandatory → recognized → cross-border → advisory).
  // Uses the shared applicabilityEngine directly (no persona lens caps) so the user
  // sees every applicable framework ranked by regulatory relevance — mandatory
  // obligations listed first with their reason string ("Your regulator: ASD").
  // Empty profile falls back to all frameworks as advisory.
  const { groupedByTier, filteredFrameworkIds } = useMemo(() => {
    const profile = { industry, country, region: selectedRegion }

    const results: ApplicabilityResult<ComplianceFramework>[] = isProfileEmpty(profile)
      ? complianceFrameworks.map((fw) => ({ item: fw, tier: 'advisory' as const, reason: '' }))
      : applicableFrameworks(profile).filter((r) => r.tier !== 'informational')

    const ids = new Set(results.map((r) => r.item.id))

    // Sort: tier order → requiresPQC first → deadline year asc → label asc
    results.sort((a, b) => {
      const ta = TIER_ORDER.indexOf(a.tier)
      const tb = TIER_ORDER.indexOf(b.tier)
      if (ta !== tb) return (ta < 0 ? 99 : ta) - (tb < 0 ? 99 : tb)
      if (a.item.requiresPQC !== b.item.requiresPQC) return a.item.requiresPQC ? -1 : 1
      const ya = a.item.deadline.match(/\b(20\d{2})\b/)?.[1]
      const yb = b.item.deadline.match(/\b(20\d{2})\b/)?.[1]
      if (ya && yb) return parseInt(ya, 10) - parseInt(yb, 10)
      if (ya) return -1
      if (yb) return 1
      return a.item.label.localeCompare(b.item.label)
    })

    const groups = new Map<ApplicabilityTier, ApplicabilityResult<ComplianceFramework>[]>()
    for (const r of results) {
      const tier: ApplicabilityTier = TIER_ORDER.includes(r.tier) ? r.tier : 'advisory'
      if (!groups.has(tier)) groups.set(tier, [])
      groups.get(tier)!.push(r)
    }

    return { groupedByTier: groups, filteredFrameworkIds: ids }
  }, [industry, country, selectedRegion])

  // Bidirectional sync: when import ON, sync complianceRequirements from myFrameworks
  useEffect(() => {
    if (!importComplianceSelection || complianceUnknown) return
    const labels = complianceFrameworks
      .filter((fw) => myFrameworks.includes(fw.id) && filteredFrameworkIds.has(fw.id))
      .map((fw) => fw.label)
    setComplianceRequirements(labels)
  }, [
    importComplianceSelection,
    myFrameworks,
    filteredFrameworkIds,
    complianceUnknown,
    setComplianceRequirements,
  ])

  // Toggle handler: bidirectional when import ON
  const handleToggle = useCallback(
    (fw: ComplianceFramework) => {
      if (importComplianceSelection) {
        toggleMyFramework(fw.id)
      } else {
        toggleCompliance(fw.label)
      }
    },
    [importComplianceSelection, toggleMyFramework, toggleCompliance]
  )

  const isSelected = useCallback(
    (fw: ComplianceFramework) => {
      if (complianceUnknown) return complianceRequirements.includes(fw.label)
      if (importComplianceSelection) return myFrameworks.includes(fw.id)
      return complianceRequirements.includes(fw.label)
    },
    [complianceUnknown, importComplianceSelection, myFrameworks, complianceRequirements]
  )

  // Phase 3 — free-text business-context rescue. When the structured
  // industry/country/region inputs don't surface a framework the user
  // knows applies (niche or regional), they describe their context in
  // plain language. Semantic search ranks every compliance framework
  // by similarity, and we show the top-5 that aren't already visible
  // in the tier groups above. One-click adds them to the selection.
  const [contextOpen, setContextOpen] = useState(false)
  const [contextText, setContextText] = useState('')
  const semanticContext = useSemanticSearch('compliance', contextText, { limit: 20 })
  const contextSuggestions = useMemo(() => {
    if (semanticContext.mode !== 'semantic' || semanticContext.hits.length === 0) return []
    // Build a lookup once: id (lowercased) → framework.
    const fwById = new Map(complianceFrameworks.map((fw) => [fw.id.toLowerCase(), fw]))
    const out: { fw: ComplianceFramework; score: number }[] = []
    for (const hit of semanticContext.hits) {
      const fw = fwById.get(hit.id.toLowerCase())
      if (!fw) continue
      // Skip frameworks already visible in the tier groups.
      if (filteredFrameworkIds.has(fw.id)) continue
      out.push({ fw, score: hit.score })
      if (out.length >= 5) break
    }
    return out
  }, [semanticContext.mode, semanticContext.hits, filteredFrameworkIds])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-foreground">
          Which compliance frameworks apply to you?
        </h3>
        <Button
          variant="ghost"
          type="button"
          onClick={() => setImportComplianceSelection(!importComplianceSelection)}
          className={clsx(
            'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium whitespace-nowrap shrink-0',
            importComplianceSelection
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30'
          )}
          aria-pressed={importComplianceSelection}
          title={
            importComplianceSelection
              ? 'Syncing with your compliance page selections'
              : 'Using manual selections for this assessment only'
          }
        >
          <Import size={12} />
          {importComplianceSelection ? 'Synced' : 'Import off'}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Select all regulatory or compliance frameworks your organization must adhere to. This helps
        identify PQC-related obligations.
      </p>

      {importComplianceSelection && myFrameworks.length > 0 && (
        <div className="glass-panel p-3 border-l-4 border-l-secondary">
          <div className="flex items-center gap-2">
            <Import size={14} className="text-secondary shrink-0" />
            <p className="text-xs text-muted-foreground">
              Synced with your{' '}
              <Link to="/compliance" className="text-primary hover:underline">
                compliance page
              </Link>{' '}
              selections ({myFrameworks.length} total). Changes here update your saved selections.
            </p>
          </div>
        </div>
      )}

      <PersonaHint stepKey="compliance" />

      {/* None apply / I don't know */}
      <Button
        variant="ghost"
        aria-pressed={complianceUnknown}
        onClick={() => setComplianceUnknown(!complianceUnknown)}
        className={clsx(
          'w-full h-auto p-3 justify-start gap-2 whitespace-normal border',
          complianceUnknown
            ? 'border-muted-foreground bg-muted/20 text-foreground hover:bg-muted/20'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground hover:bg-transparent'
        )}
        data-workshop-target="assess-not-sure"
      >
        <Info size={14} className="shrink-0" />
        I&apos;m not sure — help me choose
      </Button>
      {complianceUnknown && (
        <p className="text-xs text-muted-foreground italic">
          Recommended for {industry || 'your industry'}
          {country && country !== 'Global' ? ` in ${country}` : ''}. You can adjust any selection.
        </p>
      )}

      <div className="space-y-5">
        {industry && (
          <div className="glass-panel p-3 border-l-4 border-l-primary">
            <div className="flex items-center gap-2">
              <Info size={14} className="text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                Showing frameworks relevant to{' '}
                <strong className="text-foreground">{industry}</strong>
                {country && country !== 'Global' && (
                  <>
                    {' '}
                    in <strong className="text-foreground">{country}</strong>
                  </>
                )}
                .
              </p>
            </div>
          </div>
        )}

        {TIER_ORDER.map((tier) => {
          const results = groupedByTier.get(tier)
          if (!results?.length) return null
          const styles = TIER_STYLES[tier]

          return (
            <div key={tier}>
              <div className="flex items-center gap-2 mb-2">
                <span className={clsx('w-2 h-2 rounded-full shrink-0', styles.dot)} />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                  {styles.label}
                </span>
                <span className="text-xs text-muted-foreground">({results.length})</span>
              </div>

              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-2"
                role="group"
                aria-label={styles.label}
              >
                {results.map(({ item: fw, reason }) => {
                  const selected = isSelected(fw)
                  const urgency = deadlineUrgency(fw.deadline)
                  const showDeadline = fw.deadline && fw.deadline !== 'Ongoing'

                  return (
                    <Button
                      key={fw.id}
                      variant="ghost"
                      aria-pressed={selected}
                      onClick={() => handleToggle(fw)}
                      className={clsx(
                        'h-auto p-3 flex-col items-start whitespace-normal border',
                        selected
                          ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                          : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-transparent'
                      )}
                    >
                      <div className="flex items-center gap-2 w-full">
                        {fw.requiresPQC ? (
                          <ShieldCheck size={14} className="text-status-success shrink-0" />
                        ) : (
                          <ShieldAlert size={14} className="text-muted-foreground shrink-0" />
                        )}
                        <span className="text-sm font-medium">{fw.label}</span>
                      </div>
                      {reason && (
                        <p className="text-[10px] mt-0.5 text-muted-foreground/70 font-normal leading-snug">
                          {reason}
                        </p>
                      )}
                      {showDeadline && (
                        <div
                          className={clsx(
                            'flex items-center gap-1 text-[10px] mt-1',
                            urgencyColor(urgency)
                          )}
                        >
                          <Clock size={10} />
                          <span>{fw.deadline}</span>
                        </div>
                      )}
                      {fw.description && (
                        <p className="text-xs mt-1 opacity-80 font-normal leading-snug line-clamp-2 text-left">
                          {fw.description}
                        </p>
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Free-text business-context disclosure (Phase 3) */}
        <div className="glass-panel p-3">
          <Button
            variant="ghost"
            onClick={() => setContextOpen((v) => !v)}
            className="w-full flex items-center gap-2 justify-start text-sm font-medium text-foreground hover:bg-transparent px-0"
            aria-expanded={contextOpen}
          >
            <Sparkles size={14} className="text-primary shrink-0" />
            Don&apos;t see your framework? Describe your context
            {contextOpen ? (
              <ChevronUp size={14} className="ml-auto text-muted-foreground" />
            ) : (
              <ChevronDown size={14} className="ml-auto text-muted-foreground" />
            )}
          </Button>
          {contextOpen && (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                In plain language, describe your business, products, or jurisdictional context.
                We&apos;ll surface frameworks beyond what the structured filters above show.
              </p>
              <textarea
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="e.g. Brazilian fintech offering instant-payment APIs with PIX integration"
                rows={3}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
              {semanticContext.loading && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Sparkles size={10} className="animate-pulse text-primary/60" />
                  Loading semantic search…
                </p>
              )}
              {semanticContext.mode === 'lexical' && contextText.trim() && (
                <p className="text-xs text-muted-foreground">
                  Semantic search unavailable in this session — type a framework name in the page
                  above instead.
                </p>
              )}
              {contextSuggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">
                    Suggested frameworks ({contextSuggestions.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {contextSuggestions.map(({ fw, score }) => {
                      const selected = isSelected(fw)
                      return (
                        <Button
                          key={fw.id}
                          variant="ghost"
                          onClick={() => handleToggle(fw)}
                          className={clsx(
                            'text-xs h-auto px-2.5 py-1.5 border flex items-center gap-1.5',
                            selected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-foreground hover:border-primary/40 hover:bg-primary/5'
                          )}
                          title={`Cosine similarity ${score.toFixed(2)} — click to ${selected ? 'remove' : 'add'} to your selection`}
                        >
                          {!selected && <Plus size={10} />}
                          <span>{fw.label}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {Math.round(score * 100)}%
                          </span>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )}
              {contextText.trim().length > 0 &&
                !semanticContext.loading &&
                semanticContext.mode === 'semantic' &&
                contextSuggestions.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No additional frameworks matched — your structured filters above already cover
                    the strongest candidates.
                  </p>
                )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Don&apos;t see your framework? Skip this step — it won&apos;t affect your risk score
            significantly.
          </p>
          <Link
            to="/compliance"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1 shrink-0 ml-2"
          >
            <ArrowRight size={12} />
            Explore frameworks
          </Link>
        </div>
      </div>
    </div>
  )
}

export { Step5Compliance }
