// SPDX-License-Identifier: GPL-3.0-only
import { Link } from 'react-router-dom'
import { FlaskConical, BookOpen, Lightbulb } from 'lucide-react'
import { getAlgoCtasWithFallback } from '@/data/algorithmCtaMap'

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
    </div>
  )
}
