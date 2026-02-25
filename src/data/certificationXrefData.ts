/* eslint-disable security/detect-object-injection */
import type { CertificationXref } from '../types/MigrateTypes'
import Papa from 'papaparse'

// Glob import to find all matching xref CSV files
const modules = import.meta.glob('./migrate_certification_xref_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function getLatestXrefFile(): { content: string; filename: string; date: Date } | null {
  const files = Object.keys(modules)
    .map((path) => {
      const match = path.match(/xref_(\d{2})(\d{2})(\d{4})\.csv$/)
      if (match) {
        const [, month, day, year] = match
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        return { path, date, content: modules[path] as string }
      }
      return null
    })
    .filter((f): f is { path: string; date: Date; content: string } => f !== null)

  if (files.length === 0) {
    console.warn('No certification xref CSV files found.')
    return null
  }

  files.sort((a, b) => b.date.getTime() - a.date.getTime())

  return {
    content: files[0].content,
    filename: files[0].path.split('/').pop() || files[0].path,
    date: files[0].date,
  }
}

interface RawXrefRow {
  software_name: string
  cert_type: string
  cert_id: string
  cert_vendor: string
  cert_product: string
  pqc_algorithms: string
  certification_level: string
  status: string
  cert_date: string
  cert_link: string
}

function parseXrefCSV(csvContent: string): CertificationXref[] {
  const { data } = Papa.parse(csvContent.trim(), {
    header: true,
    skipEmptyLines: true,
  })

  return (data as RawXrefRow[]).map((row) => ({
    softwareName: row.software_name,
    certType: row.cert_type as CertificationXref['certType'],
    certId: row.cert_id,
    certVendor: row.cert_vendor,
    certProduct: row.cert_product,
    pqcAlgorithms: row.pqc_algorithms,
    certificationLevel: row.certification_level,
    status: row.status,
    certDate: row.cert_date,
    certLink: row.cert_link,
  }))
}

// Load and parse
const file = getLatestXrefFile()
const allXrefs = file ? parseXrefCSV(file.content) : []

/** All certification cross-references. */
export const certificationXrefs: CertificationXref[] = allXrefs

/** Lookup map: software_name → CertificationXref[] */
export const certsByProduct: Map<string, CertificationXref[]> = allXrefs.reduce((map, xref) => {
  const existing = map.get(xref.softwareName) || []
  existing.push(xref)
  map.set(xref.softwareName, existing)
  return map
}, new Map<string, CertificationXref[]>())

/** CSV file metadata. */
export const xrefMetadata = file ? { filename: file.filename, lastUpdate: file.date } : null
