import { Info } from 'lucide-react'

import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { usePersonaStore } from '../../../store/usePersonaStore'

import { InlineTooltip } from '../../ui/InlineTooltip'

import { Button } from '../../ui/button'
import clsx from 'clsx'

import { PersonaHint } from './PersonaHint'
import {
  getPersonaStepContent,
  getPersonaOptionDescriptions,
} from '../../../data/personaWizardHints'

const Step12VendorDependency = () => {
  const { vendorDependency, setVendorDependency, vendorUnknown, setVendorUnknown } =
    useAssessmentStore()
  const persona = usePersonaStore((s) => s.selectedPersona)
  const stepContent = getPersonaStepContent(persona, 'vendors')
  const optionDescs = getPersonaOptionDescriptions(persona, 'vendors')

  const options = [
    {
      value: 'heavy-vendor' as const,
      label: 'Heavy Vendor Dependency',
      description:
        optionDescs['heavy-vendor'] ??
        'We rely primarily on vendor-provided crypto (SaaS, SDK, managed services).',
    },
    {
      value: 'open-source' as const,
      label: 'Open Source Libraries',
      description:
        optionDescs['open-source'] ??
        'We use open-source crypto libraries that we control and can update.',
    },
    {
      value: 'mixed' as const,
      label: 'Mixed',
      description:
        optionDescs['mixed'] ?? 'Combination of vendor-provided and self-managed crypto libraries.',
    },
    {
      value: 'in-house' as const,
      label: 'In-House Implementations',
      description:
        optionDescs['in-house'] ?? 'We build and maintain our own cryptographic implementations.',
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        {stepContent.title ?? 'How do you manage cryptographic dependencies?'}
      </h3>
      <p className="text-sm text-muted-foreground">
        {stepContent.description ?? (
          <>
            Vendor dependencies affect your control over migration timelines. Heavy vendor reliance
            means you depend on their <InlineTooltip term="PQC">PQC</InlineTooltip> roadmap.
          </>
        )}
      </p>

      <PersonaHint stepKey="vendors" />

      {/* I don't know escape hatch */}
      <Button
        variant="ghost"
        aria-pressed={vendorUnknown}
        onClick={() => setVendorUnknown(!vendorUnknown)}
        className={clsx(
          'w-full h-auto p-3 justify-start gap-2 whitespace-normal border',
          vendorUnknown
            ? 'border-muted-foreground bg-muted/20 text-foreground hover:bg-muted/20'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground hover:bg-transparent'
        )}
      >
        <Info size={14} className="shrink-0" />I don&apos;t know / Not sure how we manage crypto
        dependencies
      </Button>

      <div
        className={clsx('space-y-3', vendorUnknown && 'opacity-40 pointer-events-none')}
        role="radiogroup"
        aria-label="Vendor dependency model"
        aria-disabled={vendorUnknown}
      >
        {options.map((opt) => (
          <Button
            key={opt.value}
            variant="ghost"
            role="radio"
            aria-checked={vendorDependency === opt.value}
            onClick={() => setVendorDependency(opt.value)}
            className={clsx(
              'w-full h-auto p-4 flex-col items-start whitespace-normal border',
              vendorDependency === opt.value
                ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-transparent'
            )}
          >
            <span className="font-bold text-sm">{opt.label}</span>
            <p className="text-xs mt-1 opacity-80">{opt.description}</p>
          </Button>
        ))}
      </div>
    </div>
  )
}

export { Step12VendorDependency }
