// SPDX-License-Identifier: AGPL-3.0-only
/**
 * ExploreEmbed — the Explore overview inside the simulation. Explore is a page
 * of links to other hub areas, so here every tile says it opens the full page
 * and leaves the simulation, and `onLeave` lets the sim remember where to resume.
 */
import { ExploreView } from '@/components/Explore/ExploreView'

export function ExploreEmbed({ onLeave }: { onLeave?: () => void } = {}) {
  return <ExploreView simEmbed onLeave={onLeave} />
}
