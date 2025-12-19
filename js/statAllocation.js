/**
 * Stat Point Allocation System
 * Manual stat point distribution on level-up (Solo Leveling style)
 */

class StatAllocation {
    constructor() {
        this.unallocatedPoints = 0;
    }

    async init() {
        await this.loadUnallocatedPoints();
    }

    async loadUnallocatedPoints() {
        try {
            const saved = await db.getStat('unallocated_stat_points');
            if (saved !== null && saved !== undefined) {
                this.unallocatedPoints = saved || 0;
            }
        } catch (error) {
            console.error('Error loading unallocated points:', error);
            this.unallocatedPoints = 0;
        }
    }

    async saveUnallocatedPoints() {
        await db.saveStat('unallocated_stat_points', this.unallocatedPoints);
    }

    // Award stat points on level-up
    async awardStatPoints(amount) {
        this.unallocatedPoints += amount;
        await this.saveUnallocatedPoints();
        this.showStatAllocationModal();
    }

    // Allocate stat point to a specific stat
    async allocateStatPoint(statName) {
        if (this.unallocatedPoints <= 0) {
            showNotification('[System] Insufficient Points', 'You have no unallocated stat points.', 'info');
            return false;
        }

        await gameEngine.updateStat(statName, 1);
        this.unallocatedPoints--;
        await this.saveUnallocatedPoints();
        
        showNotification(
            '[System] Stat Allocated',
            `${statName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} increased by 1.`,
            'success'
        );

        // Update UI
        this.renderStatAllocationUI();
        gameEngine.updateStatsUI();

        return true;
    }

    // Show stat allocation modal on level-up
    showStatAllocationModal() {
        const modal = document.createElement('div');
        modal.className = 'modal stat-allocation-modal';
        modal.style.display = 'flex';

        const playerData = gameEngine.getPlayerData();
        const stats = playerData.stats || {};

        modal.innerHTML = `
            <div class="modal-content glass-panel holographic" style="max-width: 600px;">
                <div class="sl-rewards-header">
                    <h2 class="sl-rewards-title">STAT POINT ALLOCATION</h2>
                </div>
                <div style="padding: 1.5rem;">
                    <div style="margin-bottom: 1.5rem; padding: 1rem; background: rgba(0, 212, 255, 0.1); border-radius: 8px; text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--neon-blue); margin-bottom: 0.5rem;">
                            Unallocated Points: ${this.unallocatedPoints}
                        </div>
                        <div style="font-size: 0.9rem; color: var(--text-secondary);">
                            Allocate your stat points to enhance your abilities
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                        ${Object.entries(stats).map(([statName, value]) => `
                            <div class="glass-panel" style="padding: 1rem; border: 1px solid var(--border-color);">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                                    <div>
                                        <div style="font-weight: 600; color: var(--text-primary); text-transform: capitalize;">
                                            ${statName.replace('_', ' ')}
                                        </div>
                                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                                            Current: ${value}
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    class="btn-primary allocate-stat-btn ${this.unallocatedPoints <= 0 ? 'disabled' : ''}" 
                                    data-stat="${statName}"
                                    style="width: 100%; ${this.unallocatedPoints <= 0 ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
                                    ${this.unallocatedPoints <= 0 ? 'disabled' : ''}
                                >
                                    +1
                                </button>
                            </div>
                        `).join('')}
                    </div>

                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-secondary" style="flex: 1;" onclick="this.closest('.modal').remove()">
                            Allocate Later
                        </button>
                        <button class="btn-primary" style="flex: 1;" onclick="this.closest('.modal').remove()">
                            Done
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Attach event handlers
        modal.querySelectorAll('.allocate-stat-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const statName = btn.dataset.stat;
                await this.allocateStatPoint(statName);
                
                // Update button states
                if (this.unallocatedPoints <= 0) {
                    modal.querySelectorAll('.allocate-stat-btn').forEach(b => {
                        b.disabled = true;
                        b.classList.add('disabled');
                        b.style.opacity = '0.5';
                    });
                }
                
                // Update display
                const unallocatedDisplay = modal.querySelector('.stat-allocation-modal .glass-panel:first-child div:first-child');
                if (unallocatedDisplay) {
                    unallocatedDisplay.textContent = `Unallocated Points: ${this.unallocatedPoints}`;
                }
            });
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Render stat allocation UI on stats page
    renderStatAllocationUI(containerId = 'stat-allocation-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.unallocatedPoints <= 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = `
            <div class="glass-panel holographic" style="padding: 1.5rem; margin-bottom: 1rem; border: 2px solid var(--neon-blue);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div>
                        <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">[System] Stat Point Allocation</h3>
                        <div style="font-size: 1.2rem; font-weight: bold; color: var(--neon-blue);">
                            Unallocated Points: ${this.unallocatedPoints}
                        </div>
                    </div>
                    <button class="btn-primary" id="btn-open-stat-allocation">
                        Allocate Points
                    </button>
                </div>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">
                    You have unallocated stat points. Allocate them to enhance your abilities.
                </p>
            </div>
        `;

        // Open allocation modal
        const openBtn = document.getElementById('btn-open-stat-allocation');
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                this.showStatAllocationModal();
            });
        }
    }

    getUnallocatedPoints() {
        return this.unallocatedPoints;
    }
}

const statAllocation = new StatAllocation();

