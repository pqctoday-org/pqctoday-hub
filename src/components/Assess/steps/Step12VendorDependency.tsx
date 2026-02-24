import { Info } from 'lucide-react'

import { useAssessmentStore } from '../../../store/useAssessmentStore'

import { InlineTooltip } from '../../ui/InlineTooltip'

import clsx from 'clsx'

import { PersonaHint } from './PersonaHint'

const Step12VendorDependency = () => {
  const { vendorDependency, setVendorDependency, vendorUnknown, setVendorUnknown } =
    useAssessmentStore()

  const options = [
    {
      value: 'heavy-vendor' as const,
      label: 'Heavy Vendor Dependency',
      description: 'We rely primarily on vendor-provided crypto (SaaS, SDK, managed services).',
    },
    {
      value: 'open-source' as const,
      label: 'Open Source Libraries',
      description: 'We use open-source crypto libraries that we control and can update.',
    },
    {
      value: 'mixed' as const,
      label: 'Mixed',
      description: 'Combination of vendor-provided and self-managed crypto libraries.',
    },
    {
      value: 'in-house' as const,
      label: 'In-House Implementations',
      description: 'We build and maintain our own cryptographic implementations.',
    },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        How do you manage cryptographic dependencies?
      </h3>
      <p className="text-sm text-muted-foreground">
        Vendor dependencies affect your control over migration timelines. Heavy vendor reliance
        means you depend on their <InlineTooltip term="PQC">PQC</InlineTooltip> roadmap.
      </p>

      <PersonaHint stepKey="vendors" />

      {/* I don't know escape hatch */}
      <button
        aria-pressed={vendorUnknown}
        onClick={() => setVendorUnknown(!vendorUnknown)}
        className={clsx(
          'w-full p-3 rounded-lg border text-left text-sm font-medium transition-colors flex items-center gap-2',
          vendorUnknown
            ? 'border-muted-foreground bg-muted/20 text-foreground'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground'
        )}
      >
        <Info size={14} className="shrink-0" />I don&apos;t know / Not sure how we manage crypto
        dependencies
      </button>

      <div
        className={clsx('space-y-3', vendorUnknown && 'opacity-40 pointer-events-none')}
        role="radiogroup"
        aria-label="Vendor dependency model"
        aria-disabled={vendorUnknown}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            role="radio"
            aria-checked={vendorDependency === opt.value}
            onClick={() => setVendorDependency(opt.value)}
            className={clsx(
              'w-full p-4 rounded-lg border text-left transition-colors',
              vendorDependency === opt.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30'
            )}
          >
            <span className="font-bold text-sm">{opt.label}</span>
            <p className="text-xs mt-1 opacity-80">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export { Step12VendorDependency }
