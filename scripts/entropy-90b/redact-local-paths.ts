// SPDX-License-Identifier: GPL-3.0-only
/**
 * Published measurement files describe how a dataset was recorded (the
 * command line), but must not carry the recording machine's local paths: a
 * home directory or a per-session temporary folder says nothing about the
 * measurement and only exposes the workstation it ran on. Each such absolute
 * path is reduced to its file name; device paths such as /tmp/<run>/bin/... on
 * a board are kept, because they are part of the recorded procedure.
 */
const LOCAL_PATH =
  /(?:\/private\/(?:tmp|var)|\/var\/folders|\/Users|\/home|\/tmp\/claude-[^/\s]*)\/\S*/g

export function redactLocalPaths(text: string): string {
  return text.replace(LOCAL_PATH, (path) => {
    const trimmed = path.replace(/\/+$/, '')
    return trimmed.slice(trimmed.lastIndexOf('/') + 1)
  })
}
