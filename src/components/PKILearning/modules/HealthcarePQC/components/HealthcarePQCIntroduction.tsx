// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Fingerprint,
  FlaskConical,
  HeartPulse,
  Activity,
  Building2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Shield,
  Cpu,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'

// -- Local CollapsibleSection ------------------------------------------------

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="glass-panel overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
          <h2 className="text-xl font-bold text-gradient">{title}</h2>
        </div>
        {isOpen ? (
          <ChevronUp size={20} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown size={20} className="text-muted-foreground shrink-0" />
        )}
      </button>
      {isOpen && <div className="px-6 pb-6 space-y-4">{children}</div>}
    </section>
  )
}

// -- Introduction Component --------------------------------------------------

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

export const HealthcarePQCIntroduction: React.FC<IntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* -- Section 1: Biometric Data ---------------------------------------- */}
      <CollapsibleSection
        title="Biometric Data: The Irreplaceable Secret"
        icon={<Fingerprint size={24} className="text-primary" />}
        defaultOpen={true}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Healthcare organizations are custodians of the most sensitive category of personal data:
            biometrics. Unlike passwords, API keys, or even Social Security numbers, biometric
            identifiers &mdash; fingerprints, iris scans, facial geometry, and DNA profiles &mdash;
            are <strong>permanently bound to an individual</strong>. They cannot be rotated,
            revoked, or reissued after a breach.
          </p>

          <p>
            The{' '}
            <InlineTooltip term="HNDL">
              <strong>Harvest Now, Decrypt Later (HNDL)</strong>
            </InlineTooltip>{' '}
            threat makes biometric databases an extraordinarily high-value target for adversaries
            with long time horizons. Nation-state actors can intercept and store encrypted biometric
            data today, knowing that a future cryptographically relevant quantum computer (CRQC)
            will allow them to decrypt the entire archive.
          </p>

          {/* OPM breach case study */}
          <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-status-error shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  Case Study: OPM Breach (2015)
                </h4>
                <p className="text-xs text-muted-foreground">
                  The U.S. Office of Personnel Management breach exposed{' '}
                  <strong>5.6 million fingerprint records</strong> alongside 21.5 million background
                  investigation files. Over a decade later, every affected individual&apos;s
                  fingerprints remain compromised &mdash; and will remain so for life. Had genomic
                  or iris data been included, the damage would extend across generations.
                </p>
              </div>
            </div>
          </div>

          {/* Revocable vs permanent comparison */}
          <h4 className="text-sm font-bold text-foreground">Revocable vs. Permanent Credentials</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-status-success/10 rounded-lg p-4 border border-status-success/20">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <ShieldCheck size={16} className="text-status-success" />
                Revocable Credentials
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>&bull; Passwords &mdash; reset immediately after breach</li>
                <li>&bull; X.509 certificates &mdash; revoke via CRL or OCSP</li>
                <li>&bull; API keys / tokens &mdash; rotate programmatically</li>
                <li>&bull; Smart cards / PIV &mdash; reissue replacement</li>
                <li>&bull; SSH keys &mdash; regenerate key pair</li>
              </ul>
            </div>
            <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-status-error" />
                Permanent Biometrics (Irrevocable)
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>&bull; Fingerprints &mdash; cannot be changed</li>
                <li>&bull; Iris patterns &mdash; stable for life</li>
                <li>&bull; Facial geometry &mdash; persists across aging</li>
                <li>&bull; DNA profile &mdash; immutable, shared with relatives</li>
                <li>&bull; Voice print &mdash; difficult to fundamentally alter</li>
              </ul>
            </div>
          </div>

          {/* Key insight */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              Key Insight
            </h4>
            <p className="text-xs text-muted-foreground">
              A quantum computer decrypting a biometric database doesn&apos;t just breach data
              &mdash; it <strong>permanently compromises every identity in that database</strong>.
              Unlike a password breach where users can reset credentials, a biometric breach is
              irreversible. This makes pre-quantum encryption of biometric data stores one of the
              highest-priority PQC migration targets in healthcare.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* -- Section 2: Pharmaceutical IP ------------------------------------- */}
      <CollapsibleSection
        title="Pharmaceutical IP & Research Data Protection"
        icon={<FlaskConical size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Bringing a new drug to market costs an average of <strong>$2.6 billion</strong> and
            takes 10&ndash;15 years from discovery to FDA approval. Every stage of this pipeline
            generates data that represents billions of dollars in competitive advantage &mdash; from
            molecular structures and synthesis routes to clinical trial results and regulatory
            submissions.
          </p>

          <p>
            Applying the Mosca Inequality to pharmaceutical data reveals why the industry must act
            now. If the <strong>security shelf life</strong> of a compound&apos;s data (typically
            20+ years until patent expiry) plus the <strong>migration time</strong> to PQC
            (estimated 5&ndash;10 years for pharmaceutical IT) exceeds the time until a CRQC
            arrives, then the data is already at risk of HNDL harvesting.
          </p>

          {/* Drug pipeline data assets */}
          <h4 className="text-sm font-bold text-foreground">Data Assets by Pipeline Phase</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                phase: 'Discovery',
                years: '3-6 years',
                assets: 'Molecular structures, target proteins, AI/ML models, compound libraries',
                value: '$50-200M invested',
              },
              {
                phase: 'Preclinical',
                years: '1-3 years',
                assets:
                  'Toxicology data, animal study results, formulation IP, bioavailability data',
                value: '$100-400M invested',
              },
              {
                phase: 'Clinical Trials',
                years: '6-7 years',
                assets: 'Patient data (PHI), efficacy results, adverse events, randomization codes',
                value: '$500M-2B invested',
              },
              {
                phase: 'Regulatory / Post-Market',
                years: '1-2 years',
                assets:
                  'NDA/BLA filings, manufacturing processes, post-market surveillance, real-world evidence',
                value: '$2-3B total',
              },
            ].map((item) => (
              <div key={item.phase} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-bold text-foreground">{item.phase}</div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/30 font-medium">
                    {item.years}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{item.assets}</p>
                <p className="text-xs font-bold text-primary">{item.value}</p>
              </div>
            ))}
          </div>

          {/* 21 CFR Part 11 */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              <InlineTooltip term="21 CFR Part 11">
                <strong>FDA 21 CFR Part 11</strong>
              </InlineTooltip>
            </h4>
            <p className="text-xs text-muted-foreground">
              FDA 21 CFR Part 11 establishes requirements for electronic records and electronic
              signatures in pharmaceutical manufacturing and clinical trials. It mandates that
              electronic records must be{' '}
              <strong>trustworthy, reliable, and equivalent to paper records</strong>. Digital
              signatures used under Part 11 rely on RSA or ECDSA &mdash; both quantum-vulnerable. A
              CRQC could forge signatures on regulatory submissions, batch release records, or
              clinical trial data, undermining the entire chain of trust that supports drug safety.
            </p>
          </div>

          {/* Mosca warning */}
          <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/20">
            <div className="flex items-start gap-2">
              <Clock size={16} className="text-status-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  Mosca Inequality for Pharma
                </h4>
                <p className="text-xs text-muted-foreground">
                  A drug in Phase I trials today will have data requiring protection for 20+ years
                  (patent life + data exclusivity). If PQC migration takes 7 years and CRQC arrives
                  in 2035, the Mosca window has already closed: <strong>20 + 7 &gt; 9</strong>.
                  Competitors or nation-state actors harvesting encrypted trial data today could
                  decrypt it before the drug&apos;s patent expires, stealing billions in R&amp;D
                  investment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* -- Section 3: Patient Privacy --------------------------------------- */}
      <CollapsibleSection
        title="Patient Privacy as a Fundamental Right"
        icon={<HeartPulse size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Patient privacy extends far beyond HIPAA. A comprehensive healthcare privacy framework
            must account for multiple overlapping regulatory regimes, each protecting different
            categories of sensitive health data with varying retention requirements and disclosure
            restrictions.
          </p>

          <p>
            <InlineTooltip term="GINA">
              <strong>The Genetic Information Nondiscrimination Act (GINA)</strong>
            </InlineTooltip>{' '}
            prohibits the use of genetic information in employment and health insurance decisions.
            Separately,{' '}
            <InlineTooltip term="42 CFR Part 2">
              <strong>42 CFR Part 2</strong>
            </InlineTooltip>{' '}
            imposes even stricter protections than HIPAA on substance use disorder treatment
            records, requiring patient consent for virtually any disclosure &mdash; including to
            other treating physicians.
          </p>

          {/* Privacy categories */}
          <h4 className="text-sm font-bold text-foreground">Privacy-Sensitive Data Categories</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Category</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Regulation</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">Retention</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">HNDL Risk</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    category: 'General PHI',
                    regulation: 'HIPAA',
                    retention: '6-10 years',
                    risk: 'high',
                  },
                  {
                    category: 'Pediatric Records',
                    regulation: 'HIPAA + State Laws',
                    retention: '25+ years',
                    risk: 'critical',
                  },
                  {
                    category: 'Genomic Data',
                    regulation: 'GINA + HIPAA',
                    retention: 'Lifetime + generational',
                    risk: 'critical',
                  },
                  {
                    category: 'Substance Abuse',
                    regulation: '42 CFR Part 2',
                    retention: 'Indefinite',
                    risk: 'critical',
                  },
                  {
                    category: 'Mental Health',
                    regulation: 'HIPAA + State Laws',
                    retention: '10-25 years',
                    risk: 'high',
                  },
                  {
                    category: 'Reproductive Health',
                    regulation: 'HIPAA + State Laws',
                    retention: '10+ years',
                    risk: 'high',
                  },
                ].map((row) => (
                  <tr key={row.category} className="border-b border-border/50">
                    <td className="p-2 text-xs font-bold text-foreground">{row.category}</td>
                    <td className="p-2 text-xs text-muted-foreground">{row.regulation}</td>
                    <td className="p-2 text-center text-xs text-foreground">{row.retention}</td>
                    <td className="p-2 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                          row.risk === 'critical'
                            ? 'bg-status-error/20 text-status-error border-status-error/50'
                            : 'bg-status-warning/20 text-status-warning border-status-warning/50'
                        }`}
                      >
                        {row.risk.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stigma amplifier */}
          <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-status-error shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  The Stigma Amplifier Effect
                </h4>
                <p className="text-xs text-muted-foreground">
                  Certain health data categories &mdash; substance abuse treatment, mental health
                  diagnoses, HIV status, reproductive decisions &mdash; carry significant social
                  stigma. A quantum-enabled breach of these records doesn&apos;t just violate
                  privacy; it can destroy careers, relationships, and lives. The harm is amplified
                  because health stigma data, once exposed, cannot be &quot;un-known&quot; by those
                  who see it. This makes <strong>long-retention stigma data</strong> the
                  highest-priority category for PQC migration in healthcare.
                </p>
              </div>
            </div>
          </div>

          {/* Generational risk */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <HeartPulse size={16} className="text-primary" />
              Genomic Data: A Generational Risk
            </h4>
            <p className="text-xs text-muted-foreground">
              Genomic data is unique because it is both <strong>lifetime-persistent</strong> (your
              genome never changes) and <strong>generational</strong> (it reveals information about
              parents, children, and siblings). A pediatric patient&apos;s genomic sequence
              collected today must remain confidential for 100+ years &mdash; well beyond any
              reasonable CRQC timeline. This data is an immediate HNDL target and requires PQC
              protection now, not after a regulatory mandate.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* -- Section 4: Medical Device Safety --------------------------------- */}
      <CollapsibleSection
        title="Medical Device Safety & PQC"
        icon={<Activity size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            In healthcare, cryptographic failure is not just a data breach &mdash; it can be a{' '}
            <strong>patient safety event</strong>. The{' '}
            <InlineTooltip term="IoMT">
              <strong>Internet of Medical Things (IoMT)</strong>
            </InlineTooltip>{' '}
            encompasses insulin pumps, cardiac pacemakers, infusion controllers, and surgical robots
            &mdash; devices where a forged firmware update or injected command could directly harm
            or kill a patient.
          </p>

          {/* FDA device classes */}
          <h4 className="text-sm font-bold text-foreground">
            FDA Device Classification &amp; PQC Impact
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                cls: 'Class I',
                desc: 'Low risk (bandages, tongue depressors)',
                pqc: 'Minimal crypto dependency',
                color: 'bg-status-success/10 border-status-success/20',
              },
              {
                cls: 'Class II',
                desc: 'Moderate risk (infusion pumps, CT scanners)',
                pqc: 'Network-connected, TLS/firmware signing',
                color: 'bg-status-warning/10 border-status-warning/20',
              },
              {
                cls: 'Class III',
                desc: 'High risk (pacemakers, defibrillators)',
                pqc: 'Life-critical, constrained hardware',
                color: 'bg-status-error/10 border-status-error/20',
              },
            ].map((item) => (
              <div key={item.cls} className={`rounded-lg p-4 border ${item.color}`}>
                <div className="text-sm font-bold text-foreground mb-1">{item.cls}</div>
                <p className="text-xs text-muted-foreground mb-2">{item.desc}</p>
                <p className="text-xs font-medium text-foreground">{item.pqc}</p>
              </div>
            ))}
          </div>

          {/* Constrained devices */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              Constrained Device Challenge
            </h4>
            <p className="text-xs text-muted-foreground mb-2">
              Many implantable and wearable medical devices operate on severely resource-constrained
              processors. A typical cardiac pacemaker uses an <strong>ARM Cortex-M0+</strong> with
              only <strong>32 KB of RAM</strong> and a 48 MHz clock. ML-DSA-44, the smallest NIST
              PQC signature algorithm, requires approximately 90 KB of RAM for signing &mdash;
              nearly 3x the total available memory.
            </p>
            <p className="text-xs text-muted-foreground">
              For these constrained devices, <strong>hash-based signatures</strong> like LMS (H5/W8)
              and XMSS (H10) are the only feasible PQC options, requiring only 4&ndash;5 KB of RAM
              for verification. However, they are stateful &mdash; the device must track which
              one-time keys have been used, adding complexity to firmware update mechanisms.
            </p>
          </div>

          {/* Real incidents */}
          <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-status-error shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  Real-World Medical Device Security Incidents
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>
                    &bull; <strong>465,000+ pacemaker recall (2017)</strong> &mdash; St. Jude
                    Medical / Abbott recalled nearly half a million pacemakers due to firmware
                    vulnerabilities that could allow unauthorized access to modify pacing commands,
                    potentially causing battery depletion or inappropriate pacing.
                  </li>
                  <li>
                    &bull; <strong>MedJack attacks</strong> &mdash; attackers compromise medical
                    devices (infusion pumps, X-ray systems, blood gas analyzers) to establish
                    persistent network footholds within hospital networks. These devices often run
                    outdated operating systems with no crypto agility.
                  </li>
                  <li>
                    &bull; <strong>Insulin pump vulnerabilities</strong> &mdash; researchers
                    demonstrated remote command injection on insulin pumps, capable of delivering
                    lethal doses. Firmware integrity verification relied on RSA-1024 signatures.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Cross-reference to IoT/OT module */}
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-start gap-2">
              <Shield size={16} className="text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  IoT &amp; OT Security Module
                </h4>
                <p className="text-xs text-muted-foreground">
                  For general IoT/OT PQC challenges including constrained device cryptography, OTA
                  update signing, and industrial control system migration, see the{' '}
                  <Link
                    to="/learn/iot-ot-pqc"
                    className="text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    IoT &amp; OT Security
                  </Link>{' '}
                  module.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* -- Section 5: Sector-Wide Migration --------------------------------- */}
      <CollapsibleSection
        title="Healthcare PQC Migration: A Sector-Wide Challenge"
        icon={<Building2 size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Healthcare PQC migration is uniquely complex because hospitals operate a deeply
            interconnected technology stack where every layer has distinct cryptographic
            dependencies, vendor constraints, and regulatory approval requirements.
          </p>

          {/* 7-layer architecture */}
          <h4 className="text-sm font-bold text-foreground">7-Layer Hospital Architecture</h4>
          <div className="space-y-2">
            {[
              {
                layer: '1. Patient Portal & Web',
                desc: 'TLS termination, OAuth/OIDC tokens, session cookies',
                priority: 'Highest',
                color: 'bg-status-error/10 border-status-error/20',
              },
              {
                layer: '2. EHR / EMR Systems',
                desc: 'HL7v2 MLLP, FHIR REST APIs, database encryption at rest',
                priority: 'High',
                color: 'bg-status-error/10 border-status-error/20',
              },
              {
                layer: '3. Clinical Applications',
                desc: 'CPOE, pharmacy, lab systems, clinical decision support',
                priority: 'High',
                color: 'bg-status-warning/10 border-status-warning/20',
              },
              {
                layer: '4. Medical Imaging (PACS/DICOM)',
                desc: 'DICOM TLS, image integrity signatures, archive encryption',
                priority: 'Medium',
                color: 'bg-status-warning/10 border-status-warning/20',
              },
              {
                layer: '5. Medical Devices & IoMT',
                desc: 'Firmware signing, device authentication, telemetry encryption',
                priority: 'Critical',
                color: 'bg-status-error/10 border-status-error/20',
              },
              {
                layer: '6. Research & Genomics',
                desc: 'Genomic data encryption, clinical trial databases, research collaboration',
                priority: 'Critical',
                color: 'bg-status-error/10 border-status-error/20',
              },
              {
                layer: '7. Administrative & Billing',
                desc: 'Claims processing (X12/EDI), payment systems, HR/credentialing',
                priority: 'Medium',
                color: 'bg-status-warning/10 border-status-warning/20',
              },
            ].map((item) => (
              <div key={item.layer} className={`rounded-lg p-3 border ${item.color}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-bold text-foreground">{item.layer}</div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                      item.priority === 'Critical'
                        ? 'bg-status-error/20 text-status-error border-status-error/50'
                        : item.priority === 'Highest' || item.priority === 'High'
                          ? 'bg-status-warning/20 text-status-warning border-status-warning/50'
                          : 'bg-primary/20 text-primary border-primary/50'
                    }`}
                  >
                    {item.priority.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Interoperability */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-2">
              Interoperability: HL7, FHIR &amp; DICOM
            </h4>
            <p className="text-xs text-muted-foreground mb-2">
              Healthcare data exchange relies on standards that were designed decades before PQC was
              a consideration. <strong>HL7 v2</strong> messages often travel over MLLP (Minimal
              Lower Layer Protocol) with no encryption at all. <strong>FHIR</strong> (Fast
              Healthcare Interoperability Resources) uses REST/TLS but currently only specifies
              RSA/ECDSA for signatures. <strong>DICOM</strong> supports TLS for image transfer but
              has no PQC cipher suite definitions.
            </p>
            <p className="text-xs text-muted-foreground">
              Migrating these protocols to PQC requires coordinated updates across hundreds of
              vendors, thousands of implementations, and multiple standards bodies (HL7
              International, IHE, DICOM Committee). No single hospital can migrate in isolation.
            </p>
          </div>

          {/* Regulatory delays */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Clock size={14} className="text-primary" />
                FDA 510(k) Approval Delays
              </h4>
              <p className="text-xs text-muted-foreground">
                Any change to a medical device&apos;s cryptographic subsystem may require a new{' '}
                <strong>510(k) premarket notification</strong> or even a full PMA (Premarket
                Approval). The FDA review process takes <strong>3&ndash;12 months</strong>, during
                which the device cannot ship with the update. For Class III devices (pacemakers,
                defibrillators), the approval timeline can extend to 18+ months.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Building2 size={14} className="text-primary" />
                Device Lifetimes
              </h4>
              <p className="text-xs text-muted-foreground">
                Medical devices have operational lifetimes of <strong>15&ndash;20 years</strong>,
                with some MRI machines and radiation therapy systems lasting 25+ years. Many of
                these devices cannot be remotely updated and will never receive PQC firmware. The
                migration strategy for these legacy devices must focus on network segmentation and
                cryptographic gateways rather than device-level upgrades.
              </p>
            </div>
          </div>

          {/* HSCC and H-ISAC */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="text-sm font-bold text-foreground mb-2">
              Sector Coordination: HSCC &amp; H-ISAC
            </h4>
            <p className="text-xs text-muted-foreground">
              The <strong>Health Sector Coordinating Council (HSCC)</strong> and the{' '}
              <strong>Health Information Sharing and Analysis Center (H-ISAC)</strong> are the
              primary coordinating bodies for healthcare cybersecurity in the United States. HSCC
              publishes the Health Industry Cybersecurity Practices (HICP) guidelines, while H-ISAC
              provides threat intelligence and incident response coordination. Both organizations
              are actively developing PQC transition guidance for the healthcare sector, including
              recommended migration timelines and priority frameworks.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* -- Workshop CTA ----------------------------------------------------- */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-foreground">Ready to assess healthcare PQC risks?</h3>
            <p className="text-sm text-muted-foreground">
              Explore biometric threat assessments, pharma IP exposure calculators, patient privacy
              mapping, device safety simulations, and hospital migration planning in the interactive
              workshop.
            </p>
          </div>
          <Button variant="gradient" onClick={onNavigateToWorkshop} className="shrink-0">
            Start Workshop <ArrowRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/iot-ot-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Cpu size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">IoT &amp; OT Security</div>
              <div className="text-xs text-muted-foreground">PQC for implantable devices, monitors, and hospital OT networks</div>
            </div>
          </Link>
          <Link
            to="/learn/compliance-strategy"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Compliance Strategy</div>
              <div className="text-xs text-muted-foreground">HIPAA, FDA 510(k), and NIS2 quantum-readiness requirements</div>
            </div>
          </Link>
          <Link
            to="/learn/pqc-risk-management"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <AlertTriangle size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">PQC Risk Management</div>
              <div className="text-xs text-muted-foreground">Risk registers for patient data and long-lifecycle medical records</div>
            </div>
          </Link>
        </div>
      </section>
      <VendorCoverageNotice migrateLayer="Application" />

      {/* -- Reading Complete ------------------------------------------------- */}
      <ReadingCompleteButton />
    </div>
  )
}
