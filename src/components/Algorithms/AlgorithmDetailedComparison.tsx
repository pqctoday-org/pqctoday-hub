import { motion } from 'framer-motion'
import { useState, useEffect, useMemo } from 'react'
import {
  loadPQCAlgorithmsData,
  type AlgorithmDetail,
  isPQC,
  getPerformanceCategory,
  getPerformanceColor,
  getSecurityLevelColor,
} from '../../data/pqcAlgorithmsData'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { FilterDropdown } from '../common/FilterDropdown'
import {
  Shield,
  Zap,
  HardDrive,
  TrendingUp,
  Filter,
  Info,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SearchX,
} from 'lucide-react'
import clsx from 'clsx'

type SortField = 'name' | 'type' | 'keygen' | 'sign' | 'verify' | 'ram' | 'optimization'
type SortDir = 'asc' | 'desc'

const TYPE_ITEMS = [
  { id: 'All', label: 'All Algorithms' },
  { id: 'pqc', label: 'PQC Only' },
  { id: 'classical', label: 'Classical Only' },
]

const LEVEL_ITEMS = [
  { id: 'All', label: 'All Levels' },
  { id: '1', label: 'Level 1' },
  { id: '2', label: 'Level 2' },
  { id: '3', label: 'Level 3' },
  { id: '4', label: 'Level 4' },
  { id: '5', label: 'Level 5' },
]

function getPerformanceMultiplier(cycles: string): number {
  if (cycles === 'Baseline' || cycles.includes('Baseline')) return 1
  // eslint-disable-next-line security/detect-unsafe-regex
  const match = cycles.match(/(\d+(?:\.\d+)?)x/)
  return match ? parseFloat(match[1]) : 1
}

