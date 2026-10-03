// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDown, ArrowRight, ChevronLeft, ChevronRight, Cpu, Inbox, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsEmbedded } from '@/embed/EmbedProvider'
import { useModalPosition } from '@/hooks/useModalPosition'
import { useOverlayEscape } from '@/hooks/useOverlayEscape'
import { LINK_LABELS, type FheFlow } from '../data/fheHsmFlows'
import { EngineStatusLine, EvidenceLine, HoldingsList, StepRef } from './FheHsmFlows'
import {
  KEY_SIZES,
  LINK_SIZES,
  RSA2048_PAIR_BYTES,
  type KeyId,
  type StepCost,
} from '../data/fheHsmCosts'
import { COMPUTE_KIND_LABELS, type ComputeKind, type StepIO } from '../data/fheHsmStepIO'

const KIND_CLASS: Record<ComputeKind, string> = {
  keygen: 'text-status-success border-success/40 bg-success/10',
  sign: 'text-status-success border-success/40 bg-success/10',
  encrypt: 'text-primary border-primary/40 bg-primary/10',
  homomorphic: 'text-primary border-primary/40 bg-primary/10',
  decrypt: 'text-status-success border-success/40 bg-success/10',
  wrap: 'text-status-success border-success/40 bg-success/10',
  transfer: 'text-muted-foreground border-border bg-muted/40',
  symmetric: 'text-foreground border-border bg-muted/40',
  combine: 'text-primary border-primary/40 bg-primary/10',
  rejected: 'text-status-error border-destructive/40 bg-destructive/10',
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
function ratio(bytes: number): string {
  const r = bytes / RSA2048_PAIR_BYTES
  if (r < 0.1) return `×${r.toFixed(2)}`
  if (r < 10) return `×${r.toFixed(1)}`
  return `×${compact.format(r)}`
}

const Meter: React.FC<{ level: number; className: string }> = ({ level, className }) => (
  <span className="inline-flex gap-0.5" aria-hidden="true">
    {[1, 2, 3, 4].map((n) => (
      <span
        key={n}
        className={`inline-block w-1.5 h-2.5 rounded-[1px] ${n <= level ? className : 'bg-muted'}`}
      />
    ))}
  </span>
)

interface FheStepDetailModalProps {
  open: boolean
  onClose: () => void
  flow: FheFlow
  index: number
  io: StepIO | undefined
  cost: StepCost | undefined
  keys: KeyId[]
  overlay: boolean
  pqcFixed: boolean
  persisted: boolean
  shared: boolean
  onNavigate: (i: number) => void
}

/** Modal: Input → Computation → Output for one step of an FHE + HSM flow. */
export const FheStepDetailModal: React.FC<FheStepDetailModalProps> = ({
  open,
  onClose,
  flow,
  index,
  io,
  cost,
  keys,
  overlay,
  pqcFixed,
  persisted,
  shared,
  onNavigate,
}) => {
  const isEmbedded = useIsEmbedded()
  const positionStyle = useModalPosition(isEmbedded)
  useOverlayEscape(open, onClose)

  const step = flow.steps[index] // eslint-disable-line security/detect-object-injection
  const name = (id: string) => flow.actors.find((a) => a.id === id)?.label ?? id
  const link = step?.link ? LINK_LABELS[step.link] : null
  const wire = step?.link ? LINK_SIZES[step.link] : null
  const keyRows = KEY_SIZES.filter((k) => keys.includes(k.id))
  const titleId = 'fhe-step-detail-title'

  if (typeof document === 'undefined') return null

  // Portalled to <body> with a fixed centring wrapper (same structure as WhatsNewModal):
  // rendered inline, the workshop panel's stacking context put the backdrop above the dialog.
  return createPortal(
    <AnimatePresence>
      {open && step && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className={`${isEmbedded ? 'absolute' : 'fixed'} inset-0 embed-backdrop bg-black/60 backdrop-blur-sm`}
            style={{ zIndex: 9998 }}
          />
          <div
            className={
              isEmbedded
                ? undefined
                : 'fixed inset-0 flex items-center justify-center p-3 sm:p-4 pointer-events-none'
            }
            style={isEmbedded ? undefined : { zIndex: 9999 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="glass-panel bg-card p-4 sm:p-6 max-w-3xl w-full max-h-[85dvh] overflow-y-auto space-y-4 pointer-events-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              style={{ ...positionStyle, zIndex: 9999 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground font-mono">
                    {flow.label} · step {index + 1} of {flow.steps.length}
                  </p>
                  <h2 id={titleId} className="text-lg sm:text-xl font-bold text-foreground">
                    {step.title}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.from === step.to
                      ? `Inside ${name(step.from)}`
                      : `${name(step.from)} → ${name(step.to)}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  aria-label="Close step details"
                >
                  <X size={20} />
                </Button>
              </div>

              {/* Input → Computation → Output */}
              {io && (
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-2 items-stretch">
                  <IoCard icon={<Inbox size={14} />} title="Input" body={io.input} />
                  <FlowArrow />
                  <div className="rounded-lg border border-border bg-card/60 p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Cpu size={14} className="text-primary" />
                      Computation
                    </div>
                    <span
                      className={`inline-block text-[10px] px-1.5 py-0.5 rounded border font-bold ${KIND_CLASS[io.kind]}`}
                    >
                      {COMPUTE_KIND_LABELS[io.kind]}
                    </span>
                    <p className="text-xs text-foreground/85 leading-relaxed">{io.computation}</p>
                  </div>
                  <FlowArrow />
                  <IoCard icon={<Send size={14} />} title="Output" body={io.output} />
                </div>
              )}

              {/* Library call + baseline */}
              <div className="space-y-1">
                <StepRef step={step} />
                <EngineStatusLine flow={flow} step={step} />
                <EvidenceLine flow={flow} step={step} />
                <p className="text-[11px] text-muted-foreground">
                  Baseline: {flow.baseline.implementation}
                </p>
              </div>

              {/* Where keys and data sit at this step */}
              <div className="rounded-lg border border-border p-3 space-y-1">
                <div className="text-xs font-bold text-foreground">
                  Where keys and data are at this step
                </div>
                <HoldingsList
                  flow={flow}
                  step={index}
                  persisted={persisted}
                  shared={shared}
                  overlay={overlay}
                  pqcFixed={pqcFixed}
                />
              </div>

              {/* Cost */}
              {cost && (
                <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5 text-xs">
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-muted-foreground">Data</span>
                      <Meter level={cost.dataLevel} className="bg-primary" />
                      <span className="font-bold">{cost.dataShort}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="text-muted-foreground">Compute</span>
                      <Meter level={cost.computeLevel} className="bg-warning" />
                      <span className="font-bold">{cost.computeShort}</span>
                    </span>
                    <span className="text-muted-foreground">Runs on: {cost.where}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{cost.note}</p>
                </div>
              )}

              {/* Crypto on the wire + quantum status */}
              {link && (
                <div className="rounded-lg border border-border p-3 text-xs space-y-1">
                  <div className="font-bold text-foreground">Crypto protecting this step</div>
                  {!link.threat ? (
                    <p className="text-primary">
                      {link.classical}: {link.safeNote}.
                    </p>
                  ) : (
                    <>
                      <p>
                        <span className="text-status-error font-semibold">
                          Today: {link.classical}
                        </span>
                        {overlay && <span className="text-muted-foreground"> · {link.threat}</span>}
                        {wire && <span className="text-muted-foreground"> · {wire.classical}</span>}
                      </p>
                      <p>
                        <span className="text-status-success font-semibold">PQC: {link.pqc}</span>
                        {wire && <span className="text-muted-foreground"> · {wire.pqc}</span>}
                        {pqcFixed && <span className="text-muted-foreground"> (applied)</span>}
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Keys involved */}
              {keyRows.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-foreground">
                    Keys involved (unit: one RSA-2048 key pair)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {keyRows.map((k) => (
                      <span
                        key={k.id}
                        title={k.note}
                        className={`text-[11px] rounded border px-2 py-0.5 ${
                          k.secret
                            ? 'border-success/40 bg-success/10'
                            : 'border-primary/30 bg-primary/5'
                        }`}
                      >
                        {k.secret ? '🔒 ' : ''}
                        {k.label} <span className="font-mono font-bold">{ratio(k.bytes)}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          · {k.size}
                          {k.exact ? '' : ' est.'}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground leading-relaxed">{step.detail}</p>

              {/* Footer navigation */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate(index - 1)}
                  disabled={index === 0}
                  className="gap-1"
                >
                  <ChevronLeft size={14} /> Previous step
                </Button>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => onNavigate(index + 1)}
                  disabled={index === flow.steps.length - 1}
                  className="gap-1"
                >
                  Next step <ChevronRight size={14} />
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}

const IoCard: React.FC<{ icon: React.ReactNode; title: string; body: string }> = ({
  icon,
  title,
  body,
}) => (
  <div className="rounded-lg border border-border bg-card/60 p-3 space-y-1.5">
    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
      <span className="text-primary">{icon}</span>
      {title}
    </div>
    <p className="text-xs text-foreground/85 leading-relaxed">{body}</p>
  </div>
)

const FlowArrow: React.FC = () => (
  <div className="flex items-center justify-center text-muted-foreground" aria-hidden="true">
    <ArrowDown size={16} className="md:hidden" />
    <ArrowRight size={16} className="hidden md:block" />
  </div>
)
