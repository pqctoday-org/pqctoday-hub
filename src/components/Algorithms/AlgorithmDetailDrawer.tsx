// SPDX-License-Identifier: GPL-3.0-only
/**
 * AlgorithmDetailDrawer — the per-algorithm detail opened by `?algo=<algorithm_id>`
 * (AlgorithmsView). Right-anchored overlay, same shape as the Library and
 * Patents drawers (transform-only entrance, scrim + Esc close). Content is the
 * per-algorithm fields the Detailed Comparison row already shows, laid out as
 * one card instead of spread across nine columns, plus the row's Try / Spec /
 * Why links and the indexed implementations.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { X, ExternalLink, GitBranch } from 'lucide-react'
import clsx from 'clsx'
import FocusLock from 'react-focus-lock'
import { Button } from '@/components/ui/button'
import { ItemShareButton, itemShareTitle } from '@/components/common/ItemShareButton'
import {
  type AlgorithmDetail,
  getPerformanceCategory,
  getPerformanceColor,
  getSecurityLevelColor,
  getCryptoFamilyColor,
  RESEARCH_NEEDED,
  isResearchNeeded,
} from '@/data/pqcAlgorithmsData'
import { isDraftTier } from '@/data/algorithmStatusTier'
import { resolveAlgoXrefs } from '@/data/algoProductXrefData'
import { AlgoCtaStrip } from './AlgoCtaStrip'
import { classifyCnsa20, cnsa20ChipClasses } from './cnsa20'

interface AlgorithmDetailDrawerProps {
  algo: AlgorithmDetail | null
  onClose: () => void
}

/** Outer guard — remounts the panel per algorithm so the entrance animation
 *  and scroll position reset cleanly each open. */
export function AlgorithmDetailDrawer(props: AlgorithmDetailDrawerProps) {
  if (!props.algo) return null
  return <DrawerPanel key={props.algo.id} algo={props.algo} onClose={props.onClose} />
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-[12.5px] text-foreground">{children}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-4">
      <h3 className="mb-2 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  )
}

function bytes(value: number | null, unknown: boolean) {
  if (unknown || value === null || value === 0) {
    return <span className="italic text-muted-foreground">{RESEARCH_NEEDED}</span>
  }
  return <span className="font-mono">{value.toLocaleString()} B</span>
}

function Perf({ cycles }: { cycles: string }) {
  const category = getPerformanceCategory(cycles)
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span
        className={clsx(
          'rounded border px-1.5 py-0.5 text-[11px] font-medium',
          getPerformanceColor(category)
        )}
      >
        {category}
      </span>
      <span
        className={clsx(
          'font-mono text-[11.5px] text-muted-foreground',
          isResearchNeeded(cycles) && 'italic'
        )}
      >
        {isResearchNeeded(cycles) ? RESEARCH_NEEDED : cycles}
      </span>
    </span>
  )
}

