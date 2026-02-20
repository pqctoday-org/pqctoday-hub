import React, { useState, useEffect } from 'react'
import { useModuleStore } from '../../../../store/useModuleStore'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Shield,
  Users,
  GraduationCap,
  Lightbulb,
  ChevronRight,
} from 'lucide-react'

const MODULE_ID = 'pqc-101'

interface StepProps {
  onComplete: () => void
}

const Step1WhyPQC: React.FC<StepProps> = ({ onComplete }) => {
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 border-l-4 border-l-destructive">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-destructive shrink-0 mt-1" size={24} />
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">The Quantum Threat</h3>
            <p className="text-muted-foreground leading-relaxed">
              Today&apos;s most widely used encryption — RSA and ECC — relies on math problems that
              are extremely hard for classical computers. But <strong>quantum computers</strong>{' '}
              using an algorithm called <strong>Shor&apos;s Algorithm</strong> can solve these
              problems exponentially faster.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-5">
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Shield className="text-primary" size={18} />
            What&apos;s at risk?
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <ChevronRight size={14} className="shrink-0 mt-1 text-primary" />
              <span>
                <strong>Online banking & payments</strong> — TLS connections use RSA/ECC
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight size={14} className="shrink-0 mt-1 text-primary" />
              <span>
                <strong>Government & military secrets</strong> — classified data encrypted with RSA
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight size={14} className="shrink-0 mt-1 text-primary" />
              <span>
                <strong>Medical records & personal data</strong> — long-lived data at risk from
                &ldquo;Harvest Now, Decrypt Later&rdquo;
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight size={14} className="shrink-0 mt-1 text-primary" />
              <span>
                <strong>Digital signatures & code signing</strong> — firmware and software updates
              </span>
            </li>
          </ul>
        </div>
        <div className="glass-panel p-5">
          <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Lightbulb className="text-secondary" size={18} />
            Key concept: HNDL
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            <strong>&ldquo;Harvest Now, Decrypt Later&rdquo;</strong> (HNDL) is an attack strategy
            where adversaries collect encrypted data <em>today</em> and store it until quantum
            computers can break the encryption.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This means <strong>data encrypted now</strong> with RSA or ECC could be readable in the
            future. For sensitive data with long lifespans (health records, state secrets),
            migration must start <em>before</em> quantum computers arrive.
          </p>
        </div>
      </div>

      <button
        onClick={onComplete}
        className="ml-auto block px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
      >
        Got it — what&apos;s being done about it? →
      </button>
    </div>
  )
}

