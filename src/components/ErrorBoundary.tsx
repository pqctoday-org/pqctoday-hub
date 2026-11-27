// SPDX-License-Identifier: AGPL-3.0-only
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { StickerCard, StoryButton } from '@/components/storybook'
import {
  isNetworkFetchError,
  isStaleBuildError,
  OFFLINE_MESSAGE,
  reloadOnceForUpdate,
  reloadPage,
  UPDATED_MESSAGE,
} from '@/utils/updateReload'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    // A split file the new release removed: fetch the new page once. If that
    // does not help (second failure), the message below stays on screen.
    if (isStaleBuildError(error)) reloadOnceForUpdate(error)
  }

  public render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback

    const { error } = this.state

    if (isStaleBuildError(error)) {
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false
      return (
        <StickerCard
          as="section"
          role="alert"
          tone="highlight"
          padding="roomy"
          className="mx-4 my-8 max-w-xl sm:mx-auto"
        >
          <h2 className="text-lg font-extrabold text-heading">
            {offline ? 'You are offline' : 'A new version is ready'}
          </h2>
          <p className="mt-2 text-foreground">{offline ? OFFLINE_MESSAGE : UPDATED_MESSAGE}</p>
          <StoryButton className="mt-5" onClick={reloadPage}>
            Reload
          </StoryButton>
        </StickerCard>
      )
    }

    return (
      <StickerCard
        as="section"
        role="alert"
        padding="roomy"
        className="mx-4 my-8 max-w-xl border-destructive sm:mx-auto"
      >
        <h2 className="text-lg font-extrabold text-heading">Something went wrong</h2>
        <p className="mt-2 text-foreground">{error?.message || 'Unknown error'}</p>
        <StoryButton
          variant="secondary"
          className="mt-5"
          onClick={() => {
            // A failed network request is retried with a fresh page load, as before.
            if (isNetworkFetchError(error)) reloadPage()
            else this.setState({ hasError: false, error: null })
          }}
        >
          Try again
        </StoryButton>
      </StickerCard>
    )
  }
}
