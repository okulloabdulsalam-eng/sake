/**
 * AI Quest Generator - Real-time quest generation from user input
 * Analyzes user text/audio to create contextual, practical quests
 */

class AIQuestGenerator {
    constructor() {
        this.userInputs = [];
        this.contextHistory = [];
    }

    // Initialize AI Quest Generator
    async init() {
        await this.loadUserInputs();
    }

    // Load user inputs from database
    async loadUserInputs() {
        try {
            const history = await db.getHistory(100);
            this.userInputs = history.filter(h => h.type === 'user_activity_input') || [];
        } catch (error) {
            console.error('Error loading user inputs:', error);
            this.userInputs = [];
        }
    }

    // Save user input for offline storage
    async saveUserInput(input, context = {}) {
        const inputRecord = {
            id: utils.generateId(),
            type: 'user_activity_input',
            content: input,
            context: context,
            timestamp: Date.now(),
            processed: false
        };
        
        this.userInputs.push(inputRecord);
        await db.addHistory(inputRecord);
        return inputRecord;
    }

    // Analyze user input and extract context
    analyzeInput(input) {
        const lowerInput = input.toLowerCase();
        const context = {
            categories: [],
            difficulty: 'medium',
            timeFrame: 'today',
            keywords: [],
            activities: [],
            goals: [],
            emotions: []
        };

        // Extract categories
        const categoryKeywords = {
            strategy: ['plan', 'strategic', 'organize', 'optimize', 'analyze', 'problem', 'solve', 'decision', 'manage'],
            social: ['meeting', 'friend', 'network', 'team', 'conversation', 'relationship', 'social', 'group', 'community', 'lead'],
            financial: ['money', 'budget', 'invest', 'save', 'financial', 'negotiate', 'deal', 'client', 'business', 'income'],
            medical: ['study', 'learn', 'read', 'research', 'knowledge', 'education', 'course', 'exam', 'test', 'chapter'],
            fitness: ['exercise', 'workout', 'run', 'train', 'gym', 'fitness', 'health', 'physical', 'strength', 'cardio']
        };

        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => lowerInput.includes(keyword))) {
                context.categories.push(category);
            }
        }

        // Extract difficulty indicators
        if (lowerInput.includes('difficult') || lowerInput.includes('challenge') || lowerInput.includes('hard') || 
            lowerInput.includes('complex') || lowerInput.includes('tough')) {
            context.difficulty = 'hard';
        } else if (lowerInput.includes('easy') || lowerInput.includes('simple') || lowerInput.includes('quick')) {
            context.difficulty = 'easy';
        }

        // Extract time frame
        if (lowerInput.includes('today') || lowerInput.includes('now') || lowerInput.includes('immediate')) {
            context.timeFrame = 'today';
        } else if (lowerInput.includes('week') || lowerInput.includes('this week')) {
            context.timeFrame = 'week';
        } else if (lowerInput.includes('month') || lowerInput.includes('long term')) {
            context.timeFrame = 'month';
        }

        // Extract key activities and goals
        const sentences = input.split(/[.!?]/).filter(s => s.trim().length > 0);
        context.activities = sentences.slice(0, 3);
        context.keywords = this.extractKeywords(input);

        return context;
    }

    // Extract keywords from input
    extractKeywords(input) {
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'i', 'am', 'is', 'are', 'was', 'were'];
        const words = input.toLowerCase().split(/\W+/).filter(word => 
            word.length > 3 && !stopWords.includes(word)
        );
        return [...new Set(words)].slice(0, 10);
    }

    // Generate quest from user input
    async generateQuestFromInput(userInput, playerData = null) {
        if (!playerData) {
            playerData = gameEngine.getPlayerData();
        }

        // Analyze the input
        const context = this.analyzeInput(userInput);
        
        // Save user input
        await this.saveUserInput(userInput, context);

        // Try to generate knowledge-backed quest first
        let quest = null;
        if (typeof knowledgeEngine !== 'undefined' && knowledgeEngine.sources.length > 0) {
            const primaryCategory = context.categories.length > 0 ? context.categories[0] : 'strategy';
            const domain = this.mapCategoryToDomain(primaryCategory);
            
            try {
                quest = await knowledgeEngine.generateQuestFromKnowledge(domain, {
                    userInput: userInput,
                    context: context
                });
                
                if (quest) {
                    // Validate quest is knowledge-backed
                    if (typeof knowledgeQuestTranslator !== 'undefined') {
                        const validation = knowledgeQuestTranslator.validateQuest(quest);
                        if (!validation.valid) {
                            console.warn('[AI Quest Generator] Knowledge quest validation failed:', validation.reason);
                            quest = null; // Fall back to regular generation
                        }
                    }
                }
            } catch (error) {
                console.error('[AI Quest Generator] Error generating knowledge quest:', error);
                quest = null;
            }
        }

        // Fallback to regular quest generation if knowledge quest failed
        if (!quest) {
            quest = this.createQuestFromContext(userInput, context, playerData);
        }

        // Store context for future reference
        this.contextHistory.push({
            input: userInput,
            context: context,
            questId: quest.id,
            timestamp: Date.now()
        });

        return quest;
    }

    // Map quest category to knowledge domain
    mapCategoryToDomain(category) {
        const mapping = {
            strategy: 'strategy',
            social: 'social',
            financial: 'finance',
            medical: 'medicine',
            fitness: 'learning' // Fitness often involves learning
        };
        return mapping[category] || 'strategy';
    }

    // Create quest from analyzed context
    createQuestFromContext(originalInput, context, playerData) {
        const level = playerData.level || 1;
        const categories = context.categories.length > 0 ? context.categories : ['strategy'];
        const primaryCategory = categories[0];

        // Generate Solo Leveling-style quest title
        const title = this.generateQuestTitle(originalInput, primaryCategory, context);
        
        // Generate quest description
        const description = this.generateQuestDescription(originalInput, context);
        
        // Apply difficulty adjustment if available
        let adjustedDifficulty = context.difficulty;
        let difficultyAdjustment = null;
        if (typeof questDifficultyAdjustment !== 'undefined') {
            difficultyAdjustment = questDifficultyAdjustment.adjustQuestDifficulty(context.difficulty, context);
            adjustedDifficulty = difficultyAdjustment.difficulty;
        }

        // Calculate rewards based on difficulty and level
        const rewards = this.calculateRewards(primaryCategory, adjustedDifficulty, level, context);
        
        // Apply adjusted XP if difficulty was adjusted
        if (difficultyAdjustment && difficultyAdjustment.xp) {
            rewards.xp = difficultyAdjustment.xp;
        }

        const quest = {
            id: utils.generateId(),
            title: title,
            description: description,
            category: primaryCategory,
            questType: 'ai_generated',
            difficulty: adjustedDifficulty,
            timeFrame: context.timeFrame,
            xp: rewards.xp,
            stats: rewards.stats,
            skillPoints: rewards.skillPoints || 0,
            status: 'pending',
            createdAt: Date.now(),
            completedAt: null,
            userInput: originalInput, // Store original input for reference
            context: context,
            autoAccepted: false
        };

        return quest;
    }

    // Generate Solo Leveling-style quest title
    generateQuestTitle(input, category, context) {
        const actionWords = {
            strategy: ['Conquer', 'Dominate', 'Master', 'Execute', 'Dominate', 'Control'],
            social: ['Lead', 'Influence', 'Connect', 'Unite', 'Inspire', 'Dominate'],
            financial: ['Conquer', 'Secure', 'Dominate', 'Acquire', 'Negotiate', 'Master'],
            medical: ['Master', 'Dominate', 'Absorb', 'Conquer', 'Achieve', 'Complete'],
            fitness: ['Dominate', 'Conquer', 'Master', 'Overcome', 'Achieve', 'Complete']
        };

        const categoryPrefix = {
            strategy: '[Strategic Quest]',
            social: '[Social Quest]',
            financial: '[Financial Quest]',
            medical: '[Study Quest]',
            fitness: '[Fitness Quest]'
        };

        const actions = actionWords[category] || actionWords.strategy;
        const action = utils.randomElement(actions);
        
        // Create a concise, action-oriented title
        const shortDesc = this.createShortDescription(input, category);
        const title = `${categoryPrefix[category]} ${action} ${shortDesc}`;

        return title;
    }

    // Create short description from input
    createShortDescription(input, category) {
        // Extract the main activity/goal
        const sentences = input.split(/[.!?]/).filter(s => s.trim().length > 0);
        if (sentences.length > 0) {
            let desc = sentences[0].trim();
            // Clean up common phrases
            desc = desc.replace(/^(i need to|i want to|i have to|i'm going to|i will)/i, '');
            desc = desc.trim();
            // Limit length
            if (desc.length > 50) {
                desc = desc.substring(0, 47) + '...';
            }
            return desc || 'your objective';
        }
        return 'your objective';
    }

    // Generate quest description
    generateQuestDescription(input, context) {
        const timeFrameText = {
            'today': 'today',
            'week': 'this week',
            'month': 'this month'
        };

        const difficultyText = {
            'easy': 'Complete',
            'medium': 'Successfully accomplish',
            'hard': 'Master and conquer'
        };

        const baseDescription = `${difficultyText[context.difficulty]} the task you described. ${input.substring(0, 100)}${input.length > 100 ? '...' : ''}`;
        
        return baseDescription;
    }

    // Calculate rewards based on category, difficulty, and level
    calculateRewards(category, difficulty, level, context) {
        const difficultyMultipliers = {
            'easy': 1.0,
            'medium': 1.5,
            'hard': 2.5
        };

        const categoryBaseXP = {
            strategy: 80,
            social: 90,
            financial: 100,
            medical: 70,
            fitness: 75
        };

        const baseXP = categoryBaseXP[category] || 80;
        const multiplier = difficultyMultipliers[difficulty] || 1.0;
        const levelMultiplier = 1 + (level * 0.1);
        
        const xp = Math.floor(baseXP * multiplier * levelMultiplier);
        
        // Stat rewards based on category and difficulty
        const statRewards = this.calculateStatRewards(category, difficulty);
        
        // Skill points for harder quests
        const skillPoints = difficulty === 'hard' ? 1 : 0;

        return {
            xp: xp,
            stats: statRewards,
            skillPoints: skillPoints
        };
    }

    // Calculate stat rewards
    calculateStatRewards(category, difficulty) {
        const baseStats = {
            strategy: { strategy: 8, intelligence: 4 },
            social: { social: 10, wisdom: 3 },
            financial: { financial: 12, strategy: 5 },
            medical: { intelligence: 10, wisdom: 5 },
            fitness: { strength: 8, endurance: 10 }
        };

        const base = { ...baseStats[category] || baseStats.strategy };
        const difficultyMultiplier = difficulty === 'hard' ? 1.5 : difficulty === 'medium' ? 1.2 : 1.0;

        // Apply multiplier
        for (const stat in base) {
            base[stat] = Math.floor(base[stat] * difficultyMultiplier);
        }

        return base;
    }

    // Evaluate quest completion and calculate final rewards
    async evaluateQuestCompletion(quest, completionData = {}) {
        // Base rewards from quest
        let finalXP = quest.xp;
        let finalStats = { ...quest.stats };
        let bonusXP = 0;
        let bonusStats = {};

        // Evaluate completion quality
        if (completionData.quality === 'excellent') {
            bonusXP = Math.floor(finalXP * 0.3); // 30% bonus
            for (const stat in finalStats) {
                bonusStats[stat] = Math.floor(finalStats[stat] * 0.2);
            }
        } else if (completionData.quality === 'good') {
            bonusXP = Math.floor(finalXP * 0.15); // 15% bonus
        }

        // Time-based bonus (completed on time)
        if (completionData.onTime) {
            bonusXP += Math.floor(finalXP * 0.1);
        }

        // Apply bonuses
        finalXP += bonusXP;
        for (const stat in bonusStats) {
            if (finalStats[stat]) {
                finalStats[stat] += bonusStats[stat];
            } else {
                finalStats[stat] = bonusStats[stat];
            }
        }

        return {
            xp: finalXP,
            stats: finalStats,
            skillPoints: quest.skillPoints || 0,
            bonusXP: bonusXP,
            bonuses: Object.keys(bonusStats).length > 0
        };
    }

    // Get recent context for better quest generation
    getRecentContext(limit = 5) {
        return this.contextHistory.slice(-limit);
    }
}

// Export singleton instance
const aiQuestGenerator = new AIQuestGenerator();




