// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection -- all index keys are typed
   `RuleFamily` / `RuleTypeId` enum values from the catalog, never user input. */
//
// ruleCatalog.ts — the editable-rule catalog for the CACP visual policy editor.
// One spec per rule `type:` in the policy grammar (`pqctoday-hsm/kmip/src/policy/
// rule.rs` is the source of truth — 18 variants). Each spec carries the visual
// family (colour + icon), the typed field list that drives both the inspector
// and the YAML serializer, a factory for a fresh rule, and a one-line summary
// used on the graph node. Field KEYS and shapes must match rule.rs exactly —
// the serializer emits them verbatim.
import type { LucideIcon } from 'lucide-react'
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Ban,
  KeyRound,
  Clock,
  Activity,
  Settings2,
  GitMerge,
  BadgeCheck,
} from 'lucide-react'
import type { EditableRule } from './policyEditModel'

/** The 18 rule types the policy grammar defines. */
export type RuleTypeId =
  | 'algorithm_default'
  | 'algorithm_substitution'
  | 'hybrid_dual_sign_requirement'
  | 'algorithm_allowlist'
  | 'lifecycle_state_gate'
  | 'compliance_profile_gate'
  | 'algorithm_denylist'
  | 'mechanism_denylist'
  | 'min_key_length'
  | 'max_key_age_days'
  | 'require_usage_mask'
  | 'require_custom_attribute'
  | 'temporal_cutoff'
  | 'hash_algorithm_allowlist'
  | 'mechanism_parameter_constraint'
  | 'mechanism_parameter_default'
  | 'mechanism_allowlist'
  | 'mac_mechanism_policy'

/** Visual family — drives node colour, icon chip, palette grouping. */
export type RuleFamily = 'resolve' | 'allow' | 'deny' | 'require' | 'time' | 'mechanism'

export interface FamilyMeta {
  label: string
  meaning: string
  /** Raw CSS channel var (used for SVG strokes: `hsl(var(--x))`). */
  cssVar: string
  /** Tailwind text / bg / border classes (semantic tokens only). */
  text: string
  bg: string
  border: string
}

export const FAMILY_META: Record<RuleFamily, FamilyMeta> = {
  resolve: {
    label: 'Resolve',
    meaning: 'Sets or transforms which algorithm the request uses',
    cssVar: '--success',
    text: 'text-status-success',
    bg: 'bg-status-success/10',
    border: 'border-status-success',
  },
  allow: {
    label: 'Allow',
    meaning: 'Lets the request through when it matches the list',
    cssVar: '--info',
    text: 'text-status-info',
    bg: 'bg-status-info/10',
    border: 'border-status-info',
  },
  deny: {
    label: 'Deny',
    meaning: 'Blocks any request that matches',
    cssVar: '--destructive',
    text: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive',
  },
  require: {
    label: 'Require',
    meaning: 'Demands the request carry a property, else deny',
    cssVar: '--secondary',
    text: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary',
  },
  time: {
    label: 'Time',
    meaning: 'Date-gated — bites only after a cutoff',
    cssVar: '--warning',
    text: 'text-status-warning',
    bg: 'bg-status-warning/10',
    border: 'border-status-warning',
  },
  mechanism: {
    label: 'Mechanism',
    meaning: 'Constrains low-level mechanism params (hash, MAC, padding)',
    cssVar: '--primary',
    text: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary',
  },
}

export const FAMILY_ORDER: RuleFamily[] = [
  'resolve',
  'allow',
  'deny',
  'require',
  'time',
  'mechanism',
]

/** SVG-safe colour for a family (wires, ports, glows). */
export const familyColor = (f: RuleFamily, alpha?: number): string =>
  alpha == null
    ? `hsl(var(${FAMILY_META[f].cssVar}))`
    : `hsl(var(${FAMILY_META[f].cssVar}) / ${alpha})`

// ── Vocabularies (match the engine's canonical names, per the shipped fixtures) ──

