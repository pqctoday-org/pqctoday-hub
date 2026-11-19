// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import {
  Play,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Code2,
  ShieldAlert,
  Cpu,
  ClipboardCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ImplSecurityWorkshopConfig {
  step: number
}

interface ImplSecurityExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopConfig?: (config: ImplSecurityWorkshopConfig) => void
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
    id: 'dev-constant-time-audit',
    role: 'Developer',
    roleBadgeColor: 'bg-primary/15 text-primary border-primary/40',
    title: '1. Eliminate Compiler-Introduced Division & Branch Leaks in ML-KEM / ML-DSA',
    scenario:
      'Your C/Rust cryptography team passed all ACVP known-answer tests for ML-KEM-768 and ML-DSA-65 on x86-64, and is now cross-compiling the same library for ARM Cortex-M4 and RISC-V embedded gateways.',
    decisionPrompt:
      'Why does passing ACVP KATs not establish timing safety, and which build-time and runtime checks must gate release across every target ISA?',
    workshopStep: 0,
    workshopLabel: 'Open Step 1: Timing Leak Inspector',
    icon: <Code2 size={18} className="text-primary" />,
    checklist: [
      'Replace secret-dependent division by q = 3329 with constant-time Barrett or Montgomery multiply-shift reductions.',
      'Rewrite ML-DSA norm checks (||z||_∞, ||r0||_∞, ||ct0||_∞) to scan full vectors branchlessly and accumulate a single rejection bit.',
      'Eliminate secret-indexed lookup tables in noise sampling and decoding in favor of arithmetic/bitsliced ops or full-table scans.',
      'Add per-ISA CI disassembly checks banning DIV/SDIV/UDIV in secret-handling symbols alongside dudect and Timecop/ctgrind runs.',
    ],
    evidenceToCollect:
      'Per-ISA disassembly gate report, compiler version/flags manifest, and dudect/Timecop timing test logs tied to the release commit.',
    limitationNote:
      'Reviewing sample C snippets here builds triage skill; production assurance requires testing the exact compiled binary on every shipping CPU architecture.',
  },
  {
    id: 'dev-fo-oracle-review',
    role: 'Developer / Security Engineer',
    roleBadgeColor: 'bg-status-warning/15 text-status-warning border-status-warning/40',
    title: '2. Audit ML-KEM.Decaps & Protocol Wrappers for FO Implicit-Rejection Oracles',
    scenario:
      'A protocol engineer wraps an ML-KEM-768 library inside a custom key-transport service and adds an explicit `ERR_BAD_CIPHERTEXT` log plus an early-exit `memcmp` optimization to save CPU cycles on malformed packets.',
    decisionPrompt:
      'How does this optimization break FIPS 203 IND-CCA2 security, and what must be enforced in both the KEM primitive and the calling API?',
    workshopStep: 1,
    workshopLabel: 'Open Step 2: FO Implicit Rejection Lab',
    icon: <ShieldAlert size={18} className="text-status-warning" />,
    checklist: [
      'Verify K̄ = J(z || c) is computed unconditionally on every ML-KEM.Decaps call, not only on mismatch.',
      'Replace standard memcmp with full-length bitwise XOR/OR comparison and constant-time cmov selection between K′ and K̄.',
      'Remove distinct decapsulation-mismatch error codes or telemetry counters that reveal c != c′ to remote callers.',
      'Confirm immediate zeroization of candidate message m′ and coins r′ before returning the 32-byte shared secret.',
    ],
    evidenceToCollect:
      'ACVP ML-KEM implicit-rejection vector results, valid-vs-1-bit-tampered timing differential traces, and API error-surface review.',
    limitationNote:
      'An interactive trace walkthrough demonstrates the FO mechanism; real-world verification must also inspect downstream AEAD/TLS error handling for side-channel leakage.',
  },
  {
    id: 'researcher-masking-budget',
    role: 'Researcher / Hardware Engineer',
    roleBadgeColor: 'bg-secondary/20 text-secondary-foreground border-secondary/40',
    title: '3. Budget Masking Order, Fresh Randomness & Fault Defenses for Embedded PQC',
    scenario:
      'A smart-card and HSM engineering team must protect ML-KEM-768 decapsulation and ML-DSA-65 signing against DPA/EM attacks and single-pulse voltage glitches within strict SRAM and DRBG budgets.',
    decisionPrompt:
      'Why does masking only the NTT leave the module exposed, where do cycle and randomness costs concentrate, and why is redundant verification still needed alongside masking?',
    workshopStep: 2,
    workshopLabel: 'Open Step 3: Masking & Fault Cost Explorer',
    icon: <Cpu size={18} className="text-primary" />,
    checklist: [
      'Account for non-linear bottlenecks (A2B/B2A conversions, masked rejection sampling, and Keccak/SHAKE Chi layer) rather than extrapolating from linear NTT cost.',
      'Size the approved DRBG / TRNG throughput for fresh randomness, especially if targeting 2nd-order masking where randomness scales quadratically.',
      'Pair masking with redundant verification (verify-after-sign for ML-DSA/SLH-DSA) to block single-fault glitch key recovery.',
      'Evaluate random operation shuffling to harden against single-trace horizontal/template attacks on NTT butterflies and sampling.',
    ],
    evidenceToCollect:
      'Hardware/firmware masking architecture spec, DRBG entropy budget per operation, and physical power/EM + fault-injection pre-evaluation bench results.',
    limitationNote:
      'The Hub cost explorer uses illustrative order-of-magnitude ranges — never treat educational multipliers as vendor benchmarks; measure on target silicon.',
  },
  {
    id: 'cert-tvla-evidence-scope',
    role: 'Certification & Validation Engineer',
    roleBadgeColor: 'bg-status-success/15 text-status-success border-status-success/40',
    title: '4. Scope TVLA, FIPS 140-3 & EUCC AVA_VAN Evidence Without False Confidence',
    scenario:
      'An HSM vendor submits a one-page marketing summary stating "TVLA passed (|t| < 4.5)" and cites a 2023 FIPS 140-2 certificate while claiming EUCC readiness for its new ML-KEM/ML-DSA firmware.',
    decisionPrompt:
      'Which evidence gaps must block procurement or certification sign-off, and what specific artifacts are required under FIPS 140-3 and EUCC CIR (EU) 2024/482?',
    workshopStep: 3,
    workshopLabel: 'Open Step 4: TVLA & Certification Evidence Scope',
    icon: <ClipboardCheck size={18} className="text-status-success" />,
    checklist: [
      'Reject the 2023 FIPS 140-2 certificate for new acquisitions (FIPS 140-2 moved to Historical status in September 2026) and require an active FIPS 140-3 CMVP certificate covering PQC in Approved mode.',
      'Request full TVLA methodology details (trace count, fixed-vs-random vectors, probe points, and follow-up key-recovery analysis) and note that univariate TVLA pass alone does not rule out higher-order or template attacks.',
      'Verify FIPS 140-3 non-invasive attack mitigation scope (ISO/IEC 19790, ISO/IEC 17825, NIST SP 800-140F, FIPS 140-3 IG PQC).',
      'For high-assurance EUCC deployments, verify an active EUCC/CC certificate at AVA_VAN.4 or AVA_VAN.5 bound to the exact shipping firmware and silicon TOE revision.',
    ],
    evidenceToCollect:
      'Active CMVP FIPS 140-3 Security Policy, accredited lab TVLA + attack-potential report, and EUCC Certification Report matching shipping TOE version.',
    limitationNote:
      'Completing an educational evidence checklist in this Hub teaches review discipline; it does not replace accredited CSTL/ITSEF lab evaluation.',
  },
]

