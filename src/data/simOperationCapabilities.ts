// SPDX-License-Identifier: AGPL-3.0-only
import type { Architecture, ProtocolEdge } from './simArchitecture'
import type { SimSize } from './moscaClock'

/** Explicit fictional endpoint assumptions, not product capability claims.
 * A general catalogue status cannot establish an operation's support. */
export type ScenarioOperation =
  | 'authenticate-certificate-request'
  | 'consume-and-verify-issued-certificate'
  | 'issue-signed-certificate'
  | 'peer-authentication'
  | 'produce-signature-through-provider-api'
  | 'request-and-consume-issued-certificate'
  | 'request-signature-through-provider-api'
  | 'session-key-establishment'
  | 'verify-request-and-issue-certificate'
export type OperationAvailability = 'available' | 'conditional' | 'planned' | 'unknown' | 'none'
export interface EndpointOperationCase {
  nodeId: string
  required: readonly ScenarioOperation[]
  capabilities: Readonly<Partial<Record<ScenarioOperation, OperationAvailability>>>
}
export interface ConnectionOperationCase {
  from: EndpointOperationCase
  to: EndpointOperationCase
}

export const SCENARIO_OPERATION_CASES: Readonly<
  Record<SimSize, Readonly<Record<string, ConnectionOperationCase>>>
