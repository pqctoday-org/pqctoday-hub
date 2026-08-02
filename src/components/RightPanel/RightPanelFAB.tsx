// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { MessageCircle, Clock } from 'lucide-react'
import { Button } from '../ui/button'
import { useRightPanelStore } from '@/store/useRightPanelStore'
import { logChatOpened } from '@/utils/analytics'
import { useEmbedState } from '@/embed/EmbedProvider'

// Mobile-only: the FAB fades/shrinks while the page is actively scrolling so it
// stops covering content mid-read, then restores ~600ms after scrolling stops.
// Gated on a `(max-width: 767px)` check inside the handler itself, so on
// desktop `isScrolling` never becomes true and the FAB's animate target never
// changes regardless of scroll — desktop behavior is untouched.
//
// The listener is on `document` with `capture: true`, not `window` — this
// app's actual scroll container is an inner `overflow-y-auto` div inside
// MainLayout (the outer `window`/`document` never scrolls), and native
// `scroll` events don't bubble, so capturing at the document root is the
// only way to observe scrolling on that (or any other nested) container.
function useMobileScrollFade() {
  const [isScrolling, setIsScrolling] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onScroll = () => {
      if (!window.matchMedia('(max-width: 767px)').matches) return
      setIsScrolling(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setIsScrolling(false), 600)
    }
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => {
      document.removeEventListener('scroll', onScroll, { capture: true })
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return isScrolling
}

export const RightPanelFAB: React.FC = () => {
  const { isOpen, activeTab, toggle, isMinimized } = useRightPanelStore()
  const embedConfig = useEmbedState()
  const isScrolling = useMobileScrollFade()
  // Framer Motion owns `opacity`/`scale` via inline styles once it animates
  // them, so a competing Tailwind class can never win — the scroll-fade has
  // to be expressed as a second `animate` target instead. `hasIntroed` keeps
  // the 0.5s mount delay for the FIRST appearance only; later toggles (from
  // scrolling) animate immediately.
  const [hasIntroed, setHasIntroed] = useState(false)
  // `<MotionConfig reducedMotion="user">` in AppRoot only suppresses TRANSFORM
  // and layout animations — framer-motion deliberately keeps opacity, because
  // cross-fades are not what triggers vestibular discomfort. The "Need Help?"
  // bubble below animates opacity through a 10 s keyframe, so under reduced
  // motion it still fades, and an automated contrast check that samples the
  // page mid-fade reads a partially-transparent foreground and reports a
  // WCAG failure with a different ratio on every run. It is decorative (the
  // button carries its own aria-label), so under reduced motion we omit it
  // entirely rather than animate it.
  const prefersReducedMotion = useReducedMotion()

  if (isOpen) return null

  if (embedConfig.isEmbedded && embedConfig.policy?.features?.assistantEnabled === false)
    return null

  const isChat = activeTab !== 'history'
  const Icon = isChat ? MessageCircle : Clock
  const label = isChat ? 'Open PQC Assistant' : 'Open Journey History'

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: isScrolling ? 0.85 : 1, opacity: isScrolling ? 0.4 : 1 }}
      transition={{
        type: 'spring',
        damping: 15,
        stiffness: 300,
        delay: hasIntroed ? 0 : 0.5,
      }}
      onAnimationComplete={() => setHasIntroed(true)}
      // 2026-08-02: moved from bottom-RIGHT to the left of the page title.
      // Below lg it stays bottom-left (there is no rail and no room beside the
      // title). At lg+ it sits at the content column's left edge, level with
      // the <h1>: the rail is 168px and content padding puts the title at
      // x=200, y=138 (measured at 1440px). It is `fixed`, so it neither enters
      // the header's flow nor shifts the centred title — that centring is
      // computed across the full content width and is unaffected by an
      // out-of-flow element.
      className={`${embedConfig.isEmbedded ? 'absolute' : 'fixed'} bottom-20 left-4 z-40 md:bottom-6 md:left-6 lg:bottom-auto lg:left-[176px] lg:top-[112px] print:hidden`}
    >
      <div className="relative flex items-center">
        {/* "Need Help?" speech bubble — slides in, fades out after 10 s.
            Desktop-only: on mobile its extra width sits on top of page content
            (the icon button alone already communicates the same affordance). */}
        {isChat && !prefersReducedMotion && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: [0, 1, 1, 0], x: [-8, 0, 0, 0] }}
            transition={{ duration: 10, times: [0, 0.08, 0.88, 1], ease: 'easeInOut', delay: 0.8 }}
            className="hidden md:block absolute left-full ml-3 top-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className="relative bg-card border border-border rounded-lg px-3 py-1.5 shadow-md whitespace-nowrap">
              <span className="text-sm font-medium text-foreground">Need Help?</span>
              {/* Arrow points LEFT toward the button, which now sits on the
                  left edge of the viewport (2026-08-02). */}
              <span className="absolute -left-[7px] top-1/2 -translate-y-1/2 w-3 h-3 bg-card border-l border-b border-border rotate-45" />
            </div>
          </motion.div>
        )}

        {/* Pulse ring — radiates outward on loop. Desktop-only: on mobile it
            expands well past the (already-shrunk) button and re-covers content. */}
        {isChat && (
          <motion.span
            className="hidden md:block absolute inset-0 rounded-full bg-primary/40 pointer-events-none"
            animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}

        <Button
          variant="gradient"
          onClick={() => {
            toggle()
            if (isChat) logChatOpened()
          }}
          className="relative w-14 h-14 md:w-24 md:h-24 rounded-full shadow-lg shadow-primary/25 p-0 overflow-hidden"
          aria-label={label}
        >
          {isChat ? (
            <img
              src="/ChatBotFlow.gif"
              alt="PQC Assistant"
              className="w-full h-full rounded-full object-cover"
              draggable={false}
            />
          ) : (
            <Icon size={24} />
          )}
          {/* Badge when minimized with active conversation */}
          {isMinimized && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-status-info rounded-full border-2 border-background" />
          )}
        </Button>
      </div>
    </motion.div>
  )
}
