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
    description: 'NIST FIPS 203 key encapsulation — see standards, software, and timelines',
  },
  {
    label: 'FIPS 203',
    query: 'FIPS-203',
    description: 'ML-KEM standard and all its cross-references',
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
    label: 'TLS',
    query: 'TLS',
    description: 'TLS protocol standards, modules, and migration timeline',
  },
  {
    label: 'Hybrid',
    query: 'hybrid',
    description: 'Hybrid cryptography approaches across standards and modules',
  },
]