export const KMIP_OPS = [
  'Create',
  'CreateKeyPair',
  'CreateKeyPair:Sign',
  'CreateKeyPair:KeyAgreement',
  'CreateKeyPair:Encrypt',
  'Register',
  'Import',
  'Sign',
  'SignatureVerify',
  'Encrypt',
  'Decrypt',
  'Encapsulate',
  'Decapsulate',
  'MAC',
  'MACVerify',
] as const

export const KEY_STATES = ['PreActive', 'Active', 'Deactivated', 'Compromised', 'Destroyed']

export const USAGE_FLAGS = [
  'Sign',
  'Verify',
  'Encrypt',
  'Decrypt',
  'WrapKey',
  'UnwrapKey',
  'DeriveKey',
  'KeyAgreement',
  'MACGenerate',
  'MACVerify',
]

export const ALGORITHM_CLASSES = ['classical', 'pqc', 'symmetric']

export interface ScopeMeta {
  /** Wire form — `Scope`'s `#[serde(rename_all = "kebab-case")]` tag, e.g.
   * `key-establishment` (see any split policy's `scopes:` list). */
  id: string
  label: string
}

/** The 7 `Scope` values (`pqctoday-hsm/kmip/src/policy/rule.rs::Scope::ALL`),
 * in the engine's own display order. Guarded against drift by
 * `ruleCatalog.local.test.ts` (WS-6, 2026-08-28 gaps-remediation plan) —
 * the same sibling-checkout live-read `known_fields_for_rule_type` already
 * uses, extended to also cover this enum. */
export const SCOPES: ScopeMeta[] = [
  { id: 'signing', label: 'Signing' },
  { id: 'key-establishment', label: 'Key establishment' },
  { id: 'encryption', label: 'Encryption' },
  { id: 'mac-hash', label: 'MAC / hash' },
  { id: 'ingress', label: 'Ingress' },
  { id: 'lifecycle', label: 'Lifecycle' },
  { id: 'global', label: 'Global' },
]

// Request-simulator vocabularies — mirror the engine's name tables in
// `pqctoday-hsm/kmip/src/policy/rule.rs` (hash_name_to_code,
// block_cipher_mode_name_to_code, padding_method_name_to_code,
// ckm_name_to_code). Names, not codepoints: the sim compares names and the
// engine's tables are injective, so name equality ⇔ codepoint equality.
export const HASH_NAMES = [
  'SHA-1',
  'SHA-224',
  'SHA-256',
  'SHA-384',
  'SHA-512',
  'SHA-512/224',
  'SHA-512/256',
  'SHA3-224',
  'SHA3-256',
  'SHA3-384',
  'SHA3-512',
]

export const BLOCK_MODES = ['CBC', 'ECB', 'CFB', 'OFB', 'CTR', 'CMAC', 'CCM', 'GCM', 'XTS']

export const PADDING_METHODS = ['None', 'OAEP', 'PKCS5', 'PKCS1 v1.5', 'X9.31', 'PSS']

export const CKM_SUGGESTIONS = [
  'CKM_AES_GCM',
  'CKM_AES_CBC',
  'CKM_AES_CBC_PAD',
  'CKM_AES_CTR',
  'CKM_AES_ECB',
  'CKM_RSA_PKCS',
  'CKM_RSA_PKCS_PSS',
  'CKM_RSA_PKCS_OAEP',
  'CKM_ECDSA',
  'CKM_ECDSA_SHA256',
  'CKM_ML_DSA',
  'CKM_ML_KEM',
  'CKM_ML_DSA_KEY_PAIR_GEN',
  'CKM_ML_KEM_KEY_PAIR_GEN',
  'CKM_EC_KEY_PAIR_GEN',
  'CKM_AES_KEY_GEN',
  'CKM_DES3_CBC',
]

