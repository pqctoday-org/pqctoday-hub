// SPDX-License-Identifier: GPL-3.0-only
/**
 * simArchitecture — per-organisation-size system + protocol topologies for the
 * Simulation. Nodes backed by a real product carry a `productRef` (the
 * catalog's exact `softwareName`); their PQC status is looked up from
 * `catalogStatus.ts` (the app's single source of truth) at module load, never
 * hard-coded here — that is what previously let a node's status drift from
 * the catalog. Generic/illustrative nodes with no single real-world product
 * (e.g. "Enterprise PKI", "Global AD") keep an explicit literal `pqcStatus`
 * instead, since there is nothing in the catalog to derive them from; each is
 * commented as such below. Edges carry a protocol PQC path (mirroring the
 * Algorithms PQC Protocol Matrix — hand-asserted, no equivalent live source
 * exists yet for protocols). The mix deliberately includes products with and
 * without PQC so readiness is never 100%.
 *
 * Representative topologies (not exhaustive) — see SIMULATION-DESIGN.md §3.
 */
import type { SimSize } from './moscaClock'
import { getCatalogStatus, type CatalogAvailability } from './catalogStatus'

export type PqcStatus = CatalogAvailability
/** From the protocol matrix: does this protocol have a standard PQC path? */
export type PqcPath = 'available' | 'vendor' | 'none'

export interface SystemNode {
  id: string
  label: string
  layer: string
  /** Exact catalog `softwareName` for nodes backed by a real product — when
   *  set, `pqcStatus` is derived from it via `catalogStatus()` below. Omit
   *  for generic/illustrative nodes (no single real product to point at). */
  productRef?: string
  pqcStatus: PqcStatus
}

/** Look up a node's PQC status from the catalog (the single source of truth) by
 *  its exact `software_name`. Falls back to `'unverified'` if the name doesn't
 *  resolve — that should never happen for a name copied from the catalog, and
 *  surfaces as a visibly distinct color rather than silently defaulting to a
 *  wrong status. */
function catalogPqcStatus(softwareName: string): PqcStatus {
  return getCatalogStatus(softwareName)?.availability ?? 'unverified'
}

export interface ProtocolEdge {
  from: string
  to: string
  protocol: string
  pqcPath: PqcPath
  vulnerable: boolean
  /** Irreducible: no PQC path → compensate (defense-in-depth), never migrate. */
  monitorOnly?: boolean
}

export interface Architecture {
  size: SimSize
  nodes: SystemNode[]
  edges: ProtocolEdge[]
}

const small: Architecture = {
  size: 'small',
  nodes: [
    { id: 'user', label: 'User', layer: 'Actor', pqcStatus: 'available' },
    { id: 'admin', label: 'Admin', layer: 'Actor', pqcStatus: 'available' },
    {
      id: 'cdn',
      label: 'Caddy Web/LB',
      layer: 'Edge',
      productRef: 'Caddy Server',
      pqcStatus: catalogPqcStatus('Caddy Server'),
    },
    // Generic app server, no single real product to point at.
    { id: 'app', label: 'App Server', layer: 'AppServers', pqcStatus: 'available' },
    {
      id: 'db',
      label: 'MongoDB',
      layer: 'Database',
      productRef: 'MongoDB Queryable Encryption',
      pqcStatus: catalogPqcStatus('MongoDB Queryable Encryption'),
    },
    {
      id: 'idp',
      label: 'Entra ID',
      layer: 'Cloud',
      productRef: 'Microsoft Entra ID',
      pqcStatus: catalogPqcStatus('Microsoft Entra ID'),
    },
    {
      id: 'vpn',
      label: 'strongSwan VPN',
      layer: 'Network',
      productRef: 'strongSwan',
      pqcStatus: catalogPqcStatus('strongSwan'),
    },
    {
      id: 'ca',
      label: "Let's Encrypt",
      layer: 'PKI',
      productRef: "Let's Encrypt",
      pqcStatus: catalogPqcStatus("Let's Encrypt"),
    },
  ],
  edges: [
    { from: 'user', to: 'cdn', protocol: 'TLS 1.3', pqcPath: 'available', vulnerable: true },
    { from: 'cdn', to: 'app', protocol: 'TLS', pqcPath: 'available', vulnerable: true },
    { from: 'app', to: 'db', protocol: 'TLS (wire)', pqcPath: 'available', vulnerable: true },
    { from: 'app', to: 'idp', protocol: 'OIDC', pqcPath: 'vendor', vulnerable: true },
    { from: 'admin', to: 'vpn', protocol: 'IKEv2', pqcPath: 'available', vulnerable: true },
    { from: 'cdn', to: 'ca', protocol: 'ACME', pqcPath: 'available', vulnerable: true },
  ],
}

