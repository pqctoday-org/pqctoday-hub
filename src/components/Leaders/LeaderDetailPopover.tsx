// SPDX-License-Identifier: GPL-3.0-only
import { X, Briefcase, Building2, MapPin, User, BookOpen, Clock, ShieldCheck } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import FocusLock from 'react-focus-lock'
import type { Leader } from '../../data/leadersData'
import { StatusBadge } from '../common/StatusBadge'
import { AskAssistantButton } from '../ui/AskAssistantButton'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { CountryFlag } from '../common/CountryFlag'
import { FLAG_CODE_MAP } from './leadersConstants'
import clsx from 'clsx'
import { useIsEmbedded } from '../../embed/EmbedProvider'
import { useModalPosition } from '../../hooks/useModalPosition'
import { Button } from '@/components/ui/button'

interface LeaderDetailPopoverProps {
  isOpen: boolean
  onClose: () => void
  leader: Leader | null
}

export const LeaderDetailPopover = ({ isOpen, onClose, leader }: LeaderDetailPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [imgError, setImgError] = useState(false)
  const isEmbedded = useIsEmbedded()
  const positionStyle = useModalPosition(isEmbedded)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    setImgError(false) // eslint-disable-line react-hooks/set-state-in-effect -- reset on item change, same pattern as LibraryDetailPopover
  }, [leader])

  if (!isOpen || !leader) return null

  const flagCode = FLAG_CODE_MAP[leader.country] ?? 'un'

  const content = (
    <FocusLock returnFocus>
      <div
        ref={popoverRef}
        className="w-[95vw] sm:w-[75vw] md:w-[50vw] max-w-[700px] max-h-[85vh] border border-border rounded-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col bg-popover text-popover-foreground shadow-2xl"
        style={{ zIndex: 9999, ...positionStyle }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="leader-popover-title"
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-start gap-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            {leader.imageUrl && !imgError ? (
              <img
                src={leader.imageUrl}
                alt=""
                className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shadow-glow shrink-0"
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className="p-3 rounded-full bg-primary/10 text-primary shrink-0"
                aria-hidden="true"
              >
                <User size={28} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={clsx(
                    'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                    leader.type === 'Public'
                      ? 'bg-status-info text-status-info border-status-info'
                      : leader.type === 'Private'
                        ? 'bg-secondary/10 text-secondary border-secondary/20'
                        : 'bg-status-success text-status-success border-status-success'
                  )}
                >
                  {leader.type} Sector
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/50 text-muted-foreground">
                  {leader.category}
                </span>
                <StatusBadge status={leader.status} size="sm" />
              </div>
              <h3
                id="leader-popover-title"
                className="text-lg font-bold text-foreground leading-tight"
              >
                {leader.name}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <EndorseButton
              endorseUrl={buildEndorsementUrl({
                category: 'leader-endorsement',
                title: `Endorse: ${leader.name}`,
                resourceType: 'Leader',
                resourceId: leader.name,
                resourceDetails: [
                  `**Name:** ${leader.name}`,
                  `**Title:** ${leader.title}`,
                  `**Organization(s):** ${leader.organizations.join(', ')}`,
                  `**Country:** ${leader.country}`,
                  `**Sector:** ${leader.type}`,
                ].join('\n'),
                pageUrl: `/leaders?leader=${encodeURIComponent(leader.name)}`,
              })}
              resourceLabel={leader.name}
              resourceType="Leader"
            />
            <FlagButton
              flagUrl={buildFlagUrl({
                category: 'leader-endorsement',
                title: `Flag: ${leader.name}`,
                resourceType: 'Leader',
                resourceId: leader.name,
                resourceDetails: [
                  `**Name:** ${leader.name}`,
                  `**Title:** ${leader.title}`,
                  `**Organization(s):** ${leader.organizations.join(', ')}`,
                  `**Country:** ${leader.country}`,
                  `**Sector:** ${leader.type}`,
                ].join('\n'),
                pageUrl: `/leaders?leader=${encodeURIComponent(leader.name)}`,
              })}
              resourceLabel={leader.name}
              resourceType="Leader"
            />
            <AskAssistantButton
              question={`What is ${leader.name}'s role in post-quantum cryptography? They are ${leader.title} at ${leader.organizations.join(' and ')}${leader.bio ? `. Background: ${leader.bio}` : ''}`}
            />
            <Button
              variant="ghost"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close details"
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Title */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Briefcase size={14} className="shrink-0" aria-hidden="true" />
            <span>{leader.title}</span>
          </div>

          {/* Organizations */}
          <div className="space-y-1">
            {leader.organizations.map((org, i) => (
              <div key={i} className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Building2 size={14} className="shrink-0" aria-hidden="true" />
                <span>{org}</span>
              </div>
            ))}
          </div>

          {/* Country */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={14} className="shrink-0" aria-hidden="true" />
            <CountryFlag code={flagCode} width={20} height={14} />
            <span>{leader.country}</span>
          </div>

          {/* Bio */}
          <div className="glass-panel p-4">
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              &ldquo;{leader.bio}&rdquo;
            </p>
          </div>

          {/* Cross-links — related views filtered to this leader's context */}
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/timeline?country=${encodeURIComponent(leader.country)}`}
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted/30 border border-border hover:bg-muted/60 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
              title={`View timeline events from ${leader.country}`}
            >
              <Clock size={12} aria-hidden="true" />
              Events from {leader.country}
            </Link>
            <Link
              to={`/compliance${leader.type === 'Public' ? '?industry=Government+%26+Defense' : leader.type === 'Academic' ? '' : '?industry=Technology'}`}
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted/30 border border-border hover:bg-muted/60 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
              title="View compliance frameworks for this sector"
            >
              <ShieldCheck size={12} aria-hidden="true" />
              Compliance frameworks
            </Link>
          </div>

          {/* Key Resources — links to validated library references */}
          {leader.keyResourceUrl && leader.keyResourceUrl.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">
                {leader.keyResourceUrl.length === 1 ? 'Key Resource' : 'Key Resources'}
              </p>
              <div className="flex flex-col gap-1">
                {leader.keyResourceUrl.map((ref, i) => (
                  <Link
                    key={i}
                    to={`/library?ref=${encodeURIComponent(ref)}`}
                    onClick={onClose}
                    className="text-sm font-medium text-secondary hover:text-secondary/80 transition-colors flex items-center gap-2"
                    title={`Open in Library: ${ref}`}
                  >
                    <BookOpen size={12} className="shrink-0" aria-hidden="true" />
                    <span className="truncate">{ref}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {(leader.websiteUrl || leader.linkedinUrl) && (
            <div className="flex flex-wrap gap-3 pt-2">
              {leader.websiteUrl && (
                <a
                  href={leader.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${leader.name}'s website (opens in new window)`}
                  className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-primary text-sm font-medium transition-all"
                >
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  Website
                </a>
              )}
              {leader.linkedinUrl && (
                <a
                  href={leader.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${leader.name}'s LinkedIn profile (opens in new window)`}
                  className="flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-lg bg-status-info hover:bg-primary/20 border-status-info/50 hover:border-primary/40 text-status-info text-sm font-medium transition-all"
                >
                  <svg
                    width="14"
                    height="14"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Backdrop */}
      <div
        className="fixed inset-0 embed-backdrop bg-black/60"
        style={{ zIndex: -1 }}
        aria-hidden="true"
      />
    </FocusLock>
  )

  return createPortal(content, document.body)
}
