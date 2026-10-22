// SPDX-License-Identifier: AGPL-3.0-only
//
// The PKCS#11 Learn tab's track ids — kept apart from HsmLearnView.tsx so the
// playground shell can resolve the `?ltrack=` deep link without importing
// the lesson runner (and its lesson data) to do it.
export type LearnTrack = 'foundations' | 'v32' | 'v33'

export const isLearnTrack = (v: string | null | undefined): v is LearnTrack =>
  v === 'foundations' || v === 'v32' || v === 'v33'