const mid: Architecture = {
  size: 'mid',
  nodes: [
    { id: 'user', label: 'User', layer: 'Actor', pqcStatus: 'available' },
    { id: 'admin', label: 'Admin', layer: 'Actor', pqcStatus: 'available' },
    // Generic WAF/load-balancer — not a single named product.
    { id: 'waf', label: 'WAF', layer: 'Edge', pqcStatus: 'none' },
    { id: 'lb', label: 'Load Balancer', layer: 'Edge', pqcStatus: 'available' },
    {
      id: 'app1',
      label: 'App · wolfSSL',
      layer: 'AppServers',
      productRef: 'wolfSSL',
      pqcStatus: catalogPqcStatus('wolfSSL'),
    },
    {
      id: 'app2',
      label: 'App · Envoy',
      layer: 'AppServers',
      productRef: 'Envoy Proxy',
      pqcStatus: catalogPqcStatus('Envoy Proxy'),
    },
    {
      id: 'oracle',
      label: 'Oracle 26ai',
      layer: 'Database',
      productRef: 'Oracle AI Database 26ai',
      pqcStatus: catalogPqcStatus('Oracle AI Database 26ai'),
    },
    {
      id: 'sql',
      label: 'SQL Server',
      layer: 'Database',
      productRef: 'SQL Server TDE/Always Encrypted',
      pqcStatus: catalogPqcStatus('SQL Server TDE/Always Encrypted'),
    },
    {
      id: 'idp',
      label: 'Entra ID',
      layer: 'Identity',
      productRef: 'Microsoft Entra ID',
      pqcStatus: catalogPqcStatus('Microsoft Entra ID'),
    },
    {
      id: 'hsm',
      label: 'Entrust nShield',
      layer: 'HSM',
      productRef: 'Entrust nShield',
      pqcStatus: catalogPqcStatus('Entrust nShield'),
    },
    // Active Directory itself has no catalog entry (only specific host OSes do) —
    // left as a generic, manually-asserted identity node.
    { id: 'ad', label: 'Active Directory', layer: 'Identity', pqcStatus: 'none' },
  ],
  edges: [
    { from: 'user', to: 'waf', protocol: 'TLS 1.3', pqcPath: 'available', vulnerable: true },
    { from: 'waf', to: 'lb', protocol: 'TLS', pqcPath: 'available', vulnerable: true },
    { from: 'lb', to: 'app1', protocol: 'mTLS', pqcPath: 'available', vulnerable: true },
    { from: 'app1', to: 'oracle', protocol: 'TLS (DB)', pqcPath: 'available', vulnerable: true },
    { from: 'app2', to: 'sql', protocol: 'TLS (DB)', pqcPath: 'available', vulnerable: true },
    { from: 'app1', to: 'idp', protocol: 'OIDC', pqcPath: 'vendor', vulnerable: true },
    { from: 'admin', to: 'app1', protocol: 'SSH', pqcPath: 'available', vulnerable: true },
    { from: 'app1', to: 'hsm', protocol: 'PKCS#11', pqcPath: 'available', vulnerable: true },
    {
      from: 'app1',
      to: 'ad',
      protocol: 'Kerberos',
      pqcPath: 'none',
      vulnerable: true,
      monitorOnly: true,
    },
  ],
}

