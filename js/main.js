/**
 * Main Application - Initialization and event handling
 */

// Navigation function
async function navigateTo(page) {
    try {
        console.log(`Navigating to: ${page}`);
        
        // Hide all pages
        const allPages = document.querySelectorAll('.page');
        console.log(`Found ${allPages.length} pages`);
        allPages.forEach(p => {
            p.classList.remove('active');
        });
        
        // Show target page
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) {
            targetPage.classList.add('active');
            console.log(`Successfully navigated to: ${page}`);
        } else {
            console.error(`Page "${page}" not found! Looking for: page-${page}`);
            // Show dashboard as fallback
            const dashboard = document.getElementById('page-dashboard');
            if (dashboard) {
                dashboard.classList.add('active');
            }
            return;
        }
        
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });
        
        // Refresh page content if needed
        if (page === 'quests') {
            if (typeof questSystem !== 'undefined') {
                questSystem.renderQuests();
            }
        } else if (page === 'achievements') {
            renderAchievementsPage();
        } else if (page === 'assistant') {
            // Refresh AI journal entries when navigating to assistant page
            if (typeof aiJournalSystem !== 'undefined') {
                aiJournalSystem.renderJournalEntries();
            }
            if (typeof journalSearch !== 'undefined') {
                journalSearch.applyFilters();
            }
            // Load active quests for reporting
            if (typeof updateQuestReportDropdown === 'function') {
                updateQuestReportDropdown();
            } else if (typeof reportSystem !== 'undefined' && typeof reportSystem.updateQuestDropdown === 'function') {
                reportSystem.updateQuestDropdown();
            }
        } else if (page === 'skills') {
            // Refresh skill tree and all skill-related features
            if (typeof skillSystem !== 'undefined') {
                skillSystem.renderSkillTree();
            }
            if (typeof activeSkills !== 'undefined') {
                activeSkills.renderSkills();
            }
            if (typeof passiveSkills !== 'undefined') {
                passiveSkills.renderPassiveSkills();
            }
            if (typeof realWorldCrafting !== 'undefined') {
                realWorldCrafting.renderCrafting();
            }
            if (typeof instantDungeons !== 'undefined') {
                instantDungeons.renderDungeons();
            }
            if (typeof statAllocation !== 'undefined') {
                statAllocation.renderStatAllocationUI();
            }
        } else if (page === 'stats') {
            // Refresh analytics and charts
            if (typeof gameEngine !== 'undefined') {
                gameEngine.updateStatsUI();
            }
            if (typeof statisticsDashboard !== 'undefined') {
                statisticsDashboard.renderDashboard();
            }
            if (typeof questAnalytics !== 'undefined') {
                await questAnalytics.calculateAnalytics();
                questAnalytics.renderDashboard('quest-analytics-dashboard');
            }
            if (typeof progressCharts !== 'undefined') {
                await progressCharts.loadChartData();
                progressCharts.renderXPChart('xp-chart-container');
                progressCharts.renderQuestChart('quest-chart-container');
            }
            if (typeof statAllocation !== 'undefined') {
                statAllocation.renderStatAllocationUI();
            }
        } else if (page === 'shop') {
            // Refresh shop
            if (typeof realWorldShop !== 'undefined') {
                realWorldShop.renderShop();
            }
        } else if (page === 'inventory') {
            // Render detailed inventory
            if (typeof detailedInventory !== 'undefined') {
                detailedInventory.renderDetailedInventory();
            }
        } else if (page === 'history') {
            // Render enhanced history
            if (typeof enhancedHistory !== 'undefined') {
                enhancedHistory.renderHistory();
            }
        } else if (page === 'settings') {
            // Render settings page content
            renderSettingsPage();
        }
    } catch (error) {
        console.error(`Error navigating to ${page}:`, error);
    }
}

// Render settings page
function renderSettingsPage() {
    // Render knowledge library
    if (typeof knowledgeReader !== 'undefined') {
        knowledgeReader.renderSourceLibrary();
    }

    // Render shadow monarch status
    renderShadowMonarchStatus();

    // Render loot boxes
    renderLootBoxes();

    // Setup export/import buttons
    setupDataManagement();
}