> = {
  small: {
    'user-cdn-TLS 1.3': {
      from: {
        nodeId: 'user',
        required: ['session-key-establishment', 'peer-authentication'],
        capabilities: {
          'session-key-establishment': 'available',
          'peer-authentication': 'available',
        },
      },
      to: {
        nodeId: 'cdn',
        required: ['session-key-establishment', 'peer-authentication'],
        capabilities: {
          'session-key-establishment': 'available',
          'peer-authentication': 'available',
        },
      },
    },
    'cdn-app-TLS': {
      from: {
        nodeId: 'cdn',
        required: ['session-key-establishment'],
        capabilities: { 'session-key-establishment': 'available' },
      },
      to: {
        nodeId: 'app',
        required: ['session-key-establishment'],
        capabilities: { 'session-key-establishment': 'available' },
      },
    },
    'app-db-TLS (wire)': {
      from: {
        nodeId: 'app',
        required: ['session-key-establishment'],
        capabilities: { 'session-key-establishment': 'available' },
      },
      to: {
        nodeId: 'db',
        required: ['session-key-establishment'],
        capabilities: { 'session-key-establishment': 'none' },
      },
    },
    'admin-vpn-IKEv2': {
      from: {
        nodeId: 'admin',
        required: ['session-key-establishment', 'peer-authentication'],
        capabilities: {
          'session-key-establishment': 'available',
          'peer-authentication': 'available',
        },
      },
      to: {
        nodeId: 'vpn',
        required: ['session-key-establishment', 'peer-authentication'],
        capabilities: {
          'session-key-establishment': 'available',
          'peer-authentication': 'available',
        },
      },
    },
    'cdn-ca-ACME': {
      from: {
        nodeId: 'cdn',
        required: ['authenticate-certificate-request'],
        capabilities: { 'authenticate-certificate-request': 'available' },
      },
      to: {
        nodeId: 'ca',
        required: ['verify-request-and-issue-certificate'],
        capabilities: { 'verify-request-and-issue-certificate': 'none' },
      },
    },
  },
  mid: {
    'user-waf-TLS 1.3': {
      from: {
        nodeId: 'user',
        required: ['session-key-establishment', 'peer-authentication'],
        capabilities: {
          'session-key-establishment': 'available',
          'peer-authentication': 'available',
        },
      },
      to: {
        nodeId: 'waf',
        required: ['session-key-establishment', 'peer-authentication'],
        capabilities: { 'session-key-establishment': 'none', 'peer-authentication': 'none' },
      },
    },
    'waf-lb-TLS': {
      from: {
        nodeId: 'waf',
        required: ['session-key-establishment'],
        capabilities: { 'session-key-establishment': 'none' },
      },
      to: {
        nodeId: 'lb',
        required: ['session-key-establishment'],
        capabilities: { 'session-key-establishment': 'available' },
      },
    },
    'lb-app1-mTLS': {
      from: {
        nodeId: 'lb',
        required: ['session-key-establishment', 'peer-authentication'],
        capabilities: {
          'session-key-establishment': 'available',
          'peer-authentication': 'available',
        },
      },
      to: {
        nodeId: 'app1',
        required: ['session-key-establishment', 'peer-authentication'],
        capabilities: {
          'session-key-establishment': 'available',
          'peer-authentication': 'available',
        },
      },
    },
    'app1-oracle-TLS (DB)': {
      from: {
        nodeId: 'app1',
        required: ['session-key-establishment'],
        capabilities: { 'session-key-establishment': 'available' },
      },
      to: {
        nodeId: 'oracle',
        required: ['session-key-establishment'],
        capabilities: { 'session-key-establishment': 'available' },
      },
    },
    'app2-sql-TLS (DB)': {
      from: {
        nodeId: 'app2',
        required: ['session-key-establishment'],
        capabilities: { 'session-key-establishment': 'available' },
      },
      to: {
        nodeId: 'sql',
        required: ['session-key-establishment'],
        capabilities: { 'session-key-establishment': 'none' },
      },
    },
    'admin-app1-SSH': {
      from: {
        nodeId: 'admin',
        required: ['session-key-establishment', 'peer-authentication'],
        capabilities: {
          'session-key-establishment': 'available',
          'peer-authentication': 'available',
        },
      },
      to: {
        nodeId: 'app1',
        required: ['session-key-establishment', 'peer-authentication'],
        capabilities: {
          'session-key-establishment': 'available',
          'peer-authentication': 'available',
        },
      },
    },
    'app1-hsm-PKCS#11': {
      from: {
        nodeId: 'app1',
        required: ['request-signature-through-provider-api'],
        capabilities: { 'request-signature-through-provider-api': 'available' },
      },
      to: {
        nodeId: 'hsm',
        required: ['produce-signature-through-provider-api'],
        capabilities: { 'produce-signature-through-provider-api': 'available' },
      },
    },
  },
  large: {
    'user-edge-TLS 1.3': {
      from: {
        nodeId: 'user',
        required: ['session-key-establishment', 'peer-authentication'],
        capabilities: {
          'session-key-establishment': 'available',
          'peer-authentication': 'available',
        },
      },
      to: {
        nodeId: 'edge',
        required: ['session-key-establishment', 'peer-authentication'],
        capabilities: {
          'session-key-establishment': 'available',
          'peer-authentication': 'available',
        },
      },
    },
    'edge-app-mTLS': {
      from: {
        nodeId: 'edge',
        required: ['session-key-establishment', 'peer-authentication'],
        capabilities: {
          'session-key-establishment': 'available',
          'peer-authentication': 'available',
        },
      },
      to: {
        nodeId: 'app',
        required: ['session-key-establishment', 'peer-authentication'],
        capabilities: {
          'session-key-establishment': 'available',
          'peer-authentication': 'available',
        },
      },
    },
    'app-oracle-TLS (DB)': {
      from: {
        nodeId: 'app',
        required: ['session-key-establishment'],
        capabilities: { 'session-key-establishment': 'available' },
      },
      to: {
        nodeId: 'oracle',
        required: ['session-key-establishment'],
        capabilities: { 'session-key-establishment': 'available' },
      },
    },
    'app-mongo-TLS (DB)': {
      from: {
        nodeId: 'app',
        required: ['session-key-establishment'],
        capabilities: { 'session-key-establishment': 'available' },
      },
      to: {
        nodeId: 'mongo',
        required: ['session-key-establishment'],
        capabilities: { 'session-key-establishment': 'none' },
      },
    },
    'app-hsm-PKCS#11': {
      from: {
        nodeId: 'app',
        required: ['request-signature-through-provider-api'],
        capabilities: { 'request-signature-through-provider-api': 'available' },
      },
      to: {
        nodeId: 'hsm',
        required: ['produce-signature-through-provider-api'],
        capabilities: { 'produce-signature-through-provider-api': 'available' },
      },
    },
    'app-pki-X.509 issue': {
      from: {
        nodeId: 'app',
        required: ['request-and-consume-issued-certificate'],
        capabilities: { 'request-and-consume-issued-certificate': 'available' },
      },
      to: {
        nodeId: 'pki',
        required: ['issue-signed-certificate'],
        capabilities: { 'issue-signed-certificate': 'none' },
      },
    },
  },
  global: {
    'gpki-amer-X.509': {
      from: {
        nodeId: 'gpki',
        required: ['issue-signed-certificate'],
        capabilities: { 'issue-signed-certificate': 'available' },
      },
      to: {
        nodeId: 'amer',
        required: ['consume-and-verify-issued-certificate'],
        capabilities: { 'consume-and-verify-issued-certificate': 'available' },
      },
    },
    'gpki-emea-X.509': {
      from: {
        nodeId: 'gpki',
        required: ['issue-signed-certificate'],
        capabilities: { 'issue-signed-certificate': 'available' },
      },
      to: {
        nodeId: 'emea',
        required: ['consume-and-verify-issued-certificate'],
        capabilities: { 'consume-and-verify-issued-certificate': 'available' },
      },
    },
    'gpki-apac-X.509': {
      from: {
        nodeId: 'gpki',
        required: ['issue-signed-certificate'],
        capabilities: { 'issue-signed-certificate': 'available' },
      },
      to: {
        nodeId: 'apac',
        required: ['consume-and-verify-issued-certificate'],
        capabilities: { 'consume-and-verify-issued-certificate': 'conditional' },
      },
    },
    'amer-emea-WAN IPsec': {
      from: {
        nodeId: 'amer',
        required: ['session-key-establishment', 'peer-authentication'],
        capabilities: {
          'session-key-establishment': 'available',
          'peer-authentication': 'available',
        },
      },
      to: {
        nodeId: 'emea',
        required: ['session-key-establishment', 'peer-authentication'],
        capabilities: {
          'session-key-establishment': 'available',
          'peer-authentication': 'available',
        },
      },
    },
    'apac-kms-KMIP': {
      from: {
        nodeId: 'apac',
        required: ['session-key-establishment', 'peer-authentication'],
        capabilities: {
          'session-key-establishment': 'conditional',
          'peer-authentication': 'conditional',
        },
      },
      to: {
        nodeId: 'kms',
        required: ['session-key-establishment', 'peer-authentication'],
        capabilities: {
          'session-key-establishment': 'available',
          'peer-authentication': 'available',
        },
      },
    },
  },
}

