// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { logAccuracyFeedback } from '@/utils/analytics'

const ACCURACY_ROUTES = [
  '/learn',
  '/timeline',
  '/leaders',
  '/algorithms',
  '/library',
  '/compliance',
  '/threats',
  '/migrate',
]

type Vote = 'accurate' | 'inaccurate'

export function PageAccuracyFeedback() {
  const { pathname } = useLocation()
  // Store pathname alongside vote so navigating resets the widget without an effect
  const [voteState, setVoteState] = useState<{ pathname: string; vote: Vote } | null>(null)

  const isAccuracyPage = ACCURACY_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))

  if (!isAccuracyPage) return null

  // Derive effective vote — null if pathname has changed since the vote was cast
  const vote = voteState?.pathname === pathname ? voteState.vote : null

  function handleVote(v: Vote) {
    if (vote !== null) return
    setVoteState({ pathname, vote: v })
    logAccuracyFeedback(v, pathname)
  }

  return (
    <div className="fixed bottom-20 left-4 z-40 print:hidden embed-backdrop">
      <div className="glass-panel px-3 py-1.5 flex items-center gap-2 text-xs text-muted-foreground select-none">
        <span className={clsx('transition-colors', vote !== null && 'text-foreground')}>
          {vote !== null ? 'Thanks!' : 'Accurate?'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote('accurate')}
          disabled={vote !== null}
          aria-label="Mark page as accurate"
          className={clsx(
            'p-1 h-auto min-h-0 transition-colors',
            vote === 'accurate'
              ? 'text-status-success'
              : vote === 'inaccurate'
                ? 'text-muted-foreground/30'
                : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <ThumbsUp size={13} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote('inaccurate')}
          disabled={vote !== null}
          aria-label="Mark page as inaccurate"
          className={clsx(
            'p-1 h-auto min-h-0 transition-colors',
            vote === 'inaccurate'
              ? 'text-status-error'
              : vote === 'accurate'
                ? 'text-muted-foreground/30'
                : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <ThumbsDown size={13} />
        </Button>
      </div>
    </div>
  )
}
