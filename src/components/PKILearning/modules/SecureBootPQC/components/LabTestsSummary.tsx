// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { LAB_TESTS_SUMMARY_ROWS } from '../data/labTestsSummaryRows'

/**
 * Three-row summary at the top of "What the lab tests". Below 640 px each row is a stacked
 * block (case, expectation, where it is quoted) so nothing scrolls sideways; from 640 px up it
 * is a table. Only one of the two is displayed at a time, so assistive technology never reads
 * the rows twice.
 */
export const LabTestsSummary: React.FC = () => (
  <div className="space-y-2" data-testid="lab-tests-summary">
    <ul
      className="space-y-3 text-xs text-muted-foreground sm:hidden"
      data-testid="lab-summary-stacked"
    >
      {LAB_TESTS_SUMMARY_ROWS.map((row) => (
        <li key={row.id} className="border-b border-border/50 pb-3">
          <p className="font-bold text-foreground">{row.who}</p>
          <p className="mt-1">{row.expects}</p>
          <p className="mt-1 text-[10px]">Quoted in: {row.quoted}</p>
        </li>
      ))}
    </ul>
    <div className="hidden overflow-x-auto sm:block" data-testid="lab-summary-table">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="py-2 pr-3 font-semibold">Case</th>
            <th className="py-2 pr-3 font-semibold">What the NSA expects</th>
            <th className="py-2 font-semibold">Quoted in</th>
          </tr>
        </thead>
        <tbody>
          {LAB_TESTS_SUMMARY_ROWS.map((row) => (
            <tr key={row.id} className="border-b border-border/50 align-top">
              <td className="py-2 pr-3 font-medium text-foreground">{row.who}</td>
              <td className="py-2 pr-3 text-muted-foreground">{row.expects}</td>
              <td className="py-2 text-muted-foreground">{row.quoted}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="text-xs text-muted-foreground">
      A signer that is not an NSS, such as a commercial vendor&apos;s build environment: the NSA
      validates only that the verification code on the device passes CAVP.
    </p>
  </div>
)
