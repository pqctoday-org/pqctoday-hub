// SPDX-License-Identifier: AGPL-3.0-only
import { AlgorithmStatusDetails } from './AlgorithmStatusDetails'
import { Link, useLocation } from 'react-router'
import { FlaskConical, BookOpen, Lightbulb } from 'lucide-react'
import { getAlgoCtasWithFallback } from '@/data/algorithmCtaMap'
import { EndorseButton } from '@/components/ui/EndorseButton'
import { FlagButton } from '@/components/ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { getAlgorithmAdvisory } from '@/data/algorithmAdvisories'
import { algorithmIdFromName } from '@/data/pqcAlgorithmsData'

interface AlgoCtaStripProps {
  algoName: string
  className?: string
  /**
   * Extra controls appended to the same wrapping row (e.g. the live-check play
   * button), so callers don't stack a second CTA line under the strip.
   */
  trailing?: React.ReactNode
  showAdvisory?: boolean
}

export function AlgoCtaStrip({
  algoName,
  className = '',
  trailing,
  showAdvisory = true,
}: AlgoCtaStripProps) {
  const ctas = getAlgoCtasWithFallback(algoName)
  const location = useLocation()
  // Endorse/Flag cite the algorithm's own detail drawer (?algo=<algorithm_id>).
  const algoPageUrl = `/algorithms?algo=${algorithmIdFromName(algoName)}`

  // Spec stays a real anchor (copy/share/middle-click all work) but points at
  // the current page with `?spec=` added — SpecDrawerHost turns that into an
  // in-place drawer, so the reader keeps their filters, sort and scroll.
  let specTo: string | null = null
  if (ctas.specRef) {
    const next = new URLSearchParams(location.search)
    next.set('spec', ctas.specRef)
    specTo = `${location.pathname}?${next.toString()}`
  }

  // Workshop launches preserve their exact selection in the modal URL.
  const target = ctas.try ? new URL(ctas.try, 'https://www.pqctoday.com') : null
  const toolId = target?.pathname.match(/^\/playground\/([A-Za-z0-9-]+)$/)?.[1]
  let tryTo = ctas.try
  if (toolId && toolId !== 'interactive' && toolId !== 'hsm' && toolId !== 'pqc-ssh-sim') {
    const next = new URLSearchParams(location.search)
    next.set('try', toolId)
    const launch = target?.searchParams.get('launchAlgo')
    if (launch) next.set('launchAlgo', launch)
    tryTo = `${location.pathname}?${next}`
  }
  const advisory = getAlgorithmAdvisory(algoName)

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
      {!tryTo && (
        <span className="text-[10px] text-muted-foreground" title={ctas.unavailableReason}>
          Exact Try unavailable
        </span>
      )}
      {ctas.specUrl && (
        <a
          href={ctas.specUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-primary px-1.5"
          title={`Read the specification/status source for ${algoName}`}
        >
          Spec / status source
        </a>
      )}
      {showAdvisory && advisory && (
        <a
          href={advisory.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-status-warning"
          title={advisory.note}
        >
          {advisory.label}
        </a>
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
          pageUrl: algoPageUrl,
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
          pageUrl: algoPageUrl,
        })}
        resourceLabel={algoName}
        resourceType="Algorithm"
      />
      <AlgorithmStatusDetails name={algoName} />
      {trailing}
    </div>
  )
}
