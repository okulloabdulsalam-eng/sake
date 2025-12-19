/**
 * Knowledge Quest Translator - Converts knowledge principles into real-world quests
 * Ensures all quests are grounded in authoritative sources
 */

class KnowledgeQuestTranslator {
    constructor() {
        this.translationCache = new Map();
    }

    // Translate knowledge principle/framework to actionable quest
    async translateToQuest(domain, context = {}, knowledgeEngine) {
        const playerData = gameEngine.getPlayerData();
        const level = playerData.level || 1;

        // Get knowledge source for domain
        const principleData = knowledgeEngine.getRandomPrinciple(domain);
        if (!principleData) {
            console.warn(`[Quest Translator] No principles found for domain: ${domain}`);
            return null;
        }

        const { principle, source } = principleData;

        // Get or create exercise from source
        let exercise = null;
        if (source.exercises && source.exercises.length > 0) {
            exercise = utils.randomElement(source.exercises);
        } else {
            // Generate exercise from principle
            exercise = this.generateExerciseFromPrinciple(principle, domain, context);
        }

        // Determine difficulty based on level and principle complexity
        const difficulty = this.calculateDifficulty(level, principle, domain);

        // Calculate rewards based on difficulty and domain
        const rewards = this.calculateRewards(domain, difficulty, level);

        // Generate quest title
        const title = this.generateQuestTitle(domain, principle, source);

        // Generate quest description
        const description = this.generateQuestDescription(principle, exercise, source, context);

        // Create quest object
        const quest = {
            id: utils.generateId(),
            title: title,
            description: description,
            category: this.mapDomainToCategory(domain),
            questType: 'knowledge_backed',
            difficulty: difficulty,
            timeFrame: this.determineTimeFrame(difficulty, context),
            xp: rewards.xp,
            stats: rewards.stats,
            skillPoints: rewards.skillPoints,
            status: 'pending',
            createdAt: Date.now(),
            completedAt: null,
            knowledgeSource: {
                sourceId: source.id,
                sourceTitle: source.title,
                author: source.author,
                domain: domain,
                principle: typeof principle === 'string' ? principle : principle.name,
                principleDescription: typeof principle === 'object' ? principle.description : '',
                exercise: exercise
            },
            sourceAttribution: {
                visible: false, // Hidden by default
                source: source.title,
                author: source.author,
                principle: typeof principle === 'string' ? principle : principle.name
            },
            autoAccepted: false
        };

        return quest;
    }

