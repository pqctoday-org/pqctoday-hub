// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { BarChart2, Info, Zap, AlertTriangle, Building2, Activity } from 'lucide-react'
import {
  BENCHMARK_DATA,
  NETWORK_PROFILE_LABELS,
  ALGORITHM_SET_LABELS,
  PRODUCTION_TLS_KPIS,
  PRODUCTION_VPN_KPIS,
  ENVIRONMENT_SCENARIOS,
  TRAFFIC_PATTERNS,
  type AlgorithmSet,
  type NetworkProfile,
  type EnvironmentScenario,
  type TrafficPattern,
} from '../data/testingConstants'
import { Button } from '@/components/ui/button'

const METRICS = [
  {
    key: 'tlsHandshakeMs',
    label: 'TLS Handshake',
    unit: 'ms',
    maxVal: 1600,
    description: 'Full TLS 1.3 handshake latency (ClientHello → Finished)',
  },
  {
    key: 'saSetupMs',
    label: 'IKEv2 SA Setup',
    unit: 'ms',
    maxVal: 100000,
    description: 'IKEv2 Security Association establishment (4 messages)',
  },
  {
    key: 'certSizeKb',
    label: 'Certificate Size',
    unit: 'KB',
    maxVal: 20,
    description: 'Leaf certificate size (affects ClientHello fragmentation)',
  },
  {
    key: 'clientHelloBytes',
    label: 'ClientHello Size',
    unit: 'B',
    maxVal: 1600,
    description: 'TLS ClientHello byte count (>1400B forces TCP fragmentation)',
  },
] as const

type MetricKey = (typeof METRICS)[number]['key']

const ALG_SETS: AlgorithmSet[] = ['classical', 'hybrid', 'pure-pqc']

const formatVal = (val: number, unit: string) => {
  if (unit === 'ms' && val >= 1000) return `${(val / 1000).toFixed(1)}s`
  if (unit === 'ms') return `${val}ms`
  if (unit === 'KB') return `${val}KB`
  return `${val}B`
}

const formatProductionVal = (val: number, unit: string) => {
  if (unit === 'ms') return val >= 1000 ? `${(val / 1000).toFixed(1)}s` : `${val.toFixed(1)}ms`
  if (val >= 10000) return `${(val / 1000).toFixed(1)}K`
  if (val >= 1000) return `${(val / 1000).toFixed(2)}K`
  return val.toFixed(val < 10 ? 2 : 0)
}

const barWidth = (val: number, maxVal: number) => Math.min(100, (val / maxVal) * 100)

const ALG_BAR_COLORS: Record<AlgorithmSet, string> = {
  classical: 'bg-status-warning',
  hybrid: 'bg-status-info',
  'pure-pqc': 'bg-status-success',
}

