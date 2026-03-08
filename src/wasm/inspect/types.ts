// SPDX-License-Identifier: GPL-3.0-only
// Extracted Types

export interface DecodedValue {
  kind: 'bool' | 'ulong' | 'constant' | 'bytes' | 'null'
  display: string // e.g. "CKO_PUBLIC_KEY (0x02)", "true", "1088 bytes"
  description?: string
}

export interface DecodedAttribute {
  typeHex: string // "0x00000000"
  typeName: string // "CKA_CLASS"
  typeDescription?: string
  value: DecodedValue
}

export interface DecodedSignParam {
  hedgeName: string
  hedgeDescription: string
  contextLen: number
  contextHex?: string // first 16 hex chars if contextLen > 0
}

export interface DecodedMechanism {
  typeHex: string
  name: string
  description?: string
  param?: DecodedSignParam
}

export interface InspectSection {
  label: string
  mechanism?: DecodedMechanism
  attributes?: DecodedAttribute[]
  primitives?: Array<{ name: string; value: string; note?: string }>
}

export interface Pkcs11LogInspect {
  inputs: InspectSection[]
  outputs?: Array<{ name: string; value: string; note?: string }>
  spec?: string
}

export interface ConstEntry {
  name: string
  description?: string
}

export type AlgoContext = 'ml-kem' | 'ml-dsa' | 'slh-dsa' | undefined
