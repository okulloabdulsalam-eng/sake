/**
 * Skill System - Manage skill tree and skill points
 */

const SKILLS = [
    { id: 'physical_fitness', name: 'Physical Fitness', icon: '💪', category: 'strength', maxLevel: 50, baseCost: 1 },
    { id: 'mental_strength', name: 'Mental Strength', icon: '🧠', category: 'intelligence', maxLevel: 50, baseCost: 1 },
    { id: 'strategic_thinking', name: 'Strategic Thinking', icon: '🎯', category: 'strategy', maxLevel: 50, baseCost: 1 },
    { id: 'endurance_training', name: 'Endurance Training', icon: '🛡️', category: 'endurance', maxLevel: 50, baseCost: 1 },
    { id: 'wisdom_accumulation', name: 'Wisdom Accumulation', icon: '✨', category: 'wisdom', maxLevel: 50, baseCost: 1 },
    { id: 'social_skills', name: 'Social Skills', icon: '🤝', category: 'social', maxLevel: 50, baseCost: 1 },
    { id: 'health_awareness', name: 'Health Awareness', icon: '⚕️', category: 'medical', maxLevel: 50, baseCost: 1 },
    { id: 'financial_literacy', name: 'Financial Literacy', icon: '💰', category: 'financial', maxLevel: 50, baseCost: 1 },
    { id: 'time_management', name: 'Time Management', icon: '⏰', category: 'strategy', maxLevel: 30, baseCost: 1 },
    { id: 'communication', name: 'Communication', icon: '💬', category: 'social', maxLevel: 40, baseCost: 1 },
    { id: 'problem_solving', name: 'Problem Solving', icon: '🧩', category: 'intelligence', maxLevel: 40, baseCost: 1 },
    { id: 'emotional_intelligence', name: 'Emotional Intelligence', icon: '❤️', category: 'wisdom', maxLevel: 40, baseCost: 1 },
    { id: 'leadership', name: 'Leadership', icon: '👑', category: 'social', maxLevel: 30, baseCost: 2 },
    { id: 'creativity', name: 'Creativity', icon: '🎨', category: 'intelligence', maxLevel: 35, baseCost: 1 },
    { id: 'focus', name: 'Focus', icon: '🎯', category: 'endurance', maxLevel: 35, baseCost: 1 },
    { id: 'resilience', name: 'Resilience', icon: '🔥', category: 'endurance', maxLevel: 40, baseCost: 1 },
    { id: 'adaptability', name: 'Adaptability', icon: '🔄', category: 'strategy', maxLevel: 35, baseCost: 1 },
    { id: 'self_discipline', name: 'Self Discipline', icon: '⚡', category: 'wisdom', maxLevel: 40, baseCost: 1 }
];

class SkillSystem {
    constructor() {
        this.skills = [];
    }

    // Initialize skill system
    async init() {
        await this.loadSkills();
        await this.initializeDefaultSkills();
    }

    // Load skills from database
    async loadSkills() {
        try {
            const savedSkills = await db.getAllSkills();
            this.skills = savedSkills.length > 0 ? savedSkills : [];
        } catch (error) {
            console.error('Error loading skills:', error);
            this.skills = [];
        }
    }

    // Initialize default skills if they don't exist
    async initializeDefaultSkills() {
        for (const skillTemplate of SKILLS) {
            const existing = this.skills.find(s => s.id === skillTemplate.id);
            if (!existing) {
                const skill = {
                    id: skillTemplate.id,
                    name: skillTemplate.name,
                    icon: skillTemplate.icon,
                    category: skillTemplate.category,
                    level: 0,
                    maxLevel: skillTemplate.maxLevel,
                    baseCost: skillTemplate.baseCost
                };
                this.skills.push(skill);
                await db.saveSkill(skill);
            }
        }
    }

    // Get skill by ID
    getSkill(skillId) {
        return this.skills.find(s => s.id === skillId);
    }

    // Get skill cost for next level
    getSkillCost(skill) {
        return skill.baseCost * (skill.level + 1);
    }

