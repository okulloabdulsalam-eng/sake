/**
 * Background Quest Generator - Automatically generates quests from stored data
 * Runs periodically, analyzes collected data, and presents quests automatically
 */

class BackgroundQuestGenerator {
    constructor() {
        this.isRunning = false;
        this.lastGenerationTime = null;
        this.generationInterval = null;
        this.minIntervalMinutes = 30; // Minimum 30 minutes between generations
        this.maxIntervalMinutes = 180; // Maximum 3 hours
    }

    // Initialize background quest generator
    async init() {
        // Load last generation time
        const saved = localStorage.getItem('lastQuestGeneration');
        if (saved) {
            this.lastGenerationTime = parseInt(saved);
        }

        // Start background generation
        this.startBackgroundGeneration();
    }

    // Start background quest generation process
    startBackgroundGeneration() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        // Generate first quest after a delay (5-15 minutes)
        const initialDelay = (5 + Math.random() * 10) * 60 * 1000;
        
        setTimeout(() => {
            this.attemptQuestGeneration();
            this.scheduleNextGeneration();
        }, initialDelay);
    }

    // Schedule next quest generation
    scheduleNextGeneration() {
        if (!this.isRunning) return;

        // Random interval between min and max
        const intervalMinutes = this.minIntervalMinutes + 
            Math.random() * (this.maxIntervalMinutes - this.minIntervalMinutes);
        const intervalMs = intervalMinutes * 60 * 1000;

        this.generationInterval = setTimeout(() => {
            this.attemptQuestGeneration();
            this.scheduleNextGeneration();
        }, intervalMs);
    }

    // Attempt to generate a quest based on stored data
    async attemptQuestGeneration() {
        try {
            // Check if enough time has passed
            const now = Date.now();
            if (this.lastGenerationTime) {
                const timeSinceLastGeneration = now - this.lastGenerationTime;
                const minIntervalMs = this.minIntervalMinutes * 60 * 1000;
                if (timeSinceLastGeneration < minIntervalMs) {
                    return; // Too soon, skip this attempt
                }
            }

            // Analyze collected data
            const analysis = dataCollection.analyzeDataForQuestGeneration();
            
            // Check if there's enough data to generate a meaningful quest
            const recentActivities = dataCollection.getRecentActivities(5);
            if (recentActivities.length === 0) {
                // Not enough data yet, wait longer
                return;
            }

            // Determine if we should generate a quest (70% chance if there's good data)
            const shouldGenerate = recentActivities.length >= 2 && Math.random() > 0.3;

            if (shouldGenerate) {
                await this.generateQuestFromData(analysis, recentActivities);
            }

        } catch (error) {
            console.error('Error in background quest generation:', error);
        }
    }

    // Generate quest from analyzed data
    async generateQuestFromData(analysis, activities) {
        // Select category based on analysis
        let selectedCategory = 'strategy'; // Default
        
        if (analysis.opportunities.length > 0) {
            // Use the strongest opportunity
            const strongest = analysis.opportunities.reduce((prev, curr) => 
                curr.strength > prev.strength ? curr : prev
            );
            selectedCategory = strongest.category;
        } else {
            // Random category if no clear pattern
            const categories = ['strategy', 'social', 'financial', 'medical', 'fitness'];
            selectedCategory = utils.randomElement(categories);
        }

        // Create quest based on recent activities
        const activityContext = this.extractQuestContext(activities, selectedCategory);
        
        // Generate quest using AI quest generator
        const quest = await this.createQuestFromContext(activityContext, selectedCategory);
        
        // Add quest to system
        await questSystem.addQuest(quest);
        
        // Auto-accept the quest
        await questSystem.acceptQuest(quest.id);
        
        // Show notification
        showNotification(
            '[System] New Quest Assigned',
            `"${quest.title}" has been automatically assigned based on your recent activities.`,
            'quest-assign'
        );

        // Update last generation time
        this.lastGenerationTime = Date.now();
        localStorage.setItem('lastQuestGeneration', this.lastGenerationTime.toString());

        // Update UI
        questSystem.renderQuests();
        questSystem.renderActiveQuestsPreview();

        // Mark processed activities
        activities.forEach(activity => {
            dataCollection.markAsProcessed(activity.id);
        });

        return quest;
    }

    // Extract quest context from activities
    extractQuestContext(activities, category) {
        // Combine recent activities related to the category
        const categoryKeywords = {
            strategy: ['plan', 'strategic', 'organize', 'analyze', 'problem', 'decision'],
            social: ['meeting', 'friend', 'network', 'team', 'conversation', 'relationship'],
            financial: ['money', 'budget', 'invest', 'save', 'financial', 'negotiate', 'deal'],
            medical: ['study', 'learn', 'read', 'research', 'knowledge', 'education'],
            fitness: ['exercise', 'workout', 'run', 'train', 'gym', 'health', 'physical']
        };

        const keywords = categoryKeywords[category] || [];
        const relevantActivities = activities.filter(activity => 
            keywords.some(kw => activity.content.toLowerCase().includes(kw))
        );

        if (relevantActivities.length > 0) {
            // Use the most recent relevant activity as context
            return relevantActivities[0].content;
        }

        // Fallback: use most recent activity
        return activities[0].content;
    }

    // Create quest from context using AI quest generator
    async createQuestFromContext(context, category) {
        // Try knowledge-backed quest generation first
        let quest = null;
        
        if (typeof knowledgeEngine !== 'undefined' && knowledgeEngine.sources.length > 0) {
            const domain = this.mapCategoryToDomain(category);
            
            try {
                quest = await knowledgeEngine.generateQuestFromKnowledge(domain, {
                    userInput: context,
                    category: category
                });
                
                if (quest && typeof knowledgeQuestTranslator !== 'undefined') {
                    const validation = knowledgeQuestTranslator.validateQuest(quest);
                    if (!validation.valid) {
                        quest = null;
                    }
                }
            } catch (error) {
                console.error('[Background Quest Generator] Error generating knowledge quest:', error);
            }
        }
        
        // Fallback to regular AI quest generator
        if (!quest) {
            quest = await aiQuestGenerator.generateQuestFromInput(context);
            quest.category = category;
        }
        
        return quest;
    }

    // Map category to knowledge domain
    mapCategoryToDomain(category) {
        const mapping = {
            strategy: 'strategy',
            social: 'social',
            financial: 'finance',
            medical: 'medicine',
            fitness: 'learning'
        };
        return mapping[category] || 'strategy';
    }

    // Stop background generation
    stop() {
        this.isRunning = false;
        if (this.generationInterval) {
            clearTimeout(this.generationInterval);
            this.generationInterval = null;
        }
    }
}

// Export singleton instance
const backgroundQuestGenerator = new BackgroundQuestGenerator();




