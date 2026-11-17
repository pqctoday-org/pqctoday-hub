// SPDX-License-Identifier: AGPL-3.0-only
/** Bounded source review, 16 November 2026. Page numbers are PDF pages.
 * A Security Target states the evaluated requirements; deployed configuration
 * and certificate validity require their own checks.
 */
export const SECURITY_TARGET_SCOPE_EXAMPLES = [
  {
    id: 'samsung-global',
    product: 'Samsung S3D/S3K secure IC family',
    source:
      'https://certification.enisa.europa.eu/document/download/94474af5-eaca-4138-a7fd-4dc4c38add49_en?filename=EUCC-3090-2026-20-cible.pdf',
    pages: '29 and 85',
    claim: 'The complete target has EAL6 assurance because five sub-TSFs have EAL6 assurance.',
    verdict: 'not-supported',
    explanation:
      'The global claim is EAL5 augmented. EAL6 augmented applies to five named sub-TSFs, including access-control policies and TOE authentication. Preserve that boundary when comparing requirements.',
  },
  {
    id: 'neslib-operation',
    product: 'NesLib 6.11.6 on ST33K1M5C/ST33K1M5T C03',
    source:
      'https://certification.enisa.europa.eu/document/download/19f16850-cc2c-4a67-ae58-c583c44cd96d_en?filename=EUCC-3090-2026-16-cible.pdf',
    pages: '9, 39 and 57',
    claim:
      'This target specifies LMS signature verification with LMOTS_SHA256_N32_W4 and LMS_SHA256_M32_H10.',
    verdict: 'supported',
    explanation:
      'The cryptographic requirements table and section 7.1.16 specify this verification operation and these parameters. This supports a narrow operation/profile claim, rather than LMS signing or support for every PQC algorithm.',
  },
  {
    id: 'neslib-objective',
    product: 'NesLib C03: objectives versus specified operations',
    source:
      'https://certification.enisa.europa.eu/document/download/19f16850-cc2c-4a67-ae58-c583c44cd96d_en?filename=EUCC-3090-2026-16-cible.pdf',
    pages: '23, 27, 39 and 57',
    claim:
      'The ML-KEM mentions in the objectives establish the evaluated encapsulation and decapsulation profiles.',
    verdict: 'not-established',
    explanation:
      'ML-KEM is mentioned in the objectives, but a corresponding evaluated operation and parameter set were not established in this bounded requirements/summary review. Resolve that specific discrepancy with the evaluated configuration and operation evidence before making the claim; do not import the separate PQML add-on platform scope.',
  },
  {
    id: 'nuvoton-configuration',
    product: 'Nuvoton NPCT7xx TPM2.0 rev 1.59',
    source:
      'https://certification.enisa.europa.eu/document/download/9e9656b2-b04b-4333-bddf-78fbb626245a_en?filename=EUCC-3090-2026-13-cible.pdf',
    pages: '1 and 10',
    claim:
      'The reviewed target identifies configuration 1.3.4.4 and EAL4 augmented with ALC_FLR.1, AVA_VAN.4 and ALC_DVS.2.',
    verdict: 'supported',
    explanation:
      'The identification and conformance sections support those fields. Security Target revision 1.2 is the document revision, not a replacement for the product configuration identifier.',
  },
] as const
