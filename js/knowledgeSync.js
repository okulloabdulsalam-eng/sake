/**
 * Knowledge Sync System - Online/Offline knowledge management
 * Fetches additional knowledge when online, caches for offline use
 */

class KnowledgeSync {
    constructor() {
        this.syncEndpoint = null; // Can be configured for API endpoint
        this.lastSyncTime = null;
        this.syncInterval = 24 * 60 * 60 * 1000; // 24 hours
        this.onlineSources = [];
    }

    async init() {
        await this.loadSyncState();
        await this.syncIfOnline();
        this.setupPeriodicSync();
    }

    async loadSyncState() {
        try {
            const saved = localStorage.getItem('knowledgeSyncState');
            if (saved) {
                const state = JSON.parse(saved);
                this.lastSyncTime = state.lastSyncTime;
                this.onlineSources = state.onlineSources || [];
            }
        } catch (error) {
            console.error('[Knowledge Sync] Error loading sync state:', error);
        }
    }

    async saveSyncState() {
        try {
            const state = {
                lastSyncTime: this.lastSyncTime,
                onlineSources: this.onlineSources
            };
            localStorage.setItem('knowledgeSyncState', JSON.stringify(state));
        } catch (error) {
            console.error('[Knowledge Sync] Error saving sync state:', error);
        }
    }

    async syncIfOnline() {
        if (!navigator.onLine) {
            console.log('[Knowledge Sync] Offline - using cached sources');
            return;
        }

        // Check if sync is needed
        const now = Date.now();
        if (this.lastSyncTime && (now - this.lastSyncTime) < this.syncInterval) {
            console.log('[Knowledge Sync] Sync not needed yet');
            return;
        }

        await this.syncKnowledge();
    }

    async syncKnowledge() {
        if (!navigator.onLine) {
            console.log('[Knowledge Sync] Cannot sync - offline');
            return;
        }

        try {
            console.log('[Knowledge Sync] Starting knowledge sync...');
            
            // Merge extended sources
            if (typeof knowledgeSourcesExtended !== 'undefined') {
                const extended = knowledgeSourcesExtended.getAllExtendedSources();
                this.onlineSources = extended;
                
                // Add to knowledge engine
                if (typeof knowledgeEngine !== 'undefined') {
                    knowledgeEngine.sources.push(...extended);
                    await knowledgeEngine.cacheSources();
                    await knowledgeEngine.indexKnowledge();
                }
            }

            // Future: Fetch from API if endpoint is configured
            // if (this.syncEndpoint) {
            //     const response = await fetch(this.syncEndpoint);
            //     const newSources = await response.json();
            //     this.onlineSources.push(...newSources);
            // }

            this.lastSyncTime = Date.now();
            await this.saveSyncState();

            console.log(`[Knowledge Sync] Sync complete. Total sources: ${this.onlineSources.length}`);
            
            showNotification(
                '[System] Knowledge Updated',
                `Knowledge base synced. ${this.onlineSources.length} additional sources available.`,
                'info',
                3000
            );

        } catch (error) {
            console.error('[Knowledge Sync] Sync error:', error);
        }
    }

    setupPeriodicSync() {
        // Sync every 24 hours when online
        setInterval(async () => {
            if (navigator.onLine) {
                await this.syncKnowledge();
            }
        }, this.syncInterval);
    }

    async forceSync() {
        this.lastSyncTime = null; // Force sync
        await this.syncKnowledge();
    }

    getOnlineSourcesCount() {
        return this.onlineSources.length;
    }

    getTotalSourcesCount() {
        if (typeof knowledgeEngine !== 'undefined') {
            return knowledgeEngine.sources.length;
        }
        return 0;
    }
}

const knowledgeSync = new KnowledgeSync();


