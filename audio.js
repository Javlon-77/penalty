// Audio Manager - Web Audio API

class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 0.7;

        // Audio channels
        this.ambience = this.createChannel('ambience', 0.4);
        this.crowd = this.createChannel('crowd', 0.5);
        this.sfx = this.createChannel('sfx', 0.8);
        this.music = this.createChannel('music', 0.3);

        // Oscillator pool for sound generation
        this.oscillators = [];
    }

    createChannel(name, volume) {
        const gain = this.audioContext.createGain();
        gain.gain.value = volume;
        gain.connect(this.masterGain);
        return { gain, oscillators: [], noises: [] };
    }

    // Generate sound effects using Web Audio API
    playSoundEffect(type, duration = 0.5, frequency = 440) {
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.sfx.gain);

        switch (type) {
            case 'kick':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;

            case 'whistle':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.linearRampToValueAtTime(1200, now + duration);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0, now + duration);
                osc.start(now);
                osc.stop(now + duration);
                break;

            case 'impact':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(frequency, now);
                osc.frequency.exponentialRampToValueAtTime(20, now + duration);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
                osc.start(now);
                osc.stop(now + duration);
                break;

            case 'celebration':
                // Multi-tone celebration
                const freqs = [500, 800, 1200];
                freqs.forEach((freq, i) => {
                    const o = this.audioContext.createOscillator();
                    const g = this.audioContext.createGain();
                    o.connect(g);
                    g.connect(this.sfx.gain);
                    o.type = 'sine';
                    o.frequency.value = freq;
                    g.gain.setValueAtTime(0.15, now);
                    g.gain.exponentialRampToValueAtTime(0.01, now + duration);
                    o.start(now);
                    o.stop(now + duration);
                });
                break;

            case 'disappointment':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.lineTo ValueAtTime(100, now + duration);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
                osc.start(now);
                osc.stop(now + duration);
                break;
        }
    }

    // Generate crowd noise/ambience
    generateCrowdAmbience() {
        const now = this.audioContext.currentTime;
        const bufferSize = this.audioContext.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        // White noise with modulation
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
            // Envelope
            const envelope = Math.sin((i / bufferSize) * Math.PI) * 0.5;
            data[i] *= envelope;
        }

        return buffer;
    }

    // Play crowd ambience loop
    playCrowdAmbience(intensity = 0.5) {
        this.stopCrowdAmbience();

        const buffer = this.generateCrowdAmbience();
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000 + (intensity * 2000);

        source.connect(filter);
        filter.connect(this.crowd.gain);

        source.start(0);
        this.crowd.activeSource = source;
    }

    stopCrowdAmbience() {
        if (this.crowd.activeSource) {
            this.crowd.activeSource.stop();
            this.crowd.activeSource = null;
        }
    }

    // Fade crowd volume
    setCrowdIntensity(intensity) {
        intensity = Math.max(0, Math.min(1, intensity));
        const targetVolume = 0.2 + (intensity * 0.5);
        this.crowd.gain.gain.linearRampToValueAtTime(
            targetVolume,
            this.audioContext.currentTime + 1
        );
    }

    // Footstep sound
    playFootstep() {
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

        filter.type = 'highpass';
        filter.frequency.value = 80;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfx.gain);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    // Ball kick sound
    playKickSound(power = 1) {
        const now = this.audioContext.currentTime;
        const duration = 0.1;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(200 * power, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + duration);

        osc.connect(gain);
        gain.connect(this.sfx.gain);

        gain.gain.setValueAtTime(0.3 * power, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.start(now);
        osc.stop(now + duration);
    }

    // Ball impact sounds
    playImpactSound(objectType, force = 1) {
        const now = this.audioContext.currentTime;
        let duration = 0.2;
        let frequency = 400;

        switch (objectType) {
            case 'post':
                frequency = 800;
                duration = 0.3;
                break;
            case 'crossbar':
                frequency = 600;
                duration = 0.4;
                break;
            case 'net':
                frequency = 300;
                duration = 0.15;
                break;
            case 'gloves':
                frequency = 250;
                duration = 0.1;
                break;
        }

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency * force, now);
        osc.frequency.exponentialRampToValueAtTime(frequency * 0.2, now + duration);

        osc.connect(gain);
        gain.connect(this.sfx.gain);

        gain.gain.setValueAtTime(0.25 * force, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.start(now);
        osc.stop(now + duration);
    }

    // Referee whistle
    playWhistle() {
        const now = this.audioContext.currentTime;
        const duration = 0.5;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.linearRampToValueAtTime(1400, now + duration * 0.5);
        osc.frequency.linearRampToValueAtTime(1000, now + duration);

        filter.type = 'highpass';
        filter.frequency.value = 800;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfx.gain);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc.start(now);
        osc.stop(now + duration);
    }

    // Goalkeeper save sound (glove/catch)
    playGoalkeeperSave() {
        const now = this.audioContext.currentTime;
        
        this.playSoundEffect('impact', 0.15, 300);
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);

        osc.connect(gain);
        gain.connect(this.sfx.gain);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Match-winning moment sound
    playMatchWinner() {
        const now = this.audioContext.currentTime;
        const duration = 1.5;

        // Play ascending tones
        const freqs = [440, 550, 660, 880];
        const spacing = duration / freqs.length;

        freqs.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;

            osc.connect(gain);
            gain.connect(this.sfx.gain);

            const startTime = now + (i * spacing);
            gain.gain.setValueAtTime(0.2, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + spacing * 0.9);

            osc.start(startTime);
            osc.stop(startTime + spacing * 0.9);
        });
    }

    // Volume control
    setMasterVolume(volume) {
        this.masterGain.gain.linearRampToValueAtTime(
            volume,
            this.audioContext.currentTime + 0.5
        );
    }

    setChannelVolume(channel, volume) {
        if (this[channel]) {
            this[channel].gain.linearRampToValueAtTime(
                volume,
                this.audioContext.currentTime + 0.3
            );
        }
    }

    // Resume audio context if needed (browser autoplay policy)
    resume() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// Create global audio manager
let AudioSystem = null;

function initializeAudio() {
    if (!AudioSystem) {
        AudioSystem = new AudioManager();
        AudioSystem.playCrowdAmbience(0.3);
    }
}
