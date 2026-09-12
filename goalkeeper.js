// Goalkeeper Model and AI

class Goalkeeper {
    constructor(scene, position = new THREE.Vector3(0, 0, -52.5)) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.position.copy(position);
        this.scene.add(this.group);

        // AI properties
        this.difficulty = 'Amateur';
        this.reactionTime = 0.6;
        this.positioningAccuracy = 0.4;
        this.savedShots = 0;
        this.shotHistory = [];
        this.lastChallengeX = 0;

        // Animation state
        this.currentState = 'idle';
        this.animationState = {
            diveProgress: 0,
            landProgress: 0,
            getUpProgress: 0,
            diveDirection: 0,
            targetX: 0,
            targetY: 0
        };

        // Physics state
        this.isAirborne = false;

        this.createModel();
    }

    createModel() {
        // Head
        const headGeometry = new THREE.SphereGeometry(0.27, 16, 16);
        const skinMaterial = new THREE.MeshStandardMaterial({
            color: 0xffaa88,
            metalness: 0.1,
            roughness: 0.4
        });
        this.head = new THREE.Mesh(headGeometry, skinMaterial);
        this.head.position.y = 1.7;
        this.head.castShadow = true;
        this.head.receiveShadow = true;
        this.group.add(this.head);

        // Body/Torso (goalkeeper kit)
        const bodyGeometry = new THREE.BoxGeometry(0.5, 0.75, 0.28);
        const gkKitMaterial = new THREE.MeshStandardMaterial({
            color: 0x1111ff,
            metalness: 0.05,
            roughness: 0.5
        });
        this.body = new THREE.Mesh(bodyGeometry, gkKitMaterial);
        this.body.position.y = 0.9;
        this.body.castShadow = true;
        this.body.receiveShadow = true;
        this.group.add(this.body);

        // Goalkeeper gloves (larger hands)
        const gloveGeometry = new THREE.SphereGeometry(0.15, 12, 12);
        const gloveMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            metalness: 0.3,
            roughness: 0.4
        });

        this.leftGlove = new THREE.Mesh(gloveGeometry, gloveMaterial);
        this.leftGlove.position.set(-0.35, 1.3, 0);
        this.leftGlove.castShadow = true;
        this.leftGlove.receiveShadow = true;
        this.group.add(this.leftGlove);

        this.rightGlove = new THREE.Mesh(gloveGeometry, gloveMaterial);
        this.rightGlove.position.set(0.35, 1.3, 0);
        this.rightGlove.castShadow = true;
        this.rightGlove.receiveShadow = true;
        this.group.add(this.rightGlove);

        // Arms
        const armGeometry = new THREE.CapsuleGeometry(0.09, 0.7, 4, 8);
        const armMaterial = new THREE.MeshStandardMaterial({
            color: 0xffaa88,
            metalness: 0.1,
            roughness: 0.4
        });

        this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
        this.leftArm.position.set(-0.35, 1.2, 0);
        this.leftArm.castShadow = true;
        this.leftArm.receiveShadow = true;
        this.group.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
        this.rightArm.position.set(0.35, 1.2, 0);
        this.rightArm.castShadow = true;
        this.rightArm.receiveShadow = true;
        this.group.add(this.rightArm);

        // Legs
        const legGeometry = new THREE.CapsuleGeometry(0.11, 0.85, 4, 8);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.1,
            roughness: 0.5
        });

        this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.leftLeg.position.set(-0.18, 0.35, 0);
        this.leftLeg.castShadow = true;
        this.leftLeg.receiveShadow = true;
        this.group.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.rightLeg.position.set(0.18, 0.35, 0);
        this.rightLeg.castShadow = true;
        this.rightLeg.receiveShadow = true;
        this.group.add(this.rightLeg);

        // Store default positions
        this.partDefaults = {
            body: { pos: this.body.position.clone() },
            leftArm: { pos: this.leftArm.position.clone() },
            rightArm: { pos: this.rightArm.position.clone() },
            leftGlove: { pos: this.leftGlove.position.clone() },
            rightGlove: { pos: this.rightGlove.position.clone() }
        };
    }

    // Set difficulty level
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        
        const difficultySettings = {
            Amateur: { reactionTime: 0.6, accuracy: 0.4, learning: 0.1 },
            SemiPro: { reactionTime: 0.45, accuracy: 0.6, learning: 0.25 },
            Professional: { reactionTime: 0.35, accuracy: 0.75, learning: 0.4 },
            WorldClass: { reactionTime: 0.25, accuracy: 0.9, learning: 0.6 },
            Legendary: { reactionTime: 0.15, accuracy: 0.98, learning: 0.85 }
        };

        const settings = difficultySettings[difficulty];
        this.reactionTime = settings.reactionTime;
        this.positioningAccuracy = settings.accuracy;
        this.learningRate = settings.learning;
    }

    // AI Decision Making
    decideDive(ballTrajectory, power) {
        // Track shot history for learning
        this.shotHistory.push(ballTrajectory.x);
        if (this.shotHistory.length > 10) {
            this.shotHistory.shift();
        }

        // Predict shot direction
        let predictedX = ballTrajectory.x;

        // Add goalkeeper learning
        const avgX = this.shotHistory.reduce((a, b) => a + b, 0) / this.shotHistory.length;
        const bias = (avgX - 0) * this.learningRate;
        predictedX = (predictedX * (1 - this.learningRate)) + bias;

        // Add uncertainty based on difficulty
        const uncertainty = (1 - this.positioningAccuracy) * 3;
        predictedX += (Math.random() - 0.5) * uncertainty;

        // Sometimes stay center or fake a movement
        if (Math.random() < (1 - this.positioningAccuracy) * 0.3) {
            predictedX = 0; // Stay center
        } else if (Math.random() < 0.1) {
            predictedX = -predictedX; // Dive wrong way (rare)
        }

        // Clamp position
        predictedX = Math.max(-3, Math.min(3, predictedX));

        this.animationState.targetX = predictedX;
        this.animationState.targetY = Math.abs(ballTrajectory.y) * 0.8;

        // Delay dive based on reaction time
        this.reactionDelay = this.reactionTime * 1000;
        this.lastShotTime = Date.now();

        return predictedX;
    }

    // Start dive animation
    dive(direction) {
        if (this.isAirborne) return;

        this.currentState = 'dive';
        this.animationState.diveProgress = 0;
        this.animationState.diveDirection = direction > 0 ? 1 : -1;
        this.isAirborne = true;

        if (AudioSystem) {
            AudioSystem.playSoundEffect('impact', 0.3, 300);
        }
    }

    // Update dive animation
    updateDive(deltaTime) {
        const duration = 0.6;
        this.animationState.diveProgress += deltaTime / duration;

        if (this.animationState.diveProgress >= 1) {
            this.land();
            return false;
        }

        const progress = this.animationState.diveProgress;
        const direction = this.animationState.diveDirection;

        // Dive arc
        const horizontalDistance = direction * 2 * progress;
        const verticalDistance = Math.sin(progress * Math.PI) * 1.2;

        this.group.position.x = horizontalDistance;
        this.group.position.y = verticalDistance;

        // Body rotation during dive
        this.body.rotation.z = direction * Math.PI * 0.6 * progress;
        this.body.rotation.x = Math.sin(progress * Math.PI) * 0.3;

        // Arm extension
        if (direction < 0) {
            this.leftArm.rotation.z = -Math.PI * 0.7 * progress;
            this.rightArm.rotation.z = -Math.PI * 0.3 * progress;
        } else {
            this.rightArm.rotation.z = Math.PI * 0.7 * progress;
            this.leftArm.rotation.z = Math.PI * 0.3 * progress;
        }

        // Head follows body
        this.head.rotation.x = Math.sin(progress * Math.PI) * 0.2;

        return true;
    }

    // Land after dive
    land() {
        this.currentState = 'land';
        this.animationState.landProgress = 0;
    }

    // Update land animation
    updateLand(deltaTime) {
        const duration = 0.4;
        this.animationState.landProgress += deltaTime / duration;

        if (this.animationState.landProgress >= 1) {
            this.getUp();
            return false;
        }

        const progress = this.animationState.landProgress;

        // Gradual return to ground
        const currentY = this.group.position.y;
        this.group.position.y = currentY * (1 - progress * 0.5);

        // Body settling
        this.body.rotation.z *= (1 - progress * 0.3);

        return true;
    }

    // Get up after save
    getUp() {
        this.currentState = 'getUp';
        this.animationState.getUpProgress = 0;
    }

    // Update get up animation
    updateGetUp(deltaTime) {
        const duration = 0.5;
        this.animationState.getUpProgress += deltaTime / duration;

        if (this.animationState.getUpProgress >= 1) {
            this.reset();
            return false;
        }

        const progress = this.animationState.getUpProgress;

        // Push off ground
        const pushForce = Math.sin(progress * Math.PI) * 0.3;
        this.group.position.y += pushForce * deltaTime;

        return true;
    }

    // Return to ready position
    reset() {
        this.currentState = 'ready';
        this.isAirborne = false;

        // Reset position
        this.group.position.set(0, 0, -52.5);

        // Reset rotations
        this.head.rotation.set(0, 0, 0);
        this.body.rotation.set(0, 0, 0);
        this.leftArm.rotation.set(0, 0, 0);
        this.rightArm.rotation.set(0, 0, 0);
        this.leftLeg.rotation.set(0, 0, 0);
        this.rightLeg.rotation.set(0, 0, 0);

        // Small breathing animation
        const breathScale = Math.sin(Date.now() * 0.003) * 0.05;
        this.body.scale.y = 1 + breathScale;

        this.animationState = {
            diveProgress: 0,
            landProgress: 0,
            getUpProgress: 0,
            diveDirection: 0,
            targetX: 0,
            targetY: 0
        };
    }

    // Check if goalkeeper caught the ball
    checkCatch(ballPosition, ballRadius = 0.22) {
        // Check distance to gloves
        const leftGloveDistance = this.leftGlove.getWorldPosition(new THREE.Vector3()).distanceTo(ballPosition);
        const rightGloveDistance = this.rightGlove.getWorldPosition(new THREE.Vector3()).distanceTo(ballPosition);

        const minDistance = Math.min(leftGloveDistance, rightGloveDistance);
        
        return minDistance < (0.5 + ballRadius);
    }

    // Update goalkeeper
    update(deltaTime) {
        // Update based on current state
        switch (this.currentState) {
            case 'ready':
                this.reset();
                break;
            case 'dive':
                this.updateDive(deltaTime);
                break;
            case 'land':
                this.updateLand(deltaTime);
                break;
            case 'getUp':
                this.updateGetUp(deltaTime);
                break;
        }
    }

    dispose() {
        this.group.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
        this.scene.remove(this.group);
    }
}
