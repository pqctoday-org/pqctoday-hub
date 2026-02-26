/**
 * Parses ?tab= and ?step= from the current URL for module deep-linking.
 * Called inside useState initializers — runs once per mount.
 */
export function getModuleDeepLink(
  opts: {
    validTabs?: string[]
    maxStep?: number
    defaultTab?: string
  } = {}
): { initialTab: string; initialStep: number } {
  const { validTabs = ['learn', 'workshop'], maxStep, defaultTab = 'learn' } = opts
  const params = new URLSearchParams(window.location.search)

  const tabParam = params.get('tab')
  const initialTab = tabParam && validTabs.includes(tabParam) ? tabParam : defaultTab

  const stepParam = params.get('step')
  let initialStep = 0
  if (stepParam !== null) {
    const parsed = parseInt(stepParam, 10)
    if (!Number.isNaN(parsed) && parsed >= 0) {
      initialStep = maxStep !== undefined ? Math.min(parsed, maxStep) : parsed
    }
  }

  return { initialTab, initialStep }
}