const Step2WhatsChanging: React.FC<StepProps> = ({ onComplete }) => {
  const families = [
    {
      name: 'Lattice-Based',
      description: 'Based on the hardness of problems involving mathematical lattices.',
      algorithms: 'ML-KEM (Kyber), ML-DSA (Dilithium)',
      strengths: 'Fast, small keys, well-studied',
      color: 'border-l-primary',
    },
    {
      name: 'Hash-Based',
      description: 'Security relies only on the properties of hash functions. Very conservative.',
      algorithms: 'SLH-DSA (SPHINCS+), LMS/HSS',
      strengths: 'Simplest security assumptions, minimal attack surface',
      color: 'border-l-secondary',
    },
    {
      name: 'Code-Based',
      description:
        'Based on the hardness of decoding error-correcting codes. Among the oldest PQC proposals.',
      algorithms: 'Classic McEliece, HQC',
      strengths: 'Decades of cryptanalysis, very conservative',
      color: 'border-l-accent',
    },
  ]

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground leading-relaxed">
        NIST (the U.S. National Institute of Standards and Technology) has been running a multi-year
        competition to standardize <strong>Post-Quantum Cryptography (PQC)</strong> algorithms — new
        math that even quantum computers can&apos;t crack. The first standards were published in{' '}
        <strong>August 2024</strong>.
      </p>

      <div className="glass-panel p-5">
        <h4 className="font-semibold text-foreground mb-4">The Transition at a Glance</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 text-muted-foreground font-medium">Use Case</th>
                <th className="py-2 pr-4 text-destructive font-medium">Classical (Vulnerable)</th>
                <th className="py-2 text-green-400 font-medium">PQC Replacement</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50">
                <td className="py-2.5 pr-4 font-medium text-foreground">Key Exchange</td>
                <td className="py-2.5 pr-4">RSA, ECDH, DH</td>
                <td className="py-2.5 text-green-400">ML-KEM (FIPS 203)</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-2.5 pr-4 font-medium text-foreground">Digital Signatures</td>
                <td className="py-2.5 pr-4">RSA, ECDSA, EdDSA</td>
                <td className="py-2.5 text-green-400">ML-DSA (FIPS 204)</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4 font-medium text-foreground">Conservative Signatures</td>
                <td className="py-2.5 pr-4">RSA, ECDSA</td>
                <td className="py-2.5 text-green-400">SLH-DSA (FIPS 205)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <h4 className="font-semibold text-foreground">Three Families of PQC</h4>
      <div className="space-y-3">
        {families.map((f) => (
          <div key={f.name} className={`glass-panel p-4 border-l-4 ${f.color}`}>
            <h5 className="font-semibold text-foreground mb-1">{f.name}</h5>
            <p className="text-sm text-muted-foreground mb-2">{f.description}</p>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>
                <strong>Algorithms:</strong> {f.algorithms}
              </span>
              <span>
                <strong>Strengths:</strong> {f.strengths}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onComplete}
        className="ml-auto block px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
      >
        What are the deadlines? →
      </button>
    </div>
  )
}

const Step3Timeline: React.FC<StepProps> = ({ onComplete }) => {
  const milestones = [
    { year: '2016', event: 'NIST launches PQC standardization competition', phase: 'Research' },
    {
      year: '2022',
      event: 'NIST selects first PQC standards (Kyber, Dilithium, SPHINCS+)',
      phase: 'Selection',
    },
    {
      year: '2024',
      event: 'FIPS 203, 204, 205 published — PQC standards are official',
      phase: 'Standardization',
    },
    {
      year: '2025',
      event: 'CNSA 2.0 mandates PQC for U.S. national security systems',
      phase: 'Policy',
    },
    {
      year: '2030',
      event: 'NIST target: deprecate RSA-2048 and 112-bit ECC',
      phase: 'Deprecation',
    },
    {
      year: '2035',
      event: 'NIST target: disallow all classical public-key crypto',
      phase: 'Deadline',
    },
  ]

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground leading-relaxed">
        PQC migration is not a future concern — it&apos;s happening <strong>now</strong>. Here are
        the key milestones:
      </p>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-4">
          {milestones.map((m, i) => (
            <div key={m.year} className="flex gap-4 items-start relative">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 bg-background z-10 shrink-0 ${
                  i <= 3 ? 'border-green-500 text-green-400' : 'border-amber-500 text-amber-400'
                }`}
              >
                {i <= 3 ? '✓' : '!'}
              </div>
              <div className="glass-panel p-4 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-foreground">{m.year}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {m.phase}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{m.event}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-4 border-l-4 border-l-amber-500">
        <p className="text-sm text-muted-foreground">
          <strong className="text-amber-400">Key takeaway:</strong> With NIST targeting 2030 for RSA
          deprecation, organizations have roughly 4 years to migrate. Many compliance frameworks are
          already requiring PQC readiness assessments.
        </p>
      </div>

      <Link
        to="/timeline"
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        Explore the full interactive timeline →
      </Link>

      <button
        onClick={onComplete}
        className="ml-auto block px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
      >
        Who needs to act? →
      </button>
    </div>
  )
}

const Step4WhoNeedsToAct: React.FC<StepProps> = ({ onComplete }) => {
  const sectors = [
    {
      name: 'Finance & Banking',
      urgency: 'Critical',
      reason: 'Payment systems, inter-bank transfers, and customer data all rely on RSA/ECC.',
      color: 'text-destructive',
    },
    {
      name: 'Government & Defense',
      urgency: 'Critical',
      reason:
        'Classified data has decades-long sensitivity. HNDL attacks are an active concern today.',
      color: 'text-destructive',
    },
    {
      name: 'Healthcare',
      urgency: 'High',
      reason: 'Patient records must be protected for 50+ years. HIPAA compliance will require PQC.',
      color: 'text-amber-400',
    },
    {
      name: 'Telecommunications',
      urgency: 'High',
      reason: '5G infrastructure uses ECC for subscriber identity protection (SUCI).',
      color: 'text-amber-400',
    },
    {
      name: 'Blockchain & Crypto',
      urgency: 'High',
      reason:
        'Bitcoin (secp256k1) and Ethereum (ECDSA) are directly vulnerable to quantum attacks.',
      color: 'text-amber-400',
    },
    {
      name: 'IoT & Automotive',
      urgency: 'Medium',
      reason: 'Long device lifecycles mean firmware signing must be PQC-ready now.',
      color: 'text-secondary',
    },
  ]

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground leading-relaxed">
        Every industry that uses public-key cryptography is affected. The urgency depends on data
        sensitivity and system lifecycle:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sectors.map((s) => (
          <div key={s.name} className="glass-panel p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-foreground">{s.name}</h4>
              <span className={`text-xs font-bold ${s.color}`}>{s.urgency}</span>
            </div>
            <p className="text-sm text-muted-foreground">{s.reason}</p>
          </div>
        ))}
      </div>

      <Link
        to="/threats"
        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
      >
        View the full Quantum Threat Dashboard →
      </Link>

      <button
        onClick={onComplete}
        className="ml-auto block px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
      >
        What should I do next? →
      </button>
    </div>
  )
}

const Step5NextSteps: React.FC = () => {
  const paths = [
    {
      role: 'Security Engineer',
      icon: Shield,
      description: 'Hands-on algorithm testing and OpenSSL operations',
      links: [
        { label: 'Crypto Playground', path: '/playground' },
        { label: 'OpenSSL Studio', path: '/openssl' },
        { label: 'PKI Workshop', path: '/learn/pki-workshop' },
      ],
    },
    {
      role: 'Risk / Compliance Officer',
      icon: AlertTriangle,
      description: 'Compliance tracking, threat analysis, and migration planning',
      links: [
        { label: 'Compliance Tracker', path: '/compliance' },
        { label: 'Threat Dashboard', path: '/threats' },
        { label: 'Migration Guide', path: '/migrate' },
      ],
    },
    {
      role: 'Student / Learner',
      icon: GraduationCap,
      description: 'Deep-dive courses on PKI, TLS, 5G, digital identity',
      links: [
        { label: 'PKI Workshop', path: '/learn/pki-workshop' },
        { label: 'TLS 1.3 Basics', path: '/learn/tls-basics' },
        { label: 'Digital Assets', path: '/learn/digital-assets' },
      ],
    },
    {
      role: 'Manager / Executive',
      icon: Users,
      description: 'High-level overview, timelines, and industry impacts',
      links: [
        { label: 'Migration Timeline', path: '/timeline' },
        { label: 'Threat Dashboard', path: '/threats' },
        { label: 'Industry Leaders', path: '/leaders' },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground leading-relaxed">
        You&apos;ve completed PQC 101! Choose your path based on your role:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paths.map((p) => (
          <div key={p.role} className="glass-panel p-5 hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-primary/10">
                <p.icon className="text-primary" size={20} />
              </div>
              <h4 className="font-semibold text-foreground">{p.role}</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{p.description}</p>
            <div className="space-y-2">
              {p.links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ArrowRight size={14} />
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel p-5 border-l-4 border-l-green-500 text-center">
        <p className="text-green-400 font-semibold mb-1">🎉 You&apos;ve completed PQC 101!</p>
        <p className="text-sm text-muted-foreground">
          You now understand the quantum threat, the PQC solution, and the timeline. Explore the
          modules above or use the Glossary button (bottom right) for any term you encounter.
        </p>
      </div>
    </div>
  )
}

export const PQC101Module: React.FC = () => {
  const { markStepComplete, updateModuleProgress } = useModuleStore()
  const [currentStep, setCurrentStep] = useState(0)

  // Mark module in-progress as soon as the user opens it
  useEffect(() => {
    updateModuleProgress(MODULE_ID, { status: 'in-progress' })
  }, [updateModuleProgress])

  const handleStepComplete = (stepId: string, nextIndex: number) => {
    markStepComplete(MODULE_ID, stepId)
    updateModuleProgress(MODULE_ID, { status: 'in-progress' })
    setCurrentStep(nextIndex)
  }

  const handleFinalComplete = () => {
    markStepComplete(MODULE_ID, 'next-steps')
    updateModuleProgress(MODULE_ID, { status: 'completed' })
  }

  const steps = [
    {
      id: 'why-pqc',
      title: 'Why PQC?',
      component: <Step1WhyPQC onComplete={() => handleStepComplete('why-pqc', 1)} />,
    },
    {
      id: 'whats-changing',
      title: "What's Changing",
      component: <Step2WhatsChanging onComplete={() => handleStepComplete('whats-changing', 2)} />,
    },
    {
      id: 'the-timeline',
      title: 'The Timeline',
      component: <Step3Timeline onComplete={() => handleStepComplete('the-timeline', 3)} />,
    },
    {
      id: 'who-acts',
      title: 'Who Needs to Act',
      component: <Step4WhoNeedsToAct onComplete={() => handleStepComplete('who-acts', 4)} />,
    },
    {
      id: 'next-steps',
      title: 'Your Next Steps',
      component: <Step5NextSteps />,
    },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gradient mb-2">
        PQC 101 — The Quantum Threat & What To Do About It
      </h1>
      <p className="text-muted-foreground mb-8">
        A beginner-friendly introduction to Post-Quantum Cryptography in 5 steps.
      </p>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10" />
          {steps.map((step, idx) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(idx)}
              className={`flex flex-col items-center gap-2 group ${
                idx === currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors bg-background text-sm
                ${
                  idx === currentStep
                    ? 'border-primary text-primary'
                    : idx < currentStep
                      ? 'border-green-500 text-green-400'
                      : 'border-border text-muted-foreground'
                }
              `}
              >
                {idx < currentStep ? '✓' : idx + 1}
              </div>
              <span className="text-[10px] md:text-xs font-medium max-w-[80px] text-center leading-tight">
                {step.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="glass-panel p-6 md:p-8 min-h-[400px]">
        {/* eslint-disable-next-line security/detect-object-injection */}
        <h2 className="text-2xl font-bold text-foreground mb-6">{steps[currentStep].title}</h2>
        {/* eslint-disable-next-line security/detect-object-injection */}
        {steps[currentStep].component}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="px-6 py-2 rounded-lg border border-border hover:bg-muted/10 disabled:opacity-50 transition-colors text-foreground"
        >
          ← Previous
        </button>

        {currentStep === steps.length - 1 ? (
          <button
            onClick={handleFinalComplete}
            className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors"
          >
            ✓ Complete Module
          </button>
        ) : (
          <button
            onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
            className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  )
}
