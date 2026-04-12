// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Building2, Briefcase, Info } from 'lucide-react'
import type { Leader } from '../../data/leadersData'
import clsx from 'clsx'
import { StatusBadge } from '../common/StatusBadge'
import { AskAssistantButton } from '../ui/AskAssistantButton'
import { EndorseButton } from '../ui/EndorseButton'
import { FlagButton } from '../ui/FlagButton'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { CountryFlag } from '../common/CountryFlag'
import { FLAG_CODE_MAP } from './leadersConstants'
import { Button } from '@/components/ui/button'

interface LeaderCardProps {
  leader: Leader
  onClick?: () => void
  isIndustryMatch?: boolean
}

export const LeaderCard = ({ leader, onClick, isIndustryMatch }: LeaderCardProps) => {
  const [hasError, setHasError] = useState(false)

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="glass-panel p-6 flex flex-col h-full hover:border-secondary/50 transition-colors bg-card/50"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="relative">
          {leader.imageUrl && !hasError ? (
            <img
              src={leader.imageUrl}
              alt=""
              className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shadow-glow"
              onError={() => setHasError(true)}
            />
          ) : (
            <div className="p-3 rounded-full bg-primary/10 text-primary" aria-hidden="true">
              <User size={24} />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border border-border shadow-sm">
            <CountryFlag code={FLAG_CODE_MAP[leader.country] ?? 'un'} width={16} height={11} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={clsx(
              'px-3 py-1 rounded-full text-xs font-bold border',
              leader.type === 'Public'
                ? 'bg-status-info text-status-info border-status-info'
                : leader.type === 'Private'
                  ? 'bg-secondary/10 text-secondary border-secondary/20'
                  : 'bg-status-success text-status-success border-status-success'
            )}
          >
            {leader.type} Sector
          </span>
          <StatusBadge status={leader.status} size="sm" />
          {isIndustryMatch && (
            <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-medium">
              Relevant to you
            </span>
          )}
        </div>
      </div>

      <h3 className="text-xl font-bold mb-1">{leader.name}</h3>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 overflow-hidden">
        <Briefcase size={14} aria-hidden="true" className="shrink-0" />
        <span className="truncate">{leader.title}</span>
      </div>

      <div className="flex flex-col gap-1 text-sm font-bold text-primary mb-4">
        {leader.organizations.map((org, i) => (
          <div key={i} className="flex items-center gap-2 overflow-hidden">
            <Building2 size={14} aria-hidden="true" className="shrink-0" />
            <span className="truncate">{org}</span>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-4 mb-4 line-clamp-3">
        "{leader.bio}"
      </p>

      <div className="flex flex-wrap items-center justify-end gap-y-2 gap-x-1 mt-auto pt-2 border-t border-border">
        {onClick && (
          <Button
            variant="ghost"
            onClick={onClick}
            className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors"
            aria-label={`View details for ${leader.name}`}
          >
            <Info size={16} />
          </Button>
        )}
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
          variant="text"
          label={`Ask about ${leader.name}`}
          question={`What is ${leader.name}'s role in post-quantum cryptography? They are ${leader.title} at ${leader.organizations.join(' and ')}${leader.bio ? `. Background: ${leader.bio}` : ''}`}
        />
      </div>
    </motion.article>
  )
}
