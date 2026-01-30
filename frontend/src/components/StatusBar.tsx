import React from 'react';

interface StatusBarProps {
    contextsSeeded: boolean;
    modelVersion: string;
    promptVersion: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
    contextsSeeded,
    modelVersion,
    promptVersion,
}) => (
    <div className="status-bar mono" aria-label="Application status">
        MEMORIA: {contextsSeeded ? 'READY' : 'LOADING'} // CONTEXT: SEEDED<br />
        SCAN: MANUAL (HN RSS) // MODEL: {modelVersion} // PROMPT: {promptVersion}
    </div>
);
