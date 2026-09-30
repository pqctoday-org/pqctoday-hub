// SPDX-License-Identifier: GPL-3.0-only
import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { Share2, Check, Link2 } from 'lucide-react'
import { Button } from './button'
import { cn } from '../../lib/utils'
import { logEvent } from '../../utils/analytics'
import { isNativeApp } from '../../embed/platform'
import { shareContent } from '../../embed/share'

interface ShareButtonProps {
  title: string
  text?: string
  url?: string
  className?: string
  /**
   * Extra classes for the inner interactive <Button>, not the outer
   * positioning wrapper. `className` alone lands on the wrapper div — for a
   * caller whose sizing IS the tappable button itself (e.g. the mobile
   * header's 32×44 icon-button row, where the default `size="icon"` square
   * doesn't match its Search/Guide/⋯ siblings), this is the one that
   * actually changes the rendered button. Merged via cn/twMerge, so it wins
   * over the variant's default sizing without touching existing callers that
   * don't pass it.
   */
  buttonClassName?: string
  variant?: 'icon' | 'full'
  /**
   * Render the Copy / X / LinkedIn menu in a portal on document.body, above
   * every drawer and modal, instead of inline. Required when the button sits
   * INSIDE an overlay: an inline menu is clipped by the overlay's
   * overflow, and a transformed drawer panel re-roots its `fixed` backdrop.
   * Escape and outside clicks then close only the menu, never the overlay.
   */
  portal?: boolean
}

/** Share targets may be app paths ('/library?ref=X'); social / clipboard
 *  targets need an absolute URL. */
function toAbsoluteUrl(url: string | undefined): string {
  if (!url) return window.location.href
  try {
    return new URL(url, window.location.origin).href
  } catch {
    return url
  }
}

export const ShareButton = ({
  title,
  text,
  url,
  className = '',
  buttonClassName,
  variant = 'icon',
  portal = false,
}: ShareButtonProps) => {
  const [copied, setCopied] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const shareUrl = toAbsoluteUrl(url)
  const shareText = text || title

  const closeMenu = useCallback(() => setShowMenu(false), [])

  useEffect(() => {
    if (!showMenu) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // Capture phase + stop: an open menu owns Escape, so the drawer or
      // modal it sits in does not close along with it.
      e.stopImmediatePropagation()
      e.preventDefault()
      closeMenu()
    }
    window.addEventListener('keydown', handleEscape, true)
    return () => window.removeEventListener('keydown', handleEscape, true)
  }, [showMenu, closeMenu])

  const toggleMenu = () => {
    if (portal && wrapperRef.current) {
      const r = wrapperRef.current.getBoundingClientRect()
      setAnchor({ top: r.bottom + 4, right: Math.max(8, window.innerWidth - r.right) })
    }
    setShowMenu((prev) => !prev)
  }

  const handleNativeShare = async () => {
    if (isNativeApp() || 'share' in navigator) {
      try {
        await shareContent({ title, text: shareText, url: shareUrl })
        logEvent('Share', 'Native Share', title)
      } catch {
        // User cancelled — not an error
      }
      return
    }
    toggleMenu()
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    // The menu closes on copy, so its own "Copied!" label is never seen.
    toast.success('Link copied', { duration: 2000 })
    logEvent('Share', 'Copy Link', title)
    setTimeout(() => setCopied(false), 2000)
    setShowMenu(false)
  }

  const handleTwitter = () => {
    const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    window.open(tweetUrl, '_blank', 'noopener,noreferrer,width=550,height=420')
    logEvent('Share', 'Twitter', title)
    setShowMenu(false)
  }

  const handleLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer,width=550,height=420')
    logEvent('Share', 'LinkedIn', title)
    setShowMenu(false)
  }

  // Clicks inside the portaled menu must not reach the overlay's
  // outside-click handlers (they listen on document) and close it.
  const stopOverlayDismiss = (e: React.SyntheticEvent) => e.stopPropagation()

  const menuItems = (
    <>
      <Button
        variant="ghost"
        onClick={handleCopyLink}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
      >
        {copied ? <Check size={14} className="text-accent" /> : <Link2 size={14} />}
        {copied ? 'Copied!' : 'Copy link'}
      </Button>
      <Button
        variant="ghost"
        onClick={handleTwitter}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Post on X
      </Button>
      <Button
        variant="ghost"
        onClick={handleLinkedIn}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
        Share on LinkedIn
      </Button>
    </>
  )

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <Button
        variant="ghost"
        size={variant === 'icon' ? 'icon' : 'sm'}
        onClick={handleNativeShare}
        aria-label={`Share ${title}`}
        className={cn(
          variant === 'full'
            ? 'flex items-center gap-1 px-2 py-1.5 h-auto rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors'
            : 'text-muted-foreground hover:text-foreground',
          buttonClassName
        )}
      >
        <Share2 size={variant === 'full' ? 13 : 16} aria-hidden="true" />
        {variant === 'full' && <span>Share</span>}
      </Button>

      {showMenu &&
        (portal && anchor ? (
          createPortal(
            <div
              role="presentation"
              data-no-focus-lock="true"
              onMouseDown={stopOverlayDismiss}
              onPointerDown={stopOverlayDismiss}
              onClick={stopOverlayDismiss}
            >
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- backdrop overlay, keyboard close handled by Escape */}
              <div className="fixed inset-0 z-[10000]" onClick={closeMenu} />
              <div
                role="menu"
                className="fixed z-[10001] min-w-[160px] max-w-[calc(100vw-1rem)] rounded-lg border border-border bg-card shadow-lg p-1"
                style={{ top: anchor.top, right: anchor.right }}
              >
                {menuItems}
              </div>
            </div>,
            document.body
          )
        ) : (
          <>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- backdrop overlay, keyboard close handled by Escape */}
            <div className="fixed inset-0 embed-backdrop z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] max-w-[calc(100vw-1rem)] rounded-lg border border-border bg-card shadow-lg p-1">
              {menuItems}
            </div>
          </>
        ))}
    </div>
  )
}
