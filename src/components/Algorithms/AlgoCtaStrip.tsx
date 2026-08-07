// SPDX-License-Identifier: GPL-3.0-only
import { Link, useLocation } from 'react-router'
import { FlaskConical, BookOpen, Lightbulb } from 'lucide-react'
import { getAlgoCtasWithFallback } from '@/data/algorithmCtaMap'
import { EndorseButton } from '@/components/ui/EndorseButton'
import { FlagButton } from '@/components/ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'

interface AlgoCtaStripProps {
  algoName: string
  className?: string
  /**
   * Extra controls appended to the same wrapping row (e.g. the live-check play
   * button), so callers don't stack a second CTA line under the strip.
   */
  trailing?: React.ReactNode
}

export function AlgoCtaStrip({ algoName, className = '', trailing }: AlgoCtaStripProps) {
  const ctas = getAlgoCtasWithFallback(algoName)
  const location = useLocation()

  // Spec stays a real anchor (copy/share/middle-click all work) but points at
  // the current page with `?spec=` added — SpecDrawerHost turns that into an
  // in-place drawer, so the reader keeps their filters, sort and scroll.
  let specTo: string | null = null
  if (ctas.specRef) {
    const next = new URLSearchParams(location.search)
    next.set('spec', ctas.specRef)
    specTo = `${location.pathname}?${next.toString()}`
  }

  // Try opens in place too — but only for a bare `/playground/<tool id>`, which
  // is a self-contained workshop demo. Targets carrying their own query (the
  // /playground/interactive workspace) still navigate: that surface needs the
  // playground provider and drives the URL itself.
  const bareToolId = ctas.try?.match(/^\/playground\/([A-Za-z0-9-]+)$/)?.[1]
  let tryTo = ctas.try
  if (bareToolId) {
    const next = new URLSearchParams(location.search)
    next.set('try', bareToolId)
    tryTo = `${location.pathname}?${next.toString()}`
  }

  return (
    <div className={`flex items-center gap-1 flex-wrap ${className}`}>
      {tryTo && (
        <Link
          to={tryTo}
          className="inline-flex items-center gap-1 h-auto py-0.5 px-1.5 text-xs text-muted-foreground hover:text-primary rounded transition-colors"
          title={`Try ${algoName} in playground`}
        >
          <FlaskConical size={11} />
          Try
        </Link>
      )}
      {specTo && (
        <Link
          to={specTo}
          className="inline-flex items-center gap-1 h-auto py-0.5 px-1.5 text-xs text-muted-foreground hover:text-foreground rounded transition-colors"
          title={`Read the specification for ${algoName}`}
        >
          <BookOpen size={11} />
          Spec
        </Link>
      )}
      <Link
        to={ctas.why}
        className="inline-flex items-center gap-1 h-auto py-0.5 px-1.5 text-xs text-muted-foreground hover:text-foreground rounded transition-colors"
        title={`Learn why ${algoName} matters`}
      >
        <Lightbulb size={11} />
        Why
      </Link>
      <EndorseButton
        endorseUrl={buildEndorsementUrl({
          category: 'algorithm-endorsement',
          title: `Endorse: ${algoName}`,
          resourceType: 'Algorithm',
          resourceId: algoName,
          resourceDetails: `**Algorithm:** ${algoName}`,
          pageUrl: `/algorithms?algorithm=${encodeURIComponent(algoName)}`,
        })}
        resourceLabel={algoName}
        resourceType="Algorithm"
      />
      <FlagButton
        flagUrl={buildFlagUrl({
          category: 'algorithm-endorsement',
          title: `Flag: ${algoName}`,
          resourceType: 'Algorithm',
          resourceId: algoName,
          resourceDetails: `**Algorithm:** ${algoName}`,
          pageUrl: `/algorithms?algorithm=${encodeURIComponent(algoName)}`,
        })}
        resourceLabel={algoName}
        resourceType="Algorithm"
      />
      {trailing}
    </div>
  )
}
