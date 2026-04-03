// SPDX-License-Identifier: GPL-3.0-only
import { Building2, Briefcase, School } from 'lucide-react'

export const getSectorIcon = (sector: string, size: number = 16, className?: string) => {
  const lower = sector.toLowerCase()
  if (lower.includes('public')) return <Building2 size={size} className={className} />
  if (lower.includes('academic')) return <School size={size} className={className} />
  return <Briefcase size={size} className={className} /> // Private
}
