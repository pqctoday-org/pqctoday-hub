// SPDX-License-Identifier: GPL-3.0-only

export interface SuggestedQuery {
  label: string
  query: string
  description: string
}

export const SUGGESTED_QUERIES: SuggestedQuery[] = [
  {
    label: 'ML-KEM',
    query: 'ML-KEM',
    description: 'NIST FIPS 203 key encapsulation — standards, software, and timelines',
  },
  {
    label: 'ML-DSA',
    query: 'ML-DSA',
    description: 'NIST FIPS 204 digital signatures — see all cross-references',
  },
  {
    label: 'FN-DSA',
    query: 'FN-DSA',
    description: 'Falcon signature algorithm — NIST FIPS 206 (draft), EMV payments',
  },
  {
    label: 'CNSA 2.0',
    query: 'CNSA',
    description: 'NSA Commercial National Security Algorithm Suite 2.0',
  },
  {
    label: 'OpenSSL',
    query: 'OpenSSL',
    description: 'OpenSSL software and its PQC certification ecosystem',
  },
  {
    label: 'Infrastructure',
    query: 'Infrastructure',
    description: 'Infrastructure learning track — PKI, KMS, HSM, secure boot, and more',
  },
  {
    label: 'Developer Path',
    query: 'Developer',
    description: 'Developer persona learning pathway with recommended modules',
  },
  {
    label: 'TLS',
    query: 'TLS',
    description: 'TLS protocol standards, modules, and migration timeline',
  },
  {
    label: 'Hybrid',
    query: 'hybrid',
    description: 'Hybrid cryptography approaches across standards and modules',
  },
  {
    label: 'FIPS',
    query: 'FIPS',
    description: 'FIPS standards and certifications across the PQC ecosystem',
  },
  {
    label: 'Healthcare',
    query: 'Healthcare',
    description: 'Healthcare PQC threats, compliance, and learning modules',
  },
  {
    label: 'HNDL',
    query: 'harvest now',
    description: 'Harvest Now, Decrypt Later threats and related compliance',
  },
]