function DrawerPanel({ algo, onClose }: { algo: AlgorithmDetail; onClose: () => void }) {
  // Transform-only entrance: mount at translateX(26px), flip to 0 next frame.
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Esc to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const xrefs = useMemo(() => resolveAlgoXrefs(algo.name), [algo.name])
  const cnsa = classifyCnsa20(algo)
  const showCnsa =
    cnsa.status === 'required' || cnsa.status === 'approved-limited' || cnsa.status === 'excluded'

  return (
    <FocusLock returnFocus>
      <div
        className="fixed inset-0 z-50 print:hidden"
        role="dialog"
        aria-modal="true"
        aria-label={algo.name}
        data-testid="algorithm-detail-drawer"
      >
        {/* scrim */}
        <Button
          type="button"
          variant="ghost"
          aria-label="Close detail"
          onClick={onClose}
          className="absolute inset-0 h-full w-full cursor-default rounded-none bg-black/60 hover:bg-black/60"
        />

        {/* panel */}
        <div
          className="absolute right-0 top-0 flex h-full w-[480px] max-w-[94vw] flex-col border-l border-border bg-card shadow-2xl transition-transform duration-200 ease-out"
          style={{ transform: entered ? 'translateX(0)' : 'translateX(26px)' }}
        >
          {/* header */}
          <div className="flex items-start gap-3 border-b border-border p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[12px] font-semibold text-primary">{algo.id}</span>
                <span
                  className={clsx(
                    'rounded-md border px-1.5 py-0.5 text-[11px] font-semibold',
                    getCryptoFamilyColor(algo.cryptoFamily)
                  )}
                >
                  {algo.cryptoFamily || '—'}
                </span>
                {isDraftTier(algo.statusTier) && (
                  <span className="rounded border border-status-warning/30 bg-status-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-status-warning">
                    Draft
                  </span>
                )}
                {showCnsa && (
                  <span
                    className={clsx(
                      'rounded border px-1.5 py-0.5 text-[10px] font-medium',
                      cnsa20ChipClasses(cnsa.status)
                    )}
                    title={cnsa.rationale}
                  >
                    {cnsa.label}
                  </span>
                )}
              </div>
              <h2 className="mt-1.5 text-[18px] font-bold leading-snug text-foreground">
                {algo.name}
              </h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">{algo.family}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ItemShareButton
                title={itemShareTitle(algo.name)}
                path={`/algorithms?algo=${encodeURIComponent(algo.id)}`}
              />
              <Button
                type="button"
                variant="ghost"
                aria-label="Close"
                onClick={onClose}
                className="h-auto shrink-0 min-h-[44px] min-w-[44px] p-2.5 md:min-h-0 md:min-w-0 md:p-1.5"
              >
                <X size={18} aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* body */}
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            <AlgoCtaStrip algoName={algo.name} />

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Fact label="Security level">
                {algo.securityLevel ? (
                  <span
                    className={clsx(
                      'rounded border px-1.5 py-0.5 text-[11px]',
                      getSecurityLevelColor(algo.securityLevel)
                    )}
                  >
                    Level {algo.securityLevel}
                  </span>
                ) : (
                  '—'
                )}
              </Fact>
              <Fact label="AES equivalent">{algo.aesEquivalent || '—'}</Fact>
              <Fact label="Standard">
                <span className="font-mono text-[11.5px]">{algo.fipsStandard || '—'}</span>
              </Fact>
              <Fact label="Region">{algo.region || '—'}</Fact>
            </dl>

            <Section title="Status">
              <p className="text-[12.5px] leading-relaxed text-foreground">{algo.status || '—'}</p>
              {algo.statusUrl && (
                <a
                  href={algo.statusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-[12px] text-primary hover:underline"
                >
                  Status source <ExternalLink size={11} aria-hidden="true" />
                </a>
              )}
            </Section>

            <Section title="Sizes">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Fact label="Public key">{bytes(algo.publicKeySize, algo.sizesUnknown)}</Fact>
                <Fact label="Private key">{bytes(algo.privateKeySize, algo.sizesUnknown)}</Fact>
                <Fact label="Signature / ciphertext">
                  {bytes(algo.signatureCiphertextSize, algo.sizesUnknown)}
                </Fact>
                {algo.sharedSecretSize !== null && (
                  <Fact label="Shared secret">{bytes(algo.sharedSecretSize, false)}</Fact>
                )}
              </dl>
            </Section>

            <Section title="Performance (relative)">
              <dl className="grid grid-cols-1 gap-y-2.5">
                <Fact label="Key generation">
                  <Perf cycles={algo.keyGenCycles} />
                </Fact>
                <Fact label="Sign / encapsulate">
                  <Perf cycles={algo.signEncapsCycles} />
                </Fact>
                <Fact label="Verify / decapsulate">
                  <Perf cycles={algo.verifyDecapsCycles} />
                </Fact>
                <Fact label="Stack RAM (approx.)">
                  {algo.stackRAM > 0 ? (
                    <span className="font-mono">~{(algo.stackRAM / 1000).toFixed(1)} KB</span>
                  ) : (
                    <span className="italic text-muted-foreground">{RESEARCH_NEEDED}</span>
                  )}
                </Fact>
                {algo.optimizationTarget && !isResearchNeeded(algo.optimizationTarget) && (
                  <Fact label="Optimized for">{algo.optimizationTarget}</Fact>
                )}
              </dl>
            </Section>

            {algo.useCaseNotes && (
              <Section title="Use-case notes">
                <p className="text-[12.5px] leading-relaxed text-foreground">{algo.useCaseNotes}</p>
              </Section>
            )}

            <Section title={`Implementations (${xrefs.length})`}>
              {xrefs.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">
                  No indexed library or reference implementation yet.{' '}
                  <Link to="/migrate" className="text-primary hover:underline">
                    Browse the catalog →
                  </Link>
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {xrefs.map((x) => (
                    <li
                      key={x.implementationName}
                      className="flex items-center justify-between gap-2 text-[12px]"
                    >
                      <span className="min-w-0 truncate text-foreground">
                        {x.implementationName}{' '}
                        <span className="text-muted-foreground">· {x.implementationType}</span>
                      </span>
                      {x.implementationUrl && (
                        <a
                          href={x.implementationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1 text-primary hover:underline"
                        >
                          <GitBranch size={11} aria-hidden="true" />
                          Repo
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </div>
      </div>
    </FocusLock>
  )
}
