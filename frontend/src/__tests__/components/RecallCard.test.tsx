import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecallCard } from '../../components/RecallCard';

const mockMatch = {
    archiveItemId: '1',
    title: 'Test Context',
    relevanceScore: 0.95,
    matchReason: 'Matched tag',
    summary: 'Test summary',
    tags: ['react'],
    url: 'http://example.com',
    source: 'manual' as const
};

describe('RecallCard', () => {
    it('renders title and match info', () => {
        render(
            <RecallCard
                match={mockMatch}
                onArchiveClick={() => { }}
            />
        );
        expect(screen.getByText('TEST CONTEXT')).toBeInTheDocument();
        expect(screen.getByText(/RECALL MATCH - 95%/)).toBeInTheDocument();
    });

    it('handles interactions', () => {
        const onArchiveClick = vi.fn();
        render(
            <RecallCard
                match={mockMatch}
                onArchiveClick={onArchiveClick}
            />
        );

        fireEvent.click(screen.getByText('VIEW IN ARCHIVE'));
        expect(onArchiveClick).toHaveBeenCalledWith('1');
    });
});
