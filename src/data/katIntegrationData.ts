// SPDX-License-Identifier: GPL-3.0-only
import { loadLatestCSV } from './csvUtils'

export interface KatIntegration {
  katId: string
  algorithm: string
  localKatFile: string
  mainSiteSource: string
  specificKatUrl: string
  sourceFreshnessDate: string
  learningModuleId: string
  useCaseValidated: string
  integrationStatus: 'Planned' | 'Active' | 'Testing'
}

interface RawKatRow {
  kat_id: string
  algorithm: string
  local_kat_file: string
  main_site_source: string
  specific_kat_url: string
  source_freshness_date: string
  learning_module_id: string
  use_case_validated: string
  integration_status: string
}

const modules = import.meta.glob('../../kat/kat_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const { data: allKatIntegrations, metadata: parsedMetadata } = loadLatestCSV<
  RawKatRow,
  KatIntegration
>(modules, /kat_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/, (row) => ({
  katId: row.kat_id,
  algorithm: row.algorithm,
  localKatFile: row.local_kat_file,
  mainSiteSource: row.main_site_source,
  specificKatUrl: row.specific_kat_url,
  sourceFreshnessDate: row.source_freshness_date,
  learningModuleId: row.learning_module_id,
  useCaseValidated: row.use_case_validated,
  integrationStatus: (row.integration_status as KatIntegration['integrationStatus']) ?? 'Planned',
}))

/** All KAT integration cross-references mapping KATs to Learning Modules. */
export const katIntegrations: KatIntegration[] = allKatIntegrations

/** Lookup map: File/KAT ID -> Integrations */
export const katsByModule: Map<string, KatIntegration[]> = allKatIntegrations.reduce((map, kat) => {
  const existing = map.get(kat.learningModuleId) ?? []
  existing.push(kat)
  map.set(kat.learningModuleId, existing)
  return map
}, new Map<string, KatIntegration[]>())

/** CSV file metadata (filename and date). */
export const katMetadata = parsedMetadata
