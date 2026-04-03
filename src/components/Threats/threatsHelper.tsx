// SPDX-License-Identifier: GPL-3.0-only
import { Plane, Landmark, Zap, Radio, Stethoscope, Shield, Car, Cpu, Briefcase } from 'lucide-react'

export const getIndustryIcon = (industry: string, size: number = 16, className?: string) => {
  const lower = industry.toLowerCase()
  if (lower.includes('aerospace') || lower.includes('aviation'))
    return <Plane size={size} className={className} />
  if (lower.includes('finance') || lower.includes('banking'))
    return <Landmark size={size} className={className} />
  if (lower.includes('energy') || lower.includes('utilities'))
    return <Zap size={size} className={className} />
  if (lower.includes('telecom')) return <Radio size={size} className={className} />
  if (lower.includes('healthcare') || lower.includes('pharma'))
    return <Stethoscope size={size} className={className} />
  if (lower.includes('government') || lower.includes('defense'))
    return <Shield size={size} className={className} />
  if (lower.includes('automotive')) return <Car size={size} className={className} />
  if (lower.includes('technology')) return <Cpu size={size} className={className} />
  return <Briefcase size={size} className={className} />
}
