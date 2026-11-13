// SPDX-License-Identifier: AGPL-3.0-only
import {
  AMD_SNP_ASK_ARK_PEM,
  AMD_SNP_REPORT_B64,
  AMD_SNP_VCEK_DER_B64,
} from '@/data/attestation-samples/amdSnpMilanSample'
import type { SnpEvidence } from './amdSnpVerifier'

const fromB64 = (s: string): Uint8Array => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

/** The recorded AMD SEV-SNP sample (open-source test data), decoded from the embedded base64. */
export function loadAmdSnpSampleEvidence(): SnpEvidence {
  return {
    report: fromB64(AMD_SNP_REPORT_B64),
    vcekDer: fromB64(AMD_SNP_VCEK_DER_B64),
    chainPem: AMD_SNP_ASK_ARK_PEM,
  }
}
