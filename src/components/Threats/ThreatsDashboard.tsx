import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { threatsData } from '../../data/threatsData'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import { logEvent } from '../../utils/analytics'
import clsx from 'clsx'

type SortField = 'industry' | 'threatId' | 'criticality'
type SortDirection = 'asc' | 'desc'

export const ThreatsDashboard = () => {
    const [selectedIndustry, setSelectedIndustry] = useState<string>('All')
    const [searchQuery, setSearchQuery] = useState('')
    const [sortField, setSortField] = useState<SortField>('industry')
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

    // Extract unique industries for filter
    const industries = useMemo(() => {
        const unique = new Set(threatsData.map((d) => d.industry))
        return ['All', ...Array.from(unique).sort()]
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

            const criticalityOrder = { Critical: 3, High: 2, 'Medium-High': 1.5, Medium: 1, Low: 0 }
            // @ts-ignore
            const getCriticalityVal = (c) => criticalityOrder[c] || 0

            if (sortField === 'industry') {
                if (a.industry !== b.industry) {
                    return sortDirection === 'asc'
                        ? a.industry.localeCompare(b.industry)
                        : b.industry.localeCompare(a.industry)
                }
                // Secondary Sort: Criticality (Highest First -> Descending)
                return getCriticalityVal(b.criticality) - getCriticalityVal(a.criticality)
            }

            let valA = a[sortField]
            let valB = b[sortField]

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
    }, [selectedIndustry, searchQuery, sortField, sortDirection])

    return (
        <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-4 text-gradient">Quantum Threats</h2>
                <p className="text-muted max-w-2xl mx-auto mb-8">
                    Detailed analysis of quantum threats across industries, including criticality, at-risk cryptography, and PQC replacements.
                </p>

                {/* Industry Filter Tabs */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {industries.map((ind) => (
                        <button
                            key={ind}
                            onClick={() => {
                                setSelectedIndustry(ind)
                                logEvent('Threats', 'Filter Industry', ind)
                            }}
                            className={clsx(
                                'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border',
                                selectedIndustry === ind
                                    ? 'bg-primary/20 text-primary border-primary/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                                    : 'bg-white/5 text-muted hover:text-white border-white/10 hover:border-white/20'
                            )}
                        >
                            {ind === 'All' ? 'All Industries' : ind}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="flex justify-end mb-4">
                    <div className="relative w-full md:w-64">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                            type="text"
                            placeholder="Search threats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th
                                    className="p-4 font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleSort('industry')}
                                >
                                    <div className="flex items-center gap-1">
                                        Industry
                                        {sortField === 'industry' &&
                                            (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th
                                    className="p-4 font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleSort('threatId')}
                                >
                                    <div className="flex items-center gap-1">
                                        ID
                                        {sortField === 'threatId' &&
                                            (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 font-semibold text-sm w-1/3">Description</th>
                                <th
                                    className="p-4 font-semibold text-sm cursor-pointer hover:text-primary transition-colors"
                                    onClick={() => handleSort('criticality')}
                                >
                                    <div className="flex items-center gap-1">
                                        Criticality
                                        {sortField === 'criticality' &&
                                            (sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 font-semibold text-sm">Crypto at Risk</th>
                                <th className="p-4 font-semibold text-sm">PQC Replacement</th>
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
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                                    >
                                        <td className="p-4 text-sm text-muted group-hover:text-white transition-colors">
                                            {item.industry}
                                        </td>
                                        <td className="p-4 text-sm font-mono text-primary/80">{item.threatId}</td>
                                        <td className="p-4 text-sm text-muted group-hover:text-white transition-colors">
                                            {item.description}
                                            <div className="text-[10px] text-muted/50 mt-1 uppercase tracking-wider">
                                                Source: {item.source}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={clsx(
                                                    'px-2 py-1 rounded text-xs font-bold border',
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
                                        <td className="p-4 text-xs text-muted font-mono">
                                            {item.cryptoAtRisk.split(',').map((c, i) => (
                                                <div key={i}>{c.trim()}</div>
                                            ))}
                                        </td>
                                        <td className="p-4 text-xs text-green-400/80 font-mono">
                                            {item.pqcReplacement.split(',').map((c, i) => (
                                                <div key={i}>{c.trim()}</div>
                                            ))}
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
                {filteredAndSortedData.length === 0 && (
                    <div className="p-8 text-center text-muted">No threats found matching your filters.</div>
                )}
            </div>
        </div>
    )
}
