/**
 * Knowledge Index - Fast search and retrieval system for knowledge sources
 * Creates searchable indexes for offline-first access
 */

class KnowledgeIndex {
    constructor() {
        this.index = new Map(); // domain -> sources
        this.fullTextIndex = new Map(); // keyword -> sources
        this.principleIndex = new Map(); // principle -> sources
        this.frameworkIndex = new Map(); // framework name -> sources
    }

    // Build searchable index from sources
    async buildIndex(sources) {
        console.log('[Knowledge Index] Building index from', sources.length, 'sources...');
        
        this.index.clear();
        this.fullTextIndex.clear();
        this.principleIndex.clear();
        this.frameworkIndex.clear();

        sources.forEach(source => {
            // Index by domain
            if (!this.index.has(source.domain)) {
                this.index.set(source.domain, []);
            }
            this.index.get(source.domain).push(source);

            // Build full-text index from all text fields
            const searchableText = [
                source.title,
                source.author,
                ...(source.keywords || []),
                ...(source.principles || []).map(p => p.name || p),
                ...(source.principles || []).map(p => p.description || ''),
                ...(source.frameworks || []).map(f => f.name || f.description || '')
            ].join(' ').toLowerCase();

            // Index individual words
            const words = searchableText.split(/\W+/).filter(w => w.length > 2);
            words.forEach(word => {
                if (!this.fullTextIndex.has(word)) {
                    this.fullTextIndex.set(word, []);
                }
                if (!this.fullTextIndex.get(word).includes(source)) {
                    this.fullTextIndex.get(word).push(source);
                }
            });

            // Index principles
            if (source.principles) {
                source.principles.forEach(principle => {
                    const principleName = (principle.name || principle).toLowerCase();
                    if (!this.principleIndex.has(principleName)) {
                        this.principleIndex.set(principleName, []);
                    }
                    if (!this.principleIndex.get(principleName).includes(source)) {
                        this.principleIndex.get(principleName).push(source);
                    }
                });
            }

            // Index frameworks
            if (source.frameworks) {
                source.frameworks.forEach(framework => {
                    const frameworkName = (framework.name || '').toLowerCase();
                    if (frameworkName) {
                        if (!this.frameworkIndex.has(frameworkName)) {
                            this.frameworkIndex.set(frameworkName, []);
                        }
                        if (!this.frameworkIndex.get(frameworkName).includes(source)) {
                            this.frameworkIndex.get(frameworkName).push(source);
                        }
                    }
                });
            }
        });

        console.log('[Knowledge Index] Index built:', {
            domains: this.index.size,
            keywords: this.fullTextIndex.size,
            principles: this.principleIndex.size,
            frameworks: this.frameworkIndex.size
        });
    }

    // Search knowledge sources
    async search(query, domain = null, limit = 10) {
        const lowerQuery = query.toLowerCase();
        const queryWords = lowerQuery.split(/\W+/).filter(w => w.length > 2);
        
        const results = new Map(); // source -> score

        // Search by domain first
        let candidateSources = [];
        if (domain) {
            candidateSources = this.index.get(domain) || [];
        } else {
            // Search all domains
            this.index.forEach(sources => {
                candidateSources.push(...sources);
            });
        }

        // Score sources based on query matches
        candidateSources.forEach(source => {
            let score = 0;

            // Exact title match
            if (source.title.toLowerCase().includes(lowerQuery)) {
                score += 100;
            }

            // Author match
            if (source.author.toLowerCase().includes(lowerQuery)) {
                score += 50;
            }

            // Keyword matches
            queryWords.forEach(word => {
                if (this.fullTextIndex.has(word)) {
                    const matchingSources = this.fullTextIndex.get(word);
                    if (matchingSources.includes(source)) {
                        score += 10;
                    }
                }

                // Check source keywords directly
                if (source.keywords) {
                    source.keywords.forEach(keyword => {
                        if (keyword.toLowerCase().includes(word)) {
                            score += 15;
                        }
                    });
                }
            });

            // Principle matches
            if (source.principles) {
                source.principles.forEach(principle => {
                    const principleText = (principle.name || principle).toLowerCase();
                    if (principleText.includes(lowerQuery)) {
                        score += 30;
                    }
                    if (principle.description && principle.description.toLowerCase().includes(lowerQuery)) {
                        score += 20;
                    }
                });
            }

            // Framework matches
            if (source.frameworks) {
                source.frameworks.forEach(framework => {
                    const frameworkText = (framework.name || framework.description || '').toLowerCase();
                    if (frameworkText.includes(lowerQuery)) {
                        score += 25;
                    }
                });
            }

            if (score > 0) {
                results.set(source, score);
            }
        });

        // Sort by score and return top results
        const sortedResults = Array.from(results.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([source]) => source);

        return sortedResults;
    }

    // Find sources by principle
    findSourcesByPrinciple(principleName) {
        const lowerName = principleName.toLowerCase();
        return this.principleIndex.get(lowerName) || [];
    }

    // Find sources by framework
    findSourcesByFramework(frameworkName) {
        const lowerName = frameworkName.toLowerCase();
        return this.frameworkIndex.get(lowerName) || [];
    }

    // Get random principle from domain
    getRandomPrinciple(domain) {
        const domainSources = this.index.get(domain) || [];
        if (domainSources.length === 0) return null;

        const source = utils.randomElement(domainSources);
        if (!source.principles || source.principles.length === 0) return null;

        const principle = utils.randomElement(source.principles);
        return {
            principle: principle.name || principle,
            description: principle.description || '',
            source: source
        };
    }

    // Get random framework from domain
    getRandomFramework(domain) {
        const domainSources = this.index.get(domain) || [];
        if (domainSources.length === 0) return null;

        const source = utils.randomElement(domainSources);
        if (!source.frameworks || source.frameworks.length === 0) return null;

        const framework = utils.randomElement(source.frameworks);
        return {
            framework: framework,
            source: source
        };
    }

    // Get random exercise from domain
    getRandomExercise(domain) {
        const domainSources = this.index.get(domain) || [];
        if (domainSources.length === 0) return null;

        const source = utils.randomElement(domainSources);
        if (!source.exercises || source.exercises.length === 0) return null;

        return {
            exercise: utils.randomElement(source.exercises),
            source: source
        };
    }

    // Get statistics
    getStats() {
        return {
            totalDomains: this.index.size,
            totalKeywords: this.fullTextIndex.size,
            totalPrinciples: this.principleIndex.size,
            totalFrameworks: this.frameworkIndex.size,
            sourcesPerDomain: Object.fromEntries(
                Array.from(this.index.entries()).map(([domain, sources]) => [domain, sources.length])
            )
        };
    }
}

// Export singleton instance
const knowledgeIndex = new KnowledgeIndex();


