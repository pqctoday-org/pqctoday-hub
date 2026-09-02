// SPDX-License-Identifier: GPL-3.0-only
//
// SuiteShell — the Build tab's shared Builder/Code chrome for the ACVP and
// Conformance suites (design handoff design_handoff_kmip_pkcs11_playground
// §3.6, D6). Same shape as the Standard suite's PkcsDevWorkbench: a header
// with the suite name, actions, the Run button and a Builder/Code
// `TabsList`; a 3-column Builder grid (palette | canvas | summary aside);
// a read-only Monaco Code view with a Download button. Both views are
// driven by ONE selection the suite component owns — the Code view is
// generated from it, never edited into drift.
import { useEffect, useState, type ReactNode } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { installMonacoSelfHost } from '../../monacoSelfHost'

export type SuiteView = 'builder' | 'code'

export interface CodeRunOutput {
  ok: boolean
  text: string
}

interface SuiteShellProps {
  title: string
  /** Short line under the title. */
  subtitle?: ReactNode
  /** Extra header controls (a second run button, copy-report…). */
  actions?: ReactNode
  running: boolean
  runLabel?: string
  runDisabled?: boolean
  runTitle?: string
  runTestId?: string
  onRun: () => void
  /** Rendered between the header and the views — notices, summaries. */
  notice?: ReactNode
  palette: ReactNode
  canvas: ReactNode
  aside: ReactNode
  /** Generated Python for the Code view. */
  code: string
  downloadName: string
  /** Output of the last Code-view run, shown under the editor. */
  codeOutput?: CodeRunOutput | null
  view: SuiteView
  onViewChange: (v: SuiteView) => void
  /** `data-testid` for the root, kept for the e2e specs. */
  testId?: string
  builderLabel?: string
}

export const SuiteShell = ({
  title,
  subtitle,
  actions,
  running,
  runLabel = 'Run',
  runDisabled,
  runTitle,
  runTestId,
  onRun,
  notice,
  palette,
  canvas,
  aside,
  code,
  downloadName,
  codeOutput,
  view,
  onViewChange,
  testId,
  builderLabel = 'Builder',
}: SuiteShellProps) => {
  // Same self-hosted Monaco gate as PkcsDevWorkbench (see monacoSelfHost.ts).
  const [monacoReady, setMonacoReady] = useState(false)
  useEffect(() => {
    let cancelled = false
    void installMonacoSelfHost().then(() => {
      if (!cancelled) setMonacoReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const download = () => {
    const blob = new Blob([code], { type: 'text/x-python' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadName
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Tabs
      value={view}
      onValueChange={(v) => onViewChange(v as SuiteView)}
      className="flex flex-col h-[70vh] border rounded-lg overflow-hidden bg-background text-sm"
      data-testid={testId}
    >
      <div className="p-4 border-b flex justify-between items-center gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="text-lg font-semibold truncate">{title}</div>
          {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          {actions}
          <Button
            size="sm"
            disabled={running || runDisabled}
            onClick={onRun}
            title={runTitle}
            aria-busy={running}
            data-testid={runTestId}
          >
            {running ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 mr-1" />
            )}
            {running ? 'Running…' : runLabel}
          </Button>
          <span className="inline-flex items-center gap-1 rounded-full border border-status-success/40 bg-status-success/10 px-2 py-0.5 text-[10.5px] text-status-success">
            ✓ synced
          </span>
          <TabsList data-tour="pkcs-suite-view-tabs">
            <TabsTrigger value="builder">{builderLabel}</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
        </div>
      </div>

      {notice}

      <TabsContent value="builder" className="mt-0 flex-1 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_280px] gap-0 h-full overflow-hidden">
          <aside
            className="border-b lg:border-b-0 lg:border-r p-3 overflow-auto flex flex-col gap-3"
            data-tour="pkcs-suite-palette"
          >
            {palette}
          </aside>
          <main className="flex flex-col overflow-auto p-4" data-tour="pkcs-suite-canvas">
            {canvas}
          </main>
          <aside className="border-t lg:border-t-0 lg:border-l p-4 flex flex-col gap-3 overflow-auto">
            {aside}
          </aside>
        </div>
      </TabsContent>

      <TabsContent value="code" className="mt-0 flex-1 min-h-0 flex flex-col">
        <div className="px-4 py-2 text-xs border-b text-muted-foreground">
          Read-only — generated from the Builder&apos;s selection. Run executes it in this tab
          through the in-browser bridge to the same runner the Builder uses.
        </div>
        <div className="flex-1 min-h-0 p-4 flex flex-col gap-3">
          <div className="flex-1 min-h-0 border rounded overflow-hidden">
            {monacoReady ? (
              <Editor
                height="100%"
                language="python"
                value={code}
                theme="vs-dark"
                options={{
                  fontSize: 12,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  readOnly: true,
                }}
              />
            ) : (
              <div className="h-full grid place-items-center text-xs text-muted-foreground font-mono">
                Loading editor…
              </div>
            )}
          </div>
          {codeOutput && (
            <pre
              className={`max-h-40 overflow-auto rounded border p-3 font-mono text-[11px] whitespace-pre-wrap ${
                codeOutput.ok
                  ? 'border-border bg-muted/30 text-foreground'
                  : 'border-status-error/40 bg-status-error/5 text-status-error'
              }`}
              data-testid="pkcs-suite-code-output"
            >
              {codeOutput.text}
            </pre>
          )}
        </div>
        <div className="p-3 border-t" data-tour="pkcs-suite-export">
          <Button variant="outline" size="sm" className="w-full" onClick={download}>
            <Download className="h-3.5 w-3.5 mr-1" /> Download as .py
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  )
}
