// SPDX-License-Identifier: GPL-3.0-only

export type FipsStatusExport =
  | 'active'
  | 'active-pqc'
  | 'historical'
  | 'revoked'
  | 'in-mip'
  | 'not-validated'

export type EsvStatusExport = 'active' | 'historical' | 'revoked' | 'in-mip' | 'not-validated'

export type PostureColor = 'red' | 'yellow' | 'green'

export interface CbomExportItem {
  name: string
  version: string
  type: 'library' | 'hsm'
  fipsStatus: FipsStatusExport
  esvStatus: EsvStatusExport
  pqcSupport: string
  posture: PostureColor
  notes: string
  eolDate?: string | null
}
