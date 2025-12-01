import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CountryFlag } from './CountryFlag'

describe('CountryFlag', () => {
    it('renders correctly with a valid code', () => {
        render(<CountryFlag code="US" />)
        const img = screen.getByRole('img')
        expect(img).toHaveAttribute('src', '/flags/us.svg')
        expect(img).toHaveAttribute('alt', 'US flag')
    })

    it('renders correctly with a custom className', () => {
        render(<CountryFlag code="US" className="custom-class" />)
        const img = screen.getByRole('img')
        expect(img).toHaveClass('custom-class')
    })

    it('renders correctly with custom alt text', () => {
        render(<CountryFlag code="US" alt="United States" />)
        const img = screen.getByRole('img')
        expect(img).toHaveAttribute('alt', 'United States')
    })

    it('handles lowercase code', () => {
        render(<CountryFlag code="us" />)
        const img = screen.getByRole('img')
        expect(img).toHaveAttribute('src', '/flags/us.svg')
    })

    it('returns null if no code is provided', () => {
        const { container } = render(<CountryFlag code="" />)
        expect(container).toBeEmptyDOMElement()
    })
})