function renderShadowMonarchStatus() {
    const container = document.getElementById('shadow-monarch-status');
    if (!container) return;

    const playerData = gameEngine.getPlayerData();
    const rank = playerData.rank;
    
    if (typeof shadowMonarch !== 'undefined') {
        const stage = shadowMonarch.getEvolutionStage(rank);
        const bonus = shadowMonarch.getClassBonus(rank);

        container.innerHTML = `
            <div style="text-align: center; padding: 1rem;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">${stage.special ? '👹' : '⚔️'}</div>
                <div style="font-size: 1.25rem; font-weight: bold; color: var(--neon-blue); margin-bottom: 0.5rem;">
                    ${stage.name}
                </div>
                <div style="color: var(--text-secondary); margin-bottom: 1rem;">
                    Class: ${stage.class}
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-top: 1rem;">
                    <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: 8px;">
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">XP Multiplier</div>
                        <div style="font-size: 1.25rem; font-weight: bold; color: var(--neon-blue);">
                            ${bonus.xpMultiplier.toFixed(1)}x
                        </div>
                    </div>
                    <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: 8px;">
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">Stat Multiplier</div>
                        <div style="font-size: 1.25rem; font-weight: bold; color: var(--neon-blue);">
                            ${bonus.statMultiplier.toFixed(1)}x
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

function renderLootBoxes() {
    const container = document.getElementById('loot-boxes-container');
    if (!container) return;

    if (typeof lootBoxSystem === 'undefined') {
        container.innerHTML = '<p class="empty-state">Loot box system not available</p>';
        return;
    }

    const lootBoxes = lootBoxSystem.lootBoxes || [];
    
    if (lootBoxes.length === 0) {
        container.innerHTML = '<p class="empty-state">No loot boxes available</p>';
        return;
    }

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">';
    
    lootBoxes.forEach(box => {
        const rarityClass = box.rarity || 'common';
        html += `
            <div class="glass-panel" style="padding: 1.5rem; text-align: center; cursor: pointer;" onclick="lootBoxSystem.openLootBox('${box.rarity}')">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">${box.icon || '📦'}</div>
                <div style="font-weight: bold; margin-bottom: 0.25rem; color: var(--text-primary);">${box.name}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">${rarityClass.charAt(0).toUpperCase() + rarityClass.slice(1)}</div>
                <button class="btn-primary" style="width: 100%;">Open Loot Box</button>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function setupDataManagement() {
    // Export button
    const exportBtn = document.getElementById('btn-export-data');
    if (exportBtn && typeof dataExport !== 'undefined') {
        exportBtn.addEventListener('click', async () => {
            await dataExport.exportToFile();
        });
    }

    // Import button
    const importInput = document.getElementById('import-file-input');
    if (importInput && typeof dataExport !== 'undefined') {
        importInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const confirmed = confirm('This will replace all your current data. Are you sure?');
                if (confirmed) {
                    await dataExport.importFromFile(file);
                    // Reload page to show updated data
                    location.reload();
                }
            }
        });
    }
}

