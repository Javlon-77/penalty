// Challenge System

class ChallengeManager {
    constructor() {
        this.challenges = this.createChallenges();
        this.activeChallenge = null;
        this.progress = {};
        this.completed = new Set();

        // Initialize progress tracking
        this.challenges.forEach(c => {
            this.progress[c.id] = { current: 0, required: c.required };
        });
    }

    createChallenges() {
        return [
            // Streak Challenges
            { id: 1, name: 'Hat Trick', description: 'Score 3 consecutive penalties', required: 3, category: 'streak' },
            { id: 2, name: 'Five Goals', description: 'Score 5 consecutive penalties', required: 5, category: 'streak' },
            { id: 3, name: 'Ten Goals', description: 'Score 10 consecutive penalties', required: 10, category: 'streak' },
            { id: 4, name: 'Perfect Game', description: 'Score 5 without missing', required: 5, category: 'streak' },

            // Directional Challenges
            { id: 5, name: 'Top Left', description: 'Score in top-left corner', required: 1, category: 'direction' },
            { id: 6, name: 'Top Right', description: 'Score in top-right corner', required: 1, category: 'direction' },
            { id: 7, name: 'Bottom Left', description: 'Score in bottom-left corner', required: 1, category: 'direction' },
            { id: 8, name: 'Bottom Right', description: 'Score in bottom-right corner', required: 1, category: 'direction' },
            { id: 9, name: 'Center Bull', description: 'Score a perfect center shot', required: 1, category: 'direction' },
            { id: 10, name: 'Three Corners', description: 'Score in 3 different corners', required: 3, category: 'direction' },
            { id: 11, name: 'All Corners', description: 'Score in all 4 corners', required: 4, category: 'direction' },

            // Shot Type Challenges
            { id: 12, name: 'Chip Master', description: 'Score with a chip shot', required: 1, category: 'shotType' },
            { id: 13, name: 'Power Striker', description: 'Score with maximum power', required: 1, category: 'shotType' },
            { id: 14, name: 'Finesse Pro', description: 'Score with finesse shot', required: 1, category: 'shotType' },
            { id: 15, name: 'Curve Expert', description: 'Score with a curved shot', required: 1, category: 'shotType' },
            { id: 16, name: 'Shot Variety', description: 'Score 3 different shot types', required: 3, category: 'shotType' },
            { id: 17, name: 'Five Chips', description: 'Score 5 chip shots', required: 5, category: 'shotType' },

            // Structure Challenges
            { id: 18, name: 'Crossbar Challenge', description: 'Hit the crossbar', required: 1, category: 'structure' },
            { id: 19, name: 'Post Master', description: 'Hit the post', required: 1, category: 'structure' },
            { id: 20, name: 'Post Ricochet', description: 'Score after hitting the post', required: 1, category: 'structure' },
            { id: 21, name: 'Crossbar Bounce', description: 'Hit crossbar twice', required: 2, category: 'structure' },

            // Goalkeeper Challenges
            { id: 22, name: 'Elite Beater', description: 'Beat elite goalkeeper', required: 1, category: 'goalkeeper' },
            { id: 23, name: 'Legendary Master', description: 'Score against legendary difficulty', required: 1, category: 'goalkeeper' },
            { id: 24, name: 'Three Saves', description: 'Face 3 saves and adapt', required: 3, category: 'goalkeeper' },
            { id: 25, name: 'Goalkeeper Tamer', description: 'Beat goalkeeper 3 times in a row', required: 3, category: 'goalkeeper' },

            // Shootout Challenges
            { id: 26, name: 'Shootout Champion', description: 'Win a 5v5 penalty shootout', required: 1, category: 'shootout' },
            { id: 27, name: 'Sudden Death Hero', description: 'Win in sudden death', required: 1, category: 'shootout' },
            { id: 28, name: 'Match Winner', description: 'Score the match-winning penalty', required: 1, category: 'shootout' },
            { id: 29, name: 'Perfect Shootout', description: 'Win shootout without missing', required: 1, category: 'shootout' },

            // Accuracy Challenges
            { id: 30, name: 'Precision Shot', description: 'Achieve 80% accuracy', required: 1, category: 'accuracy' },
            { id: 31, name: 'Perfect Accuracy', description: 'Achieve perfect accuracy (10+ shots)', required: 1, category: 'accuracy' },
        ];
    }

