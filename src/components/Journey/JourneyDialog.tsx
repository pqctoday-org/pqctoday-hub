// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The dialog the journey uses for "Before you complete" and "Change role": a centred panel on a
 * wide screen and a sheet from the bottom on a phone. It keeps focus inside while open, closes on
 * Escape (through the shared overlay stack) and returns focus to the control that opened it.
 */
import { useId, useRef, type ReactNode } from 'react'
import FocusLock from 'react-focus-lock'
import { useOverlayEscape } from '@/hooks/useOverlayEscape'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { Eyebrow, StoryButton, stickerCardVariants } from '@/components/storybook'
import { cn } from '@/lib/utils'

interface JourneyDialogProps {
  open: boolean
  onClose: () => void
  title: string
  /** Small label above the title. */
  eyebrow?: string
  children: ReactNode
  testId?: string
}

export function JourneyDialog({
  open,
  onClose,
  title,
  eyebrow,
  children,
  testId,
}: JourneyDialogProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useOverlayEscape(open, onClose, { rootRef })
  useBodyScrollLock(open)
  if (!open) return null
  return (
    <div
      role="presentation"
      className="fixed inset-0 z-overlay flex items-end justify-center bg-black/60 sm:items-center sm:p-4 print:hidden"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <FocusLock returnFocus className="w-full max-w-lg">
        <div
          ref={rootRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          data-testid={testId}
          className={cn(
            stickerCardVariants({ padding: 'none' }),
            'max-h-[90vh] w-full overflow-y-auto rounded-b-none p-5 sm:rounded-b-3xl sm:p-6'
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
              <h2 id={titleId} className="text-xl font-extrabold text-heading">
                {title}
              </h2>
            </div>
            <StoryButton variant="quiet" onClick={onClose} aria-label={`Close ${title}`}>
              Close
            </StoryButton>
          </div>
          <div className="mt-4 space-y-4">{children}</div>
        </div>
      </FocusLock>
    </div>
  )
}
