/**
 * Real-World Crafting System
 * Combine real resources to create items that help with leveling
 */

class RealWorldCrafting {
    constructor() {
        this.recipes = [
            {
                id: 'study_plan',
                name: 'Study Plan',
                description: 'A comprehensive study plan combining knowledge resources. Improves learning efficiency.',
                icon: '📋',
                ingredients: {
                    knowledge: 20,
                    energy: 10
                },
                successRate: 0.8,
                result: {
                    type: 'tool',
                    stats: { intelligence: 3, learning: 5 },
                    duration: 7 * 24 * 60 * 60 * 1000 // 7 days
                }
            },
            {
                id: 'fitness_routine',
                name: 'Fitness Routine',
                description: 'A personalized fitness routine. Improves physical stats.',
                icon: '💪',
                ingredients: {
                    energy: 15,
                    materials: 5
                },
                successRate: 0.75,
                result: {
                    type: 'tool',
                    stats: { physical_fitness: 4, endurance: 3 },
                    duration: 7 * 24 * 60 * 60 * 1000
                }
            },
            {
                id: 'networking_strategy',
                name: 'Networking Strategy',
                description: 'A strategic approach to building connections. Improves social skills.',
                icon: '🤝',
                ingredients: {
                    knowledge: 15,
                    influence: 10
                },
                successRate: 0.7,
                result: {
                    type: 'tool',
                    stats: { social: 5, influence: 4 },
                    duration: 14 * 24 * 60 * 60 * 1000 // 14 days
                }
            },
            {
                id: 'financial_plan',
                name: 'Financial Plan',
                description: 'A comprehensive financial strategy. Improves financial literacy.',
                icon: '💰',
                ingredients: {
                    knowledge: 25,
                    money: 50
                },
                successRate: 0.65,
                result: {
                    type: 'tool',
                    stats: { financial: 6, strategy: 3 },
                    duration: 30 * 24 * 60 * 60 * 1000 // 30 days
                }
            }
        ];
    }

    async init() {
        this.renderCrafting();
    }

    getRecipe(recipeId) {
        return this.recipes.find(r => r.id === recipeId);
    }

    canCraft(recipeId) {
        const recipe = this.getRecipe(recipeId);
        if (!recipe) return false;

        const inventory = materialRewardsSystem.inventory;
        const resources = inventory.resources || {};

        // Check ingredients
        for (const [ingredient, amount] of Object.entries(recipe.ingredients)) {
            if (ingredient === 'money') {
                if ((inventory.money || 0) < amount) return false;
            } else if (ingredient === 'influence') {
                if ((inventory.influence || 0) < amount) return false;
            } else {
                if ((resources[ingredient] || 0) < amount) return false;
            }
        }

        return true;
    }

    calculateSuccessRate(recipeId) {
        const recipe = this.getRecipe(recipeId);
        if (!recipe) return 0;

        const playerData = gameEngine.getPlayerData();
        const intelligence = playerData.stats?.intelligence || 0;
        
        // Base success rate + intelligence bonus (up to +20%)
        const intelligenceBonus = Math.min(intelligence / 10, 0.2);
        return Math.min(recipe.successRate + intelligenceBonus, 0.95);
    }

    async craftItem(recipeId) {
        const recipe = this.getRecipe(recipeId);
        if (!recipe) {
            throw new Error('Recipe not found');
        }

        if (!this.canCraft(recipeId)) {
            throw new Error('Insufficient ingredients');
        }

        const inventory = materialRewardsSystem.inventory;
        const resources = inventory.resources || {};

        // Consume ingredients
        for (const [ingredient, amount] of Object.entries(recipe.ingredients)) {
            if (ingredient === 'money') {
                inventory.money -= amount;
            } else if (ingredient === 'influence') {
                inventory.influence -= amount;
            } else {
                resources[ingredient] = (resources[ingredient] || 0) - amount;
            }
        }

        inventory.resources = resources;
        await materialRewardsSystem.saveInventory();

        // Calculate success
        const successRate = this.calculateSuccessRate(recipeId);
        const success = Math.random() < successRate;

        if (success) {
            // Add crafted item to inventory
            if (!inventory.craftedItems) {
                inventory.craftedItems = [];
            }

            inventory.craftedItems.push({
                recipeId: recipeId,
                name: recipe.name,
                icon: recipe.icon,
                stats: recipe.result.stats,
                createdAt: Date.now(),
                expiresAt: Date.now() + recipe.result.duration
            });

            await materialRewardsSystem.saveInventory();

            showNotification(
                'Crafting Success!',
                `You successfully crafted ${recipe.name}!`,
                'success'
            );
        } else {
            showNotification(
                'Crafting Failed',
                `Failed to craft ${recipe.name}. Ingredients consumed but item was not created.`,
                'error'
            );
        }

        return success;
    }

