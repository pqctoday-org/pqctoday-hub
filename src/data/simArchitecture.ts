// SPDX-License-Identifier: GPL-3.0-only
/**
 * simArchitecture — per-organisation-size system + protocol topologies for the
 * Simulation. Nodes carry a product PQC status (mirroring the migrate catalog's
 * pqc_status_canonical); edges carry a protocol PQC path (mirroring the
 * Algorithms PQC Protocol Matrix). The mix deliberately includes products
 * with and without PQC so readiness is never 100%.
 *
 * Representative topologies (not exhaustive) — see SIMULATION-DESIGN.md §3.
 */
import type { SimSize } from './moscaClock'

export type PqcStatus = 'available' | 'partial' | 'roadmap' | 'none'
/** From the protocol matrix: does this protocol have a standard PQC path? */
export type PqcPath = 'available' | 'vendor' | 'none'

export interface SystemNode {
  id: string
  label: string
  layer: string
  pqcStatus: PqcStatus
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
    { id: 'cdn', label: 'Caddy Web/LB', layer: 'Edge', pqcStatus: 'available' },
    { id: 'app', label: 'App Server', layer: 'AppServers', pqcStatus: 'available' },
    { id: 'db', label: 'MongoDB', layer: 'Database', pqcStatus: 'none' },
    { id: 'idp', label: 'Entra ID', layer: 'Cloud', pqcStatus: 'none' },
    { id: 'vpn', label: 'strongSwan VPN', layer: 'Network', pqcStatus: 'available' },
    { id: 'ca', label: "Let's Encrypt", layer: 'PKI', pqcStatus: 'none' },
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
    { id: 'waf', label: 'WAF', layer: 'Edge', pqcStatus: 'none' },
    { id: 'lb', label: 'Load Balancer', layer: 'Edge', pqcStatus: 'available' },
    { id: 'app1', label: 'App · wolfSSL', layer: 'AppServers', pqcStatus: 'available' },
    { id: 'app2', label: 'App · Envoy', layer: 'AppServers', pqcStatus: 'none' },
    { id: 'oracle', label: 'Oracle 26ai', layer: 'Database', pqcStatus: 'available' },
    { id: 'sql', label: 'SQL Server', layer: 'Database', pqcStatus: 'none' },
    { id: 'idp', label: 'Entra ID', layer: 'Identity', pqcStatus: 'none' },
    { id: 'hsm', label: 'Entrust nShield', layer: 'HSM', pqcStatus: 'available' },
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
    { id: 'edge', label: 'F5 BIG-IP', layer: 'Edge', pqcStatus: 'roadmap' },
    { id: 'app', label: 'App Mesh', layer: 'AppServers', pqcStatus: 'available' },
    { id: 'oracle', label: 'Oracle', layer: 'Database', pqcStatus: 'available' },
    { id: 'mongo', label: 'MongoDB', layer: 'Database', pqcStatus: 'none' },
    { id: 'pki', label: 'Enterprise PKI', layer: 'PKI', pqcStatus: 'none' },
    { id: 'hsm', label: 'Luna HSM', layer: 'HSM', pqcStatus: 'available' },
    { id: 'mainframe', label: 'Mainframe', layer: 'Mainframe', pqcStatus: 'none' },
    { id: 'payshield', label: 'payShield', layer: 'Payments', pqcStatus: 'none' },
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

export interface ReadinessSummary {
  vulnerable: number
  migratable: number
  blocked: number
  residual: number
  readinessPct: number
}

/** A Mermaid flowchart source for an architecture: nodes coloured by product
 *  PQC status, edges marked/dashed by migration state. */
export function mermaidFromArchitecture(arch: Architecture): string {
  const lines: string[] = ['flowchart TB']
  for (const n of arch.nodes) {
    const label = n.label.replace(/"/g, "'")
    if (n.layer === 'Actor') lines.push(`  ${n.id}(["${label}"])`)
    else lines.push(`  ${n.id}["${label}"]:::${n.pqcStatus}`)
  }
  for (const e of arch.edges) {
    const st = edgeState(arch, e)
    const mark =
      st === 'migratable'
        ? '✓'
        : st === 'blocked'
          ? '⚡'
          : st === 'vendor'
            ? '⏳'
            : st === 'monitor'
              ? '⚠'
              : ''
    const arrow = st === 'monitor' ? '-.->' : '-->'
    const proto = e.protocol.replace(/"/g, "'")
    lines.push(`  ${e.from} ${arrow}|"${proto}${mark ? ' ' + mark : ''}"| ${e.to}`)
  }
  lines.push('  classDef available fill:#d1fae5,stroke:#059669,color:#065f46')
  lines.push('  classDef partial fill:#fef3c7,stroke:#d97706,color:#92400e')
  lines.push('  classDef roadmap fill:#e0f2fe,stroke:#0284c7,color:#075985')
  lines.push('  classDef none fill:#fee2e2,stroke:#dc2626,color:#991b1b')
  return lines.join('\n')
}

export function computeReadiness(arch: Architecture): ReadinessSummary {
  const vuln = arch.edges.filter((e) => e.vulnerable)
  let migratable = 0
  let blocked = 0
  let residual = 0
  for (const e of vuln) {
    const s = edgeState(arch, e)
    if (s === 'migratable') migratable++
    else if (s === 'blocked' || s === 'vendor') blocked++
    else if (s === 'monitor') residual++
  }
  return {
    vulnerable: vuln.length,
    migratable,
    blocked,
    residual,
    readinessPct: vuln.length ? Math.round((migratable / vuln.length) * 100) : 100,
  }
}
