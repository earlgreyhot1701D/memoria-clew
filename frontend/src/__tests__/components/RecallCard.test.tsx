import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecallCard } from '../../components/RecallCard';

const mockItem = {
    id: '1',
    title: 'Test Context',
    matchedTag: 'react',
    reason: 'Matched tag',
    confidence: 0.95,
    daysAgo: 2,
};

describe('RecallCard', () => {
    it('renders title and match info', () => {
        render(
            <RecallCard
                item={mockItem}
                onUseful={() => { }}
                onNotRelevant={() => { }}
                onDismiss={() => { }}
            />
        );
        expect(screen.getByText('Test Context')).toBeInTheDocument();
        expect(screen.getByText('CONTEXT_MATCH: REACT')).toBeInTheDocument();
    });

    it('handles interactions', () => {
        const onUseful = vi.fn();
        render(
            <RecallCard
                item={mockItem}
                onUseful={onUseful}
                onNotRelevant={() => { }}
                onDismiss={() => { }}
            />
        );

        fireEvent.click(screen.getByText('USEFUL'));
        expect(onUseful).toHaveBeenCalledWith('1');
    });
});
