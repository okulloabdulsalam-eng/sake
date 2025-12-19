/**
 * Purchase Reporting System
 * Users report real-world purchases they made
 */

class PurchaseReporting {
    constructor() {
        this.purchases = [];
    }

    async init() {
        await this.loadPurchases();
    }

    async loadPurchases() {
        const saved = await db.getPurchases();
        this.purchases = saved.sort((a, b) => b.reportedAt - a.reportedAt);
    }

    async reportPurchase(purchaseData) {
        const purchase = {
            id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: purchaseData.type,
            name: purchaseData.name,
            cost: purchaseData.cost || 0,
            description: purchaseData.description || '',
            reportedAt: Date.now(),
            status: 'reported'
        };

        this.purchases.push(purchase);
        await db.savePurchase(purchase);

        // Check if this matches a shop item
        const inventory = materialRewardsSystem.inventory;
        const purchasedItems = inventory.purchasedItems || [];
        const matchingItem = purchasedItems.find(pi => 
            !pi.reported && 
            (pi.itemName.toLowerCase().includes(purchaseData.name.toLowerCase()) ||
             purchaseData.name.toLowerCase().includes(pi.itemName.toLowerCase()))
        );

        if (matchingItem) {
            // Mark as reported
            matchingItem.reported = true;
            matchingItem.reportedAt = Date.now();

            // Get item details from shop
            if (typeof realWorldShop !== 'undefined') {
                const shopItem = realWorldShop.getItem(matchingItem.itemId);
                if (shopItem && shopItem.stats) {
                    // Apply stat bonuses
                    for (const [stat, value] of Object.entries(shopItem.stats)) {
                        await gameEngine.updateStat(stat, value);
                    }

                    // Add to inventory
                    if (!inventory.items) {
                        inventory.items = [];
                    }
                    inventory.items.push({
                        id: shopItem.id,
                        name: shopItem.name,
                        type: shopItem.type,
                        icon: shopItem.icon,
                        stats: shopItem.stats,
                        acquiredAt: Date.now()
                    });
                }
            }

            await materialRewardsSystem.saveInventory();
        }

        showNotification(
            'Purchase Reported',
            'Your purchase has been recorded and added to your inventory!',
            'success'
        );

        return purchase;
    }

    renderPurchaseHistory(containerId = 'purchase-history-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (this.purchases.length === 0) {
            container.innerHTML = `
                <div class="glass-panel" style="padding: 2rem; text-align: center; color: var(--text-secondary);">
                    <p>No purchases reported yet. Report your real-world purchases to track them!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="glass-panel" style="padding: 1.5rem;">
                <h3 style="margin: 0 0 1rem 0; color: var(--text-primary);">Purchase History</h3>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${this.purchases.map(purchase => {
                        const date = new Date(purchase.reportedAt);
                        return `
                            <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                                    <div>
                                        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">${purchase.name}</div>
                                        <div style="font-size: 0.85rem; color: var(--text-secondary); text-transform: capitalize;">
                                            ${purchase.type} ${purchase.cost > 0 ? `• $${purchase.cost}` : ''}
                                        </div>
                                    </div>
                                    <div style="font-size: 0.8rem; color: var(--text-muted);">
                                        ${date.toLocaleDateString()}
                                    </div>
                                </div>
                                ${purchase.description ? `
                                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">
                                        ${purchase.description}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
}

const purchaseReporting = new PurchaseReporting();

