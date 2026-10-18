// SPDX-License-Identifier: AGPL-3.0-only
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import {
  X,
  ShieldAlert,
  Zap,
  ArrowRight,
  Briefcase,
  Clock,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
} from 'lucide-react'
import { useOverlayEscape } from '@/hooks/useOverlayEscape'

interface ReportMethodologyModalProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORIES = [
  {
    icon: Zap,
    label: 'Quantum Exposure',
    detail: 'How vulnerable your algorithms and data are to quantum attacks',
  },
  {
    icon: ArrowRight,
    label: 'Migration Complexity',
    detail: 'Effort required based on crypto agility, infrastructure, and scale',
  },
  {
    icon: Briefcase,
    label: 'Regulatory Pressure',
    detail: 'Compliance framework mandates and country-specific deadlines',
  },
  {
    icon: Clock,
    label: 'Organizational Readiness',
    detail: 'Migration status, team capacity, and vendor dependencies',
  },
]

export function ReportMethodologyModal({ isOpen, onClose }: ReportMethodologyModalProps) {
  // Esc via the shared overlay stack: closes only the topmost overlay.
  useOverlayEscape(isOpen, onClose)

  return createPortal(
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel bg-card max-w-lg w-full max-h-[85dvh] flex flex-col overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="methodology-modal-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header — pinned above scroll */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0 border-b border-border/50">
                <h2 id="methodology-modal-title" className="text-lg font-bold text-foreground">
                  How This Report Works
                </h2>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="p-2 h-auto w-auto rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Scrollable content */}
              <div className="overflow-y-auto flex-1 px-6 py-5">
                {/* Risk Score */}
                <div className="mb-6">
                  <div className="flex items-start gap-3 mb-3">
                    <ShieldAlert size={16} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Educational Priority Index (0 &ndash; 100)
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        An educational priority index derived from four weighted categories. Higher
                        means the model suggests earlier investigation. It is not a measured risk
                        probability, audit grade, or external benchmark. The model applies editorial
                        category weights by industry profile; open the calculation details to
                        inspect the exact weights. Selected framework rows with nearer dates add
                        more modelled regulatory pressure, but selection does not establish legal
                        applicability.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Four Risk Categories */}
                <div className="space-y-3 mb-6">
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    Four Risk Categories
                  </p>
                  {CATEGORIES.map((cat) => (
                    <div key={cat.label} className="flex items-start gap-3">
                      <cat.icon size={16} className="text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">{cat.label}</span>
                        <p className="text-xs text-muted-foreground">{cat.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* HNDL & HNFL */}
                <div className="mb-6">
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                    HNDL &amp; HNFL Risk Windows
                  </p>
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={16} className="text-warning mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                        <span className="font-medium text-foreground">
                          Harvest Now, Decrypt Later (HNDL):
                        </span>{' '}
                        Adversaries may capture encrypted data today for later decryption. The model
                        compares the reported confidentiality lifetime with an explicit planning
                        horizon. A jurisdiction milestone may provide an earlier planning target,
                        but it is labelled separately from the uncertain CRQC estimate.
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <span className="font-medium text-foreground">
                          Harvest Now, Forge Later (HNFL):
                        </span>{' '}
                        Digital signatures and certificates can be forged retroactively. If your
                        credentials remain trusted beyond the quantum threat horizon, they are at
                        risk.
                      </p>
                    </div>
                  </div>
                </div>

                {/* I Don't Know Responses */}
                <div className="mb-6">
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                    &ldquo;I Don&apos;t Know&rdquo; Responses
                  </p>
                  <div className="flex items-start gap-3">
                    <HelpCircle size={16} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                        When you select &ldquo;I don&apos;t know&rdquo; for any question, the report
                        applies{' '}
                        <span className="font-medium text-foreground">conservative defaults</span>{' '}
                        that are{' '}
                        <span className="font-medium text-foreground">
                          softer than confirmed worst-case
                        </span>{' '}
                        answers, to avoid over-penalizing honest uncertainty. For example:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                        <li>
                          Unknown data retention &rarr; assumes an{' '}
                          <span className="font-medium text-foreground">
                            industry-specific conservative default
                          </span>{' '}
                          (e.g., 75 years for government, 40 for aerospace, 15 minimum)
                        </li>
                        <li>
                          Unknown credential lifetime &rarr; assumes{' '}
                          <span className="font-medium text-foreground">10-year</span> validity
                        </li>
                        <li>
                          Unknown sensitivity &rarr; assumes{' '}
                          <span className="font-medium text-foreground">high</span> sensitivity
                        </li>
                        <li>
                          Unknown vendor dependency &rarr; assumes{' '}
                          <span className="font-medium text-foreground">~80% of worst-case</span>{' '}
                          vendor reliance (less punitive than confirmed heavy dependency)
                        </li>
                        <li>
                          Unknown crypto agility &rarr; assumes{' '}
                          <span className="font-medium text-foreground">~83% of worst-case</span>{' '}
                          complexity (less punitive than confirmed hardcoded)
                        </li>
                        <li>
                          Unknown infrastructure &rarr; assumes{' '}
                          <span className="font-medium text-foreground">moderate-to-high</span>{' '}
                          complexity
                        </li>
                      </ul>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                        <span className="font-medium text-foreground">Executive persona:</span>{' '}
                        technical questions (crypto algorithms, agility, infrastructure) apply an
                        additional reduction because executives are not expected to know these
                        details. The wizard also auto-suggests &ldquo;I don&apos;t know&rdquo; on
                        these steps. This adjustment is Executive-only &mdash; the{' '}
                        <span className="font-medium text-foreground">GRC persona</span> uses the
                        standard unknown-answer scoring with no reduction and no auto-suggestion,
                        since a compliance assessment should not assume technical details away.
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                        Each &ldquo;I don&apos;t know&rdquo; also generates a specific{' '}
                        <span className="font-medium text-foreground">awareness-gap action</span>{' '}
                        recommending you audit that area for a more precise assessment.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Persona-Aware Reports */}
                <div className="mb-6">
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                    Persona-Aware Reports
                  </p>
                  <div className="flex items-start gap-3">
                    <HelpCircle size={16} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                        If you selected a persona, the report narrative and recommendations are
                        tailored to your role:
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                        <li>
                          <span className="font-medium text-foreground">Executive</span> &mdash;
                          business/risk language, budget and competitive framing, no algorithm names
                        </li>
                        <li>
                          <span className="font-medium text-foreground">GRC</span> &mdash;
                          obligations traced to source, evidence gaps named explicitly as gaps (not
                          noncompliance), standard scoring with no unknown-answer softening
                        </li>
                        <li>
                          <span className="font-medium text-foreground">Developer</span> &mdash;
                          algorithm migration paths with FIPS references, library recommendations
                        </li>
                        <li>
                          <span className="font-medium text-foreground">Architect</span> &mdash;
                          system topology analysis, infrastructure layer breakdown, dependency
                          mapping
                        </li>
                        <li>
                          <span className="font-medium text-foreground">Researcher</span> &mdash;
                          scoring formula, category weights, HNDL/HNFL math, NIST standard
                          references
                        </li>
                      </ul>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                        An <span className="font-medium text-foreground">Assessment Profile</span>{' '}
                        summary shows what you selected, giving readers context without scrolling
                        through the wizard.
                      </p>
                    </div>
                  </div>
                </div>

                {/* How Actions Are Prioritized */}
                <div className="mb-6">
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                    How Actions Are Prioritized
                  </p>
                  <div className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-success mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Suggested actions are generated from your inputs: algorithms, use cases,
                        infrastructure, selected requirement sources, and migration status. They are
                        investigation prompts—not proof of a control gap. Each action is categorized
                        as <span className="font-medium text-foreground">Immediate</span>,{' '}
                        <span className="font-medium text-foreground">Short-term</span>, or{' '}
                        <span className="font-medium text-foreground">Long-term</span> based on
                        urgency and estimated effort.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
                    Limits of this report
                  </p>
                  <ul className="ml-4 list-disc space-y-1 text-xs leading-relaxed text-muted-foreground">
                    <li>
                      Answers are self-reported; no systems, products or controls are scanned.
                    </li>
                    <li>
                      Framework selection and profile filtering do not determine legal applicability
                      or compliance.
                    </li>
                    <li>
                      Algorithm transitions, effort bands, roadmap dates and financial figures are
                      educational starting assumptions that require engineering, legal and finance
                      review.
                    </li>
                    <li>
                      CRQC timing is uncertain; the report exposes a planning anchor rather than
                      predicting an arrival date.
                    </li>
                  </ul>
                </div>

                {/* Cross-Module References */}
                <div className="mb-4">
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
                    Cross-Module References
                  </p>
                  <div className="flex items-start gap-3">
                    <ArrowRight size={16} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        The report links to other modules for deeper exploration. Compliance
                        frameworks show linked{' '}
                        <span className="font-medium text-foreground">NIST standards</span> from the
                        Library and{' '}
                        <span className="font-medium text-foreground">country timelines</span>.
                        Recommended actions that involve migration show matching{' '}
                        <span className="font-medium text-foreground">software products</span> from
                        the Migrate catalog.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="rounded-lg border border-border bg-muted/10 px-4 py-3">
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                    All computation runs locally in your browser. No assessment data is sent to any
                    server.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
