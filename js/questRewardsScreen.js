/**
 * Quest Rewards Screen
 * Solo Leveling-style reward display after quest completion
 */

class QuestRewardsScreen {
    constructor() {
        this.pendingRewards = [];
    }

    async showRewardsScreen(quest, rewards) {
        // Store rewards
        this.pendingRewards = {
            quest: quest,
            rewards: rewards,
            timestamp: Date.now()
        };

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal sl-rewards-screen';
        modal.style.display = 'flex';

        const rewardList = this.formatRewards(rewards);

        modal.innerHTML = `
            <div class="modal-content glass-panel holographic" style="max-width: 500px;">
                <div class="sl-rewards-header">
                    <h2 class="sl-rewards-title">QUEST REWARDS</h2>
                </div>
                <div class="sl-rewards-message">
                    You got rewards.
                </div>
                <div class="sl-rewards-list">
                    ${rewardList}
                </div>
                <div class="sl-rewards-question">
                    Accept this rewards?
                </div>
                <div class="sl-rewards-actions">
                    <button class="btn-primary sl-accept-rewards-btn" style="flex: 1; padding: 1rem; font-size: 1.1rem; font-weight: bold;">
                        Yes
                    </button>
                    <button class="btn-secondary sl-decline-rewards-btn" style="flex: 1; padding: 1rem; font-size: 1.1rem; font-weight: bold;">
                        No
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Accept button
        modal.querySelector('.sl-accept-rewards-btn').addEventListener('click', () => {
            this.acceptRewards();
            modal.remove();
        });

        // Decline button
        modal.querySelector('.sl-decline-rewards-btn').addEventListener('click', () => {
            modal.remove();
        });

        // Close on click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    formatRewards(rewards) {
        const items = [];
        let index = 1;

        // XP Reward
        if (rewards.xp && rewards.xp > 0) {
            items.push({
                number: index++,
                name: `XP +${rewards.xp}`,
                type: 'xp'
            });
        }

        // Stat Rewards
        if (rewards.stats) {
            Object.entries(rewards.stats).forEach(([stat, value]) => {
                if (value > 0) {
                    items.push({
                        number: index++,
                        name: `${stat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} +${value}`,
                        type: 'stat'
                    });
                }
            });
        }

        // Skill Points
        if (rewards.skillPoints && rewards.skillPoints > 0) {
            items.push({
                number: index++,
                name: `Ability Points +${rewards.skillPoints}`,
                type: 'skill_points'
            });
        }

        // Material Rewards
        if (rewards.material) {
            if (rewards.material.money > 0) {
                items.push({
                    number: index++,
                    name: `Money +$${rewards.material.money}`,
                    type: 'money'
                });
            }

            if (rewards.material.resources) {
                Object.entries(rewards.material.resources).forEach(([resource, amount]) => {
                    if (amount > 0) {
                        items.push({
                            number: index++,
                            name: `${resource.charAt(0).toUpperCase() + resource.slice(1)} +${amount}`,
                            type: 'resource'
                        });
                    }
                });
            }

            if (rewards.material.influence > 0) {
                items.push({
                    number: index++,
                    name: `Influence +${rewards.material.influence}`,
                    type: 'influence'
                });
            }
        }

        // Random Loot Box (if applicable)
        if (Math.random() > 0.7) { // 30% chance
            items.push({
                number: index++,
                name: 'Random Loot BOX',
                type: 'loot_box'
            });
        }

        return items.map(item => `
            <div class="sl-reward-item">
                <span class="sl-reward-number">${item.number}.</span>
                <span class="sl-reward-name">${item.name}</span>
            </div>
        `).join('');
    }

    async acceptRewards() {
        if (!this.pendingRewards.rewards) return;

        const rewards = this.pendingRewards.rewards;

        // Apply rewards (already applied by quest system, but we confirm here)
        showNotification(
            'Rewards Accepted',
            'All rewards have been added to your account.',
            'success'
        );

        // If loot box was included, open it
        if (this.pendingRewards.rewards.material && Math.random() > 0.7) {
            setTimeout(() => {
                if (typeof lootBoxSystem !== 'undefined') {
                    lootBoxSystem.openLootBox();
                }
            }, 1000);
        }
    }
}

const questRewardsScreen = new QuestRewardsScreen();


