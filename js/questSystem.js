/**
 * Quest System - Real-time AI-powered quest generation from user input
 * Never pre-stored, all quests generated dynamically
 */

class QuestSystem {
    constructor() {
        this.quests = [];
        this.questVoiceRecognition = null; // Still used for report voice input
    }

    // Initialize quest system
    async init() {
        await this.loadQuests();
        await aiQuestGenerator.init();
        this.initReportVoiceInput();
    }

    // Initialize voice input for quest reports (not quest requests)
    initReportVoiceInput() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.questVoiceRecognition = new SpeechRecognition();
            this.questVoiceRecognition.continuous = false;
            this.questVoiceRecognition.interimResults = false;
            this.questVoiceRecognition.lang = 'en-US';
        }
    }

    // Load quests from database
    async loadQuests() {
        try {
            this.quests = await db.getAllQuests() || [];
        } catch (error) {
            console.error('Error loading quests:', error);
            this.quests = [];
        }
    }

    // Generate quest from user input (AI-powered)
    async generateQuestFromInput(userInput) {
        if (!userInput || !userInput.trim()) {
            throw new Error('Please provide a description of your activity or goal.');
        }

        try {
            // Show generation status
            const statusEl = document.getElementById('quest-generation-status');
            if (statusEl) {
                statusEl.style.display = 'flex';
            }

            // Generate quest using AI
            const quest = await aiQuestGenerator.generateQuestFromInput(userInput);
            
            // Add quest to system
            await this.addQuest(quest);
            
            // Auto-accept the quest
            await this.acceptQuest(quest.id);

            // Hide status
            if (statusEl) {
                statusEl.style.display = 'none';
            }

            // Show notification
            showNotification(
                '[System] Quest Generated',
                `"${quest.title}" has been assigned. Complete it to gain rewards, Hunter.`,
                'quest-assign'
            );

            // Render quests
            this.renderQuests();
            this.renderActiveQuestsPreview();

            // Show quest modal
            setTimeout(() => {
                this.showQuestModal(quest.id);
            }, 500);

            return quest;
        } catch (error) {
            console.error('Error generating quest:', error);
            const statusEl = document.getElementById('quest-generation-status');
            if (statusEl) {
                statusEl.style.display = 'none';
            }
            throw error;
        }
    }

    // Add quest
    async addQuest(quest) {
        this.quests.push(quest);
        await db.saveQuest(quest);
        return quest;
    }

    // Accept quest (change status to active)
    async acceptQuest(questId) {
        const quest = this.quests.find(q => q.id === questId);
        if (quest) {
            quest.status = 'active';
            await db.saveQuest(quest);
            
            showNotification(
                '[System] Quest Accepted',
                `"${quest.title}" is now active. Begin your mission, Hunter.`,
                'quest-accept'
            );
            
            return quest;
        }
        return null;
    }

    // Complete quest with report verification (called by report system after AI analysis)
    async completeQuestWithReport(questId, completionData, analysisResult) {
        const quest = this.quests.find(q => q.id === questId);
        if (!quest) return null;
        
        if (quest.status !== 'active') {
            return null;
        }
        
        // Evaluate completion and calculate rewards
        const pointRewards = await aiQuestGenerator.evaluateQuestCompletion(quest, completionData);
        
        // Generate material/conquest rewards
        const materialRewards = materialRewardsSystem.generateMaterialRewards(
            quest, 
            analysisResult.score, 
            analysisResult.quality
        );
        
        // Add material rewards to inventory
        await materialRewardsSystem.addRewards(materialRewards);
        
        // Update quest status
        quest.status = 'completed';
        quest.completedAt = Date.now();
        quest.completionData = completionData;
        quest.finalRewards = {
            ...pointRewards,
            material: materialRewards
        };
        
        // Award XP
        const result = await gameEngine.addXP(pointRewards.xp, `quest:${quest.title}`);
        
        // Award stats
        for (const [statName, value] of Object.entries(pointRewards.stats)) {
            await gameEngine.updateStat(statName, value);
        }
        
        // Award skill points if any
        if (pointRewards.skillPoints > 0) {
            const playerData = gameEngine.getPlayerData();
            playerData.skillPoints += pointRewards.skillPoints;
            await gameEngine.savePlayerData();
        }
        
        // Save quest
        await db.saveQuest(quest);
        
        // Show comprehensive reward notification
        this.showRewardNotification(quest, pointRewards, materialRewards);

        // Check if this is a penalty quest completion
        if (quest.type === 'penalty' && quest.penaltyId && typeof penaltyQuestSystem !== 'undefined') {
            await penaltyQuestSystem.removePenalty(quest.penaltyId);
        }

        // Show Solo Leveling-style rewards screen
        if (typeof questRewardsScreen !== 'undefined') {
            setTimeout(() => {
                questRewardsScreen.showRewardsScreen(quest, {
                    xp: pointRewards.xp,
                    stats: pointRewards.stats,
                    skillPoints: pointRewards.skillPoints,
                    material: materialRewards
                });
            }, 500);
        }
        
        // Mark activity for streak
        if (typeof streakSystem !== 'undefined') {
            await streakSystem.markActivity();
        }
        
        // Check achievements
        if (typeof achievementSystem !== 'undefined') {
            await achievementSystem.checkAchievements();
        }
        
        // Check quest chains
        if (typeof questChains !== 'undefined') {
            await questChains.checkChainProgress('knowledge_mastery');
        }
        
        // Check challenges
        if (typeof dailyChallenges !== 'undefined') {
            await dailyChallenges.checkChallengeProgress();
        }
        
        // Check evolution
        if (typeof shadowMonarch !== 'undefined') {
            await shadowMonarch.checkEvolution();
        }
        
        // Add to history
        await db.addHistory({
            type: 'quest_completed',
            questId: quest.id,
            questTitle: quest.title,
            xpGained: pointRewards.xp,
            bonuses: pointRewards.bonuses,
            materialRewards: materialRewards
        });
        
        // Update avatar based on rewards
        await this.updateAvatarFromRewards(pointRewards, materialRewards);
        
        return { quest, pointRewards, materialRewards };
    }

    // Show reward notification with points and material rewards
    showRewardNotification(quest, pointRewards, materialRewards) {
        let rewardText = `+${pointRewards.xp} XP`;
        if (pointRewards.bonuses) {
            rewardText += ` (+${pointRewards.bonusXP} bonus)`;
        }
        
        // Material rewards text
        let materialText = '';
        if (materialRewards.money > 0) {
            materialText += `💰 ${materialRewards.money} | `;
        }
        if (materialRewards.influence > 0) {
            materialText += `⭐ ${materialRewards.influence} Influence | `;
        }
        if (materialRewards.allies.length > 0) {
            materialText += `👥 ${materialRewards.allies.length} New Ally | `;
        }
        if (materialRewards.tools.length > 0) {
            materialText += `🔧 ${materialRewards.tools.length} Tool | `;
        }
        if (materialRewards.assets.length > 0) {
            materialText += `💼 ${materialRewards.assets.length} Asset`;
        }
        
        showNotification(
            '[System] Quest Completed!',
            `"${quest.title}" verified! ${rewardText}${materialText ? ' | ' + materialText.trim().replace(/\s*\|\s*$/, '') : ''}`,
            'quest-complete'
        );
    }

    // Update avatar based on rewards (for evolution)
    async updateAvatarFromRewards(pointRewards, materialRewards) {
        // Avatar evolves based on XP, influence, and allies
        const inventory = materialRewardsSystem.getInventory();
        
        // Avatar evolution logic can be added here based on:
        // - Total XP/Level
        // - Influence points
        // - Number of allies
        // - Assets owned
        
        // For now, we'll just update the UI
        gameEngine.updateUI();
    }

    // Get active quests
    getActiveQuests() {
        return this.quests.filter(q => q.status === 'active');
    }

    // Get pending quests
    getPendingQuests() {
        return this.quests.filter(q => q.status === 'pending');
    }

    // Get completed quests
    getCompletedQuests() {
        return this.quests.filter(q => q.status === 'completed');
    }

    // Get quest by ID
    getQuest(questId) {
        return this.quests.find(q => q.id === questId);
    }

    // Delete quest
    async deleteQuest(questId) {
        this.quests = this.quests.filter(q => q.id !== questId);
        await db.delete('quests', questId);
    }

    // Render quest card
    renderQuestCard(quest) {
        const statusClass = quest.status === 'active' ? 'active' : '';
        const statusText = quest.status === 'active' ? 'Active' : quest.status === 'completed' ? 'Completed' : 'Pending';
        
        // Quest type badge
        let typeBadge = '';
        if (quest.questType === 'knowledge_backed') {
            typeBadge = '<span style="color: #00d4ff; font-size: 0.7rem; font-weight: bold;">📚 KNOWLEDGE-BACKED</span>';
        } else if (quest.questType === 'ai_generated') {
            typeBadge = '<span style="color: #00d4ff; font-size: 0.7rem; font-weight: bold;">AI GENERATED</span>';
        }
        
        // Source attribution (hidden by default, can be toggled)
        let sourceAttribution = '';
        if (quest.knowledgeSource && quest.sourceAttribution) {
            const attribution = quest.sourceAttribution;
            sourceAttribution = `
                <div class="source-attribution" style="display: ${attribution.visible ? 'block' : 'none'}; margin-top: 0.5rem; padding: 0.5rem; background: rgba(0, 212, 255, 0.1); border-left: 2px solid #00d4ff; font-size: 0.75rem; color: var(--text-secondary);">
                    <strong>Source:</strong> ${attribution.source} by ${attribution.author}<br>
                    <strong>Principle:</strong> ${attribution.principle}
                </div>
            `;
        }
        
        // Difficulty indicator
        const difficultyBadge = quest.difficulty ? 
            `<span style="color: ${quest.difficulty === 'hard' ? '#ef4444' : quest.difficulty === 'medium' ? '#f59e0b' : '#34d399'}; font-size: 0.7rem; margin-left: 0.5rem;">
                ${quest.difficulty.toUpperCase()}
            </span>` : '';
        
        return `
            <div class="quest-card ${statusClass}" data-quest-id="${quest.id}">
                <div class="quest-header">
                    <div>
                        <h3 class="quest-title">${quest.title}</h3>
                        <div style="margin-top: 0.25rem;">
                            ${typeBadge}
                            ${difficultyBadge}
                        </div>
                    </div>
                    <span class="quest-xp">+${quest.xp} XP</span>
                </div>
                <p class="quest-description">${quest.description}</p>
                ${sourceAttribution}
                <div class="quest-footer">
                    <span class="quest-category">${quest.category}</span>
                    <span class="quest-status ${quest.status}">${statusText}</span>
                    ${quest.knowledgeSource ? '<button class="btn-source-toggle" style="font-size: 0.7rem; padding: 0.25rem 0.5rem; margin-left: 0.5rem;" onclick="questSystem.toggleSourceAttribution(\'' + quest.id + '\')">📚 Source</button>' : ''}
                </div>
            </div>
        `;
    }

    // Toggle source attribution visibility
    toggleSourceAttribution(questId) {
        const quest = this.getQuest(questId);
        if (!quest || !quest.sourceAttribution) return;

        quest.sourceAttribution.visible = !quest.sourceAttribution.visible;
        this.renderQuests(); // Re-render to update visibility
    }

    // Render all quests
    renderQuests() {
        const container = document.getElementById('quests-container');
        if (!container) return;
        
        const activeQuests = this.getActiveQuests();
        const pendingQuests = this.getPendingQuests();
        const completedQuests = this.getCompletedQuests().slice(0, 10); // Show last 10 completed
        
        if (activeQuests.length === 0 && pendingQuests.length === 0 && completedQuests.length === 0) {
            container.innerHTML = '<p class="empty-state">No quests yet. Describe your activity above to generate your first quest!</p>';
            return;
        }
        
        let html = '';
        
        if (activeQuests.length > 0) {
            html += '<h3 class="panel-title">Active Quests</h3>';
            activeQuests.forEach(quest => {
                html += this.renderQuestCard(quest);
            });
        }
        
        if (pendingQuests.length > 0) {
            html += '<h3 class="panel-title" style="margin-top: 2rem;">Pending Quests</h3>';
            pendingQuests.forEach(quest => {
                html += this.renderQuestCard(quest);
            });
        }
        
        if (completedQuests.length > 0) {
            html += '<h3 class="panel-title" style="margin-top: 2rem;">Recently Completed</h3>';
            completedQuests.forEach(quest => {
                html += this.renderQuestCard(quest);
            });
        }
        
        container.innerHTML = html;
        
        // Add event listeners
        container.querySelectorAll('.quest-card').forEach(card => {
            card.addEventListener('click', () => {
                const questId = card.dataset.questId;
                this.showQuestModal(questId);
            });
        });
    }

    // Show quest modal
    showQuestModal(questId) {
        const quest = this.getQuest(questId);
        if (!quest) return;
        
        const modal = document.getElementById('quest-modal');
        const modalTitle = document.getElementById('quest-modal-title');
        const modalBody = document.getElementById('quest-modal-body');
        const acceptBtn = document.getElementById('quest-accept-btn');
        const completeBtn = document.getElementById('quest-complete-btn');
        const cancelBtn = document.getElementById('quest-cancel-btn');
        
        modalTitle.textContent = quest.title;
        
        let statsHtml = '';
        if (Object.keys(quest.stats).length > 0) {
            statsHtml = '<div style="margin-top: 1rem;"><strong>Stat Rewards:</strong><ul style="margin-top: 0.5rem; padding-left: 1.5rem;">';
            for (const [stat, value] of Object.entries(quest.stats)) {
                statsHtml += `<li>${stat.charAt(0).toUpperCase() + stat.slice(1)}: +${value}</li>`;
            }
            statsHtml += '</ul></div>';
        }

        // Show completion rewards if completed
        let completionInfo = '';
        if (quest.status === 'completed' && quest.finalRewards) {
            const material = quest.finalRewards.material || {};
            let materialRewardsHtml = '';
            
            if (material.money > 0 || material.influence > 0 || material.allies?.length > 0 || material.tools?.length > 0) {
                materialRewardsHtml = '<div style="margin-top: 1rem; padding: 1rem; background: rgba(139, 92, 246, 0.1); border-radius: 8px; border: 1px solid #8b5cf6;"><strong style="color: #8b5cf6;">Material Rewards:</strong><div style="margin-top: 0.5rem;">';
                
                if (material.money > 0) {
                    materialRewardsHtml += `<div>💰 Money: ${materialRewardsSystem.formatCurrency(material.money)}</div>`;
                }
                if (material.influence > 0) {
                    materialRewardsHtml += `<div>⭐ Influence: +${material.influence}</div>`;
                }
                if (material.resources) {
                    if (material.resources.energy > 0) materialRewardsHtml += `<div>⚡ Energy: +${material.resources.energy}</div>`;
                    if (material.resources.materials > 0) materialRewardsHtml += `<div>📦 Materials: +${material.resources.materials}</div>`;
                    if (material.resources.knowledge > 0) materialRewardsHtml += `<div>📚 Knowledge: +${material.resources.knowledge}</div>`;
                }
                if (material.allies && material.allies.length > 0) {
                    materialRewardsHtml += `<div>👥 New Allies: ${material.allies.map(a => a.name).join(', ')}</div>`;
                }
                if (material.tools && material.tools.length > 0) {
                    materialRewardsHtml += `<div>🔧 Tools: ${material.tools.map(t => t.name).join(', ')}</div>`;
                }
                if (material.assets && material.assets.length > 0) {
                    materialRewardsHtml += `<div>💼 Assets: ${material.assets.map(a => a.name).join(', ')}</div>`;
                }
                
                materialRewardsHtml += '</div></div>';
            }
            
            completionInfo = `
                <div style="margin-top: 1rem; padding: 1rem; background: rgba(52, 211, 153, 0.1); border-radius: 8px; border: 1px solid #34d399;">
                    <strong style="color: #34d399;">Quest Completed!</strong>
                    <div style="margin-top: 0.5rem;">
                        <div>Final XP: ${quest.finalRewards.xp}${quest.finalRewards.bonusXP > 0 ? ` (+${quest.finalRewards.bonusXP} bonus)` : ''}</div>
                        ${quest.finalRewards.skillPoints > 0 ? `<div>Skill Points: +${quest.finalRewards.skillPoints}</div>` : ''}
                    </div>
                </div>
                ${materialRewardsHtml}
            `;
        }
        
        modalBody.innerHTML = `
            ${quest.questType === 'ai_generated' ? '<div style="color: #00d4ff; font-size: 0.85rem; margin-bottom: 0.5rem;">[AI Generated Quest]</div>' : ''}
            ${quest.difficulty ? `<div style="margin-bottom: 0.5rem;"><strong>Difficulty:</strong> <span style="color: ${quest.difficulty === 'hard' ? '#ef4444' : quest.difficulty === 'medium' ? '#f59e0b' : '#34d399'}">${quest.difficulty.toUpperCase()}</span></div>` : ''}
            <p>${quest.description}</p>
            ${quest.userInput ? `<div style="margin-top: 1rem; padding: 0.75rem; background: rgba(0, 212, 255, 0.05); border-left: 3px solid #00d4ff; border-radius: 4px; font-size: 0.9rem; color: var(--text-secondary);">
                <strong>Your input:</strong> "${quest.userInput}"
            </div>` : ''}
            <div style="margin-top: 1rem;">
                <strong>XP Reward:</strong> <span style="color: #ff6b35; font-weight: bold;">+${quest.xp} XP</span>
            </div>
            <div style="margin-top: 0.5rem;">
                <strong>Category:</strong> <span class="quest-category">${quest.category}</span>
            </div>
            ${statsHtml}
            ${completionInfo}
        `;
        
        // Show/hide buttons based on quest status
        if (quest.status === 'pending') {
            acceptBtn.style.display = 'block';
            completeBtn.style.display = 'none';
        } else if (quest.status === 'active') {
            acceptBtn.style.display = 'none';
            completeBtn.style.display = 'block';
        } else {
            acceptBtn.style.display = 'none';
            completeBtn.style.display = 'none';
        }
        
        // Remove existing listeners
        const newAcceptBtn = acceptBtn.cloneNode(true);
        acceptBtn.parentNode.replaceChild(newAcceptBtn, acceptBtn);
        const newCompleteBtn = completeBtn.cloneNode(true);
        completeBtn.parentNode.replaceChild(newCompleteBtn, completeBtn);
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        // Add new listeners
        document.getElementById('quest-accept-btn').addEventListener('click', async () => {
            await this.acceptQuest(questId);
            this.renderQuests();
            this.renderActiveQuestsPreview();
            modal.classList.remove('active');
        });
        
        document.getElementById('quest-complete-btn').addEventListener('click', () => {
            // Quest completion requires report submission, not manual completion
            modal.classList.remove('active');
            this.showReportSubmissionModal(questId);
        });
        
        document.getElementById('quest-cancel-btn').addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        modal.classList.add('active');
    }

    // Render active quests preview (for dashboard)
    renderActiveQuestsPreview() {
        const container = document.getElementById('active-quests-list');
        if (!container) return;
        
        const activeQuests = this.getActiveQuests().slice(0, 3);
        
        if (activeQuests.length === 0) {
            container.innerHTML = '<p class="empty-state">No active quests</p>';
            return;
        }
        
        let html = '';
        activeQuests.forEach(quest => {
            html += `
                <div class="quest-card active" style="margin-bottom: 0.75rem;" data-quest-id="${quest.id}">
                    <div class="quest-header">
                        <h4 style="font-size: 0.95rem; margin: 0;">${quest.title}</h4>
                        <span class="quest-xp" style="font-size: 0.75rem;">+${quest.xp} XP</span>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Add click listeners
        container.querySelectorAll('.quest-card').forEach(card => {
            card.addEventListener('click', () => {
                navigateTo('quests');
                setTimeout(() => {
                    const questId = card.dataset.questId;
                    this.showQuestModal(questId);
                }, 300);
            });
        });
    }

    // Show report submission modal for quest verification
    showReportSubmissionModal(questId) {
        const quest = this.getQuest(questId);
        if (!quest || quest.status !== 'active') return;

        // Create report submission modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'report-modal';
        modal.innerHTML = `
            <div class="modal-content glass-panel">
                <span class="modal-close">&times;</span>
                <h2 class="modal-title">Submit Report for Quest Verification</h2>
                <div class="modal-body">
                    <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                        Describe what you accomplished and how you completed this quest. The System will analyze your report to verify completion.
                    </p>
                    <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(0, 212, 255, 0.1); border-radius: 8px; border-left: 3px solid #00d4ff;">
                        <strong>Quest:</strong> ${quest.title}<br>
                        <strong>Description:</strong> ${quest.description}
                    </div>
                    <textarea 
                        id="report-text-input" 
                        class="quest-input-text" 
                        placeholder="Describe how you completed this quest. Include details about what you did, what happened, what you learned, and the results..."
                        rows="6"
                        style="width: 100%; margin-bottom: 1rem;"
                    ></textarea>
                    <div class="quest-input-actions">
                        <button id="btn-report-voice" class="btn-secondary" style="width: auto; margin: 0;">
                            <span style="margin-right: 0.5rem;">🎤</span> Voice
                        </button>
                        <button id="btn-submit-report" class="btn-primary" style="flex: 1; margin: 0;">
                            Submit Report
                        </button>
                    </div>
                    <div id="report-status" class="quest-generation-status" style="display: none;"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal
        modal.querySelector('.modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        // Submit report
        document.getElementById('btn-submit-report').addEventListener('click', async () => {
            const reportText = document.getElementById('report-text-input').value.trim();
            if (!reportText) {
                showNotification('Input Required', 'Please describe how you completed the quest.', 'info');
                return;
            }

            const statusEl = document.getElementById('report-status');
            statusEl.style.display = 'flex';
            statusEl.innerHTML = '<div class="loading-spinner" style="width: 20px; height: 20px; margin-right: 0.5rem;"></div><span>Submitting report...</span>';

            try {
                await reportSystem.submitReport(questId, reportText);
                document.body.removeChild(modal);
            } catch (error) {
                statusEl.innerHTML = `<span style="color: #ef4444;">Error: ${error.message}</span>`;
            }
        });

        // Voice input for report
        const voiceBtn = document.getElementById('btn-report-voice');
        if (voiceBtn && this.questVoiceRecognition) {
            voiceBtn.addEventListener('click', () => {
                if (this.questVoiceRecognition) {
                    if (this.questVoiceRecognition.running) {
                        this.questVoiceRecognition.stop();
                        voiceBtn.innerHTML = '<span style="margin-right: 0.5rem;">🎤</span> Voice';
                    } else {
                        this.questVoiceRecognition.start();
                        voiceBtn.innerHTML = '<span style="margin-right: 0.5rem;">🎤</span> Listening...';
                        
                        this.questVoiceRecognition.onresult = (event) => {
                            const transcript = event.results[0][0].transcript;
                            document.getElementById('report-text-input').value = transcript;
                            this.questVoiceRecognition.stop();
                            voiceBtn.innerHTML = '<span style="margin-right: 0.5rem;">🎤</span> Voice';
                        };
                    }
                }
            });
        }
    }
}

// Export singleton instance
const questSystem = new QuestSystem();
