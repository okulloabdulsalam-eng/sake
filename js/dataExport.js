/**
 * Data Export/Backup System - Export and restore player data
 */

class DataExport {
    constructor() {
        this.exportVersion = '1.0';
    }

    async exportData() {
        const playerData = gameEngine.getPlayerData();
        const quests = await db.getAllQuests();
        const skills = await db.getAllSkills();
        const history = await db.getHistory(1000);
        const achievements = typeof achievementSystem !== 'undefined' ? achievementSystem.achievements : [];
        const streak = typeof streakSystem !== 'undefined' ? streakSystem.streakData : null;
        const inventory = typeof materialRewardsSystem !== 'undefined' ? materialRewardsSystem.getInventory() : null;

        const exportData = {
            version: this.exportVersion,
            exportDate: new Date().toISOString(),
            playerData,
            quests,
            skills,
            history,
            achievements,
            streak,
            inventory
        };

        return JSON.stringify(exportData, null, 2);
    }

    async exportToFile() {
        const data = await this.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sololeveling-backup-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('Export Complete', 'Your data has been exported successfully', 'success');
    }

    async importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (!data.version) {
                throw new Error('Invalid backup file format');
            }

            // Restore player data
            if (data.playerData) {
                await db.savePlayerData(data.playerData);
                await gameEngine.loadPlayerData();
            }

            // Restore quests
            if (data.quests && Array.isArray(data.quests)) {
                for (const quest of data.quests) {
                    await db.saveQuest(quest);
                }
            }

            // Restore skills
            if (data.skills && Array.isArray(data.skills)) {
                for (const skill of data.skills) {
                    await db.saveSkill(skill);
                }
            }

            // Restore achievements
            if (data.achievements && typeof achievementSystem !== 'undefined') {
                achievementSystem.achievements = data.achievements;
                await achievementSystem.saveAchievements();
            }

            // Restore streak
            if (data.streak && typeof streakSystem !== 'undefined') {
                streakSystem.streakData = data.streak;
                await streakSystem.saveStreakData();
            }

            showNotification('Import Complete', 'Your data has been restored successfully', 'success');
            
            // Reload UI
            gameEngine.updateUI();
            if (typeof questSystem !== 'undefined') {
                questSystem.renderQuests();
            }

            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            showNotification('Import Failed', 'Error restoring data: ' + error.message, 'error');
            return false;
        }
    }

    async importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const result = await this.importData(e.target.result);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
}

const dataExport = new DataExport();


