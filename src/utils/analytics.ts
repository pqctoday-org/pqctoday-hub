import ReactGA from 'react-ga4'

// Helper to check if running on localhost
const isLocalhost = () => {
  const hostname = window.location.hostname
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID

  if (isLocalhost()) {
    console.log('[Analytics] Localhost detected. Google Analytics disabled.')
    return
  }

  if (measurementId) {
    console.log(`[Analytics] Initializing with ID: ${measurementId}`)
    ReactGA.initialize(measurementId)
  } else {
    console.warn('[Analytics] Google Analytics Measurement ID is missing.')
  }
}

export const logPageView = (path?: string) => {
  if (isLocalhost()) return

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID
  if (measurementId) {
    const page = path || window.location.pathname + window.location.search
    console.log(`[Analytics] Logging page view: ${page}`)
    ReactGA.send({
      hitType: 'pageview',
      page,
    })
  }
}

export const logEvent = (category: string, action: string, label?: string) => {
  if (isLocalhost()) return

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID
  if (measurementId) {
    console.log(`[Analytics] Logging event: ${category} - ${action} ${label ? `(${label})` : ''}`)
    ReactGA.event({
      category,
      action,
      label,
    })
  }
}

// Engagement event helpers for key user journeys

export const logModuleStart = (moduleId: string) => {
  logEvent('Learning', 'Module Start', moduleId)
}

export const logModuleComplete = (moduleId: string) => {
  logEvent('Learning', 'Module Complete', moduleId)
}

export const logStepComplete = (moduleId: string, stepIndex: number) => {
  logEvent('Learning', 'Step Complete', `${moduleId}:step-${stepIndex}`)
}

export const logArtifactGenerated = (moduleId: string, artifactType: string) => {
  logEvent('Learning', 'Artifact Generated', `${moduleId}:${artifactType}`)
}

export const logAlgorithmView = (algorithmName: string) => {
  logEvent('Algorithms', 'View Detail', algorithmName)
}

export const logComplianceSearch = (query: string) => {
  logEvent('Compliance', 'Search', query)
}

export const logComplianceFilter = (filterType: string, value: string) => {
  logEvent('Compliance', 'Filter', `${filterType}:${value}`)
}

export const logMigrateAction = (action: string, label?: string) => {
  logEvent('Migrate', action, label)
}

export const logLibrarySearch = (query: string) => {
  logEvent('Library', 'Search', query)
}

export const logLibraryDownload = (fileName: string) => {
  logEvent('Library', 'Download', fileName)
}

export const logExternalLink = (category: string, url: string) => {
  logEvent(category, 'External Link', url)
}
