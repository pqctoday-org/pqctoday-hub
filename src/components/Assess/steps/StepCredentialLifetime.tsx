import { Info } from 'lucide-react'

import { useAssessmentStore } from '../../../store/useAssessmentStore'

import { AVAILABLE_CREDENTIAL_LIFETIME } from '../../../hooks/assessmentData'

import { InlineTooltip } from '../../ui/InlineTooltip'

import clsx from 'clsx'

import { PersonaHint } from './PersonaHint'

const StepCredentialLifetime = () => {
  const {
    credentialLifetime,
    toggleCredentialLifetime,
    credentialLifetimeUnknown,
    setCredentialLifetimeUnknown,
  } = useAssessmentStore()

  const options = [
    {
      id: 'under-1y',
      label: 'Under 1 year',
      description: 'Short-lived tokens, ACME auto-renewed certificates',
    },
    {
      id: '1-3y',
      label: '1–3 years',
      description: 'Standard TLS / end-entity certificates',
    },
    {
      id: '3-10y',
      label: '3–10 years',
      description: 'Code signing certificates, intermediate CA certificates',
    },
    {
      id: '10-25y',
      label: '10–25 years',
      description: 'Root CA certificates, long-lived PKI infrastructure',
    },
    {
      id: '25-plus',
      label: '25+ years',
      description: 'Government, aerospace, or critical infrastructure credentials',
    },
    {
      id: 'indefinite',
      label: 'Indefinite / permanent',
      description: 'Blockchain transactions, immutable audit logs, legal records',
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        How long must your digital signatures &amp; certificates remain trusted?
      </h3>
      <p className="text-sm text-muted-foreground">
        Select all that apply — <InlineTooltip term="HNFL">HNFL</InlineTooltip> risk is assessed
        against the longest period. Credentials that outlive the quantum threat horizon are
        vulnerable to signature forgery.
      </p>

      <PersonaHint stepKey="credential" />

      <div className="glass-panel p-4 border-l-4 border-l-destructive mb-4">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-destructive">HNFL</strong>: Adversaries collect public keys and
            signed artifacts today and wait for quantum computers to forge signatures. Root CA
            certificates issued today with a 20-year validity period are a primary HNFL target.
          </p>
        </div>
      </div>

      {/* I don't know — Step 3 model */}
      <button
        aria-pressed={credentialLifetimeUnknown}
        onClick={() => setCredentialLifetimeUnknown(!credentialLifetimeUnknown)}
        className={clsx(
          'w-full p-3 rounded-lg border text-left text-sm font-medium transition-colors flex items-center gap-2',
          credentialLifetimeUnknown
            ? 'border-muted-foreground bg-muted/20 text-foreground'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground'
        )}
      >
        <Info size={14} className="shrink-0" />I don&apos;t know / Our credential lifetimes are not
        defined
      </button>

      <div
        className={clsx('space-y-3', credentialLifetimeUnknown && 'opacity-40 pointer-events-none')}
        role="group"
        aria-label="Credential lifetime selection"
        aria-disabled={credentialLifetimeUnknown}
      >
        {AVAILABLE_CREDENTIAL_LIFETIME.map((id) => {
          const opt = options.find((o) => o.id === id)
          if (!opt) return null
          return (
            <button
              key={opt.id}
              aria-pressed={credentialLifetime.includes(opt.id)}
              onClick={() => toggleCredentialLifetime(opt.id)}
              className={clsx(
                'w-full p-4 rounded-lg border text-left transition-colors',
                credentialLifetime.includes(opt.id)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/30'
              )}
            >
              <span className="font-bold text-sm">{opt.label}</span>
              <p className="text-xs mt-1 opacity-80">{opt.description}</p>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Root CA certificates issued today with a 20-year validity period must be trusted past the
        estimated quantum threat horizon of 2035.
      </p>
    </div>
  )
}

export { StepCredentialLifetime }
