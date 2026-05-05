// SPDX-License-Identifier: GPL-3.0-only
/**
 * Drift guard for the Command Center tool registry.
 *
 * The registry surface is split across multiple files (TYPE_LABELS,
 * BUSINESS_TOOLS, ARTIFACT_TYPE_TO_TOOL_ID, BUSINESS_TOOL_COMPONENTS,
 * PILLAR_FOR_TYPE, ZONE_ARTIFACT_TYPES). When a new artifact type or tool is
 * added, every one of these tables must be updated together — otherwise users
 * see ghost placeholders that click into empty drawers, or rendered cards
 * with no status colour.
 *
 * This spec asserts the cross-table invariants. It fails CI when the registry
 * drifts. To exempt an artifact type from the "must have a builder" rule,
 * add it to NO_BUILDER_ALLOWLIST below with a justification comment.
 */
import { describe, it, expect } from 'vitest'
import type { ExecutiveDocumentType } from '@/services/storage/types'
import { CSWP39_ZONE_DETAILS, type ZoneId } from '@/data/cswp39ZoneData'
import { TYPE_LABELS } from './ArtifactCard'
import { BUSINESS_TOOLS, ARTIFACT_TYPE_TO_TOOL_ID } from './businessToolsRegistry'
import { BUSINESS_TOOL_COMPONENTS } from './businessToolComponents'
import { PILLAR_FOR_TYPE, ZONE_ARTIFACT_TYPES, ZONE_FOR_TYPE } from './lib/cswp39StepMapping'

/** Exact list of every artifact type literal in the union. Kept here as a
 *  hand-maintained array because TypeScript erases unions at runtime — adding
 *  a new literal to ExecutiveDocumentType also requires adding it here. The
 *  test below cross-checks this list against TYPE_LABELS keys to catch drift. */
const ALL_ARTIFACT_TYPES: ExecutiveDocumentType[] = [
  'roi-model',
  'risk-register',
  'raci-matrix',
  'vendor-scorecard',
  'policy-draft',
  'compliance-checklist',
  'audit-checklist',
  'compliance-timeline',
  'board-deck',
  'contract-clause',
  'kpi-dashboard',
  'migration-roadmap',
  'stakeholder-comms',
  'kpi-tracker',
  'risk-treatment-plan',
  'crqc-scenario',
  'supply-chain-matrix',
  'deployment-playbook',
  'crypto-architecture',
  'management-tools-audit',
  'crypto-cbom',
  'crypto-vulnerability-watch',
]

/** Artifact types that intentionally have NO builder component. Each entry
 *  must include a justification — usually because the type is a placeholder
 *  for a future tool, or has been deprecated. */
const NO_BUILDER_ALLOWLIST: ReadonlySet<ExecutiveDocumentType> = new Set<ExecutiveDocumentType>()

