// SPDX-License-Identifier: AGPL-3.0-only
/**
 * A small slice of the real Library catalogue (46 rows copied from the
 * published CSV, `libraryCorpus.csv`) for tests that render the whole Library
 * view. The full catalogue is ~1,500 active rows; rendering all of them per
 * test cost 30-120 s and pushed one worker past 3.5 GB of heap, with no extra
 * coverage: these tests assert on structure and routing, not on row counts.
 *
 * The slice is chosen so every case the Library view tests need still exists:
 *  - each of the 13 categories, and each of the six lifecycle labels;
 *  - the seven Certification starter-set documents (all of them: one test
 *    asserts the full set is listed);
 *  - NIST rows in several categories, a KEM row, and the Korean competition
 *    row (a "Builds on" parent whose dependencies resolve inside the slice);
 *  - a retired row (`PKCS11-V32-OASIS`) next to its successor
 *    (`PKCS11-V32-OS-OASIS`), for the forwarding notice;
 *  - rows that community leaders cite as a key resource (`FIPS 203`,
 *    `BIKE-Round4-Spec-2022`, `NIST IR 8413`);
 *  - the education and planning purposes, and a row tagged `cryptanalysis`.
 *
 * Usage, at the top of a test file (the mock is hoisted above the imports):
 *
 *   vi.mock('@/data/csvUtils', async (importOriginal) =>
 *     (await import('@/test/fixtures/libraryCorpus')).withLibraryCorpusSlice(await importOriginal())
 *   )
 *
 * Only the library CSV is swapped; the real loader, row transform, succession
 * links, dependency tree and lookups all run over the slice.
 */
import libraryCorpusCsv from './libraryCorpus.csv?raw'

const LIBRARY_CSV_KEY = /library_\d{8}[^/]*\.csv$/

type CsvUtils = typeof import('@/data/csvUtils')

export function withLibraryCorpusSlice(actual: CsvUtils): CsvUtils {
  const loadLatestCSV: CsvUtils['loadLatestCSV'] = (modules, ...rest) =>
    actual.loadLatestCSV(
      Object.keys(modules).some((key) => LIBRARY_CSV_KEY.test(key))
        ? { './library_11152026.csv': libraryCorpusCsv }
        : modules,
      ...rest
    )
  return { ...actual, loadLatestCSV }
}
