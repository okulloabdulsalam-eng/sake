/**
 * Solo Leveling UI Enhancement System
 * Adds holographic effects, theme switching, and Solo Leveling-style UI elements
 */

class SoloLevelingUI {
    constructor() {
        this.currentTheme = 'blue'; // 'blue' or 'purple'
        this.holographicEnabled = true;
    }

    init() {
        this.loadThemePreference();
        this.applyTheme();
        this.setupThemeToggle();
        this.enhanceQuestCards();
        this.addCircuitBoardBackgrounds();
    }

    loadThemePreference() {
        const saved = localStorage.getItem('sl-ui-theme');
        if (saved) {
            this.currentTheme = saved;
        }
    }

    saveThemePreference() {
        localStorage.setItem('sl-ui-theme', this.currentTheme);
    }

    setupThemeToggle() {
        // Add theme toggle button to header (optional)
        // For now, we'll apply theme automatically based on context
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.currentTheme);
        
        if (this.currentTheme === 'purple') {
            document.body.classList.add('purple-theme');
        } else {
            document.body.classList.remove('purple-theme');
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'blue' ? 'purple' : 'blue';
        this.applyTheme();
        this.saveThemePreference();
        showNotification('Theme Changed', `Switched to ${this.currentTheme} theme`, 'info');
    }

    enhanceQuestCards() {
        // Add Solo Leveling style to quest cards periodically
        setInterval(() => {
            const questCards = document.querySelectorAll('.quest-card');
            questCards.forEach((card, index) => {
                // Add SL style to some quests (e.g., knowledge-backed quests)
                if (card.dataset.knowledgeBacked === 'true' && !card.classList.contains('sl-style')) {
                    card.classList.add('sl-style');
                }
            });
        }, 1000);
    }

    addCircuitBoardBackgrounds() {
        // Add circuit board pattern to main container
        const appContainer = document.querySelector('.app-container');
        if (appContainer && !appContainer.classList.contains('circuit-bg')) {
            appContainer.classList.add('circuit-bg');
        }
    }

    createQuestInfoScreen(quest) {
        // Create Solo Leveling-style quest info screen
        const modal = document.createElement('div');
        modal.className = 'modal sl-quest-info';
        modal.innerHTML = `
            <div class="modal-content glass-panel holographic" style="max-width: 500px;">
                <div class="sl-quest-header">
                    <div class="sl-quest-icon">⚠️</div>
                    <h2 class="sl-quest-title">QUEST INFO</h2>
                </div>
                <div class="sl-quest-arrival">
                    [${quest.title} has arrived.]
                </div>
                <div class="sl-quest-goal">
                    <h3>GOAL</h3>
                    <div class="sl-goal-list">
                        ${this.formatQuestGoals(quest)}
                    </div>
                </div>
                ${quest.warning ? `
                <div class="sl-quest-warning">
                    WARNING: ${quest.warning}
                </div>
                ` : ''}
                <div class="sl-quest-actions">
                    <button class="btn-primary sl-accept-btn">Accept Quest</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Close on click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Accept button
        const acceptBtn = modal.querySelector('.sl-accept-btn');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                if (typeof questSystem !== 'undefined') {
                    questSystem.acceptQuest(quest.id);
                }
                modal.remove();
            });
        }
        
        return modal;
    }

    formatQuestGoals(quest) {
        // Format quest goals in Solo Leveling style
        if (quest.goals && Array.isArray(quest.goals)) {
            return quest.goals.map((goal, index) => {
                const completed = goal.completed || false;
                return `
                    <div class="sl-goal-item ${completed ? 'completed' : ''}">
                        <span class="sl-goal-text">${goal.text}</span>
                        <span class="sl-goal-progress">[${goal.progress || 0}/${goal.target || 0}]</span>
                        <span class="sl-goal-check">${completed ? '✓' : '☐'}</span>
                    </div>
                `;
            }).join('');
        }
        
        // Fallback: use quest description
        return `
            <div class="sl-goal-item">
                <span class="sl-goal-text">${quest.description}</span>
                <span class="sl-goal-check">☐</span>
            </div>
        `;
    }

    createItemDetailModal(item) {
        // Create Solo Leveling-style item detail screen
        const modal = document.createElement('div');
        modal.className = 'modal sl-item-detail';
        modal.innerHTML = `
            <div class="modal-content glass-panel holographic" style="max-width: 600px;">
                <div class="sl-item-header">
                    <div class="sl-item-icon">${item.icon || '📦'}</div>
                    <div class="sl-item-info">
                        <h2 class="sl-item-name">ITEM: ${item.name}</h2>
                        <div class="sl-item-meta">
                            <span>ACQUISITION DIFFICULTY: ${item.difficulty || '---'}</span>
                            <span>CATEGORY: <span class="sl-category-highlight">${item.category || 'Material'}</span></span>
                        </div>
                    </div>
                </div>
                <div class="sl-item-description">
                    ${item.description || 'No description available.'}
                </div>
                ${item.effects ? `
                <div class="sl-item-effects">
                    <h3>Effects:</h3>
                    <ul>
                        ${item.effects.map(effect => `<li>${effect}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                <div class="sl-item-actions">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        return modal;
    }
}

const soloLevelingUI = new SoloLevelingUI();


