import { useState, useEffect, useCallback } from 'react'
import { Share2, Check, Link2 } from 'lucide-react'
import { Button } from './button'
import { logEvent } from '../../utils/analytics'

interface ShareButtonProps {
  title: string
  text?: string
  url?: string
  className?: string
  variant?: 'icon' | 'full'
}

export const ShareButton = ({
  title,
  text,
  url,
  className = '',
  variant = 'icon',
}: ShareButtonProps) => {
  const [copied, setCopied] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const shareUrl = url || window.location.href
  const shareText = text || title

  const closeMenu = useCallback(() => setShowMenu(false), [])

  useEffect(() => {
    if (!showMenu) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showMenu, closeMenu])

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl })
        logEvent('Share', 'Native Share', title)
      } catch {
        // User cancelled — not an error
      }
      return
    }
    setShowMenu((prev) => !prev)
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
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

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size={variant === 'icon' ? 'icon' : 'sm'}
        onClick={handleNativeShare}
        aria-label={`Share ${title}`}
        className="text-muted-foreground hover:text-foreground"
      >
        <Share2 size={16} />
        {variant === 'full' && <span className="ml-2">Share</span>}
      </Button>

      {showMenu && (
        <>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- backdrop overlay, keyboard close handled by Escape */}
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border border-border bg-card shadow-lg p-1">
            <button
              onClick={handleCopyLink}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              {copied ? <Check size={14} className="text-accent" /> : <Link2 size={14} />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>
            <button
              onClick={handleTwitter}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Post on X
            </button>
            <button
              onClick={handleLinkedIn}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              Share on LinkedIn
            </button>
          </div>
        </>
      )}
    </div>
  )
}
