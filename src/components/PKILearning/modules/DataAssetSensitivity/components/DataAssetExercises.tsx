// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export interface WorkshopConfig {
  step: number
}

interface DataAssetExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopConfig?: (config: WorkshopConfig) => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  config: WorkshopConfig
}

export const DataAssetExercises: React.FC<DataAssetExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'healthcare-hndl',
      title: '1. Healthcare HNDL Classification Challenge',
      description:
        'A regional hospital system stores electronic health records (ePHI) under HIPAA. The regulation requires 6-year minimum retention from last patient encounter — but records are routinely kept 30+ years in practice. Using the Asset Inventory Builder, create an asset entry for this ePHI database: Asset Type = Data Store, Sensitivity = High, Retention = 25+ years, Industry = Healthcare. Then check the HNDL Risk Year column.',
      badge: 'HNDL',
      badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
      observe:
        'With a 30-year retention period and High sensitivity, the HNDL risk year is 2034 − 30 = 2004. Data encrypted and collected as far back as 2004 is already in adversary archives. When you run this asset through the Sensitivity Scoring Engine (Step 4), the composite score will be ≥ 85 — placing it in the Critical urgency band. HIPAA + NIST IR 8547 compliance flags add further urgency.',
      config: { step: 0 },
    },
    {
      id: 'multi-jurisdiction-finance',
      title: '2. Multi-Jurisdiction Financial Institution',
      description:
        'Your bank operates across the US, EU, and Australia. In the Compliance Matrix (Step 2), select "Finance & Banking" as your industry. Identify which compliance frameworks apply. Your TLS server certificates (ECDSA P-256) rotate every 90 days. In the Risk Methodology Explorer (Step 3), apply the DORA/NIS2 tab to a communication channel asset. Is the ECDSA P-256 encryption compliant with "state-of-the-art" requirements? What does the FAIR model say about the ALE for non-migration?',
      badge: 'Compliance',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'Finance & Banking maps to DORA, GDPR, PCI DSS, NIST IR 8547, ISO 27001, and FIPS 140-3. The DORA/NIS2 tab will flag ECDSA P-256 as a potential "Protect" gap — "state-of-the-art" is a living standard that increasingly implies PQC planning. Short-lived TLS certs (under-1y retention) have low HNDL risk individually, but the FAIR ALE for non-migration is dominated by DORA fine risk (up to 1% of annual global turnover), easily outweighing migration costs.',
      config: { step: 1 },
    },
    {
      id: 'root-ca-methodology',
      title: '3. Root CA Migration — Methodology Comparison',
      description:
        "Your organization's offline Root CA (RSA-4096, 25-year lifespan, CNSA 2.0 scope) needs PQC migration. In the Risk Methodology Explorer (Step 3), select the Root CA Signing Key asset and apply all four tabs: NIST RMF, ISO 27005, FAIR, and DORA/NIS2. Compare how each methodology assesses urgency. Which produces the highest urgency score? Then jump to Step 5 (Priority Map) to see the recommended PQC algorithm.",
      badge: 'Methodology',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'NIST RMF categorizes the root CA as FIPS 199 "High" impact — CNSA 2.0 mandates migration by 2030 with ML-DSA-87 or SLH-DSA-256s. ISO 27005 scores it Critical risk (Likelihood 3 × Consequence 5 = 15) — treatment: Mitigate, immediate. FAIR ALE is highest for this asset because root CA compromise enables forging all certificates — catastrophic loss magnitude drives ALE into the tens of millions. DORA/NIS2 Protect pillar fails because RSA-4096 will no longer meet "state-of-the-art." The Priority Map recommends SLH-DSA-256s — stateless hash-based signatures offer the strongest long-term security assurance for key material with indefinite validity periods.',
      config: { step: 2 },
    },
    {
      id: 'build-priority-map',
      title: '4. Build Your Own Priority Map',
      description:
        "Add at least 6 assets to the Asset Inventory Builder covering all four sensitivity tiers (Low, Medium, High, Critical) and at least three different asset types. Complete the Compliance Matrix for your primary industry. Run through the Sensitivity Scoring Engine and adjust the weights to reflect your organization's priorities (e.g., increase the compliance weight if you are heavily regulated). Then review the Priority Map. Identify: (1) the single highest-urgency asset and why, (2) any assets that can safely wait, and (3) which compliance deadline is most constraining for your portfolio.",
      badge: 'Workshop',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        "The highest-urgency asset will typically be a Critical-sensitivity, 25+ year retention asset under CNSA 2.0 or NIS2 scope (composite score ≥ 85). Assets scoring below 33 (Low urgency) are typically short-lived communication channels with no active compliance mandate. For US Government & Defense organizations, CNSA 2.0's 2030 deadline is most constraining; for EU financial institutions, DORA's January 2025 enforcement date drives immediate crypto risk management documentation. Export your Priority Map as Markdown to share with your security team.",
      config: { step: 0 },
    },
  ]

  const handleLoadAndRun = (scenario: Scenario) => {
    onSetWorkshopConfig?.(scenario.config)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these real-world scenarios to apply data classification, compliance mapping,
          risk methodology comparison, and sensitivity scoring. Each exercise pre-configures the
          Workshop to the relevant step — click &quot;Load &amp; Run&quot; to begin.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-foreground">{scenario.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${scenario.badgeColor}`}
                  >
                    {scenario.badge}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-3">{scenario.description}</p>
                <div className="bg-muted/40 rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">What to observe:</strong> {scenario.observe}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => handleLoadAndRun(scenario)}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0 self-start"
              >
                <Play size={14} fill="currentColor" /> Load &amp; Run
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz Link */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary shrink-0" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the PQC quiz to check your understanding of data classification, compliance
                frameworks, and risk management methodologies.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/learn/quiz')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2 shrink-0"
          >
            Take Quiz <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
