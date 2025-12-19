/**
 * Item Rarity System
 * Visual rarity tiers for items (Solo Leveling style)
 */

class ItemRaritySystem {
    constructor() {
        this.rarityTiers = {
            common: {
                name: 'Common',
                color: '#9ca3af',
                glow: 'rgba(156, 163, 175, 0.3)',
                border: '#9ca3af',
                icon: '⚪'
            },
            uncommon: {
                name: 'Uncommon',
                color: '#22d399',
                glow: 'rgba(34, 211, 153, 0.3)',
                border: '#22d399',
                icon: '🟢'
            },
            rare: {
                name: 'Rare',
                color: '#3b82f6',
                glow: 'rgba(59, 130, 246, 0.4)',
                border: '#3b82f6',
                icon: '🔵'
            },
            epic: {
                name: 'Epic',
                color: '#a855f7',
                glow: 'rgba(168, 85, 247, 0.5)',
                border: '#a855f7',
                icon: '🟣'
            },
            legendary: {
                name: 'Legendary',
                color: '#f59e0b',
                glow: 'rgba(245, 158, 11, 0.6)',
                border: '#f59e0b',
                icon: '🟡'
            }
        };
    }

    // Get rarity style for an item
    getRarityStyle(rarity = 'common') {
        const tier = this.rarityTiers[rarity] || this.rarityTiers.common;
        return {
            color: tier.color,
            borderColor: tier.border,
            boxShadow: `0 0 15px ${tier.glow}, 0 0 30px ${tier.glow}`,
            border: `2px solid ${tier.border}`
        };
    }

    // Get rarity badge HTML
    getRarityBadge(rarity = 'common') {
        const tier = this.rarityTiers[rarity] || this.rarityTiers.common;
        return `
            <span class="rarity-badge rarity-${rarity}" style="
                display: inline-block;
                padding: 0.25rem 0.75rem;
                background: ${tier.color}20;
                border: 1px solid ${tier.border};
                border-radius: 12px;
                color: ${tier.color};
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 0 10px ${tier.glow};
            ">
                ${tier.icon} ${tier.name}
            </span>
        `;
    }

    // Determine rarity based on item value/type
    determineRarity(item) {
        // Skill books are usually rare or epic
        if (item.type === 'skill_book') {
            if (item.price > 700) return 'epic';
            return 'rare';
        }

        // Books are common to rare
        if (item.type === 'book') {
            if (item.price > 20) return 'rare';
            return 'uncommon';
        }

        // Courses are rare to epic
        if (item.type === 'course') {
            if (item.price > 300) return 'epic';
            return 'rare';
        }

        // Tools are uncommon to rare
        if (item.type === 'tool' || item.type === 'software') {
            if (item.price > 150) return 'rare';
            return 'uncommon';
        }

        // Services are rare to epic
        if (item.type === 'service') {
            if (item.price > 100) return 'epic';
            return 'rare';
        }

        // Default based on price
        if (item.price > 200) return 'epic';
        if (item.price > 100) return 'rare';
        if (item.price > 50) return 'uncommon';
        return 'common';
    }

    // Apply rarity styling to element
    applyRarityStyling(element, rarity) {
        const style = this.getRarityStyle(rarity);
        Object.assign(element.style, style);
    }
}

const itemRaritySystem = new ItemRaritySystem();


