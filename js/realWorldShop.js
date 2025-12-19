/**
 * Real-World Shop System
 * Sells real-world items that help with leveling: books, courses, tools, services
 */

class RealWorldShop {
    constructor() {
        this.items = [
            // Books
            {
                id: 'book_art_of_war',
                name: 'The Art of War - Sun Tzu',
                type: 'book',
                category: 'strategy',
                price: 15,
                description: 'Classic strategy book. Improves Strategic Thinking and Leadership skills.',
                stats: { strategy: 5, leadership: 3 },
                icon: '📚',
                realWorldLink: 'https://www.amazon.com/s?k=art+of+war+sun+tzu'
            },
            {
                id: 'book_thinking_fast_slow',
                name: 'Thinking, Fast and Slow - Daniel Kahneman',
                type: 'book',
                category: 'psychology',
                price: 18,
                description: 'Understanding decision-making. Improves Intelligence and Wisdom.',
                stats: { intelligence: 5, wisdom: 4 },
                icon: '📚'
            },
            {
                id: 'book_rich_dad',
                name: 'Rich Dad Poor Dad - Robert Kiyosaki',
                type: 'book',
                category: 'finance',
                price: 16,
                description: 'Financial education. Improves Financial Literacy and Strategic Thinking.',
                stats: { financial: 6, strategy: 3 },
                icon: '📚'
            },
            {
                id: 'book_7_habits',
                name: 'The 7 Habits of Highly Effective People',
                type: 'book',
                category: 'personal_growth',
                price: 17,
                description: 'Personal development. Improves multiple skills.',
                stats: { wisdom: 4, leadership: 4, social: 3 },
                icon: '📚'
            },
            // Courses
            {
                id: 'course_coding_bootcamp',
                name: 'Coding Bootcamp (Online)',
                type: 'course',
                category: 'learning',
                price: 500,
                description: 'Learn programming. Significantly improves Intelligence and Problem Solving.',
                stats: { intelligence: 15, problem_solving: 12 },
                icon: '🎓'
            },
            {
                id: 'course_business_course',
                name: 'Business Strategy Course',
                type: 'course',
                category: 'strategy',
                price: 200,
                description: 'Business and strategy training. Improves Strategy and Leadership.',
                stats: { strategy: 12, leadership: 10 },
                icon: '🎓'
            },
            {
                id: 'course_fitness_trainer',
                name: 'Personal Fitness Trainer (1 month)',
                type: 'service',
                category: 'health',
                price: 150,
                description: 'Professional fitness training. Improves Physical Fitness and Endurance.',
                stats: { physical_fitness: 10, endurance: 8 },
                icon: '💪'
            },
            // Tools
            {
                id: 'tool_notion',
                name: 'Notion Pro (Productivity Tool)',
                type: 'software',
                category: 'productivity',
                price: 10,
                description: 'Organization and productivity software. Improves Time Management.',
                stats: { time_management: 5 },
                icon: '💻'
            },
            {
                id: 'tool_fitness_tracker',
                name: 'Fitness Tracker Watch',
                type: 'tool',
                category: 'health',
                price: 200,
                description: 'Track workouts and health metrics. Improves Physical Fitness and Health Awareness.',
                stats: { physical_fitness: 6, health_awareness: 5 },
                icon: '⌚'
            },
            {
                id: 'tool_meditation_app',
                name: 'Meditation App Subscription',
                type: 'software',
                category: 'mental_health',
                price: 8,
                description: 'Mental wellness and meditation. Improves Mental Strength and Focus.',
                stats: { mental_strength: 4, focus: 4 },
                icon: '🧘'
            },
            // Services
            {
                id: 'service_coach',
                name: 'Life Coach Session',
                type: 'service',
                category: 'personal_growth',
                price: 100,
                description: 'One-on-one coaching session. Improves multiple skills.',
                stats: { wisdom: 5, leadership: 4, social: 3 },
                icon: '💼'
            },
            {
                id: 'service_networking_event',
                name: 'Professional Networking Event',
                type: 'service',
                category: 'social',
                price: 50,
                description: 'Networking opportunity. Improves Social Skills and Influence.',
                stats: { social: 6, influence: 5 },
                icon: '🤝'
            }
        ];
    }

    async init() {
        this.renderShop();
    }

    getItemsByCategory(category = null) {
        if (!category) return this.items;
        return this.items.filter(item => item.category === category);
    }

    getItem(itemId) {
        return this.items.find(item => item.id === itemId);
    }

