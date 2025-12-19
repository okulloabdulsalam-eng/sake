/**
 * Instant Dungeons System
 * Private training challenges (Solo Leveling style, adapted for real-world)
 */

class InstantDungeons {
    constructor() {
        this.dungeons = [];
        this.activeDungeon = null;
        this.dungeonHistory = [];
    }

    async init() {
        await this.loadDungeons();
        this.generateDungeons();
    }

    async loadDungeons() {
        try {
            const saved = await db.getStat('instant_dungeons');
            if (saved) {
                this.dungeons = saved.dungeons || [];
                this.dungeonHistory = saved.history || [];
            }
        } catch (error) {
            console.error('Error loading dungeons:', error);
            this.dungeons = [];
            this.dungeonHistory = [];
        }
    }

    async saveDungeons() {
        try {
            await db.saveStat('instant_dungeons', {
                dungeons: this.dungeons,
                history: this.dungeonHistory
            });
        } catch (error) {
            console.error('Error saving dungeons:', error);
        }
    }

    // Generate dungeons based on player level
    generateDungeons() {
        const playerData = gameEngine.getPlayerData();
        const level = playerData.level;

        if (this.dungeons.length > 0) return; // Already generated

        this.dungeons = [
            {
                id: 'dungeon_basic_training',
                name: 'Basic Training Dungeon',
                description: 'A controlled environment for basic skill practice. Complete real-world exercises to progress.',
                icon: '🏋️',
                difficulty: 'easy',
                level: 1,
                maxLevel: 10,
                challenges: [
                    'Complete 10 push-ups',
                    'Read for 30 minutes',
                    'Practice a skill for 1 hour',
                    'Complete a small project'
                ],
                rewards: {
                    xp: 50,
                    stats: { strength: 1, intelligence: 1 },
                    resources: { energy: 5, knowledge: 5 }
                }
            },
            {
                id: 'dungeon_mental_fortitude',
                name: 'Mental Fortitude Dungeon',
                description: 'Challenge your mental strength through focused exercises and problem-solving.',
                icon: '🧠',
                difficulty: 'medium',
                level: 5,
                maxLevel: 20,
                challenges: [
                    'Solve 5 complex problems',
                    'Meditate for 20 minutes',
                    'Learn something new for 2 hours',
                    'Complete a challenging task'
                ],
                rewards: {
                    xp: 150,
                    stats: { intelligence: 3, wisdom: 2 },
                    resources: { knowledge: 15, energy: 10 }
                }
            },
            {
                id: 'dungeon_social_mastery',
                name: 'Social Mastery Dungeon',
                description: 'Improve your social skills through real-world interactions and networking.',
                icon: '🤝',
                difficulty: 'medium',
                level: 3,
                maxLevel: 15,
                challenges: [
                    'Have a meaningful conversation',
                    'Attend a networking event',
                    'Help someone with a problem',
                    'Build a new connection'
                ],
                rewards: {
                    xp: 120,
                    stats: { social: 3, influence: 2 },
                    resources: { influence: 10 }
                }
            },
            {
                id: 'dungeon_elite_training',
                name: 'Elite Training Dungeon',
                description: 'Advanced challenges for experienced players. Requires high level and dedication.',
                icon: '⚔️',
                difficulty: 'hard',
                level: 10,
                maxLevel: 30,
                challenges: [
                    'Complete a major project',
                    'Achieve a significant goal',
                    'Overcome a major obstacle',
                    'Master a complex skill'
                ],
                rewards: {
                    xp: 300,
                    stats: { strategy: 5, wisdom: 4, intelligence: 3 },
                    resources: { energy: 20, knowledge: 25, influence: 15 },
                    skillPoints: 1
                }
            }
        ];

        this.saveDungeons();
    }

    // Enter a dungeon
    async enterDungeon(dungeonId) {
        const dungeon = this.dungeons.find(d => d.id === dungeonId);
        if (!dungeon) {
            throw new Error('Dungeon not found');
        }

        const playerData = gameEngine.getPlayerData();
        if (playerData.level < dungeon.level) {
            throw new Error(`You must be level ${dungeon.level} to enter this dungeon.`);
        }

        this.activeDungeon = {
            ...dungeon,
            enteredAt: Date.now(),
            challengesCompleted: [],
            progress: 0
        };

        await this.saveDungeons();

        this.showDungeonInterface(dungeon);

        showNotification(
            '[System] Dungeon Entered',
            `You have entered ${dungeon.name}. Complete the challenges to earn rewards.`,
            'info'
        );
    }

