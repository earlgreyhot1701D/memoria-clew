import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CaptureBar } from '../../components/CaptureBar';

// Mock the hook
const mockCaptureUrl = vi.fn();
vi.mock('../../hooks/useCapture', () => ({
    useCapture: () => ({
        captureUrl: mockCaptureUrl,
        loading: false,
    }),
}));

describe('CaptureBar', () => {
    it('renders input and button', () => {
        render(<CaptureBar />);
        expect(screen.getByPlaceholderText(/PASTE URL OR CONTENT/i)).toBeInTheDocument();
        expect(screen.getByText('PROCESS')).toBeInTheDocument();
    });

    it('calls captureUrl and onCapture on submit', async () => {
        const mockOnCapture = vi.fn();
        mockCaptureUrl.mockResolvedValue({ id: '123', title: 'Test' });

        render(<CaptureBar onCapture={mockOnCapture} />);

        const input = screen.getByPlaceholderText(/PASTE URL OR CONTENT/i);
        fireEvent.change(input, { target: { value: 'https://example.com' } });
        fireEvent.submit(screen.getByRole('button', { name: /process/i }));

        await waitFor(() => {
            expect(mockCaptureUrl).toHaveBeenCalledWith('https://example.com');
            expect(mockOnCapture).toHaveBeenCalledWith({ id: '123', title: 'Test' });
        });
    });
});
