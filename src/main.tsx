import { createRoot } from 'react-dom/client'
import './styles/index.css'
import AppRoot from './AppRoot'
import { initGA } from './utils/analytics'

// Initialize Google Analytics
initGA()

// Global error handler
window.onerror = function (message, source, lineno, colno, error) {
  const errorDiv = document.getElementById('global-error-display') || document.createElement('div')
  errorDiv.id = 'global-error-display'
  errorDiv.style.position = 'fixed'
  errorDiv.style.top = '0'
  errorDiv.style.left = '0'
  errorDiv.style.width = '100%'
  errorDiv.style.backgroundColor = 'red'
  errorDiv.style.color = 'white'
  errorDiv.style.padding = '20px'
  errorDiv.style.zIndex = '9999'
  errorDiv.innerHTML += `
    <div style="border-bottom: 1px solid white; margin-bottom: 10px; padding-bottom: 10px;">
      <h3>Global Error Caught</h3>
      <p>Message: ${message}</p>
      <p>Source: ${source}:${lineno}:${colno}</p>
      <pre>${error?.stack || 'No stack trace'}</pre>
    </div>
  `
  if (!document.body.contains(errorDiv)) document.body.appendChild(errorDiv)
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')

createRoot(rootElement).render(<AppRoot />)