/** Suggestion pool for algorithm fields (datalist — free text stays allowed). */
export const ALGO_SUGGESTIONS = [
  'ML-DSA-44',
  'ML-DSA-65',
  'ML-DSA-87',
  'SLH-DSA-SHA2-128s',
  'SLH-DSA-SHA2-256s',
  'ML-KEM-512',
  'ML-KEM-768',
  'ML-KEM-1024',
  'FrodoKEM-1344',
  'Classic-McEliece-6688128',
  'LMS',
  'HSS',
  'XMSS',
  'XMSS-MT',
  'RSA',
  'RSA-2048',
  'RSA-3072',
  'RSA-PKCS1-v1_5',
  'ECDSA-P256',
  'ECDSA-P384',
  'ECDSA-SHA1',
  'Ed25519',
  'ECDH-P256',
  'X25519',
  'AES-128',
  'AES-192',
  'AES-256',
  '3DES',
  'DES',
  'SHA-256',
  'SHA-384',
  'SHA-512',
  'SHA-1',
  'SHA1',
  'MD5',
]

// ── Field specs ─────────────────────────────────────────────────────────────

/** How a field renders in the inspector AND which model bucket it lives in. */
export type FieldKind =
  | 'ops' // multi-chip over KMIP_OPS → lists
  | 'op' // single op select → scalars
  | 'algos' // algorithm tag editor → lists
  | 'algo' // single algorithm (datalist) → scalars
  | 'list' // free tag list (mechanisms, modes…) → lists
  | 'states' // multi-chip over KEY_STATES → lists
  | 'flags' // multi-chip over USAGE_FLAGS → lists
  | 'text' // free text → scalars
  | 'int' // number → scalars (serialized bare)
  | 'bool' // true/false → scalars (serialized bare)
  | 'date' // TimeBound: 'always' | YYYY-MM-DD → scalars (serialized quoted)
  | 'class' // algorithm_class enum → scalars
  | 'attr' // custom-attribute name (x- prefix shown) → scalars
  | 'attrmap' // { name, value } predicate → maps

export interface FieldSpec {
  key: string
  kind: FieldKind
  label?: string
  /** Optional in the grammar (serde default) — omitted from YAML when empty. */
  optional?: boolean
  /** The rule's "central" list — feeds the node sub-line + validation. */
  central?: boolean
}

/** Which EditableRule bucket a field kind reads/writes. */
export const bucketOf = (kind: FieldKind): 'scalars' | 'lists' | 'maps' => {
  if (kind === 'attrmap') return 'maps'
  if (
    kind === 'ops' ||
    kind === 'algos' ||
    kind === 'list' ||
    kind === 'states' ||
    kind === 'flags'
  )
    return 'lists'
  return 'scalars'
}

// ── Rule specs ──────────────────────────────────────────────────────────────

export interface RuleSpec {
  type: RuleTypeId
  family: RuleFamily
  title: string
  blurb: string
  icon: LucideIcon
  /** Transform nodes rewrite the carried algorithm; gates pass-or-deny. */
  node: 'transform' | 'gate'
  /** Shown in the guided-mode palette. */
  guided: boolean
  fields: FieldSpec[]
  /** Factory defaults for a freshly added rule (id/enabled added by caller). */
  make: () => Pick<EditableRule, 'scalars' | 'lists' | 'maps'>
}

const reason: FieldSpec = { key: 'reason', kind: 'text', label: 'reason (shown on deny)' }
const clause: FieldSpec = {
  key: 'clause',
  kind: 'text',
  label: 'implements (clause)',
  optional: true,
}
const opsField: FieldSpec = { key: 'ops', kind: 'ops', label: 'operations' }

