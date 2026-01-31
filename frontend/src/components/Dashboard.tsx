import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { useGitHubContext } from '../hooks/useGitHubContext';
import { Header } from './Header';
import { StatusBar } from './StatusBar';
import { CaptureBar } from './CaptureBar';
import { RecallCard } from './RecallCard';
import { ArchiveCard } from './ArchiveCard';
import { ArchiveFilter } from './ArchiveFilter';
import { SystemLog } from './SystemLog';
import { ErrorBanner } from './ErrorBanner';
import { OnboardingTooltip } from './OnboardingTooltip';
import { useArchiveSearch } from '../hooks/useArchiveSearch';
import '../styles/dashboard.css';
import '../styles/recall-card.css';

export const Dashboard: React.FC = () => {
    const { user, loading: authLoading, login } = useAuth();
    const { data: archiveItems } = useFirestore('archive');
    const { data: recallCards } = useFirestore('recalls');
    const { data: logs } = useFirestore('logs');
    const { context, syncContext, loading } = useGitHubContext();

    const {
        searchQuery,
        setSearchQuery,
        selectedTag,
        setSelectedTag,
        filteredItems,
        allTags
    } = useArchiveSearch(archiveItems || []);

    const [error, setError] = useState<string | null>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        const seen = localStorage.getItem('memoria_onboarding_seen');
        if (!seen) {
            setShowOnboarding(true);
        }
    }, []);

    const handleDismissOnboarding = () => {
        localStorage.setItem('memoria_onboarding_seen', 'true');
        setShowOnboarding(false);
    };

    const handleShowOnboarding = () => {
        // Resetting allows user to see it again manually
        localStorage.removeItem('memoria_onboarding_seen');
        setShowOnboarding(true);
    };

    if (authLoading) {
        return <div className="mono">LOADING...</div>;
    }

    if (!user) {
        return (
            <div className="mono" style={{ padding: '40px' }}>
                <h1>MEMORIA CLEW</h1>
                <p>Sign in to continue</p>
                <button className="btn-black mono" onClick={login}>
                    SIGN IN WITH GOOGLE
                </button>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <a className="skip-link mono" href="#main-content">
                Skip to main content
            </a>

            <StatusBar contextsSeeded={true} modelVersion="gemini-2.5-flash" promptVersion="v0.3" />

            <div className="dashboard-grid">
                <section className="top-tools" aria-label="Primary actions">
                    <div className="sync-card card" aria-label="Context sources">
                        <div>
                            <div className="mono" style={{ fontSize: '10px' }}>
                                CONTEXT_SOURCES
                            </div>
                            <div className="mono" style={{ fontSize: '14px' }}>
                                GITHUB: <span style={{ color: '#00FF00' }}>OK</span> //
                                README: <span style={{ color: '#00FF00' }}>OK</span> //
                                ARCHIVE: <span style={{ color: '#00FF00' }}>OK</span>
                            </div>
                        </div>
                    </div>

                    <CaptureBar
                        onCapture={async (input) => {
                            console.log('Capturing:', input);
                        }}
                    />
                </section>

                {error && (
                    <ErrorBanner message={error} onDismiss={() => setError(null)} />
                )}

                <Header
                    contextStatus="ok"
                    scanReady={true}
                    onShowOnboarding={handleShowOnboarding}
                />

                {showOnboarding && (
                    <OnboardingTooltip onDismiss={handleDismissOnboarding} />
                )}

                <aside aria-label="Build context">
                    <h2 className="mono">BUILD_CONTEXT</h2>
                    <button
                        onClick={syncContext}
                        className="btn-minimal mono"
                        disabled={loading}
                        style={{ marginBottom: '15px', width: '100%' }}
                    >
                        {loading ? 'SYNCING...' : 'SYNC GITHUB'}
                    </button>
                    {context?.repos?.map((repo: any) => (
                        <div
                            key={repo.id}
                            className="card"
                            style={{ marginBottom: '15px', padding: '15px' }}
                        >
                            <a
                                href={repo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mono"
                                style={{ fontSize: '13px', fontWeight: 'bold', color: '#007bff', textDecoration: 'none' }}
                            >
                                {repo.repoName}
                            </a>
                            <p className="mono" style={{ fontSize: '9px', marginTop: '5px', color: '#ff0033' }}>
                                TAGS: {repo.tags.join(', ')}
                            </p>
                        </div>
                    ))}
                </aside>

                <main id="main-content" aria-label="Main content">
                    {recallCards?.length > 0 && (
                        <RecallCard
                            item={recallCards[0]}
                            onUseful={() => console.log('Useful')}
                            onNotRelevant={() => console.log('Not relevant')}
                            onDismiss={() => console.log('Dismissed')}
                        />
                    )}
                </main>

                <SystemLog entries={logs || []} />

                <section
                    className="card"
                    style={{ gridColumn: '1 / -1', marginTop: '20px', borderTop: '4px solid #000' }}
                    aria-label="Knowledge archive"
                >
                    <h2 className="mono">KNOWLEDGE_ARCHIVE</h2>

                    <ArchiveFilter
                        tags={allTags}
                        selectedTag={selectedTag}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onTagSelect={setSelectedTag}
                    />

                    <div className="mono" style={{ fontSize: '10px', marginBottom: '10px', color: '#666' }}>
                        ITEMS: {filteredItems.length}
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '20px',
                            marginTop: '20px',
                        }}
                        role="list"
                    >
                        {filteredItems.length === 0 ? (
                            <p className="mono" style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center', color: '#888' }}>
                                NO_ITEMS_FOUND
                            </p>
                        ) : (
                            filteredItems.map((item) => (
                                <ArchiveCard
                                    key={item.id}
                                    item={item}
                                    onTagSelect={setSelectedTag}
                                />
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};
