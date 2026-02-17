import type { AlgorithmTransition } from '../../data/algorithmsData'
import { FileSignature, Lock, ArrowRight } from 'lucide-react'
import clsx from 'clsx'

interface MobileAlgorithmListProps {
  data: AlgorithmTransition[]
}

export const MobileAlgorithmList = ({ data }: MobileAlgorithmListProps) => {
  // Helper to clean mechanism name (remove parens)
  const cleanName = (name: string) => {
    return name.split('(')[0].trim()
  }

  return (
    <div className="flex flex-col gap-3 pb-8">
      {data.map((algo, index) => (
        <div
          key={`${algo.classical}-${algo.function}-${index}`}
          className="glass-panel p-4 flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div
              className={clsx(
                'p-2 rounded-full',
                algo.function.includes('Signature')
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'bg-emerald-500/10 text-emerald-400'
              )}
            >
              {algo.function.includes('Signature') ? (
                <FileSignature size={20} />
              ) : (
                <Lock size={20} />
              )}
            </div>

            {/* Name */}
            <div>
              <h3 className="font-bold text-foreground text-sm">{cleanName(algo.classical)}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground/60 font-mono">
                <ArrowRight size={10} />
                <span>{cleanName(algo.pqc)}</span>
              </div>
            </div>
          </div>

          {/* Highlight Info (Deprecation) */}
          <div>
            <span
              className={clsx(
                'text-xs px-2 py-1 rounded border font-medium whitespace-nowrap',
                algo.deprecationDate.includes('Deprecated')
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : algo.deprecationDate.includes('Disallowed')
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-muted/10 border-border text-muted-foreground'
              )}
            >
              {algo.deprecationDate.split(' ')[0]} {/* simplified date */}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