    // Generate exercise from principle if source doesn't have one
    generateExerciseFromPrinciple(principle, domain, context) {
        const principleName = typeof principle === 'string' ? principle : principle.name;
        const principleDesc = typeof principle === 'object' ? principle.description : '';

        // Real-world, specific, actionable exercise templates
        const realWorldTemplates = {
            strategy: [
                `Identify ONE specific leverage point in your current environment (workplace, school, community, or home). Write down: (1) What makes it a leverage point, (2) One concrete action you will take this week to influence it, (3) How you'll measure the impact. Then execute the action and document the result.`,
                `Choose ONE real decision you need to make this week. Apply the principle "${principleName}" by: (1) Analyzing the situation using this principle, (2) Making the decision, (3) Documenting the outcome and what you learned.`,
                `Map your competitive landscape for ONE real situation (job search, business competition, academic competition, etc.). Identify: (1) Your position, (2) Your competitors' positions, (3) One strategic move you can make. Execute the move and report results.`
            ],
            medicine: [
                `Apply the principle "${principleName}" to ONE real patient case or health situation you encounter. Document: (1) The situation, (2) How the principle applies, (3) The action taken, (4) The outcome observed.`,
                `Use the principle "${principleName}" to analyze ONE real clinical decision you need to make. Write down your analysis, make the decision, and document the results.`,
                `Practice ONE diagnostic framework from this principle on a real case. Document your thought process, the diagnosis, and the outcome.`
            ],
            economics: [
                `Apply "${principleName}" to analyze ONE real economic decision you're facing (purchase, investment, career choice, etc.). Document: (1) The decision, (2) Seen consequences, (3) Unseen consequences, (4) Your final choice and reasoning.`,
                `Identify ONE real market situation you're involved in (job market, housing, investments, etc.). Apply this principle to understand it better. Write down your analysis and one action you'll take based on it.`,
                `Find ONE real economic policy or business decision affecting you. Analyze it using "${principleName}". Document your analysis and one way you'll adapt to or influence it.`
            ],
            finance: [
                `Apply "${principleName}" to make ONE real financial decision this week (budget change, investment, savings goal, etc.). Document: (1) Your current situation, (2) The principle's application, (3) The decision made, (4) The action taken, (5) Results after one week.`,
                `Use this principle to improve ONE specific aspect of your finances. Choose: (1) A concrete financial goal, (2) One action based on the principle, (3) Execute it, (4) Measure and report results.`,
                `Analyze ONE real financial opportunity or risk using "${principleName}". Make a decision, take action, and document the outcome.`
            ],
            social: [
                `Apply "${principleName}" in ONE real conversation or interaction this week. Before: Plan how you'll apply it. During: Use the principle. After: Document what happened, what worked, what didn't, and what you learned.`,
                `Choose ONE real relationship you want to improve. Apply "${principleName}" in your next interaction. Document: (1) The relationship context, (2) How you applied the principle, (3) The other person's response, (4) The outcome.`,
                `Practice "${principleName}" in ONE real social situation (meeting, networking event, family gathering, etc.). Document your approach, the interaction, and the results.`
            ],
            psychology: [
                `Apply "${principleName}" to understand ONE real behavior you observe (your own or someone else's). Document: (1) The behavior, (2) Your analysis using the principle, (3) One insight you gained, (4) How you'll use this insight.`,
                `Use this principle to influence ONE real behavior change (yours or someone you interact with). Document: (1) The target behavior, (2) Your strategy based on the principle, (3) The action taken, (4) The result.`,
                `Analyze ONE real psychological pattern you notice using "${principleName}". Document your analysis and one practical application.`
            ],
            leadership: [
                `Apply "${principleName}" in ONE real leadership situation this week (team meeting, project management, mentoring, etc.). Document: (1) The situation, (2) How you applied the principle, (3) Your team's response, (4) The outcome.`,
                `Use this principle to improve ONE aspect of your leadership. Choose a specific situation, apply the principle, and document the results.`,
                `Practice "${principleName}" with ONE real person you lead or influence. Document the interaction and outcome.`
            ],
            power: [
                `Identify ONE real power dynamic you're involved in. Apply "${principleName}" to understand it. Document: (1) The power structure, (2) Your position, (3) One strategic action you'll take, (4) Execute and report results.`,
                `Analyze ONE real situation where power is at play using this principle. Document your analysis and one action you'll take.`,
                `Use "${principleName}" to navigate ONE real power-related challenge. Document your approach and outcome.`
            ],
            systems: [
                `Map ONE real system you're part of (work system, family system, community system, etc.) using "${principleName}". Document: (1) The system components, (2) The feedback loops, (3) The leverage points, (4) One action you'll take, (5) Results.`,
                `Identify ONE real system problem you face. Apply this principle to understand it. Document your analysis and one intervention you'll make.`,
                `Use "${principleName}" to improve ONE real system you interact with daily. Document the system, your intervention, and the results.`
            ],
            learning: [
                `Apply "${principleName}" to learn ONE real skill or topic you need. Document: (1) What you're learning, (2) How you're applying the principle, (3) Your learning process, (4) What you've learned after one week.`,
                `Use this principle to improve ONE real learning situation (studying, training, skill development). Document your approach and results.`,
                `Practice "${principleName}" while learning something new this week. Document your learning process and outcomes.`
            ]
        };

        const templates = realWorldTemplates[domain] || [
            `Apply the principle "${principleName}" in ONE real-world situation. Document: (1) The situation, (2) How you applied the principle, (3) The action taken, (4) The measurable result.`
        ];

        return utils.randomElement(templates);
    }

    // Calculate quest difficulty
    calculateDifficulty(level, principle, domain) {
        // Base difficulty on level
        let difficulty = 'medium';
        
        if (level < 5) {
            difficulty = 'easy';
        } else if (level >= 15) {
            difficulty = 'hard';
        }

        // Adjust based on principle complexity
        const principleText = typeof principle === 'string' ? principle : (principle.name || '');
        if (principleText.length > 50 || principleText.includes('complex') || principleText.includes('advanced')) {
            if (difficulty === 'easy') difficulty = 'medium';
            else if (difficulty === 'medium') difficulty = 'hard';
        }

        return difficulty;
    }