export const RULE_CATALOG: Record<RuleTypeId, RuleSpec> = {
  algorithm_default: {
    type: 'algorithm_default',
    family: 'resolve',
    title: 'Default',
    blurb: 'When the caller lets policy decide, use this algorithm.',
    icon: Sparkles,
    node: 'transform',
    guided: true,
    fields: [
      opsField,
      // Label-only agility (engine 0.10.0): an optional case-insensitive
      // glob over the request's key NAME (`*` any run, `?` one char).
      // Name-patterned defaults beat generic ones (most-specific-wins),
      // and a patterned rule never fires for an unnamed request.
      { key: 'name_pattern', kind: 'text', label: 'key-name pattern (glob)', optional: true },
      { key: 'default_algorithm', kind: 'algo', label: 'default →' },
      reason,
      clause,
    ],
    make: () => ({
      scalars: { default_algorithm: 'ML-DSA-65', reason: 'New keys default to ML-DSA-65' },
      lists: { ops: ['CreateKeyPair:Sign'] },
      maps: {},
    }),
  },
  algorithm_substitution: {
    type: 'algorithm_substitution',
    family: 'resolve',
    title: 'Rekey',
    blurb: 'Silently swap one algorithm for another (crypto-agility rekey-on-use).',
    icon: ArrowRight,
    node: 'transform',
    guided: true,
    fields: [
      opsField,
      { key: 'name_pattern', kind: 'text', label: 'key-name pattern (glob)', optional: true },
      { key: 'from', kind: 'algo' },
      { key: 'to', kind: 'algo' },
      reason,
      clause,
    ],
    make: () => ({
      scalars: { from: 'ECDSA-P256', to: 'ML-DSA-65', reason: 'Rekey legacy keys to PQC on use' },
      lists: { ops: ['Sign'] },
      maps: {},
    }),
  },
  hybrid_dual_sign_requirement: {
    type: 'hybrid_dual_sign_requirement',
    family: 'resolve',
    title: 'Hybrid dual-sign',
    blurb: 'Require a composite (classical + PQC) signature during a migration window.',
    icon: GitMerge,
    node: 'transform',
    guided: false,
    fields: [
      { key: 'primary', kind: 'algo' },
      { key: 'secondary', kind: 'algo' },
      { key: 'effective_from', kind: 'date', label: 'effective from' },
      { key: 'effective_until', kind: 'date', label: 'effective until' },
      { key: 'ops_affected', kind: 'ops', label: 'operations affected' },
      { key: 'composite_oid', kind: 'text', label: 'composite OID', optional: true },
      { key: 'triggered_by_custom_attribute', kind: 'attrmap', label: 'when', optional: true },
      reason,
      clause,
    ],
    make: () => ({
      scalars: {
        primary: 'ML-DSA-65',
        secondary: 'Ed25519',
        effective_from: '2026-01-01',
        effective_until: '2029-12-31',
        reason: 'Migration window: composite signature required',
      },
      lists: { ops_affected: ['Sign'] },
      maps: {},
    }),
  },
  algorithm_allowlist: {
    type: 'algorithm_allowlist',
    family: 'allow',
    title: 'Allowlist',
    blurb: 'Only these algorithms are permitted — everything else is denied.',
    icon: ShieldCheck,
    node: 'gate',
    guided: true,
    fields: [
      opsField,
      { key: 'algorithms', kind: 'algos', central: true },
      { key: 'effective_from', kind: 'date', label: 'effective from', optional: true },
      { key: 'effective_until', kind: 'date', label: 'effective until', optional: true },
      reason,
      clause,
    ],
    make: () => ({
      scalars: { reason: 'Algorithm not on the approved list' },
      lists: {
        ops: ['Create', 'CreateKeyPair'],
        algorithms: ['ML-DSA-87', 'ML-KEM-1024', 'AES-256'],
      },
      maps: {},
    }),
  },
  lifecycle_state_gate: {
    type: 'lifecycle_state_gate',
    family: 'allow',
    title: 'Lifecycle gate',
    blurb: 'Only keys in these states may perform the operation.',
    icon: Activity,
    node: 'gate',
    guided: true,
    fields: [
      { key: 'op', kind: 'op', label: 'operation' },
      { key: 'allowed_states', kind: 'states', central: true },
      reason,
      clause,
    ],
    make: () => ({
      scalars: { op: 'Sign', reason: 'Only Active keys may sign' },
      lists: { allowed_states: ['Active'] },
      maps: {},
    }),
  },
  compliance_profile_gate: {
    type: 'compliance_profile_gate',
    family: 'allow',
    title: 'Compliance gate',
    blurb: 'The request must satisfy a named compliance profile.',
    icon: BadgeCheck,
    node: 'gate',
    guided: false,
    fields: [{ key: 'profile', kind: 'text' }, opsField, reason, clause],
    make: () => ({
      scalars: { profile: 'CNSA-2.0', reason: 'Request fails the compliance profile' },
      lists: { ops: ['Create', 'CreateKeyPair', 'Sign'] },
      maps: {},
    }),
  },
  algorithm_denylist: {
    type: 'algorithm_denylist',
    family: 'deny',
    title: 'Deny',
    blurb: 'Block these algorithms outright.',
    icon: Ban,
    node: 'gate',
    guided: true,
    fields: [
      opsField,
      { key: 'algorithms', kind: 'algos', central: true },
      { key: 'effective_from', kind: 'date', label: 'effective from', optional: true },
      { key: 'effective_until', kind: 'date', label: 'effective until', optional: true },
      { key: 'exception_custom_attribute', kind: 'attrmap', label: 'except if', optional: true },
      reason,
      clause,
    ],
    make: () => ({
      scalars: { reason: 'Weak/legacy algorithms banned by policy' },
      lists: { ops: ['Create', 'Sign'], algorithms: ['RSA-PKCS1-v1_5', '3DES'] },
      maps: {},
    }),
  },
  mechanism_denylist: {
    type: 'mechanism_denylist',
    family: 'deny',
    title: 'Mechanism denylist',
    blurb: 'Block these PKCS#11 mechanisms.',
    icon: Ban,
    node: 'gate',
    guided: false,
    fields: [opsField, { key: 'mechanisms', kind: 'list', central: true }, reason, clause],
    make: () => ({
      scalars: { reason: 'Mechanism banned by policy' },
      lists: { ops: ['Encrypt'], mechanisms: ['CKM_DES3_CBC'] },
      maps: {},
    }),
  },
  min_key_length: {
    type: 'min_key_length',
    family: 'require',
    title: 'Min key length',
    blurb: 'Reject keys of a given algorithm below a bit threshold.',
    icon: KeyRound,
    node: 'gate',
    guided: true,
    fields: [
      { key: 'algorithm', kind: 'algo' },
      { key: 'min_bits', kind: 'int', label: 'minimum bits' },
      reason,
      clause,
    ],
    make: () => ({
      scalars: { algorithm: 'RSA', min_bits: '3072', reason: 'Key below organizational minimum' },
      lists: {},
      maps: {},
    }),
  },
  max_key_age_days: {
    type: 'max_key_age_days',
    family: 'require',
    title: 'Max key age',
    blurb: 'Force rotation — keys older than N days may not be used.',
    icon: KeyRound,
    node: 'gate',
    guided: false,
    fields: [opsField, { key: 'days', kind: 'int' }, reason, clause],
    make: () => ({
      scalars: { days: '365', reason: 'Key exceeded maximum age; rotate it' },
      lists: { ops: ['Sign'] },
      maps: {},
    }),
  },
  require_usage_mask: {
    type: 'require_usage_mask',
    family: 'require',
    title: 'Usage mask',
    blurb: 'Keys of this algorithm must declare these usage flags.',
    icon: KeyRound,
    node: 'gate',
    guided: true,
    fields: [
      { key: 'algorithm', kind: 'algo' },
      { key: 'flags', kind: 'flags', central: true },
      // Optional scope; the engine defaults to the creation/ingress ops
      // (Create, CreateKeyPair, Register, Import) when omitted (2026-07-04).
      { key: 'ops', kind: 'ops', label: 'operations (default: creation ops)', optional: true },
      reason,
      clause,
    ],
    make: () => ({
      scalars: { algorithm: 'ML-KEM-768', reason: 'KEM keys must declare KeyAgreement' },
      // Explicit creation-scope default (matches the engine's implicit
      // default) so new rules are self-documenting about where they gate.
      lists: { flags: ['KeyAgreement'], ops: ['Create', 'CreateKeyPair', 'Register', 'Import'] },
      maps: {},
    }),
  },
  require_custom_attribute: {
    type: 'require_custom_attribute',
    family: 'require',
    title: 'Require attribute',
    blurb: 'Requests for these algorithms must carry a custom x-attribute.',
    icon: KeyRound,
    node: 'gate',
    guided: true,
    fields: [
      { key: 'attribute_name', kind: 'attr', label: 'attribute name' },
      { key: 'algorithms', kind: 'algos', central: true },
      // Optional scope; engine default = creation/ingress ops (2026-07-04).
      { key: 'ops', kind: 'ops', label: 'operations (default: creation ops)', optional: true },
      reason,
      clause,
    ],
    make: () => ({
      scalars: {
        attribute_name: 'pqctoday-purpose',
        reason: 'Production keys must declare a purpose',
      },
      lists: {
        algorithms: ['ML-DSA-65', 'ML-DSA-87'],
        ops: ['Create', 'CreateKeyPair', 'Register', 'Import'],
      },
      maps: {},
    }),
  },
  temporal_cutoff: {
    type: 'temporal_cutoff',
    family: 'time',
    title: 'Time cutoff',
    blurb: 'After a date, deny a class of algorithms for one operation.',
    icon: Clock,
    node: 'gate',
    guided: true,
    fields: [
      { key: 'op', kind: 'op', label: 'operation' },
      { key: 'algorithm_class', kind: 'class', label: 'algorithm class' },
      { key: 'algorithms', kind: 'algos', optional: true },
      { key: 'after', kind: 'date', label: 'after (cutoff date)' },
      reason,
      clause,
    ],
    make: () => ({
      scalars: {
        op: 'Sign',
        algorithm_class: 'classical',
        after: '2030-01-01',
        reason: 'Classical signing banned from 2030-01-01',
      },
      lists: {},
      maps: {},
    }),
  },
  hash_algorithm_allowlist: {
    type: 'hash_algorithm_allowlist',
    family: 'mechanism',
    title: 'Hash allowlist',
    blurb: 'Only these hashing algorithms are permitted.',
    icon: Settings2,
    node: 'gate',
    guided: false,
    fields: [
      opsField,
      { key: 'hashing_algorithms', kind: 'algos', central: true },
      { key: 'effective_from', kind: 'date', label: 'effective from', optional: true },
      { key: 'effective_until', kind: 'date', label: 'effective until', optional: true },
      reason,
      clause,
    ],
    make: () => ({
      scalars: { reason: 'Hash not on the approved list' },
      lists: { ops: ['Sign'], hashing_algorithms: ['SHA-384', 'SHA-512'] },
      maps: {},
    }),
  },
  mechanism_parameter_constraint: {
    type: 'mechanism_parameter_constraint',
    family: 'mechanism',
    title: 'Mechanism constraint',
    blurb: 'Constrain allowed block-cipher modes / padding methods.',
    icon: Settings2,
    node: 'gate',
    guided: false,
    fields: [
      opsField,
      { key: 'algorithm', kind: 'algo', optional: true },
      {
        key: 'allowed_block_cipher_modes',
        kind: 'list',
        label: 'allowed modes',
        central: true,
        optional: true,
      },
      { key: 'allowed_padding_methods', kind: 'list', label: 'allowed padding', optional: true },
      { key: 'require_deterministic', kind: 'bool', optional: true },
      reason,
      clause,
    ],
    make: () => ({
      scalars: { reason: 'Mode/padding not permitted' },
      lists: { ops: ['Encrypt'], allowed_block_cipher_modes: ['GCM'] },
      maps: {},
    }),
  },
  mechanism_parameter_default: {
    type: 'mechanism_parameter_default',
    family: 'mechanism',
    title: 'Mechanism default',
    blurb: 'Fill in mechanism parameters when the caller leaves them unspecified.',
    icon: Settings2,
    node: 'transform',
    guided: false,
    fields: [
      opsField,
      { key: 'algorithm', kind: 'algo', optional: true },
      { key: 'hashing_algorithm', kind: 'text', optional: true },
      { key: 'block_cipher_mode', kind: 'text', optional: true },
      { key: 'padding_method', kind: 'text', optional: true },
      { key: 'deterministic', kind: 'bool', optional: true },
      { key: 'mask_generator', kind: 'text', optional: true },
      { key: 'tag_length', kind: 'int', optional: true },
      { key: 'salt_length', kind: 'int', optional: true },
      reason,
      clause,
    ],
    make: () => ({
      scalars: { block_cipher_mode: 'GCM', reason: 'Default to AEAD when unspecified' },
      lists: { ops: ['Encrypt'] },
      maps: {},
    }),
  },
  mechanism_allowlist: {
    type: 'mechanism_allowlist',
    family: 'mechanism',
    title: 'Mechanism allowlist',
    blurb: 'Only these PKCS#11 mechanisms are permitted.',
    icon: Settings2,
    node: 'gate',
    guided: false,
    fields: [opsField, { key: 'mechanisms', kind: 'list', central: true }, reason, clause],
    make: () => ({
      scalars: { reason: 'Mechanism not on the approved list' },
      lists: { ops: ['Encrypt'], mechanisms: ['CKM_AES_GCM'] },
      maps: {},
    }),
  },
  mac_mechanism_policy: {
    type: 'mac_mechanism_policy',
    family: 'mechanism',
    title: 'MAC policy',
    blurb: 'Only these MAC algorithms are permitted.',
    icon: Settings2,
    node: 'gate',
    guided: false,
    fields: [opsField, { key: 'mac_algorithms', kind: 'algos', central: true }, reason, clause],
    make: () => ({
      scalars: { reason: 'MAC algorithm not permitted' },
      lists: { ops: ['MAC'], mac_algorithms: ['HMAC-SHA-384'] },
      maps: {},
    }),
  },
}

