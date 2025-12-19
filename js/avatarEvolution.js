/**
 * Avatar Evolution System - Visual progression based on rank and level
 */

class AvatarEvolution {
    constructor() {
        this.evolutionStages = {
            'E': { emoji: '👤', glow: '#6b7280', size: 1.0 },
            'D': { emoji: '⚔️', glow: '#3b82f6', size: 1.1 },
            'C': { emoji: '🛡️', glow: '#10b981', size: 1.2 },
            'B': { emoji: '⚡', glow: '#f59e0b', size: 1.3 },
            'A': { emoji: '🔥', glow: '#ef4444', size: 1.4 },
            'S': { emoji: '👑', glow: '#8b5cf6', size: 1.5 },
            'SS': { emoji: '💀', glow: '#ec4899', size: 1.6 },
            'SSS': { emoji: '👹', glow: '#fbbf24', size: 1.7 }
        };
    }

    updateAvatar() {
        const playerData = gameEngine.getPlayerData();
        const rank = playerData.rank;
        const stage = this.evolutionStages[rank] || this.evolutionStages['E'];
        
        const avatarDisplay = document.getElementById('avatar-display');
        const avatarGlow = document.querySelector('.avatar-glow');
        
        if (avatarDisplay) {
            // Update emoji/visual
            const emojiElement = avatarDisplay.querySelector('.avatar-emoji');
            if (!emojiElement) {
                const emoji = document.createElement('div');
                emoji.className = 'avatar-emoji';
                emoji.textContent = stage.emoji;
                emoji.style.fontSize = `${stage.size * 3}rem`;
                avatarDisplay.insertBefore(emoji, avatarDisplay.firstChild);
            } else {
                emojiElement.textContent = stage.emoji;
                emojiElement.style.fontSize = `${stage.size * 3}rem`;
            }

            // Update glow
            if (avatarGlow) {
                avatarGlow.style.background = `radial-gradient(circle, transparent 40%, ${stage.glow} 100%)`;
            }

            // Update size
            avatarDisplay.style.transform = `scale(${stage.size})`;
        }
    }

    getEvolutionStage(rank) {
        return this.evolutionStages[rank] || this.evolutionStages['E'];
    }
}

const avatarEvolution = new AvatarEvolution();


