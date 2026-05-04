// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Volume2 } from 'lucide-react'
import { useWorkshopStore } from '@/store/useWorkshopStore'

interface CaptionBarProps {
  text: string
  visible: boolean
}

/**
 * Lower-third caption used in Video / Workshop mode. Crossfades between
 * texts. When TTS is enabled, shows a pulsing voice icon and a blue glow
 * around the bubble so the user knows speech is active. Uses semantic
 * tokens; does not steal focus.
 */
export const CaptionBar: React.FC<CaptionBarProps> = ({ text, visible }) => {
  const ttsEnabled = useWorkshopStore((s) => s.ttsEnabled)
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
        <div
          className={`relative rounded-md bg-card/95 border px-6 py-3 shadow-2xl transition-shadow duration-300 ${
            ttsEnabled ? 'border-primary/40 shadow-glow ring-2 ring-primary/30' : 'border-border'
          }`}
        >
          {ttsEnabled && (
            <div
              className="absolute -top-2 -right-2 flex items-center justify-center w-7 h-7 rounded-full bg-primary border border-primary/40 shadow-glow animate-pulse"
              aria-label="Voice mode active"
            >
              <Volume2 size={14} className="text-primary-foreground" />
            </div>
          )}
          <p className="text-foreground text-base md:text-lg leading-relaxed text-center">{text}</p>
        </div>
      </div>
    </div>
  )
}
