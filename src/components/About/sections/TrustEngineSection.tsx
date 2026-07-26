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
                None of that is a one-time label — it comes out of a maintenance pipeline that runs
                every time a piece of data changes, on every source the platform tracks.
              </p>

              <h3 className="text-base font-semibold mt-5">How a record actually gets updated</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Nothing on PQC Today updates itself. Every change — a new standard, a corrected
                date, a re-checked certification — moves through the same maintenance pipeline,
                whichever source it touches:
              </p>
              <ol className="mt-3 space-y-3 text-sm text-muted-foreground list-none pl-0">
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                    1
                  </span>
                  <span>
                    <strong className="text-foreground">Found and proposed.</strong> The pipeline
                    watches every source for something worth acting on — a new document, a stale
                    date, a broken link — and drafts a proposed change. Research and drafting are
                    often AI-assisted; nothing is published from this step alone.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                    2
                  </span>
                  <span>
                    <strong className="text-foreground">Decided by a maintainer.</strong> Every
                    proposal sits in a review queue until a named human approves it, rejects it, or
                    holds it for closer judgment. Nothing moves forward without that decision.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                    3
                  </span>
                  <span>
                    <strong className="text-foreground">Applied and checked.</strong> Approved
                    changes are written to the real data — but only if they pass the same automated
                    checks (data validation, tests) that gate every other change to this site. A
                    change that fails a check doesn't go through, approved or not.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                    4
                  </span>
                  <span>
                    <strong className="text-foreground">Merged.</strong> Like any other update to
                    PQC Today, it goes out through a reviewed pull request, not a direct edit.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                    5
                  </span>
                  <span>
                    <strong className="text-foreground">Recorded, automatically.</strong> The moment
                    it merges, the reviewer, the date, and whether AI assisted the drafting in step
                    1 are stamped into the public audit trail below — there's no separate step for
                    anyone to forget, and no record that skips it.
                  </span>
                </li>
              </ol>
              <p className="mt-3 text-sm text-muted-foreground">
                Same five steps whether the change is to a library document, a compliance deadline,
                a migration guide entry, or a Learn module — one pipeline, not a different process
                per page. All the rules behind the trust score itself are open source too — anyone
                can read exactly how a score was computed.
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
                    <strong className="text-foreground">Reviewer pill</strong> — the maintainer who
                    approved this record (step 2 above) and the date they signed off.
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
                <li className="flex items-start gap-2.5">
                  <span className="text-primary mt-1 shrink-0">&#9679;</span>
                  <span>
                    <strong className="text-foreground">AI-assisted marker</strong> — in the audit
                    trail below, an icon marks every revision where step 1 had AI assistance. It
                    still went through steps 2-5 like everything else.
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
                <li>
                  Want to see the pipeline's own paper trail for a specific record? Expand{' '}
                  <em>Content Audit Trail</em> below and filter to it — every approval from step 2
                  is there, with its reviewer and date.
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