export const PerformanceBenchmarkDesigner: React.FC = () => {
  const [networkProfile, setNetworkProfile] = useState<NetworkProfile>('wan')
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('tlsHandshakeMs')
  const [showInsight, setShowInsight] = useState(false)
  const [envScenario, setEnvScenario] = useState<EnvironmentScenario>('clean-path')
  const [trafficPattern, setTrafficPattern] = useState<TrafficPattern>('steady-state')

  const metric = METRICS.find((m) => m.key === selectedMetric)!

  return (
    <div className="space-y-6">
      {/* Tool banner */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <BarChart2 size={16} className="text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Simulating:</span> VIAVI TeraVM + PQC-LEO
          benchmark data. Configure a network profile and metric to compare Classical vs Hybrid PQC
          vs Pure PQC performance overhead.
        </p>
      </div>

      {/* Network profile selector */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">Network Profile:</span>
        <div className="grid sm:grid-cols-3 gap-2">
          {(
            Object.entries(NETWORK_PROFILE_LABELS) as [
              NetworkProfile,
              (typeof NETWORK_PROFILE_LABELS)[NetworkProfile],
            ][]
          ).map(([id, info]) => (
            <Button
              variant="ghost"
              key={id}
              onClick={() => setNetworkProfile(id)}
              className={`text-left p-3 rounded-lg border transition-all ${
                networkProfile === id
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-muted/30 border-border hover:border-border/80'
              }`}
            >
              <div className="font-semibold text-xs text-foreground mb-0.5">{info.label}</div>
              <div className="text-xs text-muted-foreground">{info.description}</div>
            </Button>
          ))}
        </div>
      </div>

      {/* Metric selector */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">Measurement Metric:</span>
        <div className="flex flex-wrap gap-2">
          {METRICS.map((m) => (
            <Button
              variant="ghost"
              key={m.key}
              onClick={() => setSelectedMetric(m.key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selectedMetric === m.key
                  ? 'bg-primary text-primary-foreground border-primary font-semibold'
                  : 'bg-background/60 text-muted-foreground border-border hover:border-primary/50'
              }`}
            >
              {m.label}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground pl-1">{metric.description}</p>
      </div>

      {/* Bar chart comparison */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          {metric.label} — {NETWORK_PROFILE_LABELS[networkProfile].label}
        </h3>

        {ALG_SETS.map((alg) => {
          const data = BENCHMARK_DATA[alg][networkProfile]
          const raw = data[selectedMetric] as number
          const pct = barWidth(raw, metric.maxVal)
          const info = ALGORITHM_SET_LABELS[alg]

          return (
            <div key={alg} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className={`font-semibold ${info.color}`}>{info.label}</span>
                  <span className="text-muted-foreground ml-2">{info.description}</span>
                </div>
                <span className={`font-mono font-bold tabular-nums ${info.color}`}>
                  {formatVal(raw, metric.unit)}
                </span>
              </div>
              <div className="h-6 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${ALG_BAR_COLORS[alg]} transition-all duration-700 flex items-center px-2`}
                  style={{ width: `${pct}%` }}
                >
                  {pct > 20 && (
                    <span className="text-xs text-primary-foreground font-semibold">
                      {formatVal(raw, metric.unit)}
                    </span>
                  )}
                </div>
              </div>
              {/* Fragmentation warning */}
              {data.fragmentation &&
                (selectedMetric === 'clientHelloBytes' || selectedMetric === 'certSizeKb') && (
                  <div className="flex items-center gap-1.5 text-xs text-status-warning">
                    <AlertTriangle size={11} />
                    TCP fragmentation occurs — adds 1 extra RTT (
                    {NETWORK_PROFILE_LABELS[networkProfile].rttMs}ms) to handshake
                  </div>
                )}
            </div>
          )
        })}
      </div>

      {/* Key insights panel */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          onClick={() => setShowInsight(!showInsight)}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <Info size={14} />
          {showInsight ? 'Hide' : 'Show'} key insights for this profile
        </Button>

        {showInsight && (
          <div className="p-4 rounded-lg bg-muted border border-border space-y-3">
            <Insight
              label="TCP-to-TLS overhead dominates"
              text={`The TLS handshake adds ${NETWORK_PROFILE_LABELS[networkProfile].rttMs * 6}ms of RTT overhead on top of ${NETWORK_PROFILE_LABELS[networkProfile].rttMs}ms network RTT — crypto cost is usually <5% of total. PQC's main impact is byte size, not computation.`}
            />
            {selectedMetric === 'saSetupMs' && networkProfile === 'wan' && (
              <Insight
                label="IKEv2 pure-PQC cliff"
                text={`IKEv2 SA setup rises from 240ms (classical) to 12,626ms (pure PQC) on WAN — a 53× increase. Hybrid stays at 380ms (1.6×). This drives VIAVI TeraVM's recommendation to test hybrid-first before attempting pure-PQC VPN deployments.`}
              />
            )}
            {selectedMetric === 'saSetupMs' && networkProfile === 'satellite' && (
              <Insight
                label="Satellite pure-PQC renders VPN unusable"
                text="Pure PQC SA setup exceeds 95 seconds on satellite links — effectively breaking site-to-site VPN. Hybrid stays at 7.2 seconds. For satellite links, defer pure-PQC IPSec until NIST-standard hybrid IKEv2 is mature."
              />
            )}
            {networkProfile === 'lan' && (
              <Insight
                label="LAN overhead is negligible"
                text="On LAN/datacenter, hybrid PQC adds ≤25% overhead vs classical. Pure PQC adds ≤50%. Both are below the perceptible threshold for most workloads — LAN is the safest environment to enable PQC first."
              />
            )}
            <Insight
              label="Fragmentation adds hidden latency"
              text={`When ClientHello exceeds ~1400 bytes (TCP MTU), TCP fragmentation adds exactly 1 RTT (${NETWORK_PROFILE_LABELS[networkProfile].rttMs}ms). Pure PQC ClientHellos (1,536B) and composite certificates (17KB) both trigger this. Plan for MTU tuning or QUIC migration.`}
            />
          </div>
        )}
      </div>

      {/* Throughput comparison */}
      <div className="p-3 rounded-lg bg-muted border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={13} className="text-primary" />
          <span className="text-xs font-semibold text-foreground">Sustained Throughput Impact</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
          {ALG_SETS.map((alg) => {
            const pct = BENCHMARK_DATA[alg][networkProfile].throughputPct
            const info = ALGORITHM_SET_LABELS[alg]
            return (
              <div key={alg}>
                <div className={`text-xl font-bold tabular-nums ${info.color}`}>{pct}%</div>
                <div className="text-muted-foreground">{info.label}</div>
                <div className="text-muted-foreground text-[10px]">of classical</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── Production-Scale KPIs (VIAVI TeraVM) ─────────────────────── */}
      <div className="pt-4 border-t border-border space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-status-warning/5 border border-status-warning/20">
          <Activity size={16} className="text-status-warning mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Production-Scale KPIs:</span> Real-world
            benchmarks from VIAVI TeraVM on Dell R6625 hardware — 1.6M emulated users, HAProxy TLS +
            Strongswan IKEv2. Adjust environment and traffic pattern to model enterprise conditions.
          </p>
        </div>

        {/* Environment scenario selector */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground flex items-center gap-2">
            <Building2 size={14} className="text-muted-foreground" />
            Network Environment:
          </span>
          <div className="grid sm:grid-cols-3 gap-2">
            {(
              Object.entries(ENVIRONMENT_SCENARIOS) as [
                EnvironmentScenario,
                (typeof ENVIRONMENT_SCENARIOS)[EnvironmentScenario],
              ][]
            ).map(([id, info]) => (
              <Button
                variant="ghost"
                key={id}
                onClick={() => setEnvScenario(id)}
                className={`text-left p-3 rounded-lg border transition-all h-auto ${
                  envScenario === id
                    ? 'bg-primary/10 border-primary/40'
                    : 'bg-muted/30 border-border hover:border-border/80'
                }`}
              >
                <div className="font-semibold text-xs text-foreground mb-0.5">{info.label}</div>
                <div className="text-xs text-muted-foreground whitespace-normal">
                  {id === 'ngfw-inspection'
                    ? '2× crypto overhead per hop'
                    : id === 'multi-hop-proxy'
                      ? '3× crypto overhead (NGFW+SGW+DLP)'
                      : 'Baseline — no middlebox overhead'}
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Traffic pattern selector */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground flex items-center gap-2">
            <Activity size={14} className="text-muted-foreground" />
            Traffic Pattern:
          </span>
          <div className="grid sm:grid-cols-3 gap-2">
            {(
              Object.entries(TRAFFIC_PATTERNS) as [
                TrafficPattern,
                (typeof TRAFFIC_PATTERNS)[TrafficPattern],
              ][]
            ).map(([id, info]) => (
              <Button
                variant="ghost"
                key={id}
                onClick={() => setTrafficPattern(id)}
                className={`text-left p-3 rounded-lg border transition-all h-auto ${
                  trafficPattern === id
                    ? 'bg-primary/10 border-primary/40'
                    : 'bg-muted/30 border-border hover:border-border/80'
                }`}
              >
                <div className="font-semibold text-xs text-foreground mb-0.5">{info.label}</div>
                <div className="text-xs text-muted-foreground whitespace-normal">
                  {id === 'burst-login-storm'
                    ? '5× connection spike'
                    : id === 'microservice-chatter'
                      ? '10× connection multiplier'
                      : 'Persistent connections'}
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* TLS KPI table */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            HTTP + TLS KPIs — {ENVIRONMENT_SCENARIOS[envScenario].label}
            {trafficPattern !== 'steady-state' &&
              ` × ${TRAFFIC_PATTERNS[trafficPattern].label}`}
          </h3>
          <div className="space-y-2">
            {PRODUCTION_TLS_KPIS.map((kpi) => {
              const envMul = ENVIRONMENT_SCENARIOS[envScenario].overheadMultiplier
              const trafMul = TRAFFIC_PATTERNS[trafficPattern].connectionMultiplier
              const isLatency = kpi.unit === 'ms'
              // Latency metrics scale with environment multiplier and traffic pattern
              // Rate metrics scale inversely with environment multiplier
              const adjustedClassical = isLatency
                ? kpi.classical * envMul
                : kpi.classical / envMul / trafMul
              const adjustedHybrid = isLatency
                ? kpi.hybrid * envMul
                : kpi.hybrid / envMul / trafMul

              const maxBar = isLatency
                ? Math.max(adjustedHybrid, 1)
                : Math.max(adjustedClassical, 1)

              return (
                <div key={kpi.label} className="p-2 rounded bg-muted/50">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-foreground">{kpi.label}</span>
                    <span className="text-[10px] text-muted-foreground">{kpi.unit}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-status-warning w-14 shrink-0">
                        Classical
                      </span>
                      <div className="flex-1 h-4 bg-background rounded overflow-hidden">
                        <div
                          className="h-full bg-status-warning transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (adjustedClassical / maxBar) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-foreground w-20 text-right tabular-nums">
                        {formatProductionVal(adjustedClassical, kpi.unit)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-status-info w-14 shrink-0">Hybrid</span>
                      <div className="flex-1 h-4 bg-background rounded overflow-hidden">
                        <div
                          className="h-full bg-status-info transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (adjustedHybrid / maxBar) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-foreground w-20 text-right tabular-nums">
                        {formatProductionVal(adjustedHybrid, kpi.unit)}
                      </span>
                    </div>
                  </div>
                  {envScenario === 'clean-path' && trafficPattern === 'steady-state' && (
                    <div className="text-[10px] text-muted-foreground mt-1 text-right">
                      Baseline: {kpi.deltaLabel}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* VPN KPI table */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            IKEv2 IPSec VPN KPIs — {ENVIRONMENT_SCENARIOS[envScenario].label}
          </h3>
          <div className="space-y-2">
            {PRODUCTION_VPN_KPIS.map((kpi) => {
              const envMul = ENVIRONMENT_SCENARIOS[envScenario].overheadMultiplier
              const isLatency = kpi.unit === 'ms'
              const adjustedClassical = isLatency
                ? kpi.classical * envMul
                : kpi.classical / envMul
              const adjustedHybrid = isLatency ? kpi.hybrid * envMul : kpi.hybrid / envMul
              const maxBar = isLatency
                ? Math.max(adjustedHybrid, 1)
                : Math.max(adjustedClassical, 1)

              return (
                <div key={kpi.label} className="p-2 rounded bg-muted/50">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-medium text-foreground">{kpi.label}</span>
                    <span className="text-[10px] text-muted-foreground">{kpi.unit}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-status-warning w-14 shrink-0">
                        Classical
                      </span>
                      <div className="flex-1 h-4 bg-background rounded overflow-hidden">
                        <div
                          className="h-full bg-status-warning transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (adjustedClassical / maxBar) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-foreground w-20 text-right tabular-nums">
                        {formatProductionVal(adjustedClassical, kpi.unit)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-status-info w-14 shrink-0">Hybrid</span>
                      <div className="flex-1 h-4 bg-background rounded overflow-hidden">
                        <div
                          className="h-full bg-status-info transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (adjustedHybrid / maxBar) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-foreground w-20 text-right tabular-nums">
                        {formatProductionVal(adjustedHybrid, kpi.unit)}
                      </span>
                    </div>
                  </div>
                  {envScenario === 'clean-path' && (
                    <div className="text-[10px] text-muted-foreground mt-1 text-right">
                      Baseline: {kpi.deltaLabel}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Environment impact callout */}
        {envScenario !== 'clean-path' && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-status-warning/10 border border-status-warning/30">
            <AlertTriangle size={14} className="text-status-warning mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {ENVIRONMENT_SCENARIOS[envScenario].label}:
              </span>{' '}
              {ENVIRONMENT_SCENARIOS[envScenario].description}
            </p>
          </div>
        )}
        {trafficPattern !== 'steady-state' && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-status-info/10 border border-status-info/30">
            <Activity size={14} className="text-status-info mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {TRAFFIC_PATTERNS[trafficPattern].label}:
              </span>{' '}
              {TRAFFIC_PATTERNS[trafficPattern].description}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const Insight: React.FC<{ label: string; text: string }> = ({ label, text }) => (
  <div>
    <p className="text-xs font-semibold text-foreground mb-0.5">{label}</p>
    <p className="text-xs text-muted-foreground">{text}</p>
  </div>
)
