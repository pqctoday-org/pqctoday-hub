// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bookmark, BookmarkCheck, ExternalLink, Wrench } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { ReviewedBadge } from '@/components/ui/ReviewedBadge'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { logEvent, personaLabel } from '@/utils/analytics'
import { getCuriousToolDescription } from '@/data/playgroundCuriousDescriptions'
import type { WorkshopTool, ToolDifficulty } from '../workshopRegistry'

const DIFFICULTY_STYLES: Record<ToolDifficulty, string> = {
  beginner: 'bg-status-success/10 text-status-success',
  intermediate: 'bg-status-warning/10 text-status-warning',
  advanced: 'bg-status-error/10 text-status-error',
}

export const DifficultyBadge: React.FC<{ level: ToolDifficulty }> = ({ level }) => (
  <span
    className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium ${DIFFICULTY_STYLES[level]}`}
  >
    {level}
  </span>
)

export const WipBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-status-warning/15 text-status-warning font-medium border border-status-warning/30">
    <Wrench className="w-2.5 h-2.5" aria-hidden="true" />
    WIP
  </span>
)

interface ToolCardProps {
  tool: WorkshopTool
  /** Dim the card (e.g. tool is above the current persona's level). */
  dimmed?: boolean
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, dimmed }) => {
  const navigate = useNavigate()
  const Icon = tool.icon
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const myPlaygroundTools = useBookmarkStore((s) => s.myPlaygroundTools)
  const toggleMyPlaygroundTool = useBookmarkStore((s) => s.toggleMyPlaygroundTool)
  const isBookmarked = myPlaygroundTools.includes(tool.id)

  return (
    <div className={clsx('relative', dimmed && 'opacity-50')}>
      <Link
        to={`/playground/${tool.id}`}
        onClick={() => logEvent('Playground', 'Tool Open', personaLabel(tool.id))}
        className="glass-panel p-4 h-auto text-left hover:border-primary/40 transition-colors cursor-pointer group items-start justify-start flex"
      >
        <div className="flex items-start gap-3 w-full">
          <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1 pr-6">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                {tool.name}
              </p>
              <DifficultyBadge level={tool.difficulty} />
              {tool.wip && <WipBadge />}
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {(selectedPersona === 'curious' && getCuriousToolDescription(tool.id)) ||
                tool.description}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {tool.algorithms.map((algo) => (
                <span
                  key={algo}
                  className="inline-block text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                >
                  {algo}
                </span>
              ))}
            </div>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                navigate(`/revisions?domain=tool&entity=${encodeURIComponent(tool.pt_id)}`)
              }}
            >
              <ReviewedBadge
                domain="tool"
                entityId={tool.pt_id}
                className="mt-2"
                onOpenDrilldown={() =>
                  navigate(`/revisions?domain=tool&entity=${encodeURIComponent(tool.pt_id)}`)
                }
              />
            </div>
            {tool.opensourceTool && (
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{tool.opensourceTool.name}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
      <Button
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation()
          toggleMyPlaygroundTool(tool.id)
        }}
        className={clsx(
          'absolute top-2 right-2 p-1 rounded transition-colors',
          isBookmarked
            ? 'text-primary hover:text-primary/80'
            : 'text-muted-foreground/40 hover:text-primary'
        )}
        aria-label={isBookmarked ? 'Remove from My Tools' : 'Add to My Tools'}
        aria-pressed={isBookmarked}
      >
        {isBookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
      </Button>
    </div>
  )
}
