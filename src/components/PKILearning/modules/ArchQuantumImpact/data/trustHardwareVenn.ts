// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The overlap picture shown at the top of Step 6, with its text equivalent. The file is served by
 * URL from public/ (never imported, so it is not inlined into any prerendered page).
 */
export const VENN = {
  src: '/images/trust-hardware/trust-hardware-venn.webp',
  width: 1536,
  height: 1024,
  alt: 'A five-shape overlap diagram comparing hardware key protection in TPM 2.0 V1.85, Tessera with Caliptra 2.2, traditional HSMs and cloud HSMs, with a table of post-quantum algorithms and PKCS#11 support below.',
  caption:
    'What TPM 2.0, Tessera with Caliptra, traditional HSMs and cloud HSMs share and where they differ. It covers four of the eight kinds and is a desk comparison of published documents (November 2026); products and models vary.',
  /** The same content as the picture, readable without it. */
  regions: [
    'TPM 2.0 only: sealing to platform state, authorization policies, NV storage and counters.',
    'TPM 2.0 with Caliptra, inside Tessera: boot measurements held in PCRs.',
    'Caliptra (inside Tessera): secure boot of chip processors, SPDM support, ownership transfer (OCP DOT example).',
    'TPM 2.0 with Tessera: keys stored outside, encrypted by the device.',
    'Tessera only: attached to the workload, open specifications and firmware, cross-vendor key interoperability (design).',
    'TPM 2.0, Tessera and traditional HSMs, not cloud HSMs: ML-KEM.',
    'Traditional HSMs only: appliances and PCIe cards, custom code inside the HSM, SLH-DSA, LMS and XMSS by vendor.',
    'Traditional and cloud HSMs: keys hosted and managed in the HSM, FIPS 140 Level 3 validated models, audit logs of administrative actions, bring your own key.',
    'Tessera, traditional and cloud HSMs, not TPM: backup and restore.',
    'Cloud HSMs only: cloud-hosted HSM service, provider manages firmware and patching.',
    'Shared by all four: keys protected in hardware, RSA and ECDSA, AES, SHA-2 and HMAC.',
  ],
  tableRows: [
    'Post-quantum row: TPM 2.0 V1.85 defines ML-KEM, ML-DSA and HashML-DSA; Tessera has ML-KEM and ML-DSA device commands and an SDK in development; Thales, Entrust, Utimaco and Securosys list different sets of ML-KEM, ML-DSA, SLH-DSA, LMS or HSS-LMS and XMSS; AWS CloudHSM lists ML-DSA, Azure Managed HSM no post-quantum key types, Google post-quantum in software only.',
    'PKCS#11 row: TPM through an add-on library; Tessera has a Rust SDK and OpenSSL provider and no PKCS#11 interface in its repositories; all four traditional vendors offer it; AWS and Azure Cloud HSM and a Google library offer it, Azure Managed HSM uses the Key Vault API.',
  ],
  /** Notes printed under the picture and in the text version. */
  notes: [
    'Caliptra 2.2 is the version the Tessera specification requires and is scheduled for release in December 2026. The picture is an independent illustration.',
    'Bring your own key: the Luna Network HSM 7 brief lists BYOK, HYOK and DKE among its use cases, which is why the picture places it where traditional and cloud HSMs overlap.',
  ],
  /** Library documents the diagram rests on. */
  sources: [
    'TCG-TPM-V185-Part1',
    'TCG-TPM-V185-Part2',
    'Hardware-Specification-Caliptra-2-1-Documentation',
    'Tessera-Integrated-HSM-Chip-Requirements-Specification-0-5-0',
    'Tessera-Integrated-HSM-Architectural-Specification-Deploymen',
    'Tessera-Integrated-HSM-SDK-tessera-sw-README',
    'Advancing-hardware-security-through-open-source-collaboratio',
    'Product-Brief-Luna-Network-HSM-7',
    'Primus-HSM-CyberVault-X2-models-fact-sheet-Securosys',
    'Overview-of-Azure-Cloud-HSM',
    'Cloud-HSM-architecture-Security-Google-Cloud-Documentation',
    'Supported-mechanisms-for-the-PKCS-11-library-for-AWS-CloudHS',
  ],
} as const
