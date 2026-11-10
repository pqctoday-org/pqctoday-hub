// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The overlap picture shown at the top of Step 6, with its text equivalent. The file is served by
 * URL from public/ (never imported, so it is not inlined into any prerendered page).
 */
export const VENN = {
  src: '/images/trust-hardware/trust-hardware-venn.webp',
  width: 1536,
  height: 780,
  alt: 'A five-shape overlap diagram comparing hardware key protection in TPM 2.0 V1.85, Tessera with Caliptra 2.2, traditional HSMs and cloud HSMs. The picture shows the overlap diagram only; the post-quantum and PKCS#11 comparison follows as a table below.',
  caption:
    'What TPM 2.0, Tessera with Caliptra, traditional HSMs and cloud HSMs share and where they differ. It covers four of the eight kinds and is a desk comparison of published documents (November 2026); products and models vary. Caliptra 2.2 is the version the Tessera specification requires and is scheduled for release in December 2026. The picture is an independent illustration.',
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
  /** The post-quantum and PKCS#11 comparison, as a table. Each cell lists the Library documents it rests on. */
  tableColumns: [
    { id: 'tpm', label: 'TPM 2.0' },
    { id: 'tessera', label: 'Tessera' },
    { id: 'traditional', label: 'Traditional HSMs' },
    { id: 'cloud', label: 'Cloud HSMs' },
  ],
  tableRows: [
    {
      id: 'pq',
      label: 'Post-quantum',
      cells: {
        tpm: {
          lines: ['ML-KEM, ML-DSA, HashML-DSA in V1.85'],
          sources: ['TCG-TPM-V185-Part1'],
        },
        tessera: {
          lines: [
            'Chip requirements list ML-KEM and ML-DSA operations; the SDK is under development and not yet ready for deployment',
          ],
          sources: [
            'Tessera-Integrated-HSM-SDK-tessera-sw-README',
            'Tessera-Integrated-HSM-Chip-Requirements-Specification-0-5-0',
          ],
        },
        traditional: {
          lines: [
            'Thales: ML-KEM, ML-DSA, LMS-HSS.',
            'Securosys: ML-KEM, ML-DSA, SLH-DSA, HSS-LMS, XMSS',
          ],
          sources: [
            'Product-Brief-Luna-Network-HSM-7',
            'Post-Quantum-Algorithms-Luna-HSM',
            'Primus-HSM-CyberVault-X2-models-fact-sheet-Securosys',
            'Securosys-Primus-HSM-CyberVault-PQC-ready',
          ],
        },
        cloud: {
          lines: [
            'AWS CloudHSM: ML-DSA.',
            'Azure Managed HSM: no post-quantum public-key types.',
            'Google: quantum-safe key import into Cloud KMS, supported only for the SOFTWARE protection level',
          ],
          sources: [
            'Supported-mechanisms-for-the-PKCS-11-library-for-AWS-CloudHS',
            'About-keys-Azure-Key-Vault-Managed-HSM',
            'Google-Cloud-KMS-Quantum-Safe-Key-Import',
          ],
        },
      },
    },
    {
      id: 'pkcs11',
      label: 'PKCS#11',
      cells: {
        tpm: {
          lines: ['No PKCS#11 found in the TPM documents checked'],
          sources: [
            'TCG-TPM-V185-Part0',
            'TCG-TPM-V185-Part1',
            'TCG-TPM-V185-Part2',
            'TCG-TPM-2.0-Library-v1.85-Part3-Published',
            'TCG-PC-Client-Platform-TPM-Profile-v1.07',
          ],
        },
        tessera: {
          lines: [
            'The SDK README names a Rust SDK, a simulator and an OpenSSL provider; no PKCS#11 interface is described in it',
          ],
          sources: ['Tessera-Integrated-HSM-SDK-tessera-sw-README'],
        },
        traditional: {
          lines: ['Thales, Utimaco and Securosys document it'],
          sources: [
            'Product-Brief-Luna-Network-HSM-7',
            'Utimaco-u-trust-Anchor-FIPS-140-3-Non-Proprietary-Security-P',
            'Primus-HSM-CyberVault-X2-models-fact-sheet-Securosys',
            'List-of-Algorithms-and-Functions-for-Firmware-v3-x-Securosys',
          ],
        },
        cloud: {
          lines: [
            'AWS and Azure Cloud HSM: PKCS#11.',
            'Google: PKCS#11 library.',
            'Azure Managed HSM: same API as Key Vault',
          ],
          sources: [
            'Supported-mechanisms-for-the-PKCS-11-library-for-AWS-CloudHS',
            'Overview-of-Azure-Cloud-HSM',
            'Cloud-HSM-architecture-Security-Google-Cloud-Documentation',
            'Azure-Key-Vault-Managed-HSM-Overview',
          ],
        },
      },
    },
  ],
  /** Notes printed under the picture and in the text version. */
  notes: [
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
