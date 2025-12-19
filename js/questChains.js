/**
 * Quest Chains System - Multi-part quests with dependencies
 */

class QuestChains {
    constructor() {
        this.chains = [];
        this.activeChains = new Map();
    }

    async init() {
        await this.loadChains();
        await this.initializeDefaultChains();
    }

    initializeDefaultChains() {
        const defaultChains = [
            {
                id: 'knowledge_mastery',
                name: 'Knowledge Mastery',
                description: 'Master knowledge from different domains',
                quests: [
                    { questId: null, title: 'Complete 5 Strategy quests', requirement: { type: 'quests_by_category', category: 'strategy', count: 5 } },
                    { questId: null, title: 'Complete 5 Medicine quests', requirement: { type: 'quests_by_category', category: 'medical', count: 5 } },
                    { questId: null, title: 'Complete 5 Finance quests', requirement: { type: 'quests_by_category', category: 'financial', count: 5 } }
                ],
                reward: { xp: 500, skillPoints: 5 }
            },
            {
                id: 'rank_ascension',
                name: 'Rank Ascension',
                description: 'Progress through the ranks',
                quests: [
                    { questId: null, title: 'Reach Rank D', requirement: { type: 'rank', value: 'D' } },
                    { questId: null, title: 'Reach Rank C', requirement: { type: 'rank', value: 'C' } },
                    { questId: null, title: 'Reach Rank B', requirement: { type: 'rank', value: 'B' } }
                ],
                reward: { xp: 1000, skillPoints: 10 }
            }
        ];

        defaultChains.forEach(chain => {
            const existing = this.chains.find(c => c.id === chain.id);
            if (!existing) {
                this.chains.push({
                    ...chain,
                    progress: 0,
                    completed: false,
                    startedAt: null,
                    completedAt: null
                });
            }
        });
    }

    async loadChains() {
        try {
            const saved = await db.getQuestChains();
            if (saved && saved.length > 0) {
                this.chains = saved;
            }
        } catch (error) {
            console.error('Error loading quest chains:', error);
        }
    }

    async saveChains() {
        try {
            await db.saveQuestChains(this.chains);
        } catch (error) {
            console.error('Error saving quest chains:', error);
        }
    }

    async checkChainProgress(chainId) {
        const chain = this.chains.find(c => c.id === chainId);
        if (!chain || chain.completed) return;

        const playerData = gameEngine.getPlayerData();
        let completedQuests = 0;

        for (const quest of chain.quests) {
            const req = quest.requirement;
            let completed = false;

            switch (req.type) {
                case 'quests_by_category':
                    const categoryQuests = await db.getQuestsByCategory(req.category);
                    completed = categoryQuests.filter(q => q.status === 'completed').length >= req.count;
                    break;
                case 'rank':
                    const ranks = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
                    completed = ranks.indexOf(playerData.rank) >= ranks.indexOf(req.value);
                    break;
            }

            if (completed) {
                completedQuests++;
            }
        }

        chain.progress = (completedQuests / chain.quests.length) * 100;

        if (chain.progress >= 100 && !chain.completed) {
            await this.completeChain(chainId);
        }

        await this.saveChains();
    }

    async completeChain(chainId) {
        const chain = this.chains.find(c => c.id === chainId);
        if (!chain) return;

        chain.completed = true;
        chain.completedAt = Date.now();

        // Award rewards
        if (chain.reward.xp) {
            await gameEngine.addXP(chain.reward.xp, `quest_chain:${chain.name}`);
        }

        if (chain.reward.skillPoints) {
            const playerData = gameEngine.getPlayerData();
            playerData.skillPoints += chain.reward.skillPoints;
            await gameEngine.savePlayerData();
        }

        showNotification(
            '🔗 Quest Chain Completed!',
            `${chain.name}: ${chain.description}`,
            'quest-chain',
            5000
        );

        await this.saveChains();
    }

    getActiveChains() {
        return this.chains.filter(c => !c.completed);
    }

    getCompletedChains() {
        return this.chains.filter(c => c.completed);
    }
}

const questChains = new QuestChains();


