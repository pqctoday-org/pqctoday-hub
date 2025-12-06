import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  loadPQCAlgorithmsData,
  type AlgorithmDetail,
  isPQC,
  getPerformanceCategory,
  getPerformanceColor,
  getSecurityLevelColor,
} from '../../data/pqcAlgorithmsData'
import { Shield, Zap, HardDrive, TrendingUp, Filter, BarChart3, Info } from 'lucide-react'
import clsx from 'clsx'

type TabType = 'performance' | 'security' | 'sizes' | 'usecases'

export const AlgorithmDetailedComparison = () => {
  const [algorithms, setAlgorithms] = useState<AlgorithmDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('performance')
  const [filterType, setFilterType] = useState<'all' | 'pqc' | 'classical'>('pqc')
  const [filterSecurityLevel, setFilterSecurityLevel] = useState<number | 'all'>('all')

  // Load data on mount
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

  // Filter algorithms
  const filteredAlgorithms = algorithms.filter((algo) => {
    if (filterType === 'pqc' && !isPQC(algo)) return false
    if (filterType === 'classical' && isPQC(algo)) return false
    if (filterSecurityLevel !== 'all' && algo.securityLevel !== filterSecurityLevel) return false
    return true
  })

  const tabs = [
    { id: 'performance' as TabType, label: 'Performance', icon: Zap },
    { id: 'security' as TabType, label: 'Security Levels', icon: Shield },
    { id: 'sizes' as TabType, label: 'Size Comparison', icon: HardDrive },
    { id: 'usecases' as TabType, label: 'Use Cases', icon: TrendingUp },
  ]

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="text-primary" />
          Detailed Algorithm Comparison
        </h3>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filters:</span>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="type-filter" className="text-sm text-muted-foreground">
              Type:
            </label>
            <select
              id="type-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'pqc' | 'classical')}
              className="bg-black/20 border border-white/10 rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
            >
              <option value="all">All Algorithms</option>
              <option value="pqc">PQC Only</option>
              <option value="classical">Classical Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="security-filter" className="text-sm text-muted-foreground">
              Security Level:
            </label>
            <select
              id="security-filter"
              value={filterSecurityLevel}
              onChange={(e) =>
                setFilterSecurityLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value))
              }
              className="bg-black/20 border border-white/10 rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50"
            >
              <option value="all">All Levels</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
              <option value="4">Level 4</option>
              <option value="5">Level 5</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-muted-foreground">
            Showing {filteredAlgorithms.length} of {algorithms.length} algorithms
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'performance' && <PerformanceView algorithms={filteredAlgorithms} />}
        {activeTab === 'security' && <SecurityView algorithms={filteredAlgorithms} />}
        {activeTab === 'sizes' && <SizesView algorithms={filteredAlgorithms} />}
        {activeTab === 'usecases' && <UseCasesView algorithms={filteredAlgorithms} />}
      </motion.div>
    </div>
  )
}

// Performance View Component
const PerformanceView = ({ algorithms }: { algorithms: AlgorithmDetail[] }) => {
  return (
    <div className="glass-panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/10 text-muted-foreground text-xs uppercase tracking-wider border-b border-white/10">
              <th className="p-4 font-bold">Algorithm</th>
              <th className="p-4 font-bold">Type</th>
              <th className="p-4 font-bold">KeyGen</th>
              <th className="p-4 font-bold">Sign/Encaps</th>
              <th className="p-4 font-bold">Verify/Decaps</th>
              <th className="p-4 font-bold">Stack RAM</th>
              <th className="p-4 font-bold">Optimization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {algorithms.map((algo, index) => {
              const keyGenPerf = getPerformanceCategory(algo.keyGenCycles)
              const signPerf = getPerformanceCategory(algo.signEncapsCycles)
              const verifyPerf = getPerformanceCategory(algo.verifyDecapsCycles)

              return (
                <tr
                  key={`${algo.name}-${index}`}
                  className={clsx(
                    'transition-colors hover:bg-primary/10',
                    index % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-700/50'
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
    </div>
  )
}

// Security View Component
const SecurityView = ({ algorithms }: { algorithms: AlgorithmDetail[] }) => {
  const groupedByLevel = algorithms.reduce(
    (acc, algo) => {
      const level = algo.securityLevel?.toString() || 'Classical'
      if (!acc[level]) acc[level] = []
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
                  className="bg-black/20 border border-white/10 rounded-lg p-4 hover:border-primary/50 transition-colors"
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
                        {algo.publicKeySize} bytes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Priv Key:</span>
                      <span className="text-foreground font-mono text-xs">
                        {algo.privateKeySize} bytes
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
  const maxPubKey = Math.max(...algorithms.map((a) => a.publicKeySize))
  const maxPrivKey = Math.max(...algorithms.map((a) => a.privateKeySize))
  const maxSig = Math.max(...algorithms.map((a) => a.signatureCiphertextSize || 0))

  return (
    <div className="glass-panel p-6">
      <div className="space-y-6">
        {algorithms.map((algo, index) => (
          <div
            key={`${algo.name}-${index}`}
            className="border-b border-white/5 last:border-0 pb-6 last:pb-0"
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
                  <span className="font-mono text-foreground">{algo.publicKeySize} bytes</span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500/50"
                    style={{ width: `${(algo.publicKeySize / maxPubKey) * 100}%` }}
                  />
                </div>
              </div>

              {/* Private Key */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Private Key</span>
                  <span className="font-mono text-foreground">{algo.privateKeySize} bytes</span>
                </div>
                <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500/50"
                    style={{ width: `${(algo.privateKeySize / maxPrivKey) * 100}%` }}
                  />
                </div>
              </div>

              {/* Signature/Ciphertext */}
              {algo.signatureCiphertextSize && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      {algo.family.includes('Sig') ? 'Signature' : 'Ciphertext'}
                    </span>
                    <span className="font-mono text-foreground">
                      {algo.signatureCiphertextSize} bytes
                    </span>
                  </div>
                  <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500/50"
                      style={{
                        width: `${(algo.signatureCiphertextSize / maxSig) * 100}%`,
                      }}
                    />
                  </div>
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
  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <div className="flex items-start gap-3 mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <Info className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-200">
            <p className="font-semibold mb-1">Global Use Case Recommendations</p>
            <p className="text-blue-300/80">
              These recommendations apply across all industries including finance, healthcare,
              government, telecommunications, IoT, and enterprise applications.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {algorithms.map((algo, index) => (
            <div
              key={`${algo.name}-${index}`}
              className="bg-black/20 border border-white/10 rounded-lg p-5 hover:border-primary/50 transition-colors"
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

                <div className="pt-3 border-t border-white/10">
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
