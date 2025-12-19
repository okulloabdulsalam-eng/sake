/**
 * Detailed Inventory View - Enhanced inventory management
 */

class DetailedInventory {
    constructor() {
        // This extends materialRewardsSystem
    }

    renderDetailedInventory() {
        const container = document.getElementById('inventory-container');
        if (!container) return;

        const inventory = materialRewardsSystem.getInventory();
        
        let html = `
            <div class="inventory-section">
                <h3 class="panel-title">Currency</h3>
                <div class="inventory-item">
                    <span class="inventory-icon">💰</span>
                    <div class="inventory-details">
                        <div class="inventory-name">Money</div>
                        <div class="inventory-value">${materialRewardsSystem.formatCurrency(inventory.money)}</div>
                    </div>
                </div>
            </div>

            <div class="inventory-section">
                <h3 class="panel-title">Resources</h3>
                <div class="inventory-item">
                    <span class="inventory-icon">⚡</span>
                    <div class="inventory-details">
                        <div class="inventory-name">Energy</div>
                        <div class="inventory-value">${inventory.resources.energy || 0}</div>
                    </div>
                </div>
                <div class="inventory-item">
                    <span class="inventory-icon">🔧</span>
                    <div class="inventory-details">
                        <div class="inventory-name">Materials</div>
                        <div class="inventory-value">${inventory.resources.materials || 0}</div>
                    </div>
                </div>
                <div class="inventory-item">
                    <span class="inventory-icon">📚</span>
                    <div class="inventory-details">
                        <div class="inventory-name">Knowledge</div>
                        <div class="inventory-value">${inventory.resources.knowledge || 0}</div>
                    </div>
                </div>
            </div>

            <div class="inventory-section">
                <h3 class="panel-title">Influence</h3>
                <div class="inventory-item">
                    <span class="inventory-icon">⭐</span>
                    <div class="inventory-details">
                        <div class="inventory-name">Influence Points</div>
                        <div class="inventory-value">${inventory.influence || 0}</div>
                    </div>
                </div>
            </div>
        `;

        if (inventory.allies && inventory.allies.length > 0) {
            html += `
                <div class="inventory-section">
                    <h3 class="panel-title">Allies (${inventory.allies.length})</h3>
            `;
            inventory.allies.forEach(ally => {
                html += `
                    <div class="inventory-item">
                        <span class="inventory-icon">👥</span>
                        <div class="inventory-details">
                            <div class="inventory-name">${ally.name || 'Ally'}</div>
                            <div class="inventory-description">${ally.description || 'Your ally'}</div>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        if (inventory.assets && inventory.assets.length > 0) {
            html += `
                <div class="inventory-section">
                    <h3 class="panel-title">Assets (${inventory.assets.length})</h3>
            `;
            inventory.assets.forEach(asset => {
                html += `
                    <div class="inventory-item">
                        <span class="inventory-icon">💼</span>
                        <div class="inventory-details">
                            <div class="inventory-name">${asset.name || 'Asset'}</div>
                            <div class="inventory-description">${asset.description || 'Your asset'}</div>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        // Show purchased items
        if (inventory.purchasedItems && inventory.purchasedItems.length > 0) {
            html += `
                <div class="inventory-section">
                    <h3 class="panel-title">Purchased Items (${inventory.purchasedItems.length})</h3>
            `;
            inventory.purchasedItems.forEach(item => {
                html += `
                    <div class="inventory-item glass-panel" style="margin-bottom: 0.75rem; padding: 1rem;">
                        <span class="inventory-icon">${this.getItemIcon(item.itemType)}</span>
                        <div class="inventory-details" style="flex: 1;">
                            <div class="inventory-name" style="font-weight: bold; margin-bottom: 0.25rem;">${item.itemName || 'Item'}</div>
                            <div class="inventory-description" style="color: var(--text-secondary); font-size: 0.9rem;">
                                Type: ${item.itemType || 'Unknown'} | Price: ${materialRewardsSystem.formatCurrency(item.price || 0)}
                            </div>
                            ${item.reported ? '<span style="color: var(--neon-blue); font-size: 0.85rem;">✓ Reported</span>' : '<span style="color: var(--text-muted); font-size: 0.85rem;">Pending Report</span>'}
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        // Show crafted items
        if (inventory.craftedItems && inventory.craftedItems.length > 0) {
            html += `
                <div class="inventory-section">
                    <h3 class="panel-title">Crafted Items (${inventory.craftedItems.length})</h3>
            `;
            inventory.craftedItems.forEach(item => {
                html += `
                    <div class="inventory-item glass-panel" style="margin-bottom: 0.75rem; padding: 1rem;">
                        <span class="inventory-icon">🔨</span>
                        <div class="inventory-details" style="flex: 1;">
                            <div class="inventory-name" style="font-weight: bold; margin-bottom: 0.25rem;">${item.name || 'Crafted Item'}</div>
                            <div class="inventory-description" style="color: var(--text-secondary); font-size: 0.9rem;">
                                ${item.description || 'A crafted item'}
                            </div>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        // Show tools
        if (inventory.tools && inventory.tools.length > 0) {
            html += `
                <div class="inventory-section">
                    <h3 class="panel-title">Tools (${inventory.tools.length})</h3>
            `;
            inventory.tools.forEach(tool => {
                html += `
                    <div class="inventory-item glass-panel" style="margin-bottom: 0.75rem; padding: 1rem;">
                        <span class="inventory-icon">🛠️</span>
                        <div class="inventory-details" style="flex: 1;">
                            <div class="inventory-name" style="font-weight: bold; margin-bottom: 0.25rem;">${tool.name || 'Tool'}</div>
                            <div class="inventory-description" style="color: var(--text-secondary); font-size: 0.9rem;">
                                ${tool.description || 'A tool'}
                            </div>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        // Show items (general items from quest rewards)
        if (inventory.items && inventory.items.length > 0) {
            html += `
                <div class="inventory-section">
                    <h3 class="panel-title">Items (${inventory.items.length})</h3>
            `;
            inventory.items.forEach(item => {
                html += `
                    <div class="inventory-item glass-panel" style="margin-bottom: 0.75rem; padding: 1rem;">
                        <span class="inventory-icon">📦</span>
                        <div class="inventory-details" style="flex: 1;">
                            <div class="inventory-name" style="font-weight: bold; margin-bottom: 0.25rem;">${item.name || 'Item'}</div>
                            <div class="inventory-description" style="color: var(--text-secondary); font-size: 0.9rem;">
                                ${item.description || 'An item'}
                            </div>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        container.innerHTML = html;
    }

    getItemIcon(itemType) {
        const icons = {
            'book': '📚',
            'course': '🎓',
            'tool': '🛠️',
            'service': '💼',
            'software': '💻',
            'other': '📦'
        };
        return icons[itemType] || '📦';
    }
}

const detailedInventory = new DetailedInventory();

