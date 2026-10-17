// SPDX-License-Identifier: AGPL-3.0-only
import { Cpu, ExternalLink } from 'lucide-react'
import { Link } from 'react-router'
import {
  BENCH_0927_NOTE,
  KV260_FPGA_ROWS,
  SIGN_BENCH_0927,
} from '@/components/PKILearning/modules/PQCHardwareAcceleration/data/measurements'

const LEARNING_ROWS = SIGN_BENCH_0927.filter((row) =>
  ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87', 'SLH-DSA-SHAKE-128s', 'SLH-DSA-SHAKE-256s'].includes(
    row.algorithm
  )
)

/**
 * A deliberately bounded performance example. It reuses the reviewed
 * measurement record from the hardware-acceleration module instead of
 * turning heterogeneous catalogue estimates into an ordinal ranking.
 */
export function HardwareBenchmarkEvidence() {
  return (
    <details className="rounded-lg border border-primary/25 bg-primary/5">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-semibold text-foreground">
        <Cpu size={16} className="text-primary" aria-hidden="true" />
        Measured hardware case study: signing throughput
      </summary>
      <div className="border-t border-primary/20 p-3">
        <p className="text-xs leading-relaxed text-muted-foreground">{BENCH_0927_NOTE}</p>
        <p className="mt-2 text-xs leading-relaxed text-foreground/85">
          Compare values within this table only. These are four-worker PKCS#11 signing results—not
          key generation, verification, encapsulation, or a promise about another product. The
          highlighted KV260 SLH-DSA-SHAKE rows used FPGA fabric; its ML-DSA rows used Arm software.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-xs">
            <caption className="sr-only">
              PQC Today signing throughput measured with one shared engine and harness on three
              platforms, 27 September 2026
            </caption>
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="px-2 py-2 font-semibold">Algorithm / parameter set</th>
                <th className="px-2 py-2 text-right font-semibold">M4 Pro</th>
                <th className="px-2 py-2 text-right font-semibold">i.MX 95</th>
                <th className="px-2 py-2 text-right font-semibold">KV260</th>
                <th className="px-2 py-2 font-semibold">KV260 path</th>
              </tr>
            </thead>
            <tbody>
              {LEARNING_ROWS.map((row) => {
                const fpga = KV260_FPGA_ROWS.includes(row.algorithm)
                return (
                  <tr key={row.algorithm} className="border-b border-border/60 last:border-0">
                    <th scope="row" className="px-2 py-2 font-medium text-foreground">
                      {row.algorithm}
                    </th>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {row.ops.m4pro.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {row.ops.mx95.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {row.ops.kv260.toLocaleString()}
                    </td>
                    <td className="px-2 py-2">{fpga ? 'FPGA' : 'Arm CPU'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Values are signing operations/second.
        </p>
        <Link
          to="/learn/pqc-hw-acceleration"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Study the full hardware-acceleration evidence and limitations
          <ExternalLink size={11} aria-hidden="true" />
        </Link>
      </div>
    </details>
  )
}
