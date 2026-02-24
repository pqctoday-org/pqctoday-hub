import { createRoot } from 'react-dom/client'
import './styles/index.css'
import AppRoot from './AppRoot'
import { initGA } from './utils/analytics'

// Initialize Google Analytics
initGA()

// Automatically disable Guided Tour during E2E testing
if (typeof window !== 'undefined' && window.navigator?.webdriver) {
  localStorage.setItem('pqc-tour-completed', 'true')
}

// Global error handler — dev only, uses safe DOM construction (no innerHTML) to prevent XSS
if (import.meta.env.DEV) {
  window.onerror = function (message, source, lineno, colno, error) {
    const errorDiv =
      document.getElementById('global-error-display') || document.createElement('div')
    errorDiv.id = 'global-error-display'
    errorDiv.style.position = 'fixed'
    errorDiv.style.top = '0'
    errorDiv.style.left = '0'
    errorDiv.style.width = '100%'
    errorDiv.style.backgroundColor = 'red'
    errorDiv.style.color = 'white'
    errorDiv.style.padding = '20px'
    errorDiv.style.zIndex = '9999'

    const entry = document.createElement('div')
    entry.style.borderBottom = '1px solid white'
    entry.style.marginBottom = '10px'
    entry.style.paddingBottom = '10px'

    const heading = document.createElement('h3')
    heading.textContent = 'Global Error Caught'

    const msgP = document.createElement('p')
    msgP.textContent = `Message: ${String(message)}`

    const srcP = document.createElement('p')
    srcP.textContent = `Source: ${String(source)}:${lineno}:${colno}`

    const stackPre = document.createElement('pre')
    stackPre.textContent = error?.stack ?? 'No stack trace'

    entry.appendChild(heading)
    entry.appendChild(msgP)
    entry.appendChild(srcP)
    entry.appendChild(stackPre)
    errorDiv.appendChild(entry)

    if (!document.body.contains(errorDiv)) document.body.appendChild(errorDiv)
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')

createRoot(rootElement).render(<AppRoot />)
