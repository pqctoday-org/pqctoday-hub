// SPDX-License-Identifier: AGPL-3.0-only
export const TLS_SIGNATURE_SIZES = new Map([
  ['mldsa44', { signature: '2,420 B', publicValue: '1,312 B raw key' }],
  ['mldsa65', { signature: '3,309 B', publicValue: '1,952 B raw key' }],
  ['mldsa87', { signature: '4,627 B', publicValue: '2,592 B raw key' }],
  [
    'ecdsa_secp256r1_sha256',
    { signature: 'Up to 72 B DER', publicValue: '65 B uncompressed point' },
  ],
  ['rsa_pss_rsae_sha256', { signature: '256 B with RSA-2048', publicValue: '256 B modulus' }],
  ['rsa_pss_pss_sha256', { signature: '256 B with RSA-2048', publicValue: '256 B modulus' }],
  ['ed25519', { signature: '64 B', publicValue: '32 B raw key' }],
])
