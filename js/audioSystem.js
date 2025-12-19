/**
 * Audio System - Sound effects and audio feedback
 */

class AudioSystem {
    constructor() {
        this.enabled = true;
        this.volume = 0.5;
        this.sounds = {};
        this.audioContext = null;
    }

    init() {
        // Check if audio is enabled in settings
        const saved = localStorage.getItem('audioEnabled');
        if (saved !== null) {
            this.enabled = saved === 'true';
        }

        const savedVolume = localStorage.getItem('audioVolume');
        if (savedVolume !== null) {
            this.volume = parseFloat(savedVolume);
        }

        // Initialize Web Audio API
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }

    play(soundName) {
        if (!this.enabled) return;

        // Generate simple tones for different sounds
        const frequencies = {
            'achievement': 800,
            'level_up': 600,
            'quest_complete': 500,
            'streak': 700,
            'notification': 400,
            'click': 300,
            'error': 200
        };

        const frequency = frequencies[soundName] || 400;
        this.playTone(frequency, 0.1);
    }

    playTone(frequency, duration) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        localStorage.setItem('audioEnabled', enabled.toString());
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('audioVolume', this.volume.toString());
    }

    toggle() {
        this.setEnabled(!this.enabled);
        return this.enabled;
    }
}

const audioSystem = new AudioSystem();


