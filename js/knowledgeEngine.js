/**
 * Knowledge Engine - Core orchestration for knowledge-backed quest generation
 * Manages knowledge sources, indexing, and quest translation
 */

class KnowledgeEngine {
    constructor() {
        this.sources = [];
        this.indexed = false;
        this.offlineMode = false;
        this.lastSyncTime = null;
    }

    // Initialize knowledge engine
    async init() {
        console.log('[Knowledge Engine] Initializing...');
        
        // Load knowledge sources
        await this.loadKnowledgeSources();
        
        // Check online status
        this.offlineMode = !navigator.onLine;
        
        // Index knowledge for fast retrieval
        await this.indexKnowledge();
        
        // Setup online/offline listeners
        this.setupNetworkListeners();
        
        console.log(`[Knowledge Engine] Initialized with ${this.sources.length} sources (${this.offlineMode ? 'OFFLINE' : 'ONLINE'})`);
    }

    // Load knowledge sources from knowledgeSources.js
    async loadKnowledgeSources() {
        try {
            // Import all knowledge sources
            if (typeof knowledgeSources !== 'undefined') {
                this.sources = knowledgeSources.getAllSources();
            } else {
                console.warn('[Knowledge Engine] knowledgeSources not loaded, using fallback');
                this.sources = [];
            }
            
            // Load extended sources if available
            if (typeof knowledgeSourcesExtended !== 'undefined') {
                const extended = knowledgeSourcesExtended.getAllExtendedSources();
                this.sources.push(...extended);
                console.log(`[Knowledge Engine] Added ${extended.length} extended sources`);
            }
            
            // Load from IndexedDB cache
            const cached = await db.getKnowledgeSources();
            if (cached && cached.length > 0) {
                // Merge with loaded sources (cached takes priority for offline)
                const cachedMap = new Map(cached.map(s => [s.id, s]));
                this.sources.forEach(source => {
                    if (!cachedMap.has(source.id)) {
                        cachedMap.set(source.id, source);
                    }
                });
                this.sources = Array.from(cachedMap.values());
            }
            
            console.log(`[Knowledge Engine] Loaded ${this.sources.length} knowledge sources`);
        } catch (error) {
            console.error('[Knowledge Engine] Error loading sources:', error);
            this.sources = [];
        }
    }

    // Index knowledge for fast retrieval
    async indexKnowledge() {
        if (this.indexed) return;
        
        try {
            // Use knowledgeIndex to create searchable index
            if (typeof knowledgeIndex !== 'undefined') {
                await knowledgeIndex.buildIndex(this.sources);
                this.indexed = true;
                console.log('[Knowledge Engine] Knowledge indexed successfully');
            }
        } catch (error) {
            console.error('[Knowledge Engine] Error indexing knowledge:', error);
        }
    }

    // Get sources by domain
    getSourcesByDomain(domain) {
        return this.sources.filter(s => s.domain === domain);
    }

    // Get source by ID
    getSource(sourceId) {
        return this.sources.find(s => s.id === sourceId);
    }

    // Get all domains
    getDomains() {
        const domains = new Set(this.sources.map(s => s.domain));
        return Array.from(domains);
    }

    // Get random source for a domain
    getRandomSource(domain) {
        const domainSources = this.getSourcesByDomain(domain);
        if (domainSources.length === 0) return null;
        return utils.randomElement(domainSources);
    }

    // Get random principle from a domain
    getRandomPrinciple(domain) {
        const source = this.getRandomSource(domain);
        if (!source || !source.principles || source.principles.length === 0) {
            return null;
        }
        return {
            principle: utils.randomElement(source.principles),
            source: source
        };
    }

    // Get framework for a domain
    getFramework(domain, frameworkName = null) {
        const domainSources = this.getSourcesByDomain(domain);
        
        for (const source of domainSources) {
            if (source.frameworks && source.frameworks.length > 0) {
                if (frameworkName) {
                    const framework = source.frameworks.find(f => 
                        f.name.toLowerCase().includes(frameworkName.toLowerCase())
                    );
                    if (framework) {
                        return { framework, source };
                    }
                } else {
                    // Return random framework
                    const framework = utils.randomElement(source.frameworks);
                    return { framework, source };
                }
            }
        }
        
        return null;
    }

    // Get exercise for a domain
    getExercise(domain) {
        const domainSources = this.getSourcesByDomain(domain);
        
        for (const source of domainSources) {
            if (source.exercises && source.exercises.length > 0) {
                return {
                    exercise: utils.randomElement(source.exercises),
                    source: source
                };
            }
        }
        
        return null;
    }

