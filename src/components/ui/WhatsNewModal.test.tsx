// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { WhatsNewModal } from './WhatsNewModal'
import { useVersionStore } from '../../store/useVersionStore'
import { useDisclaimerStore } from '../../store/useDisclaimerStore'

// Regression coverage for the two "What's New" defects found and fixed
// 2026-09-14 (pqctoday-hub-whats-new-remediation-plan-09142026.md):
//   P1 — the imperative-open effect only subscribed to *future* showWhatsNew
//        changes, so a click that beat this (React.lazy-loaded) component's
//        mount left the flag stranded true and the modal never opened.
//   P2 — the auto-open effect ignored the disclaimer banner's own state, so
//        both could render on screen at once for a returning visitor whose
//        disclaimer needs re-acknowledgment but whose tour flag is already set.

describe('WhatsNewModal', () => {
  const renderModal = () =>
    render(
      <BrowserRouter>
        <WhatsNewModal />
      </BrowserRouter>
    )

  beforeEach(() => {
    useVersionStore.getState().resetForTesting()
    useVersionStore.setState({ showWhatsNew: false })
    useDisclaimerStore.getState().resetForTesting()
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    window.history.pushState({}, '', '/')
  })

  describe('imperative open (About page button) — P1', () => {
    it('opens once mounted even when showWhatsNew was already set true before mount', async () => {
      // Simulates the real race: requestShowWhatsNew() fires from the About
      // page before this lazy component's chunk (and thus this effect) exists.
      useVersionStore.getState().requestShowWhatsNew()

      renderModal()

      expect(await screen.findByText("What's New")).toBeInTheDocument()
      // The one-shot signal must be consumed, not left stuck true.
      expect(useVersionStore.getState().showWhatsNew).toBe(false)
    })

    it('still opens via a live click after mount (no regression on the normal path)', async () => {
      renderModal()
      expect(screen.queryByText("What's New")).not.toBeInTheDocument()

      act(() => {
        useVersionStore.getState().requestShowWhatsNew()
      })

      expect(await screen.findByText("What's New")).toBeInTheDocument()
    })
  })

  describe('auto-open vs. disclaimer banner — P2', () => {
    it('does not auto-open while the disclaimer is unacknowledged', async () => {
      vi.useFakeTimers()
      localStorage.setItem('pqc-tour-completed', 'true')
      // resetForTesting() (beforeEach) already leaves isFirstVisit: true and
      // the disclaimer unacknowledged — the exact returning-visitor-after-a-
      // major-bump state that produced the overlay collision.

      renderModal()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500)
      })

      expect(screen.queryByText("What's New")).not.toBeInTheDocument()
    })

    it('auto-opens shortly after the disclaimer is acknowledged', async () => {
      vi.useFakeTimers()
      localStorage.setItem('pqc-tour-completed', 'true')

      renderModal()
      await act(async () => {
        useDisclaimerStore.getState().acknowledgeDisclaimer()
        await vi.advanceTimersByTimeAsync(1500)
      })

      expect(screen.getByText("What's New")).toBeInTheDocument()
    })

    it('the ?whatsnew QA hook also waits for the disclaimer, instead of reproducing the collision', async () => {
      vi.useFakeTimers()
      window.history.pushState({}, '', '/?whatsnew')

      renderModal()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500)
      })

      expect(screen.queryByText("What's New")).not.toBeInTheDocument()
    })
  })
})
