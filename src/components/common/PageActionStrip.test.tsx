// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PageActionStrip } from './PageActionStrip'
import { useEndorsementStore } from '@/store/useEndorsementStore'

describe('PageActionStrip', () => {
  beforeEach(() => {
    useEndorsementStore.setState({ records: {} })
  })

  it('renders nothing when no props are given', () => {
    const { container } = render(<PageActionStrip />)
    expect(container).toBeEmptyDOMElement()
  })

  describe('info icon', () => {
    it('renders a real clickable button (icon + "Info" label + title tooltip) matching the freshness string', () => {
      render(<PageActionStrip dataSource="timeline_07312026.csv • Updated: 7/31/2026" />)
      const button = screen.getByRole('button', {
        name: /data source: timeline_07312026\.csv • updated: 7\/31\/2026/i,
      })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('title', 'timeline_07312026.csv • Updated: 7/31/2026')
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('clicking Info opens a popover showing the freshness string, and clicking again closes it (2026-08-01 bug fix: "info does not seem to work" — it used to be a hover-only tooltip with no click behavior at all)', async () => {
      const user = userEvent.setup()
      render(<PageActionStrip dataSource="timeline_07312026.csv • Updated: 7/31/2026" />)
      const button = screen.getByRole('button', { name: /data source:/i })
      expect(screen.queryByRole('dialog', { name: /data source/i })).not.toBeInTheDocument()

      await user.click(button)
      const popover = screen.getByRole('dialog', { name: /data source/i })
      expect(popover).toHaveTextContent('timeline_07312026.csv • Updated: 7/31/2026')
      expect(button).toHaveAttribute('aria-expanded', 'true')

      await user.click(button)
      expect(screen.queryByRole('dialog', { name: /data source/i })).not.toBeInTheDocument()
    })

    it('shows a skeleton placeholder instead of nothing while metadata is loading', () => {
      render(<PageActionStrip dataSourceLoading />)
      expect(
        screen.getByRole('status', { name: /loading data source information/i })
      ).toBeInTheDocument()
      // The real freshness tooltip must not also render while loading
      expect(screen.queryByText(/Updated:/)).not.toBeInTheDocument()
    })

    it('prefers the real dataSource over the loading skeleton once both are present', () => {
      render(
        <PageActionStrip dataSource="library_08012026.csv • Updated: 8/1/2026" dataSourceLoading />
      )
      expect(
        screen.getByRole('button', {
          name: /data source: library_08012026\.csv • updated: 8\/1\/2026/i,
        })
      ).toBeInTheDocument()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('renders nothing for the info icon when neither dataSource nor loading is set', () => {
      render(<PageActionStrip onExport={vi.fn()} />)
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      expect(screen.queryByLabelText(/Updated:/)).not.toBeInTheDocument()
    })
  })

  describe('export icon', () => {
    it('renders only when onExport is provided, with a real aria-label', () => {
      const { rerender } = render(<PageActionStrip dataSource="x • Updated: 1/1/2026" />)
      expect(screen.queryByRole('button', { name: 'Export CSV' })).not.toBeInTheDocument()

      const onExport = vi.fn()
      rerender(<PageActionStrip dataSource="x • Updated: 1/1/2026" onExport={onExport} />)
      const btn = screen.getByRole('button', { name: 'Export CSV' })
      expect(btn).toHaveAttribute('title', 'Export CSV')
      btn.click()
      expect(onExport).toHaveBeenCalledTimes(1)
    })
  })

  describe('endorse / flag icons', () => {
    it('renders EndorseButton only when endorseUrl is provided', () => {
      const { rerender } = render(<PageActionStrip title="Global Migration Timeline" />)
      expect(screen.queryByRole('button', { name: /endorse/i })).not.toBeInTheDocument()

      rerender(
        <PageActionStrip
          title="Global Migration Timeline"
          endorseUrl="https://github.com/pqctoday-org/pqctoday-hub/discussions/new"
          endorseLabel="Timeline Page"
          endorseResourceType="Timeline"
        />
      )
      expect(screen.getByRole('button', { name: /endorse timeline page/i })).toBeInTheDocument()
    })

    it('renders FlagButton only when flagUrl is provided', () => {
      const { rerender } = render(<PageActionStrip title="Global Migration Timeline" />)
      expect(screen.queryByRole('button', { name: /flag/i })).not.toBeInTheDocument()

      rerender(
        <PageActionStrip
          title="Global Migration Timeline"
          flagUrl="https://github.com/pqctoday-org/pqctoday-hub/discussions/new"
          flagLabel="Timeline Page"
          flagResourceType="Timeline"
        />
      )
      expect(
        screen.getByRole('button', { name: /flag issue with timeline page/i })
      ).toBeInTheDocument()
    })

    it('falls back to `title` as the resourceLabel when endorseLabel/flagLabel are omitted', () => {
      render(
        <PageActionStrip
          title="Global Migration Timeline"
          endorseUrl="https://github.com/pqctoday-org/pqctoday-hub/discussions/new"
        />
      )
      expect(
        screen.getByRole('button', { name: /endorse global migration timeline/i })
      ).toBeInTheDocument()
    })
  })

  it('applies the passed-through testId', () => {
    render(<PageActionStrip testId="timeline-action-strip" dataSource="x • Updated: 1/1/2026" />)
    expect(screen.getByTestId('timeline-action-strip')).toBeInTheDocument()
  })
})
