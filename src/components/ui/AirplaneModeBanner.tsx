// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Plane, X, CheckCircle, AlertTriangle } from 'lucide-react'
import { useAirplaneModeStore } from '@/store/useAirplaneModeStore'
import { Button } from '@/components/ui/button'

/**
 * Dismissible banner that explains Airplane Mode limitations.
 * Shown at the top of the main content area when Airplane Mode is active.
 */
export function AirplaneModeBanner() {
  const isEnabled = useAirplaneModeStore((s) => s.isEnabled)
  const [dismissed, setDismissed] = useState(false)

  if (!isEnabled || dismissed) return null

  return (
    <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4 print:hidden">
      <div className="flex items-start gap-3">
        <Plane size={20} className="text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">Airplane Mode</h3>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setDismissed(true)}
              className="text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Dismiss Airplane Mode info"
            >
              <X size={16} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            You are using PQC Today offline. Most features work without an internet connection.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* What works */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-status-success flex items-center gap-1">
                <CheckCircle size={12} />
                Available offline
              </p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>All 48 learning modules & workshops</li>
                <li>Quiz (755 questions)</li>
                <li>Assessment wizard & PDF report</li>
                <li>Playground (KEM, DSA, Hashing, HSM)</li>
                <li>OpenSSL Studio</li>
                <li>Timeline, Compliance, Migrate, Library</li>
                <li>Threats, Leaders, Algorithms, Glossary</li>
                <li>All saved progress & preferences</li>
              </ul>
            </div>

            {/* What doesn't work */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-status-warning flex items-center gap-1">
                <AlertTriangle size={12} />
                Requires internet
              </p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>AI Chat (Gemini cloud mode)</li>
                <li>AI Chat (local mode — first-time model download)</li>
                <li>Google Drive sync</li>
                <li>Compliance live refresh (NIST/ACVP/CC)</li>
                <li>External links (RFCs, standards bodies)</li>
              </ul>
              <p className="text-[10px] text-muted-foreground/70 mt-1">
                If you downloaded a local AI model before going offline, local chat still works.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
