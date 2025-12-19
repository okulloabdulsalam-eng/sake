/**
 * Penalty Quest System
 * Consequences for failing daily quests (Solo Leveling style)
 */

class PenaltyQuestSystem {
    constructor() {
        this.penalties = [];
        this.penaltyHistory = [];
    }

    async init() {
        await this.loadPenalties();
        this.startDailyCheck();
    }

    async loadPenalties() {
        try {
            const saved = await db.getStat('penalty_quests');
            if (saved) {
                this.penalties = saved.penalties || [];
                this.penaltyHistory = saved.history || [];
            }
        } catch (error) {
            console.error('Error loading penalties:', error);
            this.penalties = [];
            this.penaltyHistory = [];
        }
    }

    async savePenalties() {
        try {
            await db.saveStat('penalty_quests', {
                penalties: this.penalties,
                history: this.penaltyHistory
            });
        } catch (error) {
            console.error('Error saving penalties:', error);
        }
    }

    // Check for failed daily quests
    async checkDailyQuestCompletion() {
        if (typeof dailyChallenges === 'undefined') return;

        const today = new Date().toDateString();
        const dailyQuests = dailyChallenges.dailyChallenges || [];
        
        for (const quest of dailyQuests) {
            if (quest.status === 'active' && !quest.completed) {
                // Check if quest expired (not completed by end of day)
                const questDate = new Date(quest.startDate).toDateString();
                if (questDate !== today) {
                    // Quest was not completed - apply penalty
                    await this.applyPenalty(quest);
                }
            }
        }
    }

    // Apply penalty for failed quest
    async applyPenalty(quest) {
        const penalty = {
            id: `penalty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            questId: quest.id,
            questTitle: quest.title,
            type: 'daily_quest_failure',
            appliedAt: Date.now(),
            severity: 'medium',
            effects: {
                statPenalty: -2, // Small stat reduction
                xpPenalty: -50,  // XP reduction
                message: 'Failed to complete daily quest'
            }
        };

        this.penalties.push(penalty);
        this.penaltyHistory.push(penalty);
        await this.savePenalties();

        // Apply penalty effects
        const playerData = gameEngine.getPlayerData();
        
        // Reduce random stat
        const stats = Object.keys(playerData.stats || {});
        if (stats.length > 0) {
            const randomStat = stats[Math.floor(Math.random() * stats.length)];
            await gameEngine.updateStat(randomStat, penalty.effects.statPenalty);
        }

        // Show penalty notification
        this.showPenaltyNotification(penalty);

        // Create penalty quest (mandatory)
        await this.createPenaltyQuest(penalty);

        return penalty;
    }

    // Create mandatory penalty quest
    async createPenaltyQuest(penalty) {
        const penaltyQuest = {
            id: `penalty_quest_${Date.now()}`,
            title: '[Penalty Quest] Redemption Challenge',
            description: `You failed to complete "${penalty.questTitle}". Complete this redemption quest to remove the penalty.`,
            category: 'penalty',
            difficulty: 'medium',
            type: 'penalty',
            status: 'active',
            createdAt: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            penaltyId: penalty.id,
            mandatory: true,
            rewards: {
                xp: 100,
                stats: {},
                removePenalty: true
            },
            requirements: {
                completeRedemption: true
            }
        };

        if (typeof questSystem !== 'undefined') {
            questSystem.quests.push(penaltyQuest);
            await db.saveQuest(penaltyQuest);
            questSystem.renderQuests();
        }

        showNotification(
            '[System] Penalty Quest Issued',
            'A mandatory redemption quest has been issued. Complete it to remove the penalty.',
            'warning'
        );

        return penaltyQuest;
    }

    // Remove penalty when redemption quest is completed
    async removePenalty(penaltyId) {
        this.penalties = this.penalties.filter(p => p.id !== penaltyId);
        await this.savePenalties();

        showNotification(
            '[System] Penalty Removed',
            'The penalty has been removed. Continue completing daily quests to avoid future penalties.',
            'success'
        );
    }

    // Show penalty notification
    showPenaltyNotification(penalty) {
        const modal = document.createElement('div');
        modal.className = 'modal penalty-notification';
        modal.style.display = 'flex';

        modal.innerHTML = `
            <div class="modal-content glass-panel holographic" style="max-width: 500px; border: 2px solid #ef4444;">
                <div class="sl-rewards-header" style="background: rgba(239, 68, 68, 0.2);">
                    <h2 class="sl-rewards-title" style="color: #ef4444;">[SYSTEM] PENALTY APPLIED</h2>
                </div>
                <div style="padding: 1.5rem;">
                    <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(239, 68, 68, 0.1); border-radius: 8px;">
                        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">
                            Failed Quest: ${penalty.questTitle}
                        </div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">
                            You failed to complete a daily quest. A penalty has been applied.
                        </div>
                    </div>

                    <div style="margin-bottom: 1rem;">
                        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">Penalty Effects:</div>
                        <ul style="color: var(--text-secondary); font-size: 0.9rem; padding-left: 1.5rem;">
                            <li>Stat reduction: ${penalty.effects.statPenalty} points</li>
                            <li>XP penalty: ${penalty.effects.xpPenalty} points</li>
                            <li>Mandatory redemption quest issued</li>
                        </ul>
                    </div>

                    <div style="padding: 1rem; background: rgba(0, 212, 255, 0.1); border-radius: 8px; margin-bottom: 1rem;">
                        <div style="font-size: 0.9rem; color: var(--text-primary);">
                            <strong>Note:</strong> Complete the redemption quest to remove this penalty.
                        </div>
                    </div>

                    <button class="btn-primary" style="width: 100%;" onclick="this.closest('.modal').remove()">
                        Acknowledge
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

    // Start daily check for failed quests
    startDailyCheck() {
        // Check every hour for failed daily quests
        setInterval(async () => {
            await this.checkDailyQuestCompletion();
        }, 60 * 60 * 1000);

        // Check on app start
        setTimeout(() => {
            this.checkDailyQuestCompletion();
        }, 5000);
    }

    // Get active penalties
    getActivePenalties() {
        return this.penalties.filter(p => {
            // Check if penalty was removed by completing redemption quest
            return true; // For now, all penalties are active until removed
        });
    }
}

const penaltyQuestSystem = new PenaltyQuestSystem();