export const RULE_TYPE_IDS = Object.keys(RULE_CATALOG) as RuleTypeId[]

export const isRuleTypeId = (t: string): t is RuleTypeId =>
  Object.prototype.hasOwnProperty.call(RULE_CATALOG, t)

/** The node sub-line: the one fact that identifies this rule at a glance. */
export function summarizeRule(rule: EditableRule): string {
  const s = rule.scalars
  const spec = isRuleTypeId(rule.type) ? RULE_CATALOG[rule.type] : undefined
  switch (rule.type) {
    case 'algorithm_default':
      return `→ ${s.default_algorithm ?? '?'}`
    case 'algorithm_substitution':
      return `${s.from ?? '?'} → ${s.to ?? '?'}`
    case 'hybrid_dual_sign_requirement':
      return `${s.primary ?? '?'} + ${s.secondary ?? '?'}`
    case 'min_key_length':
      return `${s.algorithm ?? '?'} ≥ ${s.min_bits ?? '?'}`
    case 'max_key_age_days':
      return `≤ ${s.days ?? '?'} days`
    case 'temporal_cutoff':
      return `after ${s.after ?? '?'}`
    case 'require_custom_attribute':
      return `x-${s.attribute_name ?? '?'}`
    case 'require_usage_mask':
      return `${s.algorithm ?? '?'}: ${(rule.lists.flags ?? []).join('+')}`
    case 'compliance_profile_gate':
      return s.profile ?? ''
    case 'mechanism_parameter_default': {
      const parts = [s.block_cipher_mode, s.hashing_algorithm, s.padding_method].filter(Boolean)
      return parts.length ? `→ ${parts.join(' / ')}` : ''
    }
    default: {
      const central = spec?.fields.find((f) => f.central)
      const vals = central ? (rule.lists[central.key] ?? []) : []
      if (!vals.length) return ''
      return vals.slice(0, 2).join(', ') + (vals.length > 2 ? ` +${vals.length - 2}` : '')
    }
  }
}

/** The central list of a rule (drives empty-list validation). */
export function centralListOf(rule: EditableRule): { key: string; values: string[] } | null {
  if (!isRuleTypeId(rule.type)) return null
  const central = RULE_CATALOG[rule.type].fields.find((f) => f.central)
  if (!central) return null
  return { key: central.key, values: rule.lists[central.key] ?? [] }
}
