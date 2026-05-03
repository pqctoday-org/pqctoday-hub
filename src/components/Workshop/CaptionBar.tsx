// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'

interface CaptionBarProps {
  text: string
  visible: boolean
}

/**
 * Lower-third caption used in Video Mode. Crossfades between texts.
 * Uses semantic tokens; does not steal focus.
 */
export const CaptionBar: React.FC<CaptionBarProps> = ({ text, visible }) => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex justify-center pb-12"
      data-workshop-overlay="caption"
    >
      <div
        className={`max-w-3xl mx-4 transition-opacity duration-500 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="rounded-md bg-card/95 border border-border px-6 py-3 shadow-2xl">
          <p className="text-foreground text-base md:text-lg leading-relaxed text-center">{text}</p>
        </div>
      </div>
    </div>
  )
}
