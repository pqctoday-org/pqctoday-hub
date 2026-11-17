// SPDX-License-Identifier: AGPL-3.0-only
/** RFC 8554 §§4, 5, 6: SHA256 N32/W4 has p=67. LMS H10:
 * signature = 4 + (4 + 32 + 67*32) + 4 + 10*32 = 2508 B;
 * public key = 4 + 4 + 16 + 32 = 56 B.
 * HSS L=1 prepends one u32 to each object (2512 B / 60 B).
 * These lengths exclude certificates, transport framing and signing state.
 */
export const HSS_L1_SHA256_H10_W4 = {
  publicKeyBytes: 60,
  signatureBytes: 2512,
  source: 'https://www.rfc-editor.org/rfc/rfc8554.html#section-6',
} as const
