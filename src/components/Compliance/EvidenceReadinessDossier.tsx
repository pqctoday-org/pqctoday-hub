// SPDX-License-Identifier: GPL-3.0-only
/**
 * Audit / evidence-readiness affordance (PER-PAGE-CHANGES.md Compliance #5,
 * framework GRC §, p.183–184).
 *
 * Turns each regulation into an auditable-artifact dossier: the specific
 * evidence items an auditor will ask for to prove the obligation is met. Each
 * regulation is a keyboard-accessible disclosure (shared Button kit) that opens
 * its evidence checklist.
 *
 * Self-contained authoritative reference (GRC evidence map lives here under
 * Compliance ownership). Additive section in the Compliance Framework Explorer;
 * collapsed by default, so the page is unchanged until a user opens a dossier.
 */
import React, { useState } from 'react'
import { ChevronDown, FolderCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EvidenceDossier {
  id: string
  /** Regulation / clause the dossier proves. */
  regulation: string
  /** What an auditor is checking for. */
  auditFocus: string
  /** The concrete artifacts that constitute audit-ready evidence. */
  evidence: string[]
}

/** Authoritative GRC evidence map — regulation → auditable artifacts. */
const DOSSIERS: ReadonlyArray<EvidenceDossier> = [
  {
    id: 'pci-dss-1233',
    regulation: 'PCI DSS 4.0 — 12.3.3',
    auditFocus: 'Documented, current inventory of cipher suites & protocols.',
    evidence: [
      'CycloneDX CBOM export with timestamp',
      'Scan/inventory tool report covering in-scope systems',
      'Change log showing inventory is reviewed at least annually',
    ],
  },
  {
    id: 'nis2-art21',
    regulation: 'NIS2 — Art. 21',
    auditFocus: 'Risk-based crypto exposure assessment & treatment.',
    evidence: [
      'Quantum Risk Assessment (QRA) document',
      'Risk register entries with owners & treatment status',
      'Board / SteerCo minutes accepting the residual risk',
    ],
  },
  {
    id: 'cnsa2-nsm8',
    regulation: 'CNSA 2.0 (NSM-8)',
    auditFocus: 'Multi-year transition plan for NSS to PQC.',
    evidence: [
      'Signed multi-year migration roadmap with gate dates',
      'Per-system migration status tracker',
      'Evidence pilots used CNSA-2.0 algorithms (ML-KEM-1024 / ML-DSA-87)',
    ],
  },
  {
    id: 'dora-ict',
    regulation: 'EU DORA — ICT risk framework',
    auditFocus: 'Board-approved governance & resilience testing.',
    evidence: [
      'Program Charter with executive sponsor sign-off',
      'Governance structure (SteerCo / QRPM cadence)',
      'Tabletop / resilience-test records referencing PQC scenarios',
    ],
  },
  {
    id: 'fips-140-3',
    regulation: 'FIPS 140-3 (validated modules)',
    auditFocus: 'Use of validated modules; performance fitness.',
    evidence: [
      'CMVP certificate numbers for deployed modules',
      'PKI-HSM modernisation plan with dual-stack CA schedule',
      'Performance-test results for PQC handshakes under load',
    ],
  },
  {
    id: 'iso27001-supply',
    regulation: 'ISO 27001 A.5.19 — supplier security',
    auditFocus: 'Continuous assurance that vendors meet PQC requirements.',
    evidence: [
      'Vendor PQC scorecards (current cycle)',
      'Contract clauses mandating PQC roadmaps',
      'Supply-chain matrix flagging unremediated dependencies',
    ],
  },
]

export const EvidenceReadinessDossier: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <section
      id="evidence-readiness"
      className="glass-panel p-5 border border-border rounded-lg scroll-mt-24"
      aria-labelledby="evidence-readiness-heading"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-accent/10">
          <FolderCheck size={20} className="text-accent" />
        </div>
        <div>
          <h2 id="evidence-readiness-heading" className="text-base font-bold text-foreground">
            Audit & evidence readiness
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            For each regulation, the auditable-artifact dossier — the exact evidence an auditor will
            ask for. Open one to see its checklist.
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {DOSSIERS.map((dossier) => {
          const open = openId === dossier.id
          const panelId = `evidence-panel-${dossier.id}`
          return (
            <li key={dossier.id} className="rounded-lg border border-border bg-card">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpenId(open ? null : dossier.id)}
                aria-expanded={open}
                aria-controls={panelId}
                className="w-full justify-between text-left h-auto px-3 py-2"
              >
                <span className="min-w-0">
                  <span className="block font-medium text-sm text-foreground truncate">
                    {dossier.regulation}
                  </span>
                  <span className="block text-[11px] text-muted-foreground truncate">
                    {dossier.auditFocus}
                  </span>
                </span>
                <ChevronDown
                  size={16}
                  className={`text-muted-foreground transition-transform shrink-0 ${
                    open ? '' : '-rotate-90'
                  }`}
                  aria-hidden="true"
                />
              </Button>
              {open && (
                <div id={panelId} className="px-3 pb-3 pt-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Audit-ready evidence
                  </div>
                  <ul className="space-y-1">
                    {dossier.evidence.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-foreground/80">
                        <FolderCheck
                          size={12}
                          className="text-accent mt-0.5 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
