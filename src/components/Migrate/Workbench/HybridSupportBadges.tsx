// SPDX-License-Identifier: AGPL-3.0-only
import type { SoftwareItem } from '@/types/MigrateTypes'
import { hybridSupportBadges } from '@/data/hybridSupport'
import { Pill } from './workbenchUi'

/** Hybrid KEM and composite-signature badges. Renders nothing for a product
 *  whose hybrid support has not been assessed. */
export function HybridSupportBadges({ product }: { product: SoftwareItem }) {
  const badges = hybridSupportBadges(product)
  if (badges.length === 0) return null
  return (
    <>
      {badges.map((b) => (
        <Pill key={b.key} tone={b.tone}>
          {b.label}
        </Pill>
      ))}
    </>
  )
}
