// SPDX-License-Identifier: AGPL-3.0-only
import { useMemo } from 'react'
import {
  CRQC_DRIVERS,
  CRQC_DRIVER_MILESTONES,
  CRQC_MODALITY_TRACKS,
  CURRENT_QUANTUM_COMPUTERS,
} from '@/components/PKILearning/modules/QuantumThreats/data/quantumConstants'

const AXES = [
  'Hardware',
  'Algorithms',
  'Error correction',
  'Noise reduction',
  'AI / ML',
  'HPC / architecture',
] as const

/** Evidence-led CRQC progress view. Demonstrations and roadmaps stay separate. */
export const CrqcTrajectoryChart: React.FC = () => {
  const descriptions = useMemo(
    () => new Map(CRQC_DRIVERS.map((driver) => [driver.category, driver.layman])),
    []
  )
  const milestones = useMemo(() => {
    const map = new Map<string, typeof CRQC_DRIVER_MILESTONES>()
    for (const item of CRQC_DRIVER_MILESTONES)
      map.set(item.axis, [...(map.get(item.axis) ?? []), item])
    return map
  }, [])
  const demonstrations = useMemo(
    () =>
      [...CURRENT_QUANTUM_COMPUTERS]
        .filter((machine) => machine.estimatedLogicalQubits > 0)
        .sort((a, b) => b.year - a.year || b.estimatedLogicalQubits - a.estimatedLogicalQubits),
    []
  )

  return (
    <section
      className="rounded-lg border border-border bg-muted/20 p-3"
      aria-labelledby="crqc-trajectory-heading"
      data-testid="crqc-trajectory-chart"
    >
      <h3 id="crqc-trajectory-heading" className="text-sm font-bold text-foreground">
        CRQC progress evidence
      </h3>
      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
        These are discrete demonstrations and disclosed roadmaps—not a trajectory to Q-Day.
        Logical-qubit counts are not directly comparable unless code distance, error rate,
        operations and runtime are also comparable. No percentage or arrival date is inferred.
      </p>

      <div className="mt-3">
        <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Recorded demonstrations in this curated list
        </h4>
        <ul className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {demonstrations.map((machine) => (
            <li
              key={`${machine.vendor}-${machine.name}`}
              className="rounded-md border border-border bg-background/40 p-2.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {machine.vendor} {machine.name}
                </span>
                <span className="shrink-0 text-[10px] font-medium text-primary">
                  {machine.year} · {machine.estimatedLogicalQubits} recorded LQ
                </span>
              </div>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{machine.notes}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Technology tracks · progress and challenge to scale
        </h4>
        <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CRQC_MODALITY_TRACKS.map((track) => (
            <div
              key={track.technology}
              className="rounded-md border border-border bg-background/40 p-2.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">{track.technology}</span>
                <span className="shrink-0 text-[10px] font-medium text-primary">
                  {track.bestLogical > 0
                    ? `${track.bestLogical} recorded LQ`
                    : 'No logical demonstration listed'}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground">{track.vendors}</div>
              <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
                <span className="font-semibold text-success">Recent progress: </span>
                {track.recentProgress}
              </p>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                <span className="font-semibold text-warning">Challenge to scale: </span>
                {track.scaleChallenge}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Contributing factors · demonstrated milestones and roadmaps
        </h4>
        <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {AXES.map((axis) => (
            <div key={axis} className="rounded-md border border-border bg-background/40 p-2.5">
              <span className="text-xs font-semibold text-foreground">{axis}</span>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                {descriptions.get(axis)}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {(milestones.get(axis) ?? []).map((item) => (
                  <span
                    key={`${axis}-${item.year}-${item.short}`}
                    title={item.label}
                    className="rounded border border-border px-1.5 py-0.5 text-[9px] text-muted-foreground"
                  >
                    <span className="font-medium text-foreground">{item.year}</span> {item.short} ·{' '}
                    {item.forecast ? 'roadmap' : 'demonstrated'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
