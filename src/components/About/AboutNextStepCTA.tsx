// SPDX-License-Identifier: GPL-3.0-only
import { Link } from 'react-router-dom'
import { ArrowRight, Briefcase, Code2, Wrench, FlaskConical, Layers, Compass } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'
import { cn } from '@/lib/utils'
import { usePersonaStore } from '@/store/usePersonaStore'
import { logAboutNextStepCta } from '@/utils/analytics'
import type { PersonaId } from '@/data/learningPersonas'

interface CtaSpec {
  icon: React.ReactNode
  title: string
  body: string
  to: string
  destination: string
  cta: string
}

const PERSONA_CTAS: Record<PersonaId, CtaSpec> = {
  executive: {
    icon: <Briefcase size={20} className="text-primary" />,
    title: 'Take the 3-minute assessment',
    body: 'Get a board-ready brief on your organization’s PQC posture, with the regulatory deadlines that matter most to your jurisdiction.',
    to: '/assess?mode=quick',
    destination: 'assess-quick',
    cta: 'Start the assessment',
  },
  developer: {
    icon: <Code2 size={20} className="text-primary" />,
    title: 'Browse PQC-ready libraries',
    body: 'See which crypto libraries already ship FIPS 203/204/205 implementations and what JOSE/COSE wire formats are stable today.',
    to: '/library?cat=Protocols',
    destination: 'library-protocols',
    cta: 'Open the library',
  },
  architect: {
    icon: <Layers size={20} className="text-primary" />,
    title: 'Map the standards landscape',
    body: 'Walk the active PQC standards — NIST, BSI, ANSSI, ETSI — and their implementation timelines so you can sequence your migration plan.',
    to: '/compliance?tab=landscape',
    destination: 'compliance-landscape',
    cta: 'Explore the landscape',
  },
  ops: {
    icon: <Wrench size={20} className="text-primary" />,
    title: 'Watch the regulatory clock',
    body: 'Pull up the certification-rotation timeline so you know which frameworks enter active enforcement next quarter.',
    to: '/compliance?tab=foryou',
    destination: 'compliance-rotation',
    cta: 'See the clock',
  },
  researcher: {
    icon: <FlaskConical size={20} className="text-primary" />,
    title: 'Read the source standards',
    body: 'Jump straight to FIPS 203/204/205, RFC 9964, and the active IETF drafts — all cited with passage-level provenance.',
    to: '/library?cat=Standards',
    destination: 'library-standards',
    cta: 'Open the standards shelf',
  },
  curious: {
    icon: <Compass size={20} className="text-primary" />,
    title: 'Start with the 5-minute intro',
    body: 'The “Why PQC?” module explains the quantum threat in plain English — no math, no acronyms, just the picture.',
    to: '/learn/pqc-101',
    destination: 'module-pqc-101',
    cta: 'Open the intro',
  },
}

const DEFAULT_CTA: CtaSpec = {
  icon: <Compass size={20} className="text-primary" />,
  title: 'Pick a starting point',
  body: 'Tell us a bit about your role and we will route you to the page that fits you best — takes about 30 seconds.',
  to: '/?picker=open',
  destination: 'persona-picker',
  cta: 'Find my starting point',
}

/**
 * Persona-flavored “where to go next” card mounted at the bottom of /about.
 * Closes audit task P18-P1-02. Renders a generic fallback when no persona is
 * selected so first-time visitors still get a forward-motion CTA.
 */
export function AboutNextStepCTA() {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const spec = selectedPersona ? PERSONA_CTAS[selectedPersona] : DEFAULT_CTA

  return (
    <div
      className="glass-panel p-5 md:p-6 flex flex-col md:flex-row gap-4 md:items-center md:justify-between print:hidden"
      data-section-id="about-next-step"
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="shrink-0 mt-0.5">{spec.icon}</div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{spec.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{spec.body}</p>
        </div>
      </div>
      <Link
        to={spec.to}
        onClick={() => logAboutNextStepCta(spec.destination)}
        className={cn(
          buttonVariants({ variant: 'gradient', size: 'sm' }),
          'shrink-0 inline-flex items-center gap-1.5'
        )}
      >
        {spec.cta}
        <ArrowRight size={14} />
      </Link>
    </div>
  )
}
