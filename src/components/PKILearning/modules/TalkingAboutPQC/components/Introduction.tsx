// SPDX-License-Identifier: GPL-3.0-only
import type { FC, ReactNode } from 'react'
import { Link } from 'react-router'
import {
  Clock,
  CalendarCheck,
  BadgeCheck,
  MessageSquareWarning,
  MessagesSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { CNSA_2_0, EO_14412, NIST_DEPRECATION, formatMonthYear } from '@/data/regulatoryTimelines'

interface Props {
  onNavigateToWorkshop?: (step?: number) => void
}

const Section: FC<{
  id: string
  icon: typeof Clock
  title: string
  children: ReactNode
}> = ({ id, icon: Icon, title, children }) => (
  <section id={id} className="glass-panel p-5 scroll-mt-24">
    <div className="flex items-center gap-2 mb-3">
      <Icon size={18} className="text-primary" />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
    <div className="space-y-3 text-sm text-foreground/90 leading-relaxed">{children}</div>
  </section>
)

const SECTIONS = [
  { id: 'one-minute', label: 'The One-Minute Version' },
  { id: 'real-dates', label: 'Dates That Are Real' },
  { id: 'certificates', label: 'What a Certificate Proves' },
  { id: 'words', label: 'Words to Check' },
  { id: 'customer-questions', label: 'Answering the Question' },
]

const KEY_EST_YEAR = EO_14412.keyEstablishment ?? 2030

const DATES: { what: string; who: string; status: string }[] = [
  {
    what: `Replacement algorithms published (FIPS 203, 204, 205) — ${formatMonthYear(NIST_DEPRECATION.fipsFinalized)}`,
    who: 'NIST, for everyone',
    status: 'Final standards',
  },
  {
    what: `Post-quantum key establishment by end of ${KEY_EST_YEAR}; signatures by end of ${EO_14412.digitalSignatures}`,
    who: 'US federal civilian high-value and high-impact systems, and their contractors (EO 14412)',
    status: 'In force',
  },
  {
    what: `Software signing and traditional networking use only CNSA 2.0 algorithms by ${CNSA_2_0.softwareExclusive}; all systems by ${CNSA_2_0.fullEnforcement}`,
    who: 'US national security systems (NSA CNSA 2.0)',
    status: 'In force',
  },
  {
    what: `Deprecate the weakest quantum-vulnerable algorithms after ${NIST_DEPRECATION.deprecateClassical}; disallow all of them after ${NIST_DEPRECATION.disallowClassical}`,
    who: 'Systems that follow NIST rules (NIST IR 8547)',
    status: 'Draft proposal',
  },
  {
    what: 'A quantum computer able to break today’s encryption',
    who: 'Nobody',
    status: 'Estimate — experts disagree',
  },
]

const WORDS: { phrase: string; problem: string; instead: string }[] = [
  {
    phrase: '“Quantum-proof”, “unbreakable”',
    problem: 'No cryptography is proven unbreakable, and standards bodies do not use these words.',
    instead: '“Uses ML-KEM (FIPS 203), NIST’s post-quantum standard, from version 5.2.”',
  },
  {
    phrase: '“Quantum-safe”, “quantum-resistant”',
    problem:
      'Widely used — ETSI’s standards use “quantum-safe”, NIST uses “quantum-resistant”. Both mean designed to resist known quantum attacks, not guaranteed.',
    instead: 'Fine, as long as you say what is inside and from which version.',
  },
  {
    // claims-lint-allow: quotes the overclaim this table teaches readers to avoid
    phrase: '“NIST-approved product”, “NIST-certified”',
    problem: 'NIST standardizes algorithms. It does not approve or certify products.',
    instead: '“Implements ML-DSA (FIPS 204); FIPS 140-3 certificate #…”',
  },
  {
    phrase: '“FIPS certified”',
    problem: 'Which stage? Algorithm tested, in process, or validated are three different things.',
    instead: 'Name the stage and give the certificate number or the list it appears on.',
  },
  {
    phrase: '“PQC-ready”',
    problem: 'There is no agreed definition.',
    instead: 'Say which parts of the product, which algorithms, and from which version.',
  },
  {
    phrase: '“CNSA 2.0 compliant”',
    problem:
      'CNSA 2.0 names specific algorithms and sizes, and applies to US national security systems.',
    instead: 'Name the CNSA 2.0 algorithms the product supports, if it does.',
  },
]

export const Introduction: FC<Props> = ({ onNavigateToWorkshop }) => {
  useSectionAnchors()
  return (
    <div className="space-y-5">
      <div className="glass-panel p-4 flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground self-center mr-1">In this module:</span>
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            {s.label}
          </a>
        ))}
      </div>

      <Section id="one-minute" icon={Clock} title="The one-minute version">
        <p>
          Most online security — the padlock in a browser, signed software updates, bank transfers —
          relies on mathematics that a large enough quantum computer could undo. No such computer
          exists yet. But data copied today could be read once one does, which is why people call
          the risk <strong>“harvest now, decrypt later”</strong>.
        </p>
        <p>
          The replacements already exist. NIST published three post-quantum standards in{' '}
          {formatMonthYear(NIST_DEPRECATION.fipsFinalized)}: ML-KEM (FIPS 203) for setting up secure
          connections, and ML-DSA (FIPS 204) and SLH-DSA (FIPS 205) for digital signatures. The slow
          part now is fitting them into every product and system.
        </p>
        <p className="text-muted-foreground">
          That is the whole story in three sentences: a real risk, a published fix, and years of
          work to apply it.
        </p>
      </Section>

      <Section
        id="real-dates"
        icon={CalendarCheck}
        title="Dates that are real — and whose they are"
      >
        <p>
          Every real date belongs to someone and applies to specific systems. Before you quote a
          date, say whose it is and what it covers.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-3 font-medium">What</th>
                <th className="py-2 pr-3 font-medium">Applies to</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {DATES.map((d) => (
                <tr key={d.what} className="border-b border-border/50 align-top">
                  <td className="py-2 pr-3 text-foreground">{d.what}</td>
                  <td className="py-2 pr-3">{d.who}</td>
                  <td className="py-2">{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          A private company outside these scopes may have no legal deadline at all — but its
          customers may. Other countries set their own schedules; the{' '}
          <Link to="/timeline" className="text-primary underline">
            Timeline
          </Link>{' '}
          lists them with their sources.
        </p>
      </Section>

      <Section id="certificates" icon={BadgeCheck} title="What a certificate proves">
        <p>
          “Certified” is the word most often stretched. In the US and Canada, the FIPS 140-3
          programme has three stages that are easy to confuse:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Algorithm tested (CAVP certificate).</strong> One implementation of one
            algorithm passed its tests. It says nothing about the rest of the product.
          </li>
          <li>
            <strong>In process.</strong> The module appears on NIST’s Modules In Process list:
            validation has started, not finished.
          </li>
          <li>
            <strong>Validated (FIPS 140-3 certificate).</strong> The module passed. The certificate
            has a number anyone can look up, and it covers a specific version and configuration.
          </li>
        </ul>
        <p>
          Other schemes — Common Criteria and the EU’s EUCC, for example — work differently, but the
          same rule applies: read what a certificate covers before you read its level. Post-quantum
          algorithms added in a later version are not covered by an older certificate.
        </p>
        <p>
          This site’s{' '}
          <Link to="/migrate" className="text-primary underline">
            product catalogue
          </Link>{' '}
          shows these same three stages, taken from the public records, for every product it lists.
        </p>
      </Section>

      <Section id="words" icon={MessageSquareWarning} title="Words to check before you use them">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-3 font-medium">Phrase</th>
                <th className="py-2 pr-3 font-medium">The problem</th>
                <th className="py-2 font-medium">Say instead</th>
              </tr>
            </thead>
            <tbody>
              {WORDS.map((w) => (
                <tr key={w.phrase} className="border-b border-border/50 align-top">
                  <td className="py-2 pr-3 text-foreground font-medium">{w.phrase}</td>
                  <td className="py-2 pr-3">{w.problem}</td>
                  <td className="py-2">{w.instead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigateToWorkshop?.(0)}
          className="border-primary text-primary hover:bg-primary/10"
        >
          Try the Claim Checker →
        </Button>
      </Section>

      <Section
        id="customer-questions"
        icon={MessagesSquare}
        title="Answering “are you quantum-safe?”"
      >
        <p>A useful answer has three parts, each with something the listener can check:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            <strong>What is protected today</strong> — which parts of the product, with which
            algorithms, from which version.
          </li>
          <li>
            <strong>What is planned, and when</strong> — a public roadmap is stronger than a promise
            in a meeting.
          </li>
          <li>
            <strong>The evidence</strong> — certificate numbers, a roadmap page, or a cryptography
            bill of materials (a list of the cryptography a product uses).
          </li>
        </ol>
        <p>
          If part of the answer is “we don’t know yet”, say so. Customers comparing suppliers notice
          a confident answer that cannot be checked.
        </p>
        <p className="text-muted-foreground">
          This site lists every product on the same terms, whoever makes it, and links each claim to
          its source. It is evidence you can point to — not a ranking.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigateToWorkshop?.(1)}
          className="border-primary text-primary hover:bg-primary/10"
        >
          Practise the customer questions →
        </Button>
      </Section>
    </div>
  )
}
