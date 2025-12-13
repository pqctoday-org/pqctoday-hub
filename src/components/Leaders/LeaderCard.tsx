import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Building2, Briefcase } from 'lucide-react'
import type { Leader } from '../../data/leadersData'
import clsx from 'clsx'
import { StatusBadge } from '../common/StatusBadge'

interface LeaderCardProps {
  leader: Leader
}

export const LeaderCard = ({ leader }: LeaderCardProps) => {
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
          <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border border-border text-xs font-bold shadow-sm">
            {/* Simple flag mapping based on country name */}
            {leader.country === 'USA' && '🇺🇸'}
            {leader.country === 'UK' && '🇬🇧'}
            {leader.country === 'France' && '🇫🇷'}
            {leader.country === 'Germany' && '🇩🇪'}
            {leader.country === 'Switzerland' && '🇨🇭'}
            {leader.country === 'Canada' && '🇨🇦'}
            {/* Fallback for others if needed */}
            {!['USA', 'UK', 'France', 'Germany', 'Switzerland', 'Canada'].includes(
              leader.country
            ) && '🌍'}
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
        </div>
      </div>

      <h3 className="text-xl font-bold mb-1">{leader.name}</h3>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Briefcase size={14} aria-hidden="true" />
        <span>{leader.title}</span>
      </div>

      <div className="flex flex-col gap-1 text-sm font-bold text-primary mb-4">
        {leader.organizations.map((org, i) => (
          <div key={i} className="flex items-center gap-2">
            <Building2 size={14} aria-hidden="true" />
            <span>{org}</span>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-4 mb-4">
        "{leader.bio}"
      </p>

      {leader.keyResourceUrl && (
        <div className="mb-4 p-3 rounded-lg bg-muted/20 border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">
            Key Resource
          </p>
          <a
            href={leader.keyResourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-secondary hover:text-secondary/80 transition-colors flex items-center gap-2 truncate"
            title={leader.keyResourceUrl}
          >
            <span className="truncate">View Resource</span>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      )}

      {(leader.websiteUrl || leader.linkedinUrl) && (
        <div className="flex gap-3 mt-auto pt-4 border-t border-border">
          {leader.websiteUrl && (
            <a
              href={leader.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${leader.name}'s website (opens in new window)`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/40 text-primary text-xs font-medium transition-all group"
            >
              <svg
                width="14"
                height="14"
                className="group-hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <title>Website icon</title>
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
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-info hover:bg-blue-500/20 border-status-info/50 hover:border-blue-500/40 text-status-info text-xs font-medium transition-all group"
            >
              <svg
                width="14"
                height="14"
                className="group-hover:scale-110 transition-transform"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <title>LinkedIn icon</title>
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
          )}
        </div>
      )}
    </motion.article>
  )
}
