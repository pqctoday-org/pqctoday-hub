// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { ShieldCheck, Stamp, Flag, ChevronDown, GitMerge } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TrustScoreMethodologySection } from './TrustScoreMethodologySection'
import { GlobalRevisionsFeed } from '@/components/ui/GlobalRevisionsFeed'

function RevisionAuditCollapsible() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="glass-panel p-4 md:p-6"
    >
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full text-left cursor-pointer"
      >
        <GitMerge className="text-primary shrink-0" size={24} />
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Content Audit Trail</h2>
          <p className="text-xs text-muted-foreground">
            Every reviewed data update, linked to its affected modules and sources
          </p>
        </div>
        <ChevronDown
          size={20}
          className={clsx(
            'text-muted-foreground transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              <GlobalRevisionsFeed pageSize={10} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/**
 * TrustEngineSection — user-facing explanation of the Trust Engine.
 *
 * Audience: site visitors trying to decide whether to rely on a fact
 * shown on PQC Today. Not aimed at engineers, sponsors, or auditors;
 * those audiences are served by the explainability doc and the
 * methodology section below.
 *
 * Collapsible (default closed) to match SbomSection / DataPrivacySection /
 * etc. — the About page already runs long, and most users will scan the
 * header and decide whether to expand.
 */
export function TrustEngineSection() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="glass-panel p-4 md:p-6"
    >
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="trust-engine-content"
        className="flex items-center gap-3 w-full text-left cursor-pointer"
      >
        <ShieldCheck className="text-primary shrink-0" size={24} />
        <h2 className="text-xl font-semibold flex-1">Trust Engine</h2>
        <ChevronDown
          size={18}
          className={clsx(
            'text-muted-foreground transition-transform duration-200 shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="trust-engine-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="prose prose-invert max-w-none pt-4">
              <p className="text-muted-foreground">
                Every fact on PQC Today carries a{' '}
                <strong className="text-foreground">trust score</strong>, a{' '}
                <strong className="text-foreground">named reviewer</strong>, and a{' '}
                <strong className="text-foreground">link to the original source document</strong>.
                The Trust Engine is the layer that produces those signals. All the rules behind it
                are open source — anyone can read exactly how a score was computed.
              </p>

              <h3 className="text-base font-semibold mt-5">What you see on every record</h3>
              <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground list-none pl-0">
                <li className="flex items-start gap-2.5">
                  <span className="text-primary mt-1 shrink-0">&#9679;</span>
                  <span>
                    <strong className="text-foreground">Trust badge</strong> (Authoritative / High /
                    Moderate / Low) — a composite of eight dimensions. Click it to see what each one
                    contributed.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-primary mt-1 shrink-0">&#9679;</span>
                  <span>
                    <strong className="text-foreground">Reviewer pill</strong> — the SME who
                    approved this record and the date they signed off.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-primary mt-1 shrink-0">&#9679;</span>
                  <span>
                    <strong className="text-foreground">Source link</strong> — goes to the original
                    NIST, IETF, ETSI, or vendor document. We cache local copies so the link never
                    breaks.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-primary mt-1 shrink-0">&#9679;</span>
                  <span>
                    <strong className="text-foreground">Citation chip in chat</strong> — when the
                    assistant cites a source, a small letter (A / H / M / L) shows the trust tier of
                    that citation at a glance.
                  </span>
                </li>
              </ul>

              <h3 className="text-base font-semibold mt-5">How to verify a claim yourself</h3>
              <ol className="mt-3 space-y-2.5 text-sm text-muted-foreground list-decimal pl-5">
                <li>
                  Click the trust badge on any record. The tooltip itemises the eight dimensions and
                  what each one contributed to the score.
                </li>
                <li>
                  Click the source link. You land on the original document — exactly the source the
                  claim is based on.
                </li>
                <li>
                  Want the math? Expand <em>Trust Score Methodology</em> at the bottom of this
                  section for the full dimension table + formula.
                </li>
              </ol>

              <h3 className="text-base font-semibold mt-5">Help us keep it accurate</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Two buttons live on every record:
              </p>
              <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground list-none pl-0">
                <li className="flex items-start gap-2.5">
                  <Stamp size={14} className="text-status-success shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">Endorse</strong> — vouch for a record you
                    trust. Opens a pre-filled GitHub Discussion with an endorsement checklist.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Flag size={14} className="text-status-warning shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground">Flag</strong> — report an inaccuracy or
                    broken link. Opens a Discussion with an issue checklist. Maintainers see flags
                    in CI; subsequent edits to the record have to acknowledge them.
                  </span>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                Both flows are public — anyone can see who flagged or endorsed what.
              </p>

              <h3 className="text-base font-semibold mt-5">Independence</h3>
              <p className="text-sm text-muted-foreground mt-2">
                No vendor pays for trust-score placement. If a sponsor&rsquo;s product appears on
                the platform, the sponsorship is shown as a{' '}
                <strong className="text-foreground">separate disclosure pill</strong> that does not
                move the score. The trust signal and the funding signal are deliberately two
                different things.
              </p>

              {/* Nested methodology — full dimension table + formula for power users */}
              <div className="mt-6">
                <TrustScoreMethodologySection />
              </div>

              {/* Content revision audit — collapsible, same pattern as TrustScoreMethodologySection */}
              <div className="mt-6">
                <RevisionAuditCollapsible />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
