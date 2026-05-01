// SPDX-License-Identifier: GPL-3.0-only
import type { SaasXref } from '../types/MigrateTypes'
import { loadLatestCSV } from './csvUtils'

const modules = import.meta.glob('./migrate_saas_xref_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

interface RawSaasRow {
  software_name: string
  saas_url: string
  deployment_model: string
  last_verified_date: string
}

const { data: allSaas, metadata } = loadLatestCSV<RawSaasRow, SaasXref>(
  modules,
  /saas_xref_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => ({
    softwareName: row.software_name,
    saasUrl: row.saas_url,
    deploymentModel: row.deployment_model as SaasXref['deploymentModel'],
    lastVerifiedDate: row.last_verified_date,
  })
)

/** All SaaS-only product cross-references (one row per product). */
export const saasXrefs: SaasXref[] = allSaas

/** Lookup: software_name → SaasXref */
export const saasByProduct: Map<string, SaasXref> = allSaas.reduce((map, x) => {
  map.set(x.softwareName, x)
  return map
}, new Map<string, SaasXref>())

/** CSV file metadata. */
export const saasXrefMetadata = metadata
