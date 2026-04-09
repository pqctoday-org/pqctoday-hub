// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState, useRef, useCallback } from 'react'
import { isPqcMessage } from './postMessageProtocol'
import type { PqcMessage } from './postMessageProtocol'
import { useEmbed } from './EmbedProvider'

export function useEmbedAuth() {
  const { allowedOrigins, userId, persistMode } = useEmbed()
  const [isAuthenticated, setIsAuthenticated] = useState(persistMode !== 'api') // Auto-authed if not API
  const tokenRef = useRef<string | null>(null)

  // Listen for auth messages from parent
  useEffect(() => {
    if (persistMode !== 'api') return

    const handleMessage = (event: MessageEvent) => {
      // Validate origin if not wildcard
      if (!allowedOrigins.includes('*') && !allowedOrigins.includes(event.origin)) {
        return
      }

      if (isPqcMessage(event.data)) {
        const msg = event.data as PqcMessage
        if (msg.type === 'pqc:auth') {
          tokenRef.current = msg.token
          setIsAuthenticated(true)
        }
      }
    }

    window.addEventListener('message', handleMessage)

    // Signal readiness
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'pqc:ready' }, '*')
    }

    return () => window.removeEventListener('message', handleMessage)
  }, [allowedOrigins, persistMode, userId])

  const getToken = useCallback(() => tokenRef.current, [])

  const triggerAuthExpired = useCallback(() => {
    setIsAuthenticated(false)
    tokenRef.current = null
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'pqc:authExpired', userId }, '*')
    }
  }, [userId])

  return { isAuthenticated, getToken, triggerAuthExpired }
}
