// SPDX-License-Identifier: GPL-3.0-only

export type EntityType =
  | 'library'
  | 'compliance'
  | 'timeline'
  | 'threat'
  | 'software'
  | 'certification'
  | 'leader'
  | 'glossary'
  | 'module'
  | 'quiz'
  | 'country'
  | 'source'
  | 'algorithm'
  | 'track'
  | 'persona'
  | 'vendor'

export type RelationshipType =
  | 'library-depends-on'
  | 'compliance-references'
  | 'compliance-timeline'
  | 'library-teaches'
  | 'library-covers-algorithm'
  | 'threat-teaches'
  | 'software-certified'
  | 'glossary-teaches'
  | 'quiz-teaches'
  | 'timeline-country'
  | 'leader-country'
  | 'source-feeds'
  | 'software-teaches'
  | 'module-in-track'
  | 'persona-recommends'
  | 'threat-targets-algorithm'
  | 'module-qa-references'
  | 'vendor-produces'
  | 'vendor-country'
  | 'leader-references-library'
  | 'certification-validates-algorithm'
  | 'software-implements-algorithm'
  | 'compliance-applies-to-country'
  | 'algorithm-replaces'

export interface GraphNode {
  id: string
  entityType: EntityType
  label: string
  description?: string
  metadata: Record<string, unknown>
  connectionCount: number
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  relationshipType: RelationshipType
  label?: string
  weight: number
}

export interface GraphStats {
  totalNodes: number
  totalEdges: number
  nodesByType: Record<EntityType, number>
  edgesByType: Record<RelationshipType, number>
  orphanedNodes: number
  avgConnectionsPerNode: number
  mostConnectedNodes: { id: string; label: string; count: number }[]
}

export interface KnowledgeGraph {
  nodes: Map<string, GraphNode>
  edges: GraphEdge[]
  nodesByType: Map<EntityType, GraphNode[]>
  adjacency: Map<string, Set<string>>
  stats: GraphStats
}
