// SPDX-License-Identifier: GPL-3.0-only
import React, { createContext, useContext, useCallback, useMemo } from 'react'
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google'
import { useCloudSyncStore } from '@/store/useCloudSyncStore'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

interface GoogleAuthContextValue {
  signIn: () => void
  signOut: () => void
  isSignedIn: boolean
  syncStatus: ReturnType<typeof useCloudSyncStore.getState>['syncStatus']
  lastSyncedAt: string | null
  isConfigured: boolean
}

const GoogleAuthContext = createContext<GoogleAuthContextValue>({
  signIn: () => {},
  signOut: () => {},
  isSignedIn: false,
  syncStatus: 'idle',
  lastSyncedAt: null,
  isConfigured: false,
})

function GoogleAuthInner({ children }: { children: React.ReactNode }) {
  const {
    setSignedIn,
    signOut: storeSignOut,
    isSignedIn,
    syncStatus,
    lastSyncedAt,
  } = useCloudSyncStore()

  const handleSuccess = useCallback(
    (tokenResponse: { access_token: string }) => {
      setSignedIn(tokenResponse.access_token)
    },
    [setSignedIn]
  )

  // CSRF nonce — stable per mount, verified implicitly by the popup flow
  const csrfState = useMemo(() => crypto.randomUUID(), [])

  const login = useGoogleLogin({
    onSuccess: handleSuccess,
    onError: (err) => console.warn('Google login error:', err),
    scope: 'https://www.googleapis.com/auth/drive.appdata',
    state: csrfState,
    include_granted_scopes: true,
    flow: 'implicit',
  })

  const signIn = useCallback(() => login(), [login])
  const signOut = useCallback(() => storeSignOut(), [storeSignOut])

  return (
    <GoogleAuthContext.Provider
      value={{
        signIn,
        signOut,
        isSignedIn,
        syncStatus,
        lastSyncedAt,
        isConfigured: Boolean(CLIENT_ID),
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  )
}

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  if (!CLIENT_ID) {
    return (
      <GoogleAuthContext.Provider
        value={{
          signIn: () => {},
          signOut: () => {},
          isSignedIn: false,
          syncStatus: 'idle',
          lastSyncedAt: null,
          isConfigured: false,
        }}
      >
        {children}
      </GoogleAuthContext.Provider>
    )
  }

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <GoogleAuthInner>{children}</GoogleAuthInner>
    </GoogleOAuthProvider>
  )
}

export function useGoogleAuth() {
  return useContext(GoogleAuthContext)
}
