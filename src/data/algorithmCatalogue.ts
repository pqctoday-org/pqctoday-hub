// SPDX-License-Identifier: AGPL-3.0-only
import { loadLatestCSV } from './csvUtils'

/** The same latest dated source used by the async Algorithms loader. */
export const algorithmCatalogue = loadLatestCSV<Record<string, string>, Record<string, string>>(
  import.meta.glob('./pqc_complete_algorithm_reference_*.csv', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
  /pqc_complete_algorithm_reference_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => row
).data
