/**
 * Energy/Focus System (HP/MP equivalent)
 * Represents real-world resources: Energy (physical) and Focus (mental)
 */

class EnergySystem {
    constructor() {
        this.maxEnergy = 100;
        this.maxFocus = 100;
        this.currentEnergy = 100;
        this.currentFocus = 100;
        this.regenerationRate = {
            energy: 1, // per hour
            focus: 0.8 // per hour
        };
    }

    async init() {
        await this.loadEnergyData();
        this.startRegeneration();
        this.renderEnergyBars();
    }

    async loadEnergyData() {
        try {
            const saved = await db.getStat('energy_system');
            if (saved) {
                this.maxEnergy = saved.maxEnergy || 100;
                this.maxFocus = saved.maxFocus || 100;
                this.currentEnergy = saved.currentEnergy || 100;
                this.currentFocus = saved.currentFocus || 100;
                this.lastUpdate = saved.lastUpdate || Date.now();
                
                // Regenerate based on time passed
                const hoursPassed = (Date.now() - this.lastUpdate) / (1000 * 60 * 60);
                this.regenerateOverTime(hoursPassed);
            }
        } catch (error) {
            console.error('Error loading energy data:', error);
        }
    }

    async saveEnergyData() {
        try {
            await db.saveStat('energy_system', {
                maxEnergy: this.maxEnergy,
                maxFocus: this.maxFocus,
                currentEnergy: this.currentEnergy,
                currentFocus: this.currentFocus,
                lastUpdate: Date.now()
            });
        } catch (error) {
            console.error('Error saving energy data:', error);
        }
    }

    regenerateOverTime(hours) {
        // Regenerate energy and focus based on time passed
        const energyRegen = Math.min(this.regenerationRate.energy * hours, this.maxEnergy - this.currentEnergy);
        const focusRegen = Math.min(this.regenerationRate.focus * hours, this.maxFocus - this.currentFocus);
        
        this.currentEnergy = Math.min(this.currentEnergy + energyRegen, this.maxEnergy);
        this.currentFocus = Math.min(this.currentFocus + focusRegen, this.maxFocus);
    }

    startRegeneration() {
        // Save every 5 minutes
        setInterval(async () => {
            await this.saveEnergyData();
        }, 5 * 60 * 1000);

        // Regenerate every hour
        setInterval(() => {
            this.currentEnergy = Math.min(this.currentEnergy + this.regenerationRate.energy, this.maxEnergy);
            this.currentFocus = Math.min(this.currentFocus + this.regenerationRate.focus, this.maxFocus);
            this.saveEnergyData();
            this.renderEnergyBars();
        }, 60 * 60 * 1000);
    }

    consumeEnergy(amount) {
        if (this.currentEnergy < amount) {
            return false;
        }
        this.currentEnergy -= amount;
        this.saveEnergyData();
        this.renderEnergyBars();
        return true;
    }

    consumeFocus(amount) {
        if (this.currentFocus < amount) {
            return false;
        }
        this.currentFocus -= amount;
        this.saveEnergyData();
        this.renderEnergyBars();
        return true;
    }

    restoreEnergy(amount) {
        this.currentEnergy = Math.min(this.currentEnergy + amount, this.maxEnergy);
        this.saveEnergyData();
        this.renderEnergyBars();
    }

    restoreFocus(amount) {
        this.currentFocus = Math.min(this.currentFocus + amount, this.maxFocus);
        this.saveEnergyData();
        this.renderEnergyBars();
    }

    renderEnergyBars(containerId = 'energy-bars-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const energyPercent = (this.currentEnergy / this.maxEnergy) * 100;
        const focusPercent = (this.currentFocus / this.maxFocus) * 100;

        container.innerHTML = `
            <div class="glass-panel" style="padding: 1rem;">
                <h3 style="margin: 0 0 1rem 0; color: var(--text-primary);">Resources</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.2rem;">⚡</span>
                                <span style="color: var(--text-primary); font-weight: 600;">Energy</span>
                            </div>
                            <span style="color: var(--text-secondary); font-family: 'Courier New', monospace;">
                                ${Math.round(this.currentEnergy)}/${this.maxEnergy}
                            </span>
                        </div>
                        <div style="width: 100%; height: 24px; background: var(--bg-secondary); border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color);">
                            <div style="width: ${energyPercent}%; height: 100%; background: linear-gradient(90deg, var(--accent-orange), var(--neon-blue)); transition: width 0.3s ease; display: flex; align-items: center; justify-content: flex-end; padding-right: 0.5rem;">
                                ${energyPercent > 15 ? `<span style="font-size: 0.7rem; color: white; font-weight: bold;">${Math.round(energyPercent)}%</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.2rem;">🧠</span>
                                <span style="color: var(--text-primary); font-weight: 600;">Focus</span>
                            </div>
                            <span style="color: var(--text-secondary); font-family: 'Courier New', monospace;">
                                ${Math.round(this.currentFocus)}/${this.maxFocus}
                            </span>
                        </div>
                        <div style="width: 100%; height: 24px; background: var(--bg-secondary); border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color);">
                            <div style="width: ${focusPercent}%; height: 100%; background: linear-gradient(90deg, var(--accent-purple), var(--neon-blue-light)); transition: width 0.3s ease; display: flex; align-items: center; justify-content: flex-end; padding-right: 0.5rem;">
                                ${focusPercent > 15 ? `<span style="font-size: 0.7rem; color: white; font-weight: bold;">${Math.round(focusPercent)}%</span>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); font-size: 0.85rem; color: var(--text-secondary);">
                    <div>⚡ Energy regenerates ${this.regenerationRate.energy}/hour</div>
                    <div>🧠 Focus regenerates ${this.regenerationRate.focus}/hour</div>
                </div>
            </div>
        `;
    }
}

const energySystem = new EnergySystem();