export const AlgorithmDetailedComparison = () => {
  const [algorithms, setAlgorithms] = useState<AlgorithmDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState('All')
  const [filterSecurityLevel, setFilterSecurityLevel] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadPQCAlgorithmsData()
      .then((data) => {
        setAlgorithms(data)
        setIsLoading(false)
      })
      .catch((error) => {
        console.error('Failed to load PQC algorithms data:', error)
        setIsLoading(false)
      })
  }, [])

  const filteredAlgorithms = useMemo(() => {
    return algorithms.filter((algo) => {
      if (filterType === 'pqc' && !isPQC(algo)) return false
      if (filterType === 'classical' && isPQC(algo)) return false
      if (filterSecurityLevel !== 'All' && algo.securityLevel !== parseInt(filterSecurityLevel))
        return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (
          !algo.name.toLowerCase().includes(q) &&
          !algo.family.toLowerCase().includes(q) &&
          !algo.fipsStandard.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [algorithms, filterType, filterSecurityLevel, searchQuery])

  const availableLevels = useMemo(() => {
    const typeFiltered = algorithms.filter((algo) => {
      if (filterType === 'pqc' && !isPQC(algo)) return false
      if (filterType === 'classical' && isPQC(algo)) return false
      return true
    })
    const levels = new Set(typeFiltered.map((a) => a.securityLevel).filter(Boolean))
    return LEVEL_ITEMS.filter((item) => item.id === 'All' || levels.has(parseInt(item.id)))
  }, [algorithms, filterType])

  const handleTypeChange = (id: string) => {
    setFilterType(id)
    setFilterSecurityLevel('All')
  }

  if (isLoading) {
    return (
      <div className="glass-panel p-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading algorithm data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="glass-panel p-3 md:p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              items={TYPE_ITEMS}
              selectedId={filterType}
              onSelect={handleTypeChange}
              label="Type"
              defaultLabel="All Algorithms"
              noContainer
            />

            <FilterDropdown
              items={availableLevels}
              selectedId={filterSecurityLevel}
              onSelect={setFilterSecurityLevel}
              label="Security"
              defaultLabel="All Levels"
              defaultIcon={<Shield size={16} className="text-primary" />}
              noContainer
            />
          </div>

          <div className="relative flex-1 min-w-[180px] md:max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search algorithms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-muted/30 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="text-sm text-muted-foreground md:ml-auto whitespace-nowrap">
            Showing {filteredAlgorithms.length} of {algorithms.length} algorithms
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="performance">
        <TabsList className="mb-4 bg-muted/50 border border-border">
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Zap size={16} />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield size={16} />
            <span className="hidden sm:inline">Security Levels</span>
          </TabsTrigger>
          <TabsTrigger value="sizes" className="flex items-center gap-2">
            <HardDrive size={16} />
            <span className="hidden sm:inline">Size Comparison</span>
          </TabsTrigger>
          <TabsTrigger value="usecases" className="flex items-center gap-2">
            <TrendingUp size={16} />
            <span className="hidden sm:inline">Use Cases</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <PerformanceView algorithms={filteredAlgorithms} />
          </motion.div>
        </TabsContent>

        <TabsContent value="security">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SecurityView algorithms={filteredAlgorithms} />
          </motion.div>
        </TabsContent>

        <TabsContent value="sizes">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SizesView algorithms={filteredAlgorithms} />
          </motion.div>
        </TabsContent>

        <TabsContent value="usecases">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <UseCasesView algorithms={filteredAlgorithms} />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const EmptyState = () => (
  <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
    <SearchX size={48} className="text-muted-foreground/50 mb-4" />
    <h4 className="text-lg font-semibold text-foreground mb-2">No algorithms match</h4>
    <p className="text-sm text-muted-foreground max-w-md">
      Try adjusting your filters or search query to see results.
    </p>
  </div>
)

// Performance View Component
const PerformanceView = ({ algorithms }: { algorithms: AlgorithmDetail[] }) => {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    return [...algorithms].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      switch (sortField) {
        case 'name':
          return dir * a.name.localeCompare(b.name)
        case 'type':
          return dir * a.family.localeCompare(b.family)
        case 'keygen':
          return (
            dir *
            (getPerformanceMultiplier(a.keyGenCycles) - getPerformanceMultiplier(b.keyGenCycles))
          )
        case 'sign':
          return (
            dir *
            (getPerformanceMultiplier(a.signEncapsCycles) -
              getPerformanceMultiplier(b.signEncapsCycles))
          )
        case 'verify':
          return (
            dir *
            (getPerformanceMultiplier(a.verifyDecapsCycles) -
              getPerformanceMultiplier(b.verifyDecapsCycles))
          )
        case 'ram':
          return dir * (a.stackRAM - b.stackRAM)
        case 'optimization':
          return dir * a.optimizationTarget.localeCompare(b.optimizationTarget)
        default:
          return 0
      }
    })
  }, [algorithms, sortField, sortDir])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="text-muted-foreground/50" />
    return sortDir === 'asc' ? (
      <ArrowUp size={14} className="text-primary" />
    ) : (
      <ArrowDown size={14} className="text-primary" />
    )
  }

  if (algorithms.length === 0) return <EmptyState />

  return (
    <div className="glass-panel overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
              {(
                [
                  ['name', 'Algorithm'],
                  ['type', 'Type'],
                  ['keygen', 'KeyGen'],
                  ['sign', 'Sign/Encaps'],
                  ['verify', 'Verify/Decaps'],
                  ['ram', 'Stack RAM'],
                  ['optimization', 'Optimization'],
                ] as [SortField, string][]
              ).map(([field, label]) => (
                <th key={field} className="p-4 font-semibold">
                  <button
                    onClick={() => handleSort(field)}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    {label}
                    <SortIcon field={field} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sorted.map((algo, index) => {
              const keyGenPerf = getPerformanceCategory(algo.keyGenCycles)
              const signPerf = getPerformanceCategory(algo.signEncapsCycles)
              const verifyPerf = getPerformanceCategory(algo.verifyDecapsCycles)

              return (
                <tr
                  key={`${algo.name}-${index}`}
                  className={clsx(
                    'transition-colors hover:bg-primary/10',
                    index % 2 === 0 ? 'bg-card/50' : 'bg-muted/20'
                  )}
                >
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-foreground">{algo.name}</span>
                      {algo.securityLevel && (
                        <span
                          className={clsx(
                            'text-xs px-2 py-0.5 rounded border w-fit',
                            getSecurityLevelColor(algo.securityLevel)
                          )}
                        >
                          Level {algo.securityLevel}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{algo.family}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={clsx(
                          'text-xs px-2 py-1 rounded border font-medium w-fit',
                          getPerformanceColor(keyGenPerf)
                        )}
                      >
                        {keyGenPerf}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {algo.keyGenCycles}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={clsx(
                          'text-xs px-2 py-1 rounded border font-medium w-fit',
                          getPerformanceColor(signPerf)
                        )}
                      >
                        {signPerf}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {algo.signEncapsCycles}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={clsx(
                          'text-xs px-2 py-1 rounded border font-medium w-fit',
                          getPerformanceColor(verifyPerf)
                        )}
                      >
                        {verifyPerf}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {algo.verifyDecapsCycles}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-mono text-muted-foreground">
                    ~{(algo.stackRAM / 1000).toFixed(1)}KB
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{algo.optimizationTarget}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-border/50">
        {sorted.map((algo, index) => {
          const keyGenPerf = getPerformanceCategory(algo.keyGenCycles)
          const signPerf = getPerformanceCategory(algo.signEncapsCycles)
          const verifyPerf = getPerformanceCategory(algo.verifyDecapsCycles)

          return (
            <div key={`${algo.name}-${index}`} className="p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-semibold text-foreground">{algo.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{algo.family}</span>
                </div>
                {algo.securityLevel && (
                  <span
                    className={clsx(
                      'text-xs px-2 py-0.5 rounded border',
                      getSecurityLevelColor(algo.securityLevel)
                    )}
                  >
                    L{algo.securityLevel}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground block">KeyGen</span>
                  <span
                    className={clsx(
                      'px-1.5 py-0.5 rounded border',
                      getPerformanceColor(keyGenPerf)
                    )}
                  >
                    {keyGenPerf}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Sign/Enc</span>
                  <span
                    className={clsx('px-1.5 py-0.5 rounded border', getPerformanceColor(signPerf))}
                  >
                    {signPerf}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Verify/Dec</span>
                  <span
                    className={clsx(
                      'px-1.5 py-0.5 rounded border',
                      getPerformanceColor(verifyPerf)
                    )}
                  >
                    {verifyPerf}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>RAM: ~{(algo.stackRAM / 1000).toFixed(1)}KB</span>
                <span>{algo.optimizationTarget}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Security View Component
const SecurityView = ({ algorithms }: { algorithms: AlgorithmDetail[] }) => {
  if (algorithms.length === 0) return <EmptyState />

  const groupedByLevel = algorithms.reduce(
    (acc, algo) => {
      const level = algo.securityLevel?.toString() || 'Classical'
      if (level === '__proto__' || level === 'constructor' || level === 'prototype') return acc

      // eslint-disable-next-line security/detect-object-injection
      if (!acc[level]) acc[level] = []
      // eslint-disable-next-line security/detect-object-injection
      acc[level].push(algo)
      return acc
    },
    {} as Record<string, AlgorithmDetail[]>
  )

  return (
    <div className="space-y-6">
      {Object.entries(groupedByLevel)
        .sort(([a], [b]) => {
          if (a === 'Classical') return 1
          if (b === 'Classical') return -1
          return parseInt(a) - parseInt(b)
        })
        .map(([level, algos]) => (
          <div key={level} className="glass-panel p-6">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Shield className="text-primary" size={20} />
              {level === 'Classical' ? (
                'Classical Algorithms'
              ) : (
                <>
                  NIST Security Level {level}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({algos[0]?.aesEquivalent})
                  </span>
                </>
              )}
            </h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {algos.map((algo, index) => (
                <div
                  key={`${algo.name}-${index}`}
                  className="bg-muted/30 border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-semibold text-foreground">{algo.name}</h5>
                    <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30">
                      {algo.family}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Standard:</span>
                      <span className="text-foreground font-mono text-xs">{algo.fipsStandard}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pub Key:</span>
                      <span className="text-foreground font-mono text-xs">
                        {algo.publicKeySize.toLocaleString()} bytes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Priv Key:</span>
                      <span className="text-foreground font-mono text-xs">
                        {algo.privateKeySize.toLocaleString()} bytes
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}

// Sizes View Component
const SizesView = ({ algorithms }: { algorithms: AlgorithmDetail[] }) => {
  if (algorithms.length === 0) return <EmptyState />

  const maxPubKey = Math.max(...algorithms.map((a) => a.publicKeySize))
  const maxPrivKey = Math.max(...algorithms.map((a) => a.privateKeySize))
  const maxSig = Math.max(...algorithms.map((a) => a.signatureCiphertextSize || 0))

  return (
    <div className="glass-panel p-4 md:p-6">
      <div className="space-y-6">
        {algorithms.map((algo, index) => (
          <div
            key={`${algo.name}-${index}`}
            className="border-b border-border/50 last:border-0 pb-6 last:pb-0"
          >
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-semibold text-foreground">{algo.name}</h5>
              <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30">
                {algo.family}
              </span>
            </div>

            <div className="space-y-3">
              {/* Public Key */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Public Key</span>
                  <span className="font-mono text-foreground">
                    {algo.publicKeySize.toLocaleString()} bytes
                  </span>
                </div>
                <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/50 rounded-full"
                    style={{ width: `${(algo.publicKeySize / maxPubKey) * 100}%` }}
                  />
                </div>
              </div>

              {/* Private Key */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Private Key</span>
                  <span className="font-mono text-foreground">
                    {algo.privateKeySize.toLocaleString()} bytes
                  </span>
                </div>
                <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent/50 rounded-full"
                    style={{ width: `${(algo.privateKeySize / maxPrivKey) * 100}%` }}
                  />
                </div>
              </div>

              {/* Signature/Ciphertext */}
              {algo.signatureCiphertextSize && maxSig > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      {algo.family.includes('Sig') ? 'Signature' : 'Ciphertext'}
                    </span>
                    <span className="font-mono text-foreground">
                      {algo.signatureCiphertextSize.toLocaleString()} bytes
                    </span>
                  </div>
                  <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary/50 rounded-full"
                      style={{
                        width: `${(algo.signatureCiphertextSize / maxSig) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Shared Secret */}
              {algo.sharedSecretSize && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shared Secret</span>
                  <span className="font-mono text-foreground">{algo.sharedSecretSize} bytes</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Use Cases View Component
const UseCasesView = ({ algorithms }: { algorithms: AlgorithmDetail[] }) => {
  if (algorithms.length === 0) return <EmptyState />

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 md:p-6">
        <div className="flex items-start gap-3 mb-6 p-4 bg-status-info border border-border rounded-lg">
          <Info className="text-primary flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm">
            <p className="font-semibold mb-1 text-foreground">Global Use Case Recommendations</p>
            <p className="text-muted-foreground">
              These recommendations apply across all industries including finance, healthcare,
              government, telecommunications, IoT, and enterprise applications.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {algorithms.map((algo, index) => (
            <div
              key={`${algo.name}-${index}`}
              className="bg-muted/30 border border-border rounded-lg p-5 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <h5 className="font-semibold text-foreground text-lg">{algo.name}</h5>
                {algo.securityLevel && (
                  <span
                    className={clsx(
                      'text-xs px-2 py-1 rounded border',
                      getSecurityLevelColor(algo.securityLevel)
                    )}
                  >
                    L{algo.securityLevel}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Optimization
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">{algo.optimizationTarget}</p>
                </div>

                {algo.useCaseNotes && (
                  <div>
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      Recommendations
                    </span>
                    <p className="text-sm text-foreground mt-1 leading-relaxed">
                      {algo.useCaseNotes}
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Standard
                  </span>
                  <p className="text-sm text-foreground mt-1 font-mono">{algo.fipsStandard}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
