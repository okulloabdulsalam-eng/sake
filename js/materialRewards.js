/**
 * Material/Conquest Rewards System
 * Manages money, resources, assets, influence, virtual allies, and tools
 */

class MaterialRewards {
    constructor() {
        this.inventory = {
            money: 0,
            resources: {
                energy: 0,
                materials: 0,
                knowledge: 0
            },
            assets: [],
            influence: 0,
            allies: [],
            tools: [],
            territories: []
        };
    }

    // Initialize material rewards system
    async init() {
        await this.loadInventory();
    }

    // Load inventory from database
    async loadInventory() {
        try {
            const saved = await db.getStat('material_rewards');
            if (saved) {
                this.inventory = { ...this.inventory, ...saved };
            }
        } catch (error) {
            console.error('Error loading material rewards:', error);
        }
    }

    // Save inventory to database
    async saveInventory() {
        try {
            await db.saveStat('material_rewards', this.inventory);
        } catch (error) {
            console.error('Error saving material rewards:', error);
        }
    }

    // Generate material rewards based on quest completion
    generateMaterialRewards(quest, completionScore, quality) {
        const rewards = {
            money: 0,
            resources: {
                energy: 0,
                materials: 0,
                knowledge: 0
            },
            assets: [],
            influence: 0,
            allies: [],
            tools: [],
            territories: []
        };

        // Base rewards by category
        const categoryRewards = {
            strategy: {
                money: 50,
                resources: { energy: 10, materials: 5, knowledge: 20 },
                influence: 15
            },
            social: {
                money: 30,
                resources: { energy: 5, materials: 0, knowledge: 10 },
                influence: 25,
                allies: this.generateAllies(quest, quality)
            },
            financial: {
                money: 100,
                resources: { energy: 5, materials: 10, knowledge: 15 },
                influence: 10,
                assets: this.generateAssets(quest, quality)
            },
            medical: {
                money: 40,
                resources: { energy: 15, materials: 5, knowledge: 30 },
                influence: 5
            },
            fitness: {
                money: 35,
                resources: { energy: 25, materials: 0, knowledge: 10 },
                influence: 8
            }
        };

        const baseRewards = categoryRewards[quest.category] || categoryRewards.strategy;
        
        // Apply quality multiplier
        const qualityMultiplier = {
            'excellent': 1.5,
            'good': 1.2,
            'basic': 1.0
        };

        const multiplier = qualityMultiplier[quality] || 1.0;
        const scoreMultiplier = 1 + (completionScore / 200); // Up to 1.75x

        // Calculate final rewards
        rewards.money = Math.floor(baseRewards.money * multiplier * scoreMultiplier);
        rewards.resources.energy = Math.floor((baseRewards.resources?.energy || 0) * multiplier);
        rewards.resources.materials = Math.floor((baseRewards.resources?.materials || 0) * multiplier);
        rewards.resources.knowledge = Math.floor((baseRewards.resources?.knowledge || 0) * multiplier);
        rewards.influence = Math.floor((baseRewards.influence || 0) * multiplier * scoreMultiplier);

        // Add category-specific rewards
        if (baseRewards.allies) {
            rewards.allies = baseRewards.allies;
        }
        if (baseRewards.assets) {
            rewards.assets = baseRewards.assets;
        }

        // Special rewards for high scores
        if (completionScore >= 100) {
            rewards.tools.push(this.generateTool(quest.category));
        }

        return rewards;
    }

    // Generate virtual allies
    generateAllies(quest, quality) {
        const allies = [];
        
        if (quality === 'excellent' && Math.random() > 0.7) {
            const allyTypes = ['Mentor', 'Partner', 'Advisor', 'Supporter', 'Collaborator'];
            const allyNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley'];
            
            allies.push({
                id: utils.generateId(),
                name: utils.randomElement(allyNames),
                type: utils.randomElement(allyTypes),
                category: quest.category,
                level: 1,
                unlockedAt: Date.now()
            });
        }
        
        return allies;
    }

    // Generate assets
    generateAssets(quest, quality) {
        const assets = [];
        
        if (quest.category === 'financial' && quality !== 'basic') {
            const assetTypes = ['Investment', 'Business Connection', 'Financial Tool', 'Resource'];
            assets.push({
                id: utils.generateId(),
                name: `${utils.randomElement(assetTypes)} - ${quest.category}`,
                type: 'financial',
                value: quality === 'excellent' ? 150 : 100,
                unlockedAt: Date.now()
            });
        }
        
        return assets;
    }

    // Generate tools
    generateTool(category) {
        const tools = {
            strategy: ['Strategic Planner', 'Decision Matrix', 'Analysis Framework'],
            social: ['Network Map', 'Communication Guide', 'Relationship Tracker'],
            financial: ['Budget Calculator', 'Investment Analyzer', 'Expense Tracker'],
            medical: ['Study Planner', 'Knowledge Base', 'Learning Path'],
            fitness: ['Workout Tracker', 'Progress Monitor', 'Training Plan']
        };

        return {
            id: utils.generateId(),
            name: utils.randomElement(tools[category] || tools.strategy),
            category: category,
            unlockedAt: Date.now()
        };
    }

    // Add rewards to inventory
    async addRewards(rewards) {
        this.inventory.money += rewards.money;
        this.inventory.resources.energy += rewards.resources.energy;
        this.inventory.resources.materials += rewards.resources.materials;
        this.inventory.resources.knowledge += rewards.resources.knowledge;
        this.inventory.influence += rewards.influence;

        // Add allies
        if (rewards.allies && rewards.allies.length > 0) {
            this.inventory.allies.push(...rewards.allies);
        }

        // Add assets
        if (rewards.assets && rewards.assets.length > 0) {
            this.inventory.assets.push(...rewards.assets);
        }

        // Add tools
        if (rewards.tools && rewards.tools.length > 0) {
            this.inventory.tools.push(...rewards.tools);
        }

        await this.saveInventory();
    }

    // Get inventory summary
    getInventory() {
        return { ...this.inventory };
    }

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(amount);
    }
}

// Export singleton instance
const materialRewardsSystem = new MaterialRewards();

