/**
 * Data Collection System - Automatically collects and stores user information
 * Stores activities, reports, and external data for later quest generation
 */

class DataCollection {
    constructor() {
        this.activities = [];
        this.collectedData = [];
        this.lastDataCollection = null;
        this.collectionInterval = null;
    }

    // Initialize data collection
    async init() {
        await this.loadCollectedData();
        this.setupPeriodicCollection();
    }

    // Load collected data from database
    async loadCollectedData() {
        try {
            const history = await db.getHistory(1000);
            this.collectedData = history.filter(h => 
                h.type === 'user_activity' || 
                h.type === 'user_report' || 
                h.type === 'ai_conversation_data'
            ) || [];
            this.activities = this.collectedData.filter(d => d.type === 'user_activity');
        } catch (error) {
            console.error('Error loading collected data:', error);
            this.collectedData = [];
            this.activities = [];
        }
    }

    // Store user activity/report (called by AI or report system)
    async storeActivity(activityText, source = 'user', metadata = {}) {
        const activity = {
            id: utils.generateId(),
            type: 'user_activity',
            content: activityText,
            source: source, // 'user', 'ai_conversation', 'external'
            metadata: metadata,
            timestamp: Date.now(),
            processed: false
        };

        this.activities.push(activity);
        this.collectedData.push(activity);
        await db.addHistory(activity);

        // Don't generate quest immediately - just store data
        return activity;
    }

    // Store user report from quest completion
    async storeReport(reportText, questId = null) {
        const report = {
            id: utils.generateId(),
            type: 'user_report',
            content: reportText,
            questId: questId,
            timestamp: Date.now(),
            processed: false
        };

        this.collectedData.push(report);
        await db.addHistory(report);

        return report;
    }

    // Get recent activities for analysis
    getRecentActivities(limit = 20) {
        return this.activities
            .filter(a => !a.processed)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    // Get all collected data
    getAllCollectedData(limit = 100) {
        return this.collectedData
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    // Mark activity as processed (used by quest generator)
    async markAsProcessed(activityId) {
        const activity = this.activities.find(a => a.id === activityId);
        if (activity) {
            activity.processed = true;
            await db.addHistory({ ...activity });
        }
    }

    // Setup periodic data collection prompts
    setupPeriodicCollection() {
        // Ask about user's day every 2-4 hours (randomized)
        const askInterval = () => {
            const hours = 2 + Math.random() * 2; // 2-4 hours
            const ms = hours * 60 * 60 * 1000;
            
            setTimeout(() => {
                this.triggerConversationalDataCollection();
                askInterval(); // Schedule next
            }, ms);
        };

        // Start first collection after 1 hour
        setTimeout(() => {
            askInterval();
        }, 60 * 60 * 1000);
    }

    // Trigger conversational data collection via AI
    async triggerConversationalDataCollection() {
        // Only if user hasn't submitted data recently (within last hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const recentData = this.collectedData.filter(d => d.timestamp > oneHourAgo);
        
        if (recentData.length === 0) {
            // AI will ask about user's day
            aiAssistant.askAboutDay();
        }
    }

    // Analyze collected data to extract patterns and opportunities
    analyzeDataForQuestGeneration() {
        const recentActivities = this.getRecentActivities(10);
        const analysis = {
            categories: {},
            keywords: [],
            themes: [],
            opportunities: []
        };

        // Analyze categories
        const categoryKeywords = {
            strategy: ['plan', 'strategic', 'organize', 'analyze', 'problem', 'decision'],
            social: ['meeting', 'friend', 'network', 'team', 'conversation', 'relationship'],
            financial: ['money', 'budget', 'invest', 'save', 'financial', 'negotiate', 'deal', 'client'],
            medical: ['study', 'learn', 'read', 'research', 'knowledge', 'education', 'exam'],
            fitness: ['exercise', 'workout', 'run', 'train', 'gym', 'health', 'physical']
        };

        recentActivities.forEach(activity => {
            const content = activity.content.toLowerCase();
            
            // Check categories
            for (const [category, keywords] of Object.entries(categoryKeywords)) {
                if (keywords.some(kw => content.includes(kw))) {
                    analysis.categories[category] = (analysis.categories[category] || 0) + 1;
                }
            }

            // Extract keywords
            const words = content.split(/\W+/).filter(w => w.length > 4);
            analysis.keywords.push(...words.slice(0, 5));
        });

        // Identify opportunities for quests
        Object.entries(analysis.categories).forEach(([category, count]) => {
            if (count >= 2) {
                analysis.opportunities.push({
                    category: category,
                    strength: count,
                    reason: `Multiple mentions of ${category} activities`
                });
            }
        });

        return analysis;
    }
}

// Export singleton instance
const dataCollection = new DataCollection();