const large: Architecture = {
  size: 'large',
  nodes: [
    { id: 'user', label: 'User', layer: 'Actor', pqcStatus: 'available' },
    {
      id: 'edge',
      label: 'F5 BIG-IP',
      layer: 'Edge',
      productRef: 'F5 BIG-IP',
      pqcStatus: catalogPqcStatus('F5 BIG-IP'),
    },
    // Generic app mesh — not a single named product.
    { id: 'app', label: 'App Mesh', layer: 'AppServers', pqcStatus: 'available' },
    // Generic "Oracle" (unlike mid's specific "Oracle 26ai") — left manual.
    { id: 'oracle', label: 'Oracle', layer: 'Database', pqcStatus: 'available' },
    {
      id: 'mongo',
      label: 'MongoDB',
      layer: 'Database',
      productRef: 'MongoDB Queryable Encryption',
      pqcStatus: catalogPqcStatus('MongoDB Queryable Encryption'),
    },
    // Generic enterprise PKI — not a single named product.
    { id: 'pki', label: 'Enterprise PKI', layer: 'PKI', pqcStatus: 'none' },
    {
      id: 'hsm',
      label: 'Luna HSM',
      layer: 'HSM',
      productRef: 'Thales Luna HSM',
      pqcStatus: catalogPqcStatus('Thales Luna HSM'),
    },
    // Generic mainframe — not a single named product.
    { id: 'mainframe', label: 'Mainframe', layer: 'Mainframe', pqcStatus: 'none' },
    {
      id: 'payshield',
      label: 'payShield',
      layer: 'Payments',
      productRef: 'Thales payShield 10K',
      pqcStatus: catalogPqcStatus('Thales payShield 10K'),
    },
    // Generic OT/SCADA — not a single named product.
    { id: 'ot', label: 'OT / SCADA', layer: 'OT', pqcStatus: 'none' },
  ],
  edges: [
    { from: 'user', to: 'edge', protocol: 'TLS 1.3', pqcPath: 'available', vulnerable: true },
    { from: 'edge', to: 'app', protocol: 'mTLS', pqcPath: 'available', vulnerable: true },
    { from: 'app', to: 'oracle', protocol: 'TLS (DB)', pqcPath: 'available', vulnerable: true },
    { from: 'app', to: 'mongo', protocol: 'TLS (DB)', pqcPath: 'available', vulnerable: true },
    { from: 'app', to: 'hsm', protocol: 'PKCS#11', pqcPath: 'available', vulnerable: true },
    { from: 'app', to: 'pki', protocol: 'X.509 issue', pqcPath: 'available', vulnerable: true },
    {
      from: 'mainframe',
      to: 'payshield',
      protocol: 'TR-31',
      pqcPath: 'none',
      vulnerable: true,
      monitorOnly: true,
    },
    {
      from: 'app',
      to: 'ot',
      protocol: 'Modbus/DNP3',
      pqcPath: 'none',
      vulnerable: true,
      monitorOnly: true,
    },
    {
      from: 'edge',
      to: 'app',
      protocol: 'MACsec (DC)',
      pqcPath: 'none',
      vulnerable: true,
      monitorOnly: true,
    },
    {
      from: 'user',
      to: 'edge',
      protocol: 'DNSSEC',
      pqcPath: 'none',
      vulnerable: true,
      monitorOnly: true,
    },
  ],
}

const global: Architecture = {
  size: 'global',
  // All nodes here are cross-region/cross-vendor aggregates (e.g. "Global PKI",
  // "5G Core") with no single real product to point at — all manually asserted.
  nodes: [
    { id: 'gpki', label: 'Global PKI', layer: 'PKI', pqcStatus: 'available' },
    { id: 'fidp', label: 'Federated IdP', layer: 'Identity', pqcStatus: 'available' },
    { id: 'kms', label: 'Central KMS/HSM', layer: 'HSM', pqcStatus: 'available' },
    { id: 'amer', label: 'Americas Stack', layer: 'Region', pqcStatus: 'available' },
    { id: 'emea', label: 'EMEA Stack', layer: 'Region', pqcStatus: 'available' },
    { id: 'apac', label: 'APAC Stack', layer: 'Region', pqcStatus: 'partial' },
    { id: 'telco', label: '5G Core', layer: 'Telecom', pqcStatus: 'none' },
    { id: 'fin', label: 'SWIFT / Financial', layer: 'Financial', pqcStatus: 'none' },
    { id: 'ad', label: 'Global AD', layer: 'Identity', pqcStatus: 'none' },
  ],
  edges: [
    { from: 'gpki', to: 'amer', protocol: 'X.509', pqcPath: 'available', vulnerable: true },
    { from: 'gpki', to: 'emea', protocol: 'X.509', pqcPath: 'available', vulnerable: true },
    { from: 'gpki', to: 'apac', protocol: 'X.509', pqcPath: 'available', vulnerable: true },
    { from: 'amer', to: 'emea', protocol: 'WAN IPsec', pqcPath: 'available', vulnerable: true },
    { from: 'apac', to: 'kms', protocol: 'KMIP', pqcPath: 'available', vulnerable: true },
    { from: 'fidp', to: 'amer', protocol: 'SAML', pqcPath: 'vendor', vulnerable: true },
    {
      from: 'amer',
      to: 'emea',
      protocol: 'MACsec',
      pqcPath: 'none',
      vulnerable: true,
      monitorOnly: true,
    },
    {
      from: 'telco',
      to: 'amer',
      protocol: 'SUCI/SUPI',
      pqcPath: 'none',
      vulnerable: true,
      monitorOnly: true,
    },
    {
      from: 'fin',
      to: 'emea',
      protocol: 'SWIFT/TR-31',
      pqcPath: 'none',
      vulnerable: true,
      monitorOnly: true,
    },
    {
      from: 'amer',
      to: 'ad',
      protocol: 'Kerberos',
      pqcPath: 'none',
      vulnerable: true,
      monitorOnly: true,
    },
  ],
}

export const ARCHITECTURES: Record<SimSize, Architecture> = { small, mid, large, global }

/** Stable per-edge identity (edges carry no `id`; from+to+protocol is unique). */
export const edgeKey = (e: ProtocolEdge) => `${e.from}-${e.to}-${e.protocol}`

