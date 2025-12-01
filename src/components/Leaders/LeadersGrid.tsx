import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { leadersData } from '../../data/leadersData'
import { User, Building2, Briefcase } from 'lucide-react'
import clsx from 'clsx'

export const LeadersGrid = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>('All')

  // Extract unique countries
  const countries = useMemo(() => {
    const unique = new Set(leadersData.map((l) => l.country))
    return ['All', ...Array.from(unique).sort()]
  }, [])

  // Filter leaders
  const filteredLeaders = useMemo(() => {
    if (selectedCountry === 'All') return leadersData
    return leadersData.filter((l) => l.country === selectedCountry)
  }, [selectedCountry])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4 text-gradient">Transformation Leaders</h2>
        <p className="text-muted max-w-2xl mx-auto mb-8">
          Meet the visionaries and organizations driving the global transition to Post-Quantum
          Cryptography.
        </p>

        {/* Country Filter */}
        <div className="flex flex-wrap justify-center gap-2">
          {countries.map((country) => (
            <button
              key={country}
              onClick={() => setSelectedCountry(country)}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border',
                selectedCountry === country
                  ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                  : 'bg-white/5 text-muted hover:text-white border-white/10 hover:border-white/20'
              )}
            >
              {country === 'All' ? 'All Countries' : country}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredLeaders.map((leader) => (
            <motion.article
              key={leader.name}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="glass-panel p-6 flex flex-col h-full hover:border-secondary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="relative">
                  {leader.imageUrl ? (
                    <img
                      src={leader.imageUrl}
                      alt=""
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                    />
                  ) : (
                    <div className="p-3 rounded-full bg-white/5 text-secondary" aria-hidden="true">
                      <User size={24} />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border border-white/10 text-xs font-bold shadow-sm">
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
                <span
                  className={clsx(
                    'px-3 py-1 rounded-full text-xs font-bold border',
                    leader.type === 'Public'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  )}
                >
                  {leader.type} Sector
                </span>
              </div>

              <h3 className="text-xl font-bold mb-1">{leader.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted mb-4">
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

              <p className="text-sm text-muted leading-relaxed border-t border-white/5 pt-4 mb-4">
                "{leader.bio}"
              </p>

              {leader.keyContribution && (
                <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-muted uppercase tracking-wider font-bold mb-1">
                    Key Contribution
                  </p>
                  <p
                    className="text-sm font-medium text-secondary block truncate"
                    title={leader.keyContribution.title}
                  >
                    {leader.keyContribution.title}
                  </p>
                  <span className="text-xs text-muted/60 mt-1 block">
                    {leader.keyContribution.type}
                  </span>
                </div>
              )}

              {(leader.websiteUrl || leader.linkedinUrl) && (
                <div className="flex gap-3 mt-auto pt-4 border-t border-white/5">
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
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 text-xs font-medium transition-all group"
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
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
