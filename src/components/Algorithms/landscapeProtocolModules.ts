// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 1.6 (2026-09-19) — the protocol edge from the Industry
 * Landscape to Learn. A landscape row names one sector module in
 * `learn_module_id` (healthcare-pqc, emv-payment-pqc …), which left 42 of 65
 * modules with no landscape row at all — including every protocol module
 * the rows are actually about: a use case whose target protocol is TLS 1.3
 * is a TLS 1.3 use case. This maps the row's `protocols_target` and
 * `pqc_mechanisms` vocabulary to the module that teaches it, deterministically,
 * so nothing here is a curation claim; the CSV columns already say it.
 * `landscapeProtocolModules.test.ts` pins that every target is a real module.
 */
import type { IndustryUseCase } from '@/data/industryLandscapeData'

/** `protocols_target` value → Learn module id. Values with no module are omitted. */
export const PROTOCOL_LEARN_MODULE: Readonly<Record<string, string>> = {
  'tls-1-3': 'tls-basics',
  'tls-1-2': 'tls-basics',
  'dtls-1-3': 'tls-basics',
  'dtls-1-2': 'tls-basics',
  x509: 'pki-workshop',
  'est-cmp': 'pki-enrollment-protocols',
  'ike-ipsec': 'vpn-ssh-pqc',
  ssh: 'vpn-ssh-pqc',
  wireguard: 'vpn-ssh-pqc',
  pkcs11: 'hsm-pqc',
  kmip: 'kms-pqc',
  jose: 'api-security-jwt',
  uefi: 'secure-boot-pqc',
  sigstore: 'code-signing',
  smime: 'email-signing',
  openpgp: 'email-signing',
  'fido-2': 'iam-pqc',
  kerberos: 'iam-pqc',
  '5g-suci': '5g-security',
  dnssec: 'dnssec-pqc',
}

/** `pqc_mechanisms` value → Learn module id, for mechanism families with a module of their own. */
export const MECHANISM_LEARN_MODULE: Readonly<Record<string, string>> = {
  LMS: 'stateful-signatures',
  XMSS: 'stateful-signatures',
  'SLH-DSA': 'slh-dsa',
}

export interface ProtocolModuleLink {
  moduleId: string
  /** The protocol or mechanism value that made the link, e.g. 'tls-1-3'. */
  via: string
}

/** The protocol/mechanism modules a landscape row relates to, excluding its own sector module. */
export function protocolModulesForUseCase(uc: IndustryUseCase): ProtocolModuleLink[] {
  const out: ProtocolModuleLink[] = []
  const seen = new Set<string>([uc.learnModuleId])
  for (const p of uc.protocolsTarget) {
    // eslint-disable-next-line security/detect-object-injection -- p is a CSV vocabulary value looked up in a frozen literal map
    const m = PROTOCOL_LEARN_MODULE[p]
    if (m && !seen.has(m)) {
      seen.add(m)
      out.push({ moduleId: m, via: p })
    }
  }
  for (const mech of uc.pqcMechanisms) {
    // eslint-disable-next-line security/detect-object-injection -- mech is a CSV vocabulary value looked up in a frozen literal map
    const m = MECHANISM_LEARN_MODULE[mech]
    if (m && !seen.has(m)) {
      seen.add(m)
      out.push({ moduleId: m, via: mech })
    }
  }
  return out
}
