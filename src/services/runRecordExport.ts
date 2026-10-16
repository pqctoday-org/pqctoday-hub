// SPDX-License-Identifier: GPL-3.0-only
/**
 * JSON download of a run manifest (`runManifest.ts`), shared by the tools that
 * offer "Download run record (JSON)".
 *
 * The file is the manifest itself with the site's education notice as its
 * first field, the same convention other JSON downloads on the site follow
 * (a `notice` field that leads the object), so the status travels with the
 * file to readers who never saw the page that made it.
 */
import { EDUCATION_NOTICE } from '@/data/educationNotice'
import { bundleFilename, downloadBlob } from './exportBundle'
import { siteBuildInfo, type RunManifest } from './runManifest'

export type RunRecordFile = { notice: string } & RunManifest

/** The object written to the file: the notice first, then the manifest unchanged. */
export function runRecordFile(m: RunManifest): RunRecordFile {
  return { notice: EDUCATION_NOTICE, ...m }
}

/** Pretty-printed JSON text of the run record file. */
export function runManifestToJson(m: RunManifest): string {
  return `${JSON.stringify(runRecordFile(m), null, 2)}\n`
}

/** Download the run record as `{prefix}-YYYY-MM-DD.json`. Call from a user action. */
export function downloadRunManifestJson(m: RunManifest, prefix: string): void {
  downloadBlob(
    new Blob([runManifestToJson(m)], { type: 'application/json' }),
    bundleFilename(prefix, 'json')
  )
}

/**
 * One line naming the build a result came from, e.g.
 * "Site version 4.163.0 · commit 83cac7973326". Empty parts are said plainly.
 */
export function siteProvenanceLine(site: RunManifest['site'] = siteBuildInfo()): string {
  const version = site.appVersion ? `Site version ${site.appVersion}` : 'Site version unknown'
  const commit = site.commit ? `commit ${site.commit.slice(0, 12)}` : 'commit unknown'
  return `${version} · ${commit}`
}
