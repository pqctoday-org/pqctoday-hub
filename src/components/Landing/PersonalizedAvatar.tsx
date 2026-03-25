// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award,
  BookOpen,
  Briefcase,
  Car,
  Code,
  Cpu,
  Factory,
  Globe,
  GraduationCap,
  HeartPulse,
  Landmark,
  Layers,
  Plane,
  Radio,
  Server,
  Shield,
  ShieldCheck,
  ShoppingCart,
  User,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'
import type { Region, ExperienceLevel } from '@/store/usePersonaStore'

interface PersonalizedAvatarProps {
  persona: PersonaId | null
  experience: ExperienceLevel | null
  region: Region | null
  industries: string[]
}

const PERSONA_ICONS: Record<string, LucideIcon> = {
  Briefcase,
  Code,
  ShieldCheck,
  GraduationCap,
  Server,
}

const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  'Finance & Banking': Landmark,
  'Government & Defense': Shield,
  Healthcare: HeartPulse,
  Telecommunications: Radio,
  Technology: Cpu,
  'Energy & Utilities': Zap,
  Automotive: Car,
  Aerospace: Plane,
  'Retail & E-Commerce': ShoppingCart,
  Other: Layers,
}

const INDUSTRY_SHORT: Record<string, string> = {
  'Finance & Banking': 'Finance',
  'Government & Defense': 'Gov/Defense',
  Healthcare: 'Healthcare',
  Telecommunications: 'Telecom',
  Technology: 'Tech',
  'Energy & Utilities': 'Energy',
  Automotive: 'Auto',
  Aerospace: 'Aerospace',
  'Retail & E-Commerce': 'Retail',
  Other: 'Other',
}

const REGION_CONFIG: Record<Region, { flag: string | null; label: string }> = {
  global: { flag: null, label: 'Global' },
  americas: { flag: '/flags/us.svg', label: 'Americas' },
  eu: { flag: '/flags/eu.svg', label: 'Europe' },
  apac: { flag: '/flags/au.svg', label: 'APAC' },
}

const EXP_CONFIG: Record<ExperienceLevel, { Icon: LucideIcon; label: string; color: string }> = {
  curious: { Icon: BookOpen, label: 'Curious', color: 'text-status-info' },
  basics: { Icon: GraduationCap, label: 'Intermediate', color: 'text-status-warning' },
  expert: { Icon: Award, label: 'Expert', color: 'text-status-success' },
}

export const PersonalizedAvatar: React.FC<PersonalizedAvatarProps> = ({
  persona,
  experience,
  region,
  industries,
}) => {
  const RoleIcon = persona ? (PERSONA_ICONS[PERSONAS[persona].icon] ?? User) : User
  const roleColorClass = persona ? 'text-primary' : 'text-muted-foreground'
  const roleGradient = persona
    ? 'from-primary/20 via-primary/5 to-transparent'
    : 'from-muted/20 via-muted/5 to-transparent'

  const expCfg = experience ? EXP_CONFIG[experience] : null
  const primaryIndustry = industries[0]
  const IndIcon = primaryIndustry ? (INDUSTRY_ICONS[primaryIndustry] ?? Factory) : null
  const indShort = primaryIndustry ? (INDUSTRY_SHORT[primaryIndustry] ?? primaryIndustry) : null
  const showAllIndustries = persona && industries.length === 0
  const regionCfg = region ? REGION_CONFIG[region] : null

  const hasDetails = expCfg || IndIcon || showAllIndustries || regionCfg

  return (
    <div className="relative w-full max-w-[220px] mx-auto group">
      {/* Outer Halo */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${roleGradient} opacity-50 blur-xl transition-all duration-700 group-hover:opacity-80`}
      />

      {/* Main Tile */}
      <div className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-md shadow-xl p-3 flex flex-col items-center transition-all duration-500 hover:border-primary/50">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`role-${persona}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className={`p-2.5 rounded-full bg-background/50 border border-border/50 shadow-inner ${roleColorClass}`}
          >
            <RoleIcon size={24} strokeWidth={1.5} />
          </motion.div>
        </AnimatePresence>

        <p className="text-[11px] font-bold tracking-tight text-foreground truncate w-full text-center mt-1.5 leading-tight">
          {persona ? PERSONAS[persona].label : 'Generic User'}
        </p>

        {/* Detail pills */}
        {hasDetails && (
          <div className="w-full border-t border-border/30 mt-2 pt-2 flex flex-wrap items-center justify-center gap-1">
            <AnimatePresence>
              {expCfg && (
                <motion.span
                  key="exp"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className={`inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-background/80 border border-border/50 ${expCfg.color}`}
                >
                  <expCfg.Icon size={9} />
                  {expCfg.label}
                </motion.span>
              )}

              {(IndIcon && indShort) || showAllIndustries ? (
                <motion.span
                  key="ind"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-background/80 border border-border/50 text-secondary"
                >
                  {IndIcon ? <IndIcon size={9} /> : <Layers size={9} />}
                  {indShort ?? 'All'}
                </motion.span>
              ) : null}

              {regionCfg && (
                <motion.span
                  key="reg"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="inline-flex items-center gap-0.5 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent"
                >
                  {regionCfg.flag ? (
                    <img
                      src={regionCfg.flag}
                      alt={regionCfg.label}
                      className="w-3 h-2.5 object-cover rounded-[1px]"
                    />
                  ) : (
                    <Globe size={9} />
                  )}
                  {regionCfg.label}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