// Render achievements page
function renderAchievementsPage() {
    // Render streak
    if (typeof streakSystem !== 'undefined') {
        const currentStreakEl = document.getElementById('current-streak');
        const longestStreakEl = document.getElementById('longest-streak');
        if (currentStreakEl) {
            currentStreakEl.textContent = `${streakSystem.getCurrentStreak()} days 🔥`;
        }
        if (longestStreakEl) {
            longestStreakEl.textContent = `${streakSystem.getLongestStreak()} days`;
        }
    }

    // Render challenges
    if (typeof dailyChallenges !== 'undefined') {
        const dailyList = document.getElementById('daily-challenges-list');
        if (dailyList) {
            const challenges = dailyChallenges.getDailyChallenges();
            dailyList.innerHTML = challenges.map(c => `
                <div class="challenge-item ${c.completed ? 'completed' : ''}">
                    <div class="challenge-title">${c.title}</div>
                    <div class="challenge-description">${c.description}</div>
                    <div class="challenge-progress">${c.progress}/${c.requirement.count}</div>
                    <div class="challenge-reward">Reward: +${c.reward.xp} XP</div>
                </div>
            `).join('');
        }

        const weeklyList = document.getElementById('weekly-challenges-list');
        if (weeklyList) {
            const challenges = dailyChallenges.getWeeklyChallenges();
            weeklyList.innerHTML = challenges.map(c => `
                <div class="challenge-item ${c.completed ? 'completed' : ''}">
                    <div class="challenge-title">${c.title}</div>
                    <div class="challenge-description">${c.description}</div>
                    <div class="challenge-progress">${c.progress}/${c.requirement.count}</div>
                    <div class="challenge-reward">Reward: +${c.reward.xp} XP</div>
                </div>
            `).join('');
        }
    }

    // Render achievements
    if (typeof achievementSystem !== 'undefined') {
        const unlockedEl = document.getElementById('achievements-unlocked');
        const lockedEl = document.getElementById('achievements-locked');
        
        if (unlockedEl) {
            const unlocked = achievementSystem.getUnlockedAchievements();
            unlockedEl.innerHTML = unlocked.map(a => `
                <div class="achievement-item unlocked">
                    <span class="achievement-icon">${a.icon}</span>
                    <div class="achievement-info">
                        <div class="achievement-name">${a.name}</div>
                        <div class="achievement-description">${a.description}</div>
                    </div>
                </div>
            `).join('');
        }

        if (lockedEl) {
            const locked = achievementSystem.getLockedAchievements();
            lockedEl.innerHTML = locked.map(a => {
                const progress = achievementSystem.getAchievementProgress(a.id);
                return `
                    <div class="achievement-item locked">
                        <span class="achievement-icon">🔒</span>
                        <div class="achievement-info">
                            <div class="achievement-name">${a.name}</div>
                            <div class="achievement-description">${a.description}</div>
                            <div class="achievement-progress">${Math.floor(progress.progress)}%</div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

// Initialize application
async function init() {
    try {
        // Show loading screen
        const loadingScreen = document.getElementById('loading-screen');
        
        // Initialize database
        console.log('Initializing database...');
        await db.init();
        
        // Initialize knowledge engine (must be before quest generators)
        console.log('Initializing knowledge engine...');
        if (typeof knowledgeEngine !== 'undefined') {
            await knowledgeEngine.init();
            
            // Initialize knowledge sync
            if (typeof knowledgeSync !== 'undefined') {
                await knowledgeSync.init();
            }
            
            // Cache sources for offline use
            await knowledgeEngine.cacheSources();
            
            // Verify coverage
            const coverage = knowledgeEngine.getCoverageReport();
            console.log('[Knowledge Engine] Coverage:', coverage);
            console.log(`[Knowledge Engine] Total sources: ${knowledgeEngine.sources.length}`);
        }
        
        // Initialize game engine
        console.log('Initializing game engine...');
        await gameEngine.init();
        
        // Initialize data collection system first
        console.log('Initializing data collection system...');
        await dataCollection.init();
        
        // Initialize material rewards system
        console.log('Initializing material rewards system...');
        await materialRewardsSystem.init();
        
        // Initialize report system
        console.log('Initializing report system...');
        await reportSystem.init();
        
        // Initialize AI quest generator
        console.log('Initializing AI quest generator...');
        await aiQuestGenerator.init();
        
        // Initialize quest system
        console.log('Initializing quest system...');
        await questSystem.init();
        
        // Initialize background quest generator
        console.log('Initializing background quest generator...');
        await backgroundQuestGenerator.init();
        
        // Initialize skill system
        console.log('Initializing skill system...');
        await skillSystem.init();
        
        // Initialize AI assistant
        console.log('Initializing AI assistant...');
        await aiAssistant.init();
        
        // Initialize notification system
        console.log('Initializing notification system...');
        notificationSystem.init();
        
        // Initialize prayer times (optional feature)
        console.log('Initializing prayer times...');
        await prayerTimes.init();
        prayerTimes.renderPrayerTimes();
        
        // Initialize new systems
        console.log('Initializing achievement system...');
        if (typeof achievementSystem !== 'undefined') {
            await achievementSystem.init();
        }
        
        console.log('Initializing streak system...');
        if (typeof streakSystem !== 'undefined') {
            await streakSystem.init();
        }
        
        console.log('Initializing statistics dashboard...');
        if (typeof statisticsDashboard !== 'undefined') {
            await statisticsDashboard.init();
        }
        
        console.log('Initializing avatar evolution...');
        if (typeof avatarEvolution !== 'undefined') {
            avatarEvolution.updateAvatar();
        }
        
        console.log('Initializing quest chains...');
        if (typeof questChains !== 'undefined') {
            await questChains.init();
        }
        
        console.log('Initializing daily challenges...');
        if (typeof dailyChallenges !== 'undefined') {
            await dailyChallenges.init();
        }
        
        console.log('Initializing enhanced history...');
        if (typeof enhancedHistory !== 'undefined') {
            await enhancedHistory.init();
        }
        
        console.log('Initializing audio system...');
        if (typeof audioSystem !== 'undefined') {
            audioSystem.init();
        }
        
        console.log('Initializing shadow monarch system...');
        if (typeof shadowMonarch !== 'undefined') {
            await shadowMonarch.checkEvolution();
        }
        
        console.log('Initializing skill synergies...');
        if (typeof skillSynergies !== 'undefined') {
            skillSynergies.checkNewSynergy();
        }
        
        // Initialize AI Journal System
        console.log('Initializing AI journal system...');
        if (typeof aiJournalSystem !== 'undefined') {
            await aiJournalSystem.init();
        }
        
        // Initialize Pending Quest Delivery System
        console.log('Initializing pending quest delivery system...');
        if (typeof pendingQuestDelivery !== 'undefined') {
            await pendingQuestDelivery.init();
        }
        
        // Initialize Journal Search
        console.log('Initializing journal search system...');
        if (typeof journalSearch !== 'undefined') {
            journalSearch.init();
        }
        
        // Initialize Quest Analytics
        console.log('Initializing quest analytics...');
        if (typeof questAnalytics !== 'undefined') {
            await questAnalytics.init();
        }
        
        // Initialize Daily Reflection Prompts
        console.log('Initializing daily reflection prompts...');
        if (typeof dailyReflectionPrompts !== 'undefined') {
            await dailyReflectionPrompts.init();
        }
        
        // Initialize Progress Charts
        console.log('Initializing progress charts...');
        if (typeof progressCharts !== 'undefined') {
            await progressCharts.init();
        }
        
        // Initialize Smart Reminders
        console.log('Initializing smart reminders...');
        if (typeof smartReminders !== 'undefined') {
            await smartReminders.init();
        }
        
        // Initialize Quest Difficulty Adjustment
        console.log('Initializing quest difficulty adjustment...');
        if (typeof questDifficultyAdjustment !== 'undefined') {
            await questDifficultyAdjustment.init();
        }
        
        // Initialize Journal Achievements
        console.log('Initializing journal achievements...');
        if (typeof journalAchievements !== 'undefined') {
            await journalAchievements.init();
        }
        
        // Initialize Solo Leveling UI
        console.log('Initializing Solo Leveling UI enhancements...');
        if (typeof soloLevelingUI !== 'undefined') {
            soloLevelingUI.init();
        }
        
        // Initialize Real-World Features
        console.log('Initializing energy system...');
        if (typeof energySystem !== 'undefined') {
            await energySystem.init();
        }
        
        console.log('Initializing active skills...');
        if (typeof activeSkills !== 'undefined') {
            await activeSkills.init();
        }
        
        console.log('Initializing real-world shop...');
        if (typeof realWorldShop !== 'undefined') {
            await realWorldShop.init();
        }
        
        console.log('Initializing crafting system...');
        if (typeof realWorldCrafting !== 'undefined') {
            await realWorldCrafting.init();
        }
        
        console.log('Initializing purchase reporting...');
        if (typeof purchaseReporting !== 'undefined') {
            await purchaseReporting.init();
        }
        
        // Initialize Solo Leveling Missing Features
        console.log('Initializing stat allocation system...');
        if (typeof statAllocation !== 'undefined') {
            await statAllocation.init();
        }
        
        console.log('Initializing penalty quest system...');
        if (typeof penaltyQuestSystem !== 'undefined') {
            await penaltyQuestSystem.init();
        }
        
        console.log('Initializing threat detection...');
        if (typeof threatDetection !== 'undefined') {
            await threatDetection.init();
        }
        
        console.log('Initializing skill books...');
        if (typeof skillBooks !== 'undefined') {
            await skillBooks.init();
        }
        
        console.log('Initializing passive skills...');
        if (typeof passiveSkills !== 'undefined') {
            await passiveSkills.init();
        }
        
        console.log('Initializing instant dungeons...');
        if (typeof instantDungeons !== 'undefined') {
            await instantDungeons.init();
        }
        
        console.log('Initializing emergency quests...');
        if (typeof emergencyQuests !== 'undefined') {
            await emergencyQuests.init();
        }
        
        // Setup event listeners
        setupEventListeners();
        
        // Render initial UI
        gameEngine.updateUI();
        await gameEngine.updateMaterialRewardsUI();
        questSystem.renderActiveQuestsPreview();
        questSystem.renderQuests();
        skillSystem.renderSkillTree();
        
        // Hide loading screen - ensure it always hides even if errors occur
        const hideLoadingScreen = () => {
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
                loadingScreen.style.opacity = '0';
                loadingScreen.style.visibility = 'hidden';
                loadingScreen.style.pointerEvents = 'none';
                loadingScreen.classList.add('hidden');
            }
        };
        
        // Hide after initialization completes
        setTimeout(hideLoadingScreen, 1000);
        
        // Safety timeout - always hide after 10 seconds max (mobile fallback)
        setTimeout(hideLoadingScreen, 10000);
        
        // Show welcome message with Solo Leveling style
        setTimeout(() => {
            const playerData = gameEngine.getPlayerData();
            showNotification('[System] Initialization Complete', 'Welcome back, Hunter. The System is ready. Describe your activities to generate quests.', 'info');
            
            // Show system message
            const aiMessageContent = document.getElementById('ai-message-content');
            if (aiMessageContent) {
                aiMessageContent.textContent = `System active. Current status: Level ${playerData.level}, Rank ${playerData.rank}. The System will automatically generate quests based on your activities. You can also manually request quests or chat with me about your day, Hunter.`;
            }
        }, 1000);
        
        console.log('Application initialized successfully!');
        
    } catch (error) {
        console.error('Error initializing application:', error);
        alert('Error initializing application. Please refresh the page.');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation buttons
    const navButtons = document.querySelectorAll('.nav-btn');
    console.log(`Found ${navButtons.length} navigation buttons`);
    
    navButtons.forEach((btn, index) => {
        const page = btn.dataset.page;
        console.log(`Setting up nav button ${index}: ${page}`);
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const targetPage = btn.dataset.page;
            console.log(`Navigation button clicked: ${targetPage}`);
            if (targetPage) {
                navigateTo(targetPage);
            } else {
                console.warn('Navigation button has no data-page attribute');
            }
        });
    });

    // More menu button
    const moreMenuBtn = document.getElementById('more-menu-btn');
    const moreMenu = document.getElementById('more-menu');
    const moreMenuClose = document.getElementById('more-menu-close');
    const moreMenuOverlay = document.getElementById('more-menu-overlay');
    
    if (moreMenuBtn && moreMenu) {
        moreMenuBtn.addEventListener('click', () => {
            moreMenu.style.display = 'block';
            setTimeout(() => {
                moreMenu.classList.add('active');
            }, 10);
        });
    }

    if (moreMenuClose && moreMenu) {
        moreMenuClose.addEventListener('click', closeMoreMenu);
    }

    if (moreMenuOverlay && moreMenu) {
        moreMenuOverlay.addEventListener('click', closeMoreMenu);
    }

    // More menu items
    document.querySelectorAll('.more-menu-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            if (page) {
                closeMoreMenu();
                navigateTo(page);
            }
        });
    });

    // Use skill points button
    const useSkillPointsBtn = document.getElementById('btn-use-skill-points');
    if (useSkillPointsBtn) {
        useSkillPointsBtn.addEventListener('click', () => {
            navigateTo('skills');
        });
    }
    
    // AI Journal System - Save entry button
    const saveJournalBtn = document.getElementById('btn-save-journal-entry');
    const journalInput = document.getElementById('ai-journal-input');
    
    if (saveJournalBtn && typeof aiJournalSystem !== 'undefined') {
        saveJournalBtn.addEventListener('click', async () => {
            const text = journalInput ? journalInput.value.trim() : '';
            if (text) {
                await aiJournalSystem.saveJournalEntry(text);
            }
        });
    }
    
    // AI Journal System - Enter key
    if (journalInput) {
        journalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                if (saveJournalBtn) {
                    saveJournalBtn.click();
                }
            }
        });
    }
    
    // AI Journal System - Voice input (online only)
    const voiceRecordBtn = document.getElementById('btn-ai-voice-record');
    if (voiceRecordBtn && typeof aiJournalSystem !== 'undefined') {
        voiceRecordBtn.addEventListener('click', () => {
            if (!aiJournalSystem.isOnline) {
                showNotification('Voice Unavailable', 'Voice input is only available when online.', 'info');
                return;
            }
            
            if (aiJournalSystem.voiceRecognition) {
                if (aiJournalSystem.voiceRecognition.running) {
                    aiJournalSystem.voiceRecognition.stop();
                    aiJournalSystem.updateVoiceButton(false);
                } else {
                    aiJournalSystem.voiceRecognition.start();
                    aiJournalSystem.updateVoiceButton(true);
                }
            } else {
                showNotification('Voice Not Available', 'Voice recognition is not supported in your browser.', 'info');
            }
        });
    }
    
    // Modal close
    const questModal = document.getElementById('quest-modal');
    const modalClose = document.querySelector('.modal-close');
    
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            if (questModal) {
                questModal.classList.remove('active');
            }
        });
    }
    
    // Close modal on outside click
    if (questModal) {
        questModal.addEventListener('click', (e) => {
            if (e.target === questModal) {
                questModal.classList.remove('active');
            }
        });
    }
    
    // Game engine event listeners
    if (typeof gameEngine !== 'undefined') {
        gameEngine.on('levelUp', (data) => {
            if (typeof notificationSystem !== 'undefined') {
                notificationSystem.showLevelUp(data.newLevel, data.skillPointsGained);
            }
            gameEngine.updateUI();
        });
        
        gameEngine.on('xpGain', (data) => {
            if (typeof notificationSystem !== 'undefined') {
                notificationSystem.showXPGain(data.amount);
            }
        });
        
        gameEngine.on('rankChange', (data) => {
            if (typeof notificationSystem !== 'undefined') {
                notificationSystem.showRankChange(data.oldRank, data.newRank);
            }
            gameEngine.updateUI();
        });
    }
    
    // Online/offline status
    window.addEventListener('online', () => {
        if (typeof showNotification !== 'undefined') {
            showNotification('Connection Restored', 'You are back online. Syncing data...', 'info');
        }
        // Sync data here if needed
    });
    
    window.addEventListener('offline', () => {
        if (typeof showNotification !== 'undefined') {
            showNotification('Offline Mode', 'You are offline. Core features remain available.', 'info');
        }
    });
    
    // Prevent default touch behaviors for better mobile experience
    document.addEventListener('touchmove', (e) => {
        if (e.target.closest('.assistant-messages')) {
            // Allow scrolling in messages
            return;
        }
    }, { passive: true });
}

function closeMoreMenu() {
    const moreMenu = document.getElementById('more-menu');
    if (moreMenu) {
        moreMenu.classList.remove('active');
        setTimeout(() => {
            moreMenu.style.display = 'none';
        }, 300);
    }
}

// Send message function
function sendMessage() {
    const input = document.getElementById('assistant-input');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    input.value = '';
    aiAssistant.handleInput(message);
}

// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// Function to update quest report dropdown
async function updateQuestReportDropdown() {
    const select = document.getElementById('quest-select-for-report');
    if (!select) return;
    
    try {
        const activeQuests = await db.getActiveQuests();
        select.innerHTML = '<option value="">Select a quest to report...</option>';
        
        activeQuests.forEach(quest => {
            const option = document.createElement('option');
            option.value = quest.id;
            option.textContent = quest.title;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading quests for dropdown:', error);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Expose navigateTo globally
window.navigateTo = navigateTo;

// Expose updateQuestReportDropdown globally
window.updateQuestReportDropdown = updateQuestReportDropdown;

