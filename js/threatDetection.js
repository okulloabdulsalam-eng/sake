/**
 * Threat Detection System
 * System warnings for dangerous situations (Solo Leveling style)
 */

class ThreatDetection {
    constructor() {
        this.detectedThreats = [];
        this.threatHistory = [];
    }

    async init() {
        await this.loadThreatHistory();
        this.startThreatMonitoring();
    }

    async loadThreatHistory() {
        try {
            const saved = await db.getStat('threat_detection');
            if (saved) {
                this.threatHistory = saved || [];
            }
        } catch (error) {
            console.error('Error loading threat history:', error);
            this.threatHistory = [];
        }
    }

    async saveThreatHistory() {
        try {
            await db.saveStat('threat_detection', this.threatHistory);
        } catch (error) {
            console.error('Error saving threat history:', error);
        }
    }

    // Detect threat based on context
    async detectThreat(context) {
        const threats = [];

        // Analyze journal entries for stress, danger, or negative situations
        if (context.journalEntry) {
            const text = context.journalEntry.toLowerCase();
            
            // Detect stress indicators
            if (this.containsThreatKeywords(text, 'stress')) {
                threats.push({
                    type: 'stress',
                    severity: 'low',
                    message: 'Elevated stress levels detected. Consider taking a break or practicing stress management.',
                    recommendation: 'Practice deep breathing or meditation'
                });
            }

            // Detect danger indicators
            if (this.containsThreatKeywords(text, 'danger')) {
                threats.push({
                    type: 'danger',
                    severity: 'high',
                    message: 'Potential danger detected. Stay alert and prioritize safety.',
                    recommendation: 'Remove yourself from dangerous situations'
                });
            }

            // Detect health concerns
            if (this.containsThreatKeywords(text, 'health')) {
                threats.push({
                    type: 'health',
                    severity: 'medium',
                    message: 'Health concerns detected. Consider consulting a healthcare professional.',
                    recommendation: 'Prioritize your health and well-being'
                });
            }

            // Detect financial stress
            if (this.containsThreatKeywords(text, 'financial')) {
                threats.push({
                    type: 'financial',
                    severity: 'medium',
                    message: 'Financial concerns detected. Consider reviewing your financial strategy.',
                    recommendation: 'Review your budget and financial goals'
                });
            }
        }

        // Check for quest failure patterns
        if (context.questFailures && context.questFailures > 3) {
            threats.push({
                type: 'quest_failure',
                severity: 'medium',
                message: 'Multiple quest failures detected. Consider adjusting quest difficulty or approach.',
                recommendation: 'Focus on completing easier quests to build momentum'
            });
        }

        // Check for low energy/focus
        if (typeof energySystem !== 'undefined') {
            if (energySystem.currentEnergy < 20 || energySystem.currentFocus < 20) {
                threats.push({
                    type: 'low_resources',
                    severity: 'low',
                    message: 'Low energy or focus detected. Rest and recover before taking on challenging tasks.',
                    recommendation: 'Take a break and allow resources to regenerate'
                });
            }
        }

        // Process detected threats
        for (const threat of threats) {
            await this.processThreat(threat);
        }

        return threats;
    }

    containsThreatKeywords(text, category) {
        const keywords = {
            stress: ['stressed', 'overwhelmed', 'anxious', 'worried', 'pressure', 'burnout'],
            danger: ['danger', 'unsafe', 'threat', 'risk', 'harm', 'injury'],
            health: ['sick', 'ill', 'pain', 'unwell', 'symptoms', 'doctor', 'hospital'],
            financial: ['broke', 'debt', 'money problems', 'financial stress', 'can\'t afford']
        };

        const categoryKeywords = keywords[category] || [];
        return categoryKeywords.some(keyword => text.includes(keyword));
    }

    // Process and alert about threat
    async processThreat(threat) {
        const threatRecord = {
            id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...threat,
            detectedAt: Date.now()
        };

        this.detectedThreats.push(threatRecord);
        this.threatHistory.push(threatRecord);
        await this.saveThreatHistory();

        // Show threat alert
        this.showThreatAlert(threat);

        return threatRecord;
    }

    // Show threat alert (Solo Leveling style)
    showThreatAlert(threat) {
        const severityColors = {
            low: '#fbbf24',
            medium: '#f97316',
            high: '#ef4444'
        };

        const color = severityColors[threat.severity] || '#6b7280';

        const notification = document.createElement('div');
        notification.className = 'threat-alert notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            max-width: 400px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            border-left: 4px solid ${color};
        `;

        notification.innerHTML = `
            <div class="glass-panel holographic" style="padding: 1.25rem; border: 2px solid ${color};">
                <div style="display: flex; align-items: start; gap: 1rem;">
                    <div style="font-size: 2rem;">⚠️</div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; color: ${color}; margin-bottom: 0.5rem; font-size: 1.1rem;">
                            [System] Threat Detected
                        </div>
                        <div style="color: var(--text-primary); margin-bottom: 0.5rem; font-size: 0.95rem;">
                            ${threat.message}
                        </div>
                        ${threat.recommendation ? `
                            <div style="color: var(--text-secondary); font-size: 0.85rem; padding: 0.5rem; background: rgba(0, 212, 255, 0.1); border-radius: 4px;">
                                <strong>Recommendation:</strong> ${threat.recommendation}
                            </div>
                        ` : ''}
                    </div>
                    <button class="close-threat-alert" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.5rem; padding: 0; width: 24px; height: 24px;">&times;</button>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Close button
        notification.querySelector('.close-threat-alert').addEventListener('click', () => {
            notification.remove();
        });

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 10000);
    }

    // Start monitoring for threats
    startThreatMonitoring() {
        // Monitor journal entries
        if (typeof aiJournalSystem !== 'undefined') {
            // Check entries after they're saved
            const originalSave = aiJournalSystem.saveJournalEntry.bind(aiJournalSystem);
            aiJournalSystem.saveJournalEntry = async function(text) {
                const result = await originalSave(text);
                
                // Detect threats in new entry
                if (typeof threatDetection !== 'undefined') {
                    await threatDetection.detectThreat({
                        journalEntry: text
                    });
                }
                
                return result;
            };
        }

        // Periodic check for resource-based threats
        setInterval(async () => {
            await this.detectThreat({});
        }, 30 * 60 * 1000); // Every 30 minutes
    }

    // Get recent threats
    getRecentThreats(limit = 10) {
        return this.threatHistory
            .sort((a, b) => b.detectedAt - a.detectedAt)
            .slice(0, limit);
    }
}

const threatDetection = new ThreatDetection();

