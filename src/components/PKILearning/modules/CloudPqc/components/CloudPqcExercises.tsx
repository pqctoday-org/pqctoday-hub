// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import {
  Play,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  ShieldAlert,
  Wrench,
  Code2,
  ClipboardCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface CloudPqcWorkshopConfig {
  step: number
}

interface CloudPqcExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopConfig?: (config: CloudPqcWorkshopConfig) => void
}

interface RoleExercise {
  id: string
  role: string
  roleBadgeColor: string
  title: string
  scenario: string
  decisionPrompt: string
  workshopStep: number
  workshopLabel: string
  icon: React.ReactNode
  checklist: string[]
  evidenceToCollect: string
  limitationNote: string
}

const ROLE_EXERCISES: RoleExercise[] = [
  {
    id: 'architect-estate-split',
    role: 'Security Architect',
    roleBadgeColor: 'bg-primary/15 text-primary border-primary/40',
    title: '1. Separate Cloud Services from Protected Assets & Control Boundaries',
    scenario:
      'A regulated enterprise runs a records archiving service on Amazon S3 (SSE-KMS) fronted by CloudFront and an origin ALB, with 15-year record retention and an external SaaS CRM.',
    decisionPrompt:
      'Which cryptographic surfaces are customer-controlled vs. provider-managed, and why does AES-256 at rest not eliminate HNDL urgency for the archived records?',
    workshopStep: 0,
    workshopLabel: 'Open Step 1: Cloud Estate Mapper',
    icon: <ShieldAlert size={18} className="text-primary" />,
    checklist: [
      'Identify the archiving/storage platform as the business service and the 15-year encrypted records as the protected asset.',
      'Separate client-to-CloudFront TLS from CloudFront-to-ALB origin TLS so both legs are verified for X25519MLKEM768 (0x11EC).',
      'Classify AWS KMS key specs and IAM CreateKey guardrails as customer-configured, while physical HSM validation is provider-managed.',
      'Flag the SaaS CRM as provider-controlled requiring independent endpoint probes and BYOK scope verification.',
    ],
    evidenceToCollect:
      'Architecture surface register mapping each hop to owner, protected asset retention, and verification method.',
    limitationNote:
      'Mapping a sample estate in this Hub teaches classification logic; production accuracy requires reconciling against live cloud asset inventories and IaC state.',
  },
  {
    id: 'ops-regional-cutover',
    role: 'IT Ops / DevOps',
    roleBadgeColor: 'bg-status-warning/15 text-status-warning border-status-warning/40',
    title: '2. Sequence Hybrid Edge & Origin TLS Without Middlebox Outages',
    scenario:
      'Your platform team plans to enable X25519MLKEM768 on public load balancers across commercial and GovCloud regions, plus migrate legacy hsm1.medium CloudHSM clusters.',
    decisionPrompt:
      'How do you prevent middlebox ClientHello truncation, catch edge-vs-origin TLS mismatches, and verify FIPS 140-3 readiness after the September 2026 FIPS 140-2 Historical cutover?',
    workshopStep: 2,
    workshopLabel: 'Open Step 3: Edge TLS & KMS Cutover Lab',
    icon: <Wrench size={18} className="text-status-warning" />,
    checklist: [
      'Run canary multi-segment ClientHello tests (~1,682-byte ClientHello with X25519MLKEM768) through inline WAFs and partner proxies before full cutover.',
      'Verify negotiated NamedGroup 0x11EC independently in both CDN edge logs and origin load-balancer logs.',
      'Check region-specific AWS KMS hybrid PQ TLS documentation (noting China and GovCloud US FIPS endpoint exclusions) against live endpoint probes.',
      'Map legacy FIPS 140-2 clusters to FIPS 140-3 validated hsm2m.medium clusters and record active CMVP certificate numbers.',
    ],
    evidenceToCollect:
      'Canary handshake error-rate diff (<0.5% delta), edge + origin TLS group logs, and CMVP FIPS 140-3 certificate references.',
    limitationNote:
      'Simulated cutover failure modes cannot predict every third-party partner middlebox; run staged synthetic probes from real client networks.',
  },
  {
    id: 'dev-kms-byok-design',
    role: 'Developer',
    roleBadgeColor: 'bg-secondary/20 text-secondary-foreground border-secondary/40',
    title: '3. Design KMS ML-KEM / ML-DSA & BYOK Flows Without False Claims',
    scenario:
      'An application team wants to use AWS KMS ML-KEM keys in multiple regions, enforce hybrid PQ TLS via a KMS key policy, and claim "quantum-safe BYOK" for imported AES keys.',
    decisionPrompt:
      'Which three design assumptions fail under late-2026 AWS KMS behavior, and how does Google Cloud KMS quantum-safe HPKE import differ?',
    workshopStep: 1,
    workshopLabel: 'Open Step 2: Provider Capability Matrix',
    icon: <Code2 size={18} className="text-primary" />,
    checklist: [
      'Correct the TLS enforcement assumption: no AWS KMS key policy condition can require post-quantum TLS — configure the client SDK/TLS stack and verify via CloudTrail tlsDetails.keyExchange.',
      'Account for regional exclusions (ML-KEM unavailable in China, Middle East UAE, and Middle East Bahrain) and handle the 32-byte plaintext shared secret returned by AWS KMS Decapsulate securely in application memory.',
      'Do not claim quantum-safe BYOK on AWS KMS or Azure Key Vault: AWS import wrapping is RSA-only (or SM2 in China) and Azure uses CKM_RSA_AES_KEY_WRAP under an RSA-HSM KEK.',
      'Note that Google Cloud KMS HPKE quantum-safe import (RFC 9180) is in Preview and covers software-protected keys only.',
    ],
    evidenceToCollect:
      'AWS DescribeKey / IAM policy review, CloudTrail tlsDetails.keyExchange sample, and documented BYOK wrapping boundary.',
    limitationNote:
      'Cloud provider APIs evolve rapidly; re-run the provider CLI verification commands in your target region before locking production architecture.',
  },
  {
    id: 'grc-saas-evidence',
    role: 'GRC & Vendor Risk',
    roleBadgeColor: 'bg-status-success/15 text-status-success border-status-success/40',
    title: '4. Scope SaaS & Multi-Account PQC Evidence Without Hiding Unknowns',
    scenario:
      'Three tier-1 SaaS vendors returned incomplete PQC questionnaires (two left BYOK and subprocessor fields blank; one cited a 2023 FIPS 140-2 certificate).',
    decisionPrompt:
      'How should GRC classify those responses for executive reporting under NIST IR 8547 and OMB M-26-15, and what concrete evidence should you request next?',
    workshopStep: 3,
    workshopLabel: 'Open Step 4: SaaS Boundary Checklist',
    icon: <ClipboardCheck size={18} className="text-status-success" />,
    checklist: [
      'Classify every unanswered or "roadmap TBD" response as Unverified / Evidence Gap — never as low exposure.',
      'Reject Historical FIPS 140-2 certificates (post-September 2026) and request active FIPS 140-3 CMVP certificate numbers mapped to production tenants.',
      'Supplement vendor attestations with independent external TLS probes of public SaaS/webhook hostnames for X25519MLKEM768.',
      'Request explicit BYOK coverage boundaries (primary DB vs. backups/search indexes) and subprocessor PQC inheritance terms.',
    ],
    evidenceToCollect:
      'Completed evidence-gap register, external TLS probe outputs, CMVP FIPS 140-3 IDs, and dated vendor remediation milestones.',
    limitationNote:
      'Educational checklists illustrate what evidence to demand; they do not constitute legal advice or formal vendor certification.',
  },
]

