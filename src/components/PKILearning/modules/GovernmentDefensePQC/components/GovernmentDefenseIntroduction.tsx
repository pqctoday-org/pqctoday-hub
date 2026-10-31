// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import {
  ShieldCheck,
  CalendarClock,
  Lock,
  FileBadge,
  PackageSearch,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { LearnSection, useActiveLearnPath } from '@/components/PKILearning/common/LearnSection'
import {
  SUITE_COMPARISON,
  CNSA_MILESTONES,
  CNSA_HYBRID_POSITION,
  CNSA_HYBRID_OBJECTIONS,
  CNSA_NAMING_DRIFT,
} from '../data/cnsaData'
import { FEDERAL_MANDATES, FPKI_PROFILE_PAIR } from '../data/mandateData'

interface Props {
  onNavigateToWorkshop: () => void
}

export const GovernmentDefenseIntroduction: React.FC<Props> = ({ onNavigateToWorkshop }) => {
  useActiveLearnPath()

  return (
    <div className="w-full space-y-6">
      <LearnSection
        sectionId="cnsa-suite"
        title="1. The CNSA 2.0 Suite"
        icon={<ShieldCheck size={20} className="text-primary" />}
        defaultOpen
      >
        <p className="text-muted-foreground">
          The Commercial National Security Algorithm Suite is the algorithm list National Security
          Systems are required to use. CNSA 1.0 is the classical suite carried in CNSSP 15 Annex B;
          CNSA 2.0 replaces every public-key line in it. Reading the two side by side is the
          clearest illustration of crypto agility available in a real standard — the symmetric rows
          barely move, and the asymmetric rows are replaced wholesale.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Purpose</th>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">CNSA 1.0</th>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">CNSA 2.0</th>
              </tr>
            </thead>
            <tbody>
              {SUITE_COMPARISON.map((row) => (
                <tr key={row.purpose} className="border-b border-border/50 align-top">
                  <td className="py-2 pr-4 font-medium text-foreground">{row.purpose}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{row.cnsa1}</td>
                  <td className="py-2 pr-4 text-foreground">{row.cnsa2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-2">
          {SUITE_COMPARISON.map((row) => (
            <div key={row.purpose} className="p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm">
                <strong className="text-foreground">{row.purpose}:</strong>{' '}
                <span className="text-muted-foreground">{row.rationale}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/30 space-y-2">
          <h3 className="font-semibold text-foreground">Same algorithms, two vocabularies</h3>
          <p className="text-sm text-muted-foreground">
            The 2022 advisory names {CNSA_NAMING_DRIFT.advisory2022.join(' and ')}. The October 2026
            FAQ (Ver. 2.2) names {CNSA_NAMING_DRIFT.faq2024.join(' and ')} for the same algorithms.{' '}
            {CNSA_NAMING_DRIFT.note}
          </p>
          <p className="text-sm text-muted-foreground">
            This matters operationally: an estate search for &ldquo;Kyber&rdquo; will not find
            anything written after standardisation, and a search for &ldquo;ML-KEM&rdquo; will not
            find anything written before it. Inventory tooling has to know both.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
          <h3 className="font-semibold text-foreground">Hybrids: not required, not forbidden</h3>
          <p className="text-sm text-muted-foreground">{CNSA_HYBRID_POSITION}</p>
          <p className="text-sm text-muted-foreground">
            NSA&rsquo;s stated objections, which are worth knowing because other bodies recommend or
            require hybrids (for example BSI, ANSSI and ETSI TS 119 312) — see{' '}
            <Link to="/learn/hybrid-crypto" className="text-primary hover:underline">
              Hybrid Cryptography
            </Link>
            :
          </p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            {CNSA_HYBRID_OBJECTIONS.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
      </LearnSection>

      <LearnSection
        sectionId="cnsa-timeline"
        title="2. Mandates & Dated Milestones"
        icon={<CalendarClock size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          These dates are what separates this sector from every other one in this track. They come
          from CNSSP 15 as stated in the October 2026 CNSA 2.0 FAQ (Ver. 2.2) — not from the 2022
          advisory, which carried a different, per-equipment-type timetable running from 2025 to
          2033.
        </p>

        <ol className="space-y-3">
          {CNSA_MILESTONES.map((m) => (
            <li key={m.date} className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-bold text-primary">{m.date}</span>
                <span className="text-xs text-muted-foreground">{m.source}</span>
              </div>
              <p className="mt-1 text-sm text-foreground">{m.requirement}</p>
            </li>
          ))}
        </ol>

        <div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/30">
          <p className="text-sm">
            <AlertTriangle size={14} className="inline mr-1.5 -mt-0.5 text-status-warning" />
            The binding date for most vendors is the earliest one. From 1 January 2027 new NSS
            acquisitions are required to use CNSA 2.0 algorithms, regardless of how long the rest of
            the transition runs. That does not make every other product automatically unbuyable:
            NSA&rsquo;s FAQ (version 2.2, October 2026) says that where no CNSA 2.0 compliant
            product meeting the need is available on 1 January 2027, a deployment may, if needed, be
            accepted on a vendor&rsquo;s contractual commitment to provide a CNSA 2.0 update,
            combined with a realistic deployment plan that prioritises partial quantum resistance
            and meets the 2030 deadline for full quantum resistance, and NIAP Policy Letter #33 says
            that from 1 January 2027 government contracts must include language requiring products
            used in NSS to implement PQC or be updateable to implement PQC.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">The instruments behind the dates</h3>
          {FEDERAL_MANDATES.map((m) => (
            <div key={m.id} className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex flex-wrap items-baseline gap-2">
                <Link
                  to={`/library?ref=${encodeURIComponent(m.libraryRef)}`}
                  className="font-medium text-primary hover:underline"
                >
                  {m.label}
                </Link>
                <span className="text-xs px-2 py-0.5 rounded-full bg-background text-muted-foreground">
                  {m.instrument}
                </span>
                <span className="text-xs text-muted-foreground">{m.appliesTo}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{m.obligation}</p>
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={onNavigateToWorkshop} className="text-sm">
          Explore the mandates in the Workshop <ArrowRight size={14} className="ml-1" />
        </Button>
      </LearnSection>

      <LearnSection
        sectionId="nss-csfc"
        title="3. National Security Systems & CSfC"
        icon={<Lock size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Which deadline applies to a system depends on whether it is a National Security System.
          NSS follow CNSSP 15 and the CNSA dates. Federal civilian systems follow the OMB memoranda
          under the Quantum Computing Cybersecurity Preparedness Act and Executive Order 14412 (22
          June 2026), which directs OMB to require agencies to move their high value assets and high
          impact systems to post-quantum cryptography for key establishment by 31 December 2030 and
          for digital signatures by 31 December 2031. Those deadlines are separate from the CNSA
          ones: National Security Systems are excluded from them and follow CNSSP 15, whose
          requirements and timelines NSA describes as comparable. Confusing the two is a planning
          error to avoid in this sector.
        </p>
        <p className="text-muted-foreground">
          Commercial Solutions for Classified (CSfC) layers two independent commercial encryption
          implementations to protect classified data without government-furnished cryptography. Its
          PQC guidance addendum is the document that tells integrators how the layers change under
          CNSA 2.0 — but the April 2025 edition (version 1.0 draft .5) is a draft whose planned
          timeline, subject to change, aims for all CSfC solutions to implement post-quantum
          cryptography by 2030. And because a CSfC solution composes two implementations, it
          inherits the migration problem twice.
        </p>
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground">
            Systems validated against a NIAP or CSfC profile can stay in use while the transition
            runs, but any reliance on non-CNSA-2.0 algorithms becomes reportable under NSM-10. NSA
            expects that reporting to continue for many customers through 31 December 2031. NSA also
            says that NIAP will begin archiving the certificates of partially quantum-resistant and
            quantum-vulnerable products generally within a year of fully quantum-resistant products
            coming on the market, that it expects this archiving to start in late 2027, and that
            products with archived certificates will not comply with CNSSP 11 and will not be
            appropriate for NSS.
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <Link
              to="/library?ref=NSA%20CSfC%20PQC%20Guidance%20Addendum"
              className="text-primary hover:underline"
            >
              CSfC PQC Guidance Addendum
            </Link>
            <Link to="/library?ref=CNSSP%2015" className="text-primary hover:underline">
              CNSSP 15
            </Link>
            <Link to="/library?ref=NSA%20CNSA%202.0%20FAQ" className="text-primary hover:underline">
              CNSA 2.0 FAQ
            </Link>
          </div>
        </div>
      </LearnSection>

      <LearnSection
        sectionId="federal-pki"
        title="4. Federal PKI & the PQC Profile"
        icon={<FileBadge size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          The Federal PKI issues the certificates behind PIV cards, federal employee authentication,
          and document signing. Its certificate profiles are maintained by the Federal PKI Policy
          Authority — and there are currently two, which is exactly what crypto agility looks like
          as a document lifecycle rather than a slogan.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {[FPKI_PROFILE_PAIR.classical, FPKI_PROFILE_PAIR.postQuantum].map((p) => (
            <div key={p.libraryRef} className="p-4 rounded-lg bg-muted/50 border border-border">
              <Link
                to={`/library?ref=${encodeURIComponent(p.libraryRef)}`}
                className="font-medium text-primary hover:underline"
              >
                {p.label}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">{p.status}</p>
              <p className="mt-2 text-sm text-foreground">{p.algorithms}</p>
              <p className="mt-2 text-sm text-muted-foreground">{p.note}</p>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/30">
          <p className="text-sm">
            <AlertTriangle size={14} className="inline mr-1.5 -mt-0.5 text-status-warning" />
            The PQC profile is a <strong>draft</strong> for CITE testing. It shows the direction and
            the intended algorithms, and it is not something to hold a supplier to yet. This module
            cites it as a draft deliberately.
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          Two further details from the Federal PKI. The Federal PKI page announced that the Federal
          Bridge Certification Authority (FBCA) G4 would be replaced by the FBCA G5 starting 27
          August 2026, to meet federal cryptographic-strength requirements, and that applications
          may need to update their trust stores with new intermediate CA certificates. And under the
          Common Policy, CA private keys must be held in cryptographic modules validated to at least
          FIPS 140 Level 3.
        </p>

        <p className="text-sm text-muted-foreground">
          For X.509 and certificate-chain fundamentals this section deliberately does not repeat,
          see{' '}
          <Link to="/learn/pki-workshop" className="text-primary hover:underline">
            PKI
          </Link>
          .
        </p>
      </LearnSection>

      <LearnSection
        sectionId="procurement"
        title="5. Procurement & Supply Chain"
        icon={<PackageSearch size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Most organisations meet CNSA 2.0 not as a cryptography project but as a procurement
          constraint: from 1 January 2027 new NSS acquisitions must be CNSA 2.0 compliant, so the
          requirement propagates to every supplier in the chain.
        </p>
        <p className="text-muted-foreground">
          CISA maintains a product-category list for PQC technologies, which is the practical
          starting point for working out which parts of an estate are in scope. It names ML-KEM
          (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205) and the stateful hash-based signatures
          of SP 800-208, and it says that organizations should acquire only PQC-capable products in
          the categories it lists as widely available. The list is broader than the CNSA 2.0
          algorithm set: NSA does not approve SLH-DSA, HSS or XMSS^MT for National Security Systems.
        </p>
        <p className="text-muted-foreground">
          NIST SP 800-171 Rev. 3 reaches further still — it applies to nonfederal systems handling
          Controlled Unclassified Information, which pulls contractors, universities and suppliers
          into the same conversation even when they never touch a National Security System. For
          defence contractors, DoD&rsquo;s CMMC briefing (cleared for open publication on 21 January
          2025) says assessments remain against Rev. 2 until DoD formally adopts Rev. 3 through
          rulemaking. Executive Order 14412 goes a step further for contractors: it directs a
          proposed Federal Acquisition Regulation rule that would require covered contractors to
          comply by 31 December 2030 with NIST&rsquo;s FIPS, including all applicable FIPS
          incorporating PQC-compliant algorithms. The order directs that proposed rule; it is not
          itself the rule.
        </p>
        <p className="text-muted-foreground">
          Algorithm support is only one gate. CNSSP 11 requires commercial IA and IA-enabled IT
          products bought to protect information on NSS to comply with the NIAP program, with
          agencies selecting evaluated products from the NIAP Product Compliant List, and, where
          applicable, with the FIPS cryptographic validation programs. NSA&rsquo;s CNSA 2.0 FAQ
          (version 2.2, October 2026) says NIAP and FIPS validation are required in most
          circumstances, so in most cases a product needs NIAP evaluation and FIPS validation as
          well as CNSA 2.0 algorithm support.
        </p>
        <div className="flex flex-wrap gap-3 text-xs">
          <Link
            to="/library?ref=CISA-PQC-CATEGORY-LIST-2026"
            className="text-primary hover:underline"
          >
            CISA PQC Product Category List
          </Link>
          <Link
            to="/library?ref=NIST-SP-800-171-Rev-3-Protecting-Controlled-Unclassified-Inf"
            className="text-primary hover:underline"
          >
            NIST SP 800-171 Rev. 3
          </Link>
          <Link to="/library?ref=CMMC-2.0-MODEL" className="text-primary hover:underline">
            CMMC 2.0
          </Link>
          <Link
            to="/library?ref=EO-2026-06-22-Securing-the-Nation"
            className="text-primary hover:underline"
          >
            Executive Order 14412
          </Link>
          <Link
            to="/library?ref=CNSSP-11-IA-Product-Acquisition-Policy"
            className="text-primary hover:underline"
          >
            CNSSP 11
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">
          For scoring supplier readiness in general, see{' '}
          <Link to="/learn/vendor-risk" className="text-primary hover:underline">
            Vendor &amp; Supply Chain Risk
          </Link>{' '}
          — this section covers only what is specific to federal acquisition.
        </p>
      </LearnSection>

      <ReadingCompleteButton />
    </div>
  )
}
