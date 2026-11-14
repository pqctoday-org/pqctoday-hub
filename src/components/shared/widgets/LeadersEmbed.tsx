// SPDX-License-Identifier: AGPL-3.0-only
/**
 * LeadersEmbed — the Community directory (/leaders) inside the simulation.
 * Filters live in the embed's local params; the page header is hidden so the
 * simulation bar stays on top. Same contract as LibraryEmbed.
 */
import { LeadersGrid } from '@/components/Leaders/LeadersGrid'
import { EmbedSearchParamsProvider } from '../EmbedSearchParamsProvider'

export function LeadersEmbed({ params }: { params?: string } = {}) {
  return (
    <EmbedSearchParamsProvider initial={params}>
      <LeadersGrid simEmbed />
    </EmbedSearchParamsProvider>
  )
}
