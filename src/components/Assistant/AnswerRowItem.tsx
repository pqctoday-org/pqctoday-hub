// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useRef, useState } from 'react'
import { Check, Link2 } from 'lucide-react'
import { Chip, Eyebrow, StoryButton, StoryRow } from '@/components/storybook'
import { cn } from '@/lib/utils'
import type { AssistantRow } from '@/services/assistant/contract'
import { copyToClipboard } from '@/utils/clipboard'
import { COPY } from './copy'

/** A short address is public and always `/go/<tag>`. Anything else is not copied. */
const filled = (s: string | null | undefined): s is string =>
  typeof s === 'string' && s.trim().length > 0

export function isPublicGoLink(link: string): boolean {
  return /^\/go\/[^\s]+$/.test(link)
}

function isHttpsUrl(url: string | undefined): url is string {
  if (!url) return false
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

export function CopyLinkButton({ link, title }: { link: string; title: string }) {
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
      aria-label={`${COPY.copyLink}: ${title}`}
      className="gap-1"
    >
      {copied ? <Check size={14} aria-hidden="true" /> : <Link2 size={14} aria-hidden="true" />}
      <span>{copied ? COPY.linkCopied : COPY.copyLink}</span>
    </StoryButton>
  )
}

export interface AnswerRowItemProps {
  row: AssistantRow
  onAction: (row: AssistantRow) => void
  className?: string
}

/** One resource of an answer. The same component draws it on the desktop drawer and the phone sheet. */
export function AnswerRowItem({ row, onAction, className }: AnswerRowItemProps) {
  const dims = row.dims
  const actionLabel = `${row.action}: ${row.title}`
  const external = row.action === 'Open reference' && isHttpsUrl(row.link)
  return (
    <StoryRow as="li" className={cn('space-y-1.5', className)} data-tag={row.tag}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip>{row.kind}</Chip>
        {row.status && <Chip className="bg-highlight text-heading">{row.status}</Chip>}
      </div>
      {row.source && <p className="text-xs text-muted-foreground">Source: {row.source}</p>}
      <p className="text-sm font-bold text-foreground">{row.title}</p>
      {dims && <p className="text-xs text-muted-foreground">{dims}</p>}
      {row.paidReferenceOnly ? (
        <p className="text-xs text-muted-foreground">{COPY.paidReference}</p>
      ) : (
        filled(row.extract) && <p className="text-sm text-foreground/90">{row.extract}</p>
      )}
      <Eyebrow as="p" className="font-mono normal-case tracking-normal text-muted-foreground">
        {row.tag}
      </Eyebrow>
      <div className="flex flex-wrap items-center gap-1">
        {external ? (
          <a
            href={row.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={actionLabel}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border-2 border-ink bg-card px-6 text-sm font-bold text-card-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid"
          >
            {row.action}
          </a>
        ) : (
          <StoryButton variant="secondary" onClick={() => onAction(row)} aria-label={actionLabel}>
            {row.action}
          </StoryButton>
        )}
        <CopyLinkButton link={row.goLink} title={row.title} />
      </div>
    </StoryRow>
  )
}