    // Complete a dungeon challenge
    async completeChallenge(challengeIndex) {
        if (!this.activeDungeon) return false;

        const challenge = this.activeDungeon.challenges[challengeIndex];
        if (!challenge) return false;

        if (this.activeDungeon.challengesCompleted.includes(challengeIndex)) {
            showNotification('[System] Challenge Already Completed', 'This challenge has already been completed.', 'info');
            return false;
        }

        // Mark challenge as completed
        this.activeDungeon.challengesCompleted.push(challengeIndex);
        this.activeDungeon.progress = (this.activeDungeon.challengesCompleted.length / this.activeDungeon.challenges.length) * 100;

        await this.saveDungeons();

        // Check if dungeon is complete
        if (this.activeDungeon.challengesCompleted.length === this.activeDungeon.challenges.length) {
            await this.completeDungeon();
        } else {
            this.showDungeonInterface(this.activeDungeon);
        }

        return true;
    }

    // Complete dungeon and award rewards
    async completeDungeon() {
        if (!this.activeDungeon) return;

        const dungeon = this.activeDungeon;
        const rewards = dungeon.rewards;

        // Award XP
        if (rewards.xp > 0) {
            await gameEngine.addXP(rewards.xp, `dungeon:${dungeon.id}`);
        }

        // Award stats
        if (rewards.stats) {
            for (const [stat, value] of Object.entries(rewards.stats)) {
                await gameEngine.updateStat(stat, value);
            }
        }

        // Award resources
        if (rewards.resources) {
            const inventory = materialRewardsSystem.inventory;
            if (!inventory.resources) {
                inventory.resources = {};
            }
            for (const [resource, amount] of Object.entries(rewards.resources)) {
                inventory.resources[resource] = (inventory.resources[resource] || 0) + amount;
            }
            await materialRewardsSystem.saveInventory();
        }

        // Award skill points
        if (rewards.skillPoints > 0) {
            const playerData = gameEngine.getPlayerData();
            playerData.skillPoints += rewards.skillPoints;
            await gameEngine.savePlayerData();
        }

        // Record completion
        this.dungeonHistory.push({
            dungeonId: dungeon.id,
            dungeonName: dungeon.name,
            completedAt: Date.now(),
            rewards: rewards
        });

        await this.saveDungeons();

        // Show completion notification
        this.showDungeonCompletion(dungeon, rewards);

        // Clear active dungeon
        this.activeDungeon = null;
    }

