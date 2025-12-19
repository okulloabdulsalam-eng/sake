/**
 * Passive Skills System
 * Auto-activating defensive/utility skills (Solo Leveling style)
 */

class PassiveSkills {
    constructor() {
        this.passiveSkills = [
            {
                id: 'auto_heal',
                name: 'Auto Heal',
                description: 'Automatically restores health when below 30%. Activates once per hour.',
                icon: '💚',
                level: 0,
                maxLevel: 5,
                trigger: {
                    condition: 'health_below_30',
                    cooldown: 3600000 // 1 hour
                },
                effect: {
                    restoreHealth: 20,
                    restoreEnergy: 10
                }
            },
            {
                id: 'danger_sense',
                name: 'Danger Sense',
                description: 'Automatically detects threats and warns you. Passive detection system.',
                icon: '⚠️',
                level: 0,
                maxLevel: 3,
                trigger: {
                    condition: 'threat_detected',
                    cooldown: 0 // Always active
                },
                effect: {
                    threatDetection: true,
                    warningTime: 5000 // 5 seconds warning
                }
            },
            {
                id: 'energy_conservation',
                name: 'Energy Conservation',
                description: 'Reduces energy consumption by 10% per level. Passive efficiency boost.',
                icon: '⚡',
                level: 0,
                maxLevel: 5,
                trigger: {
                    condition: 'always_active',
                    cooldown: 0
                },
                effect: {
                    energyConsumptionReduction: 0.1 // 10% per level
                }
            },
            {
                id: 'focus_recovery',
                name: 'Focus Recovery',
                description: 'Increases focus regeneration rate. Passive mental recovery.',
                icon: '🧠',
                level: 0,
                maxLevel: 5,
                trigger: {
                    condition: 'always_active',
                    cooldown: 0
                },
                effect: {
                    focusRegenMultiplier: 1.1 // 10% per level
                }
            }
        ];
        this.lastActivation = {};
    }

    async init() {
        await this.loadPassiveSkills();
        this.startPassiveMonitoring();
    }

    async loadPassiveSkills() {
        try {
            const saved = await db.getStat('passive_skills');
            if (saved) {
                this.passiveSkills = saved.skills || this.passiveSkills;
                this.lastActivation = saved.lastActivation || {};
            }
        } catch (error) {
            console.error('Error loading passive skills:', error);
        }
    }

    async savePassiveSkills() {
        try {
            await db.saveStat('passive_skills', {
                skills: this.passiveSkills,
                lastActivation: this.lastActivation
            });
        } catch (error) {
            console.error('Error saving passive skills:', error);
        }
    }

    // Upgrade passive skill
    async upgradePassiveSkill(skillId) {
        const skill = this.passiveSkills.find(s => s.id === skillId);
        if (!skill) return false;

        if (skill.level >= skill.maxLevel) {
            showNotification('[System] Skill Maxed', `${skill.name} is already at maximum level.`, 'info');
            return false;
        }

        const cost = (skill.level + 1) * 2; // Increasing cost
        const playerData = gameEngine.getPlayerData();

        if (playerData.skillPoints < cost) {
            showNotification('[System] Insufficient Points', `You need ${cost} skill points.`, 'info');
            return false;
        }

        // Use skill points
        for (let i = 0; i < cost; i++) {
            await gameEngine.useSkillPoint();
        }

        skill.level++;
        await this.savePassiveSkills();

        showNotification(
            '[System] Passive Skill Upgraded',
            `${skill.name} upgraded to level ${skill.level}!`,
            'success'
        );

        return true;
    }

    // Check and activate passive skills
    async checkPassiveSkills() {
        for (const skill of this.passiveSkills) {
            if (skill.level === 0) continue; // Not unlocked

            const canActivate = await this.canActivate(skill);
            if (canActivate) {
                await this.activatePassiveSkill(skill);
            }
        }
    }

    // Check if passive skill can activate
    async canActivate(skill) {
        const lastAct = this.lastActivation[skill.id] || 0;
        const now = Date.now();

        // Check cooldown
        if (skill.trigger.cooldown > 0 && (now - lastAct) < skill.trigger.cooldown) {
            return false;
        }

        // Check condition
        switch (skill.trigger.condition) {
            case 'health_below_30':
                if (typeof energySystem !== 'undefined') {
                    const healthPercent = (energySystem.currentEnergy / energySystem.maxEnergy) * 100;
                    return healthPercent < 30;
                }
                return false;

            case 'threat_detected':
                if (typeof threatDetection !== 'undefined') {
                    const recentThreats = threatDetection.getRecentThreats(1);
                    return recentThreats.length > 0 && 
                           (now - recentThreats[0].detectedAt) < 10000; // Within 10 seconds
                }
                return false;

            case 'always_active':
                return true;

            default:
                return false;
        }
    }

