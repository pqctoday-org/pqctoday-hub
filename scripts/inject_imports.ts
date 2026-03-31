import * as fs from 'fs'
import * as path from 'path'

const dir = 'src/components/About/sections'

const allImports = `// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { 
  Info, Globe, BookOpen, ShieldAlert, FileText, Shield, 
  GithubIcon, ShieldCheck, Lock, BrainCircuit, Database, 
  Link2, Sparkles, BarChart2, MessageSquare, Handshake, 
  ChevronRight, ChevronDown, ExternalLink, BookMarked, 
  Construction, Wrench, Linkedin, Cloud, Users,
  Lightbulb, HelpCircle, Cpu, Trophy, CalendarDays, Package, Stamp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LinkToUsButton } from '@/components/ui/LinkToUsButton'
import { CareerJourneyModal } from '../CareerJourneyModal'
import { WorkgroupDetailModal } from '../WorkgroupDetailModal'
import { PQC_WORKGROUPS, WORKGROUP_REGIONS } from '../workgroupData'
import type { Workgroup } from '../workgroupData'
import { useTheme } from '@/hooks/useTheme'
import { getCurrentVersion, useVersionStore } from '@/store/useVersionStore'
import { 
  MISSION_TAGS, PRINCIPLES, NOT_ITEMS, DATA_FOUNDATION, 
  DISCUSSIONS_BASE, DISCUSSIONS, CRYPTO_BUFF_SITES, CRYPTO_BUFF_BOOKS 
} from '../aboutData'

`

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.tsx') && !f.startsWith('temp_'))

for (const f of files) {
  if (f === 'ReleaseNotesSection.tsx') continue
  const p = path.join(dir, f)
  let content = fs.readFileSync(p, 'utf8')

  // Find missing useState hooks for everything and just declare them
  const states = `
  const { theme, setTheme } = useTheme()
  const version = getCurrentVersion()
  const requestShowWhatsNew = useVersionStore((s) => s.requestShowWhatsNew)
  const [isJourneyModalOpen, setIsJourneyModalOpen] = useState(false)
  const [selectedWorkgroup, setSelectedWorkgroup] = useState<Workgroup | null>(null)
  const [isShowAllDiscussions, setIsShowAllDiscussions] = useState(false)
  const [isMissionOpen, setIsMissionOpen] = useState(false)
  const [isWorkgroupsOpen, setIsWorkgroupsOpen] = useState(false)
  const [isSbomOpen, setIsSbomOpen] = useState(false)
  const [isCryptoBuffSitesOpen, setIsCryptoBuffSitesOpen] = useState(false)
  const [isCryptoBuffBooksOpen, setIsCryptoBuffBooksOpen] = useState(false)
  const [isDataPrivacyOpen, setIsDataPrivacyOpen] = useState(false)
  const [isPqcAssistantOpen, setIsPqcAssistantOpen] = useState(false)
`

  content = content.replace(
    new RegExp(`export function ${f.split('.')[0]}\\(\\) \\{`),
    `export function ${f.split('.')[0]}() { \n${states}\n`
  )

  fs.writeFileSync(p, allImports + content)
}

// Clean up temp files
const temps = fs.readdirSync(dir).filter((f) => f.startsWith('temp_'))
for (const t of temps) fs.unlinkSync(path.join(dir, t))

console.log('Injected imports into ' + files.length + ' files')
