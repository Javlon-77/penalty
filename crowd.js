// Stadium Crowd System

class StadiumCrowd {
    constructor(scene, capacity = 1000) {
        this.scene = scene;
        this.capacity = capacity;
        this.groups = [];
        this.animationPhase = 0;
        this.mood = 'calm'; // calm, anticipation, celebration, disappointment
        this.intensity = 0.3;

        this.createCrowd();
    }

    createCrowd() {
        const standPositions = [
            // Back stand
            { start: new THREE.Vector3(-30, 8, -60), gridX: 15, gridZ: 6, label: 'back' },
            // Front stand
            { start: new THREE.Vector3(-30, 8, 60), gridX: 15, gridZ: 6, label: 'front' },
            // Left side
            { start: new THREE.Vector3(-45, 8, -45), gridX: 5, gridZ: 15, label: 'left' },
            // Right side
            { start: new THREE.Vector3(45, 8, -45), gridX: 5, gridZ: 15, label: 'right' }
        ];

        let spectatorCount = 0;
        const spacing = 3;

        standPositions.forEach(stand => {
            const group = {
                label: stand.label,
                spectators: [],
                waveProgress: Math.random() * Math.PI * 2
            };

            // Create spectators in a grid
            for (let x = 0; x < stand.gridX && spectatorCount < this.capacity; x++) {
                for (let z = 0; z < stand.gridZ && spectatorCount < this.capacity; z++) {
                    const specPos = new THREE.Vector3(
                        stand.start.x + x * spacing,
                        stand.start.y + Math.random() * 4,
                        stand.start.z + z * spacing
                    );

                    const spectator = this.createSpectator(specPos);
                    group.spectators.push(spectator);
                    spectatorCount++;
                }
            }

            this.groups.push(group);
        });
    }

    createSpectator(position) {
        const group = new THREE.Group();
        group.position.copy(position);

        // Random spectator colors
        const colors = [0xff4444, 0x4444ff, 0x44ff44, 0xffff44, 0xff88ff];
        const color = colors[Math.floor(Math.random() * colors.length)];

        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1, 6);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa88 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 0.7;
        head.castShadow = true;
        head.receiveShadow = true;
        group.add(head);

        // Store animation state
        group.animationPhase = Math.random() * Math.PI * 2;
        group.jumpPower = Math.random() * 0.5 + 0.2;
        group.animationType = Math.random() > 0.5 ? 'stand' : 'sit';

        this.scene.add(group);

        return {
            mesh: group,
            phase: Math.random() * Math.PI * 2,
            clapping: false
        };
    }

    // Update crowd mood and intensity
    setMood(mood, intensity = 1) {
        this.mood = mood;
        this.intensity = intensity;

        switch (mood) {
            case 'calm':
                if (AudioSystem) AudioSystem.setCrowdIntensity(0.2);
                break;
            case 'anticipation':
                if (AudioSystem) AudioSystem.setCrowdIntensity(0.5);
                break;
            case 'celebration':
                if (AudioSystem) {
                    AudioSystem.setCrowdIntensity(1);
                    AudioSystem.playSoundEffect('celebration', 0.5);
                }
                break;
            case 'disappointment':
                if (AudioSystem) AudioSystem.setCrowdIntensity(0.3);
                break;
        }
    }

    // Update crowd animations
    update(deltaTime) {
        this.animationPhase += deltaTime * 0.5;

        this.groups.forEach(group => {
            group.spectators.forEach((spectator, index) => {
                const mesh = spectator.mesh;
                const phase = spectator.phase + this.animationPhase;

                // Different animation based on mood
                switch (this.mood) {
                    case 'calm':
                        this.updateCalmSpectator(mesh, phase, index);
                        break;
                    case 'anticipation':
                        this.updateAnticipationSpectator(mesh, phase, index);
                        break;
                    case 'celebration':
                        this.updateCelebrationSpectator(mesh, phase, index);
                        break;
                    case 'disappointment':
                        this.updateDisappointmentSpectator(mesh, phase, index);
                        break;
                }
            });
        });
    }

    updateCalmSpectator(mesh, phase, index) {
        // Subtle swaying
        const sway = Math.sin(phase * 1) * 0.1;
        mesh.position.x += sway * 0.01;
        mesh.rotation.z = sway * 0.1;

        // Occasional looking around
        mesh.rotation.y = Math.sin(phase * 0.5) * 0.2;
    }

    updateAnticipationSpectator(mesh, phase, index) {
        // Leaning forward
        const lean = Math.sin(phase * 1.5) * 0.2;
        mesh.position.y += lean * 0.05;
        mesh.rotation.x = -0.1 + lean * 0.1;

        // Shifting weight
        mesh.position.x += Math.sin(phase * 2) * 0.05;
    }

    updateCelebrationSpectator(mesh, phase, index) {
        // Jumping
        const jumpHeight = Math.max(0, Math.sin(phase * 3) * 0.8);
        mesh.position.y += jumpHeight * this.intensity;

        // Arm raising (via rotation)
        mesh.rotation.z = Math.sin(phase * 4) * 0.5 * this.intensity;
        mesh.rotation.x = Math.sin(phase * 3) * 0.3 * this.intensity;

        // Random cheering sounds occasionally
        if (Math.random() < 0.01 && AudioSystem) {
            AudioSystem.playSoundEffect('impact', 0.2, 800 + Math.random() * 400);
        }
    }

    updateDisappointmentSpectator(mesh, phase, index) {
        // Head down
        mesh.rotation.x = 0.2 + Math.sin(phase * 1) * 0.1;

        // Sitting back
        mesh.position.y -= 0.2;

        // Shaking head
        mesh.rotation.y = Math.sin(phase * 2) * 0.2;
    }

    // Wave effect - crowd sections wave sequentially
    triggerWave() {
        let waveDelay = 0;
        this.groups.forEach(group => {
            setTimeout(() => {
                this.setMood('celebration', 1);
            }, waveDelay);
            waveDelay += 300;
        });
    }

    // Mass chant
    startChant() {
        if (AudioSystem) {
            const chantFreqs = [440, 550, 440];
            let chantIndex = 0;

            const chantInterval = setInterval(() => {
                AudioSystem.playSoundEffect('impact', 0.3, chantFreqs[chantIndex]);
                chantIndex = (chantIndex + 1) % chantFreqs.length;

                if (chantIndex === 0) {
                    clearInterval(chantInterval);
                }
            }, 250);
        }
    }

    // Clear crowd
    dispose() {
        this.groups.forEach(group => {
            group.spectators.forEach(spec => {
                spec.mesh.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                this.scene.remove(spec.mesh);
            });
        });
        this.groups = [];
    }
}