    // Activate passive skill
    async activatePassiveSkill(skill) {
        this.lastActivation[skill.id] = Date.now();
        await this.savePassiveSkills();

        // Apply effects
        if (skill.effect.restoreHealth && typeof energySystem !== 'undefined') {
            const restoreAmount = skill.effect.restoreHealth * (1 + skill.level * 0.2);
            energySystem.restoreEnergy(restoreAmount);
        }

        if (skill.effect.restoreEnergy && typeof energySystem !== 'undefined') {
            const restoreAmount = skill.effect.restoreEnergy * (1 + skill.level * 0.2);
            energySystem.restoreFocus(restoreAmount);
        }

        if (skill.effect.threatDetection && typeof threatDetection !== 'undefined') {
            // Enhanced threat detection
            showNotification(
                '[System] Danger Sense Activated',
                'Potential threat detected. Stay alert.',
                'warning'
            );
        }

        // Show activation notification (only for visible effects)
        if (skill.trigger.condition !== 'always_active') {
            showNotification(
                '[System] Passive Skill Activated',
                `${skill.name} has activated automatically.`,
                'info'
            );
        }
    }

    // Start monitoring for passive skill activation
    startPassiveMonitoring() {
        // Check every 30 seconds
        setInterval(async () => {
            await this.checkPassiveSkills();
        }, 30000);

        // Check on initialization
        setTimeout(() => {
            this.checkPassiveSkills();
        }, 5000);
    }

    // Get passive skill multiplier
    getPassiveMultiplier(statName) {
        let multiplier = 1.0;

        for (const skill of this.passiveSkills) {
            if (skill.level === 0) continue;

            if (skill.effect.energyConsumptionReduction && statName === 'energy') {
                multiplier *= (1 - (skill.effect.energyConsumptionReduction * skill.level));
            }

            if (skill.effect.focusRegenMultiplier && statName === 'focus') {
                multiplier *= Math.pow(skill.effect.focusRegenMultiplier, skill.level);
            }
        }

        return multiplier;
    }

    // Render passive skills UI
    renderPassiveSkills(containerId = 'passive-skills-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const playerData = gameEngine.getPlayerData();

        container.innerHTML = `
            <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 1rem;">
                <h3 style="margin: 0 0 1rem 0; color: var(--text-primary);">[System] Passive Skills</h3>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem;">
                    Passive skills activate automatically when conditions are met. Upgrade them to increase effectiveness.
                </p>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
                    ${this.passiveSkills.map(skill => {
                        const cost = (skill.level + 1) * 2;
                        const canUpgrade = playerData.skillPoints >= cost && skill.level < skill.maxLevel;

                        return `
                            <div class="glass-panel" style="padding: 1rem; ${skill.level > 0 ? 'border: 1px solid var(--neon-blue);' : ''}">
                                <div style="display: flex; align-items: start; gap: 0.75rem; margin-bottom: 0.75rem;">
                                    <div style="font-size: 2rem;">${skill.icon}</div>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">
                                            ${skill.name} ${skill.level > 0 ? `Lv.${skill.level}` : '(Locked)'}
                                        </div>
                                        <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
                                            ${skill.description}
                                        </div>
                                    </div>
                                </div>
                                ${skill.level > 0 ? `
                                    <div style="margin-bottom: 0.75rem; padding: 0.5rem; background: rgba(0, 212, 255, 0.1); border-radius: 4px; font-size: 0.85rem; color: var(--text-primary);">
                                        Level ${skill.level}/${skill.maxLevel}
                                    </div>
                                ` : ''}
                                <button 
                                    class="btn-primary upgrade-passive-btn ${!canUpgrade ? 'disabled' : ''}" 
                                    data-skill-id="${skill.id}"
                                    style="width: 100%; ${!canUpgrade ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
                                    ${!canUpgrade ? 'disabled' : ''}
                                >
                                    ${skill.level === 0 ? 'Unlock' : 'Upgrade'} (${cost} SP)
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        // Attach event handlers
        container.querySelectorAll('.upgrade-passive-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const skillId = btn.dataset.skillId;
                const upgraded = await this.upgradePassiveSkill(skillId);
                if (upgraded) {
                    this.renderPassiveSkills();
                }
            });
        });
    }
}

const passiveSkills = new PassiveSkills();

