// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import { ListChecks } from 'lucide-react'
import { getStandard } from '@/data/standardsRegistry'
import {
  SCHEME_FOR_USE_ROWS,
  formatExactCount,
  schemeForUseCapacity,
  schemeForUseParamLabel,
} from '../data/statefulSigsConstants'

// Library rows cited by the section. getStandard() throws at import on an unknown id, so a renamed
// or removed row fails the build instead of leaving a dead link.
const SOURCES = [
  { std: getStandard('NIST SP 800-208'), label: 'NIST SP 800-208' },
  { std: getStandard('RFC 8554'), label: 'RFC 8554' },
  { std: getStandard('RFC 8391'), label: 'RFC 8391' },
  { std: getStandard('NSA CNSA 2.0 FAQ'), label: 'NSA CNSA 2.0 FAQ v2.2' },
]

/**
 * "Which scheme for which use": five uses, one example parameter set each. The number of
 * signatures is computed from the set (2 to the power of its total tree height), never typed.
 * Below 640 px each row is a stacked block so nothing scrolls sideways; from 640 px up it is a
 * table. Only one of the two is displayed at a time, so assistive technology never reads the rows
 * twice.
 */
export const SchemeForUseSection: React.FC = () => {
  const rows = SCHEME_FOR_USE_ROWS.map((row) => ({
    row,
    paramLabel: schemeForUseParamLabel(row),
    capacity: formatExactCount(schemeForUseCapacity(row)),
  }))

  return (
    <section className="glass-panel p-6" data-testid="scheme-for-use">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <ListChecks size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Which scheme for which use</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Each row shows one example parameter set and the number of signatures it can ever make.
          Every signature uses up one one-time key, so that number is a hard limit; estimate what
          your use needs and pick a set that covers it. The record of which keys are used (the
          state) must stay inside the signing hardware module; a device that only verifies keeps
          none.
        </p>

        <ul
          className="space-y-3 text-xs text-muted-foreground sm:hidden"
          data-testid="scheme-stacked"
        >
          {rows.map(({ row, paramLabel, capacity }) => (
            <li key={row.id} className="border-b border-border/50 pb-3">
              <p className="font-bold text-foreground">{row.useCase}</p>
              <dl className="mt-1 space-y-1">
                <div>
                  <dt className="font-semibold text-foreground">Parameter set</dt>
                  <dd>{paramLabel}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">Signatures</dt>
                  <dd className="tabular-nums" data-testid={`scheme-stacked-capacity-${row.id}`}>
                    {capacity}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">State</dt>
                  <dd>{row.state}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">CNSA 2.0</dt>
                  <dd>{row.cnsa}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto sm:block" data-testid="scheme-table">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 pr-3 font-semibold">Use</th>
                <th className="py-2 pr-3 font-semibold">Parameter set</th>
                <th className="py-2 pr-3 font-semibold">Signatures</th>
                <th className="py-2 pr-3 font-semibold">State</th>
                <th className="py-2 font-semibold">CNSA 2.0</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ row, paramLabel, capacity }) => (
                <tr key={row.id} className="border-b border-border/50 align-top">
                  <td className="py-2 pr-3 font-medium text-foreground">{row.useCase}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{paramLabel}</td>
                  <td
                    className="py-2 pr-3 tabular-nums text-muted-foreground"
                    data-testid={`scheme-capacity-${row.id}`}
                  >
                    {capacity}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{row.state}</td>
                  <td className="py-2 text-muted-foreground">{row.cnsa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">
          Sources:{' '}
          {SOURCES.map(({ std, label }, i) => (
            <React.Fragment key={label}>
              {i > 0 ? ', ' : null}
              <Link
                to={std.deepLink}
                className="text-primary hover:underline"
                title={`Open ${std.title} in the library`}
              >
                {label}
              </Link>
            </React.Fragment>
          ))}
          .
        </p>
      </div>
    </section>
  )
}
