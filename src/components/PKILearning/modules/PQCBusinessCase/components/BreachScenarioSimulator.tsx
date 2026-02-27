import React, { useState, useMemo } from 'react'
import { AlertTriangle, Info, TrendingUp, Shield } from 'lucide-react'
import { BreachCostModel } from '@/components/PKILearning/common/executive'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'

const AVAILABLE_INDUSTRIES = [
  'Finance & Banking',
  'Healthcare',
  'Government & Defense',
  'Technology',
  'Telecommunications',
  'Energy & Utilities',
  'Retail & E-Commerce',
  'Aerospace',
  'Automotive',
  'Other',
]

export const BreachScenarioSimulator: React.FC = () => {
  const data = useExecutiveModuleData()
  const [selectedIndustry, setSelectedIndustry] = useState(data.industry || 'Other')
  const [breachCosts, setBreachCosts] = useState<{
    classicalCost: number
    quantumCost: number
    delta: number
  } | null>(null)

  const findings = useMemo(() => {
    if (!breachCosts) return []

    const items: string[] = []

    const multiplier = breachCosts.quantumCost / Math.max(breachCosts.classicalCost, 1)
    items.push(
      `Quantum-enabled breaches cost ${multiplier.toFixed(1)}x more than classical breaches in the ${selectedIndustry} sector.`
    )

    if (breachCosts.delta > 5_000_000) {
      items.push(
        `The additional quantum risk exposure exceeds $5M, making proactive PQC migration a high-priority investment.`
      )
    } else if (breachCosts.delta > 1_000_000) {
      items.push(
        `The additional quantum risk of $${(breachCosts.delta / 1_000_000).toFixed(1)}M provides strong justification for migration investment.`
      )
    }

    if (data.criticalThreatCount > 0) {
      items.push(
        `${data.criticalThreatCount} critical/high-severity quantum threats currently target this industry.`
      )
    }

    if (data.migrationDeadlineYear) {
      const yearsRemaining = data.migrationDeadlineYear - new Date().getFullYear()
      if (yearsRemaining <= 3) {
        items.push(
          `Regulatory deadline in ${data.migrationDeadlineYear} (${yearsRemaining} years) adds urgency to breach prevention through PQC adoption.`
        )
      }
    }

    return items
  }, [breachCosts, selectedIndustry, data.criticalThreatCount, data.migrationDeadlineYear])

  return (
    <div className="space-y-8">
      {/* Industry selector */}
      <div className="glass-panel p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label
            htmlFor="breach-industry-select"
            className="text-sm font-medium text-foreground shrink-0"
          >
            Industry Sector:
          </label>
          <select
            id="breach-industry-select"
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {AVAILABLE_INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
          {data.isAssessmentComplete && data.industry && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info size={12} />
              Pre-selected from your assessment
            </span>
          )}
        </div>
      </div>

      {/* Breach Cost Model */}
      <BreachCostModel industry={selectedIndustry} onCostCalculated={setBreachCosts} />

      {/* Summary Panel */}
      {breachCosts && (
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-status-warning" />
            <h3 className="text-lg font-bold text-foreground">Key Findings</h3>
          </div>
          <div className="space-y-2">
            {findings.map((finding, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-primary font-bold text-sm shrink-0 mt-0.5">&bull;</span>
                <p className="text-sm text-foreground/80">{finding}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What This Means */}
      {breachCosts && (
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            <h3 className="text-lg font-bold text-foreground">
              What This Means for Your Business Case
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-status-error" />
                <p className="text-sm font-medium text-foreground">Cost of Inaction</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Every year without PQC migration increases your exposure to quantum-enabled attacks.
                HNDL (Harvest Now, Decrypt Later) means adversaries are already collecting encrypted
                data that will become readable once quantum computers mature. The longer you wait,
                the more historical data is at risk.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-status-success" />
                <p className="text-sm font-medium text-foreground">Value of Early Action</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Organizations that adopt PQC early benefit from reduced breach risk, compliance
                readiness, and crypto agility. The migration cost is a one-time investment; the
                breach cost savings compound annually. Early movers also gain competitive trust
                signals and avoid the rush when quantum deadlines approach.
              </p>
            </div>
          </div>
          {data.frameworksByIndustry.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Compliance context:</strong>{' '}
                {data.frameworksByIndustry.length} compliance framework
                {data.frameworksByIndustry.length !== 1 ? 's' : ''} apply to your industry.
                Non-compliance penalties amplify breach costs through regulatory fines, audit
                requirements, and potential loss of operating licenses.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
