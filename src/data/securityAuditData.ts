// SPDX-License-Identifier: GPL-3.0-only

/**
 * Reads the date of the latest security audit report from its own filename
 * (MMDDYYYY convention, the same dated-snapshot convention every CSV in this
 * repo uses), so `/about`'s "Last audited" claim is derived from a real
 * artifact instead of a hand-typed string that silently ages.
 */
const modules = import.meta.glob('./security_audit_report_*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function parseDateFromFilename(path: string): Date | null {
  const match = path.match(/security_audit_report_(\d{2})(\d{2})(\d{4})\.md$/)
  if (!match) return null
  const month = parseInt(match[1], 10) - 1
  const day = parseInt(match[2], 10)
  const year = parseInt(match[3], 10)
  const date = new Date(year, month, day)
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null
  }
  return date
}

function latestReportDate(): Date | null {
  const dates = Object.keys(modules)
    .map(parseDateFromFilename)
    .filter((d): d is Date => d !== null)
  if (dates.length === 0) return null
  return dates.reduce((latest, d) => (d > latest ? d : latest))
}

export const securityAuditDate: Date | null = latestReportDate()
