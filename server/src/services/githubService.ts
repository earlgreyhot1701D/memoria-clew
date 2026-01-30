import axios from 'axios';
import { pino } from 'pino';
import { db } from './firestoreService.js';

const logger = pino();

const GITHUB_API = 'https://api.github.com';
const README_MAX_CHARS = 5000;
const CACHE_TTL = 86400000; // 24h

/**
 * Fetch user's GitHub repositories
 */
async function fetchUserRepos(githubToken: string, username: string): Promise<any[]> {
    try {
        const response = await axios.get(`${GITHUB_API}/users/${username}/repos`, {
            headers: {
                Authorization: `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
            params: {
                sort: 'updated',
                per_page: 10,
            },
        });

        logger.info({ count: response.data.length }, 'Fetched GitHub repos');
        return response.data;
    } catch (err: any) {
        logger.error({ error: err.message }, 'Failed to fetch GitHub repos');
        throw new Error('GitHub API error');
    }
}

/**
 * Fetch README content from a repository
 */
async function fetchReadme(githubToken: string, owner: string, repo: string): Promise<string | null> {
    try {
        const response = await axios.get(
            `${GITHUB_API}/repos/${owner}/${repo}/readme`,
            {
                headers: {
                    Authorization: `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3.raw',
                },
            }
        );

        const content = response.data.substring(0, README_MAX_CHARS);
        logger.info({ repo, length: content.length }, 'Fetched README');
        return content;
    } catch (err: any) {
        if (err.response?.status === 404) {
            logger.debug({ repo }, 'No README found');
            return null;
        }
        logger.warn({ repo, error: err.message }, 'Failed to fetch README');
        return null;
    }
}

/**
 * Extract tech keywords from content
 */
function deriveTechFingerprint(content: string): string[] {
    const keywords = [
        'typescript', 'javascript', 'python', 'java', 'go', 'rust',
        'react', 'vue', 'angular', 'svelte', 'nextjs',
        'nodejs', 'express', 'fastapi', 'django',
        'postgres', 'mysql', 'mongodb', 'redis', 'firestore',
        'docker', 'kubernetes', 'terraform', 'aws', 'gcp', 'azure',
        'graphql', 'rest', 'grpc',
        'ai', 'ml', 'gemini', 'claude', 'llm',
    ];

    const lowerContent = content.toLowerCase();
    const found = keywords.filter((keyword) =>
        new RegExp(`\\b${keyword}\\b`).test(lowerContent)
    );

    return [...new Set(found)];
}

/**
 * Seed GitHub context for a user
 */
export async function seedGitHubContext(
    githubToken: string,
    githubUsername: string
): Promise<{ repos: string; tags: string; reason: string }> {
    logger.info({ username: githubUsername }, 'Starting GitHub context seed');

    try {
        const cacheKey = `github-context-${githubUsername}`;
        const cached = await db.collection('memoria').doc(cacheKey).get();

        if (cached.exists && Date.now() - cached.data()!.timestamp < CACHE_TTL) {
            logger.info({ username: githubUsername }, 'Using cached GitHub context');
            return {
                repos: cached.data()!.repos.length,
                tags: cached.data()!.allTags.join(', '),
                reason: 'Served from 24h cache',
            };
        }

        const repos = await fetchUserRepos(githubToken, githubUsername);
        const contextData = [];
        const allTags = new Set<string>();

        for (const repo of repos) {
            const readme = await fetchReadme(githubToken, repo.owner.login, repo.name);
            const tags = deriveTechFingerprint(readme || '');
            tags.forEach((tag) => allTags.add(tag));

            contextData.push({
                id: repo.id,
                repoName: repo.name,
                description: repo.description || '',
                url: repo.html_url,
                tags: tags,
                timestamp: Date.now(),
            });

            logger.info({
                repo: repo.name,
                tags: tags.length,
            }, 'Processed repository');
        }

        await db.collection('memoria').doc(cacheKey).set({
            username: githubUsername,
            repos: contextData,
            allTags: Array.from(allTags),
            timestamp: Date.now(),
            cached: true,
        });

        logger.info({
            username: githubUsername,
            repoCount: repos.length,
            tagCount: allTags.size,
        }, 'GitHub context seeded successfully');

        return {
            repos: repos.length.toString(),
            tags: Array.from(allTags).join(', '),
            reason: 'Freshly seeded from GitHub API',
        };
    } catch (err: any) {
        logger.error({ error: err.message }, 'GitHub context seeding failed');
        throw err;
    }
}

/**
 * Get cached GitHub context
 */
export async function getGitHubContext(githubUsername: string): Promise<any> {
    try {
        const cacheKey = `github-context-${githubUsername}`;
        const doc = await db.collection('memoria').doc(cacheKey).get();

        if (!doc.exists) {
            logger.warn({ username: githubUsername }, 'No cached GitHub context found');
            return null;
        }

        return doc.data();
    } catch (err: any) {
        logger.error({ error: err.message }, 'Failed to retrieve GitHub context');
        return null;
    }
}