export type EdgeState = 'migratable' | 'blocked' | 'vendor' | 'monitor' | 'safe'

/** Per-edge migration state under the one readiness rule. */
export function edgeState(arch: Architecture, e: ProtocolEdge): EdgeState {
  if (!e.vulnerable) return 'safe'
  if (e.pqcPath === 'none' || e.monitorOnly) return 'monitor' // irreducible → defense-in-depth
  if (e.pqcPath === 'vendor') return 'vendor' // waiting on a vendor PQC path
  const byId = new Map(arch.nodes.map((n) => [n.id, n]))
  const blocked = byId.get(e.from)?.pqcStatus === 'none' || byId.get(e.to)?.pqcStatus === 'none'
  return blocked ? 'blocked' : 'migratable'
}

/** Node classDef colors, keyed by theme. Mirrors the hue mapping of the app's
 *  status-success/warning/info/error tokens (src/styles/index.css) so the
 *  diagram matches the live theme instead of a hard-coded light palette. */
const NODE_PALETTE: Record<'light' | 'dark', Record<PqcStatus, string>> = {
  light: {
    available: 'fill:#d1fae5,stroke:#059669,color:#065f46',
    partial: 'fill:#fef3c7,stroke:#d97706,color:#92400e',
    roadmap: 'fill:#e0f2fe,stroke:#0284c7,color:#075985',
    none: 'fill:#fee2e2,stroke:#dc2626,color:#991b1b',
    unverified: 'fill:#f1f5f9,stroke:#64748b,color:#334155',
  },
  dark: {
    available: 'fill:#064e3b,stroke:#10b981,color:#d1fae5',
    partial: 'fill:#78350f,stroke:#f59e0b,color:#fef3c7',
    roadmap: 'fill:#0c4a6e,stroke:#38bdf8,color:#e0f2fe',
    none: 'fill:#7f1d1d,stroke:#f87171,color:#fee2e2',
    unverified: 'fill:#334155,stroke:#94a3b8,color:#f1f5f9',
  },
}
const MIGRATED_LINK_STROKE: Record<'light' | 'dark', string> = {
  light: 'stroke:#059669,stroke-width:2.5px',
  dark: 'stroke:#34d399,stroke-width:2.5px',
}

/** A Mermaid flowchart source for an architecture: nodes coloured by product
 *  PQC status, edges marked/dashed by migration state. When `edgeDecisions`
 *  marks an edge as migrated, it renders solid + "✓ migrated" regardless of
 *  its underlying `edgeState()` — reflecting the player's actual progress,
 *  not just the architecture's starting state. */
export function mermaidFromArchitecture(
  arch: Architecture,
  edgeDecisions: Record<string, 'hybrid' | 'pure'> = {},
  theme: 'light' | 'dark' = 'light'
): string {
  const lines: string[] = ['flowchart TB']
  for (const n of arch.nodes) {
    const label = n.label.replace(/"/g, "'")
    if (n.layer === 'Actor') lines.push(`  ${n.id}(["${label}"])`)
    else lines.push(`  ${n.id}["${label}"]:::${n.pqcStatus}`)
  }
  const linkStyles: string[] = []
  arch.edges.forEach((e, i) => {
    const st = edgeState(arch, e)
    // A decision can only ever exist for an edge that was migratable when the
    // player acted on it (the UI never offers a Migrate button otherwise) — so
    // a decision on a non-migratable edge is ignored rather than misrendered.
    const migrated = Boolean(edgeDecisions[edgeKey(e)]) && st === 'migratable'
    const mark = migrated
      ? '✓ migrated'
      : st === 'migratable'
        ? '✓'
        : st === 'blocked'
          ? '⚡'
          : st === 'vendor'
            ? '⏳'
            : st === 'monitor'
              ? '⚠'
              : ''
    const arrow = !migrated && st === 'monitor' ? '-.->' : '-->'
    const proto = e.protocol.replace(/"/g, "'")
    lines.push(`  ${e.from} ${arrow}|"${proto}${mark ? ' ' + mark : ''}"| ${e.to}`)
    // eslint-disable-next-line security/detect-object-injection -- theme is the literal 'light'|'dark' union, not user input
    if (migrated) linkStyles.push(`  linkStyle ${i} ${MIGRATED_LINK_STROKE[theme]}`)
  })
  lines.push(...linkStyles)
  // eslint-disable-next-line security/detect-object-injection -- theme is the literal 'light'|'dark' union, not user input
  const palette = NODE_PALETTE[theme]
  for (const status of Object.keys(palette) as PqcStatus[]) {
    // eslint-disable-next-line security/detect-object-injection -- status is drawn from Object.keys(palette) itself
    lines.push(`  classDef ${status} ${palette[status]}`)
  }
  return lines.join('\n')
}