    renderCrafting(containerId = 'crafting-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const inventory = materialRewardsSystem.inventory;
        const resources = inventory.resources || {};
        const playerData = gameEngine.getPlayerData();
        const intelligence = playerData.stats?.intelligence || 0;

        container.innerHTML = `
            <div class="glass-panel" style="margin-bottom: 1rem; padding: 1rem;">
                <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">Crafting System</h3>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">
                    Combine resources to create items that help you level up. Success rate varies based on your Intelligence level.
                </p>
                <div style="margin-top: 0.75rem; padding: 0.75rem; background: rgba(0, 212, 255, 0.1); border-radius: 8px; font-size: 0.85rem;">
                    <div>Your Intelligence: ${intelligence} (${Math.min(intelligence / 10, 20)}% success bonus)</div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
                ${this.recipes.map(recipe => {
                    const canCraft = this.canCraft(recipe.id);
                    const successRate = this.calculateSuccessRate(recipe.id);

                    return `
                        <div class="glass-panel holographic" style="padding: 1.25rem;">
                            <div style="display: flex; align-items: start; gap: 1rem; margin-bottom: 1rem;">
                                <div style="font-size: 3rem;">${recipe.icon}</div>
                                <div style="flex: 1;">
                                    <h4 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">${recipe.name}</h4>
                                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0; line-height: 1.4;">
                                        ${recipe.description}
                                    </p>
                                </div>
                            </div>
                            
                            <div style="margin-bottom: 1rem;">
                                <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Ingredients:</div>
                                ${Object.entries(recipe.ingredients).map(([ingredient, amount]) => {
                                    let available = 0;
                                    if (ingredient === 'money') {
                                        available = inventory.money || 0;
                                    } else if (ingredient === 'influence') {
                                        available = inventory.influence || 0;
                                    } else {
                                        available = resources[ingredient] || 0;
                                    }
                                    const hasEnough = available >= amount;
                                    return `
                                        <div style="display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.85rem; color: ${hasEnough ? 'var(--text-primary)' : '#ef4444'};">
                                            <span>${ingredient.charAt(0).toUpperCase() + ingredient.slice(1)}:</span>
                                            <span>${available}/${amount}</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>

                            <div style="margin-bottom: 1rem; padding: 0.75rem; background: rgba(168, 85, 247, 0.1); border-radius: 8px;">
                                <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">Success Rate:</div>
                                <div style="font-size: 1.1rem; font-weight: bold; color: var(--sl-purple-light);">
                                    ${Math.round(successRate * 100)}%
                                </div>
                                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">
                                    The rate of success and item quantity will vary based on the player's intelligence level.
                                </div>
                            </div>

                            <button 
                                class="btn-primary craft-item-btn ${!canCraft ? 'disabled' : ''}" 
                                data-recipe-id="${recipe.id}"
                                style="width: 100%; ${!canCraft ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
                                ${!canCraft ? 'disabled' : ''}
                            >
                                ${canCraft ? 'Craft Item' : 'Insufficient Ingredients'}
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Attach event handlers
        container.querySelectorAll('.craft-item-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const recipeId = btn.dataset.recipeId;
                try {
                    await this.craftItem(recipeId);
                    this.renderCrafting();
                } catch (error) {
                    showNotification('Crafting Failed', error.message, 'error');
                }
            });
        });
    }
}

const realWorldCrafting = new RealWorldCrafting();


