/**
 * AI Assistant - Interactive AI assistant with text and voice support
 */

class AIAssistant {
    constructor() {
        this.messages = [];
        this.voiceEnabled = false;
        this.recognition = null;
        this.isListening = false;
        this.synth = window.speechSynthesis;
        
        this.initVoiceRecognition();
    }

    // Initialize voice recognition
    initVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.handleVoiceInput(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                showNotification('Voice Error', 'Could not recognize speech. Please try again.', 'info');
                this.isListening = false;
                this.updateVoiceButton();
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateVoiceButton();
            };
        }
    }

    // Initialize assistant
    async init() {
        this.loadMessages();
        this.renderMessages();
    }

    // Load messages from history
    async loadMessages() {
        try {
            const history = await db.getHistory(100);
            const aiMessages = history.filter(h => h.type === 'ai_message');
            // Restore conversation context if needed
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    // Handle text input
    async handleInput(message) {
        if (!message.trim()) return;

        // Store user activity in data collection system
        await dataCollection.storeActivity(message, 'user', { source: 'ai_conversation' });

        // Add user message
        this.addMessage('user', message);
        
        // Get AI response
        const response = await this.generateResponse(message);
        
        // Add AI response
        this.addMessage('assistant', response);

        // Save to history
        await db.addHistory({
            type: 'ai_message',
            role: 'user',
            content: message
        });
        
        await db.addHistory({
            type: 'ai_message',
            role: 'assistant',
            content: response
        });

        // Store conversation data
        await db.addHistory({
            type: 'ai_conversation_data',
            userMessage: message,
            aiResponse: response,
            timestamp: Date.now()
        });

        // Speak response if voice is enabled
        if (this.voiceEnabled) {
            this.speak(response);
        }
    }

    // Ask about user's day conversationally (triggered by data collection system)
    async askAboutDay() {
        const questions = [
            "How has your day been so far? What have you been working on?",
            "Tell me about what you've been doing today. Any interesting activities?",
            "What's been on your mind today? Share what you've been up to.",
            "How's your day going? I'd like to hear about your activities and progress.",
            "What have you accomplished today? Feel free to share your experiences."
        ];

        const question = utils.randomElement(questions);
        this.addMessage('assistant', question);
        
        // Show notification to draw attention
        showNotification(
            '[System] AI Assistant',
            'The System wants to know about your day.',
            'info'
        );
    }

    // Handle voice input
    handleVoiceInput(transcript) {
        this.handleInput(transcript);
    }

    // Generate AI response
    async generateResponse(userMessage) {
        const message = userMessage.toLowerCase();
        const playerData = gameEngine.getPlayerData();
        
        // Context-aware responses
        if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
            return `Hello, Hunter! You are currently at level ${playerData.level} with rank ${playerData.rank}. How can I assist you today?`;
        }
        
        if (message.includes('level') || message.includes('xp')) {
            const xpProgress = gameEngine.getXPProgress();
            return `You are level ${playerData.level} with ${Math.floor(xpProgress.current)}/${xpProgress.required} XP. You need ${xpProgress.required - Math.floor(xpProgress.current)} more XP to reach level ${playerData.level + 1}.`;
        }
        
        if (message.includes('quest') || message.includes('mission')) {
            const activeQuests = questSystem.getActiveQuests();
            if (activeQuests.length > 0) {
                return `You have ${activeQuests.length} active quest${activeQuests.length > 1 ? 's' : ''}. Complete them to gain XP and improve your stats!`;
            } else {
                return `You don't have any active quests. Generate a new quest to get started on your journey!`;
            }
        }
        
        if (message.includes('skill') || message.includes('upgrade')) {
            if (playerData.skillPoints > 0) {
                return `You have ${playerData.skillPoints} skill points available. Visit the Skills page to upgrade your abilities!`;
            } else {
                return `You don't have any skill points. Complete quests and level up to earn skill points!`;
            }
        }
        
        if (message.includes('rank') || message.includes('stat')) {
            const totalStats = Object.values(playerData.stats).reduce((sum, val) => sum + val, 0);
            return `Your current rank is ${playerData.rank}. Your total stats are ${totalStats}. Keep improving to reach higher ranks!`;
        }
        
        if (message.includes('help') || message.includes('what can you do')) {
            return `I can help you with:
• Checking your level, XP, and rank
• Information about your quests and skills
• General advice and motivation
• Answering questions about the system

What would you like to know?`;
        }
        
        if (message.includes('motivate') || message.includes('encourage')) {
            const motivationalMessages = [
                `Keep pushing forward, Hunter! Every quest completed makes you stronger.`,
                `Your dedication will lead you to greatness. Level up and become the strongest!`,
                `Remember: every master was once a beginner. You're on the right path!`,
                `Your stats are growing, Hunter. Continue your journey to reach rank SSS!`,
                `The path to power is through consistent effort. You've got this!`
            ];
            return utils.randomElement(motivationalMessages);
        }
        
        if (message.includes('advice') || message.includes('suggest')) {
            const suggestions = [
                `Focus on completing your active quests to gain XP and level up.`,
                `Allocate your skill points strategically based on your goals.`,
                `Try generating quests from different categories to improve all your stats.`,
                `Consistency is key - complete quests regularly to see steady progress.`
            ];
            return utils.randomElement(suggestions);
        }
        
        // Default responses
        const defaultResponses = [
            `I understand. How can I help you further with your journey?`,
            `That's interesting. Would you like to know more about your progress?`,
            `Let me know if you need help with quests, skills, or your stats.`,
            `I'm here to assist you. Ask me about your level, quests, or skills!`
        ];
        
        return utils.randomElement(defaultResponses);
    }

    // Add message to chat
    addMessage(role, content) {
        this.messages.push({ role, content, timestamp: Date.now() });
        this.renderMessages();
        
        // Auto-scroll to bottom
        const messagesContainer = document.getElementById('assistant-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    // Render messages
    renderMessages() {
        const container = document.getElementById('assistant-messages');
        if (!container) return;

        let html = '';
        this.messages.forEach(msg => {
            const messageClass = msg.role === 'assistant' ? 'system-message' : '';
            html += `
                <div class="message">
                    <div class="message-content ${messageClass}">
                        ${msg.content}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Toggle voice recognition
    toggleVoice() {
        if (!this.recognition) {
            showNotification('Voice Not Supported', 'Your browser does not support voice recognition.', 'info');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.voiceEnabled = false;
        } else {
            this.recognition.start();
            this.isListening = true;
            this.voiceEnabled = true;
        }

        this.updateVoiceButton();
    }

    // Update voice button
    updateVoiceButton() {
        const btn = document.getElementById('btn-voice-toggle');
        if (btn) {
            btn.textContent = `Voice: ${this.voiceEnabled && this.isListening ? 'LISTENING...' : this.voiceEnabled ? 'ON' : 'OFF'}`;
            btn.style.borderColor = this.voiceEnabled && this.isListening ? '#34d399' : this.voiceEnabled ? '#00d4ff' : '#6b7280';
        }
    }

    // Speak text
    speak(text) {
        if (!this.synth) return;

        // Cancel any ongoing speech
        this.synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        this.synth.speak(utterance);
    }

    // Stop speaking
    stopSpeaking() {
        if (this.synth) {
            this.synth.cancel();
        }
    }
}

// Export singleton instance
const aiAssistant = new AIAssistant();

