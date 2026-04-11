// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { useIsEmbedded } from '../../embed/EmbedProvider'

export function PoweredByBadge() {
  const isEmbedded = useIsEmbedded()

  return (
    <a
      href="https://pqctoday.com"
      target="_blank"
      rel="noopener noreferrer"
      className={
        isEmbedded
          ? // In embed: anchor to bottom of the flex column, not the browser viewport
            'self-end m-4 bg-card/80 text-muted-foreground px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm hover:bg-card hover:text-foreground transition-all flex items-center gap-1.5 backdrop-blur-md hover:shadow-md print:hidden'
          : // Standard: fixed to viewport corner
            'fixed bottom-4 right-4 z-40 bg-card/80 text-muted-foreground px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm hover:bg-card hover:text-foreground transition-all flex items-center gap-1.5 backdrop-blur-md hover:shadow-md print:hidden'
      }
      title="Open PQC Today in a new tab"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      </svg>
      Powered by PQC Today
    </a>
  )
}
