// SPDX-License-Identifier: GPL-3.0-only
/**
 * The PKCS#11 workshop's Operate rail — the seven crypto-primitive panels
 * (design handoff design_handoff_kmip_pkcs11_playground, 2026-09-02). Ids
 * double as the `?rail=` URL values and as the `rail` a Learn lesson step's
 * `spot` hint points at, so they live here, importable by both the shell
 * (HsmPlayground.tsx) and the lesson catalogs (learn/pkcs11Lessons*.ts)
 * without either importing the other.
 */
export type RailId = 'kem' | 'sym' | 'wrap' | 'hash' | 'sign' | 'agree' | 'kdf'

export const RAIL_IDS: RailId[] = ['kem', 'sym', 'wrap', 'hash', 'sign', 'agree', 'kdf']

export const isRailId = (v: string | null | undefined): v is RailId =>
  RAIL_IDS.includes(v as RailId)
