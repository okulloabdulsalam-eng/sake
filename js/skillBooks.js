/**
 * Skill Books System
 * Items that unlock new skills (Solo Leveling style)
 */

class SkillBooks {
    constructor() {
        this.skillBooks = [
            {
                id: 'skillbook_stealth',
                name: 'Skill Book: Stealth',
                description: 'Learn the Stealth skill. Temporarily erases appearance and traces.',
                icon: '📖',
                rarity: 'rare',
                skillUnlocks: ['stealth'],
                price: 500,
                category: 'utility'
            },
            {
                id: 'skillbook_dash',
                name: 'Skill Book: Dash',
                description: 'Learn the Dash skill. Rapid movement ability.',
                icon: '📖',
                rarity: 'rare',
                skillUnlocks: ['dash'],
                price: 400,
                category: 'movement'
            },
            {
                id: 'skillbook_healing',
                name: 'Skill Book: Healing',
                description: 'Learn the Healing skill. Restore health and energy.',
                icon: '📖',
                rarity: 'epic',
                skillUnlocks: ['healing'],
                price: 800,
                category: 'support'
            },
            {
                id: 'skillbook_shield',
                name: 'Skill Book: Shield',
                description: 'Learn the Shield skill. Temporary damage reduction.',
                icon: '📖',
                rarity: 'rare',
                skillUnlocks: ['shield'],
                price: 600,
                category: 'defense'
            },
            {
                id: 'skillbook_analysis',
                name: 'Skill Book: Analysis',
                description: 'Learn the Analysis skill. Gain insights into situations and people.',
                icon: '📖',
                rarity: 'common',
                skillUnlocks: ['analysis'],
                price: 300,
                category: 'utility'
            }
        ];
    }

    async init() {
        // Add skill books to shop
        if (typeof realWorldShop !== 'undefined') {
            this.skillBooks.forEach(book => {
                // Check if already added
                const exists = realWorldShop.items.find(item => item.id === book.id);
                if (!exists) {
                    realWorldShop.items.push({
                        id: book.id,
                        name: book.name,
                        type: 'skill_book',
                        category: book.category,
                        price: book.price,
                        description: book.description,
                        icon: book.icon,
                        rarity: book.rarity,
                        skillUnlocks: book.skillUnlocks
                    });
                }
            });
        }
    }

    // Use skill book to unlock skill
    async useSkillBook(bookId) {
        const book = this.skillBooks.find(b => b.id === bookId);
        if (!book) {
            throw new Error('Skill book not found');
        }

        // Check if skill is already unlocked
        for (const skillId of book.skillUnlocks) {
            if (this.isSkillUnlocked(skillId)) {
                showNotification('[System] Skill Already Learned', 'You already know this skill.', 'info');
                return false;
            }
        }

        // Unlock skills
        for (const skillId of book.skillUnlocks) {
            await this.unlockSkill(skillId);
        }

        // Remove from inventory
        const inventory = materialRewardsSystem.inventory;
        if (inventory.items) {
            inventory.items = inventory.items.filter(item => item.id !== bookId);
            await materialRewardsSystem.saveInventory();
        }

        showNotification(
            '[System] Skill Learned',
            `You have learned: ${book.skillUnlocks.join(', ')}`,
            'success'
        );

        return true;
    }

    // Check if skill is unlocked
    isSkillUnlocked(skillId) {
        const unlockedSkills = this.getUnlockedSkills();
        return unlockedSkills.includes(skillId);
    }

    // Get unlocked skills
    getUnlockedSkills() {
        const saved = localStorage.getItem('unlocked_skills');
        return saved ? JSON.parse(saved) : [];
    }

    // Unlock skill
    async unlockSkill(skillId) {
        const unlocked = this.getUnlockedSkills();
        if (!unlocked.includes(skillId)) {
            unlocked.push(skillId);
            localStorage.setItem('unlocked_skills', JSON.stringify(unlocked));
        }

        // Add to active skills if applicable
        if (typeof activeSkills !== 'undefined') {
            // Check if this skill should be added to active skills
            const skillDefinitions = {
                stealth: {
                    id: 'stealth',
                    name: 'Stealth',
                    description: 'Temporarily erases appearance and traces. Useful for avoiding detection.',
                    icon: '👤',
                    category: 'utility',
                    mpCost: 20,
                    cooldown: 300000, // 5 minutes
                    duration: 600000, // 10 minutes
                    buff: { stealth: true }
                },
                dash: {
                    id: 'dash',
                    name: 'Dash',
                    description: 'Rapid movement ability. Increases agility temporarily.',
                    icon: '💨',
                    category: 'movement',
                    mpCost: 15,
                    cooldown: 180000, // 3 minutes
                    duration: 30000, // 30 seconds
                    buff: { agility: 1.5 }
                },
                healing: {
                    id: 'healing',
                    name: 'Healing',
                    description: 'Restore health and energy. Useful for recovery.',
                    icon: '💚',
                    category: 'support',
                    mpCost: 30,
                    cooldown: 600000, // 10 minutes
                    duration: 0, // Instant
                    buff: { restoreHealth: 50, restoreEnergy: 30 }
                },
                shield: {
                    id: 'shield',
                    name: 'Shield',
                    description: 'Temporary damage reduction. Increases defense.',
                    icon: '🛡️',
                    category: 'defense',
                    mpCost: 25,
                    cooldown: 300000, // 5 minutes
                    duration: 300000, // 5 minutes
                    buff: { defense: 1.3 }
                },
                analysis: {
                    id: 'analysis',
                    name: 'Analysis',
                    description: 'Gain insights into situations and people. Improves decision-making.',
                    icon: '🔍',
                    category: 'utility',
                    mpCost: 10,
                    cooldown: 60000, // 1 minute
                    duration: 60000, // 1 minute
                    buff: { intelligence: 1.2, wisdom: 1.2 }
                }
            };

            const skillDef = skillDefinitions[skillId];
            if (skillDef && activeSkills.skills.findIndex(s => s.id === skillId) === -1) {
                activeSkills.skills.push(skillDef);
            }
        }
    }

    // Get skill book by ID
    getSkillBook(bookId) {
        return this.skillBooks.find(b => b.id === bookId);
    }
}

const skillBooks = new SkillBooks();


