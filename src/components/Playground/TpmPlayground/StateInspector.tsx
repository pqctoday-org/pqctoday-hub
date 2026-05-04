import { Database, KeyRound } from 'lucide-react'
import type { TpmObjectEntry } from './TpmPlayground'

interface StateInspectorProps {
  objects: TpmObjectEntry[]
}

export function StateInspector({ objects }: StateInspectorProps) {
  return (
    <div className="space-y-6">
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/30 px-4 py-2 border-b border-border text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
          <Database className="h-4 w-4" />
          Active Object Table
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground mb-2">
            Loaded transient and persistent objects inside the WASM TPM memory.
          </p>

          {objects.length === 0 ? (
            <div className="border border-border rounded p-3 bg-background flex items-start gap-3 opacity-50">
              <div className="text-sm text-muted-foreground italic w-full text-center py-2">
                No objects loaded.
              </div>
            </div>
          ) : (
            objects.map((obj, i) => (
              <div
                key={i}
                className="border border-border rounded p-3 bg-secondary/5 flex items-start gap-3"
              >
                <KeyRound className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                <div className="space-y-1 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{obj.handle}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {obj.algorithm}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">{obj.description}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
