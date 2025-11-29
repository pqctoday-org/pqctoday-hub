import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KeyDetails } from './KeyDetails';
import type { Key } from '../../../types';
import React from 'react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, ...props }: React.ComponentProps<'div'>) => <div className={className} {...props}>{children}</div>,
    },
}));

describe('KeyDetails Component', () => {
    const mockKey: Key = {
        id: 'key-123',
        name: 'Test Key',
        algorithm: 'ML-KEM-768',
        type: 'public',
        value: '01020304', // Hex
        data: new Uint8Array([1, 2, 3, 4]),
        dataType: 'binary',
        timestamp: Date.now(),
    };

    beforeEach(() => {
        // Mock clipboard
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn(),
            },
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders key information correctly', () => {
        render(<KeyDetails selectedKey={mockKey} />);
        expect(screen.getByText('Test Key')).toBeDefined();
        expect(screen.getByText(/ID: key-123/)).toBeDefined();
        expect(screen.getByText('ML-KEM-768')).toBeDefined();
    });

    it('displays raw value in HEX by default', () => {
        render(<KeyDetails selectedKey={mockKey} />);
        const rawInput = screen.getByLabelText(/Raw Value/i);
        expect((rawInput as HTMLTextAreaElement).value).toBe('01020304');
    });

    it('switches to ASCII mode', () => {
        render(<KeyDetails selectedKey={mockKey} />);
        // There are two "ASCII" buttons (one for Raw, one for PKCS8 which says "PEM" but button text might be ASCII? No, code says PEM for PKCS8).
        // Let's check KeyDetails code.
        // Raw: HEX / ASCII
        // PKCS8: HEX / PEM
        // So "ASCII" button should be unique to Raw section.
        const asciiBtn = screen.getByRole('button', { name: 'ASCII' });
        fireEvent.click(asciiBtn);

        const rawInput = screen.getByLabelText(/Raw Value/i);
        // 01 02 03 04 -> non-printable -> dots
        expect((rawInput as HTMLTextAreaElement).value).toBe('....');
    });

    it('copies raw value to clipboard', async () => {
        render(<KeyDetails selectedKey={mockKey} />);
        const copyBtns = screen.getAllByTitle('Copy to clipboard');
        const rawCopyBtn = copyBtns[0]; // First one is for Raw Value

        fireEvent.click(rawCopyBtn);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('01020304');
    });
});
