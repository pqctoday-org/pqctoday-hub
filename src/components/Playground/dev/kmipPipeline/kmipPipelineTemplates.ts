// SPDX-License-Identifier: GPL-3.0-only
/**
 * Starter templates for the KMIP Developer tab (dev-tabs-pkcs11-kmip plan
 * WS-E). Same role as ../pipeline/pipelineTemplates.ts on the PKCS#11 side.
 *
 * "Governed lifecycle" reproduces the shape of the sandbox's own real
 * samples/py/17-kmip-cacp.py sample (proven live in P3) — CreateKeyPair,
 * a governed refusal BEFORE Activate, Activate, Sign, GetAttributes,
 * Locate, Revoke, Destroy — the exact teaching moment the whole KMIP
 * Developer tab exists for.
 */
import type { KmipStep } from './kmipPipelineCodegen'

export const KMIP_TEMPLATES: Record<string, KmipStep[]> = {
  'Governed lifecycle': [
    { kind: 'op', id: 'create', primId: 'ml-dsa-65', op: 'createKeyPair', params: {} },
    {
      kind: 'op', id: 'sign-early', primId: 'ml-dsa-65', op: 'sign',
      params: { privUid: { bind: 'ref', step: 'create', part: 'priv' } },
    },
    { kind: 'expect-deny', id: 'deny-early', targetStepId: 'sign-early' },
    {
      kind: 'op', id: 'activate', primId: 'ml-dsa-65', op: 'activate',
      params: { uid: { bind: 'ref', step: 'create', part: 'priv' } },
    },
    {
      kind: 'op', id: 'sign', primId: 'ml-dsa-65', op: 'sign',
      params: { privUid: { bind: 'ref', step: 'create', part: 'priv' } },
    },
    {
      kind: 'op', id: 'attrs', primId: 'ml-dsa-65', op: 'getAttributes',
      params: { uid: { bind: 'ref', step: 'create', part: 'priv' } },
    },
    { kind: 'op', id: 'locate', primId: 'ml-dsa-65', op: 'locate', params: {} },
    {
      kind: 'op', id: 'revoke', primId: 'ml-dsa-65', op: 'revoke',
      params: { uid: { bind: 'ref', step: 'create', part: 'priv' } },
    },
    {
      kind: 'op', id: 'destroy', primId: 'ml-dsa-65', op: 'destroy',
      params: { uid: { bind: 'ref', step: 'create', part: 'priv' } },
    },
  ],
  'ML-KEM round trip': [
    { kind: 'op', id: 'create', primId: 'ml-kem-768', op: 'createKeyPair', params: {} },
    {
      kind: 'op', id: 'activate-pub', primId: 'ml-kem-768', op: 'activate',
      params: { uid: { bind: 'ref', step: 'create', part: 'pub' } },
    },
    {
      kind: 'op', id: 'activate-priv', primId: 'ml-kem-768', op: 'activate',
      params: { uid: { bind: 'ref', step: 'create', part: 'priv' } },
    },
    {
      kind: 'op', id: 'encap', primId: 'ml-kem-768', op: 'encapsulate',
      params: { pubUid: { bind: 'ref', step: 'create', part: 'pub' } },
    },
    {
      kind: 'op', id: 'decap', primId: 'ml-kem-768', op: 'decapsulate',
      params: {
        privUid: { bind: 'ref', step: 'create', part: 'priv' },
        ciphertext: { bind: 'ref', step: 'encap', part: 'ciphertext' },
      },
    },
  ],
  'Policy dry-run compare': [
    { kind: 'load-policy', id: 'load-permissive', policyFile: 'training-permissive.yaml' },
    { kind: 'dry-run', id: 'dry-permissive', op: 'CreateKeyPair', algorithm: 'ML_DSA_65' },
    { kind: 'load-policy', id: 'load-cnsa', policyFile: 'cnsa-2.0.yaml' },
    { kind: 'dry-run', id: 'dry-cnsa', op: 'CreateKeyPair', algorithm: 'ML_DSA_65' },
  ],
  Empty: [],
}

export const KMIP_TEMPLATE_NAMES = Object.keys(KMIP_TEMPLATES)

export const KMIP_TEMPLATE_OUTCOMES: Record<string, string> = {
  'Governed lifecycle':
    'A key signed before Activate is refused by the KMIP lifecycle plane — the same governed-refusal pattern the dev sandbox\'s real KMIP sample teaches, running against the same policy engine.',
  'ML-KEM round trip':
    'Encapsulate and Decapsulate derive matching shared secrets through real ML-KEM-768 operations — the same FIPS 203 mechanism the dev sandbox exercises.',
  'Policy dry-run compare':
    'The same CreateKeyPair request evaluated under two different policies without executing anything — showing how crypto agility is a POLICY decision, not a code change.',
}