/** Nonempty, dense, unique declared roles must each be explicitly available.
 * Having signing support never supplies an absent key-establishment role. */
function isScenarioOperation(role: unknown): role is ScenarioOperation {
  return typeof role === 'string' && Object.prototype.hasOwnProperty.call(OPERATION_LABELS, role)
}

export function endpointOperationsReady(endpoint: EndpointOperationCase): boolean {
  const required = endpoint?.required
  return (
    Array.isArray(required) &&
    required.length > 0 &&
    new Set(required).size === required.length &&
    Array.from(required).every(
      (role: unknown) =>
        isScenarioOperation(role) &&
        Object.prototype.hasOwnProperty.call(OPERATION_LABELS, role) &&
        Object.prototype.hasOwnProperty.call(endpoint.capabilities ?? {}, role) &&
        new Map(Object.entries(endpoint.capabilities)).get(role) === 'available'
    )
  )
}

export function connectionOperationCase(
  arch: Architecture,
  edge: ProtocolEdge
): ConnectionOperationCase | undefined {
  return SCENARIO_OPERATION_CASES[arch.size]?.[`${edge.from}-${edge.to}-${edge.protocol}`]
}

export function connectionOperationsReady(arch: Architecture, edge: ProtocolEdge): boolean {
  const scenario = connectionOperationCase(arch, edge)
  if (!scenario || scenario.from.nodeId !== edge.from || scenario.to.nodeId !== edge.to)
    return false
  return [scenario.from, scenario.to].every((endpoint) => {
    const nodes = arch.nodes.filter((node) => node.id === endpoint.nodeId)
    return (
      nodes.length === 1 && nodes[0].pqcStatus === 'available' && endpointOperationsReady(endpoint)
    )
  })
}

const OPERATION_LABELS: Record<ScenarioOperation, string> = {
  'session-key-establishment': 'key establishment',
  'peer-authentication': 'peer authentication (sign/verify)',
  'authenticate-certificate-request': 'sign certificate request',
  'verify-request-and-issue-certificate': 'verify request and sign certificate',
  'request-signature-through-provider-api': 'request signing through provider API',
  'produce-signature-through-provider-api': 'produce signature through provider API',
  'request-and-consume-issued-certificate': 'request and consume signed certificate',
  'issue-signed-certificate': 'sign issued certificate',
  'consume-and-verify-issued-certificate': 'verify issued certificate',
}

export function connectionOperationSummary(arch: Architecture, edge: ProtocolEdge): string {
  const scenario = connectionOperationCase(arch, edge)
  if (!scenario)
    return edge.pqcPath === 'available'
      ? 'Endpoint operations unassessed; not eligible.'
      : 'Vendor/monitor path: outside crypto-migration eligibility in this case.'
  return [scenario.from, scenario.to]
    .map((endpoint) => {
      const node = arch.nodes.find((node) => node.id === endpoint.nodeId)
      return `${endpoint.nodeId}: ${endpoint.required.map((role) => `${new Map(Object.entries(OPERATION_LABELS)).get(role)} ${new Map(Object.entries(endpoint.capabilities)).get(role) ?? 'unknown'}`).join(' + ')}; general status ${node?.pqcStatus ?? 'missing endpoint'}`
    })
    .join(' · ')
}
