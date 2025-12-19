/**
 * AI Journal System - Stores user information, analyzes it, and generates intelligent quests
 * Works offline (text input) and online (voice + advanced AI analysis)
 */

class AIJournalSystem {
    constructor() {
        this.entries = [];
        this.memory = {
            userProfile: {},
            insights: [],
            patterns: [],
            goals: [],
            challenges: []
        };
        this.isOnline = navigator.onLine;
        this.voiceRecognition = null;
        this.analysisQueue = [];
        this.searchFilters = {
            query: '',
            category: '',
            sentiment: '',
            analyzed: '',
            tags: []
        };
        this.setupNetworkListeners();
    }

    async init() {
        await this.loadJournalEntries();
        await this.loadMemory();
        this.initVoiceRecognition();
        this.renderJournalEntries();
        this.updateOnlineStatus();
        
        // Process any pending analysis when online
        if (this.isOnline) {
            await this.processAnalysisQueue();
            await this.analyzeAllEntries();
        }
    }

    setupNetworkListeners() {
        window.addEventListener('online', async () => {
            this.isOnline = true;
            this.updateOnlineStatus();
            await this.processAnalysisQueue();
            await this.analyzeAllEntries();
            await this.generateQuestsFromMemory();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateOnlineStatus();
        });
    }

    updateOnlineStatus() {
        const indicator = document.getElementById('ai-status-indicator');
        const statusText = document.getElementById('ai-status-text');
        const voiceBtn = document.getElementById('btn-ai-voice-record');

        if (indicator) {
            indicator.style.color = this.isOnline ? '#10b981' : '#ef4444';
        }
        if (statusText) {
            statusText.textContent = this.isOnline ? 'Online' : 'Offline';
        }
        if (voiceBtn) {
            voiceBtn.style.display = this.isOnline ? 'flex' : 'none';
        }
    }

    initVoiceRecognition() {
        if (this.isOnline && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.voiceRecognition = new SpeechRecognition();
            this.voiceRecognition.continuous = false;
            this.voiceRecognition.interimResults = false;
            this.voiceRecognition.lang = 'en-US';

            this.voiceRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                const input = document.getElementById('ai-journal-input');
                if (input) {
                    input.value = transcript;
                }
                this.voiceRecognition.stop();
                this.updateVoiceButton(false);
            };

            this.voiceRecognition.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
                this.voiceRecognition.stop();
                this.updateVoiceButton(false);
                showNotification('Voice Error', 'Could not process voice input. Please try again.', 'error');
            };

