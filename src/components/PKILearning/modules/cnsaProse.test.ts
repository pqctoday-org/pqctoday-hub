// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Lesson prose that used to present NSA's 2022 category schedule (software and firmware signing
 * preferred 2025 and exclusive 2030, networking and operating systems later) as today's
 * requirement now gives the dates of NSA's CNSA 2.0 FAQ, version 2.2. Where the older schedule is
 * kept as history it carries the qualifier below. The files are read as text so the check covers
 * lesson summaries and component copy alike.
 */
const QUALIFIER =
  "(NSA's 2022 category guidance; superseded for planning by the dates in NSA's CNSA 2.0 FAQ, version 2.2)"

interface Case {
  file: string
  /** Phrases that stated the 2022 schedule as the current requirement. */
  gone: string[]
  /** Phrases the file must now contain. */
  present: string[]
}

const cases: Case[] = [
  {
    file: 'ComplianceStrategy/components/Introduction.tsx',
    gone: [
      'CNSA 2.0 software/firmware signing preferred for NSS',
      'CNSA 2.0 new networking equipment must support PQC',
      'CNSA 2.0 software/firmware signing exclusive; legacy networking replaced',
    ],
    present: [
      'event: CNSA_2022_PREFERRED_LABEL',
      'event: CNSA_ACQUISITION_LABEL',
      '`${CNSA_PHASE_OUT_LABEL}; NIST RSA/ECC deprecated`',
    ],
  },
  {
    file: 'ComplianceStrategy/ComplianceStrategyExercises.tsx',
    gone: ['CNSA 2.0 requires PQC for NSS by 2030'],
    present: [
      'CNSA 2.0 FAQ (version 2.2) sets national security system dates of 1 January 2027 for new acquisitions, 31 December 2030 for phasing out equipment that cannot support CNSA 2.0',
    ],
  },
  {
    file: 'ComplianceStrategy/curious-summary.md',
    gone: ['CNSA 2.0 sets exclusive-PQC dates'],
    present: [
      'new acquisitions from 1 January 2027, unsupported equipment phased out by 31 December 2030',
    ],
  },
  {
    file: 'ComplianceStrategy/rag-summary.md',
    gone: ['— software/firmware signing preferred 2025, exclusive 2030'],
    present: [
      'FAQ, version 2.2 (October 2026): new national security system acquisitions from 1 January 2027',
      `operating systems exclusive 2033 ${QUALIFIER}`,
    ],
  },
  {
    file: 'ComplianceStrategy/data/complianceFrameworks.ts',
    gone: ['aligned to CNSA 2.0 preferred and exclusive deadlines'],
    present: ['aligned to the CNSA 2.0 FAQ dates: new acquisitions from 1 January 2027'],
  },
  {
    file: 'ExecQuantumImpact/components/Introduction.tsx',
    gone: ["NSA's timetable anticipates exclusive use of CNSA 2.0 for software/firmware signing"],
    present: [
      'equipment that cannot support CNSA 2.0 is phased out by 31 December 2030, exceptions possible (NSA CNSA 2.0 FAQ, version 2.2)',
    ],
  },
  {
    file: 'ExecQuantumImpact/data.ts',
    gone: [
      'CNSA 2.0 expects exclusive use of its algorithms for software and firmware signing by 2030',
    ],
    present: [
      'CNSA 2.0 requires its algorithms in new national security system acquisitions from 1 January 2027',
    ],
  },
  {
    file: 'ExecQuantumImpact/rag-summary.md',
    gone: ['NSA mandates: software/firmware signing and networking equipment'],
    present: [
      'NSA CNSA 2.0 FAQ, version 2.2 (October 2026): new national security system acquisitions from 1 January 2027',
      `custom/legacy applications) ${QUALIFIER}`,
    ],
  },
  {
    file: 'ExecQuantumImpact/curious-summary.md',
    gone: [
      'has an anticipated timetable for software/firmware signing to use CNSA 2.0 exclusively by 2030',
      'to use PQC exclusively for software/firmware signing by 2030',
    ],
    present: [
      'requires CNSA 2.0 algorithms in new acquisitions from 1 January 2027, phases out equipment that cannot support them by 31 December 2030',
      'requires CNSA 2.0 algorithms in new U.S. National Security System acquisitions from 1 January 2027',
    ],
  },
  {
    file: 'StatefulSignatures/components/StatefulSigsIntroduction.tsx',
    gone: [
      'New software/firmware should support & prefer CNSA 2.0',
      'is anticipated by NSA to use CNSA 2.0 exclusively',
    ],
    present: ['{CNSA_2022_PREFERRED_LABEL}', '{CNSA_PHASE_OUT_LABEL}', '{CNSA_MANDATE_LABEL}'],
  },
  {
    file: 'StatefulSignatures/workshop/LMSKeyGenDemo.tsx',
    gone: ['Exclusive use of CNSA 2.0 algorithms for that category is due by'],
    present: [
      "NSA's CNSA 2.0 FAQ (version 2.2) mandates CNSA 2.0 algorithms for national security systems by 31 December",
      '{CNSA_2_0.fullEnforcement}, unless otherwise noted.',
    ],
  },
  {
    file: 'StatefulSignatures/rag-summary.md',
    gone: ['2030 exclusive-use milestone for that category;'],
    present: [`2030 exclusive-use milestone for that category ${QUALIFIER}`],
  },
  {
    file: 'OTPQC/components/OTPQCIntroduction.tsx',
    gone: ['should prefer CNSA 2.0 from 2025 and use it exclusively by 2030'],
    present: [
      "NSA's CNSA 2.0 FAQ (version 2.2) sets three dates for national security systems: new acquisitions from 1 January 2027",
    ],
  },
  {
    file: 'OTPQC/rag-summary.md',
    gone: ['prefer from 2025, exclusive by 2030'],
    present: [
      'NSA CNSA 2.0 FAQ, version 2.2: new national security system acquisitions from 1 January 2027',
    ],
  },
  {
    file: 'OTPQC/data/roadmapData.ts',
    gone: [
      'CNSA 2.0: prefer PQC for software/firmware signing (NSS suppliers)',
      'CNSA 2.0: PQC-only firmware signing and networking equipment (NSS)',
    ],
    present: ['label: CNSA_2022_PREFERRED_LABEL', 'label: CNSA_PHASE_OUT_LABEL'],
  },
  {
    file: 'OTPQC/content.ts',
    gone: ['CNSA 2.0: operating systems exclusive', 'CNSA 2.0: all NSS exclusive'],
    present: ['label: CNSA_ACQUISITION_LABEL', 'label: CNSA_MANDATE_LABEL'],
  },
  {
    file: 'TalkingAboutPQC/components/Introduction.tsx',
    gone: ['Software signing and traditional networking use only CNSA 2.0 algorithms'],
    present: [
      'New acquisitions use CNSA 2.0 algorithms from 1 January ${CNSA_2_0.networkingRequired}; equipment that cannot support them is phased out by 31 December ${CNSA_2_0.softwareExclusive}',
    ],
  },
  {
    file: 'AutomotivePQC/data/lifecycleComplianceData.ts',
    gone: ['CNSA 2.0 advisory anticipates 2025 to support and prefer'],
    present: [
      'CNSA 2.0 advisory anticipated 2025 to support and prefer CNSA 2.0 for software and firmware signing and 2030 to use it exclusively ' +
        QUALIFIER.replace(/'/g, '’'),
    ],
  },
  {
    file: 'PKIWorkshop/rag-summary.md',
    gone: ['CNSA 2.0 milestones (2030 for exclusive software/firmware signing'],
    present: [
      "NSA's CNSA 2.0 FAQ, version 2.2: new acquisitions from 1 January 2027",
      `the older 2030 date for exclusive software/firmware signing and traditional networking ${QUALIFIER}`,
    ],
  },
  {
    file: 'HsmPqc/components/HsmPqcIntroduction.tsx',
    gone: ['Software and firmware signing: CNSA 2.0 exclusively by 2030'],
    present: [
      'New NSS acquisitions must be CNSA 2.0-compliant from 1 Jan 2027',
      'Equipment that cannot support CNSA 2.0 phased out by 31 Dec 2030 (exceptions possible)',
    ],
  },
  {
    file: 'SecureBootPQC/workshop/FirmwareSigningMigrator.tsx',
    gone: ['CNSA 2.0 required exclusively by 2030'],
    present: [
      'CNSA 2.0 algorithms mandated for national security systems by 31 December 2031 unless otherwise noted (NSA CNSA 2.0 FAQ, version 2.2)',
    ],
  },
  {
    file: 'CryptoMgmtModernization/workshop/MitigateMigrateWizard.tsx',
    gone: [
      'support-and-prefer 2025–2027 by category',
      'exclusive use 2030 (signing, networking) / 2033 (web, cloud, OS)',
    ],
    present: [
      'CNSA 2.0 (NSS), NSA CNSA 2.0 FAQ version 2.2: new acquisitions from 1 January 2027; equipment that cannot support CNSA 2.0 phased out by 31 December 2030',
    ],
  },
  {
    file: 'CryptoMgmtModernization/components/Introduction.tsx',
    gone: ['(2030 for software/firmware signing)'],
    present: [
      'new NSS acquisitions from 1 January 2027, unsupported equipment phased out by 31 December 2030',
    ],
  },
  {
    file: 'PQCGovernance/PQCGovernanceExercises.tsx',
    gone: ['exclusive PQC for the earliest NSS categories by 2030'],
    present: [
      'equipment that cannot support CNSA 2.0 phased out by 31 December 2030, exceptions possible',
    ],
  },
  {
    file: 'StandardsBodies/data/workshopScenarios.ts',
    gone: ['with a 2030 deadline for exclusive PQC use'],
    present: [
      "NSA's CNSA 2.0 FAQ (version 2.2) phases out equipment that cannot support CNSA 2.0 by 31 December 2030",
    ],
  },
  {
    file: 'CodeSigning/constants.ts',
    gone: ['exclusive CNSA 2.0 use expected by 2030'],
    present: [
      'the NSA CNSA 2.0 FAQ (version 2.2) mandates CNSA 2.0 algorithms for NSS by 31 December 2031 unless otherwise noted',
    ],
  },
  {
    file: 'CodeSigning/components/CodeSigningExercises.tsx',
    gone: ['expects exclusive CNSA 2.0 use for software and firmware signing by 2030'],
    present: [
      'its FAQ (version 2.2) mandates CNSA 2.0 algorithms for NSS by 31 December 2031 unless otherwise noted',
    ],
  },
  {
    file: 'CodeSigning/rag-summary.md',
    gone: ['the category guidance says prefer CNSA 2.0 signing from 2025'],
    present: [
      `NSA's 2022 category guidance says prefer CNSA 2.0 signing from 2025 and use it exclusively by 2030 (superseded for planning by the dates in NSA's CNSA 2.0 FAQ, version 2.2)`,
    ],
  },
  {
    file: 'PlatformEngPQC/workshop/QuantumThreatTimeline.tsx',
    gone: ['NSA CNSA 2.0 deadline: 2030'],
    present: ['CNSA 2.0 phase-out of unsupported equipment: 2030'],
  },
  {
    file: 'Module1-Introduction/rag-summary.md',
    gone: ['mandates phased PQC adoption for U.S. national security systems starting 2025'],
    present: [
      'sets dates for U.S. national security systems: new acquisitions from 1 January 2027',
    ],
  },
]

cases.push(
  {
    file: 'PKIWorkshop/content.ts',
    gone: ['CNSA 2.0 large PKI systems exclusive'],
    present: ['label: CNSA_MANDATE_LABEL'],
  },
  {
    file: 'AutomotivePQC/data/lifecycleComplianceData.ts',
    gone: ['CNSA 2.0 — Firmware Signing Deadline (National Security Systems)'],
    present: ['name: CNSA_PHASE_OUT_LABEL'],
  },
  {
    file: 'ComplianceStrategy/components/JurisdictionMapper.tsx',
    gone: ['US full transition (2033-2035'],
    present: ['US full transition (by 2035, NSM-10)'],
  },
  {
    file: 'Module1-Introduction/content.ts',
    gone: ['CNSA 2.0 begins phased PQC mandates for U.S. national security systems'],
    present: ['event: CNSA_ACQUISITION_LABEL'],
  }
)

/** Collapse line wraps and JSX entities so a phrase matches however the file is wrapped. */
function readText(file: string): string {
  return fs
    .readFileSync(path.join(__dirname, file), 'utf8')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
}

describe('lesson prose gives the CNSA 2.0 FAQ dates, and marks the 2022 schedule as older guidance', () => {
  it.each(cases.map((c) => [c.file, c] as const))('%s', (_file, c) => {
    const text = readText(c.file)
    for (const phrase of c.gone) {
      expect(text, `still contains: ${phrase}`).not.toContain(phrase.replace(/\s+/g, ' '))
    }
    for (const phrase of c.present) {
      expect(text, `missing: ${phrase}`).toContain(phrase.replace(/\s+/g, ' '))
    }
  })
})
