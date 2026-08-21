// SPDX-License-Identifier: GPL-3.0-only
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
          machine-readable inventory of every software component a build depends on — packages,
          libraries, their versions, suppliers, and how they relate to each other. It answers{' '}
          <em>what is in this build?</em>
        </p>
        <p>
          <Badge kind="view" />
          It does not answer <em>what cryptography is inside it?</em> — that is the{' '}
          <Link to="/learn/cbom" className="text-primary hover:underline">
            CBOM module
          </Link>
          &apos;s job, one layer up. An SBOM lists software; a CBOM extends that list with
          algorithm, key size, protocol, and quantum-vulnerability fields the SBOM has no place for.
          Keep the two separate: this module is the software inventory, not the crypto one.
        </p>
      </Section>

      <Section id="sbom-formats" icon={FileJson} title="SPDX vs CycloneDX — general BOM formats">
        <p>
          <Badge kind="std" />
          <strong>SPDX</strong> (Linux Foundation; standardized as{' '}
          <strong>ISO/IEC 5962:2021</strong>) grew out of license-compliance tooling and has the
          deeper license/provenance model. <strong>CycloneDX</strong> (OWASP; standardized as{' '}
          <strong>ECMA-424</strong>) grew out of application-security tooling and is the more
          extensible object model — SaaSBOM, HBOM, ML-BOM and VDR/VEX are all sibling BOM types
          built on the same schema.
        </p>
        <p>
          <Badge kind="view" />
          Neither format has a cryptography object model built in for general use. CycloneDX does
          have a crypto-specific extension (assetType: cryptographic-asset) — that extension, and
          the SPDX-vs-CycloneDX trade-off <em>for a crypto inventory specifically</em>, is covered
          in the CBOM module, not repeated here. Likewise, CycloneDX&apos;s own cross-tool
          algorithm/curve naming registry is covered in the{' '}
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
          required fields per component: <strong>Supplier Name</strong>,{' '}
          <strong>Component Name</strong>, <strong>Version</strong>,{' '}
          <strong>Other Unique Identifiers</strong>, <strong>Dependency Relationship</strong>,{' '}
          <strong>Author of SBOM Data</strong>, and <strong>Timestamp</strong>. Two of the seven —
          author and timestamp — live at the document level, not per component.
        </p>
        <p>
          <Badge kind="std" />
          CISA finalized a successor on 29 July 2026 — the{' '}
          <em>2026 Minimum Elements for a Software Bill of Materials</em>, v2.1 — co-authored with
          NSA, FBI, and 15 international partner cyber agencies. It keeps all seven of the above and
          adds ten more; see the next section for what changed and why.
        </p>
      </Section>

      <Section id="sbom-2026-update" icon={Sparkles} title="What changed in the 2026 update">
        <p>
          <Badge kind="std" />
          The seven elements above went unchanged for four years while SBOM tooling matured well
          past what they were designed for. The 2026 update is a strict superset — nothing from 2021
          was removed or redefined — adding <strong>ten new required elements</strong>: seven at the
          document level (<strong>SBOM Author Signature</strong>,{' '}
          <strong>SBOM Data Format Name</strong>, <strong>SBOM Data Format Version</strong>,{' '}
          <strong>SBOM Tool Name</strong>, <strong>SBOM Tool Version</strong>,{' '}
          <strong>SBOM Version</strong>, and <strong>SBOM Generation Context</strong>) and three per
          component (<strong>Component Hash Algorithm</strong>,{' '}
          <strong>Component Hash Value</strong>, and <strong>Component License</strong>). Eight more
          existing elements — including <strong>SBOM Author</strong>,{' '}
          <strong>Component Producer</strong>, <strong>Component Identifiers</strong>, and{' '}
          <strong>Component Version</strong> — gained clarified scope without changing what they
          require.
        </p>
        <p>
          <Badge kind="view" />
          If you generate or request SBOMs today: the hash and license fields are the two most
          likely to already be in your pipeline&apos;s output (both formats have carried the fields
          all along — see the workshop step below), while the document-level additions are new
          metadata your SBOM tooling may not populate yet.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigateToWorkshop?.(0)}
          className="border-primary text-primary hover:bg-primary/10"
        >
          See the new fields mapped in both formats →
        </Button>
      </Section>

      <Section id="sbom-vex" icon={Bug} title="VEX closes the vulnerability-triage gap">
        <p>
          <Badge kind="std" />
          An SBOM lists what is present; it says nothing about whether a listed component&apos;s
          known vulnerabilities are actually reachable in this product.{' '}
          <strong>VEX (Vulnerability Exploitability eXchange)</strong> — Profile 5 of{' '}
          <strong>OASIS CSAF 2.0</strong> — closes that gap with a machine-readable{' '}
          <em>affected / not affected / fixed / under investigation</em> statement per CVE per
          product.
        </p>
        <p>
          <Badge kind="view" />
          Without VEX, a CVE in a widely-used component (a compression library, a crypto library)
          fires an alert for every product that merely lists it in an SBOM, regardless of whether
          the vulnerable code path is ever called. VEX turns that into a triage decision instead of
          a fire drill.
        </p>
      </Section>

      <Section
        id="sbom-regulation"
        icon={Scale}
        title="What's actually mandated: EO 14028 & EU CRA"
      >
        <p>
          <Badge kind="std" />
          US <strong>Executive Order 14028</strong> (May 2021) requires software vendors selling to
          the federal government to provide an SBOM — the requirement that produced NTIA&apos;s
          minimum-elements work above. The <strong>EU Cyber Resilience Act</strong> (Regulation EU
          2024/2847) requires manufacturers of products with digital elements to maintain an SBOM
          covering top-level dependencies, with the main obligations applying from{' '}
          <strong>11 December 2027</strong>.
        </p>
        <p>
          <Badge kind="view" />
          Neither mandate is PQC-specific — they are general software supply-chain requirements. The
          reason a PQC migration program cares is downstream: an SBOM built to satisfy EO 14028 or
          the CRA is exactly the existing data source a crypto-discovery effort should integrate
          rather than duplicate.
        </p>
      </Section>

      <Section id="sbom-to-cbom" icon={ArrowRightLeft} title="Bridge: from SBOM to CBOM">
        <p>
          <Badge kind="view" />
          An SBOM is <strong>Phase 1 discovery input</strong>, not a Phase 2 output: it is one of
          the existing data sources a crypto-discovery effort should cross-reference rather than
          rebuild from scratch. Skipping that cross-reference — building a CBOM without linking it
          back to SBOM dependency chains — is a named common failure in PQC migration programs.
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