    // Get challenge by ID
    getChallenge(id) {
        return this.challenges.find(c => c.id === id);
    }

    // Update progress for a challenge
    updateProgress(challengeId, increment = 1) {
        if (this.completed.has(challengeId)) return;

        const challenge = this.getChallenge(challengeId);
        if (!challenge) return;

        this.progress[challengeId].current = Math.min(
            this.progress[challengeId].current + increment,
            challenge.required
        );

        // Check if completed
        if (this.progress[challengeId].current >= challenge.required) {
            this.completeChallenge(challengeId);
        }
    }

    // Mark challenge as completed
    completeChallenge(challengeId) {
        if (!this.completed.has(challengeId)) {
            this.completed.add(challengeId);
            
            if (AudioSystem) {
                AudioSystem.playMatchWinner();
            }

            // Dispatch event
            window.dispatchEvent(new CustomEvent('challengeComplete', {
                detail: { challengeId, challenge: this.getChallenge(challengeId) }
            }));
        }
    }

    // Track shot and update relevant challenges
    trackShot(result, shotType, position) {
        // Streak challenges
        if (result === 'goal') {
            this.updateProgress(1); // Hat trick
            this.updateProgress(2); // Five goals
            this.updateProgress(3); // Ten goals
            this.updateProgress(4); // Perfect game
        }

        // Directional challenges
        if (result === 'goal') {
            const x = position ? position.x : 0;
            const y = position ? position.y : 0;

            if (x < -3 && y > 1.8) this.updateProgress(5); // Top left
            if (x > 3 && y > 1.8) this.updateProgress(6); // Top right
            if (x < -3 && y < 0.5) this.updateProgress(7); // Bottom left
            if (x > 3 && y < 0.5) this.updateProgress(8); // Bottom right
            if (Math.abs(x) < 1 && Math.abs(y - 1.2) < 0.3) this.updateProgress(9); // Center
        }

        // Shot type challenges
        if (result === 'goal') {
            if (shotType === 'chip') this.updateProgress(12);
            if (shotType === 'power') this.updateProgress(13);
            if (shotType === 'finesse') this.updateProgress(14);
            if (shotType === 'curve') this.updateProgress(15);

            // Track variety
            this.trackShotTypeVariety(shotType);
        }

        // Structure challenges
        if (result === 'post') this.updateProgress(19);
        if (result === 'crossbar') this.updateProgress(18);
        if (result === 'goalAfterPost') this.updateProgress(20);
    }

    trackShotTypeVariety(shotType) {
        if (!this.shotTypeVariety) this.shotTypeVariety = new Set();
        this.shotTypeVariety.add(shotType);

        if (this.shotTypeVariety.size >= 3) {
            this.updateProgress(16);
        }
    }

    trackShootoutVictory(isOvertimeWin) {
        this.updateProgress(26); // Shootout champion
        
        if (isOvertimeWin) {
            this.updateProgress(27); // Sudden death hero
        }
    }

    trackMatchWinner() {
        this.updateProgress(28); // Match winner
    }

    trackAccuracy(accuracy) {
        if (accuracy >= 80) {
            this.updateProgress(30); // 80% accuracy
        }
        if (accuracy === 100) {
            this.updateProgress(31); // Perfect accuracy
        }
    }

    trackDifficultyBeat(difficulty) {
        if (difficulty === 'WorldClass' || difficulty === 'Legendary') {
            this.updateProgress(22); // Elite beater
        }
        if (difficulty === 'Legendary') {
            this.updateProgress(23); // Legendary master
        }
    }

    // Get all challenges
    getAllChallenges() {
        return this.challenges;
    }

    // Get challenge progress
    getProgress(challengeId) {
        return this.progress[challengeId] || { current: 0, required: 0 };
    }

    // Get completion percentage
    getCompletionPercentage() {
        return (this.completed.size / this.challenges.length) * 100;
    }

    // Get challenges by category
    getChallengesByCategory(category) {
        return this.challenges.filter(c => c.category === category);
    }

    // Reset challenges
    resetProgress() {
        this.challenges.forEach(c => {
            this.progress[c.id] = { current: 0, required: c.required };
        });
        this.completed.clear();
        this.shotTypeVariety = new Set();
    }
}

// Create global challenge manager
const ChallengeSystem = new ChallengeManager();
