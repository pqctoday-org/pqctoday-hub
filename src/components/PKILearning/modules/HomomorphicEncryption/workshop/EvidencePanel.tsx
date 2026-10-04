// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsEmbedded } from '@/embed/EmbedProvider'
import { useModalPosition } from '@/hooks/useModalPosition'
import { useOverlayEscape } from '@/hooks/useOverlayEscape'
import type { EvidenceRecord } from '@/data/fhe/fheEvidence'
import { evidencePanelModel } from '@/data/fhe/fheEvidencePanel'

interface EvidencePanelProps {
  open: boolean
  onClose: () => void
  record: EvidenceRecord
  /** The badge text for the step this was opened from. */
  label: string
}

const FILE_LINK = 'text-primary underline underline-offset-2 hover:text-primary/80 break-all'

/**
 * Results panel behind a "Validated" badge: a short summary, a small key-numbers table and,
 * last, the raw files. Portalled above the step-detail modal (which also shows badges), so
 * the stacking is 10000/10001 rather than the modal's 9998/9999.
 */
export const EvidencePanel: React.FC<EvidencePanelProps> = ({ open, onClose, record, label }) => {
  const isEmbedded = useIsEmbedded()
  const positionStyle = useModalPosition(isEmbedded)
  useOverlayEscape(open, onClose)
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (open) closeRef.current?.focus()
  }, [open])

  if (typeof document === 'undefined') return null
  const model = evidencePanelModel(record)
  const titleId = `fhe-evidence-title-${record.id}`

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            aria-hidden="true"
            className={`${isEmbedded ? 'absolute' : 'fixed'} inset-0 embed-backdrop bg-black/60 backdrop-blur-sm`}
            style={{ zIndex: 10000 }}
          />
          <div
            className={
              isEmbedded
                ? undefined
                : 'fixed inset-0 flex items-center justify-center p-3 sm:p-4 pointer-events-none'
            }
            style={isEmbedded ? undefined : { zIndex: 10001 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="glass-panel bg-card p-4 sm:p-6 max-w-2xl w-full max-h-[85dvh] overflow-y-auto space-y-4 pointer-events-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              data-testid="fhe-evidence-panel"
              style={{ ...positionStyle, zIndex: 10001 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] text-status-success font-bold">Validated</p>
                  <h2 id={titleId} className="text-base sm:text-lg font-bold text-foreground">
                    {label}
                  </h2>
                  {model.headline && (
                    <p className="text-sm text-foreground/90 mt-1 leading-relaxed">
                      {model.headline}
                    </p>
                  )}
                </div>
                <Button
                  ref={closeRef}
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  aria-label="Close results"
                >
                  <X size={20} />
                </Button>
              </div>

              {model.keyNumbers.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-foreground mb-1">Key numbers</h3>
                  <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                    <tbody>
                      {model.keyNumbers.map((k) => (
                        <tr key={k.label} className="border-b border-border last:border-b-0">
                          <th
                            scope="row"
                            className="text-left font-normal text-muted-foreground p-2 align-top w-1/2"
                          >
                            {k.label}
                          </th>
                          <td className="p-2 font-mono font-bold text-foreground align-top">
                            {k.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <dl className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                {model.facts.map((f) => (
                  <React.Fragment key={f.label}>
                    <dt className="text-muted-foreground">{f.label}</dt>
                    <dd className="text-foreground whitespace-pre-line mb-1.5 sm:mb-0">
                      {f.value}
                    </dd>
                  </React.Fragment>
                ))}
              </dl>

              <p className="text-[11px] text-muted-foreground leading-relaxed">{model.method}</p>

              {model.notes && (
                <details className="text-[11px] text-muted-foreground">
                  <summary className="cursor-pointer font-medium text-foreground/80">
                    Notes on how this run was set up
                  </summary>
                  <p className="mt-1 leading-relaxed">{model.notes}</p>
                </details>
              )}

              <div className="border-t border-border pt-2 text-[11px] text-muted-foreground space-y-1">
                <p>
                  Raw files:{' '}
                  <a
                    href={model.primaryFile.url}
                    title={`sha256 ${model.primaryFile.sha256}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={FILE_LINK}
                  >
                    {model.primaryFile.name}
                    <ExternalLink size={10} className="inline ml-1 -mt-0.5" aria-hidden="true" />
                  </a>
                  {model.files.length > 1 && ` and ${model.files.length - 1} more below`}
                </p>
                {model.files.length > 1 && (
                  <details>
                    <summary className="cursor-pointer">All {model.files.length} files</summary>
                    <ul className="mt-1 space-y-0.5">
                      {model.files.map((a) => (
                        <li key={a.name}>
                          <a
                            href={a.url}
                            title={`sha256 ${a.sha256}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={FILE_LINK}
                          >
                            {a.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
