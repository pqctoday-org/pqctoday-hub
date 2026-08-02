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
          The <strong className="text-foreground">Sync to Google Drive</strong> feature is built
          into the app&apos;s code to back up and restore your progress across devices.{' '}
          <strong className="text-foreground">It is not currently enabled in the interface</strong>{' '}
          — there is no sign-in control anywhere in the app today, so no one can turn cloud sync on
          or off right now. The points below document exactly what the code does, for transparency,
          even though the feature is currently dormant:
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
              <strong className="text-foreground">No in-app control exists today.</strong> There is
              currently no sign-in or sign-out control anywhere in the app — cloud sync cannot be
              enabled or disabled from the home page or any other screen. Regardless, any data ever
              written to your Drive app-data folder can be permanently deleted at any time via
              Google Drive settings &rarr; Manage apps &rarr; PQC Today &rarr; Delete hidden app
              data — you do not need our app for that.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="text-status-success mt-1 shrink-0">&#9679;</span>
            <span>
              <strong className="text-foreground">Nothing else is affected.</strong> The app works
              fully without any Google account. The current unavailability of this feature has no
              effect on any other functionality.
            </span>
          </li>
        </ul>
        <p className="text-xs text-muted-foreground pt-2 border-t border-border/40">
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
