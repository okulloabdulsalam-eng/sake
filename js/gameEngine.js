/**
 * Game Engine - Core game logic and state management
 */
class GameEngine {
    constructor() {
        this.playerData = {
            level: 1,
            xp: 0,
            totalXP: 0,
            skillPoints: 0,
            rank: 'E',
            stats: {
                strength: 0,
                intelligence: 0,
                strategy: 0,
                endurance: 0,
                wisdom: 0,
                social: 0,
                medical: 0,
                financial: 0
            }
        };
        
        this.listeners = {
            levelUp: [],
            xpGain: [],
            statChange: [],
            rankChange: []
        };
    }

    // Initialize game engine
    async init() {
        await this.loadPlayerData();
        this.updateRank();
        return this.playerData;
    }

    // Load player data from database
    async loadPlayerData() {
        try {
            const saved = await db.getPlayerData();
            if (saved) {
                this.playerData = { ...this.playerData, ...saved };
                // Ensure stats exist
                if (!this.playerData.stats) {
                    this.playerData.stats = {
                        strength: 0,
                        intelligence: 0,
                        strategy: 0,
                        endurance: 0,
                        wisdom: 0,
                        social: 0,
                        medical: 0,
                        financial: 0
                    };
                }
            }
        } catch (error) {
            console.error('Error loading player data:', error);
        }
    }

    // Save player data to database
    async savePlayerData() {
        try {
            await db.savePlayerData(this.playerData);
            this.updateUI();
        } catch (error) {
            console.error('Error saving player data:', error);
        }
    }

    // Add XP
    async addXP(amount, source = 'quest') {
        const oldLevel = this.playerData.level;
        this.playerData.xp += amount;
        this.playerData.totalXP += amount;
        
        // Check for level up
        const newLevel = utils.getLevelFromXP(this.playerData.totalXP);
        if (newLevel > oldLevel) {
            await this.levelUp(newLevel - oldLevel);
        }
        
        // Update XP bar
        this.updateXPBar();
        
        // Trigger XP gain event
        this.triggerEvent('xpGain', { amount, source });
        
        // Save data
        await this.savePlayerData();
        
        // Add to history
        await db.addHistory({
            type: 'xp_gain',
            amount,
            source,
            level: this.playerData.level
        });
        
        return { gained: amount, newLevel: this.playerData.level };
    }

    // Level up
    async levelUp(levels = 1) {
        const oldLevel = this.playerData.level;
        this.playerData.level += levels;
        this.playerData.skillPoints += levels * 3; // 3 skill points per level
        
        // Award stat points for allocation (Solo Leveling style)
        const statPointsPerLevel = 5; // 5 stat points per level
        if (typeof statAllocation !== 'undefined') {
            await statAllocation.awardStatPoints(statPointsPerLevel * levels);
        }
        
        // Update rank
        const oldRank = this.playerData.rank;
        this.updateRank();
        
        // Trigger level up event
        if (this.playerData.rank !== oldRank) {
            this.triggerEvent('rankChange', { 
                oldRank, 
                newRank: this.playerData.rank 
            });
            
            // Update avatar evolution
            if (typeof avatarEvolution !== 'undefined') {
                avatarEvolution.updateAvatar();
            }
            
            // Check shadow monarch evolution
            if (typeof shadowMonarch !== 'undefined') {
                await shadowMonarch.checkEvolution();
            }
        }
        
        this.triggerEvent('levelUp', { 
            oldLevel, 
            newLevel: this.playerData.level,
            skillPointsGained: levels * 3
        });
        
        // Show level up notification
        showNotification('Level Up!', 
            `Congratulations! You reached level ${this.playerData.level}. You gained ${levels * 3} skill points!`,
            'level-up'
        );
        
        // Play sound
        if (typeof audioSystem !== 'undefined') {
            audioSystem.play('level_up');
        }
        
        // Check achievements
        if (typeof achievementSystem !== 'undefined') {
            await achievementSystem.checkAchievements();
        }
    }

    // Update rank based on total stats
    updateRank() {
        const totalStats = Object.values(this.playerData.stats).reduce((sum, val) => sum + val, 0);
        const newRank = utils.calculateRank(totalStats);
        const oldRank = this.playerData.rank;
        
        if (newRank !== oldRank) {
            this.playerData.rank = newRank;
            this.triggerEvent('rankChange', { oldRank, newRank });
        }
    }

    // Update stat
    async updateStat(statName, amount) {
        if (!this.playerData.stats[statName]) {
            this.playerData.stats[statName] = 0;
        }
        
        // Apply active skill buffs
        if (typeof activeSkills !== 'undefined') {
            const statMultiplier = activeSkills.getBuffMultiplier(statName) || 1.0;
            amount = Math.floor(amount * statMultiplier);
        }
        
        this.playerData.stats[statName] += amount;
        if (this.playerData.stats[statName] < 0) {
            this.playerData.stats[statName] = 0;
        }
        
        // Update rank
        const oldRank = this.playerData.rank;
        this.updateRank();
        
        if (this.playerData.rank !== oldRank) {
            this.triggerEvent('rankChange', { 
                oldRank, 
                newRank: this.playerData.rank 
            });
        }
        
        this.triggerEvent('statChange', { statName, newValue: this.playerData.stats[statName] });
        await this.savePlayerData();
    }

