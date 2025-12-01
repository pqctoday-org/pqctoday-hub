import ReactGA from 'react-ga4'

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

export const initGA = () => {
  if (GA_MEASUREMENT_ID) {
    console.log(`[Analytics] Initializing with ID: ${GA_MEASUREMENT_ID}`)
    ReactGA.initialize(GA_MEASUREMENT_ID)
  } else {
    console.warn('[Analytics] Google Analytics Measurement ID is missing.')
  }
}

export const logPageView = (path?: string) => {
  if (GA_MEASUREMENT_ID) {
    const page = path || window.location.pathname + window.location.search
    console.log(`[Analytics] Logging page view: ${page}`)
    ReactGA.send({
      hitType: 'pageview',
      page,
    })
  }
}

export const logEvent = (category: string, action: string, label?: string) => {
  if (GA_MEASUREMENT_ID) {
    console.log(`[Analytics] Logging event: ${category} - ${action} ${label ? `(${label})` : ''}`)
    ReactGA.event({
      category,
      action,
      label,
    })
  }
}