describe('Command Center registry — drift guard', () => {
  it('every ExecutiveDocumentType has a TYPE_LABELS entry', () => {
    for (const type of ALL_ARTIFACT_TYPES) {
      // eslint-disable-next-line security/detect-object-injection
      expect(TYPE_LABELS[type], `TYPE_LABELS missing entry for "${type}"`).toBeTruthy()
    }
  })

  it('TYPE_LABELS has no orphan entries (every key is a known artifact type)', () => {
    for (const key of Object.keys(TYPE_LABELS)) {
      expect(
        ALL_ARTIFACT_TYPES.includes(key as ExecutiveDocumentType),
        `TYPE_LABELS has orphan key "${key}" — not in ExecutiveDocumentType`
      ).toBe(true)
    }
  })

  it('every ExecutiveDocumentType has a PILLAR_FOR_TYPE entry', () => {
    for (const type of ALL_ARTIFACT_TYPES) {
      // eslint-disable-next-line security/detect-object-injection
      expect(PILLAR_FOR_TYPE[type], `PILLAR_FOR_TYPE missing entry for "${type}"`).toBeTruthy()
    }
  })

  it('every ExecutiveDocumentType has a builder OR is in NO_BUILDER_ALLOWLIST', () => {
    for (const type of ALL_ARTIFACT_TYPES) {
      if (NO_BUILDER_ALLOWLIST.has(type)) continue
      // eslint-disable-next-line security/detect-object-injection
      const toolId = ARTIFACT_TYPE_TO_TOOL_ID[type]
      expect(toolId, `ARTIFACT_TYPE_TO_TOOL_ID missing entry for "${type}"`).toBeTruthy()
      if (toolId) {
        expect(
          BUSINESS_TOOL_COMPONENTS[toolId],
          `BUSINESS_TOOL_COMPONENTS missing entry for tool id "${toolId}" (artifact type "${type}")`
        ).toBeTruthy()
      }
    }
  })

  it('every BUSINESS_TOOLS entry has a non-empty cswp39SectionRef', () => {
    for (const tool of BUSINESS_TOOLS) {
      expect(
        tool.cswp39SectionRef,
        `BUSINESS_TOOLS["${tool.id}"] missing cswp39SectionRef`
      ).toMatch(/^§/)
    }
  })

  it('every BUSINESS_TOOLS entry has a corresponding BUSINESS_TOOL_COMPONENTS entry', () => {
    for (const tool of BUSINESS_TOOLS) {
      expect(
        BUSINESS_TOOL_COMPONENTS[tool.id],
        `BUSINESS_TOOL_COMPONENTS missing component for tool id "${tool.id}"`
      ).toBeTruthy()
    }
  })

  it('every BUSINESS_TOOLS entry has a non-empty cswp39Zone', () => {
    const validZones = new Set<ZoneId>(Object.keys(CSWP39_ZONE_DETAILS) as ZoneId[])
    for (const tool of BUSINESS_TOOLS) {
      expect(
        validZones.has(tool.cswp39Zone),
        `BUSINESS_TOOLS["${tool.id}"] cswp39Zone "${tool.cswp39Zone}" is not a known ZoneId`
      ).toBe(true)
    }
  })

  it('cswp39ZoneSubElement (when set) matches a chip from CSWP39_ZONE_DETAILS[zone].contains', () => {
    for (const tool of BUSINESS_TOOLS) {
      if (!tool.cswp39ZoneSubElement) continue

      const allowed = CSWP39_ZONE_DETAILS[tool.cswp39Zone].contains
      expect(
        allowed.includes(tool.cswp39ZoneSubElement),
        `BUSINESS_TOOLS["${tool.id}"] cswp39ZoneSubElement "${tool.cswp39ZoneSubElement}" is not in zone "${tool.cswp39Zone}" contains[]`
      ).toBe(true)
    }
  })

  it('every ExecutiveDocumentType appears in exactly one ZONE_ARTIFACT_TYPES bucket', () => {
    const seen = new Map<ExecutiveDocumentType, ZoneId>()
    for (const [zoneId, types] of Object.entries(ZONE_ARTIFACT_TYPES) as Array<
      [ZoneId, ExecutiveDocumentType[]]
    >) {
      for (const type of types) {
        const prior = seen.get(type)
        expect(
          prior,
          `Artifact type "${type}" appears in both "${prior}" and "${zoneId}" zones`
        ).toBeUndefined()
        seen.set(type, zoneId)
      }
    }
    for (const type of ALL_ARTIFACT_TYPES) {
      expect(seen.has(type), `Artifact type "${type}" missing from ZONE_ARTIFACT_TYPES`).toBe(true)
    }
  })

  it('ZONE_FOR_TYPE agrees with the per-tool cswp39Zone field', () => {
    for (const tool of BUSINESS_TOOLS) {
      const artifactType = Object.entries(ARTIFACT_TYPE_TO_TOOL_ID).find(
        ([, toolId]) => toolId === tool.id
      )?.[0] as ExecutiveDocumentType | undefined
      if (!artifactType) continue

      expect(
        ZONE_FOR_TYPE[artifactType],
        `ZONE_FOR_TYPE["${artifactType}"] (= "${ZONE_FOR_TYPE[artifactType]}") disagrees with BUSINESS_TOOLS["${tool.id}"].cswp39Zone (= "${tool.cswp39Zone}")`
      ).toBe(tool.cswp39Zone)
    }
  })
})
