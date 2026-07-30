// SPDX-License-Identifier: GPL-3.0-only
//
// Industry Landscape tab — dual-mode explorer over the industry-landscape
// source (industry_landscape_* / industry_standards_* / industry_market_size_*
// CSVs). Two entry points, both URL-synced:
//   ?tab=landscape&industry=<label>    — pick an industry, see its use cases,
//                                        mechanisms, standards, market size
//   ?tab=landscape&mechanism=<family>  — pick a crypto mechanism, see every
//                                        industry/use case that relies on it
// Standard chips deep-link to the in-app Library entry via libraryRef.ts —
// the same resolver Protocol Support uses. Protocol chips deep-link into the
// Protocol Support tab.

import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  ExternalLink,
  ArrowLeft,
  BookMarked,
  Landmark as LandmarkIcon,
  GraduationCap as GraduationCapIcon,
  Lock,
  Globe,
} from 'lucide-react'
import {
  loadIndustryLandscape,
  getLandscapeMetadata,
  type IndustryUseCase,
  type IndustryStandard,
  type IndustryMarketSize,
} from '../../data/industryLandscapeData'
import {
  CLASSICAL_MECHANISM_FAMILIES,
  PQC_MECHANISM_FAMILIES,
  getMechanismFamily,
  CYCLONEDX_REGISTRY,
} from '../../data/cryptoMechanisms'
import { PROTOCOL_MATRIX } from '../../data/pqcProtocolMatrix'
import { INDUSTRY_ICONS, USE_CASE_ICONS } from './landscapeIcons'
import { Button } from '../ui/button'
import { libraryHref } from './libraryRef'

// ── Formatting helpers ───────────────────────────────────────────────────────

export function formatMarketSize(usd: number): string {
  if (usd >= 1e12) return `$${(usd / 1e12).toFixed(usd >= 1e13 ? 1 : 2)}T`
  if (usd >= 1e9) return `$${Math.round(usd / 1e9)}B`
  return `$${Math.round(usd / 1e6)}M`
}

const METRIC_LABEL: Record<string, string> = {
  value_added: 'value added',
  revenue: 'revenue',
  gdp_contribution: 'GDP contribution',
  expenditure: 'expenditure',
  payment_value: 'payment value',
  investment: 'investment',
  market_cap: 'market cap',
}

const STATUS_STYLE: Record<IndustryUseCase['migrationStatus'], string> = {
  production: 'bg-status-success/15 text-status-success',
  pilot: 'bg-status-info/15 text-status-info',
  draft: 'bg-status-warning/15 text-status-warning',
  none: 'bg-muted text-muted-foreground',
}

const STATUS_LABEL: Record<IndustryUseCase['migrationStatus'], string> = {
  production: 'PQC in production',
  pilot: 'PQC pilots',
  draft: 'PQC drafts',
  none: 'No PQC path yet',
}

const protocolNames = new Map(PROTOCOL_MATRIX.map((p) => [p.id, p.name]))

// ── Small pieces ─────────────────────────────────────────────────────────────

function MarketSizeBadge({ m }: { m: IndustryMarketSize }) {
  const metric = METRIC_LABEL[m.metricType] ?? m.metricType
  return (
    <a
      href={m.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`${m.figureAsStated} — ${m.mainSource}`}
      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary hover:bg-primary/20"
      onClick={(e) => e.stopPropagation()}
    >
      {formatMarketSize(m.marketSizeUsd)}
      <span className="opacity-70">
        {m.regionScope} {metric} ({m.marketSizeYear})
      </span>
      <ExternalLink size={10} className="opacity-60" />
    </a>
  )
}

function MechanismChip({
  family,
  onSelect,
  active,
}: {
  family: string
  onSelect?: (f: string) => void
  active?: boolean
}) {
  const def = getMechanismFamily(family)
  const classical = def?.classical ?? true
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onSelect ? () => onSelect(family) : undefined}
      className={`h-auto rounded-full border px-2 py-0.5 text-xs font-medium transition-colors ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : classical
            ? 'border-border bg-muted/60 text-foreground hover:border-primary/50'
            : 'border-status-success/40 bg-status-success/10 text-status-success hover:border-status-success'
      }`}
      title={def ? `${def.family} — ${def.kinds.join(', ')}` : family}
    >
      {family}
    </Button>
  )
}

