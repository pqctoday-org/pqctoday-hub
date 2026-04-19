// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, GitBranch, ExternalLink, PackageOpen, BookOpen, Library } from 'lucide-react'
import FocusLock from 'react-focus-lock'
import { Button } from '../ui/button'
import { implsByAlgorithm } from '../../data/algoProductXrefData'
import type { AlgoProductXref } from '../../data/algoProductXrefData'

interface AlgorithmImplementationsModalProps {
  algorithmName: string
  isOpen: boolean
  onClose: () => void
}

/** Strip parenthetical suffix: "ML-KEM-768 (NIST Level 3)" → "ML-KEM-768" */
function baseName(pqcName: string): string {
  return pqcName.split('(')[0].trim()
}

/** Also try the family prefix: "ML-KEM-768" → "ML-KEM" as a fallback key */
function familyPrefix(name: string): string | null {
  const idx = name.lastIndexOf('-')
  if (idx < 4) return null
  return name.substring(0, idx)
}

function resolveXrefs(algorithmName: string): AlgoProductXref[] {
  const base = baseName(algorithmName)
  const direct = implsByAlgorithm.get(base)
  if (direct && direct.length > 0) return direct

  // Fallback: try family prefix (e.g. "SLH-DSA" covers all SLH-DSA-* variants)
  const prefix = familyPrefix(base)
  if (!prefix) return []
  const accumulated: AlgoProductXref[] = []
  for (const [key, xrefs] of implsByAlgorithm) {
    if (key.startsWith(prefix + '-') || key === prefix) {
      for (const x of xrefs) {
        if (!accumulated.some((a) => a.implementationName === x.implementationName)) {
          accumulated.push(x)
        }
      }
    }
  }
  return accumulated
}

export function AlgorithmImplementationsModal({
  algorithmName,
  isOpen,
  onClose,
}: AlgorithmImplementationsModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const xrefs = useMemo(() => resolveXrefs(algorithmName), [algorithmName])

  const libraries = useMemo(() => xrefs.filter((x) => x.implementationType === 'Library'), [xrefs])
  const references = useMemo(
    () => xrefs.filter((x) => x.implementationType === 'Reference'),
    [xrefs]
  )

  const displayName = baseName(algorithmName)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 embed-backdrop bg-black/60 backdrop-blur-sm z-50 print:hidden"
          />

          <div className="fixed inset-0 embed-backdrop z-50 flex items-center justify-center p-4 print:hidden">
            <FocusLock returnFocus>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass-panel p-6 max-w-xl w-full max-h-[85dvh] overflow-y-auto"
                role="dialog"
                aria-modal="true"
                aria-labelledby="algo-impl-modal-title"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-5 gap-3">
                  <div>
                    <h2
                      id="algo-impl-modal-title"
                      className="text-lg font-bold text-foreground leading-tight"
                    >
                      Crypto Libraries
                    </h2>
                    <p className="text-sm text-primary font-mono mt-0.5">{displayName}</p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="p-2 h-auto w-auto rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground shrink-0"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </Button>
                </div>

                {xrefs.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <PackageOpen size={36} className="text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      No indexed implementations yet for{' '}
                      <span className="font-medium text-foreground">{displayName}</span>.
                    </p>
                    <Link
                      to="/migrate"
                      onClick={onClose}
                      className="text-sm text-primary hover:underline"
                    >
                      Browse all implementations →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Libraries */}
                    {libraries.length > 0 && (
                      <section>
                        <div className="flex items-center gap-2 mb-3">
                          <Library size={14} className="text-primary shrink-0" />
                          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                            Libraries ({libraries.length})
                          </p>
                        </div>
                        <div className="space-y-2">
                          {libraries.map((item) => (
                            <ImplCard key={item.implementationName} xref={item} onClose={onClose} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Reference Implementations */}
                    {references.length > 0 && (
                      <section>
                        <div className="flex items-center gap-2 mb-3">
                          <BookOpen size={14} className="text-secondary shrink-0" />
                          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                            Reference Implementations ({references.length})
                          </p>
                        </div>
                        <div className="space-y-2">
                          {references.map((item) => (
                            <ImplCard key={item.implementationName} xref={item} onClose={onClose} />
                          ))}
                        </div>
                      </section>
                    )}

                    <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                      Open-source libraries &amp; reference implementations · Not exhaustive
                    </p>
                  </div>
                )}
              </motion.div>
            </FocusLock>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────

function ImplCard({ xref, onClose }: { xref: AlgoProductXref; onClose: () => void }) {
  const typeColor =
    xref.implementationType === 'Library'
      ? 'text-primary bg-primary/10 border-primary/20'
      : 'text-secondary bg-secondary/10 border-secondary/20'

  return (
    <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-muted/30 border border-border hover:border-border/80 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">{xref.implementationName}</p>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${typeColor}`}>
            {xref.implementationType}
          </span>
          {xref.verificationStatus === 'Pending Verification' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border bg-status-warning/10 text-status-warning border-status-warning/30">
              Pending
            </span>
          )}
        </div>
        {xref.notes && <p className="text-xs text-muted-foreground italic mt-0.5">{xref.notes}</p>}
      </div>

      <div className="flex flex-col gap-1.5 shrink-0 items-end">
        {xref.implementationUrl && (
          <a
            href={xref.implementationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap"
          >
            <GitBranch size={11} />
            Repo
          </a>
        )}
        {xref.softwareName && (
          <Link
            to={`/migrate?search=${encodeURIComponent(xref.softwareName)}`}
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
          >
            <ExternalLink size={11} />
            Catalog
          </Link>
        )}
      </div>
    </div>
  )
}
