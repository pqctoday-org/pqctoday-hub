// SPDX-License-Identifier: GPL-3.0-only
/** Shared category metadata for /navigate — kept in one place so ForceClusterView (3D colors) and NavigateDetailPanel (dots/labels) can't drift apart. */
import type { ForceClusterNodeType } from '@/data/forceClusterGraph'

export const NODE_TYPES: ForceClusterNodeType[] = [
  'certbody',
  'mechanism',
  'industry',
  'usecase',
  'compliance',
  'standard',
  'glossary',
  'product',
  'protocol',
]

export const GRAPH_TOKEN: Record<ForceClusterNodeType, { varName: string; fallback: string }> = {
  certbody: { varName: '--graph-certbody', fallback: '#1c6f8c' },
  mechanism: { varName: '--graph-mechanism', fallback: '#6b4d99' },
  industry: { varName: '--graph-industry', fallback: '#a8631d' },
  usecase: { varName: '--graph-usecase', fallback: '#8a6b0f' },
  compliance: { varName: '--graph-compliance', fallback: '#932856' },
  standard: { varName: '--graph-standard', fallback: '#1a6b52' },
  glossary: { varName: '--graph-glossary', fallback: '#5a6270' },
  product: { varName: '--graph-product', fallback: '#3d7a1e' },
  protocol: { varName: '--graph-protocol', fallback: '#8a2a70' },
}

export const TYPE_LABEL: Record<ForceClusterNodeType, string> = {
  certbody: 'Certification body',
  mechanism: 'Crypto mechanism',
  industry: 'Industry',
  usecase: 'Use case',
  compliance: 'Compliance',
  standard: 'Standard',
  glossary: 'Glossary',
  product: 'Product',
  protocol: 'Protocol',
}
