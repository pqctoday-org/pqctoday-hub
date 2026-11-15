// SPDX-License-Identifier: AGPL-3.0-only
/**
 * PatentsEmbed — the Patents page inside the simulation. The page, its filter
 * bar and its table all read one shared set of local params through the
 * provider, so filtering works as on /patents without touching the page URL.
 */
import { PatentsViewRedesign } from '@/components/Patents/redesign/PatentsViewRedesign'
import { EmbedSearchParamsProvider } from '../EmbedSearchParamsProvider'

export function PatentsEmbed({ params }: { params?: string } = {}) {
  return (
    <EmbedSearchParamsProvider initial={params}>
      <PatentsViewRedesign simEmbed />
    </EmbedSearchParamsProvider>
  )
}
