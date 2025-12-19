/**
 * Loot Box System
 * Random rewards with real-world items
 */

class LootBoxSystem {
    constructor() {
        this.lootBoxes = [
            {
                id: 'common_loot_box',
                name: 'Common Loot Box',
                rarity: 'common',
                icon: '📦',
                items: [
                    { type: 'money', min: 10, max: 50, weight: 30 },
                    { type: 'resource', resource: 'energy', min: 5, max: 15, weight: 25 },
                    { type: 'resource', resource: 'knowledge', min: 5, max: 15, weight: 25 },
                    { type: 'book_suggestion', weight: 20 }
                ]
            },
            {
                id: 'rare_loot_box',
                name: 'Rare Loot Box',
                rarity: 'rare',
                icon: '💎',
                items: [
                    { type: 'money', min: 50, max: 150, weight: 25 },
                    { type: 'resource', resource: 'energy', min: 15, max: 30, weight: 20 },
                    { type: 'resource', resource: 'knowledge', min: 15, max: 30, weight: 20 },
                    { type: 'course_suggestion', weight: 15 },
                    { type: 'tool_suggestion', weight: 10 },
                    { type: 'skill_point', min: 1, max: 2, weight: 10 }
                ]
            },
            {
                id: 'epic_loot_box',
                name: 'Epic Loot Box',
                rarity: 'epic',
                icon: '🌟',
                items: [
                    { type: 'money', min: 100, max: 300, weight: 20 },
                    { type: 'resource', resource: 'energy', min: 25, max: 50, weight: 15 },
                    { type: 'resource', resource: 'knowledge', min: 25, max: 50, weight: 15 },
                    { type: 'course_suggestion', weight: 20 },
                    { type: 'service_suggestion', weight: 15 },
                    { type: 'skill_point', min: 2, max: 5, weight: 10 },
                    { type: 'stat_boost', stat: 'random', min: 1, max: 3, weight: 5 }
                ]
            }
        ];
    }

    async openLootBox(rarity = 'common') {
        const lootBox = this.lootBoxes.find(box => box.rarity === rarity) || this.lootBoxes[0];
        const rewards = this.generateRewards(lootBox);

        // Show opening animation
        await this.showOpeningAnimation(lootBox, rewards);

        // Apply rewards
        await this.applyRewards(rewards);

        return rewards;
    }

    generateRewards(lootBox) {
        const rewards = {
            items: [],
            money: 0,
            resources: {},
            skillPoints: 0,
            statBoosts: {}
        };

        // Generate 1-3 items
        const itemCount = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < itemCount; i++) {
            const item = this.selectRandomItem(lootBox.items);
            if (!item) continue;

            switch (item.type) {
                case 'money':
                    const money = Math.floor(Math.random() * (item.max - item.min + 1)) + item.min;
                    rewards.money += money;
                    rewards.items.push({ type: 'money', amount: money, name: `$${money}` });
                    break;

                case 'resource':
                    const resourceAmount = Math.floor(Math.random() * (item.max - item.min + 1)) + item.min;
                    if (!rewards.resources[item.resource]) {
                        rewards.resources[item.resource] = 0;
                    }
                    rewards.resources[item.resource] += resourceAmount;
                    rewards.items.push({ 
                        type: 'resource', 
                        resource: item.resource, 
                        amount: resourceAmount,
                        name: `${item.resource} +${resourceAmount}`
                    });
                    break;

                case 'book_suggestion':
                    rewards.items.push({ 
                        type: 'book_suggestion', 
                        name: 'Book Recommendation',
                        description: 'A book that will help you level up'
                    });
                    break;

                case 'course_suggestion':
                    rewards.items.push({ 
                        type: 'course_suggestion', 
                        name: 'Course Recommendation',
                        description: 'A course that will boost your skills'
                    });
                    break;

                case 'tool_suggestion':
                    rewards.items.push({ 
                        type: 'tool_suggestion', 
                        name: 'Tool Recommendation',
                        description: 'A tool that will enhance your abilities'
                    });
                    break;

                case 'skill_point':
                    const skillPoints = Math.floor(Math.random() * (item.max - item.min + 1)) + item.min;
                    rewards.skillPoints += skillPoints;
                    rewards.items.push({ type: 'skill_point', amount: skillPoints, name: `Ability Points +${skillPoints}` });
                    break;

                case 'stat_boost':
                    const statBoost = Math.floor(Math.random() * (item.max - item.min + 1)) + item.min;
                    const stats = ['strength', 'intelligence', 'strategy', 'endurance', 'wisdom', 'social'];
                    const randomStat = stats[Math.floor(Math.random() * stats.length)];
                    if (!rewards.statBoosts[randomStat]) {
                        rewards.statBoosts[randomStat] = 0;
                    }
                    rewards.statBoosts[randomStat] += statBoost;
                    rewards.items.push({ 
                        type: 'stat_boost', 
                        stat: randomStat, 
                        amount: statBoost,
                        name: `${randomStat} +${statBoost}`
                    });
                    break;
            }
        }