            this.voiceRecognition.onend = () => {
                this.updateVoiceButton(false);
            };
        }
    }

    updateVoiceButton(listening) {
        const btn = document.getElementById('btn-ai-voice-record');
        if (btn) {
            btn.innerHTML = listening 
                ? '<span style="margin-right: 0.5rem;">🎤</span> Listening...'
                : '<span style="margin-right: 0.5rem;">🎤</span> Voice';
        }
    }

    async saveJournalEntry(text, tags = []) {
        if (!text || !text.trim()) {
            showNotification('Empty Entry', 'Please enter some text before saving.', 'info');
            return;
        }

        const entry = {
            id: Date.now(),
            text: text.trim(),
            timestamp: Date.now(),
            analyzed: false,
            analysis: null,
            insights: [],
            questOpportunities: [],
            tags: tags || [],
            userTags: [] // User-defined tags
        };

        this.entries.push(entry);
        await db.saveJournalEntry(entry);
        
        // Clear input
        const input = document.getElementById('ai-journal-input');
        if (input) {
            input.value = '';
        }

        // Show analysis status
        const statusEl = document.getElementById('ai-analysis-status');
        if (statusEl) {
            statusEl.style.display = 'flex';
        }

        // Analyze entry (offline: basic, online: advanced)
        if (this.isOnline) {
            await this.analyzeEntry(entry);
        } else {
            // Offline: basic analysis
            entry.analyzed = true;
            entry.analysis = {
                type: 'offline',
                summary: 'Entry saved. Will be analyzed when online.',
                keywords: this.extractKeywords(entry.text)
            };
            await db.saveJournalEntry(entry);
        }

        if (statusEl) {
            statusEl.style.display = 'none';
        }

        this.renderJournalEntries();
        showNotification('Entry Saved', 'Your journal entry has been saved.', 'success');

        // If online, generate quests from analysis
        if (this.isOnline) {
            await this.generateQuestsFromAnalysis(entry);
        }
    }

    extractKeywords(text) {
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3)
            .filter(w => !['this', 'that', 'with', 'from', 'have', 'been', 'will', 'your', 'they', 'them', 'their'].includes(w));
        return [...new Set(words)].slice(0, 10);
    }

    async analyzeEntry(entry) {
        if (!this.isOnline) {
            this.analysisQueue.push(entry.id);
            return;
        }

        try {
            // Advanced AI analysis (simulated - in production, use real AI API)
            const analysis = await this.performAdvancedAnalysis(entry.text);
            
            entry.analyzed = true;
            entry.analysis = analysis;
            entry.insights = analysis.insights || [];
            entry.questOpportunities = analysis.questOpportunities || [];

            await db.saveJournalEntry(entry);
            await this.updateMemory(entry, analysis);
        } catch (error) {
            console.error('[AI Journal] Analysis error:', error);
            entry.analyzed = false;
            await db.saveJournalEntry(entry);
        }
    }

    async performAdvancedAnalysis(text) {
        // Simulate advanced AI reasoning and analysis
        // In production, this would call a real AI API (OpenAI, Anthropic, etc.)
        
        const keywords = this.extractKeywords(text);
        const categories = this.categorizeText(text);
        const sentiment = this.analyzeSentiment(text);
        const goals = this.extractGoals(text);
        const challenges = this.extractChallenges(text);
        const opportunities = this.identifyOpportunities(text, categories);

        // Deep reasoning analysis
        const reasoning = this.performDeepReasoning(text, categories, goals, challenges);
        const patterns = this.identifyPatterns(text, categories);
        const recommendations = this.generateRecommendations(text, categories, goals, challenges, patterns);

        return {
            type: 'advanced',
            summary: this.generateSummary(text, categories, sentiment),
            keywords: keywords,
            categories: categories,
            sentiment: sentiment,
            goals: goals,
            challenges: challenges,
            insights: this.generateInsights(text, categories, goals, challenges),
            questOpportunities: opportunities,
            reasoning: reasoning,
            patterns: patterns,
            recommendations: recommendations,
            thinkingProcess: this.generateThinkingProcess(text, categories, goals, challenges),
            timestamp: Date.now()
        };
    }

    performDeepReasoning(text, categories, goals, challenges) {
        const reasoningSteps = [];
        
        // Step 1: Context Understanding
        reasoningSteps.push(`Understanding context: User is discussing ${categories.join(', ')}.`);
        
        // Step 2: Goal Analysis
        if (goals.length > 0) {
            reasoningSteps.push(`Identified ${goals.length} explicit goal(s). Analyzing how quests can support achievement.`);
        }
        
        // Step 3: Challenge Assessment
        if (challenges.length > 0) {
            reasoningSteps.push(`Detected ${challenges.length} challenge(s). Evaluating intervention strategies.`);
        }
        
        // Step 4: Opportunity Mapping
        reasoningSteps.push(`Mapping opportunities to knowledge domains: ${categories.map(c => this.mapCategoryToDomain(c)).filter(d => d).join(', ')}.`);
        
        // Step 5: Quest Generation Strategy
        reasoningSteps.push(`Formulating quest generation strategy based on user's current level, past performance, and identified needs.`);
        
        return reasoningSteps.join(' ');
    }

    identifyPatterns(text, categories) {
        const patterns = [];
        
        // Check for recurring themes
        const allEntries = this.entries.filter(e => e.analyzed && e.analysis);
        const categoryFrequency = {};
        
        allEntries.forEach(entry => {
            if (entry.analysis && entry.analysis.categories) {
                entry.analysis.categories.forEach(cat => {
                    categoryFrequency[cat] = (categoryFrequency[cat] || 0) + 1;
                });
            }
        });
        
        const topCategories = Object.entries(categoryFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        
        if (topCategories.length > 0) {
            patterns.push({
                type: 'recurring_theme',
                description: `User frequently discusses: ${topCategories.map(([cat]) => cat).join(', ')}`,
                frequency: topCategories[0][1],
                actionable: true
            });
        }
        
        return patterns;
    }

    generateRecommendations(text, categories, goals, challenges, patterns) {
        const recommendations = [];
        
        if (goals.length > 0) {
            recommendations.push({
                type: 'goal_support',
                text: `Focus quests on supporting ${goals.length} identified goal(s) through knowledge-backed exercises.`,
                priority: 'high'
            });
        }
        
        if (challenges.length > 0) {
            recommendations.push({
                type: 'challenge_intervention',
                text: `Generate quests that address identified challenges using relevant frameworks from knowledge base.`,
                priority: 'high'
            });
        }
        
        if (patterns.length > 0 && patterns[0].frequency > 3) {
            recommendations.push({
                type: 'pattern_based',
                text: `User shows strong interest in ${patterns[0].description.split(':')[1]}. Prioritize quests in this domain.`,
                priority: 'medium'
            });
        }
        
        return recommendations;
    }

    generateThinkingProcess(text, categories, goals, challenges) {
        return {
            step1_context: `Analyzed entry text and identified primary categories: ${categories.join(', ')}.`,
            step2_goals: goals.length > 0 ? `Extracted ${goals.length} goal(s) that user wants to achieve.` : 'No explicit goals identified.',
            step3_challenges: challenges.length > 0 ? `Found ${challenges.length} challenge(s) that may need support.` : 'No major challenges detected.',
            step4_mapping: `Mapped categories to knowledge domains: ${categories.map(c => this.mapCategoryToDomain(c)).filter(d => d).join(', ')}.`,
            step5_strategy: `Formulated quest generation strategy: ${goals.length > 0 ? 'Goal-oriented' : ''} ${challenges.length > 0 ? 'Challenge-supporting' : ''} quests from relevant knowledge sources.`,
            conclusion: `Ready to generate personalized quests that will help user level up in identified areas.`
        };
    }

    categorizeText(text) {
        const categories = [];
        const lowerText = text.toLowerCase();

        if (lowerText.match(/\b(work|job|career|business|client|project|meeting|deadline|salary|promotion)\b/)) {
            categories.push('career');
        }
        if (lowerText.match(/\b(study|learn|exam|test|course|education|school|university|skill)\b/)) {
            categories.push('learning');
        }
        if (lowerText.match(/\b(health|exercise|fitness|diet|doctor|medical|pain|illness|wellness)\b/)) {
            categories.push('health');
        }
        if (lowerText.match(/\b(money|finance|budget|save|invest|debt|income|expense|financial)\b/)) {
            categories.push('finance');
        }
        if (lowerText.match(/\b(relationship|friend|family|social|people|communication|conflict)\b/)) {
            categories.push('social');
        }
        if (lowerText.match(/\b(goal|achieve|success|improve|progress|plan|future|dream)\b/)) {
            categories.push('personal_growth');
        }
        if (lowerText.match(/\b(stress|anxiety|worry|problem|difficulty|challenge|struggle|frustrated)\b/)) {
            categories.push('challenges');
        }

        return categories.length > 0 ? categories : ['general'];
    }

    analyzeSentiment(text) {
        const positiveWords = ['happy', 'excited', 'great', 'good', 'success', 'achieved', 'proud', 'grateful', 'love', 'enjoy'];
        const negativeWords = ['sad', 'angry', 'frustrated', 'worried', 'stressed', 'difficult', 'problem', 'failed', 'disappointed', 'tired'];
        
        const lowerText = text.toLowerCase();
        let positive = 0;
        let negative = 0;

        positiveWords.forEach(word => {
            if (lowerText.includes(word)) positive++;
        });
        negativeWords.forEach(word => {
            if (lowerText.includes(word)) negative++;
        });

        if (positive > negative) return 'positive';
        if (negative > positive) return 'negative';
        return 'neutral';
    }

    extractGoals(text) {
        const goalPatterns = [
            /(?:want|wish|hope|plan|goal|aim|target|dream|aspire).{0,50}(?:to|for|of)/gi,
            /(?:need|must|should|will).{0,50}(?:to|achieve|accomplish|complete|finish)/gi
        ];

        const goals = [];
        goalPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                goals.push(...matches.map(m => m.trim()));
            }
        });

        return goals.slice(0, 5);
    }

    extractChallenges(text) {
        const challengePatterns = [
            /(?:struggling|difficulty|problem|challenge|issue|obstacle|barrier|blocked).{0,100}/gi,
            /(?:can't|cannot|unable|failed|stuck|confused).{0,100}/gi
        ];

        const challenges = [];
        challengePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                challenges.push(...matches.map(m => m.trim()));
            }
        });

        return challenges.slice(0, 5);
    }

    identifyOpportunities(text, categories) {
        const opportunities = [];
        
        // Map categories to quest opportunities
        categories.forEach(category => {
            const domain = this.mapCategoryToDomain(category);
            if (domain && typeof knowledgeEngine !== 'undefined') {
                opportunities.push({
                    category: category,
                    domain: domain,
                    priority: this.calculatePriority(text, category),
                    reasoning: `Identified ${category} opportunity based on journal entry`,
                    readyToDeliver: false,
                    deliveryTime: Date.now() + (Math.random() * 2 + 1) * 60 * 60 * 1000 // 1-3 hours
                });
            }
        });

        return opportunities;
    }

    mapCategoryToDomain(category) {
        const mapping = {
            'career': 'leadership',
            'learning': 'learning',
            'health': 'medicine',
            'finance': 'finance',
            'social': 'social',
            'personal_growth': 'psychology',
            'challenges': 'psychology'
        };
        return mapping[category] || 'strategy';
    }

    calculatePriority(text, category) {
        let priority = 50; // Base priority

        // Increase priority for urgent keywords
        const urgentWords = ['urgent', 'important', 'critical', 'deadline', 'asap', 'soon', 'now'];
        urgentWords.forEach(word => {
            if (text.toLowerCase().includes(word)) priority += 20;
        });

        // Increase priority for challenges
        if (category === 'challenges') priority += 15;

        // Increase priority for goals
        const goalWords = ['goal', 'dream', 'achieve', 'success'];
        goalWords.forEach(word => {
            if (text.toLowerCase().includes(word)) priority += 10;
        });

        return Math.min(priority, 100);
    }

    generateSummary(text, categories, sentiment) {
        const categoryStr = categories.join(', ');
        const sentimentStr = sentiment === 'positive' ? 'positive' : sentiment === 'negative' ? 'challenging' : 'neutral';
        return `Entry about ${categoryStr} with ${sentimentStr} sentiment. ${text.substring(0, 100)}...`;
    }

    generateInsights(text, categories, goals, challenges) {
        const insights = [];

        if (goals.length > 0) {
            insights.push({
                type: 'goal',
                text: `Identified ${goals.length} goal(s) in this entry`,
                actionable: true
            });
        }

        if (challenges.length > 0) {
            insights.push({
                type: 'challenge',
                text: `Found ${challenges.length} challenge(s) that may need support`,
                actionable: true
            });
        }

        if (categories.includes('career')) {
            insights.push({
                type: 'opportunity',
                text: 'Career-related entry - potential for leadership/strategy quests',
                actionable: true
            });
        }

        return insights;
    }

    generateReasoning(text, categories, goals, challenges) {
        const reasoning = [];

        reasoning.push(`Analyzed entry and identified ${categories.length} category/categories: ${categories.join(', ')}.`);
        
        if (goals.length > 0) {
            reasoning.push(`Detected ${goals.length} goal(s) that could be supported through targeted quests.`);
        }

        if (challenges.length > 0) {
            reasoning.push(`Found ${challenges.length} challenge(s) where quest-based interventions could help.`);
        }

        reasoning.push(`Based on this analysis, I can generate personalized quests from the knowledge base to help the user level up in relevant domains.`);

        return reasoning.join(' ');
    }

    async updateMemory(entry, analysis) {
        // Update user profile
        if (!this.memory.userProfile.categories) {
            this.memory.userProfile.categories = {};
        }
        analysis.categories.forEach(cat => {
            this.memory.userProfile.categories[cat] = (this.memory.userProfile.categories[cat] || 0) + 1;
        });

        // Add insights
        if (analysis.insights) {
            this.memory.insights.push(...analysis.insights.map(insight => ({
                ...insight,
                entryId: entry.id,
                timestamp: Date.now()
            })));
        }

        // Add goals
        if (analysis.goals) {
            this.memory.goals.push(...analysis.goals.map(goal => ({
                text: goal,
                entryId: entry.id,
                timestamp: Date.now(),
                status: 'active'
            })));
        }

        // Add challenges
        if (analysis.challenges) {
            this.memory.challenges.push(...analysis.challenges.map(challenge => ({
                text: challenge,
                entryId: entry.id,
                timestamp: Date.now(),
                status: 'active'
            })));
        }

        await this.saveMemory();
    }

    async saveMemory() {
        await db.saveMemory({
            id: 'main',
            ...this.memory,
            lastUpdated: Date.now()
        });
    }

    async loadMemory() {
        const memoryData = await db.get('aiMemory', 'main');
        if (memoryData) {
            this.memory = { ...this.memory, ...memoryData };
            delete this.memory.id;
        }
    }

    async loadJournalEntries() {
        this.entries = await db.getAll('aiJournalEntries') || [];
        this.entries.sort((a, b) => b.timestamp - a.timestamp);
    }

    async analyzeAllEntries() {
        const unanalyzed = this.entries.filter(e => !e.analyzed);
        for (const entry of unanalyzed) {
            await this.analyzeEntry(entry);
        }
    }

    async processAnalysisQueue() {
        while (this.analysisQueue.length > 0) {
            const entryId = this.analysisQueue.shift();
            const entry = this.entries.find(e => e.id === entryId);
            if (entry) {
                await this.analyzeEntry(entry);
            }
        }
    }

    async generateQuestsFromAnalysis(entry) {
        if (!entry.analysis || !entry.analysis.questOpportunities) {
            return;
        }

        for (const opportunity of entry.analysis.questOpportunities) {
            await this.createPendingQuest(opportunity, entry);
        }
    }

    async generateQuestsFromMemory() {
        // Analyze memory patterns and generate quests
        const topCategories = Object.entries(this.memory.userProfile.categories || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([cat]) => cat);

        for (const category of topCategories) {
            const domain = this.mapCategoryToDomain(category);
            if (domain && typeof knowledgeEngine !== 'undefined') {
                const opportunity = {
                    category: category,
                    domain: domain,
                    priority: 60,
                    reasoning: `Generated from memory pattern: user frequently discusses ${category}`,
                    readyToDeliver: false,
                    deliveryTime: Date.now() + (Math.random() * 3 + 2) * 60 * 60 * 1000 // 2-5 hours
                };
                await this.createPendingQuest(opportunity, null);
            }
        }
    }

    async createPendingQuest(opportunity, sourceEntry) {
        try {
            // Generate quest using knowledge engine
            let quest = null;
            if (typeof knowledgeEngine !== 'undefined' && typeof knowledgeQuestTranslator !== 'undefined') {
                quest = await knowledgeQuestTranslator.generateQuestFromDomain(
                    opportunity.domain,
                    {
                        userContext: sourceEntry ? sourceEntry.text : null,
                        category: opportunity.category,
                        priority: opportunity.priority
                    }
                );
            }

            if (!quest) {
                // Fallback quest generation
                quest = {
                    id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    title: `Quest Opportunity: ${opportunity.category}`,
                    description: `Based on your journal entries, here's a quest to help you level up in ${opportunity.category}.`,
                    category: opportunity.category,
                    difficulty: 'medium',
                    rewards: {
                        xp: 50,
                        stats: {}
                    },
                    knowledgeSource: null
                };
            }

            const pendingQuest = {
                id: quest.id || `pending_${Date.now()}`,
                quest: quest,
                priority: opportunity.priority,
                reasoning: opportunity.reasoning,
                readyToDeliver: false,
                deliveryTime: opportunity.deliveryTime,
                timestamp: Date.now(),
                sourceEntryId: sourceEntry ? sourceEntry.id : null
            };

            await db.savePendingQuest(pendingQuest);
            // Also notify pending quest delivery system
            if (typeof pendingQuestDelivery !== 'undefined') {
                await pendingQuestDelivery.addPendingQuest(pendingQuest);
            }
            console.log('[AI Journal] Created pending quest:', pendingQuest.id);
        } catch (error) {
            console.error('[AI Journal] Error creating pending quest:', error);
        }
    }

    renderJournalEntries(filteredEntries = null) {
        const container = document.getElementById('ai-journal-entries');
        if (!container) return;

        const entriesToRender = filteredEntries || this.entries;

        if (entriesToRender.length === 0) {
            container.innerHTML = `
                <div class="glass-panel" style="padding: 2rem; text-align: center; color: var(--text-secondary);">
                    <p>${this.entries.length === 0 ? 'No journal entries yet. Start sharing your thoughts, experiences, and goals!' : 'No entries match your search filters.'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = entriesToRender.map(entry => {
            const date = new Date(entry.timestamp);
            const analyzedBadge = entry.analyzed 
                ? '<span style="background: #10b981; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-left: 0.5rem;">Analyzed</span>'
                : '<span style="background: #f59e0b; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-left: 0.5rem;">Pending</span>';

            const insightsHtml = entry.insights && entry.insights.length > 0
                ? `<div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Insights:</div>
                    ${entry.insights.map(insight => `<div style="padding: 0.5rem; background: var(--bg-secondary); border-radius: 4px; margin-bottom: 0.25rem; font-size: 0.9rem;">• ${insight.text}</div>`).join('')}
                   </div>`
                : '';

            return `
                <div class="glass-panel" style="margin-bottom: 1rem; padding: 1.25rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
                        </div>
                        ${analyzedBadge}
                    </div>
                    <div style="color: var(--text-primary); line-height: 1.6; white-space: pre-wrap;">${entry.text}</div>
                    ${insightsHtml}
                </div>
            `;
        }).join('');
    }
}

const aiJournalSystem = new AIJournalSystem();

