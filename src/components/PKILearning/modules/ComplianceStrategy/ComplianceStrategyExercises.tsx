// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Button } from '@/components/ui/button'

interface ComplianceStrategyExercisesProps {
  onNavigateToWorkshop: (step?: number) => void
}

const EXERCISES = [
  {
    id: 'ex-1',
    title: 'Scenario: Multi-Jurisdiction Financial Institution',
    step: 0,
    cta: 'Open Step 1: Jurisdiction Mapper',
    prompt:
      'Your commercial bank operates in the US, EU, and Singapore. First verify regulatory scope: NSA CNSA 2.0 FAQ (version 2.2) sets national security system dates of 1 January 2027 for new acquisitions, 31 December 2030 for phasing out equipment that cannot support CNSA 2.0, and 31 December 2031 for mandated use — binding U.S. National Security Systems, not commercial banks unless operating under an NSS contract. In the EU, DORA and NIS2 impose cyber risk-management duties while the EU PQC Roadmap v1.1 coordinates Member State timelines and ETSI recommends hybrid transitions; in Singapore, MAS monitors NIST standards. Map the overlapping requirements, confirm which obligations actually bind the bank, and identify cross-jurisdiction conflicts.',
    workshopHint:
      'Use the Jurisdiction Mapper (Step 1) to select US, EU, and Singapore (leave the NSS checkbox unticked for a commercial bank). Compare framework scope and gaps side-by-side in Step 4.',
    evidenceCheck:
      'In production, document legal applicability per entity and system before setting dates. Catalogue selections in the Hub teach scope reasoning; they do not constitute a legal determination.',
  },
  {
    id: 'ex-2',
    title: 'Scenario: Government Contractor Audit',
    step: 1,
    cta: 'Open Step 2: Audit Planning Topics',
    prompt:
      'Your company supplies software to US federal customers. Determine whether the contract covers National Security Systems (CNSA 2.0 FAQ v2.2) or federal civilian agencies (EO 14412 & OMB M-26-15, plus the directed FAR contractor rule targeting 31 December 2030 NIST FIPS compliance). With an audit scheduled for Q3 2027, build an audit-planning topic list covering cryptographic inventory, policy documentation, technical controls, and vendor validation.',
    workshopHint:
      'Use Audit Planning Topics (Step 2) to review the 6 control domains, then inspect Step 4 with US selected to examine common compliance gaps.',
    evidenceCheck:
      'For federal procurement claims, verify active CMVP FIPS 140-3 module certificates and Security Policies rather than vendor marketing claims or ACVP-only algorithm listings. Selecting topics in the Hub prepares an audit plan; it does not establish audit readiness.',
  },
  {
    id: 'ex-3',
    title: 'Scenario: Healthcare PQC Compliance Timeline',
    step: 2,
    cta: 'Open Step 3: Compliance Timeline',
    prompt:
      'A hospital network operates a records archiving and retrieval service (the business service) that protects long-lived patient records (the protected data asset, 30-year retention) under HIPAA while tracking NIST IR 8547 (final, October 2026 — deprecating classical public-key algorithms after 2030 and disallowing them after 2035). Build a compliance timeline covering assessment, hybrid deployment, and full PQC migration phases, and identify where the HNDL risk window overlaps with compliance deadlines.',
    workshopHint:
      'Use the Compliance Timeline Builder (Step 3) to overlay NIST IR 8547 and HIPAA milestones with your migration phases. Factor in the 2030 deprecation and 2035 disallowance dates against 30-year record confidentiality.',
    evidenceCheck:
      'In production, back timeline milestones with a verified CBOM for the archiving service, vendor upgrade commitments, and observed handshake/storage-encryption test results.',
  },
  {
    id: 'ex-4',
    title: 'Scenario: Cross-Border Data Center Operator',
    step: 3,
    cta: 'Open Step 4: Regulatory Gap Case',
    prompt:
      "You operate data centers in Germany, France, and the UK. GDPR and NIS2 cyber risk-management obligations apply alongside EU PQC Roadmap v1.1 milestones, BSI TR-02102, and ANSSI hybrid PQC guidance. Germany's BSI recommends PQC in hybrid form, except that hash-based signatures may in principle be used alone, provided their implementation security is carefully considered (TR-02102-1); France's ANSSI recommends hybrid generally and makes it mandatory inside its regulated perimeter. Identify where requirements align and where they conflict, and define a unified migration strategy.",
    workshopHint:
      'Use the Regulatory Gap Case (Step 4) with Germany, France, and UK selected. Note that both authorities point to hybrid key establishment (BSI by recommendation, ANSSI by recommendation and, in its regulated perimeter, by obligation), so one hybrid design can satisfy both.',
    evidenceCheck:
      'Verify in production that hybrid negotiation is actually enforced on live TLS/VPN endpoints (via packet capture or active scanner) and confirm with national counsel whether each facility falls inside France’s regulated perimeter.',
  },
]

export const ComplianceStrategyExercises: React.FC<ComplianceStrategyExercisesProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="w-full space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Compliance Strategy Exercises</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Apply what you learned in the workshop to these real-world compliance scenarios. Use the
          Workshop tab tools to model your answers.
        </p>
        <div className="space-y-4">
          {EXERCISES.map((exercise, idx) => (
            <div key={exercise.id} className="glass-panel p-5 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                <span className="text-primary mr-2">{idx + 1}.</span>
                {exercise.title}
              </h3>
              <p className="text-sm text-foreground/80">{exercise.prompt}</p>
              <div className="bg-muted/50 rounded-lg p-3 border border-border space-y-1.5">
                <p className="text-xs text-muted-foreground italic">{exercise.workshopHint}</p>
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">GRC decision &amp; evidence check:</strong>{' '}
                  {exercise.evidenceCheck}
                </p>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateToWorkshop(exercise.step)}
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  {exercise.cta} &rarr;
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="gradient" onClick={() => onNavigateToWorkshop()} className="px-6 py-2">
            Open Workshop &rarr;
          </Button>
        </div>
      </div>
    </div>
  )
}
