// SPDX-License-Identifier: AGPL-3.0-only
import type { FC } from 'react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { Link } from 'react-router'
import { Package, FileJson, ListChecks, Bug, Scale, ArrowRightLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onNavigateToWorkshop?: (step?: number) => void
}

/** ● = grounded in a primary standard · ◆ = practitioner / framework view */
const Badge: FC<{ kind: 'std' | 'view' }> = ({ kind }) => (
  <span
    className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mr-1 align-middle ${
      kind === 'std'
        ? 'bg-status-success/15 text-status-success'
        : 'bg-status-info/15 text-status-info'
    }`}
  >
    {kind === 'std' ? '● standard' : '◆ practitioner'}
  </span>
)

const Section: FC<{
  id: string
  icon: typeof Package
  title: string
  children: React.ReactNode
}> = ({ id, icon: Icon, title, children }) => (
  <section id={id} className="glass-panel p-5 scroll-mt-24">
    <div className="flex items-center gap-2 mb-3">
      <Icon size={18} className="text-primary" />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
    </div>
    <div className="space-y-3 text-sm text-foreground/90 leading-relaxed">{children}</div>
  </section>
)

const SECTIONS = [
  { id: 'sbom-why', label: 'Why an SBOM' },
  { id: 'sbom-formats', label: 'SPDX vs CycloneDX' },
  { id: 'sbom-elements', label: 'Minimum Elements' },
  { id: 'sbom-2026-update', label: '2026 Update' },
  { id: 'sbom-vex', label: 'VEX' },
  { id: 'sbom-regulation', label: 'Regulation' },
  { id: 'sbom-to-cbom', label: 'Bridge to CBOM' },
]

export const SbomIntroduction: FC<Props> = ({ onNavigateToWorkshop }) => {
  useSectionAnchors()
  return (
    <div className="space-y-5">
      <div className="glass-panel p-4 flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground self-center mr-1">In this module:</span>
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
          >
            {s.label}
          </a>
        ))}
      </div>

      <Section id="sbom-why" icon={Package} title="Why an SBOM, and what it isn't">
        <p>
          <Badge kind="std" />A <strong>Software Bill of Materials (SBOM)</strong> is a
          machine-readable inventory of software components within a product&apos;s stated scope,
          with information such as names, versions, suppliers or producers, and dependency
          relationships. Coverage depends on how the SBOM is generated and maintained; it should not
          be assumed to include every dependency. It helps answer <em>what is in this build?</em>
        </p>
        <p>
          <Badge kind="view" />
          It does not answer <em>what cryptography is inside it?</em> — that is the{' '}
          <Link to="/learn/cbom" className="text-primary hover:underline">
            CBOM module
          </Link>
          &apos;s job, one layer up. An SBOM lists software components. A CBOM records cryptographic
          assets and related properties; discovery can also require scanners, certificate and key
          inventories, runtime observation, and manual investigation.
        </p>
      </Section>

      <Section id="sbom-formats" icon={FileJson} title="SPDX vs CycloneDX — general BOM formats">
        <p>
          <Badge kind="std" />
          <strong>SPDX</strong> is an international open standard (ISO/IEC 5962:2021 for v2.x;
          released v3.0.1). <strong>CycloneDX</strong> is an OWASP community specification;
          CycloneDX 1.6 was published as ECMA-424 and v1.7 is the 2nd edition. Both formats
          represent software components and relationships, but use different schemas and field
          models. Compare the versions and downstream tool support your workflow requires instead of
          assuming one is universally more complete.
        </p>
        <p>
          <Badge kind="view" />
          General software inventory does not establish a complete cryptographic asset inventory.
          CycloneDX includes a cryptographic-asset model; the extension and the SPDX-vs-CycloneDX
          trade-off <em>for a crypto inventory specifically</em> are covered in the CBOM module.
          CycloneDX&apos;s own cross-tool algorithm/curve naming registry is covered in the{' '}
          <Link to="/learn/crypto-registry" className="text-primary hover:underline">
            CycloneDX Cryptography Registry module
          </Link>
          .
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigateToWorkshop?.(0)}
          className="border-primary text-primary hover:bg-primary/10"
        >
          Compare a component in both formats →
        </Button>
      </Section>

      <Section id="sbom-elements" icon={ListChecks} title="NTIA's minimum elements">
        <p>
          <Badge kind="std" />
          NTIA&apos;s 2021 <em>Minimum Elements for a Software Bill of Materials</em> defines seven
          data fields: <strong>Supplier Name</strong>, <strong>Component Name</strong>,{' '}
          <strong>Version of the Component</strong>, <strong>Other Unique Identifiers</strong>,{' '}
          <strong>Dependency Relationship</strong>, <strong>Author of SBOM Data</strong>, and{' '}
          <strong>Timestamp</strong>. NTIA&apos;s framing applies the first five fields to
          components; author and timestamp are metadata about the SBOM itself.
        </p>
        <p>
          <Badge kind="std" />
          CISA finalized a successor on 29 July 2026 — the{' '}
          <em>2026 Minimum Elements for a Software Bill of Materials</em>, v2.1 — co-authored with
          NSA, FBI, and 15 international partner cyber agencies. It revises or replaces several 2021
          fields and adds ten new elements; it is not a strict superset. See the next section for
          what changed and why.
        </p>
      </Section>

      <Section id="sbom-2026-update" icon={Sparkles} title="What changed in the 2026 update">
        <p>
          <Badge kind="std" />
          The seven elements above remained the baseline for about five years while SBOM tooling
          matured well past what they were designed for. The 2026 update adds{' '}
          <strong>ten new required elements</strong>: seven at the document level (
          <strong>SBOM Author Signature</strong>, <strong>SBOM Data Format Name</strong>,{' '}
          <strong>SBOM Data Format Version</strong>, <strong>SBOM Tool Name</strong>,{' '}
          <strong>SBOM Tool Version</strong>, <strong>SBOM Version</strong>, and{' '}
          <strong>SBOM Generation Context</strong>) and three per component (
          <strong>Component Hash Algorithm</strong>, <strong>Component Hash Value</strong>, and{' '}
          <strong>Component License</strong>). Existing elements are revised rather than carried
          over unchanged: Appendix B replaces Supplier Name with <strong>Component Producer</strong>
          , Other Unique Identifiers with <strong>Component Identifiers</strong>, Author of SBOM
          Data with <strong>SBOM Author</strong>, and Version of the Component with{' '}
          <strong>Component Version</strong>, and removes the Access Control element. Check anything
          built against the 2021 baseline against Appendix B.
        </p>
        <p>
          <Badge kind="view" />
          Generator features and output change by release, ecosystem, lock file, and configuration.
          A supported format does not guarantee that every value is present or that an SBOM meets a
          particular contract or regulatory requirement. The workshop links tool documentation and
          shows what to inspect; check your generated artifact against the applicable CISA guidance
          and requirements.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToWorkshop?.(0)}
            className="border-primary text-primary hover:bg-primary/10"
          >
            See the new fields mapped in both formats →
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToWorkshop?.(1)}
            className="border-primary text-primary hover:bg-primary/10"
          >
            See the full per-tool breakdown →
          </Button>
        </div>
      </Section>

      <Section id="sbom-vex" icon={Bug} title="VEX closes the vulnerability-triage gap">
        <p>
          <Badge kind="std" />
          An SBOM lists components; it does not determine whether a vulnerable code path is
          reachable in a particular product.{' '}
          <strong>VEX (Vulnerability Exploitability eXchange)</strong> — Profile 5 of{' '}
          <strong>OASIS CSAF 2.0</strong> — closes that gap with a machine-readable product status
          and supporting rationale for a vulnerability. CSAF&apos;s VEX profile includes statuses
          such as known affected, known not affected, fixed, or under investigation. A VEX statement
          supports triage; it does not prove by itself that a vulnerability is or is not
          exploitable.
        </p>
        <p>
          <Badge kind="view" />
          Product status and justification can help teams prioritize investigation. Validate the
          statement against the product version and evidence available to your organization.
        </p>
      </Section>

      <Section id="sbom-regulation" icon={Scale} title="U.S. procurement guidance & EU CRA">
        <p>
          <Badge kind="std" />
          <strong>Executive Order 14028</strong> directed federal software supply-chain security
          work, including the original NTIA minimum-elements effort. For federal procurement,{' '}
          <a
            href="https://www.whitehouse.gov/wp-content/uploads/2022/09/M-22-18.pdf"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-primary underline underline-offset-2"
          >
            OMB M-22-18
          </a>{' '}
          says agencies may require an SBOM in solicitations based on software criticality or agency
          determination; this is not a blanket rule that every federal software vendor must provide
          one. The <strong>EU Cyber Resilience Act</strong> (Regulation EU 2024/2847) requires
          manufacturers of in-scope products with digital elements to document components and
          vulnerabilities, including an SBOM in a commonly used machine-readable format covering at
          least top-level dependencies. Its general application date is{' '}
          <strong>11 December 2027</strong>, with earlier dates for specified provisions.
        </p>
        <p>
          <Badge kind="view" />
          These are general software supply-chain requirements, not PQC-specific mandates. A PQC
          discovery effort can use a relevant SBOM as one input, while checking its scope and
          cross-referencing it with other evidence.
        </p>
      </Section>

      <Section id="sbom-to-cbom" icon={ArrowRightLeft} title="Bridge: from SBOM to CBOM">
        <p>
          <Badge kind="view" />
          In this module&apos;s staged model, an SBOM is a discovery input, not the CBOM output. A
          crypto-discovery effort can cross-reference its component and dependency information
          rather than assume it already describes cryptographic assets. US policy draws the same
          distinction: CISA&apos;s July 2026 guidance defines minimum <em>SBOM</em> elements, while
          Executive Order 14412 (22 Jun 2026) directs CISA to publish separate guidance on minimum{' '}
          <em>CBOM</em> elements by 19 March 2027.
        </p>
        <p>
          <Badge kind="view" />
          Two different next steps, two different modules:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Need to know <em>what cryptographic algorithms, keys, and certificates</em> a component
            uses? That&apos;s the{' '}
            <Link to="/learn/cbom" className="text-primary hover:underline">
              CBOM module
            </Link>
            .
          </li>
          <li>
            Need to resolve <em>the same mechanism named differently</em> across an HSM, a
            certificate, and a library string? That&apos;s the{' '}
            <Link to="/learn/crypto-registry" className="text-primary hover:underline">
              CycloneDX Cryptography Registry module
            </Link>
            .
          </li>
        </ul>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigateToWorkshop?.(1)}
          className="border-primary text-primary hover:bg-primary/10"
        >
          Pick a generation tool for your build →
        </Button>
      </Section>
    </div>
  )
}
