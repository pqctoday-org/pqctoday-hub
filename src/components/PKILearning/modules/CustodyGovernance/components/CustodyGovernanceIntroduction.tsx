// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import {
  ShieldCheck,
  Scale,
  FileCheck2,
  ClipboardList,
  ArrowRight,
  AlertTriangle,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { ClaimLine, AnalysisLine, ReadingNote } from './ClaimLine'
import {
  ASSURANCE_REGIMES,
  CONTROL_ROWS,
  EVALUATION_QUESTIONS,
  INSURER_AUDITOR_MATRIX,
  JURISDICTION_PROFILES,
  US_FEDERAL_CONTEXT_BAND,
} from '../data/custodyGovernanceData'

interface IntroductionProps {
  onNavigateToWorkshop: (stepIndex?: number) => void
}

export const CustodyGovernanceIntroduction: React.FC<IntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  useSectionAnchors()
  return (
    <div className="space-y-8 w-full">
      {/* Framing Banner */}
      <ReadingNote title="Educational scope — not legal, regulatory, or insurance advice">
        <p>
          This module teaches how to evaluate a digital-asset custody architecture, read primary
          regulatory texts with their applicability gates, and interpret custody insurance, audit
          reports, and proof-of-reserves statements. Every regulatory, insurance, and audit cell
          below either cites an admitted Library document with its edition/as-of date or explicitly
          states <strong>&ldquo;not stated&rdquo;</strong>. Completing this module does not certify
          a deployed system or constitute legal advice.
        </p>
        <p className="text-xs">
          <strong>Related Hub resources:</strong> See the{' '}
          <Link to="/compliance" className="text-primary hover:underline">
            Compliance
          </Link>{' '}
          page and{' '}
          <Link to="/learn/compliance-strategy" className="text-primary hover:underline">
            Compliance Strategy
          </Link>{' '}
          for general frameworks;{' '}
          <Link to="/learn/pqc-governance" className="text-primary hover:underline">
            PQC Governance
          </Link>{' '}
          and{' '}
          <Link to="/learn/exec-quantum-impact" className="text-primary hover:underline">
            Executive Quantum Impact
          </Link>{' '}
          for general SOC 2 and insurance context; and{' '}
          <Link to="/learn/digital-assets" className="text-primary hover:underline">
            Digital Assets (LM-045)
          </Link>{' '}
          for foundational blockchain curves and HSM certification quotes (linked, not repeated).
        </p>
      </ReadingNote>

      {/* Section 6: Six Custody Evaluation Questions */}
      <section
        id="evaluation-questions"
        data-learn-section="evaluation-questions"
        className="glass-panel p-6 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <ShieldCheck size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              6. Six Questions to Test a Custody Design or Vendor Claim
            </h2>
            <p className="text-sm text-muted-foreground">
              Use these six evaluation patterns to test a vendor’s &ldquo;policy enforced in
              hardware&rdquo; claim. Each pattern states a strong answer, acceptable alternatives,
              residual risks, and the Rule G1 authority check — never a one-size-fits-all mandate.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {EVALUATION_QUESTIONS.map((q) => (
            <div
              key={q.id}
              className="p-4 rounded-lg bg-muted/40 border border-border flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30">
                    {q.number}
                  </span>
                  <h3 className="font-semibold text-foreground text-base">{q.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground italic">{q.question}</p>
                <div className="space-y-1.5 text-xs">
                  <p className="text-foreground">
                    <strong className="text-status-success">Strong pattern:</strong>{' '}
                    {q.strongPattern}
                  </p>
                  <p className="text-foreground/90">
                    <strong className="text-primary">Acceptable alternatives:</strong>{' '}
                    {q.acceptableAlternatives}
                  </p>
                  <p className="text-foreground/90">
                    <strong className="text-status-warning">Residual risk:</strong> {q.residualRisk}
                  </p>
                  <p className="text-foreground bg-status-info/10 border border-status-info/30 rounded p-2">
                    <strong className="text-status-info">Rule G1 check:</strong> {q.g1Check}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-border/60 space-y-2">
                <p className="text-[11px] text-muted-foreground">Cross-reference: {q.crossRef}</p>
                {q.sourceClaimId ? <ClaimLine id={q.sourceClaimId} chip={q.number} /> : null}
                <AnalysisLine id={q.analysisClaimId} title={`${q.number} pattern`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 6b: Regulatory Requirements & Control Map */}
      <section
        id="regulatory-requirements"
        data-learn-section="regulatory-requirements"
        className="glass-panel p-6 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Scale size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              6b. Regulatory Requirements &amp; Jurisdiction Control Map
            </h2>
            <p className="text-sm text-muted-foreground">
              What custody regulations and standards actually state per jurisdiction — separating
              binding statutes (&ldquo;shall&rdquo;) from supervisory guidance
              (&ldquo;should&rdquo;), international policy, voluntary industry standards, and US
              accounting/permissibility context.
            </p>
          </div>
        </div>

        {/* Core regulatory source cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ClaimLine id="DA-18.1" chip="EU · MiCA" />
          <ClaimLine id="DA-18.2a" chip="EU · DORA" />
          <ClaimLine id="DA-18.2b" chip="EU · DORA RTS" />
          <ClaimLine id="DA-18.8a" chip="EU · MiCA RTS 2025/305" />
          <ClaimLine id="DA-18.8b" chip="EU · ESMA Report" />
          <ClaimLine id="DA-18.8c" chip="EU · EBA Guidelines" />
          <ClaimLine id="DA-18.3" chip="HK · SFC VATP" />
          <ClaimLine id="DA-18.7d" chip="HK · SFC 25EC44" />
          <ClaimLine id="DA-18.4a" chip="Dubai · VARA Custody" />
          <ClaimLine id="DA-18.4b" chip="Dubai · VARA Tech" />
          <ClaimLine id="DA-18.5" chip="NY · 23 NYCRR 500" />
          <ClaimLine id="DA-18.7b" chip="NY · 23 NYCRR 200.9" />
          <ClaimLine id="DA-18.7" chip="NY · Sept 2025 Guidance" />
          <ClaimLine id="DA-18.17" chip="SG · PSR 2019 (Binding)" />
          <ClaimLine id="DA-18.7c" chip="SG · MAS PS-G03" />
          <ClaimLine id="DA-18.6" chip="SG · MAS TRM" />
          <ClaimLine id="DA-18.10a" chip="JP · Payment Services Act" />
          <ClaimLine id="DA-18.10b" chip="JP · Cabinet Office Order" />
          <ClaimLine id="DA-18.11a" chip="CH · DEBA Art. 242a" />
          <ClaimLine id="DA-18.11b" chip="CH · Banking Act" />
          <ClaimLine id="DA-18.11c" chip="CH · FINMA 08/2023 (Staking)" />
          <ClaimLine id="DA-18.12" chip="International · IOSCO" />
          <ClaimLine id="DA-18.13" chip="Industry · CCSS v9.0" />
        </div>

        {/* Instrument-type gate: US Federal Context Band */}
        <div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/30 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-status-warning" aria-hidden="true" />
            <h3 className="font-semibold text-foreground text-sm">
              Instrument-Type Gate: US Federal Accounting &amp; Permissibility Context Band
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            SEC Staff Accounting Bulletins (SAB 121 / SAB 122) and OCC Interpretive Letters (1170 /
            1184) are <strong>excluded from W11’s key-management control cells</strong> because they
            address financial-statement accounting or national-bank legal authority — not HSM, MPC,
            quorum, or key-lifecycle rules.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {US_FEDERAL_CONTEXT_BAND.map((item) => (
              <ClaimLine
                key={item.id}
                id={item.claimId}
                chip={`Context · ${item.instrumentType}`}
              />
            ))}
          </div>
        </div>

        {/* Algorithm-neutral vs architecture-neutral negative verdict + PQ link */}
        <AnalysisLine
          id="DA-18.14"
          title="Algorithm-neutral vs architecture-neutral across held texts"
        />

        <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-3">
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
            <BookOpen size={15} className="text-primary" aria-hidden="true" />
            Quantum-Specific Supervisory Roadmaps (Optional Further Reading — Module B §8c)
          </h3>
          <p className="text-xs text-muted-foreground">
            General custody rulebooks rarely specify post-quantum algorithms today. Quantum-specific
            supervisory roadmaps — NIST IR 8547, BIS Paper 158, the MAS Quantum Advisory, and the
            HKMA Fintech Promotion Blueprint — are taught in Module B §8c (optional further reading;
            nothing in Module C depends on Module B).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <ClaimLine id="DA-18.14-pq-nist" chip="Optional · Module B §8c" />
            <ClaimLine id="DA-18.14-pq-bis" chip="Optional · Module B §8c" />
            <ClaimLine id="DA-18.14-pq-mas" chip="Optional · Module B §8c" />
            <ClaimLine id="DA-18.14-pq-hkma" chip="Optional · Module B §8c" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="ghost"
            onClick={() => onNavigateToWorkshop(0)}
            className="btn btn-primary flex items-center gap-2"
          >
            Open W11 Regulation &amp; Assurance Control Mapper{' '}
            <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </section>

      {/* Section 6c: Insurance, Audit & Proof of Reserves */}
      <section
        id="insurance-and-audit"
        data-learn-section="insurance-and-audit"
        className="glass-panel p-6 space-y-5"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <FileCheck2 size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              6c. Insurance, Audit &amp; Proof of Reserves: What They Do and Do Not Prove
            </h2>
            <p className="text-sm text-muted-foreground">
              Separating statutory insurance hooks from broker-reported market practice, comparing
              SOC 1/ISAE 3402, SOC 2, ISAE 3000 (Revised), and CCSS audits, and explaining why
              Proof-of-Reserves snapshots are not financial audits.
            </p>
          </div>
        </div>

        {/* Insurance subsection */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground text-base">
            1. Custody Insurance: Statutory Hooks vs Broker-Reported Market Practice
          </h3>
          <p className="text-sm text-muted-foreground">
            <strong>Core teaching point:</strong> Insurance caps or transfers financial loss after a
            compromise — it does not reduce the cryptographic signing attack surface. No claim is
            made here about &ldquo;typical&rdquo; dollar cover limits (no primary source establishes
            a universal market limit).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ClaimLine id="DA-19.1" chip="EU · MiCA Arts. 75(8) & 67" />
            <ClaimLine id="DA-19.2" chip="HK · SFC §§10.22–10.23" />
            <ClaimLine id="DA-19.3" chip="Dubai · VARA Company VI.D" />
            <ClaimLine id="DA-19.4a" chip="Market Practice · Aon 2025" />
            <ClaimLine id="DA-19.4b" chip="Market Practice · WTW 2023" />
          </div>
        </div>

        {/* Audit & Assurance subsection */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground text-base">
            2. Assurance Regimes, DORA TLPT Scoping &amp; Proof of Reserves
          </h3>
          <p className="text-sm text-muted-foreground">
            Key-ceremony procedures and the evidence they generate are owned by{' '}
            <strong>Module A2 §5g</strong>; this section focuses strictly on what auditors and
            insurers request or conclude from that evidence. For long-term cryptographic evidence
            durability under quantum timelines, see Module B (optional further reading).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ClaimLine id="DA-19.5a" chip="Assurance · AICPA SOC 1" />
            <ClaimLine id="DA-19.5b" chip="Assurance · IAASB ISAE 3402" />
            <ClaimLine id="DA-19.5c" chip="Assurance · AICPA SOC 2" />
            <ClaimLine id="DA-18.16" chip="Assurance · ISAE 3000 (Rev.)" />
            <ClaimLine id="DA-19.8" chip="EU · DORA TLPT RTS 2025/1190" />
            <ClaimLine id="DA-19.6" chip="PoR · PCAOB 2023 Advisory" />
            <ClaimLine id="DA-19.6b" chip="PoR · Provisions (CCS 2015)" />
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/70 text-foreground border-b border-border">
                <tr>
                  <th className="p-3 font-semibold">Regime / Artifact</th>
                  <th className="p-3 font-semibold">What It Covers</th>
                  <th className="p-3 font-semibold">What It Does Not Prove</th>
                  <th className="p-3 font-semibold">Scope Question to Ask</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ASSURANCE_REGIMES.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="p-3 font-semibold text-foreground">{row.regime}</td>
                    <td className="p-3 text-muted-foreground">{row.whatItCovers}</td>
                    <td className="p-3 text-muted-foreground">{row.whatItDoesNotProve}</td>
                    <td className="p-3 text-foreground">{row.scopeQuestionToAsk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AnalysisLine
            id="DA-19.11"
            title="General limit: clean assurance reports do not prevent custody compromise"
          />
        </div>
      </section>

      {/* Section 9C: Takeaways Matrix */}
      <section id="takeaways" data-learn-section="takeaways" className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <ClipboardList size={20} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              9C. Takeaways: Control × Regulatory Anchors × Market-Practice Assurance
            </h2>
            <p className="text-sm text-muted-foreground">
              Compact reference mapping each custody control across representative regulatory
              anchors (EU MiCA/DORA &amp; HK SFC shown; compare all 8 profiles side by side in W11),
              insurer questions (market practice), auditor tests (market practice), and typical
              evidence artifacts.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/70 text-foreground border-b border-border">
              <tr>
                <th className="p-2.5 font-semibold">Control (Module Link)</th>
                <th className="p-2.5 font-semibold">EU (MiCA + DORA)</th>
                <th className="p-2.5 font-semibold">HK (SFC)</th>
                <th className="p-2.5 font-semibold">Insurer Asks (Market Practice)</th>
                <th className="p-2.5 font-semibold">Auditor Tests (Market Practice)</th>
                <th className="p-2.5 font-semibold">Example Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {CONTROL_ROWS.map((ctrl) => {
                const euCell = JURISDICTION_PROFILES[0].cells[ctrl.id]
                const hkCell = JURISDICTION_PROFILES[1].cells[ctrl.id]
                const mp = INSURER_AUDITOR_MATRIX[ctrl.id]
                return (
                  <tr key={ctrl.id} className="align-top">
                    <td className="p-2.5 font-medium text-foreground">
                      <div>{ctrl.label}</div>
                      <div className="text-[11px] text-muted-foreground">{ctrl.moduleLink}</div>
                    </td>
                    <td className="p-2.5 text-muted-foreground">
                      {euCell.notStated ? (
                        <span className="italic">Not stated</span>
                      ) : (
                        <>
                          <span className="font-medium text-foreground">{euCell.citation}:</span>{' '}
                          {euCell.text}
                        </>
                      )}
                    </td>
                    <td className="p-2.5 text-muted-foreground">
                      {hkCell.notStated ? (
                        <span className="italic">Not stated</span>
                      ) : (
                        <>
                          <span className="font-medium text-foreground">{hkCell.citation}:</span>{' '}
                          {hkCell.text}
                        </>
                      )}
                    </td>
                    <td className="p-2.5 text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {mp.insurerAsks.sourceLabel}:
                      </span>{' '}
                      {mp.insurerAsks.text}
                    </td>
                    <td className="p-2.5 text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {mp.auditorTests.sourceLabel}:
                      </span>{' '}
                      {mp.auditorTests.text}
                    </td>
                    <td className="p-2.5 text-muted-foreground">{mp.evidenceExample}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