/** Standard chip: mechanisms it references + direct link to the Library page. */
function StandardChip({ std }: { std: IndustryStandard }) {
  return (
    <Link
      to={libraryHref(std.libraryRef)}
      title={`${std.standardLabel} (${std.standardsBody}) — references: ${
        std.mechanismsReferenced.join(', ') || 'no specific mechanisms'
      }. Opens the Library entry.`}
      className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-0.5 text-xs text-foreground hover:border-primary/60 hover:text-primary"
    >
      <BookMarked size={11} className="opacity-60" />
      {std.standardLabel}
      {std.pqcReadiness === 'published' && (
        <span className="rounded bg-status-success/15 px-1 text-[10px] font-semibold text-status-success">
          PQC
        </span>
      )}
      {std.pqcReadiness === 'in-progress' && (
        <span className="rounded bg-status-warning/15 px-1 text-[10px] font-semibold text-status-warning">
          PQC WIP
        </span>
      )}
    </Link>
  )
}

function UseCaseCard({
  uc,
  standards,
  onPickMechanism,
  showIndustry,
}: {
  uc: IndustryUseCase
  standards: IndustryStandard[]
  onPickMechanism: (f: string) => void
  showIndustry?: boolean
}) {
  const Icon = USE_CASE_ICONS[uc.useCaseIcon] ?? Lock
  const relevantStandards = standards.filter(
    (s) =>
      s.industry === uc.industry &&
      (uc.relatedStandards.includes(s.standardId) || s.useCaseIds.includes(uc.useCaseId))
  )
  return (
    <div className="rounded-lg border border-border bg-card p-4" data-use-case={uc.useCaseId}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon size={18} className="shrink-0 text-primary" />
          <h4 className="font-medium text-foreground">{uc.useCaseLabel}</h4>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[uc.migrationStatus]}`}
        >
          {STATUS_LABEL[uc.migrationStatus]}
        </span>
      </div>
      {showIndustry && <p className="mt-1 text-xs text-muted-foreground">{uc.industry}</p>}
      <p className="mt-2 text-sm text-muted-foreground">{uc.summary}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Classical</span>
        {uc.classicalMechanisms.map((m) => (
          <MechanismChip key={m} family={m} onSelect={onPickMechanism} />
        ))}
        {uc.pqcMechanisms.length > 0 && (
          <>
            <span className="ml-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              PQC
            </span>
            {uc.pqcMechanisms.map((m) => (
              <MechanismChip key={m} family={m} onSelect={onPickMechanism} />
            ))}
          </>
        )}
      </div>

      {uc.protocols.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Protocols
          </span>
          {uc.protocols.map((p) => (
            <Link
              key={p}
              to={`/algorithms?tab=support&protocol=${encodeURIComponent(p)}`}
              className="rounded border border-border bg-muted/40 px-2 py-0.5 text-xs text-foreground hover:border-primary/60 hover:text-primary"
              title={`Open ${protocolNames.get(p) ?? p} in Protocol Support`}
            >
              {protocolNames.get(p) ?? p}
            </Link>
          ))}
        </div>
      )}

      {relevantStandards.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Standards
          </span>
          {relevantStandards.map((s) => (
            <StandardChip key={s.standardId} std={s} />
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
        <a
          href={uc.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-[75%] items-center gap-1 truncate hover:text-primary"
          title={uc.mainSource}
        >
          <ExternalLink size={10} className="shrink-0 opacity-60" />
          <span className="truncate">{uc.mainSource}</span>
        </a>
        <span title="Last verified">{uc.lastVerified}</span>
      </div>
    </div>
  )
}

// ── Main view ────────────────────────────────────────────────────────────────

export function IndustryLandscapeView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { useCases, standards, marketSizes } = loadIndustryLandscape()
  const meta = getLandscapeMetadata()

  const selectedIndustry = searchParams.get('industry')
  const selectedMechanism = searchParams.get('mechanism')
  const mode: 'industry' | 'mechanism' = selectedMechanism ? 'mechanism' : 'industry'

  const industries = useMemo(
    () => Array.from(new Set(useCases.map((u) => u.industry))).sort(),
    [useCases]
  )
  const marketByIndustry = useMemo(
    () => new Map(marketSizes.map((m) => [m.industry, m])),
    [marketSizes]
  )
  const useCasesByIndustry = useMemo(() => {
    const map = new Map<string, IndustryUseCase[]>()
    for (const uc of useCases) {
      const list = map.get(uc.industry) ?? []
      list.push(uc)
      map.set(uc.industry, list)
    }
    return map
  }, [useCases])

  const update = (updates: Record<string, string | null>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(updates)) {
          if (v === null) next.delete(k)
          else next.set(k, v)
        }
        return next
      },
      { replace: true }
    )
  }

  const pickIndustry = (industry: string | null) => update({ industry, mechanism: null })
  const pickMechanism = (mechanism: string | null) => update({ mechanism, industry: null })

  const mechanismDef = selectedMechanism ? getMechanismFamily(selectedMechanism) : undefined
  const mechanismHits = useMemo(() => {
    if (!selectedMechanism) return []
    return useCases.filter(
      (u) =>
        u.classicalMechanisms.includes(selectedMechanism) ||
        u.pqcMechanisms.includes(selectedMechanism)
    )
  }, [useCases, selectedMechanism])
  const standardsForMechanism = useMemo(() => {
    if (!selectedMechanism) return []
    return standards.filter((s) => s.mechanismsReferenced.includes(selectedMechanism))
  }, [standards, selectedMechanism])

  return (
    <div data-workshop-target="section-algorithm-industry-landscape">
      {/* Mode toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Explore by</span>
        <div className="inline-flex overflow-hidden rounded-md border border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={() => update({ mechanism: null })}
            className={`h-auto rounded-none px-3 py-1.5 text-sm ${mode === 'industry' ? 'bg-primary text-primary-foreground hover:bg-primary' : 'bg-card text-foreground hover:bg-muted'}`}
          >
            Industry
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (mode !== 'mechanism') pickMechanism('RSA')
            }}
            className={`h-auto rounded-none px-3 py-1.5 text-sm ${mode === 'mechanism' ? 'bg-primary text-primary-foreground hover:bg-primary' : 'bg-card text-foreground hover:bg-muted'}`}
          >
            Mechanism
          </Button>
        </div>
        {meta.landscape && (
          <span className="ml-auto text-xs text-muted-foreground">
            Data: {meta.landscape.filename}
          </span>
        )}
      </div>

      {mode === 'mechanism' && (
        <>
          <div className="mb-4 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="w-16 text-[11px] uppercase tracking-wide text-muted-foreground">
                Classical
              </span>
              {CLASSICAL_MECHANISM_FAMILIES.map((m) => (
                <MechanismChip
                  key={m.family}
                  family={m.family}
                  active={m.family === selectedMechanism}
                  onSelect={pickMechanism}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="w-16 text-[11px] uppercase tracking-wide text-muted-foreground">
                PQC
              </span>
              {PQC_MECHANISM_FAMILIES.map((m) => (
                <MechanismChip
                  key={m.family}
                  family={m.family}
                  active={m.family === selectedMechanism}
                  onSelect={pickMechanism}
                />
              ))}
            </div>
          </div>

          {mechanismDef && (
            <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{mechanismDef.family}</span>
                <span className="text-xs text-muted-foreground">
                  {mechanismDef.classical ? 'classical' : 'post-quantum'} ·{' '}
                  {mechanismDef.kinds.join(', ')} · {mechanismDef.registryMembers.length} parameter
                  set{mechanismDef.registryMembers.length === 1 ? '' : 's'}
                </span>
                {mechanismDef.cycloneDxFamilies.length > 0 ? (
                  <a
                    href={CYCLONEDX_REGISTRY.landingPage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary hover:bg-primary/20"
                    title={`CycloneDX ${CYCLONEDX_REGISTRY.specVersion} cryptography registry algorithmFamily (registry data ${CYCLONEDX_REGISTRY.verifiedAgainst})`}
                  >
                    CycloneDX: {mechanismDef.cycloneDxFamilies.join(', ')}
                    <ExternalLink size={10} />
                  </a>
                ) : (
                  <span
                    className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    title="No entry in the CycloneDX 1.7 cryptography registry"
                  >
                    No CycloneDX registry entry
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Used in {mechanismHits.length} use case{mechanismHits.length === 1 ? '' : 's'}{' '}
                across {new Set(mechanismHits.map((u) => u.industry)).size} industries
                {standardsForMechanism.length > 0 &&
                  ` · referenced by ${standardsForMechanism.length} standard${standardsForMechanism.length === 1 ? '' : 's'}`}
                .
              </p>
              {standardsForMechanism.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Referenced by
                  </span>
                  {standardsForMechanism.map((s) => (
                    <StandardChip key={`${s.industry}-${s.standardId}`} std={s} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-6">
            {industries
              .filter((ind) => mechanismHits.some((u) => u.industry === ind))
              .map((ind) => {
                const IndIcon = INDUSTRY_ICONS[ind] ?? Globe
                const hits = mechanismHits.filter((u) => u.industry === ind)
                const market = marketByIndustry.get(ind)
                return (
                  <div key={ind}>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => pickIndustry(ind)}
                      className="mb-2 flex h-auto items-center gap-2 p-0 text-left hover:bg-transparent"
                      title={`Open ${ind} in industry view`}
                    >
                      <IndIcon size={18} className="text-primary" />
                      <span className="font-medium text-foreground hover:text-primary">{ind}</span>
                      {market && <MarketSizeBadge m={market} />}
                    </Button>
                    <div className="grid gap-3 md:grid-cols-2">
                      {hits.map((uc) => (
                        <UseCaseCard
                          key={uc.useCaseId}
                          uc={uc}
                          standards={standards}
                          onPickMechanism={pickMechanism}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        </>
      )}

      {mode === 'industry' && !selectedIndustry && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {industries.map((ind) => {
            const IndIcon = INDUSTRY_ICONS[ind] ?? Globe
            const market = marketByIndustry.get(ind)
            const count = useCasesByIndustry.get(ind)?.length ?? 0
            return (
              <Button
                key={ind}
                type="button"
                variant="ghost"
                onClick={() => pickIndustry(ind)}
                className="flex h-auto flex-col items-start gap-2 whitespace-normal rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/60 hover:bg-card"
                data-industry={ind}
              >
                <IndIcon size={22} className="text-primary" />
                <span className="text-sm font-medium leading-tight text-foreground">{ind}</span>
                <span className="text-xs text-muted-foreground">
                  {count} use case{count === 1 ? '' : 's'}
                </span>
                {market && <MarketSizeBadge m={market} />}
              </Button>
            )
          })}
        </div>
      )}

      {mode === 'industry' && selectedIndustry && (
        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => pickIndustry(null)}
            className="mb-3 inline-flex h-auto items-center gap-1 p-0 text-sm text-muted-foreground hover:bg-transparent hover:text-primary"
          >
            <ArrowLeft size={14} /> All industries
          </Button>
          {(() => {
            const IndIcon = INDUSTRY_ICONS[selectedIndustry] ?? Globe
            const market = marketByIndustry.get(selectedIndustry)
            const cases = useCasesByIndustry.get(selectedIndustry) ?? []
            const industryStandards = standards.filter((s) => s.industry === selectedIndustry)
            if (cases.length === 0) {
              return (
                <p className="text-sm text-muted-foreground">
                  No use cases recorded for “{selectedIndustry}”.{' '}
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto p-0 underline hover:bg-transparent hover:text-primary"
                    onClick={() => pickIndustry(null)}
                  >
                    Back to all industries.
                  </Button>
                </p>
              )
            }
            return (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
                  <IndIcon size={26} className="text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">{selectedIndustry}</h3>
                  {market ? (
                    <MarketSizeBadge m={market} />
                  ) : (
                    <span
                      className="text-xs text-muted-foreground"
                      title="No official-statistics market size on record for this category"
                    >
                      No official market-size figure
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-3">
                    {cases[0]?.learnModuleId && (
                      <Link
                        to={`/learn/${cases[0].learnModuleId}`}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                      >
                        <GraduationCapIcon size={12} /> Learn: {selectedIndustry}
                      </Link>
                    )}
                    <Link
                      to={`/threats?industry=${encodeURIComponent(selectedIndustry)}`}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      <LandmarkIcon size={12} /> Quantum threats for this industry
                    </Link>
                  </div>
                </div>

                {industryStandards.length > 0 && (
                  <div className="mb-4 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Applicable standards
                    </span>
                    {industryStandards.map((s) => (
                      <StandardChip key={s.standardId} std={s} />
                    ))}
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  {cases.map((uc) => (
                    <UseCaseCard
                      key={uc.useCaseId}
                      uc={uc}
                      standards={standards}
                      onPickMechanism={pickMechanism}
                    />
                  ))}
                </div>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
