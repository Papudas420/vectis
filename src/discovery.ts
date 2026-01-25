import axios from 'axios';
import * as cheerio from 'cheerio';
import { LRUCache } from 'lru-cache';

export interface SkillMetadata {
    url: string;
    name: string;
    owner: string;
    repoUrl: string; // owner/repo
    skillName: string; // the specific skill name
    description?: string;
}

export class DiscoveryModule {
    private sitemapUrl = 'https://skills.sh/sitemap.xml';
    private homepageUrl = 'https://skills.sh/';
    private skillCache = new LRUCache<string, SkillMetadata[]>({
        max: 100,
        ttl: 1000 * 60 * 60 * 24, // 24 hours
    });

    // Map of "owner/skillName" -> downloadCount (as number)
    private popularityMap = new Map<string, number>();

    constructor() {
        this.fetchPopularityData().catch(err => {
            // Silently fail or use console.error for discovery issues
            console.error('Failed to initialize popularity data:', err);
        });
    }

    /**
     * Fetches the homepage and parses the leaderboard for popularity data.
     */
    private async fetchPopularityData(): Promise<void> {
        try {
            const response = await axios.get(this.homepageUrl, { timeout: 15000 });
            const $ = cheerio.load(response.data);

            // The structure according to read_url_content seems to have skill names in h3 or complex text
            // We'll look for links like /owner/repo/skillName and the text next to it
            $('a[href^="https://skills.sh/"]').each((_, el) => {
                const href = $(el).attr('href') || '';
                const text = $(el).text();

                // Extract slug: owner/repo/skillName
                const slug = href.replace('https://skills.sh/', '').trim();
                const parts = slug.split('/');

                if (parts.length >= 2) {
                    const key = `${parts[0]}/${parts[parts.length - 1]}`; // owner/skillName

                    // Regex to find 12.4K or similar numbers in text
                    const match = text.match(/(\d+\.?\d*)K/);
                    if (match) {
                        const count = parseFloat(match[1]) * 1000;
                        this.popularityMap.set(key, count);
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching popularity data:', error);
        }
    }

    /**
     * Fetches the sitemap and extracts all skill URLs.
     */
    async getAllSkillUrls(): Promise<string[]> {
        try {
            const response = await axios.get(this.sitemapUrl, { timeout: 10000 });
            const $ = cheerio.load(response.data, { xmlMode: true });
            const urls: string[] = [];

            $('loc').each((_, element) => {
                const url = $(element).text();
                if (url.startsWith('https://skills.sh/') && url.split('/').length > 4) {
                    urls.push(url);
                }
            });

            return urls;
        } catch (error) {
            console.error('Error fetching sitemap:', error);
            return [];
        }
    }

    /**
     * Matches a user query against skill URLs.
     */
    async searchSkills(query: string): Promise<SkillMetadata[]> {
        const cached = this.skillCache.get(query);
        if (cached) return cached;

        const allUrls = await this.getAllSkillUrls();
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/).filter(word => word.length > 2);

        const matches = allUrls
            .map(url => {
                const fullSlug = url.replace('https://skills.sh/', '');
                const parts = fullSlug.split('/');
                const owner = parts[0].toLowerCase();
                const skillName = parts[parts.length - 1].toLowerCase();

                let score = 0;

                // 1. Exact match (High priority)
                if (skillName.includes(queryLower)) score += 20;

                // 2. Word-based fuzzy match
                for (const word of queryWords) {
                    if (skillName.includes(word)) score += 10;
                    if (owner.includes(word)) score += 5;
                    if (fullSlug.includes(word)) score += 2;
                }

                // 3. Normalization: Extra points if word in repo name
                if (parts[1] && queryWords.some(w => parts[1].toLowerCase().includes(w))) score += 5;

                // 4. Popularity Boost
                const popularityKey = `${parts[0]}/${parts[parts.length - 1]}`;
                const downloadCount = this.popularityMap.get(popularityKey) || 0;
                if (downloadCount > 0) {
                    // Logarithmic boost for popularity to keep it balanced with relevance
                    score += Math.log10(downloadCount) * 5;
                }

                return {
                    url,
                    name: parts[parts.length - 1],
                    owner: parts[0],
                    repoUrl: parts.length > 2 ? `${parts[0]}/${parts[1]}` : fullSlug,
                    skillName: parts[parts.length - 1],
                    score
                };
            })
            .filter(m => m.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Daha fazla sonuç dönelim ki LLM seçebilsin

        const fullMetadata: SkillMetadata[] = await Promise.all(
            matches.map(async m => {
                const description = await this.fetchSkillDescription(m.url);
                return {
                    url: m.url,
                    name: m.name,
                    owner: m.owner,
                    repoUrl: m.repoUrl,
                    skillName: m.skillName,
                    description
                };
            })
        );

        this.skillCache.set(query, fullMetadata);
        return fullMetadata;
    }

    /**
     * Fetches the description of a specific skill from its page.
     */
    private async fetchSkillDescription(url: string): Promise<string> {
        try {
            const response = await axios.get(url, { timeout: 10000 });
            const $ = cheerio.load(response.data);

            const metaDesc = $('meta[name="description"]').attr('content') ||
                $('meta[property="og:description"]').attr('content');

            if (metaDesc) return metaDesc;

            const firstPara = $('p').first().text().trim();
            return firstPara.substring(0, 200) + (firstPara.length > 200 ? '...' : '');
        } catch (error) {
            return 'Description not available.';
        }
    }
}
