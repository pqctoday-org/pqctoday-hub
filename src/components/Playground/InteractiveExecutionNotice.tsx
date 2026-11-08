// SPDX-License-Identifier: AGPL-3.0-only
import type { ExecutionMode } from './contexts/SettingsContext'

/** Selected provider state, not a claim that any operation ran or passed. */
export function InteractiveExecutionNotice({
  executionMode,
  wasmLoaded,
}: {
  executionMode: ExecutionMode
  wasmLoaded: boolean
}) {
  return (
    <aside
      role="status"
      aria-label="Selected execution mode"
      className="mb-4 rounded-lg border border-border bg-muted/20 p-3 text-xs"
    >
      <p className="font-semibold text-foreground">
        {executionMode === 'mock'
          ? 'Software mode: Mock'
          : `Software mode: WebAssembly — signing library ${wasmLoaded ? 'loaded' : 'loading'}`}
      </p>
      <p className="mt-1 leading-relaxed text-muted-foreground">
        {executionMode === 'mock'
          ? 'Mock outputs are educational demonstrations, not executed cryptographic checks.'
          : 'A selected mode or loaded library is not a successful operation result.'}{' '}
        Read each operation’s result to see what executed and whether it succeeded.
      </p>
    </aside>
  )
}
