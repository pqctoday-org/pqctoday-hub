// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Building2, Globe, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WebGatewayExercisesProps {
  onNavigateToWorkshop: () => void
  onOpenWorkshopStep?: (step: number) => void
}

interface WorkshopStepLink {
  label: string
  step: number
}

interface Scenario {
  title: string
  icon: React.FC<{ size?: number; className?: string }>
  context: string
  tasks: string[]
  productionCheck: string
  workshopSteps: WorkshopStepLink[]
}

const SCENARIOS: Scenario[] = [
  {
    title: 'Enterprise Gateway Stack Audit',
    icon: Building2,
    context:
      'Your organization uses F5 BIG-IP for external TLS termination, HAProxy for internal load balancing, and Imperva WAF for application protection. The CISO has mandated PQC readiness by Q4 2027.',
    tasks: [
      'Model your 3-tier gateway architecture in the Topology Builder with current TLS modes',
      'Identify which connections are quantum-vulnerable and which can be upgraded immediately',
      'Use the Vendor Readiness Matrix to check PQC support for F5, HAProxy, and Imperva',
      'Propose a phased migration plan: which gateway tier to upgrade first and why',
    ],
    productionCheck:
      'Decision & evidence: Verify exact gateway firmware versions, supported RFC 10024 hybrid groups (0x11EC), and TLS-inspection compatibility on a staging path before committing to a Q4 2027 cutover sequence.',
    workshopSteps: [
      { label: 'Topology Builder (Step 1)', step: 0 },
      { label: 'Vendor Readiness Matrix (Step 5)', step: 4 },
    ],
  },
  {
    title: 'CDN Origin Shield Migration',
    icon: Globe,
    context:
      'You operate a SaaS platform serving 50M monthly users behind Cloudflare CDN. Cloudflare already terminates PQC hybrid TLS to clients, but your 12 origin servers still use classical RSA-2048 certificates with 1-year validity.',
    tasks: [
      'Compare re-encrypt-backend and split TLS patterns for your CDN-to-origin connection',
      'Evaluate whether origin shielding reduces your certificate migration scope',
      'Plan the certificate rotation from RSA-2048 to ML-DSA-65 across 12 origin servers',
      'Set a phased rollout (90 days) and identify the risk window where mixed algorithms exist',
    ],
    productionCheck:
      'Decision & evidence: Confirm both CDN edge-to-origin TLS settings and origin ACME/CLM automation support the target certificate profile, and capture negotiated groups on both the client-to-edge and edge-to-origin legs.',
    workshopSteps: [
      { label: 'TLS Termination Patterns (Step 2)', step: 1 },
      { label: 'Certificate Rotation Planner (Step 4)', step: 3 },
    ],
  },
  {
    title: 'High-Traffic Gateway Capacity Planning',
    icon: Zap,
    context:
      "Your e-commerce platform handles 100,000 TLS handshakes per second during peak sales events on a 16-core HAProxy cluster. In the Hub's sample capture, moving to PQC hybrid raised the handshake from 2,233 to 4,499 bytes, about 2\u00d7 (a sample profile, not your gateway).",
    tasks: [
      'Calculate the handshake-layer byte budget of hybrid PQC handshakes at 100K new connections/sec',
      'Inspect the separate effect of RFC 8879 certificate compression versus connection reuse (lowering the explicit new-handshake rate)',
      'Export the declared boundary notes showing which combinations are modeled versus unmeasured',
      'Design a staging load test on your HAProxy cluster to measure actual CPU, latency, and peak-event headroom',
    ],
    productionCheck:
      'Decision & evidence: Treat the calculator as a handshake-byte planning bound only; run load tests on your actual HAProxy hardware, TLS library, and certificate chain to decide whether software tuning or hardware scaling is required.',
    workshopSteps: [{ label: 'Handshake Budget Calculator (Step 3)', step: 2 }],
  },
]

export const WebGatewayExercises: React.FC<WebGatewayExercisesProps> = ({
  onNavigateToWorkshop,
  onOpenWorkshopStep,
}) => {
  const handleOpenStep = (step: number) => {
    if (onOpenWorkshopStep) {
      onOpenWorkshopStep(step)
    } else {
      onNavigateToWorkshop()
    }
  }

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Practical Exercises</h2>
        <p className="text-sm text-muted-foreground">
          Apply what you&apos;ve learned to real-world scenarios. Each exercise uses the workshop
          tools to solve a concrete PQC gateway deployment challenge.
        </p>
      </div>

      {SCENARIOS.map((scenario) => {
        const Icon = scenario.icon
        return (
          <div key={scenario.title} className="glass-panel p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon size={20} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{scenario.title}</h3>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">Scenario</div>
              <p className="text-sm text-muted-foreground">{scenario.context}</p>
            </div>

            <div>
              <div className="text-xs font-bold text-foreground mb-2">Tasks</div>
              <ol className="space-y-2">
                {scenario.tasks.map((task, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-foreground/80">
                    <span className="text-xs font-mono text-primary shrink-0 mt-0.5 w-5 text-right">
                      {idx + 1}.
                    </span>
                    <span>{task}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">
                  {scenario.productionCheck.split(':')[0]}:
                </strong>
                {scenario.productionCheck.slice(scenario.productionCheck.indexOf(':') + 1)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Workshop tools:</span>
              {scenario.workshopSteps.map((stepLink) => (
                <Button
                  variant="ghost"
                  key={stepLink.label}
                  onClick={() => handleOpenStep(stepLink.step)}
                  className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                >
                  {stepLink.label}
                </Button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
