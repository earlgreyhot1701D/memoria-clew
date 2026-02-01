import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

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
import { useRecall } from '../hooks/useRecall';
import { useArchiveSearch } from '../hooks/useArchiveSearch';
import '../styles/dashboard.css';
import '../styles/recall-card.css';

export const Dashboard: React.FC = () => {
    const { user, loading: authLoading, login } = useAuth();
    const { matches, explanation, loading: recallLoading, recall } = useRecall();

    // Switch to Local State + API for reliability (bypassing Firestore Rule issues)
    const [archiveItems, setArchiveItems] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]); // Local session logs

    const { context, syncContext, loading } = useGitHubContext();

    // Helper to add logs locally
    const addLog = (entry: any) => {
        setLogs(prev => [{ ...entry, timestamp: new Date().toISOString() }, ...prev]);
    };

    // Fetch Archive from API
    const fetchArchive = async () => {
        try {
            const res = await fetch('/api/archive');
            if (res.ok) {
                const json = await res.json();
                setArchiveItems(json.data || []);
                addLog({
                    action: 'ARCHIVE_SYNC',
                    details: `Retrieved ${json.data?.length || 0} items`
                });
            }
        } catch (err) {
            console.error('Failed to fetch archive', err);
        }
    };

    // Initial Load
    useEffect(() => {
        if (user) {
            fetchArchive();
            addLog({ action: 'SESSION_START', details: 'Dashboard loaded' });
        }
    }, [user]);

    const {
        searchQuery,
        setSearchQuery,
        selectedTag,
        setSelectedTag,
        filteredItems,
        allTags
    } = useArchiveSearch(archiveItems);

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

    const handleCapture = async (input: string) => {
        console.log('[Dashboard] handleCapture receiving:', input);
        try {
            // 1. Log start
            addLog({
                action: 'CAPTURE_INIT',
                details: input.length > 50 ? `${input.substring(0, 50)}...` : input
            });

            // 2. Call API
            const res = await fetch('/api/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: input })
            });

            if (!res.ok) throw new Error('Capture failed');

            const data = await res.json();

            // 3. Log success
            addLog({
                action: 'CAPTURE_SUCCESS',
                details: `ID: ${data.data.id}`
            });

            // 4. Refresh Data
            fetchArchive();

        } catch (err: any) {
            console.error(err);
            setError(err.message);
            addLog({
                action: 'CAPTURE_ERROR',
                details: err.message
            });
        }
    };

    // Trigger recall when context changes or manually (here manual as per req)
    const handleRecall = () => {
        console.log('[Dashboard] handleRecall triggered');
        // Derive tags from context + selected tag
        // context.repos[].tags
        const contextTags = context?.repos?.flatMap((r: any) => r.tags) || [];
        const activeTags = [...new Set([...(selectedTag ? [selectedTag] : []), ...contextTags])];

        console.log('[Dashboard] Recalling with tags:', activeTags);
        recall(activeTags, "Active dashboard session");
    };

    // Auto-trigger "Intelligence Stream" when context loads
    useEffect(() => {
        if (context && !recallLoading && matches.length === 0) {
            console.log('[Dashboard] Auto-triggering Intelligence Stream');
            addLog({ action: 'RECALL_INIT', details: 'Auto-refreshing context...' });
            handleRecall();
        } else if (matches.length > 0) {
            // Log when matches update (optional, but good for visibility)
            // Ideally we'd log this inside useRecall but that's a hook.
            // We can check if we just finished loading?
            // Simpler: useRecall could return a 'lastRun' timestamp or similar.
            // For now, let's just log the init.
        }
    }, [context, recallLoading, matches.length, handleRecall]);

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

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <CaptureBar onCapture={handleCapture} />
                        <StatusBar contextsSeeded={true} modelVersion="gemini-2.5-flash" promptVersion="v0.3" />
                    </div>
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
                    {/* INTELLIGENCE STREAM SECTION */}
                    <section className="card" style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h2 className="mono" style={{ margin: 0 }}>INTELLIGENCE_STREAM</h2>
                            <button
                                onClick={handleRecall}
                                disabled={recallLoading}
                                className="btn-minimal mono"
                                style={{ fontSize: '10px', padding: '2px 6px' }}
                            >
                                {recallLoading ? 'REFRESHING...' : 'REFRESH'}
                            </button>
                        </div>

                        {/* 
                        <button 
                            onClick={handleRecall}
                            disabled={recallLoading}
                            className="btn-black mono"
                            style={{ width: '100%', marginBottom: '10px' }}
                        >
                            {recallLoading ? 'RECALLING...' : 'TRIGGER RECALL'}
                        </button>
                        */}

                        {explanation && (
                            <div className="mono" style={{ fontSize: '10px', marginTop: '10px', color: '#0056b3', padding: '5px' }}>
                                {explanation}
                            </div>
                        )}

                        {!recallLoading && explanation && matches.length === 0 && (
                            <div className="mono" style={{ fontSize: '12px', marginTop: '10px', color: '#666', padding: '10px', textAlign: 'center' }}>
                                (No matches found for current context)
                            </div>
                        )}

                        {matches.length > 0 && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '12px',
                                marginTop: '15px'
                            }}>
                                {matches.map((match) => (
                                    <RecallCard
                                        key={match.archiveItemId}
                                        match={match}
                                        onArchiveClick={(id) => {
                                            // Navigate to or highlight archive item
                                            console.log('Navigate to archive item', id);
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
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
                        className="archive-grid"
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
