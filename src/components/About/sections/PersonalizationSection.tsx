// SPDX-License-Identifier: GPL-3.0-only
/**
 * "How this hub adapts to you" — B+ remediation 1.1 (2026-08-10).
 *
 * Personalisation is the hub's largest mechanic and was, until this section,
 * never explained anywhere. The review traced several relevance penalties on
 * *other* pages back to that one comprehension gap: a reader who does not know
 * the site reshapes itself around a declared role reads every narrowing as
 * either arbitrary or broken.
 *
 * Everything on screen here is DERIVED from `personaConfig.ts` via
 * `describePersonaAdaptation` — the same function the persona picker and the
 * rail's absence notices read. That is deliberate and load-bearing: a typed
 * prose description of the gating would drift from the gating within a release
 * (this repo has been burned by typed-conclusion drift twice; see the
 * Mosca-window comment and `mlDsaSignatureBytes`). If the config changes, this
 * page changes with it, or it does not change at all.
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { SlidersHorizontal, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'
import { describePersonaAdaptation, personaTradeSentence } from '@/data/personaConfig'
import { usePersonaStore } from '@/store/usePersonaStore'

const PERSONA_ORDER: PersonaId[] = [
  'executive',
  'developer',
  'architect',
  'researcher',
  'ops',
  'curious',
]

/** One labelled row of the adaptation table. Empty values render as an explicit
 *  "nothing is removed" rather than a blank cell — a blank reads as an
 *  unfinished page, which is the opposite of what this section is for. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 border-t border-border py-2 sm:grid-cols-[10rem_1fr] sm:gap-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm leading-relaxed text-foreground/90">{value}</dd>
    </div>
  )
}

export function PersonalizationSection() {
  const activePersona = usePersonaStore((s) => s.selectedPersona)
  const [shown, setShown] = useState<PersonaId>(activePersona ?? 'executive')
  const adaptation = describePersonaAdaptation(shown)

  return (
    <motion.div
      id="personalization"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="glass-panel p-4 md:p-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <SlidersHorizontal className="shrink-0 text-primary" size={24} aria-hidden="true" />
        <h2 className="flex-1 text-xl font-semibold">How this hub adapts to you</h2>
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Telling the hub your role changes four things: which pages lead your navigation, which
        sections your report opens on, where the reference pages land on first paint, and which
        progress ladder you climb. It never removes a page from the site — a route you are not
        offered is still reachable by URL, by deep link and from search — and wherever a route is
        deliberately not offered, the navigation says so and why, in place.
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label="Preview a role">
        {PERSONA_ORDER.map((id) => (
          <Button
            key={id}
            variant={shown === id ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShown(id)}
            aria-pressed={shown === id}
            className="text-xs"
          >
            {PERSONAS[id].label}
            {activePersona === id ? ' · yours' : ''}
          </Button>
        ))}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-foreground/90">
        {personaTradeSentence(shown)}
      </p>

      <dl className="mt-3">
        <Row
          label="Leads your rail"
          value={
            adaptation.focusLabels.length > 0
              ? adaptation.focusLabels.join(' · ')
              : 'Every page — this role is deliberately un-narrowed.'
          }
        />
        <Row
          label="Behind More"
          value={
            adaptation.behindSearchLabels.length > 0
              ? adaptation.behindSearchLabels.join(' · ')
              : 'Nothing is moved out of the rail for this role.'
          }
        />
        <Row
          label="Not offered"
          value={
            adaptation.absences.length > 0
              ? adaptation.absences.map((a) => `${a.label} — ${a.reason}`).join(' ')
              : 'Nothing. Every route in the navigation is offered to this role.'
          }
        />
        <Row
          label="Report opens on"
          value={
            adaptation.reportOpenLabels.length > 0
              ? adaptation.reportOpenLabels.join(' · ')
              : 'The default section order, unchanged.'
          }
        />
        <Row
          label="Report omits"
          value={
            adaptation.reportHiddenLabels.length > 0
              ? `${adaptation.reportHiddenLabels.join(' · ')} — "Show full report" restores every one of them.`
              : 'Nothing — this role sees every section.'
          }
        />
        <Row
          label="Algorithms lands on"
          value={`the ${adaptation.algorithmsLanding.tab} view, filtered to ${adaptation.algorithmsLanding.filterSummary}`}
        />
        <Row
          label="Compliance emphasises"
          value={
            adaptation.emphasisedFrameworks.length > 0
              ? `${adaptation.emphasisedFrameworks.join(', ')} — the rest of the landscape stays reachable, collapsed.`
              : 'No framework is emphasised over another for this role.'
          }
        />
        <Row
          label="Timeline defaults to"
          value={`${adaptation.timelineRegion} — until you pick a region, which then wins on every visit.`}
        />
        <Row
          label="Your ladder"
          value={
            adaptation.beltLadder ? adaptation.beltLadder.join(' → ') : 'The shared belt ladder.'
          }
        />
      </dl>

      {/* Methodology + funding — the two questions the researcher and curious
          About cells both hang on, answered here and linked to the pages that
          answer them at length. Editorial independence is in the global footer
          too; this is the second door the review asked for, from the page that
          raises the question. */}
      <div className="mt-5 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-foreground">How a claim earns its place here</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Every record on this site carries a source, a trust tier scored from that source's
          credibility, its peer-review status, its vetting body and whether we hold a copy of the
          document itself. Conclusions are computed from the premises above them rather than typed
          beside them — the risk score, the Mosca window and the signature sizes are all derived, so
          they cannot quietly disagree with their own inputs. Where evidence is missing we mark the
          claim rather than dropping it, and where a source contradicts another we keep both.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/editorial-independence"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Editorial independence &amp; funding
            <ExternalLink size={13} aria-hidden="true" />
          </Link>
          <Link
            to="/about#about-trust-engine"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            How trust scores are computed
          </Link>
          <Link
            to="/sponsor"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Who funds this
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
