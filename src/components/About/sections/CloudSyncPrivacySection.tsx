// SPDX-License-Identifier: GPL-3.0-only
import { motion } from 'framer-motion'
import { Cloud } from 'lucide-react'

export function CloudSyncPrivacySection() {
  return (
    <motion.div
      id="cloud-sync-privacy"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-panel p-4 md:p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <Cloud className="text-primary shrink-0" size={24} />
        <h2 className="text-xl font-semibold">Google Drive Sync &mdash; Privacy Terms</h2>
      </div>
      <div className="prose prose-invert max-w-none text-sm text-muted-foreground space-y-3">
        <p>
          The optional <strong className="text-foreground">Sync to Google Drive</strong> feature
          allows you to back up and restore your progress across devices. Here is exactly what
          happens when you use it:
        </p>
        <ul className="space-y-2.5 list-none pl-0">
          <li className="flex items-start gap-2.5">
            <span className="text-status-success mt-1 shrink-0">&#9679;</span>
            <span>
              <strong className="text-foreground">No personal data is collected.</strong> We do not
              request your name, email address, or profile picture. The consent screen only asks for
              access to your Google Drive app data folder.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-status-success mt-1 shrink-0">&#9679;</span>
            <span>
              <strong className="text-foreground">Your data stays in your account.</strong> All
              progress data is saved to a hidden file in{' '}
              <strong className="text-foreground">your own Google Drive</strong> — not on any server
              we own or control. Only you can access it.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-status-success mt-1 shrink-0">&#9679;</span>
            <span>
              <strong className="text-foreground">No identity is transmitted.</strong> The Google
              access token (used to write to your Drive) is stored only in browser memory and is
              never sent to our servers. It disappears when you close the tab.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-status-success mt-1 shrink-0">&#9679;</span>
            <span>
              <strong className="text-foreground">No API keys are synced.</strong> Your Gemini or
              other AI provider API keys are explicitly excluded from the sync payload and remain
              local to your device at all times.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-status-success mt-1 shrink-0">&#9679;</span>
            <span>
              <strong className="text-foreground">Full user control.</strong> You can sign out at
              any time from the home page. You can permanently delete the sync file via Google Drive
              settings &rarr; Manage apps &rarr; PQC Today &rarr; Delete hidden app data.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-status-success mt-1 shrink-0">&#9679;</span>
            <span>
              <strong className="text-foreground">This feature is optional.</strong> The app works
              fully without signing in. Declining or revoking access has no effect on any other
              functionality.
            </span>
          </li>
        </ul>
        <p className="text-xs text-muted-foreground/70 pt-2 border-t border-border/40">
          The scope requested is{' '}
          <code className="font-mono text-primary">
            https://www.googleapis.com/auth/drive.appdata
          </code>{' '}
          — the least-privileged Drive scope. It grants access only to a hidden app-specific folder
          and cannot read, modify, or delete any of your regular Drive files.
        </p>
      </div>
    </motion.div>
  )
}
