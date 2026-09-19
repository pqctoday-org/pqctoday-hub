// SPDX-License-Identifier: GPL-3.0-only
/**
 * B+ round 8, Wave D (2026-09-18) — modules whose guided workshop is offered
 * inside the phone shell (MobileModuleShell) instead of the "switch to a
 * laptop" banner.
 *
 * The desktop workshop component renders unchanged inside the phone chrome,
 * so a module qualifies on evidence, not on a rewrite: every step of its
 * stepper was walked at 390 × 844 with the mobile shell off (scratch probe,
 * 2026-09-18) and showed 0 px horizontal overflow, no element wider than the
 * viewport, 0 page errors and 0 serious axe nodes. The user's decision was
 * "start with the cheapest five"; these five are the interactive workshops
 * (form inputs on their steps) from the passing set. The four read-only
 * workshops that passed the same probe joined on 2026-09-18 evening (sbom,
 * government-defense-pqc, trust-services-pqc, dnssec-pqc).
 *
 * A module whose workshop needs a wider screen (canvas, side-by-side panes,
 * PKCS#11 workbenches) stays OFF this list and keeps the honest banner or its
 * playground twin (moduleToolLinks.ts `mobilePracticeTool`).
 *
 * Round 9, wave 3 (2026-09-19): the per-step probe (`round9-steps.mjs`, phone
 * leg opens the Workshop switch and walks every step of the real step nav)
 * ran against a build with every module enabled. 57 workshops walked clean
 * on every step (0 px overflow, no element wider than 390, 0 errors, 0
 * serious axe) and four more after a wrap fix (pqc-101 family headers,
 * secure-boot stage rows, sbom element map, automotive vehicle and zone
 * cards). Three single-page workshops (digital-assets, mls-group-messaging,
 * tls-basics) have no step nav on the phone and stay off until walked by
 * hand. Evidence: priv `round9-records/wave3-phone-probe-4.107.0.json`.
 */
export const MOBILE_WORKSHOP_READY: ReadonlySet<string> = new Set([
  '5g-security',
  'aerospace-pqc',
  'ai-security-pqc',
  'api-security-jwt',
  'arch-quantum-impact',
  'automotive-pqc',
  'cbom',
  'code-signing',
  'compliance-strategy',
  'confidential-computing',
  'crypto-agility',
  'crypto-dev-apis',
  'crypto-mgmt-modernization',
  'crypto-registry',
  'data-asset-sensitivity',
  'database-encryption-pqc',
  'dev-quantum-impact',
  'digital-id',
  'dnssec-pqc',
  'email-signing',
  'emv-payment-pqc',
  'energy-utilities-pqc',
  'entropy-randomness',
  'exec-quantum-impact',
  'government-defense-pqc',
  'healthcare-pqc',
  'hsm-pqc',
  'hybrid-crypto',
  'iam-pqc',
  'iot-ot-pqc',
  'kms-pqc',
  'merkle-tree-certs',
  'migration-program',
  'network-security-pqc',
  'ops-quantum-impact',
  'os-pqc',
  'pki-enrollment-protocols',
  'pki-workshop',
  'platform-eng-pqc',
  'pqc-101',
  'pqc-business-case',
  'pqc-candidates',
  'pqc-governance',
  'pqc-grc',
  'pqc-risk-management',
  'pqc-testing-validation',
  'qkd',
  'quantum-threats',
  'research-quantum-impact',
  'sbom',
  'secrets-management-pqc',
  'secure-boot-pqc',
  'skills-team-structure',
  'slh-dsa',
  'soc-implementation-pqc',
  'standards-bodies',
  'stateful-signatures',
  'trust-services-pqc',
  'vendor-risk',
  'verification-closure',
  'vpn-ssh-pqc',
  'web-gateway-pqc',
])