    // Get current XP progress
    getXPProgress() {
        const currentLevelXP = this.getXPForCurrentLevel();
        const nextLevelXP = utils.getXPForLevel(this.playerData.level);
        const progress = (currentLevelXP / nextLevelXP) * 100;
        
        return {
            current: currentLevelXP,
            required: nextLevelXP,
            progress: Math.min(progress, 100),
            totalXP: this.playerData.totalXP
        };
    }

    // Get XP for current level (XP since last level up)
    getXPForCurrentLevel() {
        const totalXPForCurrentLevel = utils.getTotalXPForLevel(this.playerData.level);
        return this.playerData.totalXP - totalXPForCurrentLevel;
    }

    // Update XP bar UI
    updateXPBar() {
        const progress = this.getXPProgress();
        const xpBar = document.getElementById('xp-bar');
        const xpDisplay = document.getElementById('xp-display');
        const xpNextLevel = document.getElementById('xp-next-level');
        
        if (xpBar) {
            xpBar.style.width = `${progress.progress}%`;
        }
        if (xpDisplay) {
            xpDisplay.textContent = `${Math.floor(progress.current)} / ${progress.required}`;
        }
        if (xpNextLevel) {
            xpNextLevel.textContent = progress.required;
        }
    }

    // Update UI elements
    updateUI() {
        // Update header
        const headerLevel = document.getElementById('header-level');
        const headerRank = document.getElementById('header-rank');
        
        if (headerLevel) {
            headerLevel.textContent = this.playerData.level;
        }
        if (headerRank) {
            headerRank.textContent = this.playerData.rank;
            headerRank.className = `stat-value rank-${this.playerData.rank}`;
        }
        
        // Update avatar
        const avatarLevelBadge = document.getElementById('avatar-level-badge');
        if (avatarLevelBadge) {
            avatarLevelBadge.textContent = this.playerData.level;
        }
        
        const playerRank = document.getElementById('player-rank');
        if (playerRank) {
            playerRank.textContent = `Rank: ${this.playerData.rank}`;
            playerRank.className = `player-rank rank-${this.playerData.rank}`;
        }
        
        // Update skill points
        const skillPointsCount = document.getElementById('skill-points-count');
        if (skillPointsCount) {
            skillPointsCount.textContent = this.playerData.skillPoints;
        }
        
        const skillPointsHeader = document.getElementById('skill-points-header');
        if (skillPointsHeader) {
            skillPointsHeader.textContent = this.playerData.skillPoints;
        }
        
        // Update XP bar
        this.updateXPBar();
        
        // Update stats
        this.updateStatsUI();
        
        // Update material rewards display
        this.updateMaterialRewardsUI();
    }

    // Update material rewards UI
    async updateMaterialRewardsUI() {
        try {
            const inventory = materialRewardsSystem.getInventory();
            
            const moneyEl = document.getElementById('material-money');
            if (moneyEl) {
                moneyEl.textContent = materialRewardsSystem.formatCurrency(inventory.money);
            }
            
            const influenceEl = document.getElementById('material-influence');
            if (influenceEl) {
                influenceEl.textContent = inventory.influence;
            }
            
            const alliesEl = document.getElementById('material-allies');
            if (alliesEl) {
                alliesEl.textContent = inventory.allies.length;
            }
        } catch (error) {
            console.error('Error updating material rewards UI:', error);
        }
    }

    // Update stats UI
    updateStatsUI() {
        Object.keys(this.playerData.stats).forEach(statName => {
            const element = document.getElementById(`stat-${statName}`);
            if (element) {
                element.textContent = this.playerData.stats[statName];
            }
        });
        
        // Update rank progression
        const totalStats = Object.values(this.playerData.stats).reduce((sum, val) => sum + val, 0);
        const currentRankValue = this.getRankValue(this.playerData.rank);
        const nextRankValue = this.getRankValue(this.getNextRank(this.playerData.rank));
        const progress = ((totalStats - currentRankValue) / (nextRankValue - currentRankValue)) * 100;
        
        const rankProgress = document.getElementById('rank-progress');
        if (rankProgress) {
            rankProgress.style.width = `${Math.min(Math.max(progress, 0), 100)}%`;
        }
        
        const currentRankDisplay = document.getElementById('current-rank-display');
        const nextRankDisplay = document.getElementById('next-rank-display');
        
        if (currentRankDisplay) {
            currentRankDisplay.textContent = this.playerData.rank;
            currentRankDisplay.className = `rank-${this.playerData.rank}`;
        }
        
        if (nextRankDisplay) {
            const nextRank = this.getNextRank(this.playerData.rank);
            nextRankDisplay.textContent = nextRank;
            nextRankDisplay.className = `rank-${nextRank}`;
        }
    }

    // Get rank value threshold
    getRankValue(rank) {
        const values = { E: 0, D: 75, C: 150, B: 250, A: 350, S: 500, SS: 750, SSS: 1000 };
        return values[rank] || 0;
    }

    // Get next rank
    getNextRank(currentRank) {
        const ranks = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
        const index = ranks.indexOf(currentRank);
        return index < ranks.length - 1 ? ranks[index + 1] : 'SSS';
    }

    // Event system
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    triggerEvent(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    // Get player data
    getPlayerData() {
        return { ...this.playerData };
    }

    // Use skill point
    async useSkillPoint() {
        if (this.playerData.skillPoints > 0) {
            this.playerData.skillPoints--;
            await this.savePlayerData();
            return true;
        }
        return false;
    }
}

// Export singleton instance
const gameEngine = new GameEngine();

