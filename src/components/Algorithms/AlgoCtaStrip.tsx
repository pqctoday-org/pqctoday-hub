// SPDX-License-Identifier: GPL-3.0-only
import { Link } from 'react-router'
import { FlaskConical, BookOpen, Lightbulb } from 'lucide-react'
import { getAlgoCtasWithFallback } from '@/data/algorithmCtaMap'
import { EndorseButton } from '@/components/ui/EndorseButton'
import { FlagButton } from '@/components/ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'

interface AlgoCtaStripProps {
  algoName: string
  className?: string
}

export function AlgoCtaStrip({ algoName, className = '' }: AlgoCtaStripProps) {
  const ctas = getAlgoCtasWithFallback(algoName)

  return (
    <div className={`flex items-center gap-1 flex-wrap ${className}`}>
      {ctas.try && (
        <Link
          to={ctas.try}
          className="inline-flex items-center gap-1 h-auto py-0.5 px-1.5 text-xs text-muted-foreground hover:text-primary rounded transition-colors"
          title={`Try ${algoName} in playground`}
        >
          <FlaskConical size={11} />
          Try
        </Link>
      )}
      {ctas.spec && (
        <Link
          to={ctas.spec}
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
    </div>
  )
}
