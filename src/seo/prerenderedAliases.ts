// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Addresses that are the same page as another address and are sent on by the app, but must still
 * answer with a real page when a crawler asks the host for them: the host has no redirect of its
 * own, so an address without a saved page would answer 404. The build saves the target's prerendered
 * page under each alias (scripts/ci/make-aliases.ts); its canonical link names the target, so search
 * engines count the two as one page. The app still sends a visitor on to the target
 * (`?tab=` and `#hash` kept, see App.tsx).
 */
export const PRERENDERED_ALIASES: ReadonlyArray<{ from: string; to: string }> = [
  { from: '/playground/cacp-kmip', to: '/playground/cacp' },
]