    // Search knowledge (uses knowledgeIndex if available)
    async searchKnowledge(query, domain = null, limit = 10) {
        try {
            if (typeof knowledgeIndex !== 'undefined' && this.indexed) {
                return await knowledgeIndex.search(query, domain, limit);
            }
            
            // Fallback: simple text search
            const lowerQuery = query.toLowerCase();
            let results = this.sources;
            
            if (domain) {
                results = results.filter(s => s.domain === domain);
            }
            
            results = results.filter(source => {
                const searchText = [
                    source.title,
                    source.author,
                    source.domain,
                    ...(source.principles || []).map(p => p.name || p),
                    ...(source.frameworks || []).map(f => f.name || f.description || ''),
                    ...(source.keywords || [])
                ].join(' ').toLowerCase();
                
                return searchText.includes(lowerQuery);
            });
            
            return results.slice(0, limit);
        } catch (error) {
            console.error('[Knowledge Engine] Search error:', error);
            return [];
        }
    }

    // Generate quest from knowledge (uses knowledgeQuestTranslator)
    async generateQuestFromKnowledge(domain, context = {}) {
        try {
            if (typeof knowledgeQuestTranslator !== 'undefined') {
                return await knowledgeQuestTranslator.translateToQuest(domain, context, this);
            }
            
            // Fallback: simple quest generation
            const principleData = this.getRandomPrinciple(domain);
            if (!principleData) {
                return null;
            }
            
            const { principle, source } = principleData;
            const playerData = gameEngine.getPlayerData();
            
            return {
                id: utils.generateId(),
                title: `[${domain.charAt(0).toUpperCase() + domain.slice(1)} Quest] Apply: ${principle.name || principle}`,
                description: `Apply the principle "${principle.name || principle}" from ${source.title} in a real-world context.`,
                category: domain,
                questType: 'knowledge_backed',
                difficulty: 'medium',
                timeFrame: 'week',
                xp: 100,
                stats: this.getStatRewardsForDomain(domain),
                skillPoints: 0,
                status: 'pending',
                createdAt: Date.now(),
                knowledgeSource: {
                    sourceId: source.id,
                    sourceTitle: source.title,
                    author: source.author,
                    principle: principle.name || principle
                },
                autoAccepted: false
            };
        } catch (error) {
            console.error('[Knowledge Engine] Quest generation error:', error);
            return null;
        }
    }

    // Get stat rewards for domain
    getStatRewardsForDomain(domain) {
        const domainStats = {
            strategy: { strategy: 10, intelligence: 5 },
            medicine: { medical: 12, intelligence: 8, wisdom: 5 },
            economics: { financial: 12, strategy: 6, intelligence: 5 },
            finance: { financial: 15, strategy: 5 },
            social: { social: 12, wisdom: 5 },
            psychology: { intelligence: 10, wisdom: 8, social: 5 },
            leadership: { social: 12, strategy: 8, wisdom: 5 },
            power: { strategy: 12, social: 8, intelligence: 5 },
            systems: { intelligence: 12, strategy: 10, wisdom: 5 },
            learning: { intelligence: 15, wisdom: 8 }
        };
        
        return domainStats[domain] || { intelligence: 10 };
    }

    // Cache sources to IndexedDB
    async cacheSources() {
        try {
            await db.saveKnowledgeSources(this.sources);
            console.log('[Knowledge Engine] Sources cached to IndexedDB');
        } catch (error) {
            console.error('[Knowledge Engine] Error caching sources:', error);
        }
    }

    // Sync sources when online
    async syncSources() {
        if (this.offlineMode) {
            console.log('[Knowledge Engine] Offline mode - skipping sync');
            return;
        }
        
        try {
            // Use knowledge sync system if available
            if (typeof knowledgeSync !== 'undefined') {
                await knowledgeSync.syncKnowledge();
            }
            
            // Update cache
            await this.cacheSources();
            this.lastSyncTime = Date.now();
            
            // Re-index after sync
            await this.indexKnowledge();
            
            console.log('[Knowledge Engine] Sources synced');
        } catch (error) {
            console.error('[Knowledge Engine] Sync error:', error);
        }
    }

    // Setup network listeners
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.offlineMode = false;
            console.log('[Knowledge Engine] Online - syncing sources');
            this.syncSources();
        });
        
        window.addEventListener('offline', () => {
            this.offlineMode = true;
            console.log('[Knowledge Engine] Offline mode activated');
        });
    }

    // Verify knowledge coverage
    verifyCoverage() {
        const requiredDomains = [
            'strategy', 'medicine', 'economics', 'finance', 'social',
            'psychology', 'leadership', 'power', 'systems', 'learning'
        ];
        
        const coverage = {};
        requiredDomains.forEach(domain => {
            const sources = this.getSourcesByDomain(domain);
            coverage[domain] = {
                count: sources.length,
                sufficient: sources.length >= 10
            };
        });
        
        return coverage;
    }

    // Get coverage report
    getCoverageReport() {
        const coverage = this.verifyCoverage();
        const totalSources = this.sources.length;
        const domains = Object.keys(coverage);
        const sufficientDomains = domains.filter(d => coverage[d].sufficient).length;
        
        return {
            totalSources,
            domains: domains.length,
            sufficientDomains,
            coverage,
            allSufficient: sufficientDomains === domains.length
        };
    }
}

// Export singleton instance
const knowledgeEngine = new KnowledgeEngine();

