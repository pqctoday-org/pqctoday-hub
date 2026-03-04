// SPDX-License-Identifier: GPL-3.0-only
/**
 * HsmKeyTable — displays PKCS#11 key handles registered via HsmContext.
 * All keys are session objects (non-persistent) — no export/download.
 */
import { Key as KeyIcon, Lock } from 'lucide-react'
import { useHsmContext } from '../hsm/HsmContext'

const ROLE_LABELS: Record<string, string> = {
  public: 'Public',
  private: 'Private',
  secret: 'Secret',
}

const ROLE_COLORS: Record<string, string> = {
  public: 'text-status-success',
  private: 'text-status-warning',
  secret: 'text-status-info',
}

export const HsmKeyTable = () => {
  const { hsmKeys } = useHsmContext()

  if (hsmKeys.length === 0) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center gap-2 text-muted-foreground">
        <Lock size={28} className="opacity-30" />
        <p className="text-sm">No HSM keys generated yet.</p>
        <p className="text-xs">Use the KEM or Sign tabs to generate key pairs.</p>
      </div>
    )
  }

  return (
    <div className="glass-panel p-4 space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <KeyIcon size={14} className="text-primary" /> HSM Key Registry
        <span className="text-xs text-muted-foreground font-normal">({hsmKeys.length} keys)</span>
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-1.5 pr-4 font-medium">Handle</th>
              <th className="text-left py-1.5 pr-4 font-medium">Label</th>
              <th className="text-left py-1.5 pr-4 font-medium">Role</th>
              <th className="text-left py-1.5 font-medium">Generated</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {hsmKeys.map((k) => (
              <tr key={k.handle} className="border-b border-border/40 hover:bg-muted/30">
                <td className="py-1.5 pr-4 text-muted-foreground">{k.handle}</td>
                <td className="py-1.5 pr-4 text-foreground">{k.label}</td>
                <td className={`py-1.5 pr-4 font-sans ${ROLE_COLORS[k.role] ?? ''}`}>
                  {ROLE_LABELS[k.role] ?? k.role}
                </td>
                <td className="py-1.5 text-muted-foreground">{k.generatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Session objects — not persisted to token. Handles are valid until session closes.
      </p>
    </div>
  )
}
