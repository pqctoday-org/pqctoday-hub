import React, { useState } from 'react'
import {
  ShieldCheck,
  FileText,
  Activity,
  Database,
  Settings,
  Layers,
  CheckCircle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ESV_STEPS } from '../utils/entropyConstants'

const STEP_ICONS = [FileText, Activity, Database, Settings, Layers]

const FLOW_STAGES = [
  { label: 'Submit to ESV Server', icon: FileText },
  { label: 'SP 800-90B Assessment', icon: Activity },
  { label: 'CMVP Review (~6 weeks)', icon: ShieldCheck },
  { label: 'ESV Certificate', icon: CheckCircle },
]

const SOURCE_TYPES = ['Ring Oscillator', 'Thermal Noise', 'Shot Noise'] as const

const NOISE_MODEL_BLOCKS = [
  {
    label: 'Physical Noise',
    description: 'Raw entropy from a physical process (thermal, quantum, etc.)',
  },
  { label: 'Digitizer', description: 'Converts analog noise signal into digital samples' },
  { label: 'Raw Samples', description: 'Unprocessed digital output from the noise source' },
  {
    label: 'Health Tests',
    description: 'Continuous checks to detect source degradation or failure',
  },
  { label: 'Conditioning', description: 'Compresses raw output to achieve full entropy per bit' },
  { label: 'Output', description: 'Full-entropy seed material ready for the DRBG' },
]

const CONDITIONING_FUNCTIONS = [
  { name: 'HMAC', detail: 'HMAC-SHA-256 — keyed hash for extract-then-expand' },
  {
    name: 'Hash (SHA-256)',
    detail: 'Approved hash-based conditioning per SP 800-90B Section 3.1.5',
  },
  { name: 'CBC-MAC (AES)', detail: 'Block-cipher-based conditioning using AES-256' },
]

const MOCK_RAW_OUTPUT = [
  'a3 7f 12 c4 89 0e 5b d2 f7 31 6a 8c e0 4d b9 23',
  '1e 95 d8 40 7c a6 53 bf 08 6d e2 44 9a f1 37 c5',
  '82 db 16 69 af 04 58 e3 7d b0 25 94 cf 4a f6 1b',
  '63 d7 0c 8e 42 a1 5f 98 34 c8 71 e9 06 bd 2a 57',
].join('\n')

