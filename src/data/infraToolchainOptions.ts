// SPDX-License-Identifier: AGPL-3.0-only

/** Crypto libraries offered on the infrastructure step (stored in `cryptoLibraries`). */
export const CRYPTO_LIBRARY_OPTIONS = [
  'OpenSSL',
  'BoringSSL',
  'wolfSSL',
  'Mbed TLS',
  'liboqs',
  'GnuTLS',
  'NSS (Mozilla)',
  '.NET cryptography',
  'JCA / BouncyCastle',
  'Go crypto',
  'Rust crypto (RustCrypto)',
  'PKCS#11 (HSM)',
]

/** Crypto / certificate automation offered on the infrastructure step (stored in `infraAutomation`). */
export const INFRA_AUTOMATION_OPTIONS = [
  'Terraform',
  'Ansible',
  'cert-manager',
  'HashiCorp Vault',
  'AWS KMS / CloudHSM',
  'Azure Key Vault / Managed HSM',
  'GCP Cloud KMS',
  'Smallstep / step-ca',
  'Manual / scripted',
  'None',
]