    // Show dungeon interface
    showDungeonInterface(dungeon) {
        const modal = document.createElement('div');
        modal.className = 'modal instant-dungeon';
        modal.style.display = 'flex';

        const progress = this.activeDungeon ? this.activeDungeon.progress : 0;

        modal.innerHTML = `
            <div class="modal-content glass-panel holographic" style="max-width: 600px;">
                <div class="sl-rewards-header">
                    <h2 class="sl-rewards-title">INSTANT DUNGEON</h2>
                </div>
                <div style="padding: 1.5rem;">
                    <div style="margin-bottom: 1.5rem;">
                        <div style="font-size: 3rem; text-align: center; margin-bottom: 0.5rem;">${dungeon.icon}</div>
                        <h3 style="text-align: center; margin: 0 0 0.5rem 0; color: var(--text-primary);">${dungeon.name}</h3>
                        <p style="text-align: center; color: var(--text-secondary); font-size: 0.9rem; margin: 0;">
                            ${dungeon.description}
                        </p>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                            <span style="color: var(--text-primary); font-weight: 600;">Progress</span>
                            <span style="color: var(--neon-blue);">${Math.round(progress)}%</span>
                        </div>
                        <div style="width: 100%; height: 20px; background: var(--bg-secondary); border-radius: 10px; overflow: hidden;">
                            <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, var(--neon-blue), var(--accent-purple)); transition: width 0.3s ease;"></div>
                        </div>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.75rem;">Challenges:</div>
                        ${dungeon.challenges.map((challenge, index) => {
                            const completed = this.activeDungeon && this.activeDungeon.challengesCompleted.includes(index);
                            return `
                                <div style="padding: 0.75rem; margin-bottom: 0.5rem; background: ${completed ? 'rgba(34, 211, 153, 0.1)' : 'var(--bg-secondary)'}; border-radius: 8px; border: 1px solid ${completed ? '#22d399' : 'var(--border-color)'};">
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <div style="font-size: 1.5rem;">${completed ? '✓' : '○'}</div>
                                        <div style="flex: 1; color: var(--text-primary); ${completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
                                            ${challenge}
                                        </div>
                                        ${!completed ? `
                                            <button class="btn-primary complete-challenge-btn" data-challenge-index="${index}" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                                                Complete
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-secondary" style="flex: 1;" onclick="this.closest('.modal').remove()">
                            Close
                        </button>
                        ${this.activeDungeon ? `
                            <button class="btn-secondary" style="flex: 1;" id="btn-exit-dungeon">
                                Exit Dungeon
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Complete challenge buttons
        modal.querySelectorAll('.complete-challenge-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const index = parseInt(btn.dataset.challengeIndex);
                await this.completeChallenge(index);
            });
        });

        // Exit dungeon button
        const exitBtn = document.getElementById('btn-exit-dungeon');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                this.activeDungeon = null;
                modal.remove();
                showNotification('[System] Dungeon Exited', 'You can re-enter the dungeon later to continue.', 'info');
            });
        }

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Show dungeon completion
    showDungeonCompletion(dungeon, rewards) {
        const modal = document.createElement('div');
        modal.className = 'modal dungeon-completion';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="modal-content glass-panel holographic" style="max-width: 500px;">
                <div class="sl-rewards-header">
                    <h2 class="sl-rewards-title">DUNGEON COMPLETED</h2>
                </div>
                <div style="padding: 1.5rem; text-align: center;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">${dungeon.icon}</div>
                    <h3 style="margin: 0 0 1rem 0; color: var(--text-primary);">${dungeon.name}</h3>
                    <div style="margin-bottom: 1.5rem;">
                        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.75rem;">Rewards:</div>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            ${rewards.xp ? `<div style="color: var(--text-primary);">+${rewards.xp} XP</div>` : ''}
                            ${rewards.stats ? Object.entries(rewards.stats).map(([stat, value]) => 
                                `<div style="color: var(--text-primary);">${stat.replace('_', ' ')} +${value}</div>`
                            ).join('') : ''}
                            ${rewards.skillPoints ? `<div style="color: var(--text-primary);">+${rewards.skillPoints} Skill Points</div>` : ''}
                        </div>
                    </div>
                    <button class="btn-primary" style="width: 100%;" onclick="this.closest('.modal').remove()">
                        Claim Rewards
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Render dungeons list
    renderDungeons(containerId = 'instant-dungeons-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const playerData = gameEngine.getPlayerData();
        const level = playerData.level;

        container.innerHTML = `
            <div class="glass-panel" style="padding: 1.5rem;">
                <h3 style="margin: 0 0 1rem 0; color: var(--text-primary);">[System] Instant Dungeons</h3>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem;">
                    Enter private training dungeons to complete real-world challenges and earn rewards.
                </p>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
                    ${this.dungeons.map(dungeon => {
                        const canEnter = level >= dungeon.level;
                        const difficultyColors = {
                            easy: '#22d399',
                            medium: '#fbbf24',
                            hard: '#ef4444'
                        };

                        return `
                            <div class="glass-panel holographic" style="padding: 1.25rem; ${!canEnter ? 'opacity: 0.6;' : ''}">
                                <div style="text-align: center; margin-bottom: 1rem;">
                                    <div style="font-size: 3rem; margin-bottom: 0.5rem;">${dungeon.icon}</div>
                                    <h4 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">${dungeon.name}</h4>
                                    <div style="font-size: 0.85rem; color: ${difficultyColors[dungeon.difficulty]}; font-weight: 600; text-transform: uppercase;">
                                        ${dungeon.difficulty}
                                    </div>
                                </div>
                                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem; line-height: 1.4;">
                                    ${dungeon.description}
                                </p>
                                <div style="margin-bottom: 1rem; font-size: 0.85rem; color: var(--text-muted);">
                                    <div>Level Required: ${dungeon.level}</div>
                                    <div>Challenges: ${dungeon.challenges.length}</div>
                                </div>
                                <button 
                                    class="btn-primary enter-dungeon-btn ${!canEnter ? 'disabled' : ''}" 
                                    data-dungeon-id="${dungeon.id}"
                                    style="width: 100%; ${!canEnter ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
                                    ${!canEnter ? 'disabled' : ''}
                                >
                                    ${canEnter ? 'Enter Dungeon' : `Level ${dungeon.level} Required`}
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        // Attach event handlers
        container.querySelectorAll('.enter-dungeon-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const dungeonId = btn.dataset.dungeonId;
                try {
                    await this.enterDungeon(dungeonId);
                } catch (error) {
                    showNotification('[System] Cannot Enter Dungeon', error.message, 'error');
                }
            });
        });
    }
}

const instantDungeons = new InstantDungeons();

