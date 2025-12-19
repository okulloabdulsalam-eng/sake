/**
 * Active Skills System
 * Real-world abilities that can be activated with Energy/Focus costs
 */

class ActiveSkills {
    constructor() {
        this.skills = [
            {
                id: 'deep_focus',
                name: 'Deep Focus',
                description: 'Enter a state of intense concentration. Temporarily boosts Intelligence and Focus regeneration.',
                icon: '🎯',
                category: 'mental',
                mpCost: 30, // Focus cost
                cooldown: 3600000, // 1 hour in ms
                duration: 1800000, // 30 minutes
                buff: {
                    intelligence: 1.2,
                    focusRegen: 1.5
                },
                level: 1,
                maxLevel: 10
            },
            {
                id: 'physical_boost',
                name: 'Physical Boost',
                description: 'Temporary physical enhancement. Boosts Strength and Endurance.',
                icon: '💪',
                category: 'physical',
                mpCost: 25, // Energy cost
                cooldown: 3600000,
                duration: 1800000,
                buff: {
                    strength: 1.15,
                    endurance: 1.15
                },
                level: 1,
                maxLevel: 10
            },
            {
                id: 'strategic_planning',
                name: 'Strategic Planning',
                description: 'Enhanced strategic thinking. Boosts Strategy and Wisdom.',
                icon: '🧠',
                category: 'mental',
                mpCost: 40,
                cooldown: 7200000, // 2 hours
                duration: 3600000, // 1 hour
                buff: {
                    strategy: 1.25,
                    wisdom: 1.2
                },
                level: 1,
                maxLevel: 10
            },
            {
                id: 'social_charm',
                name: 'Social Charm',
                description: 'Enhanced social presence. Boosts Social Skills and Influence.',
                icon: '✨',
                category: 'social',
                mpCost: 35,
                cooldown: 5400000, // 1.5 hours
                duration: 1800000,
                buff: {
                    social: 1.2,
                    influence: 1.15
                },
                level: 1,
                maxLevel: 10
            },
            {
                id: 'rapid_learning',
                name: 'Rapid Learning',
                description: 'Accelerated learning state. Boosts XP gain and Knowledge absorption.',
                icon: '📚',
                category: 'mental',
                mpCost: 50,
                cooldown: 10800000, // 3 hours
                duration: 3600000,
                buff: {
                    xpMultiplier: 1.3,
                    knowledge: 1.25
                },
                level: 1,
                maxLevel: 10
            }
        ];
        this.activeBuffs = [];
        this.cooldowns = {};
    }

    async init() {
        await this.loadCooldowns();
        this.startBuffTimer();
    }

    async loadCooldowns() {
        try {
            const saved = await db.getStat('active_skills');
            if (saved) {
                this.cooldowns = saved.cooldowns || {};
                this.activeBuffs = saved.activeBuffs || [];
                
                // Remove expired buffs
                const now = Date.now();
                this.activeBuffs = this.activeBuffs.filter(buff => buff.expiresAt > now);
            }
        } catch (error) {
            console.error('Error loading active skills:', error);
            this.cooldowns = {};
            this.activeBuffs = [];
        }
    }

    async saveCooldowns() {
        try {
            await db.saveStat('active_skills', {
                cooldowns: this.cooldowns,
                activeBuffs: this.activeBuffs
            });
        } catch (error) {
            console.error('Error saving active skills:', error);
        }
    }

    getSkill(skillId) {
        return this.skills.find(s => s.id === skillId);
    }

    canUseSkill(skillId) {
        const skill = this.getSkill(skillId);
        if (!skill) return false;

        // Check cooldown
        const lastUsed = this.cooldowns[skillId];
        if (lastUsed && (Date.now() - lastUsed) < skill.cooldown) {
            return false;
        }

        // Check resource cost
        if (skill.category === 'physical' || skill.category === 'mental') {
            if (skill.category === 'physical') {
                if (typeof energySystem !== 'undefined' && energySystem.currentEnergy < skill.mpCost) {
                    return false;
                }
            } else {
                if (typeof energySystem !== 'undefined' && energySystem.currentFocus < skill.mpCost) {
                    return false;
                }
            }
        }

        return true;
    }

    async activateSkill(skillId) {
        const skill = this.getSkill(skillId);
        if (!skill) {
            throw new Error('Skill not found');
        }

        if (!this.canUseSkill(skillId)) {
            const lastUsed = this.cooldowns[skillId];
            if (lastUsed) {
                const remaining = skill.cooldown - (Date.now() - lastUsed);
                const minutes = Math.ceil(remaining / 60000);
                throw new Error(`Skill on cooldown. Available in ${minutes} minutes.`);
            }
            throw new Error('Cannot use skill. Check resource requirements.');
        }

        // Consume resources
        if (skill.category === 'physical') {
            if (typeof energySystem !== 'undefined') {
                if (!energySystem.consumeEnergy(skill.mpCost)) {
                    throw new Error('Insufficient Energy');
                }
            }
        } else {
            if (typeof energySystem !== 'undefined') {
                if (!energySystem.consumeFocus(skill.mpCost)) {
                    throw new Error('Insufficient Focus');
                }
            }
        }

        // Activate buff
        const buff = {
            skillId: skillId,
            skillName: skill.name,
            buff: skill.buff,
            activatedAt: Date.now(),
            expiresAt: Date.now() + skill.duration
        };

        this.activeBuffs.push(buff);
        this.cooldowns[skillId] = Date.now();
        await this.saveCooldowns();

        showNotification(
            'Skill Activated',
            `${skill.name} is now active! Effects will last for ${skill.duration / 60000} minutes.`,
            'success'
        );

        return buff;
    }