        return rewards;
    }

    selectRandomItem(items) {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;

        for (const item of items) {
            random -= item.weight;
            if (random <= 0) {
                return item;
            }
        }

        return items[0];
    }

    async showOpeningAnimation(lootBox, rewards) {
        const modal = document.createElement('div');
        modal.className = 'modal loot-box-opening';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="modal-content glass-panel holographic" style="max-width: 400px; text-align: center;">
                <div style="font-size: 5rem; margin-bottom: 1rem; animation: lootBoxShake 0.5s infinite;">${lootBox.icon}</div>
                <h2 style="margin: 0 0 1rem 0; color: var(--text-primary);">Opening ${lootBox.name}...</h2>
                <div class="loading-spinner" style="width: 40px; height: 40px; margin: 0 auto;"></div>
            </div>
        `;

        document.body.appendChild(modal);

        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Show rewards
        modal.innerHTML = `
            <div class="modal-content glass-panel holographic" style="max-width: 500px;">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <div style="font-size: 4rem; margin-bottom: 0.5rem;">${lootBox.icon}</div>
                    <h2 style="margin: 0; color: var(--text-primary);">${lootBox.name} Opened!</h2>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="margin: 0 0 0.75rem 0; color: var(--text-primary);">Rewards:</h3>
                    ${rewards.items.map(item => `
                        <div style="padding: 0.75rem; background: rgba(168, 85, 247, 0.1); border-radius: 8px; margin-bottom: 0.5rem; color: var(--text-primary);">
                            ${item.name}
                        </div>
                    `).join('')}
                </div>
                <button class="btn-primary" style="width: 100%; padding: 1rem; font-size: 1.1rem; font-weight: bold;" onclick="this.closest('.modal').remove()">
                    Claim Rewards
                </button>
            </div>
        `;
    }

    async applyRewards(rewards) {
        const inventory = materialRewardsSystem.inventory;

        // Add money
        if (rewards.money > 0) {
            inventory.money = (inventory.money || 0) + rewards.money;
        }

        // Add resources
        if (rewards.resources) {
            if (!inventory.resources) {
                inventory.resources = {};
            }
            Object.entries(rewards.resources).forEach(([resource, amount]) => {
                inventory.resources[resource] = (inventory.resources[resource] || 0) + amount;
            });
        }

        // Add skill points
        if (rewards.skillPoints > 0) {
            const playerData = gameEngine.getPlayerData();
            playerData.skillPoints = (playerData.skillPoints || 0) + rewards.skillPoints;
            await gameEngine.savePlayerData();
        }

        // Apply stat boosts
        if (rewards.statBoosts) {
            for (const [stat, value] of Object.entries(rewards.statBoosts)) {
                await gameEngine.updateStat(stat, value);
            }
        }

        await materialRewardsSystem.saveInventory();

        showNotification(
            'Loot Box Rewards',
            `You received ${rewards.items.length} item(s) from the loot box!`,
            'success'
        );
    }
}

const lootBoxSystem = new LootBoxSystem();