    // Calculate rewards
    calculateRewards(domain, difficulty, level) {
        const difficultyMultipliers = {
            'easy': 1.0,
            'medium': 1.5,
            'hard': 2.5
        };

        const domainBaseXP = {
            strategy: 100,
            medicine: 90,
            economics: 95,
            finance: 110,
            social: 85,
            psychology: 90,
            leadership: 100,
            power: 95,
            systems: 105,
            learning: 95
        };

        const baseXP = domainBaseXP[domain] || 100;
        const multiplier = difficultyMultipliers[difficulty] || 1.0;
        const levelMultiplier = 1 + (level * 0.1);
        
        const xp = Math.floor(baseXP * multiplier * levelMultiplier);

        // Stat rewards
        const statRewards = knowledgeEngine.getStatRewardsForDomain(domain);
        
        // Apply difficulty multiplier to stats
        const statMultiplier = difficulty === 'hard' ? 1.5 : difficulty === 'medium' ? 1.2 : 1.0;
        const finalStats = {};
        for (const [stat, value] of Object.entries(statRewards)) {
            finalStats[stat] = Math.floor(value * statMultiplier);
        }

        // Skill points for harder quests
        const skillPoints = difficulty === 'hard' ? 1 : 0;

        return {
            xp: xp,
            stats: finalStats,
            skillPoints: skillPoints
        };
    }

    // Generate quest title
    generateQuestTitle(domain, principle, source) {
        const domainPrefix = {
            strategy: '[Strategic Quest]',
            medicine: '[Medical Quest]',
            economics: '[Economic Quest]',
            finance: '[Financial Quest]',
            social: '[Social Quest]',
            psychology: '[Psychological Quest]',
            leadership: '[Leadership Quest]',
            power: '[Power Quest]',
            systems: '[Systems Quest]',
            learning: '[Learning Quest]'
        };

        const actionWords = ['Apply', 'Master', 'Conquer', 'Execute', 'Implement', 'Practice'];
        const action = utils.randomElement(actionWords);
        
        const principleName = typeof principle === 'string' ? principle : principle.name;
        const shortPrinciple = principleName.length > 40 ? principleName.substring(0, 37) + '...' : principleName;

        return `${domainPrefix[domain] || '[Quest]'} ${action}: ${shortPrinciple}`;
    }

    // Generate quest description
    generateQuestDescription(principle, exercise, source, context) {
        const principleName = typeof principle === 'string' ? principle : principle.name;
        const principleDesc = typeof principle === 'object' ? principle.description : '';

        let description = `[REAL-WORLD APPLICATION REQUIRED]\n\n`;
        description += `Principle: "${principleName}"\n`;
        description += `Source: ${source.title} by ${source.author}\n\n`;
        
        if (principleDesc) {
            description += `Understanding: ${principleDesc}\n\n`;
        }

        description += `YOUR MISSION:\n${exercise}\n\n`;
        description += `REPORT REQUIREMENTS:\n`;
        description += `- Describe the real situation you chose\n`;
        description += `- Explain how you applied the principle\n`;
        description += `- Detail the specific action you took\n`;
        description += `- Report the measurable outcome or result\n`;
        description += `- Reflect on what you learned\n\n`;
        description += `This quest requires real-world action, not theoretical discussion.`;

        // Add context if available
        if (context.userInput) {
            description += `\n\nYour context: ${context.userInput.substring(0, 150)}`;
        }

        return description;
    }

    // Map knowledge domain to quest category
    mapDomainToCategory(domain) {
        const mapping = {
            strategy: 'strategy',
            medicine: 'medical',
            economics: 'financial',
            finance: 'financial',
            social: 'social',
            psychology: 'social',
            leadership: 'social',
            power: 'strategy',
            systems: 'strategy',
            learning: 'medical' // Learning often involves study
        };

        return mapping[domain] || 'strategy';
    }

    // Determine time frame
    determineTimeFrame(difficulty, context) {
        if (context.timeFrame) {
            return context.timeFrame;
        }

        const timeFrames = {
            'easy': 'today',
            'medium': 'week',
            'hard': 'month'
        };

        return timeFrames[difficulty] || 'week';
    }

    // Validate quest is knowledge-backed
    validateQuest(quest) {
        if (!quest.knowledgeSource) {
            return { valid: false, reason: 'Quest missing knowledge source' };
        }

        if (!quest.knowledgeSource.sourceId) {
            return { valid: false, reason: 'Quest missing source ID' };
        }

        if (!quest.knowledgeSource.principle) {
            return { valid: false, reason: 'Quest missing principle' };
        }

        return { valid: true };
    }
}

// Export singleton instance
const knowledgeQuestTranslator = new KnowledgeQuestTranslator();

