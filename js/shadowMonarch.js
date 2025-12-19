/**
 * Shadow Monarch / Class Evolution System - Special transformations at high ranks
 */

class ShadowMonarch {
    constructor() {
        this.evolutionStages = {
            'E': { name: 'Novice Hunter', class: 'Hunter', power: 1.0 },
            'D': { name: 'Rookie Hunter', class: 'Hunter', power: 1.2 },
            'C': { name: 'Experienced Hunter', class: 'Hunter', power: 1.5 },
            'B': { name: 'Elite Hunter', class: 'Hunter', power: 2.0 },
            'A': { name: 'Master Hunter', class: 'Hunter', power: 2.5 },
            'S': { name: 'Shadow Monarch', class: 'Shadow Monarch', power: 3.0, special: true },
            'SS': { name: 'Arch Shadow', class: 'Shadow Monarch', power: 4.0, special: true },
            'SSS': { name: 'Supreme Shadow', class: 'Shadow Monarch', power: 5.0, special: true }
        };
    }

    getEvolutionStage(rank) {
        return this.evolutionStages[rank] || this.evolutionStages['E'];
    }

    async checkEvolution() {
        const playerData = gameEngine.getPlayerData();
        const rank = playerData.rank;
        const stage = this.getEvolutionStage(rank);

        if (stage.special && rank === 'S') {
            // First time reaching Shadow Monarch
            await this.triggerEvolution(rank);
        }
    }

    async triggerEvolution(rank) {
        const stage = this.getEvolutionStage(rank);
        
        showNotification(
            '👹 CLASS EVOLUTION!',
            `You have evolved into: ${stage.name}`,
            'evolution',
            8000
        );

        // Award evolution bonus
        const bonusXP = 1000 * (stage.power - 1);
        await gameEngine.addXP(bonusXP, 'class_evolution');

        if (typeof audioSystem !== 'undefined') {
            audioSystem.play('achievement');
        }

        // Update avatar
        if (typeof avatarEvolution !== 'undefined') {
            avatarEvolution.updateAvatar();
        }
    }

    getClassBonus(rank) {
        const stage = this.getEvolutionStage(rank);
        return {
            xpMultiplier: stage.power,
            statMultiplier: stage.special ? 1.5 : 1.0
        };
    }
}

const shadowMonarch = new ShadowMonarch();


