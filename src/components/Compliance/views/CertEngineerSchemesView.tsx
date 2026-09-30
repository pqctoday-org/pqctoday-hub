// SPDX-License-Identifier: GPL-3.0-only
/**
 * CertEngineerSchemesView — the For You body for the cert-engineer persona on
 * /compliance (added 2026-09-29 with the persona). The reader produces or
 * judges certificates, so the view leads with the records and the schemes
 * rather than with obligations:
 *
 *   - Module certification landscape: the existing records summary
 *     (ModuleCertificationStatus), with a closing note for this reader.
 *   - Certification schemes: every certification-body framework, the ones
 *     that expect post-quantum cryptography first — derived from the live
 *     framework set, never a typed list.
 *   - Test before you submit: the ACVP suite, the Validation tab and the
 *     Product Records filtered by record type.
 *
 * Stage language follows the 2026-09-26 rule: a CAVP algorithm validation is
 * the prerequisite for a FIPS 140-3 certificate, never the certificate.
 */
import { useMemo, type FC } from 'react'
import { Link } from 'react-router'
import { ArrowRight, BadgeCheck, FlaskConical, Landmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useComplianceRefresh } from '../services'
import { ModuleCertificationStatus } from './parts/ModuleCertificationStatus'
import { complianceFrameworks, type ComplianceFramework } from '../../../data/complianceData'
import type { UserProfile } from '../../../utils/applicabilityEngine'
import type { LibraryItem } from '../../../data/libraryData'
import type { ThreatData } from '../../../data/threatsData'
import type { TimelineEvent } from '../../../types/timeline'

// Same shared callback shape every For You view receives from ComplianceView.
interface CertEngineerSchemesViewProps {
  profileOverride?: Partial<UserProfile>
  onSelectLibrary?: (item: LibraryItem) => void
  onSelectThreat?: (item: ThreatData) => void
  onSelectTimeline?: (item: TimelineEvent) => void
  onSelectFramework?: (item: ComplianceFramework) => void
}

const PQC_EXPECTATION: Record<string, string> = {
  yes: 'Requires PQC',
  expected: 'PQC expected',
  partial: 'Partly PQC',
  guidance: 'PQC guidance',
}

const TEST_LINKS = [
  {
    to: '/playground/hsm?tab=build&dtab=acvp',
    label: 'Run the ACVP vectors',
    desc: 'Selected NIST ACVP-Server reference samples and KATs, each result tagged with its evidence class',
  },
  {
    to: '/algorithms?tab=validation',
    label: 'Validation tab',
    desc: 'Known-answer tests and implementation-attack notes per algorithm family',
  },
  {
    to: '/compliance?tab=records&rtab=fips',
    label: 'FIPS 140-3 records',
    desc: 'Module certificates, with the algorithms each lists as approved',
  },
  {
    to: '/compliance?tab=records&rtab=acvp',
    label: 'CAVP records',
    desc: 'Algorithm validations — the prerequisite stage, not a module certificate',
  },
  {
    to: '/compliance?tab=records&rtab=cc',
    label: 'Common Criteria records',
    desc: 'Certified products and the algorithms named in their Security Targets',
  },
] as const

function CertRecordsSummary() {
  const { data } = useComplianceRefresh()
  return (
    <ModuleCertificationStatus
      records={data ?? []}
      closingNote={
        <>
          — a CAVP validation counts here as an algorithm validation, never as a module certificate.
          Open the Records tab for a specific module and the algorithms its certificate lists as
          approved.
        </>
      }
    />
  )
}

export const CertEngineerSchemesView: FC<CertEngineerSchemesViewProps> = ({
  onSelectFramework,
}) => {
  const { expecting, others } = useMemo(() => {
    const schemes = complianceFrameworks.filter((fw) => fw.bodyType === 'certification_body')
    const expectsPqc = (fw: ComplianceFramework) =>
      Boolean(fw.pqcRequirement && fw.pqcRequirement in PQC_EXPECTATION)
    return {
      expecting: schemes.filter(expectsPqc),
      others: schemes.filter((fw) => !expectsPqc(fw)),
    }
  }, [])

  return (
    <div className="space-y-4">
      <CertRecordsSummary />

      <section
        data-section-id="cert-engineer-schemes"
        className="glass-panel p-4 space-y-3 scroll-mt-20"
      >
        <header className="flex items-center gap-2 flex-wrap">
          <Landmark size={16} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">Certification schemes</h3>
          <span className="text-xs text-muted-foreground">
            Schemes that already expect post-quantum cryptography, first
          </span>
        </header>
        <ul className="space-y-2">
          {expecting.map((fw) => (
            <li
              key={fw.id}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border bg-card/30 p-3"
            >
              <Button
                variant="ghost"
                type="button"
                onClick={() => onSelectFramework?.(fw)}
                className="h-auto px-0 py-0 text-sm font-semibold text-foreground hover:text-primary"
              >
                {fw.label}
              </Button>
              <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-primary">
                  {PQC_EXPECTATION[fw.pqcRequirement ?? '']}
                </span>
                {fw.deadline || 'no date recorded'}
              </span>
            </li>
          ))}
        </ul>
        {others.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {others.length} more certification schemes record no PQC requirement yet.{' '}
            <Link to="/compliance?tab=compliance" className="text-primary hover:underline">
              See them in the Compliance Landscape
            </Link>
          </p>
        )}
      </section>

      <section
        data-section-id="cert-engineer-test-links"
        className="glass-panel p-4 space-y-3 scroll-mt-20"
      >
        <header className="flex items-center gap-2 flex-wrap">
          <FlaskConical size={16} className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">Test before you submit</h3>
        </header>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TEST_LINKS.map(({ to, label, desc }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-lg border border-border bg-card/30 p-3 hover:border-primary/40"
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground group-hover:text-primary">
                <BadgeCheck size={14} className="text-primary" aria-hidden="true" />
                {label}
                <ArrowRight size={12} aria-hidden="true" />
              </span>
              <span className="mt-1 block text-xs text-muted-foreground leading-snug">{desc}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
