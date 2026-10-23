// SPDX-License-Identifier: AGPL-3.0-only
// Migrate "Vulnerabilities" tab: the Crypto Vulnerability Watch, scoped to the
// products selected on this page. Its own chunk — the tool pulls in the CVE
// snapshot loader and the threat/attack-profile panels, none of which the other
// tabs need.
import { Suspense } from 'react'
import { lazyWithRetry } from '@/utils/lazyWithRetry'

const CryptoVulnerabilityWatch = lazyWithRetry(() =>
  import('@/components/BusinessCenter/tools/CryptoVulnerabilityWatch').then((m) => ({
    default: m.CryptoVulnerabilityWatch,
  }))
)

export function VulnerabilitiesTab() {
  return (
    <Suspense fallback={<div aria-hidden="true" className="min-h-40" />}>
      <CryptoVulnerabilityWatch inMigrate />
    </Suspense>
  )
}
