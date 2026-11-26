// SPDX-License-Identifier: AGPL-3.0-only
/**
 * First visit (UX handoff 6.17, 7.9): no role, no objective, no history. Learn opens on All modules
 * with this prompt above it. Nothing is hidden and nothing is required.
 */
import { Link } from 'react-router'
import { Eyebrow, StickerCard, storyButtonVariants } from '@/components/storybook'
import { useIsFirstVisit } from '@/hooks/useJourney'

export function FirstVisitPrompt() {
  const first = useIsFirstVisit()
  if (!first) return null
  return (
    <StickerCard
      as="section"
      aria-label="Start here"
      data-testid="first-visit-prompt"
      className="mb-4"
    >
      <Eyebrow>Start here</Eyebrow>
      <p className="mt-2 font-bold text-heading">
        Want a path? Tell us what you want to be able to do and we build the steps.
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Or open any module below. Nothing is hidden. Choose a role, or start an objective, to see
        your path first.
      </p>
      <div className="mt-3">
        <Link
          to="/learn?mode=journey&new=1"
          className={storyButtonVariants({ variant: 'primary' })}
        >
          Start an objective
        </Link>
      </div>
    </StickerCard>
  )
}
