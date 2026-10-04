// SPDX-License-Identifier: GPL-3.0-only
/**
 * Chunk-graph walk used by check-production.ts: find the lazy-loaded About chunk of a deployed
 * build by following chunk references from the entry chunk.
 *
 * Two things this walk must never do (both happened with the 4.149.0 deploy, whose post-deploy
 * SBOM check failed although the site was fine):
 *
 *  1. Read ordinary text as a chunk name. The entry chunk carries the whole catalog as strings,
 *     and a catalog note naming "orphaned-cavp-verdicts-09262026.json" matched a loose
 *     "<name>-<8 chars>.js" pattern (as ".../verdicts-09262026.js", the start of ".json").
 *     A reference now has to be written the way the bundler writes one (see CHUNK_REF).
 *  2. Let one unreachable candidate hide the answer. The old walk fetched twelve names at a time
 *     with Promise.all, so a single 404 rejected the whole batch, including the real route chunk
 *     in it. Fetches here are independent; a chunk that cannot be fetched is recorded and
 *     reported when the About chunk is not found, and the walk carries on.
 *
 * What is NOT relaxed: if the About chunk is missing, or cannot be reached through chunks that do
 * load, the walk returns nothing and the check fails.
 */

/**
 * A chunk reference as Vite writes one:
 *   - `"./Name-Hash.js"`      dynamic `import()` and static `from"./…"`
 *   - `"assets/Name-Hash.js"` the preload map (`__vite__mapDeps`); `"/assets/…"` too
 * The hash is 8 base64url characters, and the name may not continue after `.js` (so a `.json`
 * or `.jsx` file name is not a chunk).
 */
const CHUNK_REF =
  /["'`](?:\.\/|\/?assets\/)([A-Za-z0-9_.-]+-[A-Za-z0-9_-]{8}\.js)(?![A-Za-z0-9_.-])/g

/** Every chunk file name referenced (in bundler form) by one chunk's source text. */
export function chunkReferences(text: string): string[] {
  const out = new Set<string>()
  for (const m of text.matchAll(CHUNK_REF)) out.add(m[1])
  return [...out]
}

export interface AboutChunkSearch {
  /** File name of the About chunk (no directory), when a loadable chunk references it. */
  about?: string
  /** Referenced chunks that could not be fetched, with the reason. Context for a failure. */
  unreachable: { name: string; reason: string }[]
}

/**
 * Breadth-first walk from the entry chunk, `batch` fetches at a time. `fetchText` returns the
 * chunk's source for a file name and rejects when it cannot (HTTP error, network). The entry
 * chunk itself must load; any other chunk that does not is recorded in `unreachable`.
 */
export async function findAboutChunk(
  entry: string,
  fetchText: (chunkFile: string) => Promise<string>,
  batch = 12
): Promise<AboutChunkSearch> {
  type Fetched = { file: string; text: string } | { file: string; error: unknown }
  const entryFile = entry.replace(/^\/?assets\//, '')
  const seen = new Set<string>([entryFile])
  const unreachable: AboutChunkSearch['unreachable'] = []
  let frontier = [entryFile]
  while (frontier.length) {
    const next: string[] = []
    for (let i = 0; i < frontier.length; i += batch) {
      // Each fetch settles on its own: one failure never rejects the rest of the batch.
      const fetched: Fetched[] = await Promise.all(
        frontier.slice(i, i + batch).map(async (file): Promise<Fetched> => {
          try {
            return { file, text: await fetchText(file) }
          } catch (error) {
            return { file, error }
          }
        })
      )
      for (const f of fetched) {
        if ('error' in f) {
          if (f.file === entryFile) throw f.error
          unreachable.push({
            name: f.file,
            reason: f.error instanceof Error ? f.error.message : String(f.error),
          })
          continue
        }
        const refs = chunkReferences(f.text)
        const about = refs.find((r) => r.startsWith('AboutView-'))
        if (about) return { about, unreachable }
        for (const r of refs)
          if (!seen.has(r)) {
            seen.add(r)
            next.push(r)
          }
      }
    }
    frontier = next
  }
  return { unreachable }
}
