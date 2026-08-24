// SPDX-License-Identifier: GPL-3.0-only
import type { CryptoAgilityMode } from '@/types/PatentTypes'

// Pure-moved out of PatentsTable.tsx (2026-08-24 audit R3.5) — that file
// also exports the real desktop patents table JSX, so MobilePatentsView.tsx
// previously carried its own byte-identical copy of this 5-entry label map
// rather than importing a desktop view component into the mobile boundary.
export const AGILITY_LABELS: Record<CryptoAgilityMode, string> = {
  classical_only: 'Classical only',
  hybrid: 'Hybrid',
  pqc_only: 'PQC only',
  negotiated: 'Negotiated',
  unclear: 'Unclear',
}
