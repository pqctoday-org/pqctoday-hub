// SPDX-License-Identifier: GPL-3.0-only
// Presentational metadata for the Crypto Lab Workbench (/playground).
// Pure data — descriptions, icons, role labels and the special-playground
// feature cards. Tool data itself is sourced from `workshopRegistry`.
import {
  Terminal,
  Cpu,
  Dice5,
  ShieldCheck,
  Fingerprint,
  Bitcoin,
  Network,
  Play,
} from 'lucide-react'
import type React from 'react'
import type { PersonaId } from '@/data/learningPersonas'
import { CATEGORIES, type WorkshopCategory } from './workshopRegistry'

export interface CategoryMeta {
  icon: React.ElementType
  description: string
}

/** Per-domain-category icon + one-line description for the sidebar & headers. */
export const CATEGORY_META: Record<WorkshopCategory, CategoryMeta> = {
  'OpenSSL Studio': {
    icon: Terminal,
    description:
      'A full OpenSSL 3.6 environment plus protocol simulators, compiled to WebAssembly.',
  },
  'HSM / PKCS#11': {
    icon: Cpu,
    description:
      'Real PKCS#11 v3.2 operations on SoftHSM WASM with dual C++/Rust engine cross-validation.',
  },
  'Entropy & Random': {
    icon: Dice5,
    description: 'Random generation, entropy testing and DRBG internals per NIST SP 800-90.',
  },
  'Certificates & Proofs': {
    icon: ShieldCheck,
    description: 'X.509 chains, hybrid certificate formats, Merkle proofs and transparency logs.',
  },
  'Digital Identity': {
    icon: Fingerprint,
    description: 'EUDI wallets, verifiable credentials and the digital identity lifecycle.',
  },
  'Blockchain & Digital Assets': {
    icon: Bitcoin,
    description: 'secp256k1 / Ed25519 transactions and HD wallet key derivation.',
  },
  'Protocol Simulations': {
    icon: Network,
    description: 'Live TLS, SSH, VPN, 5G, MLS and TPM protocol handshakes in WebAssembly.',
  },
}

/** Sidebar order — domain categories only (no "Sandbox" facet). */
export const SIDEBAR_CATEGORIES: readonly WorkshopCategory[] = CATEGORIES

/** "Viewing as" role options — `null` = Everyone (no role). */
export interface RoleOption {
  id: PersonaId | null
  label: string
}

export const ROLE_OPTIONS: readonly RoleOption[] = [
  { id: null, label: 'Everyone' },
  { id: 'developer', label: 'Developer' },
  { id: 'architect', label: 'Security Architect' },
  { id: 'ops', label: 'IT Ops / DevOps' },
  { id: 'executive', label: 'Executive / GRC' },
  { id: 'researcher', label: 'Researcher' },
  { id: 'curious', label: 'Curious Explorer' },
]

export function roleLabel(id: PersonaId | null): string {
  return ROLE_OPTIONS.find((r) => r.id === id)?.label ?? 'Everyone'
}

/** Short persona chip labels for the tool-detail "Recommended for" row. */
export const PERSONA_CHIP_LABEL: Record<PersonaId, string> = {
  executive: 'Executive / GRC',
  developer: 'Developer',
  architect: 'Security Architect',
  researcher: 'Researcher',
  ops: 'IT Ops / DevOps',
  curious: 'Curious Explorer',
}

/** Accent token used to tint a feature card. */
export type FeatureAccent = 'primary' | 'secondary' | 'success'

export interface FeaturePlayground {
  to: string
  icon: React.ElementType
  title: string
  description: string
  tag: string
  accent: FeatureAccent
}

/** The three "Full playgrounds" gradient cards on the Overview. */
export const FEATURE_PLAYGROUNDS: readonly FeaturePlayground[] = [
  {
    to: '/playground/interactive',
    icon: Play,
    title: 'Interactive Playground',
    description: 'Keygen, KEM, signing and hashing — live via WebAssembly.',
    tag: 'ML-KEM · ML-DSA · AES',
    accent: 'primary',
  },
  {
    to: '/playground/hsm',
    icon: Cpu,
    title: 'PKCS#11 HSM',
    description: 'Real PKCS#11 v3.2 on SoftHSM WASM, dual-engine cross-validation.',
    tag: 'SoftHSM · ACVP',
    accent: 'secondary',
  },
  {
    to: '/playground/cacp',
    icon: Network,
    title: 'KMIP Control Plane',
    description: 'Flip a crypto-agility policy, watch ops switch to PQC.',
    tag: 'KMIP 3.0 · WASM',
    accent: 'success',
  },
]

/** Route target for the featured KMIP banner (the crypto-agile KMIP playground). */
export const KMIP_PLAYGROUND_ROUTE = '/playground/cacp'

/** Sandbox container access request (mirrors SandboxStatusToggle). */
export const SANDBOX_ACCESS_MAILTO = 'mailto:pqctoday@gmail.com?subject=Sandbox%20Access%20Request'
