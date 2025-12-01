import ReactGA from 'react-ga4'

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

export const initGA = () => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID)
  } else {
    console.warn('Google Analytics Measurement ID is missing.')
  }
}

export const logPageView = (path?: string) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.send({
      hitType: 'pageview',
      page: path || window.location.pathname + window.location.search,
    })
  }
}

export const logEvent = (category: string, action: string, label?: string) => {
  if (GA_MEASUREMENT_ID) {
    ReactGA.event({
      category,
      action,
      label,
    })
  }
}
