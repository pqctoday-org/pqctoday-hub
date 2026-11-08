// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import {
  Fingerprint,
  FlaskConical,
  HeartPulse,
  Activity,
  Building2,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Shield,
  Cpu,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import { HEALTHCARE_DATA_PROFILES } from '../data/healthcareConstants'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { LearnSection } from '@/components/PKILearning/common/LearnSection'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'

// -- Local CollapsibleSection ------------------------------------------------

// The local CollapsibleSection was replaced by the shared anchored
// LearnSection (2026-07-30): industry deep links now land on a section,
// and per-section reading is recorded instead of only the button below.

// -- Introduction Component --------------------------------------------------

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

export const HealthcarePQCIntroduction: React.FC<IntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-8 w-full">
      {/* -- Section 1: Biometric Data ---------------------------------------- */}
      <LearnSection
        sectionId="biometric-threat"
        title="Biometric Data: The Irreplaceable Secret"
        icon={<Fingerprint size={24} className="text-primary" />}
        defaultOpen={true}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Healthcare organizations are custodians of the most sensitive category of personal data:
            biometrics. Unlike passwords, API keys, or even Social Security numbers, biometric
            identifiers &mdash; fingerprints, iris scans, facial geometry, and DNA profiles &mdash;
            are <strong>bound to an individual</strong>. The underlying trait cannot be rotated or
            reissued the way a password can, and a raw sample that leaks cannot be taken back. What
            a breach costs depends on what was stored and on how the biometric is used to
            authenticate.
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
                <h3 className="text-sm font-bold text-foreground mb-1">
                  Case Study: OPM Breach (2015)
                </h3>
                <p className="text-xs text-muted-foreground">
                  The U.S. Office of Personnel Management&apos;s September 2015 update said that the
                  fingerprints of approximately <strong>5.6 million</strong> of the 21.5 million
                  people whose Social Security numbers and other sensitive information were impacted
                  had been stolen. Those fingerprints cannot be changed. OPM said at the time that
                  federal experts believed the ability to misuse fingerprint data was limited, but
                  that this could change as technology evolves: the breach was a confidentiality
                  harm, and how far it enables impersonation depends on whether verifiers detect
                  presentation attacks and require a second factor. Had genomic data been included,
                  the exposure would also reach biological relatives, and no one can change their
                  genome.
                </p>
              </div>
            </div>
          </div>

          {/* Revocable vs permanent comparison */}
          <h3 className="text-sm font-bold text-foreground">Revocable vs. Permanent Credentials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-status-success/10 rounded-lg p-4 border border-status-success/20">
              <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <ShieldCheck size={16} className="text-status-success" />
                Revocable Credentials
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>&bull; Passwords &mdash; reset immediately after breach</li>
                <li>&bull; X.509 certificates &mdash; revoke via CRL or OCSP</li>
                <li>&bull; API keys / tokens &mdash; rotate programmatically</li>
                <li>&bull; Smart cards / PIV &mdash; reissue replacement</li>
                <li>&bull; SSH keys &mdash; regenerate key pair</li>
              </ul>
            </div>
            <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
              <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-status-error" />
                Biometric Traits (Hard to Change)
              </h3>
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
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              Key Insight
            </h3>
            <p className="text-xs text-muted-foreground">
              A quantum computer decrypting a biometric database exposes what was stored; it does
              not by itself let anyone sign in as those people. Keep four things apart. The{' '}
              <strong>trait</strong> cannot be changed. A <strong>raw sample</strong> that leaks can
              be reused, so collect and keep as little as possible and delete what is no longer
              needed. A stored <strong>template</strong> can be protected, and template-protection
              schemes can make it revocable, although NIST SP 800-63B-4 notes that the availability
              of such solutions is limited. An <strong>authentication attack</strong> is a separate
              question: NIST SP 800-63B-4 says biometric characteristics are not secrets and can
              often be obtained without consent, so it allows biometrics only as part of
              multi-factor authentication with a physical authenticator, expects presentation attack
              detection (PAD) and an alternative non-biometric option, and prefers comparison on the
              user&apos;s own device over a central store. Pre-quantum encryption of biometric data
              stores remains a strong candidate for early PQC migration, because the confidentiality
              harm cannot be undone by the individual, but PAD, a second factor and local comparison
              are what limit the authentication risk.
            </p>
          </div>
        </div>
      </LearnSection>

      {/* -- Section 2: Pharmaceutical IP ------------------------------------- */}
      <LearnSection
        sectionId="pharma-ip"
        title="Pharmaceutical IP & Research Data Protection"
        icon={<FlaskConical size={24} className="text-primary" />}
      >
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Bringing a new drug to market costs <strong>billions of dollars</strong> and takes
            10&ndash;15 years from discovery to FDA approval. Every stage of this pipeline generates
            data that represents billions of dollars in competitive advantage &mdash; from molecular
            structures and synthesis routes to clinical trial results and regulatory submissions.
          </p>

          <p>
            Applying the Mosca Inequality to pharmaceutical data reveals why the industry must act
            now. If the <strong>security shelf life</strong> of a compound&apos;s data (a sample 20
            years here; the real figure depends on the patent filing date and remaining term,
            regulatory exclusivities and trade-secret value) plus the{' '}
            <strong>migration time</strong> to PQC (a sample 5&ndash;10 years for pharmaceutical IT)
            exceeds the time until a CRQC arrives, then the data is already at risk of HNDL
            harvesting.
          </p>

          {/* Drug pipeline data assets */}
          <h3 className="text-sm font-bold text-foreground">Data Assets by Pipeline Phase</h3>
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
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              <InlineTooltip term="21 CFR Part 11">
                <strong>FDA 21 CFR Part 11</strong>
              </InlineTooltip>
            </h3>
            <p className="text-xs text-muted-foreground">
              FDA 21 CFR Part 11 establishes requirements for electronic records and electronic
              signatures in pharmaceutical manufacturing and clinical trials. It mandates that
              electronic records must be{' '}
              <strong>trustworthy, reliable, and equivalent to paper records</strong>. Part 11 names
              no signature algorithm, but the electronic signatures deployed today typically use RSA
              or ECDSA &mdash; both quantum-vulnerable. A CRQC could forge signatures on regulatory
              submissions, batch release records, or clinical trial data, undermining the chain of
              trust that supports drug safety. How long those records must be kept comes from the
              applicable predicate rule (for example 21 CFR 312.62(c)), not from Part 11 itself.
            </p>
          </div>

          {/* Mosca warning */}
          <div className="bg-status-warning/10 rounded-lg p-4 border border-status-warning/20">
            <div className="flex items-start gap-2">
              <Clock size={16} className="text-status-warning shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">
                  Mosca Inequality for Pharma
                </h3>
                <p className="text-xs text-muted-foreground">
                  Take a sample drug whose trial data needs 20 years of confidentiality (a US patent
                  term runs 20 years from filing and much of it is used during development, so real
                  horizons differ by product). If PQC migration takes 7 years and CRQC arrives in
                  2035, nine years away, the Mosca window has already closed:{' '}
                  <strong>20 + 7 &gt; 9</strong>. Competitors or nation-state actors harvesting
                  encrypted trial data today could decrypt it while it still has competitive value.
                </p>
              </div>
            </div>
          </div>
        </div>
      </LearnSection>

      {/* -- Section 3: Patient Privacy --------------------------------------- */}
      <LearnSection
        sectionId="patient-privacy"
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
            imposes stricter protections than HIPAA on substance use disorder treatment records.
            Under the 2024 final rule, with compliance required from February 2026, one patient
            consent can cover all future uses and disclosures for treatment, payment and health care
            operations, so do not assume a separate consent for every disclosure. Confirm the
            consent scope that applies to a given record flow.
          </p>

          {/* Privacy categories */}
          <h3 className="text-sm font-bold text-foreground">Privacy-Sensitive Data Categories</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Category</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Regulation</th>
                  <th className="text-center p-2 text-muted-foreground font-medium">
                    Sample planning horizon
                  </th>
                  <th className="text-center p-2 text-muted-foreground font-medium">HNDL Risk</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    category: 'General health records',
                    regulation: 'HIPAA + State Laws',
                    profile: 'adult-ehr',
                    risk: 'high',
                  },
                  {
                    category: 'Pediatric Records',
                    regulation: 'HIPAA + State Laws',
                    profile: 'pediatric-ehr',
                    risk: 'critical',
                  },
                  {
                    category: 'Genomic Data',
                    regulation: 'GINA + HIPAA',
                    profile: 'genomic',
                    risk: 'critical',
                  },
                  {
                    category: 'Substance Abuse',
                    regulation: '42 CFR Part 2',
                    profile: 'substance-abuse',
                    risk: 'critical',
                  },
                  {
                    category: 'Mental Health',
                    regulation: 'HIPAA + State Laws',
                    profile: 'mental-health',
                    risk: 'high',
                  },
                  {
                    category: 'Reproductive Health',
                    regulation: 'HIPAA + State Laws',
                    profile: 'reproductive-health',
                    risk: 'high',
                  },
                ].map((row) => (
                  <tr key={row.category} className="border-b border-border/50">
                    <td className="p-2 text-xs font-bold text-foreground">{row.category}</td>
                    <td className="p-2 text-xs text-muted-foreground">{row.regulation}</td>
                    <td className="p-2 text-center text-xs text-foreground">
                      {HEALTHCARE_DATA_PROFILES.find((p) => p.id === row.profile)
                        ?.trueRetentionYears ?? '—'}{' '}
                      years
                    </td>
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
          <p className="text-xs text-muted-foreground">
            The horizons above are the same sample planning assumptions the Patient Privacy Mapper
            uses, not legal retention periods. HIPAA&apos;s 6-year rule covers required compliance
            documentation; medical-record retention is set mainly by state law and varies by record
            type.
          </p>

          {/* Stigma amplifier */}
          <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-status-error shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">
                  The Stigma Amplifier Effect
                </h3>
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
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <HeartPulse size={16} className="text-primary" />
              Genomic Data: A Generational Risk
            </h3>
            <p className="text-xs text-muted-foreground">
              Genomic information can remain sensitive across a person's lifetime and can reveal
              information about relatives. Choose confidentiality-lifetime assumptions for the
              particular use case, then compare them with migration time and quantum-threat
              assumptions. A century-long example is an illustrative planning input, not a universal
              confidentiality or retention requirement.
            </p>
          </div>
        </div>
      </LearnSection>

      {/* -- Section 4: Medical Device Safety --------------------------------- */}
      <LearnSection
        sectionId="device-safety"
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
          <h3 className="text-sm font-bold text-foreground">
            FDA Device Classification &amp; PQC Impact
          </h3>
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
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
              <Activity size={16} className="text-primary" />
              Constrained Device Challenge
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              Many implantable and wearable medical devices operate on severely resource-constrained
              processors. For illustration, this module models a pacemaker-class device as an{' '}
              <strong>ARM Cortex-M0+</strong> with only <strong>32 KB of RAM</strong> and a 48 MHz
              clock. This module assumes that ML-DSA-44, the smallest ML-DSA parameter set, needs
              more RAM than the whole 32 KB in the portable implementation it models (a planning
              assumption, not a measurement; a published Cortex-M4F measurement of a stack-optimised
              build is far lower, so the result depends on the implementation chosen).
            </p>
            <p className="text-xs text-muted-foreground">
              In a firmware update the device only verifies, so the question is the cost of
              verification. In this module&apos;s model, <strong>hash-based signatures</strong> like
              LMS (H5/W8) and XMSS (H10) fit, with verification needing a few KB of RAM (also a
              planning assumption). FN-DSA (Falcon) is modelled as feasible for verification too:
              its floating-point cost is in signing, which the manufacturer&apos;s signing system
              bears, while verification is integer-only. The hash-based schemes are stateful, but
              the state belongs to the signer: its signing system must make sure that no one-time
              key ever signs two messages (NIST SP 800-208) and must update its stored state before
              it exports each signature, so that a crash cannot lead to key reuse. The pacemaker
              holds no such state. A firmware version counter that refuses older images
              (anti-rollback) is a separate mechanism that a device may keep in addition.
            </p>
          </div>

          {/* Real incidents */}
          <div className="bg-status-error/10 rounded-lg p-4 border border-status-error/20">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-status-error shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-foreground mb-1">
                  Real-World Medical Device Security Incidents
                </h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>
                    &bull;{' '}
                    <strong>
                      Abbott (formerly St. Jude Medical) pacemaker vulnerabilities (2017, FDA safety
                      communication and ICS Medical Advisory ICSMA-17-241-01)
                    </strong>{' '}
                    &mdash; the advisory says a nearby attacker could gain unauthorized access to an
                    affected pacemaker and issue commands, change settings, or otherwise interfere
                    with its intended function. The pacemaker&apos;s authentication algorithm could
                    be compromised or bypassed, and the devices did not limit &ldquo;RF
                    wake-up&rdquo; commands, which could be sent repeatedly to reduce battery life.
                    Abbott&apos;s mitigation was a firmware update applied by a healthcare provider.
                    This was an ordinary authentication and rate-limiting weakness that needed no
                    quantum computer; the quantum scenarios in the device simulator are hypothetical
                    devices and are kept separate from it.
                  </li>
                  <li>
                    &bull; <strong>MedJack attacks</strong> &mdash; attackers compromise medical
                    devices (infusion pumps, X-ray systems, blood gas analyzers) to establish
                    persistent network footholds within hospital networks. These devices often run
                    outdated operating systems with no crypto agility.
                  </li>
                  <li>
                    &bull; <strong>Insulin pump vulnerabilities</strong> &mdash; FDA has described a
                    wireless vulnerability in a marketed insulin pump family in which a nearby
                    unauthorized person could potentially connect and change settings or insulin
                    delivery. The cryptographic details differ by product, so ask a manufacturer
                    what authenticates commands and protects firmware updates rather than assuming
                    one algorithm.
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
                <h3 className="text-sm font-bold text-foreground mb-1">
                  IoT &amp; Embedded Device PQC module
                </h3>
                <p className="text-xs text-muted-foreground">
                  For general IoT/OT PQC challenges including constrained device cryptography, OTA
                  update signing, and industrial control system migration, see the{' '}
                  <Link
                    to="/learn/iot-pqc"
                    className="text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    IoT &amp; Embedded Device PQC
                  </Link>{' '}
                  module.
                </p>
              </div>
            </div>
          </div>
        </div>
      </LearnSection>

      {/* -- Section 5: Sector-Wide Migration --------------------------------- */}
      <LearnSection
        sectionId="healthcare-migration"
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
          <h3 className="text-sm font-bold text-foreground">7-Layer Hospital Architecture</h3>
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
            <h3 className="text-sm font-bold text-foreground mb-2">
              Interoperability: HL7, FHIR &amp; DICOM
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              Healthcare data exchange relies on standards that were designed decades before PQC was
              a consideration. <strong>HL7 v2</strong> messages often travel over MLLP (Minimal
              Lower Layer Protocol) with no encryption at all. The SMART App Launch v2.2.0
              launch-and-authorization page requires apps to send authentication secrets,
              authorization codes, and tokens only to authenticated servers over TLS-secured
              channels. <strong>DICOM</strong> supports TLS for image transfer but has no PQC cipher
              suite definitions.
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              For the transport itself, TLS 1.3 is specified in RFC 9846, and RFC 10024 defines
              three ML-KEM hybrid key agreement mechanisms for TLS 1.3 (X25519MLKEM768,
              SecP256r1MLKEM768 and SecP384r1MLKEM1024) &mdash; the building blocks for telehealth
              sessions and FHIR API traffic. On the US certification side, the ONC criteria for
              certified EHR software (&sect;&nbsp;170.315(d)(7)&ndash;(d)(9): end-user device
              encryption, integrity and trusted connection) refer to NIST-approved encryption and
              SHA-2 or stronger hashing, and they name no post-quantum algorithm.
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
              <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Clock size={14} className="text-primary" />
                Planning Medical-Device Changes
              </h3>
              <p className="text-xs text-muted-foreground">
                Assess the particular device change, its applicable submission pathway and the
                supplier's documented plan. Do not assume that every cryptographic change requires
                the same submission or a fixed review delay. Use the{' '}
                <a
                  href="https://www.fda.gov/medical-devices/premarket-notification-510k/new-510k-required-modification-device"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  FDA guidance on device modifications
                </a>{' '}
                to frame the questions for the manufacturer; this sample does not determine the
                regulatory outcome or review duration for a device.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <Building2 size={14} className="text-primary" />
                Device Lifetimes
              </h3>
              <p className="text-xs text-muted-foreground">
                Medical devices have operational lifetimes of <strong>15&ndash;20 years</strong>,
                with some MRI machines and radiation therapy systems lasting 25+ years. Many of
                these devices cannot be remotely updated and will never receive PQC firmware. The
                migration strategy for these legacy devices must focus on network segmentation and
                cryptographic gateways rather than device-level upgrades. FDA&apos;s premarket
                cybersecurity guidance recommends cryptography that is expected to stay
                cryptographically strong throughout the service life of the device, which is why
                these long lifetimes matter for the algorithms chosen today.
              </p>
            </div>
          </div>

          {/* HSCC and H-ISAC */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h3 className="text-sm font-bold text-foreground mb-2">
              Sector Coordination: HSCC &amp; H-ISAC
            </h3>
            <p className="text-xs text-muted-foreground">
              The <strong>Health Sector Coordinating Council (HSCC)</strong> and the{' '}
              <strong>Health Information Sharing and Analysis Center (H-ISAC)</strong> are the
              primary coordinating bodies for healthcare cybersecurity in the United States. HSCC
              publishes the Health Industry Cybersecurity Practices (HICP) guidelines, while H-ISAC
              provides threat intelligence and incident response coordination. This lesson does not
              assume a published sector migration timeline: check their current publications and
              your own regulators for any PQC-specific guidance.
            </p>
          </div>
        </div>
      </LearnSection>

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
            to="/learn/iot-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Cpu size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">
                IoT &amp; Embedded Device PQC
              </div>
              <div className="text-xs text-muted-foreground">
                PQC for implantable devices, monitors, and hospital OT networks
              </div>
            </div>
          </Link>
          <Link
            to="/learn/compliance-strategy"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Compliance Strategy</div>
              <div className="text-xs text-muted-foreground">
                HIPAA, FDA 510(k), and NIS2 quantum-readiness requirements
              </div>
            </div>
          </Link>
          <Link
            to="/learn/pqc-risk-management"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <AlertTriangle size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">PQC Risk Management</div>
              <div className="text-xs text-muted-foreground">
                Risk registers for patient data and long-lifecycle medical records
              </div>
            </div>
          </Link>
        </div>
      </section>
      <VendorCoverageNotice migrateLayer="AppServers" />

      {/* -- Reading Complete ------------------------------------------------- */}
      <ReadingCompleteButton />
    </div>
  )
}
