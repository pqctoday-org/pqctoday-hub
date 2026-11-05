// SPDX-License-Identifier: AGPL-3.0-only
export interface X509Attribute {
  id: string
  label: string
  oid: string
  status: 'mandatory' | 'recommended' | 'optional' | 'unknown'
  /** Independent from presence. Undefined on legacy/manual fields means not established. */
  critical?: boolean
  presenceBasis?: string
  value: string
  enabled: boolean
  placeholder: string
  description: string
  elementType: string
  source?: 'CSR' | 'CA' | 'Manual'
}

export interface ProfileMetadata {
  industry: string
  standard: string
  date: string
}

export interface ProfileConstraint {
  name: string
  value: string
  description: string
}