export const ImplSecurityExercises: React.FC<ImplSecurityExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  const toggleChecklist = (id: string) => {
    setExpandedIds((prev) =>
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
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Role-Based Decision Exercises:</strong> Practice
        triaging constant-time code defects, FO implicit-rejection oracles, embedded masking
        budgets, and TVLA/certification evidence gaps. Expand each{' '}
        <strong className="text-foreground">Decision &amp; Production Evidence Checklist</strong> to
        see what must be verified with your own engineering and lab tools.
      </div>

      <div className="space-y-4">
        {ROLE_EXERCISES.map((ex) => {
          const isOpen = expandedIds.includes(ex.id)
          return (
            <article key={ex.id} className="glass-panel p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${ex.roleBadgeColor}`}
                    >
                      {ex.role}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    {ex.icon}
                    <span>{ex.title}</span>
                  </h3>
                </div>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => handleJump(ex.workshopStep)}
                  className="shrink-0"
                >
                  <Play size={14} className="mr-1.5" />
                  {ex.workshopLabel}
                </Button>
              </div>

              <div className="space-y-2 text-xs leading-relaxed">
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Scenario:</strong> {ex.scenario}
                </p>
                <p className="text-foreground/90 font-medium">
                  <strong className="text-primary">Decision Prompt:</strong> {ex.decisionPrompt}
                </p>
              </div>

              <div className="pt-2 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleChecklist(ex.id)}
                  aria-expanded={isOpen}
                  className="h-8 px-2 text-xs text-primary hover:text-primary"
                >
                  <CheckSquare size={14} className="mr-1.5" />
                  Decision &amp; Production Evidence Checklist
                  {isOpen ? (
                    <ChevronUp size={14} className="ml-1.5" />
                  ) : (
                    <ChevronDown size={14} className="ml-1.5" />
                  )}
                </Button>

                {isOpen && (
                  <div className="mt-3 rounded-lg border border-border bg-muted/30 p-4 space-y-3 text-xs">
                    <ul className="space-y-1.5 list-disc pl-4 text-foreground/85">
                      {ex.checklist.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div className="pt-2 border-t border-border/50 space-y-1">
                      <p className="text-muted-foreground">
                        <strong className="text-foreground">
                          Production Evidence to Collect:{' '}
                        </strong>
                        {ex.evidenceToCollect}
                      </p>
                      <p className="text-muted-foreground">
                        <strong className="text-foreground">Scope Limitation: </strong>
                        {ex.limitationNote}
                      </p>
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
