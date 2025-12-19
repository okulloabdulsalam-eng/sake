/**
 * Pending Quest Delivery System - Intelligently delivers quests at the right time
 */

class PendingQuestDelivery {
    constructor() {
        this.pendingQuests = [];
        this.deliveryInterval = null;
        this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes
    }

    async init() {
        await this.loadPendingQuests();
        this.startDeliverySystem();
    }

    async loadPendingQuests() {
        this.pendingQuests = await db.getPendingQuests();
        console.log(`[Pending Quest Delivery] Loaded ${this.pendingQuests.length} pending quests`);
    }

    startDeliverySystem() {
        // Check for ready quests immediately
        this.checkAndDeliverQuests();

        // Then check periodically
        this.deliveryInterval = setInterval(() => {
            this.checkAndDeliverQuests();
        }, this.checkInterval);
    }

    async checkAndDeliverQuests() {
        const now = Date.now();
        
        for (const pendingQuest of this.pendingQuests) {
            // Check if it's time to deliver
            if (!pendingQuest.readyToDeliver && pendingQuest.deliveryTime <= now) {
                // Mark as ready
                pendingQuest.readyToDeliver = true;
                await db.savePendingQuest(pendingQuest);

                // Deliver the quest
                await this.deliverQuest(pendingQuest);
            }
        }

        // Reload to get updated list
        await this.loadPendingQuests();
    }

    async deliverQuest(pendingQuest) {
        try {
            // Add quest to quest system
            if (typeof questSystem !== 'undefined') {
                await questSystem.addQuest(pendingQuest.quest);
                
                // Show notification
                showNotification(
                    '[System] New Quest Available',
                    `"${pendingQuest.quest.title}" - Generated from your journal entries.`,
                    'quest-assign'
                );

                // Show quest modal after a delay
                setTimeout(() => {
                    if (typeof questSystem !== 'undefined') {
                        questSystem.showQuestModal(pendingQuest.quest.id);
                    }
                }, 1000);

                // Remove from pending
                await db.deletePendingQuest(pendingQuest.id);
                this.pendingQuests = this.pendingQuests.filter(pq => pq.id !== pendingQuest.id);

                console.log(`[Pending Quest Delivery] Delivered quest: ${pendingQuest.quest.id}`);
            }
        } catch (error) {
            console.error('[Pending Quest Delivery] Error delivering quest:', error);
        }
    }

    async addPendingQuest(pendingQuest) {
        this.pendingQuests.push(pendingQuest);
        await db.savePendingQuest(pendingQuest);
        console.log(`[Pending Quest Delivery] Added pending quest: ${pendingQuest.id}`);
    }

    getPendingQuestsCount() {
        return this.pendingQuests.filter(pq => !pq.readyToDeliver).length;
    }
}

const pendingQuestDelivery = new PendingQuestDelivery();


