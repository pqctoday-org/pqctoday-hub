// SPDX-License-Identifier: AGPL-3.0-only
/**
 * AlgorithmsPageEmbed — the /algorithms page inside the simulation, opened on a
 * given tab (the catalogue, Validation, or the Industry landscape scoped to the
 * run's sector), instead of navigating the player out of the run.
 *
 * Same contract as LibraryEmbed/ThreatsEmbed: `simEmbed` hides the page header
 * and keeps the explorer's tab/filter state local; the provider gives the
 * landscape tab (which reads its own filters) the same local params, seeded
 * from the step's link. The page URL is never read or written.
 */
import { AlgorithmsView } from '@/components/Algorithms/AlgorithmsView'
import { EmbedSearchParamsProvider } from '../EmbedSearchParamsProvider'

export function AlgorithmsPageEmbed({ params }: { params?: string } = {}) {
  return (
    <EmbedSearchParamsProvider initial={params}>
      <AlgorithmsView simEmbed simEmbedParams={params} />
    </EmbedSearchParamsProvider>
  )
}
