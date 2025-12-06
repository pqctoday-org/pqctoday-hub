import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { threatsData } from '../../data/threatsData'
import { createPortal } from 'react-dom'
import {
  Search,
  ChevronDown,
  ChevronUp,
  Plane,
  Landmark,
  Zap,
  Radio,
  Stethoscope,
  Shield,
  Car,
  Cpu,
  Briefcase,
  AlertOctagon,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
} from 'lucide-react'
import { logEvent } from '../../utils/analytics'
import { FilterDropdown } from '../common/FilterDropdown'
import clsx from 'clsx'
import type { ThreatData } from '../../data/threatsData'

type SortField = 'industry' | 'threatId' | 'criticality'
type SortDirection = 'asc' | 'desc'

const ThreatDetailsModal = ({
  threat,
  onClose,
}: {
  threat: ThreatData | null
  onClose: () => void
}) => {
  if (!threat) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span className="text-primary">
                {/* We can re-use the icon if we had access to the helper, but text is fine or passed in */}
                {threat.industry}
              </span>
              <span className="text-muted-foreground text-sm font-normal">Details</span>
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label
                htmlFor="threat-id"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block"
              >
                Threat ID
              </label>
              <div id="threat-id" className="font-mono text-sm bg-muted/30 p-2 rounded">
                {threat.threatId}
              </div>
            </div>
            <div>
              <label
                htmlFor="threat-description"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block"
              >
                Description
              </label>
              <p id="threat-description" className="text-sm leading-relaxed text-foreground">
                {threat.description}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label
                  htmlFor="threat-criticality"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block"
                >
                  Criticality
                </label>
                <div
                  id="threat-criticality"
                  className={clsx(
                    'inline-block px-2 py-1 rounded text-xs font-bold border',
                    threat.criticality === 'Critical'
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : threat.criticality === 'High'
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  )}
                >
                  {threat.criticality}
                </div>
              </div>
            </div>
            <div>
              <label
                htmlFor="threat-source"
                className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block"
              >
                Source
              </label>
              <div id="threat-source" className="text-xs text-muted-foreground italic">
                {threat.source}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

export const ThreatsDashboard = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('All')
  const [selectedCriticality, setSelectedCriticality] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('industry')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedThreat, setSelectedThreat] = useState<ThreatData | null>(null)

  // Helper to get icon for industry
  const getIndustryIcon = (industry: string) => {
    const lower = industry.toLowerCase()
    if (lower.includes('aerospace') || lower.includes('aviation')) return <Plane size={16} />
    if (lower.includes('finance') || lower.includes('banking')) return <Landmark size={16} />
    if (lower.includes('energy') || lower.includes('utilities')) return <Zap size={16} />
    if (lower.includes('telecom')) return <Radio size={16} />
    if (lower.includes('healthcare') || lower.includes('pharma')) return <Stethoscope size={16} />
    if (lower.includes('government') || lower.includes('defense')) return <Shield size={16} />
    if (lower.includes('automotive')) return <Car size={16} />
    if (lower.includes('technology')) return <Cpu size={16} />
    return <Briefcase size={16} />
  }

  // Extract unique industries for filter
  const industryItems = useMemo(() => {
    const unique = new Set(threatsData.map((d) => d.industry))
    const sortedIndustries = Array.from(unique).sort()

    return [
      { id: 'All', label: 'All Industries', icon: null },
      ...sortedIndustries.map((ind) => ({
        id: ind,
        label: ind,
        icon: getIndustryIcon(ind),
      })),
    ]
  }, [])

  // Criticality items
  const criticalityItems = useMemo(() => {
    return [
      { id: 'All', label: 'All Levels', icon: null },
      {
        id: 'Critical',
        label: 'Critical',
        icon: <AlertOctagon size={16} className="text-red-400" />,
      },
      { id: 'High', label: 'High', icon: <AlertTriangle size={16} className="text-orange-400" /> },
      {
        id: 'Medium-High',
        label: 'Medium-High',
        icon: <AlertCircle size={16} className="text-yellow-400" />,
      },
      { id: 'Medium', label: 'Medium', icon: <Info size={16} className="text-blue-400" /> },
      { id: 'Low', label: 'Low', icon: <CheckCircle size={16} className="text-green-400" /> },
    ]
  }, [])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredAndSortedData = useMemo(() => {
    let data = [...threatsData]

    // Filter by Industry
    if (selectedIndustry !== 'All') {
      data = data.filter((item) => item.industry === selectedIndustry)
    }

    // Filter by Criticality
    if (selectedCriticality !== 'All') {
      data = data.filter((item) => item.criticality === selectedCriticality)
    }

    // Filter by Search Query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      data = data.filter(
        (item) =>
          item.threatId.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.industry.toLowerCase().includes(query) ||
          item.cryptoAtRisk.toLowerCase().includes(query) ||
          item.pqcReplacement.toLowerCase().includes(query)
      )
    }

    // Sort
    data.sort((a, b) => {
      // Primary Sort: Industry (Always Ascending unless overridden by user interaction logic, but here we default to industry asc)
      // Actually, let's respect the sortField/sortDirection for the primary sort,
      // but if sortField is 'industry', we add a secondary sort for Criticality.

      const criticalityOrder: Record<string, number> = {
        Critical: 3,
        High: 2,
        'Medium-High': 1.5,
        Medium: 1,
        Low: 0,
      }
      // eslint-disable-next-line security/detect-object-injection
      const getCriticalityVal = (c: string) => criticalityOrder[c] ?? 0

      if (sortField === 'industry') {
        if (a.industry !== b.industry) {
          return sortDirection === 'asc'
            ? a.industry.localeCompare(b.industry)
            : b.industry.localeCompare(a.industry)
        }
        // Secondary Sort: Criticality (Highest First -> Descending)
        return getCriticalityVal(b.criticality) - getCriticalityVal(a.criticality)
      }

      // eslint-disable-next-line security/detect-object-injection
      let valA: string | number = a[sortField]
      // eslint-disable-next-line security/detect-object-injection
      let valB: string | number = b[sortField]

      // Custom sort for criticality column
      if (sortField === 'criticality') {
        valA = getCriticalityVal(a.criticality)
        valB = getCriticalityVal(b.criticality)
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return data
  }, [selectedIndustry, selectedCriticality, searchQuery, sortField, sortDirection])

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-2 md:mb-12">
        <h2 className="text-lg md:text-4xl font-bold mb-1 md:mb-4 text-gradient">
          Quantum Threats
        </h2>
        <p className="hidden lg:block text-muted-foreground max-w-2xl mx-auto mb-4">
          Detailed analysis of quantum threats across industries, including criticality, at-risk
          cryptography, and PQC replacements.
        </p>
        <p className="hidden lg:block text-[10px] md:text-xs text-muted-foreground/60 font-mono">
          Data Source: quantum_threats_hsm_industries_12032025.csv • Updated:{' '}
          {new Date('2025-12-03').toLocaleDateString()}
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-card border border-border rounded-lg shadow-lg p-2 mb-8 flex flex-col md:flex-row items-center gap-4">
        {/* Mobile: Filters on one row */}
        <div className="flex items-center gap-2 w-full md:w-auto text-xs">
          <div className="flex-1 min-w-[120px]">
            <FilterDropdown
              items={industryItems}
              selectedId={selectedIndustry}
              onSelect={(id) => {
                setSelectedIndustry(id)
                logEvent('Threats', 'Filter Industry', id)
              }}
              defaultLabel="Industry"
              defaultIcon={<Briefcase size={14} className="text-primary" />}
              opaque
              className="mb-0 w-full"
              noContainer
            />
          </div>

          <div className="flex-1 min-w-[120px]">
            <FilterDropdown
              items={criticalityItems}
              selectedId={selectedCriticality}
              onSelect={(id) => {
                setSelectedCriticality(id)
                logEvent('Threats', 'Filter Criticality', id)
              }}
              defaultLabel="Criticality"
              defaultIcon={<AlertCircle size={14} className="text-primary" />}
              opaque
              className="mb-0 w-full"
              noContainer
            />
          </div>
        </div>

        <span className="hidden md:inline text-muted-foreground px-2">Search:</span>
        <div className="hidden md:flex relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search threats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-muted/30 hover:bg-muted/50 border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 w-full transition-colors text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th
                  className="p-4 font-semibold text-sm cursor-pointer hover:text-primary transition-colors max-w-[60px] md:max-w-none"
                  onClick={() => handleSort('industry')}
                >
                  <div className="flex items-center gap-1 justify-center md:justify-start">
                    <span className="md:hidden">Ind.</span>
                    <span className="hidden md:inline">Industry</span>
                    {sortField === 'industry' &&
                      (sortDirection === 'asc' ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      ))}
                  </div>
                </th>
                <th
                  className="hidden md:table-cell p-4 font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort('threatId')}
                >
                  <div className="flex items-center gap-1">
                    ID
                    {sortField === 'threatId' &&
                      (sortDirection === 'asc' ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      ))}
                  </div>
                </th>
                <th className="hidden md:table-cell p-4 font-semibold text-sm w-1/3">
                  Description
                </th>
                <th
                  className="p-4 font-semibold text-sm cursor-pointer hover:text-primary transition-colors max-w-[60px] md:max-w-none"
                  onClick={() => handleSort('criticality')}
                >
                  <div className="flex items-center gap-1 justify-center md:justify-start">
                    <span className="md:hidden">Crit.</span>
                    <span className="hidden md:inline">Criticality</span>
                    {sortField === 'criticality' &&
                      (sortDirection === 'asc' ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      ))}
                  </div>
                </th>
                <th className="p-4 font-semibold text-sm">Crypto</th>
                <th className="p-4 font-semibold text-sm">PQC Repl.</th>
                <th className="md:hidden p-4 font-semibold text-sm text-center">Info</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredAndSortedData.map((item) => (
                  <motion.tr
                    key={item.threatId}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-border hover:bg-muted/30 transition-colors group"
                  >
                    <td className="p-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors text-center md:text-left">
                      <span
                        className="md:hidden flex items-center justify-center text-primary"
                        title={item.industry}
                      >
                        {getIndustryIcon(item.industry)}
                      </span>
                      <span className="hidden md:inline">{item.industry}</span>
                    </td>
                    <td className="hidden md:table-cell p-4 text-sm font-mono text-primary/80">
                      {item.threatId}
                    </td>
                    {/* Desktop Description */}
                    <td className="hidden md:table-cell p-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      {item.description}
                      <div className="text-[10px] text-muted-foreground/50 mt-1 uppercase tracking-wider">
                        Source: {item.source}
                      </div>
                    </td>
                    <td className="p-4 text-center md:text-left">
                      {/* Mobile Criticality Icon */}
                      <div className="md:hidden flex justify-center">
                        {criticalityItems.find((c) => c.id === item.criticality)?.icon || (
                          <AlertCircle size={16} />
                        )}
                      </div>
                      {/* Desktop Criticality Badge */}
                      <span
                        className={clsx(
                          'hidden md:inline-block px-2 py-1 rounded text-xs font-bold border',
                          item.criticality === 'Critical'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : item.criticality === 'High'
                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        )}
                      >
                        {item.criticality}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground font-mono">
                      {item.cryptoAtRisk.split(',').map((c, i) => (
                        <div key={i}>{c.trim()}</div>
                      ))}
                    </td>
                    <td className="p-4 text-xs text-green-400/80 font-mono">
                      {item.pqcReplacement.split(',').map((c, i) => (
                        <div key={i}>{c.trim()}</div>
                      ))}
                    </td>
                    {/* Mobile Info Button Column */}
                    <td className="md:hidden p-4 text-center">
                      <button
                        onClick={() => setSelectedThreat(item)}
                        className="p-1.5 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                        aria-label="View Details"
                      >
                        <Info size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filteredAndSortedData.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            No threats found matching your filters.
          </div>
        )}
      </div>
      <ThreatDetailsModal threat={selectedThreat} onClose={() => setSelectedThreat(null)} />
    </div>
  )
}