export const CloudPqcExercises: React.FC<CloudPqcExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const [openRubrics, setOpenRubrics] = useState<string[]>([])

  const toggleRubric = (id: string) => {
    setOpenRubrics((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleJump = (step: number) => {
    if (onSetWorkshopConfig) {
      onSetWorkshopConfig({ step })
    } else {
      onNavigateToWorkshop()
    }
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 space-y-2">
        <h2 className="text-lg font-bold text-gradient">
          Role-Based Decision Exercises &amp; Production Evidence Rubrics
        </h2>
        <p className="text-sm text-muted-foreground">
          Each scenario pairs a realistic multi-cloud or SaaS decision with a direct jump into the
          matching Workshop step and an expandable{' '}
          <strong>Decision &amp; Production Evidence Checklist</strong>.
        </p>
      </div>

      <div className="space-y-4">
        {ROLE_EXERCISES.map((ex) => {
          const isOpen = openRubrics.includes(ex.id)
          return (
            <article key={ex.id} className="glass-panel p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0 mt-0.5">{ex.icon}</div>
                  <div className="space-y-1 min-w-0">
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border ${ex.roleBadgeColor}`}
                    >
                      {ex.role}
                    </span>
                    <h3 className="text-base font-bold text-foreground">{ex.title}</h3>
                  </div>
                </div>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => handleJump(ex.workshopStep)}
                  aria-label={ex.workshopLabel}
                >
                  <Play size={14} className="mr-1.5" />
                  {ex.workshopLabel}
                </Button>
              </div>

              <div className="space-y-2 text-sm text-foreground/85">
                <p>
                  <span className="font-semibold text-foreground">Scenario: </span>
                  {ex.scenario}
                </p>
                <p>
                  <span className="font-semibold text-foreground">Decision Prompt: </span>
                  {ex.decisionPrompt}
                </p>
              </div>

              <div className="pt-1 border-t border-border/60">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleRubric(ex.id)}
                  aria-expanded={isOpen}
                  className="px-2 text-primary hover:text-primary"
                >
                  <CheckSquare size={15} className="mr-1.5" />
                  Decision &amp; Production Evidence Checklist
                  {isOpen ? (
                    <ChevronUp size={15} className="ml-1.5" />
                  ) : (
                    <ChevronDown size={15} className="ml-1.5" />
                  )}
                </Button>

                {isOpen && (
                  <div className="mt-3 rounded-lg border border-border bg-muted/30 p-4 space-y-3 text-xs">
                    <ul className="space-y-1.5 list-disc pl-4 text-foreground/90">
                      {ex.checklist.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div className="pt-2 border-t border-border/50 space-y-1">
                      <p className="text-foreground">
                        <strong>Production Evidence to Collect:</strong>{' '}
                        <span className="text-muted-foreground">{ex.evidenceToCollect}</span>
                      </p>
                      <p className="text-muted-foreground italic">{ex.limitationNote}</p>
                    </div>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
