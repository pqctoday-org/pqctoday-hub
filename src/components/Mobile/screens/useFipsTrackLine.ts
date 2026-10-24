// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useMemo, useState } from 'react'
import type { CertificationXref, SoftwareItem } from '@/types/MigrateTypes'
import {
  buildProductStageTimeline,
  fipsTrackLine,
  type InProcessMatch,
} from '@/components/Compliance/fipsStageProgressModel'

interface TrackInputs {
  products: SoftwareItem[]
  certsByProduct: Map<string, CertificationXref[]>
  matches: InProcessMatch[]
}

/** Same small NIST file, and the same degrade-to-null rule, as the desktop chart. */
async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path)
    return res.ok ? ((await res.json()) as T) : null
  } catch {
    return null
  }
}

/**
 * The phone's one-line FIPS 140-3 track summary — the Products view of the
 * desktop PqcCertificationTrendChart at its latest month, from the same model
 * (fipsStageProgressModel.ts) and the same data.
 *
 * Lazy by construction: nothing is fetched until `enabled` (the Records list is
 * showing), so the catalogue chunk costs the first paint nothing. The line is
 * null until everything has loaded, and stays null if any of it fails — the
 * chart would draw "0 in progress" from a missing matches file; a line should
 * not state a number it could not read. A failed matches fetch skips the
 * catalogue import altogether. `asOf` is computeRecordsSnapshotDate(records),
 * as on desktop, so both end the axis in the same month.
 */
export function useFipsTrackLine(enabled: boolean, asOf: Date | null): string | null {
  const [inputs, setInputs] = useState<TrackInputs | null>(null)

  useEffect(() => {
    if (!enabled || inputs) return
    let live = true
    void (async () => {
      const file = await fetchJson<{ matches: InProcessMatch[] }>(
        '/data/fips-in-process-matches.json'
      )
      if (!live || !file || !Array.isArray(file.matches)) return
      try {
        const [m, x] = await Promise.all([
          import('@/data/migrateData'),
          import('@/data/certificationXrefData'),
        ])
        if (live)
          setInputs({
            products: m.softwareData,
            certsByProduct: x.certsByProduct,
            matches: file.matches,
          })
      } catch {
        // The catalogue chunk did not load: no line.
      }
    })()
    return () => {
      live = false
    }
  }, [enabled, inputs])

  return useMemo(
    () =>
      inputs
        ? fipsTrackLine(
            buildProductStageTimeline(
              inputs.products,
              inputs.certsByProduct,
              inputs.matches,
              asOf ?? new Date()
            )
          )
        : null,
    [inputs, asOf]
  )
}
