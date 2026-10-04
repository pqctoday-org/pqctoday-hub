// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LibraryDocumentCard } from './LibraryDocumentCard'
import type { LibraryItem } from '@/data/libraryData'

function makeItem(overrides: Partial<LibraryItem>): LibraryItem {
  return {
    referenceId: 'TEST-1',
    documentTitle: 'Test document',
    downloadUrl: '',
    initialPublicationDate: '2025-01-01',
    lastUpdateDate: '2025-01-01',
    documentStatus: 'Final',
    lifecycleLabel: 'Released',
    shortDescription: '',
    documentType: '',
    applicableIndustries: [],
    authorsOrOrganization: '',
    dependencies: '',
    regionScope: '',
    algorithmFamily: '',
    securityLevels: '',
    protocolOrToolImpact: '',
    toolchainSupport: '',
    migrationUrgency: '',
    categories: [],
    ...overrides,
  } as LibraryItem
}

const noop = () => {}

describe('LibraryDocumentCard — source affordance', () => {
  it('shows an Open link when a source URL exists', () => {
    render(
      <LibraryDocumentCard
        item={makeItem({ downloadUrl: 'https://example.com/doc.pdf' })}
        bookmarked={false}
        onToggleBookmark={noop}
        onOpen={noop}
      />
    )
    expect(screen.getByRole('link', { name: /open/i })).toHaveAttribute(
      'href',
      'https://example.com/doc.pdf'
    )
  })

  it('shows "Source not available" (and no link) when there is no source URL', () => {
    render(
      <LibraryDocumentCard
        item={makeItem({ downloadUrl: '' })}
        bookmarked={false}
        onToggleBookmark={noop}
        onOpen={noop}
      />
    )
    expect(screen.getByText(/source not available/i)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /open/i })).toBeNull()
  })

  it('shows the lifecycle label, in the new wording', () => {
    for (const lifecycleLabel of [
      'Released',
      'Draft',
      'Expired',
      'Historical',
      'Research Paper',
      'Misc',
    ] as const) {
      const { unmount } = render(
        <LibraryDocumentCard
          item={makeItem({ lifecycleLabel })}
          bookmarked={false}
          onToggleBookmark={noop}
          onOpen={noop}
        />
      )
      expect(screen.getByText(lifecycleLabel)).toBeInTheDocument()
      unmount()
    }
  })

  it("shows the furthest label of a revision group instead of the current row's own", () => {
    render(
      <LibraryDocumentCard
        item={makeItem({ lifecycleLabel: 'Draft', groupLifecycleLabel: 'Released' })}
        bookmarked={false}
        onToggleBookmark={noop}
        onOpen={noop}
      />
    )
    expect(screen.getByText('Released')).toBeInTheDocument()
    expect(screen.queryByText('Draft')).toBeNull()
  })
})
