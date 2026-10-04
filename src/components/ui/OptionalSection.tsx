// SPDX-License-Identifier: GPL-3.0-only
import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Wraps a side section that the page can do without (for example a list of maintainers that is
 * loaded on demand). If the section throws, most often because its code could not be fetched after
 * a new release or while offline, it is left out and the rest of the page stays: unlike the page-level
 * error screen, which would replace the whole view.
 */
export class OptionalSection extends Component<{ children?: ReactNode }, { failed: boolean }> {
  public state = { failed: false }

  public static getDerivedStateFromError() {
    return { failed: true }
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('An optional section could not be shown and was left out:', error, info)
  }

  public render() {
    return this.state.failed ? null : this.props.children
  }
}