    async purchaseItem(itemId) {
        const item = this.getItem(itemId);
        if (!item) {
            throw new Error('Item not found');
        }

        const playerData = gameEngine.getPlayerData();
        const inventory = materialRewardsSystem.inventory;

        if (inventory.money < item.price) {
            throw new Error(`Insufficient funds. You need ${item.price} but have ${inventory.money}`);
        }

        // Deduct money
        inventory.money -= item.price;
        await materialRewardsSystem.saveInventory();

        // Add item to purchased items (user will report when they actually buy it)
        if (!inventory.purchasedItems) {
            inventory.purchasedItems = [];
        }

        inventory.purchasedItems.push({
            itemId: item.id,
            itemName: item.name,
            itemType: item.type,
            price: item.price,
            purchasedAt: Date.now(),
            reported: false // User needs to report actual purchase
        });

        await materialRewardsSystem.saveInventory();

        showNotification(
            'Item Added to Purchase List',
            `${item.name} has been added. After you buy it in real life, report it in the Purchases tab!`,
            'success'
        );

        return item;
    }

    renderShop(containerId = 'shop-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const categories = ['all', 'book', 'course', 'tool', 'service', 'software'];
        const inventory = materialRewardsSystem.inventory;

        container.innerHTML = `
            <div class="glass-panel" style="margin-bottom: 1rem; padding: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="margin: 0; color: var(--text-primary);">Real-World Shop</h3>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="color: var(--text-secondary);">Balance:</span>
                        <span style="font-size: 1.2rem; font-weight: bold; color: var(--neon-blue);">$${inventory.money || 0}</span>
                    </div>
                </div>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">
                    Buy real-world items that help you level up. After purchasing here, buy the item in real life, then report it in the Purchases tab!
                </p>
            </div>

            <div class="glass-panel" style="margin-bottom: 1rem; padding: 1rem;">
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${categories.map(cat => `
                        <button class="shop-category-btn ${cat === 'all' ? 'active' : ''}" data-category="${cat}" style="padding: 0.5rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background: ${cat === 'all' ? 'var(--neon-blue)' : 'var(--bg-secondary)'}; color: ${cat === 'all' ? 'var(--bg-primary)' : 'var(--text-primary)'}; cursor: pointer;">
                            ${cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    `).join('')}
                </div>
            </div>

            <div id="shop-items-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
                ${this.renderShopItems('all')}
            </div>
        `;

        // Category filter buttons
        container.querySelectorAll('.shop-category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.shop-category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const category = btn.dataset.category;
                const grid = document.getElementById('shop-items-grid');
                grid.innerHTML = this.renderShopItems(category === 'all' ? null : category);
                this.attachPurchaseHandlers();
            });
        });

        this.attachPurchaseHandlers();
    }

    renderShopItems(category = null) {
        const items = this.getItemsByCategory(category);
        const inventory = materialRewardsSystem.inventory;
        const purchasedItemIds = (inventory.purchasedItems || []).map(pi => pi.itemId);

        return items.map(item => {
            const isPurchased = purchasedItemIds.includes(item.id);
            const canAfford = (inventory.money || 0) >= item.price;

            return `
                <div class="glass-panel shop-item ${isPurchased ? 'purchased' : ''}" style="padding: 1.25rem;">
                    <div style="display: flex; align-items: start; gap: 1rem; margin-bottom: 1rem;">
                        <div style="font-size: 3rem;">${item.icon}</div>
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">${item.name}</h4>
                            <div style="font-size: 0.85rem; color: var(--text-secondary); text-transform: capitalize; margin-bottom: 0.5rem;">
                                ${item.type} • ${item.category.replace('_', ' ')}
                            </div>
                            <div style="font-size: 1.2rem; font-weight: bold; color: var(--neon-blue);">
                                $${item.price}
                            </div>
                        </div>
                    </div>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem; line-height: 1.5;">
                        ${item.description}
                    </p>
                    <div style="margin-bottom: 1rem;">
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.25rem;">Improves:</div>
                        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            ${Object.entries(item.stats || {}).map(([stat, value]) => `
                                <span style="padding: 0.25rem 0.5rem; background: rgba(0, 212, 255, 0.1); border-radius: 4px; font-size: 0.8rem; color: var(--neon-blue);">
                                    ${stat.replace('_', ' ')} +${value}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                    ${isPurchased ? `
                        <div style="padding: 0.75rem; background: rgba(34, 211, 153, 0.1); border-radius: 8px; text-align: center; color: #22d399; font-size: 0.9rem;">
                            ✓ Purchased - Report in Purchases tab after buying in real life
                        </div>
                    ` : `
                        <button 
                            class="btn-primary shop-purchase-btn ${!canAfford ? 'disabled' : ''}" 
                            data-item-id="${item.id}"
                            style="width: 100%; ${!canAfford ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
                            ${!canAfford ? 'disabled' : ''}
                        >
                            ${canAfford ? 'Add to Purchase List' : 'Insufficient Funds'}
                        </button>
                    `}
                </div>
            `;
        }).join('');
    }

    attachPurchaseHandlers() {
        document.querySelectorAll('.shop-purchase-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const itemId = btn.dataset.itemId;
                try {
                    await this.purchaseItem(itemId);
                    this.renderShop(); // Refresh shop
                } catch (error) {
                    showNotification('Purchase Failed', error.message, 'error');
                }
            });
        });
    }
}

const realWorldShop = new RealWorldShop();