    getActiveBuffs() {
        const now = Date.now();
        this.activeBuffs = this.activeBuffs.filter(buff => buff.expiresAt > now);
        return this.activeBuffs;
    }

    getBuffMultiplier(statName) {
        const activeBuffs = this.getActiveBuffs();
        let multiplier = 1.0;

        activeBuffs.forEach(buff => {
            if (buff.buff[statName]) {
                multiplier *= buff.buff[statName];
            }
        });

        return multiplier;
    }

    startBuffTimer() {
        setInterval(() => {
            const now = Date.now();
            this.activeBuffs = this.activeBuffs.filter(buff => {
                if (buff.expiresAt <= now) {
                    showNotification('Buff Expired', `${buff.skillName} effect has ended.`, 'info');
                    return false;
                }
                return true;
            });
            this.saveCooldowns();
        }, 60000); // Check every minute
    }

    getCooldownRemaining(skillId) {
        const skill = this.getSkill(skillId);
        if (!skill) return 0;

        const lastUsed = this.cooldowns[skillId];
        if (!lastUsed) return 0;

        const elapsed = Date.now() - lastUsed;
        const remaining = skill.cooldown - elapsed;
        return Math.max(0, remaining);
    }

    renderSkills(containerId = 'active-skills-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const activeBuffs = this.getActiveBuffs();
        const activeSkillIds = activeBuffs.map(b => b.skillId);

        container.innerHTML = `
            <div class="glass-panel" style="padding: 1.5rem;">
                <h3 style="margin: 0 0 1rem 0; color: var(--text-primary);">Active Skills</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                    ${this.skills.map(skill => {
                        const canUse = this.canUseSkill(skill.id);
                        const cooldownRemaining = this.getCooldownRemaining(skill.id);
                        const isActive = activeSkillIds.includes(skill.id);
                        const minutesRemaining = cooldownRemaining > 0 ? Math.ceil(cooldownRemaining / 60000) : 0;

                        return `
                            <div class="glass-panel" style="padding: 1rem; ${isActive ? 'border: 2px solid var(--neon-blue);' : ''}">
                                <div style="font-size: 2.5rem; text-align: center; margin-bottom: 0.5rem;">${skill.icon}</div>
                                <h4 style="margin: 0 0 0.5rem 0; color: var(--text-primary); text-align: center; font-size: 1rem;">${skill.name}</h4>
                                <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.75rem; line-height: 1.4;">
                                    ${skill.description}
                                </p>
                                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">
                                    <div>Cost: ${skill.mpCost} ${skill.category === 'physical' ? '⚡ Energy' : '🧠 Focus'}</div>
                                    <div>Cooldown: ${skill.cooldown / 60000} min</div>
                                    <div>Duration: ${skill.duration / 60000} min</div>
                                </div>
                                ${isActive ? `
                                    <div style="padding: 0.5rem; background: rgba(0, 212, 255, 0.1); border-radius: 8px; text-align: center; color: var(--neon-blue); font-size: 0.85rem;">
                                        ✓ Active
                                    </div>
                                ` : canUse ? `
                                    <button class="btn-primary activate-skill-btn" data-skill-id="${skill.id}" style="width: 100%; font-size: 0.9rem;">
                                        Activate
                                    </button>
                                ` : `
                                    <button class="btn-secondary" disabled style="width: 100%; font-size: 0.9rem;">
                                        ${cooldownRemaining > 0 ? `Cooldown: ${minutesRemaining}m` : 'Cannot Use'}
                                    </button>
                                `}
                            </div>
                        `;
                    }).join('')}
                </div>
                ${activeBuffs.length > 0 ? `
                    <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
                        <h4 style="margin: 0 0 0.75rem 0; color: var(--text-primary);">Active Buffs</h4>
                        ${activeBuffs.map(buff => {
                            const minutesLeft = Math.ceil((buff.expiresAt - Date.now()) / 60000);
                            return `
                                <div style="padding: 0.75rem; background: rgba(0, 212, 255, 0.1); border-radius: 8px; margin-bottom: 0.5rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="color: var(--text-primary); font-weight: 600;">${buff.skillName}</span>
                                        <span style="color: var(--neon-blue); font-size: 0.85rem;">${minutesLeft}m remaining</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        // Attach event handlers
        container.querySelectorAll('.activate-skill-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const skillId = btn.dataset.skillId;
                try {
                    await this.activateSkill(skillId);
                    this.renderSkills();
                } catch (error) {
                    showNotification('Skill Activation Failed', error.message, 'error');
                }
            });
        });
    }
}

const activeSkills = new ActiveSkills();

