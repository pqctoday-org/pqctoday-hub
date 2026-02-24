import { AlertTriangle, Info } from 'lucide-react'

import { useAssessmentStore } from '../../../store/useAssessmentStore'

import { AVAILABLE_ALGORITHMS, VULNERABLE_ALGORITHMS } from '../../../hooks/assessmentData'

import clsx from 'clsx'

import { PersonaHint } from './PersonaHint'

const Step3Crypto = () => {
  const { currentCrypto, toggleCrypto, cryptoUnknown, setCryptoUnknown } = useAssessmentStore()

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">What cryptography do you use today?</h3>
      <p className="text-sm text-muted-foreground">
        Select all algorithms currently in use across your systems. Don&apos;t worry if you&apos;re
        unsure — select the ones you know about.
      </p>

      <PersonaHint stepKey="crypto" />

      {/* I don't know escape hatch */}
      <button
        aria-pressed={cryptoUnknown}
        onClick={() => setCryptoUnknown(!cryptoUnknown)}
        className={clsx(
          'w-full p-3 rounded-lg border text-left text-sm font-medium transition-colors flex items-center gap-2',
          cryptoUnknown
            ? 'border-muted-foreground bg-muted/20 text-foreground'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground'
        )}
      >
        <Info size={14} className="shrink-0" />I don&apos;t know / Not sure what algorithms we use
      </button>

      <div
        className={clsx(
          'grid grid-cols-1 md:grid-cols-2 gap-2 transition-opacity',
          cryptoUnknown && 'opacity-40 pointer-events-none'
        )}
        role="group"
        aria-label="Algorithm selection"
        aria-disabled={cryptoUnknown}
      >
        {AVAILABLE_ALGORITHMS.map((algo) => {
          const isVulnerable = VULNERABLE_ALGORITHMS.has(algo)
          return (
            <button
              key={algo}
              aria-pressed={currentCrypto.includes(algo)}
              onClick={() => toggleCrypto(algo)}
              className={clsx(
                'p-3 rounded-lg border text-left text-sm font-medium transition-colors flex items-center justify-between',
                currentCrypto.includes(algo)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              <span>{algo}</span>
              {isVulnerable && <AlertTriangle size={14} className="text-warning shrink-0" />}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <AlertTriangle size={12} className="text-warning" />= Quantum-vulnerable algorithm
      </p>
    </div>
  )
}

export { Step3Crypto }