export const ESVWalkthroughDemo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)

  const goToStep = (step: number) => {
    if (step >= 0 && step < ESV_STEPS.length) {
      setCurrentStep(step)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              The first step is to formally describe the entropy source. Below are example fields
              from a real ESV submission.
            </p>

            <div className="space-y-3">
              {/* Source Type */}
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-xs font-bold text-foreground block mb-1.5">Source Type</p>
                <div className="flex flex-wrap gap-2">
                  {SOURCE_TYPES.map((type) => (
                    <span
                      key={type}
                      className="px-3 py-1.5 rounded text-xs bg-primary/10 text-primary border border-primary/20 font-medium"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Operating Conditions */}
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-xs font-bold text-foreground block mb-1.5">
                  Operating Conditions
                </p>
                <div className="bg-background rounded p-2 border border-input text-xs text-muted-foreground font-mono">
                  Temperature: -40 to +85 C | Voltage: 1.0V - 1.2V | Sampling rate: 100 MHz
                </div>
              </div>

              {/* Expected Entropy Rate */}
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-xs font-bold text-foreground block mb-1.5">
                  Expected Entropy Rate
                </p>
                <div className="flex items-center gap-2">
                  <div className="bg-background rounded px-3 py-1.5 border border-input text-xs text-foreground font-mono">
                    0.97 bits/sample
                  </div>
                  <span className="text-xs text-muted-foreground">
                    (min-entropy estimate per 8-bit output)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              The noise source model describes the full pipeline from physical randomness to digital
              output. Each block must be documented and justified.
            </p>

            {/* Noise model flow */}
            <div className="flex flex-wrap items-center gap-1">
              {NOISE_MODEL_BLOCKS.map((block, idx) => (
                <React.Fragment key={block.label}>
                  <div className="bg-muted/50 rounded-lg p-3 border border-border min-w-[120px] flex-shrink-0">
                    <span className="text-xs font-bold text-foreground block mb-1">
                      {block.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{block.description}</span>
                  </div>
                  {idx < NOISE_MODEL_BLOCKS.length - 1 && (
                    <ArrowRight size={14} className="text-primary shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
              <p className="text-xs text-foreground/80">
                <strong>Key requirement:</strong> The model must include a stochastic analysis
                showing how physical randomness propagates through each stage. Failure modes (e.g.,
                bias under temperature extremes, stuck-at faults) must be documented with
                mitigations.
              </p>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Raw noise samples are submitted to the ESV Server for automated SP 800-90B min-entropy
              assessment. Samples must be unconditioned.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
                <span className="text-2xl font-bold text-primary block">1,000,000</span>
                <span className="text-xs text-muted-foreground">raw samples required</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
                <span className="text-2xl font-bold text-primary block">8-bit</span>
                <span className="text-xs text-muted-foreground">output per sample</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
                <span className="text-2xl font-bold text-primary block">~1 MB</span>
                <span className="text-xs text-muted-foreground">total submission size</span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <span className="text-xs font-bold text-foreground block mb-2">
                Sample Raw Output Preview (hex)
              </span>
              <pre className="bg-background rounded p-3 border border-input text-[10px] text-muted-foreground font-mono leading-relaxed overflow-x-auto">
                {MOCK_RAW_OUTPUT}
              </pre>
              <p className="text-[10px] text-muted-foreground mt-2 italic">
                Must be unconditioned (raw noise) -- no hashing, no compression, no whitening.
              </p>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Health tests run continuously during operation to detect entropy source degradation.
              SP 800-90B mandates two tests.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Repetition Count Test */}
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded bg-primary/10">
                    <Activity size={14} className="text-primary" />
                  </div>
                  <span className="text-sm font-bold text-foreground">Repetition Count Test</span>
                </div>
                <div className="bg-background rounded p-3 border border-input mb-3">
                  <p className="text-xs font-mono text-primary text-center">
                    {'C = \u2308 1 + (-log\u2082\u03B1) / H \u2309'}
                  </p>
                </div>
                <div className="space-y-2 text-xs text-foreground/80">
                  <p>
                    <strong>C</strong> = cutoff value (consecutive identical samples before alarm)
                  </p>
                  <p>
                    <strong>H</strong> = min-entropy estimate per sample
                  </p>
                  <p>
                    <strong>{'\u03B1'}</strong> = false-positive probability (typically 2
                    <sup>-20</sup>)
                  </p>
                </div>
                <div className="mt-3 bg-primary/5 rounded p-2 border border-primary/20">
                  <p className="text-[10px] text-muted-foreground">
                    <strong>Example:</strong> For H=0.97, {'\u03B1'}=2<sup>-20</sup>: C = {'\u2308'}
                    1 + 20/0.97{'\u2309'} = 22. If 22 consecutive identical samples appear, the
                    source is flagged.
                  </p>
                </div>
              </div>

              {/* Adaptive Proportion Test */}
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded bg-primary/10">
                    <Settings size={14} className="text-primary" />
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    Adaptive Proportion Test
                  </span>
                </div>
                <div className="bg-background rounded p-3 border border-input mb-3">
                  <p className="text-xs font-mono text-primary text-center">
                    Window size W, cutoff value C
                  </p>
                </div>
                <div className="space-y-2 text-xs text-foreground/80">
                  <p>
                    <strong>W</strong> = window size (512 for 8-bit output, 64 for binary)
                  </p>
                  <p>
                    <strong>C</strong> = maximum count of the most frequent value in the window
                  </p>
                  <p>
                    Detects bias: if one value appears too frequently within a window, the source
                    may be degraded.
                  </p>
                </div>
                <div className="mt-3 bg-primary/5 rounded p-2 border border-primary/20">
                  <p className="text-[10px] text-muted-foreground">
                    <strong>Example:</strong> For W=512, if a single byte value appears more than C
                    times in 512 samples, the source fails. The cutoff C depends on H and {'\u03B1'}
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              The conditioning component compresses raw noise output into full-entropy output
              suitable for seeding a DRBG. Only NIST-approved functions may be used.
            </p>

            <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 mb-4">
              <p className="text-xs text-foreground/80">
                <strong>Purpose:</strong> Conditioning compresses raw noise output into full-entropy
                output. If the raw source provides H bits of min-entropy per sample and the output
                is n bits, the conditioning function must ensure the output has at least n bits of
                min-entropy.
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-foreground">
                Approved Conditioning Functions (SP 800-90B Section 3.1.5)
              </span>
              {CONDITIONING_FUNCTIONS.map((fn) => (
                <div
                  key={fn.name}
                  className="bg-muted/50 rounded-lg p-3 border border-border flex items-start gap-3"
                >
                  <div className="p-1.5 rounded bg-primary/10 shrink-0 mt-0.5">
                    <Layers size={14} className="text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-foreground">{fn.name}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{fn.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <span className="text-xs font-bold text-foreground block mb-2">
                Conditioning Flow
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1.5 rounded bg-muted text-xs text-foreground border border-border font-mono">
                  Raw Noise (H &lt; 1.0)
                </span>
                <ArrowRight size={14} className="text-primary shrink-0" />
                <span className="px-3 py-1.5 rounded bg-primary/10 text-xs text-primary border border-primary/20 font-mono">
                  Conditioning Function
                </span>
                <ArrowRight size={14} className="text-primary shrink-0" />
                <span className="px-3 py-1.5 rounded bg-success/10 text-xs text-success border border-success/20 font-mono">
                  Full-Entropy Output (H = 1.0)
                </span>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Process Overview */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-bold text-gradient mb-2">NIST Entropy Source Validation</h3>
        <p className="text-sm text-muted-foreground mb-4">
          The NIST Entropy Source Validation (ESV) program, part of the CMVP, provides automated
          validation of entropy sources per SP 800-90B. Validated entropy sources are required for
          FIPS 140-3 cryptographic modules.
        </p>

        {/* Flow diagram */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {FLOW_STAGES.map((stage, idx) => {
            const Icon = stage.icon
            return (
              <React.Fragment key={stage.label}>
                <div className="bg-muted/50 rounded-lg p-3 border border-border text-center min-w-[140px]">
                  <Icon size={20} className="text-primary mx-auto mb-1.5" />
                  <span className="text-xs font-medium text-foreground">{stage.label}</span>
                </div>
                {idx < FLOW_STAGES.length - 1 && (
                  <ArrowRight size={16} className="text-primary shrink-0" />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Step Navigator */}
      <div className="glass-panel p-4">
        <div className="relative flex items-center justify-between">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />

          {ESV_STEPS.map((step, idx) => {
            const StepIcon = STEP_ICONS[idx]
            const isActive = idx === currentStep
            const isCompleted = idx < currentStep

            return (
              <button
                key={step.id}
                onClick={() => goToStep(idx)}
                className="relative z-10 flex flex-col items-center gap-1.5 group"
                aria-label={`Step ${idx + 1}: ${step.title}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border-2 ${
                    isActive
                      ? 'bg-primary/20 border-primary text-primary'
                      : isCompleted
                        ? 'bg-success/20 border-success text-success'
                        : 'bg-muted border-border text-muted-foreground group-hover:border-primary/30'
                  }`}
                >
                  {isCompleted ? <CheckCircle size={18} /> : <StepIcon size={18} />}
                </div>
                <span
                  className={`text-[10px] font-medium text-center max-w-[80px] leading-tight hidden sm:block ${
                    isActive
                      ? 'text-primary'
                      : isCompleted
                        ? 'text-success'
                        : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="glass-panel p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-lg bg-primary/10 shrink-0">
            {React.createElement(STEP_ICONS[currentStep], { size: 24, className: 'text-primary' })}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                Step {currentStep + 1} of {ESV_STEPS.length}
              </span>
            </div>
            <h4 className="text-xl font-bold text-foreground">{ESV_STEPS[currentStep].title}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {ESV_STEPS[currentStep].description}
            </p>
          </div>
        </div>

        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={() => goToStep(currentStep - 1)}
          disabled={currentStep === 0}
        >
          Previous
        </Button>

        <span className="text-xs text-muted-foreground">
          {currentStep + 1} / {ESV_STEPS.length}
        </span>

        <Button
          variant="gradient"
          onClick={() => goToStep(currentStep + 1)}
          disabled={currentStep === ESV_STEPS.length - 1}
        >
          Next
        </Button>
      </div>

      {/* External Link */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() =>
            window.open(
              'https://csrc.nist.gov/projects/cryptographic-module-validation-program/entropy-validations',
              '_blank',
              'noopener,noreferrer'
            )
          }
        >
          <ExternalLink size={14} className="mr-2" />
          Visit NIST ESV Program
        </Button>
      </div>
    </div>
  )
}
