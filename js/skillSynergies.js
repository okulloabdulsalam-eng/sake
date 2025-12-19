/**
 * Skill Synergies System - Skills that work together for bonuses
 */

class SkillSynergies {
    constructor() {
        this.synergies = [
            {
                id: 'mental_physical',
                name: 'Mind-Body Connection',
                skills: ['mental_strength', 'physical_fitness'],
                bonus: { xp: 1.1, statMultiplier: 1.05 },
                description: 'Mental and Physical skills work together'
            },
            {
                id: 'strategic_social',
                name: 'Strategic Influence',
                skills: ['strategic_thinking', 'social_skills', 'leadership'],
                bonus: { xp: 1.15, statMultiplier: 1.1 },
                description: 'Strategy, Social, and Leadership create powerful synergy'
            },
            {
                id: 'wisdom_intelligence',
                name: 'Wise Intelligence',
                skills: ['wisdom_accumulation', 'mental_strength'],
                bonus: { xp: 1.1, statMultiplier: 1.05 },
                description: 'Wisdom enhances intelligence'
            },
            {
                id: 'endurance_resilience',
                name: 'Unbreakable',
                skills: ['endurance_training', 'resilience'],
                bonus: { xp: 1.12, statMultiplier: 1.08 },
                description: 'Endurance and Resilience make you unbreakable'
            },
            {
                id: 'financial_strategy',
                name: 'Financial Strategy',
                skills: ['financial_literacy', 'strategic_thinking'],
                bonus: { xp: 1.1, statMultiplier: 1.05 },
                description: 'Financial knowledge combined with strategy'
            }
        ];
    }

    getActiveSynergies() {
        const skills = skillSystem.getAllSkills();
        const activeSkills = skills.filter(s => s.level > 0).map(s => s.id);
        
        return this.synergies.filter(synergy => {
            return synergy.skills.every(skillId => activeSkills.includes(skillId));
        });
    }

    getSynergyBonus() {
        const active = this.getActiveSynergies();
        let xpMultiplier = 1.0;
        let statMultiplier = 1.0;

        active.forEach(synergy => {
            xpMultiplier *= synergy.bonus.xp;
            statMultiplier *= synergy.bonus.statMultiplier;
        });

        return {
            xpMultiplier: Math.min(xpMultiplier, 2.0), // Cap at 2x
            statMultiplier: Math.min(statMultiplier, 1.5) // Cap at 1.5x
        };
    }

    checkNewSynergy() {
        const active = this.getActiveSynergies();
        const previouslyActive = this.previouslyActiveSynergies || [];

        const newSynergies = active.filter(s => 
            !previouslyActive.find(p => p.id === s.id)
        );

        if (newSynergies.length > 0) {
            newSynergies.forEach(synergy => {
                showNotification(
                    '✨ Synergy Activated!',
                    `${synergy.name}: ${synergy.description}`,
                    'synergy',
                    4000
                );
            });
        }

        this.previouslyActiveSynergies = active;
    }
}

const skillSynergies = new SkillSynergies();


