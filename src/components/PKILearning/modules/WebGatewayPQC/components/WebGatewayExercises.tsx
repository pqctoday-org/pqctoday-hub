// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Building2, Globe, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WebGatewayExercisesProps {
  onNavigateToWorkshop: () => void
}

interface Scenario {
  title: string
  icon: React.FC<{ size?: number; className?: string }>
  context: string
  tasks: string[]
  workshopSteps: string[]
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
    workshopSteps: ['Topology Builder (Step 1)', 'Vendor Readiness Matrix (Step 5)'],
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
    workshopSteps: ['TLS Termination Patterns (Step 2)', 'Certificate Rotation Planner (Step 4)'],
  },
  {
    title: 'High-Traffic Gateway Capacity Planning',
    icon: Zap,
    context:
      'Your e-commerce platform handles 100,000 TLS handshakes per second during peak sales events on a 16-core HAProxy cluster. Moving to PQC hybrid will increase handshake sizes by ~3\u00d7.',
    tasks: [
      'Calculate the bandwidth cost of hybrid PQC handshakes at 100K connections/sec',
      'Compare your HAProxy cluster capacity against the PQC hybrid benchmark',
      'Apply mitigations (PSK, RFC 8879 compression) and measure the effective reduction',
      'Determine whether you need hardware upgrades or if software optimization is sufficient',
    ],
    workshopSteps: ['Handshake Budget Calculator (Step 3)'],
  },
]

export const WebGatewayExercises: React.FC<WebGatewayExercisesProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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

            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Workshop tools:</span>
              {scenario.workshopSteps.map((step) => (
                <Button
                  variant="ghost"
                  key={step}
                  onClick={onNavigateToWorkshop}
                  className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                >
                  {step}
                </Button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
