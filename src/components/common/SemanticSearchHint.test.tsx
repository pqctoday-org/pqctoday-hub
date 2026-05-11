// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SemanticSearchHint } from './SemanticSearchHint'

describe('SemanticSearchHint', () => {
  it('renders nothing when query is empty', () => {
    const { container } = render(
      <SemanticSearchHint mode="semantic" loading={false} query="" semanticHitCount={5} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when query is whitespace-only', () => {
    const { container } = render(
      <SemanticSearchHint mode="semantic" loading={false} query="   " semanticHitCount={3} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("shows 'Loading semantic search…' when loading=true", () => {
    render(<SemanticSearchHint mode="loading" loading={true} query="foo" semanticHitCount={0} />)
    expect(screen.getByText(/Loading semantic search/i)).toBeInTheDocument()
  })

  it("shows the augmentation hint when mode='semantic' with hits", () => {
    render(<SemanticSearchHint mode="semantic" loading={false} query="foo" semanticHitCount={5} />)
    expect(screen.getByText(/Expanded with semantically/i)).toBeInTheDocument()
  })

  it('uses the custom noun when supplied', () => {
    render(
      <SemanticSearchHint
        mode="semantic"
        loading={false}
        query="foo"
        semanticHitCount={5}
        noun="related products"
      />
    )
    expect(screen.getByText(/related products/i)).toBeInTheDocument()
  })

  it("renders nothing when mode='semantic' but zero hits", () => {
    const { container } = render(
      <SemanticSearchHint mode="semantic" loading={false} query="foo" semanticHitCount={0} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("renders nothing when mode='lexical' (silent fallback)", () => {
    const { container } = render(
      <SemanticSearchHint mode="lexical" loading={false} query="foo" semanticHitCount={0} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("renders nothing when mode='idle'", () => {
    const { container } = render(
      <SemanticSearchHint mode="idle" loading={false} query="foo" semanticHitCount={0} />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
