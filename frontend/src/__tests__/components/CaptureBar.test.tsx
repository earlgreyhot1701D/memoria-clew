import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CaptureBar } from '../../components/CaptureBar';
import React from 'react';

describe('CaptureBar', () => {
    it('renders input and button', () => {
        render(<CaptureBar onCapture={async () => { }} />);
        expect(screen.getByPlaceholderText(/PASTE URL OR CONTENT/i)).toBeInTheDocument();
        expect(screen.getByText('PROCESS')).toBeInTheDocument();
    });

    it('calls onCapture with input value', async () => {
        const mockCapture = vi.fn();
        render(<CaptureBar onCapture={mockCapture} />);

        const input = screen.getByPlaceholderText(/PASTE URL OR CONTENT/i);
        fireEvent.change(input, { target: { value: 'https://example.com' } });
        fireEvent.submit(screen.getByRole('button', { name: /process/i })); // Assuming button has proper type/label logic or form submit

        // Wait for async if needed, but here it's direct
        expect(mockCapture).toHaveBeenCalledWith('https://example.com');
    });
});
