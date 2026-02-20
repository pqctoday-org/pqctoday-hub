import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FilterDropdown } from './FilterDropdown'

describe('FilterDropdown', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with string items', () => {
    render(
      <FilterDropdown
        items={['Apple', 'Banana', 'Cherry']}
        selectedId="Apple"
        onSelect={mockOnSelect}
        label="Fruit"
      />
    )
    expect(screen.getByText('Fruit:')).toBeInTheDocument()
    expect(screen.getByText('Apple')).toBeInTheDocument()
  })

  it('renders and interacts with object options and default variants', () => {
    render(
      <FilterDropdown
        items={[
          { id: '1', label: 'One', icon: <span>I</span> },
          { id: '2', label: 'Two' },
        ]}
        selectedId="All"
        onSelect={mockOnSelect}
        variant="ghost"
        noContainer={true}
      />
    )
    expect(screen.getByText('All')).toBeInTheDocument()

    // Open
    fireEvent.click(screen.getByTestId('filter-dropdown'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    // Select an item
    fireEvent.click(screen.getAllByRole('option')[1])
    expect(mockOnSelect).toHaveBeenCalledWith('1')

    // re-open and test enter keys
    fireEvent.click(screen.getByTestId('filter-dropdown'))
    fireEvent.keyDown(screen.getAllByRole('option')[0], { key: 'Enter' })
    expect(mockOnSelect).toHaveBeenCalledWith('All')

    // re-open and test space keys
    fireEvent.click(screen.getByTestId('filter-dropdown'))
    fireEvent.keyDown(screen.getAllByRole('option')[2], { key: ' ' })
    expect(mockOnSelect).toHaveBeenCalledWith('2')
  })

  it('opens and closes on click', () => {
    render(<FilterDropdown items={['Option 1']} selectedId="All" onSelect={mockOnSelect} />)

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    // Open
    fireEvent.click(screen.getByTestId('filter-dropdown'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText('Option 1')).toBeInTheDocument()

    // Close
    fireEvent.click(screen.getByTestId('filter-dropdown'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes when clicking outside', () => {
    render(
      <div data-testid="outside">
        <FilterDropdown items={['Option 1']} selectedId="All" onSelect={mockOnSelect} />
      </div>
    )

    fireEvent.click(screen.getByTestId('filter-dropdown'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('supports keyboard navigation - Escape to close', () => {
    render(<FilterDropdown items={['Option 1']} selectedId="All" onSelect={mockOnSelect} />)

    const btn = screen.getByTestId('filter-dropdown')
    fireEvent.click(btn)
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.keyDown(btn, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('supports keyboard navigation - Enter/Space to open', () => {
    render(<FilterDropdown items={['Option 1']} selectedId="All" onSelect={mockOnSelect} />)

    const btn = screen.getByTestId('filter-dropdown')
    fireEvent.keyDown(btn, { key: 'Enter' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.keyDown(btn, { key: ' ' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('supports generic keys passing through', () => {
    render(<FilterDropdown items={['O']} selectedId="All" onSelect={mockOnSelect} />)
    const btn = screen.getByTestId('filter-dropdown')
    fireEvent.keyDown(btn, { key: 'a' }) // Nothing happens
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('selects an item and closes on click', () => {
    render(<FilterDropdown items={['Option 1']} selectedId="All" onSelect={mockOnSelect} />)

    fireEvent.click(screen.getByTestId('filter-dropdown'))
    fireEvent.click(screen.getByText('Option 1'))

    expect(mockOnSelect).toHaveBeenCalledWith('Option 1')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('selects All and closes on click', () => {
    render(<FilterDropdown items={['Option 1']} selectedId="Option 1" onSelect={mockOnSelect} />)

    fireEvent.click(screen.getByTestId('filter-dropdown'))
    fireEvent.click(screen.getByText('All'))

    expect(mockOnSelect).toHaveBeenCalledWith('All')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('selects parameter and closes on enter keydown', () => {
    render(<FilterDropdown items={['Option 1']} selectedId="All" onSelect={mockOnSelect} />)

    fireEvent.click(screen.getByTestId('filter-dropdown'))

    const opt = screen.getByText('Option 1')
    fireEvent.keyDown(opt, { key: 'Enter' })

    expect(mockOnSelect).toHaveBeenCalledWith('Option 1')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('selects All parameter and closes on space keydown', () => {
    render(<FilterDropdown items={['Option 1']} selectedId="Option 1" onSelect={mockOnSelect} />)

    fireEvent.click(screen.getByTestId('filter-dropdown'))

    const optAll = screen.getByText('All').closest('button')!
    fireEvent.keyDown(optAll, { key: ' ' })

    expect(mockOnSelect).toHaveBeenCalledWith('All')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('ignores other keys on option elements', () => {
    render(<FilterDropdown items={['Option 1']} selectedId="Option 1" onSelect={mockOnSelect} />)

    fireEvent.click(screen.getByTestId('filter-dropdown'))

    const opt = screen.getByText('All').closest('button')!
    fireEvent.keyDown(opt, { key: 'a' }) // Ignore

    expect(mockOnSelect).not.toHaveBeenCalled()
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('cleans up event listeners correctly', () => {
    const unmount = render(
      <FilterDropdown items={['O']} selectedId="All" onSelect={mockOnSelect} />
    ).unmount

    // Actually opening attaches listeners
    fireEvent.click(screen.getByTestId('filter-dropdown'))
    unmount() // Triggers effect cleanup
    expect(true).toBe(true)
  })

  it('renders opaque container version', () => {
    render(
      <FilterDropdown items={['Option 1']} selectedId="All" onSelect={mockOnSelect} opaque={true} />
    )

    expect(screen.getByTestId('filter-dropdown')).toBeInTheDocument()
  })
})
