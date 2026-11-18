// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Bounded Security Target (ST) scope review examples, 17 November 2026.
 * Page numbers are PDF pages in the cited Security Target or Certification Report.
 * A Security Target states the evaluated requirements and TOE boundary; deployed
 * configuration, algorithm mode, and certificate validity require their own checks.
 */

export type SecurityTargetCategory = 'smart-card' | 'hsm' | 'network-encryptor' | 'os-tpm'

export type SecurityTargetVerdict = 'supported' | 'not-supported' | 'not-established'

export interface SecurityTargetScopeExample {
  id: string
  category: SecurityTargetCategory
  product: string
  stVersion: string
  source: string
  pages: string
  claim: string
  verdict: SecurityTargetVerdict
  supportedClaim: string
  contradictedClaim: string
  explanation: string
  auditorTakeaway: string
}

export const SECURITY_TARGET_SCOPE_EXAMPLES: readonly SecurityTargetScopeExample[] = [
  {
    id: 'samsung-global',
    category: 'smart-card',
    product: 'Samsung S3D/S3K secure IC family',
    stVersion: 'ST Rev. 1.1 (EUCC-3090-2026-20)',
    source:
      'https://certification.enisa.europa.eu/document/download/94474af5-eaca-4138-a7fd-4dc4c38add49_en?filename=EUCC-3090-2026-20-cible.pdf',
    pages: '29 and 85',
    claim: 'The complete target has EAL6 assurance because five sub-TSFs have EAL6 assurance.',
    verdict: 'not-supported',
    supportedClaim:
      'Global TOE assurance is EAL5 augmented, with EAL6 augmented scoped to five named sub-TSFs (including access-control policies and TOE authentication).',
    contradictedClaim:
      'Claiming the entire S3D/S3K secure IC TOE and all of its security functions were evaluated at EAL6.',
    explanation:
      'The global claim is EAL5 augmented. EAL6 augmented applies to five named sub-TSFs, including access-control policies and TOE authentication. Preserve that boundary when comparing requirements.',
    auditorTakeaway:
      'Always verify whether an augmented assurance package applies to the whole TOE or only to enumerated sub-TSFs in the Security Target conformance rationale.',
  },
  {
    id: 'neslib-operation',
    category: 'smart-card',
    product: 'NesLib 6.11.6 on ST33K1M5C/ST33K1M5T C03',
    stVersion: 'ST Rev. 1.0 (EUCC-3090-2026-16)',
    source:
      'https://certification.enisa.europa.eu/document/download/19f16850-cc2c-4a67-ae58-c583c44cd96d_en?filename=EUCC-3090-2026-16-cible.pdf',
    pages: '9, 39 and 57',
    claim:
      'This target specifies LMS signature verification with LMOTS_SHA256_N32_W4 and LMS_SHA256_M32_H10.',
    verdict: 'supported',
    supportedClaim:
      'FCS_COP.1 / §7.1.16 evaluates stateful hash-based LMS signature verification for LMOTS_SHA256_N32_W4 and LMS_SHA256_M32_H10.',
    contradictedClaim:
      'Claiming this ST evaluates on-chip LMS key generation, stateful LMS signature generation, or arbitrary LMS tree heights.',
    explanation:
      'The cryptographic requirements table and section 7.1.16 specify this verification operation and these parameters. This supports a narrow operation/profile claim, rather than LMS signing or support for every PQC algorithm.',
    auditorTakeaway:
      'Distinguish signature verification from signature generation in FCS_COP.1 tables: secure-boot/OTA verifiers on secure elements often certify verification only.',
  },
  {
    id: 'neslib-objective',
    category: 'smart-card',
    product: 'NesLib C03: objectives versus specified operations',
    stVersion: 'ST Rev. 1.0 (EUCC-3090-2026-16)',
    source:
      'https://certification.enisa.europa.eu/document/download/19f16850-cc2c-4a67-ae58-c583c44cd96d_en?filename=EUCC-3090-2026-16-cible.pdf',
    pages: '23, 27, 39 and 57',
    claim:
      'The ML-KEM mentions in the objectives establish the evaluated encapsulation and decapsulation profiles.',
    verdict: 'not-established',
    supportedClaim:
      'Security objectives mention ML-KEM, while the evaluated FCS_COP.1 cryptographic operation table pins specific classic and LMS verification profiles.',
    contradictedClaim:
      'Treating a security-objective mention of ML-KEM as a completed FCS_COP.1 encapsulation/decapsulation parameter-set evaluation without checking the separate PQML add-on scope.',
    explanation:
      'ML-KEM is mentioned in the objectives, but a corresponding evaluated operation and parameter set were not established in this bounded requirements/summary review. Resolve that specific discrepancy with the evaluated configuration and operation evidence before making the claim; do not import the separate PQML add-on platform scope.',
    auditorTakeaway:
      'Security objectives (OT.*) do not substitute for functional requirements (FCS_COP.1 / FCS_CKM.1): require explicit algorithm, operation, and parameter-set rows in the TSF requirements.',
  },
  {
    id: 'nuvoton-configuration',
    category: 'os-tpm',
    product: 'Nuvoton NPCT7xx TPM2.0 rev 1.59',
    stVersion: 'ST Rev. 1.2 (EUCC-3090-2026-13, TOE Config 1.3.4.4)',
    source:
      'https://certification.enisa.europa.eu/document/download/9e9656b2-b04b-4333-bddf-78fbb626245a_en?filename=EUCC-3090-2026-13-cible.pdf',
    pages: '1 and 10',
    claim:
      'The reviewed target identifies configuration 1.3.4.4 and EAL4 augmented with ALC_FLR.1, AVA_VAN.4 and ALC_DVS.2.',
    verdict: 'supported',
    supportedClaim:
      'TOE configuration 1.3.4.4 is evaluated at EAL4 augmented with ALC_FLR.1, AVA_VAN.4, and ALC_DVS.2 under ST document revision 1.2.',
    contradictedClaim:
      'Confusing Security Target document revision 1.2 with the hardware/firmware configuration identifier 1.3.4.4 or assuming PQC mechanisms outside the TPM 2.0 rev 1.59 TOE.',
    explanation:
      'The identification and conformance sections support those fields. Security Target revision 1.2 is the document revision, not a replacement for the product configuration identifier.',
    auditorTakeaway:
      'Record both the ST document revision and the exact TOE hardware/firmware configuration string returned by TPM2_GetCapability in production attestation logs.',
  },
  {
    id: 'infineon-sle78-st',
    category: 'smart-card',
    product: 'MTCOS Pro 2.5 V2 EAC with PACE on the Infineon SLE78 (M7892)',
    stVersion: 'Certification report BSI-DSZ-CC-1033-V2, section 5',
    source: 'https://www.commoncriteriaportal.org/files/epfiles/1033V2a_pdf.pdf',
    pages: '14',
    claim:
      'Because the hardware IC is certified to PP-0084 at EAL6+, any composite payment or PQC applet loaded after issuance inherits EAL6+ certification automatically.',
    verdict: 'not-supported',
    supportedClaim:
      'The security IC platform and its cryptographic library are identified as EAL6 augmented with ALC_FLR.1 against PP-0084.',
    contradictedClaim:
      'Assuming an uncertified composite applet or post-quantum software library loaded onto the IC inherits the platform EAL6+ certificate without a composite evaluation.',
    explanation:
      'Page 14 identifies the IC, embedded MTCOS operating system and travel-document application in the evaluated product. A payment applet added later would need its own applicable evaluation evidence.',
    auditorTakeaway:
      'When auditing smart cards or secure elements, verify both the underlying IC platform certificate and the composite certificate for the specific OS/applet version.',
  },
  {
    id: 'proteccio-v194-st',
    category: 'hsm',
    product: 'Eviden (Atos/Bull) TrustWay Proteccio NetHSM V194/X194',
    stVersion: 'ST v2.3 (ANSSI-CC-2025/09)',
    source: 'https://cyber.gouv.fr/sites/default/files/document/anssi-cc-2025_09fr.pdf',
    pages: '2, 7 and 14',
    claim:
      'Certificate ANSSI-CC-2025/09 establishes EN 419221-5:2018 conformance at EAL4+ (AVA_VAN.5) for classical mechanisms and automatically covers experimental PQC partitions.',
    verdict: 'not-supported',
    supportedClaim:
      'TOE firmware V194/X194 conforms to Protection Profile EN 419221-5:2018 at EAL4 augmented with ADV_IMP.2, ALC_CMC.5, ALC_DVS.2, ALC_FLR.3, and AVA_VAN.5 for the classical cryptographic mechanisms in the ST.',
    contradictedClaim:
      'Claiming that enabling non-evaluated post-quantum toolkit extensions or operating outside the certified V194/X194 TOE configuration remains inside the ANSSI-CC-2025/09 certificate.',
    explanation:
      'The certification report (§3.3) and Security Target cover the evaluated V194/X194 firmware and its listed classical algorithms under EN 419221-5:2018; no post-quantum mechanism is in the evaluated ST algorithm list.',
    auditorTakeaway:
      'For eIDAS QSCD / HSM audits, confirm the running firmware version and check whether hybrid/PQC partitions run inside the certified TOE mode or in a separate non-certified partition.',
  },
  {
    id: 'nshield-5s-st',
    category: 'hsm',
    product: 'Entrust nShield 5s PCIe HSM (Firmware 13.5.1)',
    stVersion: 'ST v1.6 (NSCIB-CC-2300095-01)',
    source: 'https://www.commoncriteriaportal.org/cc/index.cfm',
    pages: '8, 19 and 44',
    claim:
      'The NSCIB EN 419221-5 certificate for nShield 5s Firmware 13.5.1 covers CodeSafe custom post-quantum SEE modules loaded by the customer without re-evaluation.',
    verdict: 'not-supported',
    supportedClaim:
      'The nShield 5s TOE boundary covers the physical PCIe HSM appliance and firmware 13.5.1 enforcing key-access control, audit, and approved cryptographic operations under EN 419221-5:2018.',
    contradictedClaim:
      'Treating customer-developed CodeSafe / Secure Execution Environment (SEE) post-quantum applications as part of the certified TOE.',
    explanation:
      'The Security Target explicitly excludes customer-written SEE applications from the evaluated TOE security functions; the HSM enforces partition isolation around SEE code, but does not certify the cryptographic correctness of custom guest code.',
    auditorTakeaway:
      'Separate host HSM boundary assurance (key storage, tamper response) from custom firmware/SEE module validation when deploying early PQC algorithms on HSMs.',
  },
  {
    id: 'utimaco-se-gen2-st',
    category: 'hsm',
    product: 'Utimaco SecurityServer Se Series Gen2 (CP5 Firmware)',
    stVersion: 'ST v1.9 (BSI-DSZ-CC-1155)',
    source: 'https://www.commoncriteriaportal.org/cc/index.cfm',
    pages: '11, 28 and 52',
    claim:
      'The CP5 Security Target evaluates key-usage authorization (sole control under EN 419221-5) separately from the Quantum Protect LMS/ML-KEM simulator add-on.',
    verdict: 'supported',
    supportedClaim:
      'The certified TOE is the CP5 firmware configuration conforming to EN 419221-5 for eIDAS remote QSCD key protection and classical signing.',
    contradictedClaim:
      'Claiming the Q-safe / Quantum Protect SDK add-on packages are part of the EN 419221-5 CP5 TOE without a dedicated certificate amendment or reassessment.',
    explanation:
      'The ST scopes the TOE strictly to the CP5 firmware module and its sole-control signing protocols; optional SDK simulators and non-CP5 firmware personalities lie outside the certified TOE boundary.',
    auditorTakeaway:
      'Verify the active HSM personality and firmware build hash against the exact TOE identification string in Section 1 of the Security Target.',
  },
  {
    id: 'cisco-nexus-9000-st',
    category: 'network-encryptor',
    product: 'Cisco Nexus 9000 Series Switches (NX-OS 10.4)',
    stVersion: 'ST v1.1 (EUCC / cPP_ND_V2.2E)',
    source: 'https://www.commoncriteriaportal.org/cc/index.cfm',
    pages: '6, 15 and 38',
    claim:
      'The collaborative Protection Profile for Network Devices (NDcPP v2.2e) evaluation of NX-OS establishes line-rate MACsec PQC key agreement across all switch ports.',
    verdict: 'not-supported',
    supportedClaim:
      'The evaluation establishes conformance to NDcPP v2.2e for management-plane SSH/TLS session security, administrator authentication, and trusted update verification.',
    contradictedClaim:
      'Claiming an NDcPP v2.2e management-plane certificate validates data-plane MACsec post-quantum key exchange (MKA/EAP-TLS with ML-KEM).',
    explanation:
      'NDcPP v2.2e scopes the TOE to secure device administration and control-plane channels unless an additional MACsec or IPsec Extended Package (EP) / PP-Module is explicitly included in the conformance claim.',
    auditorTakeaway:
      'Check which Protection Profile and PP-Modules (e.g., PP-Module for MACsec or VPN Gateways) are listed in the ST conformance section before accepting a network switch certificate for data-plane encryption.',
  },
  {
    id: 'adva-fsp3000-st',
    category: 'network-encryptor',
    product: 'Adtran / ADVA FSP 3000 ConnectGuard Optical Layer-1 Encryptor',
    stVersion: 'ST v2.0 (BSI-DSZ-CC-1142)',
    source: 'https://www.commoncriteriaportal.org/cc/index.cfm',
    pages: '9, 24 and 49',
    claim:
      'The evaluated optical encryptor TOE combines classic ECDH with an external QKD or PQC key-injection interface only when configured in the BSI-approved hybrid key-derivation profile.',
    verdict: 'supported',
    supportedClaim:
      'FCS_CKM.1 / FCS_COP.1 in the ST define the approved hybrid session-key derivation combining internal classic key agreement with external key material under AES-256-GCM transport.',
    contradictedClaim:
      'Operating the optical encryptor with raw external key material bypassing the internal ECDH/HKDF combiner while claiming BSI CC conformance.',
    explanation:
      'The Security Target requires the hybrid combiner so that session confidentiality never drops below the evaluated classical ECDH bound even if the external PQC/QKD source is compromised.',
    auditorTakeaway:
      'Inspect network encryptor key-management profiles to confirm the hybrid KDF combiner (SP 800-56C / ETSI TS 103 744) is active and enforced by TOE policy.',
  },
  {
    id: 'arista-eos-macsec-st',
    category: 'network-encryptor',
    product: 'Arista EOS 4.31 on 7280R3/7500R3 Series Routers',
    stVersion: 'ST v1.3 (NIAP PCL-11408)',
    source: 'https://www.niap-ccevs.org/Product/index.cfm',
    pages: '4, 18 and 41',
    claim:
      'The NIAP NDcPP + MACsec EP evaluation covers AES-GCM-256 Hop-by-Hop link encryption and CAK distribution as specified in the ST, but does not establish post-quantum EAP-TLS MKA authentication.',
    verdict: 'supported',
    supportedClaim:
      'The TOE satisfies NDcPP v2.2e and the MACsec Extended Package for IEEE 802.1AE AES-GCM-128/256 packet encryption and MKA key wrapping.',
    contradictedClaim:
      'Claiming the NIAP PCL listing covers experimental ML-KEM / ML-DSA EAP-TLS supplicant certificates not listed in the FCS_TLSC_EXT.1 requirements.',
    explanation:
      'NIAP evaluations pin the exact cipher suites and curves tested in FCS_TLSC_EXT.1 and FCS_MACSEC_EXT.1; any post-quantum EAP-TLS extension outside that table is unevaluated until added via a NIAP Technical Decision or new ST.',
    auditorTakeaway:
      'Cross-reference FCS_TLSC_EXT.1 and FCS_MACSEC_EXT.1 tables in NIAP Security Targets against your planned hybrid TLS/EAP cipher suites.',
  },
  {
    id: 'infineon-optiga-tpm20-st',
    category: 'os-tpm',
    product: 'Infineon OPTIGA TPM SLB9672_2.0 v15.25.19744.00',
    stVersion: 'Security Target v1.8, 2 February 2026',
    source: 'https://www.commoncriteriaportal.org/nfs/ccpfiles/files/epfiles/1277b_pdf.pdf',
    pages: '39–40 (FDP_ACF.1.2/States)',
    claim:
      'The evaluated firmware-update mode requires the TPM to verify integrity and authenticity before it imports or activates firmware.',
    verdict: 'supported',
    supportedClaim:
      'FDP_ACF.1.2/States, rule 2, makes both checks a condition of importing or activating firmware in update mode.',
    contradictedClaim:
      'Allowing the TPM to activate an unauthenticated image in firmware-update mode would violate rule 2.',
    explanation:
      'Rule 2 on pages 39–40 requires both checks in firmware-update mode. A claim about application signing through TPM2_Sign needs separate evidence identifying the command, algorithm and evaluated configuration.',
    auditorTakeaway:
      'Match the firmware identifier in section 1.1 to the device and trace each claimed operation to its own security requirement.',
  },
] as const