    // Upgrade skill
    async upgradeSkill(skillId) {
        const skill = this.getSkill(skillId);
        if (!skill) return false;

        // Check if maxed
        if (skill.level >= skill.maxLevel) {
            showNotification('Skill Maxed', `${skill.name} is already at maximum level!`, 'info');
            return false;
        }

        // Check if player has enough skill points
        const cost = this.getSkillCost(skill);
        const playerData = gameEngine.getPlayerData();
        
        if (playerData.skillPoints < cost) {
            showNotification('Insufficient Points', `You need ${cost} skill points to upgrade ${skill.name}`, 'info');
            return false;
        }

        // Use skill points
        for (let i = 0; i < cost; i++) {
            await gameEngine.useSkillPoint();
        }

        // Upgrade skill
        skill.level++;
        await db.saveSkill(skill);

        // Update corresponding stat
        const statIncrease = Math.floor(skill.level / 5) + 1; // Every 5 levels = 1 stat point + base
        await gameEngine.updateStat(skill.category, 1);

        // Show notification
        showNotification('Skill Upgraded!', 
            `${skill.name} upgraded to level ${skill.level}!`, 
            'skill-upgrade'
        );

        // Add to history
        await db.addHistory({
            type: 'skill_upgrade',
            skillId: skill.id,
            skillName: skill.name,
            newLevel: skill.level
        });

        return true;
    }

    // Render skill tree
    renderSkillTree() {
        const container = document.getElementById('skill-tree-container');
        if (!container) return;

        // Group skills by category
        const categories = {};
        this.skills.forEach(skill => {
            if (!categories[skill.category]) {
                categories[skill.category] = [];
            }
            categories[skill.category].push(skill);
        });

        let html = '';
        
        // Render each category
        for (const [category, skills] of Object.entries(categories)) {
            html += `<div style="grid-column: 1 / -1; margin-top: 1rem; margin-bottom: 0.5rem;">
                <h3 class="panel-title" style="font-size: 1rem; margin: 0;">${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
            </div>`;
            
            skills.forEach(skill => {
                html += this.renderSkillCard(skill);
            });
        }

        container.innerHTML = html;

        // Add event listeners
        container.querySelectorAll('.skill-card').forEach(card => {
            card.addEventListener('click', () => {
                const skillId = card.dataset.skillId;
                this.handleSkillClick(skillId);
            });
        });
    }

    // Render skill card
    renderSkillCard(skill) {
        const cost = this.getSkillCost(skill);
        const playerData = gameEngine.getPlayerData();
        const canAfford = playerData.skillPoints >= cost;
        const isMaxed = skill.level >= skill.maxLevel;
        const isLocked = skill.level === 0 && !canAfford && playerData.skillPoints === 0;

        let cardClass = 'skill-card';
        if (isMaxed) cardClass += ' maxed';
        else if (isLocked) cardClass += ' locked';
        else if (canAfford && !isMaxed) cardClass += ' available';

        const progressPercent = (skill.level / skill.maxLevel) * 100;

        return `
            <div class="${cardClass}" data-skill-id="${skill.id}">
                <div class="skill-icon">${skill.icon}</div>
                <div class="skill-name">${skill.name}</div>
                <div class="skill-level">Level ${skill.level} / ${skill.maxLevel}</div>
                ${!isMaxed ? `<div style="font-size: 0.75rem; color: ${canAfford ? '#34d399' : '#6b7280'}; margin-top: 0.5rem;">
                    Cost: ${cost} SP
                </div>` : '<div style="font-size: 0.75rem; color: #fbbf24; margin-top: 0.5rem;">MAX LEVEL</div>'}
                <div style="width: 100%; height: 4px; background: #141b2d; border-radius: 2px; margin-top: 0.5rem; overflow: hidden;">
                    <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #00d4ff, #8b5cf6); transition: width 0.3s;"></div>
                </div>
            </div>
        `;
    }

    // Handle skill click
    async handleSkillClick(skillId) {
        const skill = this.getSkill(skillId);
        if (!skill) return;

        if (skill.level >= skill.maxLevel) {
            showNotification('Skill Maxed', `${skill.name} is already at maximum level!`, 'info');
            return;
        }

        const cost = this.getSkillCost(skill);
        const playerData = gameEngine.getPlayerData();

        if (playerData.skillPoints < cost) {
            showNotification('Insufficient Points', `You need ${cost} skill points to upgrade ${skill.name}. You have ${playerData.skillPoints}.`, 'info');
            return;
        }

        // Confirm upgrade
        const confirmed = confirm(`Upgrade ${skill.name} to level ${skill.level + 1} for ${cost} skill points?`);
        if (!confirmed) return;

        const success = await this.upgradeSkill(skillId);
        if (success) {
            this.renderSkillTree();
            gameEngine.updateUI();
        }
    }

    // Get all skills
    getAllSkills() {
        return [...this.skills];
    }

    // Get total skill levels
    getTotalSkillLevels() {
        return this.skills.reduce((sum, skill) => sum + skill.level, 0);
    }
}

// Export singleton instance
const skillSystem = new SkillSystem();

