// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router-dom'
import {
  Scale,
  Shield,
  Globe,
  Building2,
  Network,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  BookOpen,
  ExternalLink,
  Layers,
  Lock,
  FileCheck,
  Map,
  Puzzle,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import { LearnStepper } from '@/components/PKILearning/LearnStepper'

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

// ─── Step 1: The Three Roles ──────────────────────────────────────────────────

const Step1ThreeRoles: React.FC = () => (
  <div className="space-y-8 max-w-4xl mx-auto">
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Layers size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">
          Three Distinct Roles in the PQC Ecosystem
        </h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          The PQC transition involves three fundamentally different types of organizations, each
          playing a distinct role. Confusing them is a common source of compliance mistakes.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
          <p className="text-sm italic text-foreground/90">
            Think of it like building construction: <strong>standardization bodies</strong> write
            the building codes (what materials are safe), <strong>certification bodies</strong> are
            the inspectors who verify that a specific building meets those codes, and{' '}
            <strong>compliance frameworks</strong> are the zoning laws that say &quot;in this
            jurisdiction, meeting code is mandatory for these buildings.&quot; All three are
            necessary; none is redundant.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={18} className="text-primary" />
              <span className="font-bold text-foreground">Standardization Bodies</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Create technical standards: algorithm specifications, security levels, protocol
              integration. Their output is a published document, not a certificate.
            </p>
            <div className="text-xs space-y-1">
              <div className="font-medium text-foreground">Examples:</div>
              <div>
                &bull; <InlineTooltip term="NIST">NIST</InlineTooltip> → FIPS 203/204/205
              </div>
              <div>
                &bull; <InlineTooltip term="IETF">IETF</InlineTooltip> → RFCs (RFC 9629)
              </div>
              <div>
                &bull; <InlineTooltip term="ETSI">ETSI</InlineTooltip> → TS 103 744
              </div>
              <div>&bull; ISO/IEC → International Standards</div>
            </div>
          </div>
          <div className="bg-secondary/5 rounded-lg p-4 border border-secondary/20">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck size={18} className="text-secondary" />
              <span className="font-bold text-foreground">Certification Bodies</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Certify that products/systems correctly implement standards. Their output is a
              certificate (or certificate number) tied to a specific product version.
            </p>
            <div className="text-xs space-y-1">
              <div className="font-medium text-foreground">Examples:</div>
              <div>
                &bull; <InlineTooltip term="CMVP">CMVP</InlineTooltip> → FIPS 140-3 certs
              </div>
              <div>&bull; ACVP → algorithm-level validation</div>
              <div>
                &bull; <InlineTooltip term="Common Criteria">Common Criteria</InlineTooltip> → CC
                certificates
              </div>
              <div>
                &bull; <InlineTooltip term="ENISA">ENISA</InlineTooltip>/EUCC → EU product certs
              </div>
            </div>
          </div>
          <div className="bg-status-warning/5 rounded-lg p-4 border border-status-warning/20">
            <div className="flex items-center gap-2 mb-2">
              <Scale size={18} className="text-status-warning" />
              <span className="font-bold text-foreground">Compliance Frameworks</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Regulations and mandates that reference standards and require certifications. Their
              output is a legal/regulatory obligation, not a technical specification.
            </p>
            <div className="text-xs space-y-1">
              <div className="font-medium text-foreground">Examples:</div>
              <div>
                &bull; <InlineTooltip term="FIPS 140-3">FIPS 140-3</InlineTooltip> (US federal
                procurement rule)
              </div>
              <div>
                &bull; <InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip> (NSA NSS mandate)
              </div>
              <div>
                &bull; <InlineTooltip term="NIS2">NIS2 Directive</InlineTooltip> (EU essential
                entities)
              </div>
              <div>
                &bull; <InlineTooltip term="eIDAS">eIDAS 2.0</InlineTooltip> (EU digital identity)
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Network size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">How the Three Roles Interact</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          The three roles form a chain: a standards body publishes an algorithm specification → a
          certification body validates that a product correctly implements it → a compliance
          framework mandates that regulated entities use certified products.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch gap-0">
          {[
            {
              step: '1',
              who: 'NIST',
              what: 'Publishes FIPS 203 (ML-KEM algorithm specification)',
              color: 'bg-primary/5 border-primary/30',
            },
            {
              step: '→',
              who: '',
              what: '',
              color:
                'bg-transparent border-transparent flex items-center justify-center text-muted-foreground text-2xl',
            },
            {
              step: '2',
              who: 'CMVP',
              what: 'Certifies HSM implementations of FIPS 203 (FIPS 140-3 certificate)',
              color: 'bg-secondary/5 border-secondary/30',
            },
            {
              step: '→',
              who: '',
              what: '',
              color:
                'bg-transparent border-transparent flex items-center justify-center text-muted-foreground text-2xl',
            },
            {
              step: '3',
              who: 'NSA / CNSA 2.0',
              what: 'Mandates that federal agencies use CMVP-certified modules implementing ML-KEM-1024',
              color: 'bg-status-warning/5 border-status-warning/30',
            },
          ].map((item, idx) =>
            item.who === '' ? (
              <div
                key={idx}
                className="hidden sm:flex items-center text-2xl text-muted-foreground px-1"
              >
                →
              </div>
            ) : (
              <div key={idx} className={`flex-1 rounded-lg p-3 border ${item.color}`}>
                <div className="text-xs font-bold text-muted-foreground mb-1">Step {item.step}</div>
                <div className="text-sm font-semibold text-foreground mb-1">{item.who}</div>
                <p className="text-xs text-muted-foreground">{item.what}</p>
              </div>
            )
          )}
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border mt-2">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Key insight:</strong> You can <em>comply with</em> a
            framework, be <em>certified against</em> a standard, and the standard body{' '}
            <em>writes</em> the standard — three verbs, three different relationships.
          </p>
        </div>
      </div>
    </section>
  </div>
)

// ─── Step 2: Governmental vs Non-Governmental ─────────────────────────────────

const Step2GovVsNonGov: React.FC = () => (
  <div className="space-y-8 max-w-4xl mx-auto">
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Building2 size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Governmental vs Non-Governmental</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Whether an organization is governmental or non-governmental determines whether its outputs
          can be legally mandatory or only advisory. This distinction matters enormously for
          compliance.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-primary" />
              <span className="font-semibold text-foreground">Governmental Bodies</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Government agencies with regulatory authority. Their technical guidelines and mandates
              can be legally binding. Authority derives from government statute, not membership
              consensus.
            </p>
            <div className="space-y-2 text-xs">
              {[
                { body: 'NIST', role: 'US: PQC algorithm standardization (FIPS)', region: '🇺🇸' },
                { body: 'NSA', role: 'US: CNSA 2.0 mandate for NSS', region: '🇺🇸' },
                { body: 'CISA', role: 'US: Federal procurement guidance', region: '🇺🇸' },
                { body: 'BSI', role: 'Germany: TR-02102 series', region: '🇩🇪' },
                { body: 'ANSSI', role: 'France: PQC hybrid requirement', region: '🇫🇷' },
                { body: 'NCSC', role: 'UK: Three-phase migration roadmap', region: '🇬🇧' },
                { body: 'ENISA', role: 'EU: EUCC certification scheme', region: '🇪🇺' },
                { body: 'KISA', role: 'Korea: KpqC competition', region: '🇰🇷' },
                { body: 'OSCCA/NGCC', role: 'China: SM algorithm mandate', region: '🇨🇳' },
              ].map((item) => (
                <div key={item.body} className="flex items-start gap-2 bg-muted/50 rounded p-2">
                  <span className="shrink-0">{item.region}</span>
                  <div>
                    <span className="font-medium text-foreground">{item.body}</span>
                    <span className="text-muted-foreground"> — {item.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Network size={16} className="text-secondary" />
              <span className="font-semibold text-foreground">
                Non-Governmental SDOs (Standards Development Organizations)
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Industry consortia and open membership bodies. Their standards gain authority through
              broad adoption, not government mandate. Anyone can contribute; consensus drives
              output.
            </p>
            <div className="space-y-2 text-xs">
              {[
                {
                  body: 'ISO/IEC JTC 1/SC 27',
                  role: 'International standards (170+ national bodies vote)',
                },
                { body: 'IETF', role: 'Internet protocols (open membership, rough consensus)' },
                { body: 'ETSI', role: 'European telecom standards (800+ member orgs)' },
                { body: '3GPP SA3', role: '5G security standards, PQC study (TR 33.841)' },
                { body: 'OASIS', role: 'PKCS#11 v3.2 (HSM PQC support)' },
                { body: 'W3C', role: 'Web standards (relevant for EUDI Wallet formats)' },
              ].map((item) => (
                <div key={item.body} className="bg-muted/50 rounded p-2">
                  <span className="font-medium text-foreground">{item.body}</span>
                  <span className="text-muted-foreground"> — {item.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-status-warning/10">
          <AlertTriangle size={24} className="text-status-warning" />
        </div>
        <h2 className="text-xl font-bold text-gradient">National Algorithm Divergence</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Governments can mandate nationally-specific algorithms that differ from NIST standards.
          This creates interoperability challenges for multinational organizations.
        </p>
        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-1">
              🇨🇳 China — OSCCA/NGCC: SM Algorithms
            </div>
            <p className="text-xs text-muted-foreground">
              China&apos;s Office of State Commercial Cryptography Administration (OSCCA) mandates
              SM2 (asymmetric), SM3 (hash), and SM4 (symmetric) algorithms for regulated sectors.
              These are <em>not</em> interoperable with NIST FIPS 203/204/205. Organizations
              operating in China may need a separate cryptographic stack.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-1">
              🇰🇷 Korea — KISA: KpqC Algorithms
            </div>
            <p className="text-xs text-muted-foreground">
              Korea&apos;s KpqC competition (2022–2025) selected HAETAE and AIMer (signatures),
              SMAUG-T and NTRU+ (KEMs) as Korean national algorithms — distinct from NIST&apos;s
              selections. Target standardization by 2029. Korean telecom operators may require
              support for KpqC algorithms alongside FIPS 203/204/205.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-foreground mb-1">
              🌍 Practical Impact for Multinationals
            </div>
            <p className="text-xs text-muted-foreground">
              Crypto-agile architectures (abstraction layers, pluggable algorithm providers) are
              essential for organizations operating across jurisdictions with divergent algorithm
              mandates. Design your key management and protocol stacks to support algorithm
              negotiation, not hard-coded algorithm choices.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
)

// ─── Step 3: Global vs Regional Coverage ──────────────────────────────────────

const Step3GlobalRegional: React.FC = () => (
  <div className="space-y-8 max-w-4xl mx-auto">
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Globe size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Global Tier — Universal Authority</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Global bodies gain authority through broad adoption and multi-country consensus, not
          government mandate. Their standards are recognized worldwide but not legally binding in
          themselves.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              name: 'ISO/IEC JTC 1/SC 27',
              role: 'Information security standards',
              pqc: 'ISO/IEC 14888-4 (hash-based sigs), IS 20085 (KEM)',
              members: '170+ national bodies',
            },
            {
              name: 'IETF',
              role: 'Internet protocol standards',
              pqc: 'PQUIP WG, LAMPS WG (RFC 9629), TLS WG',
              members: 'Open — any individual',
            },
            {
              name: 'ITU-T SG17',
              role: 'Telecom security, X.509 co-author',
              pqc: 'X.1363 (quantum-safe for telecom)',
              members: '193 UN member states',
            },
            {
              name: '3GPP SA3',
              role: '5G and mobile security',
              pqc: 'TR 33.841 (PQC study for 5G)',
              members: '700+ member companies',
            },
          ].map((item) => (
            <div key={item.name} className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="font-semibold text-sm text-foreground mb-1">{item.name}</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>
                  <span className="text-foreground/70">Role:</span> {item.role}
                </div>
                <div>
                  <span className="text-foreground/70">PQC:</span> {item.pqc}
                </div>
                <div>
                  <span className="text-foreground/70">Members:</span> {item.members}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Map size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Regional Landscape</h2>
      </div>
      <div className="space-y-3 text-sm text-foreground/80">
        {[
          {
            flag: '🇺🇸',
            region: 'United States',
            bodies: [
              'NIST — FIPS 203/204/205 algorithm standards (globally followed)',
              'NSA — CNSA 2.0 mandate for National Security Systems',
              'CISA — federal procurement guidance',
              'CMVP/ACVP — module & algorithm certification',
            ],
          },
          {
            flag: '🇪🇺',
            region: 'European Union',
            bodies: [
              'ETSI TC CYBER — TS 103 744 (quantum-safe cryptography standard)',
              'ENISA — EUCC certification scheme, ACM list',
              'EC — NIS2 Directive, eIDAS 2.0, DORA (legally binding regulations)',
            ],
          },
          {
            flag: '🇩🇪🇫🇷',
            region: 'Germany & France',
            bodies: [
              'BSI — TR-02102 series (binding for German government)',
              'ANSSI — PQC position papers, hybrid mandate (binding for French critical infra)',
            ],
          },
          {
            flag: '🇬🇧',
            region: 'United Kingdom',
            bodies: [
              'NCSC — three-phase roadmap (2025–2035), CAPS product assurance',
              'BSI UK — post-Brexit standards alignment',
            ],
          },
          {
            flag: '🌏',
            region: 'Asia-Pacific',
            bodies: [
              'KISA (Korea) — KpqC competition, HAETAE/AIMer/SMAUG-T/NTRU+',
              'AIST/METI (Japan) — CRYPTREC cipher list, PQC guidance',
              'OSCCA/NGCC (China) — SM2/SM3/SM4 mandate, parallel PQC track',
              'MAS (Singapore) — Technology Risk Management (TRM) guidelines',
            ],
          },
        ].map((item) => (
          <div key={item.region} className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{item.flag}</span>
              <span className="font-bold text-foreground">{item.region}</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              {item.bodies.map((b) => (
                <li key={b}>&bull; {b}</li>
              ))}
            </ul>
          </div>
        ))}
        <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Practical guidance:</strong> For most products,
            start with <strong>NIST FIPS 203/204/205</strong> (US procurement), add{' '}
            <strong>ETSI TS 103 744</strong> (EU interoperability), then layer national guidance
            (BSI TR-02102 for Germany, ANSSI hybrid for France). Check CMVP for US federal sales and
            EUCC for EU government sales.
          </p>
        </div>
      </div>
    </section>
  </div>
)

// ─── Step 4: Reading the App — Compliance & Migrate Pages ─────────────────────

const Step4AppPagesGuide: React.FC = () => (
  <div className="space-y-8 max-w-4xl mx-auto">
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Scale size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Reading the App: The Compliance Page</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          The app&apos;s{' '}
          <Link to="/compliance" className="text-primary hover:underline font-medium">
            /compliance page
          </Link>{' '}
          tracks 48+ PQC compliance frameworks. Each framework maps directly to a body covered in
          this module.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-bold text-muted-foreground">Framework</th>
                <th className="text-left py-2 px-3 font-bold text-muted-foreground">
                  Enforcement Body
                </th>
                <th className="text-left py-2 px-3 font-bold text-muted-foreground">Body Type</th>
                <th className="text-left py-2 px-3 font-bold text-muted-foreground">Scope</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                {
                  fw: 'FIPS 140-3',
                  body: 'NIST / CMVP',
                  type: 'Standards + Certification',
                  scope: 'US',
                },
                { fw: 'CNSA 2.0', body: 'NSA', type: 'Regulatory Agency', scope: 'US (NSS)' },
                {
                  fw: 'NIS2 Directive',
                  body: 'EC / ENISA',
                  type: 'Regulatory / Certification',
                  scope: 'EU',
                },
                { fw: 'eIDAS 2.0', body: 'European Commission', type: 'Regulatory', scope: 'EU' },
                { fw: 'ANSSI PQC', body: 'ANSSI', type: 'Regulatory Agency', scope: 'France' },
                { fw: 'BSI TR-02102', body: 'BSI', type: 'Regulatory Agency', scope: 'Germany' },
                {
                  fw: 'ETSI TS 103 744',
                  body: 'ETSI TC CYBER',
                  type: 'Standards Body',
                  scope: 'EU/Global',
                },
                { fw: 'EUCC', body: 'ENISA', type: 'Certification Body', scope: 'EU' },
              ].map((row) => (
                <tr key={row.fw} className="border-b border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">{row.fw}</td>
                  <td className="py-2 px-3">{row.body}</td>
                  <td className="py-2 px-3">{row.type}</td>
                  <td className="py-2 px-3">{row.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link
          to="/compliance"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink size={14} />
          Explore all 48+ frameworks in the Compliance Tracker
        </Link>
      </div>
    </section>

    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <CheckCircle2 size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Reading the App: The Migrate Page</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          The{' '}
          <Link to="/migrate" className="text-primary hover:underline font-medium">
            /migrate page
          </Link>{' '}
          shows PQC readiness for products across 7 infrastructure layers. Each product&apos;s FIPS
          validation badge maps to a specific certification body and program.
        </p>
        <div className="space-y-3">
          <div className="bg-status-success/5 rounded-lg p-3 border border-status-success/20">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={14} className="text-status-success" />
              <span className="font-semibold text-sm text-foreground">
                FIPS Validated (green badge)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              The product has a current CMVP certificate (FIPS 140-3 or 140-2 approved). CMVP is the
              certification body; NIST/CSE administers it. Vendor is on the official NIST CMVP
              database.
            </p>
          </div>
          <div className="bg-status-warning/5 rounded-lg p-3 border border-status-warning/20">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} className="text-status-warning" />
              <span className="font-semibold text-sm text-foreground">Partial (amber badge)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Covers FedRAMP authorization, WebTrust audit, or FIPS-mode operation — partial
              certification evidence but not a full CMVP certificate.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={14} className="text-muted-foreground" />
              <span className="font-semibold text-sm text-foreground">No (gray badge)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              No CMVP certificate found. The product may claim PQC support but has not undergone
              formal certification.
            </p>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Also shown:</strong> CC certification badges (Common
            Criteria CCRA / EUCC) and ACVP algorithm validation (algorithm-level, below
            module-level). These link back to ENISA (EUCC) and NIST CAVP (ACVP) respectively.
          </p>
        </div>
        <Link
          to="/migrate"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink size={14} />
          Explore the PQC Migration Catalog
        </Link>
      </div>
    </section>

    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Network size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">
          The Full Standards → Certification → Compliance Pipeline
        </h2>
      </div>
      <div className="space-y-3 text-sm text-foreground/80">
        <p>
          Here is how NIST IR 8547, CMVP, and CNSA 2.0 work together in a single procurement
          scenario:
        </p>
        {[
          {
            n: 1,
            title: 'NIST publishes FIPS 203',
            body: 'Standards body',
            desc: 'Defines the ML-KEM algorithm specification, parameters (ML-KEM-512/768/1024), and security levels.',
          },
          {
            n: 2,
            title: 'ACVP test vectors released',
            body: 'NIST CAVP (algorithm testing)',
            desc: 'Automated test vectors for FIPS 203 allow vendors to run conformance tests against NIST reference implementations.',
          },
          {
            n: 3,
            title: 'CMVP lab validates module',
            body: 'Certification body',
            desc: 'An NVLAP-accredited lab tests the HSM firmware; CMVP (NIST/CSE) issues a FIPS 140-3 certificate. Takes 18–36 months.',
          },
          {
            n: 4,
            title: 'CNSA 2.0 mandate activates',
            body: 'Regulatory agency (NSA)',
            desc: 'NSA CNSA 2.0 requires federal agencies to use ML-KEM-1024 (from FIPS 203) exclusively by 2030 for NSS key establishment.',
          },
          {
            n: 5,
            title: 'Agency procurement requires CMVP certificate',
            body: 'Procurement',
            desc: 'Federal agency buyers verify the vendor product has a current CMVP certificate and the certificate covers FIPS 203 (ML-KEM) at the required security level.',
          },
        ].map((step) => (
          <div key={step.n} className="flex gap-3 bg-muted/50 rounded-lg p-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              {step.n}
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">{step.title}</div>
              <div className="text-xs text-primary mb-1">{step.body}</div>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </div>
          </div>
        ))}
        <div className="bg-status-warning/5 rounded-lg p-3 border border-status-warning/20">
          <p className="text-xs text-muted-foreground">
            <AlertTriangle size={12} className="inline text-status-warning mr-1" />
            <strong className="text-foreground">CMVP backlog warning:</strong> FIPS 140-3 validation
            takes 18–36 months. PQC-first certificates only began appearing in late 2024. Plan
            procurement timelines accounting for this certification lag.
          </p>
        </div>
      </div>
    </section>
  </div>
)

// ─── Step 5: IETF Working Groups + RFC Process + CTA ─────────────────────────

const Step5IETFProcess: React.FC<{ onNavigateToWorkshop: () => void }> = ({
  onNavigateToWorkshop,
}) => (
  <div className="space-y-8 max-w-4xl mx-auto">
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Network size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">
          IETF Working Groups &amp; the RFC Process
        </h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          The <InlineTooltip term="IETF">IETF</InlineTooltip> integrates NIST PQC algorithms into
          Internet protocols. Unlike NIST (which defines the algorithm), IETF defines how the
          algorithm is used in specific protocols. Both are standards bodies, but with different
          domains of authority.
        </p>
        <div className="space-y-3">
          {[
            {
              wg: 'PQUIP (Post-Quantum Use in Protocols)',
              role: 'Coordination WG',
              output:
                'draft-ietf-pquip-pqc-engineers — comprehensive PQC guide for protocol designers. Not a protocol itself — coordinates across all other WGs.',
            },
            {
              wg: 'LAMPS (Limited Additional Mechanisms for PKIX and SMIME)',
              role: 'CMS / PKIX PQC',
              output:
                'RFC 9629 (KEM in CMS), RFC 9882 (ML-DSA in CMS), RFC 9814 (SLH-DSA in CMS), composite signature drafts.',
            },
            {
              wg: 'TLS Working Group',
              role: 'TLS 1.3 PQC integration',
              output:
                'draft-ietf-tls-hybrid-design (X25519MLKEM768), now deployed in Chrome/Firefox/Cloudflare.',
            },
            {
              wg: 'COSE (CBOR Object Signing and Encryption)',
              role: 'IoT / CBOR-based PQC',
              output: 'PQC algorithm profiles for COSE headers (ML-DSA, SLH-DSA for IoT).',
            },
            {
              wg: 'SSH WG',
              role: 'SSH key exchange PQC',
              output: 'Hybrid ML-KEM/X25519 key exchange for SSH protocol.',
            },
          ].map((item) => (
            <div key={item.wg} className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="font-semibold text-sm text-foreground">{item.wg}</div>
              <div className="text-xs text-primary mb-1">{item.role}</div>
              <p className="text-xs text-muted-foreground">{item.output}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <BookOpen size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Reading the Standards Landscape</h2>
      </div>
      <div className="space-y-3 text-sm text-foreground/80">
        <p>A quick reference for interpreting standard citations:</p>
        {[
          {
            when: 'You see "FIPS 203"',
            meaning:
              'NIST published it (US standards body); CMVP certifies implementations; CNSA 2.0 mandates ML-KEM-1024 from it for NSS.',
          },
          {
            when: 'You see "RFC 9629"',
            meaning:
              'IETF LAMPS WG published it (global SDO); defines KEM use in CMS — a protocol standard built on FIPS 203.',
          },
          {
            when: 'You see "ETSI TS 103 744"',
            meaning:
              'ETSI TC CYBER published it (EU SDO); normative requirements for quantum-safe cryptography harmonized with NIST.',
          },
          {
            when: 'You see "BSI TR-02102-1"',
            meaning:
              'BSI published it (German governmental); binding for German critical infrastructure. Annual update.',
          },
          {
            when: 'You see "CNSA 2.0"',
            meaning:
              'NSA published it (US governmental); binding mandate for National Security Systems. References FIPS 203/204/205.',
          },
          {
            when: 'You see "EUCC"',
            meaning:
              'ENISA manages it (EU certification body); EU adaptation of Common Criteria; valid across all EU member states.',
          },
        ].map((item) => (
          <div key={item.when} className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="font-semibold text-xs text-primary mb-1">{item.when}</div>
            <p className="text-xs text-muted-foreground">{item.meaning}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Workshop CTA */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Puzzle size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Workshop Overview</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>Apply what you learned in 5 interactive workshop steps:</p>
        <div className="space-y-2">
          {[
            {
              n: 1,
              icon: '🧩',
              t: 'Body Classifier',
              d: 'Classify 12 organizations by type, scope, and authority. Color-coded feedback per attribute.',
            },
            {
              n: 2,
              icon: '🔍',
              t: 'Organization Explorer',
              d: 'Deep-dive into 12 key bodies — founding, decision-making, PQC outputs, and library references.',
            },
            {
              n: 3,
              icon: '🔗',
              t: 'Standards → Certification → Compliance Chain',
              d: 'Click-to-connect: trace 4 real-world chains from algorithm standard to certification to mandate.',
            },
            {
              n: 4,
              icon: '🗺️',
              t: 'Regional Coverage Grid',
              d: 'Interactive 5-region × 4-type matrix. Click cells to see which bodies operate there.',
            },
            {
              n: 5,
              icon: '💡',
              t: 'Scenario Challenge',
              d: '5 scored workplace scenarios with detailed explanations after each submission.',
            },
          ].map((step) => (
            <div key={step.n} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
              <span className="text-xl shrink-0">{step.icon}</span>
              <div>
                <div className="text-sm font-medium text-foreground">
                  Step {step.n}: {step.t}
                </div>
                <p className="text-xs text-muted-foreground">{step.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Related Modules */}
    <div className="glass-panel p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Related Modules</h3>
      <div className="flex flex-wrap gap-2">
        {[
          { path: '/learn/compliance-strategy', label: 'Compliance Strategy' },
          { path: '/learn/pqc-101', label: 'PQC 101' },
          { path: '/learn/pki-workshop', label: 'PKI Workshop' },
        ].map((m) => (
          <Link
            key={m.path}
            to={m.path}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-primary hover:text-primary/80 bg-primary/10 border border-primary/20 transition-colors"
          >
            <ArrowRight size={10} />
            {m.label}
          </Link>
        ))}
      </div>
    </div>

    <div className="text-center">
      <Button variant="gradient" size="lg" onClick={onNavigateToWorkshop}>
        Start Workshop <ArrowRight size={18} />
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        Classify bodies, explore organizations, trace compliance chains, and tackle real scenarios.
      </p>
    </div>
  </div>
)

// ─── Main Export ──────────────────────────────────────────────────────────────

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  const steps = [
    {
      label: 'Three Roles',
      content: <Step1ThreeRoles />,
    },
    {
      label: 'Gov vs Non-Gov',
      content: <Step2GovVsNonGov />,
    },
    {
      label: 'Global & Regional',
      content: <Step3GlobalRegional />,
    },
    {
      label: 'App Pages Guide',
      content: <Step4AppPagesGuide />,
    },
    {
      label: 'IETF & RFC Process',
      content: <Step5IETFProcess onNavigateToWorkshop={onNavigateToWorkshop} />,
    },
  ]

  return <LearnStepper steps={steps} />
}
