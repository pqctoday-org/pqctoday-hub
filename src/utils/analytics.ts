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
