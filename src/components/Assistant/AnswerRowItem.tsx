// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from 'react'
import { Check, Link2 } from 'lucide-react'
import { StoryButton } from '@/components/storybook'
import { cn } from '@/lib/utils'
import { copyToClipboard } from '@/utils/clipboard'
import { COPY } from './copy'

/** A short address is public and always `/go/<tag>`. Anything else is not copied. */
export function isPublicGoLink(link: string): boolean {
  return /^\/go\/[^\s]+$/.test(link)
}

export function CopyLinkButton({
  link,
  title,
  label,
  className,
}: {
  link: string
  title: string
  /** The accessible name, when it must say more than "Copy link: <title>". */
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    []
  )
  if (!isPublicGoLink(link)) return null
  const onCopy = async () => {
    // A link only: the shared helper also covers browsers that refuse the clipboard call.
    // When it cannot copy, the link still works from the address bar.
    if (!(await copyToClipboard(`${window.location.origin}${link}`))) return
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
  }
  return (
    <StoryButton
      variant="quiet"
      onClick={onCopy}
      aria-label={label ?? `${COPY.copyLink}: ${title}`}
      className={cn('gap-1', className)}
    >
      {copied ? <Check size={14} aria-hidden="true" /> : <Link2 size={14} aria-hidden="true" />}
      <span>{copied ? COPY.linkCopied : COPY.copyLink}</span>
    </StoryButton>
  )
}
