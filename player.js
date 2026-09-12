// Player Model and Animation

class Player {
    constructor(scene, position = new THREE.Vector3(0, 0, -11)) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.group.position.copy(position);
        this.scene.add(this.group);

        // Animation state
        this.currentState = 'idle';
        this.animationState = {
            runUpProgress: 0,
            kickProgress: 0,
            celebrationProgress: 0,
            hasShot: false
        };

        this.createModel();
        this.setupAnimations();
    }

    createModel() {
        // Head
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const skinMaterial = new THREE.MeshStandardMaterial({
            color: 0xffaa88,
            metalness: 0.1,
            roughness: 0.4
        });
        this.head = new THREE.Mesh(headGeometry, skinMaterial);
        this.head.position.y = 1.65;
        this.head.castShadow = true;
        this.head.receiveShadow = true;
        this.group.add(this.head);

        // Body/Torso
        const bodyGeometry = new THREE.BoxGeometry(0.45, 0.7, 0.25);
        const kitMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            metalness: 0.05,
            roughness: 0.5
        });
        this.body = new THREE.Mesh(bodyGeometry, kitMaterial);
        this.body.position.y = 0.85;
        this.body.castShadow = true;
        this.body.receiveShadow = true;
        this.group.add(this.body);

        // Arms
        const armGeometry = new THREE.CapsuleGeometry(0.08, 0.65, 4, 8);
        const armMaterial = new THREE.MeshStandardMaterial({
            color: 0xffaa88,
            metalness: 0.1,
            roughness: 0.4
        });

        this.leftArm = new THREE.Mesh(armGeometry, armMaterial);
        this.leftArm.position.set(-0.3, 1.2, 0);
        this.leftArm.castShadow = true;
        this.leftArm.receiveShadow = true;
        this.group.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeometry, armMaterial);
        this.rightArm.position.set(0.3, 1.2, 0);
        this.rightArm.castShadow = true;
        this.rightArm.receiveShadow = true;
        this.group.add(this.rightArm);

        // Legs
        const legGeometry = new THREE.CapsuleGeometry(0.1, 0.8, 4, 8);
        const legMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111,
            metalness: 0.1,
            roughness: 0.5
        });

        this.leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.leftLeg.position.set(-0.15, 0.3, 0);
        this.leftLeg.castShadow = true;
        this.leftLeg.receiveShadow = true;
        this.group.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        this.rightLeg.position.set(0.15, 0.3, 0);
        this.rightLeg.castShadow = true;
        this.rightLeg.receiveShadow = true;
        this.group.add(this.rightLeg);

        // Store default positions
        this.partDefaults = {
            head: { pos: this.head.position.clone(), rot: new THREE.Euler() },
            body: { pos: this.body.position.clone(), rot: new THREE.Euler() },
            leftArm: { pos: this.leftArm.position.clone(), rot: new THREE.Euler() },
            rightArm: { pos: this.rightArm.position.clone(), rot: new THREE.Euler() },
            leftLeg: { pos: this.leftLeg.position.clone(), rot: new THREE.Euler() },
            rightLeg: { pos: this.rightLeg.position.clone(), rot: new THREE.Euler() }
        };
    }

    setupAnimations() {
        // Animations will be managed through state updates
    }

    // Idle breathing animation
    updateIdle(deltaTime) {
        const breathScale = Math.sin(Date.now() * 0.002) * 0.02;
        this.body.scale.y = 1 + breathScale;
    }

    // Look toward goal
    lookAtGoal() {
        this.head.rotation.x = 0.3;
    }

    // Start run-up animation
    startRunUp(targetX, targetY, power) {
        this.currentState = 'runUp';
        this.animationState.runUpProgress = 0;
        this.animationState.targetX = targetX;
        this.animationState.targetY = targetY;
        this.animationState.power = power;
    }

    // Update run-up animation
    updateRunUp(deltaTime) {
        const duration = 0.8;
        this.animationState.runUpProgress += deltaTime / duration;

        if (this.animationState.runUpProgress >= 1) {
            this.performKick();
            return false; // Animation complete
        }

        const progress = this.animationState.runUpProgress;

        // Run towards the ball with steps
        const runDistance = 0.4;
        this.group.position.z += (runDistance / duration) * deltaTime;

        // Leg animation - running motion
        const legSwing = Math.sin(progress * Math.PI * 4) * 0.3;
        this.rightLeg.rotation.x = legSwing;
        this.leftLeg.rotation.x = -legSwing;

        // Arm swing
        const armSwing = Math.sin(progress * Math.PI * 4) * 0.25;
        this.rightArm.rotation.x = armSwing;
        this.leftArm.rotation.x = -armSwing;

        // Body lean forward
        this.body.rotation.x = 0.1 + (progress * 0.15);

        return true; // Animation ongoing
    }

    // Perform the kick
    performKick() {
        this.currentState = 'kick';
        this.animationState.kickProgress = 0;

        // Play kick sound
        if (AudioSystem) {
            AudioSystem.playKickSound(this.animationState.power);
            AudioSystem.playFootstep();
        }
    }

    // Update kick animation
    updateKick(deltaTime) {
        const duration = 0.3;
        this.animationState.kickProgress += deltaTime / duration;

        if (this.animationState.kickProgress >= 1) {
            this.updateCelebration(deltaTime);
            return false; // Animation complete
        }

        const progress = this.animationState.kickProgress;

        // Kicking leg swing (right leg for right-footed player)
        const kickAngle = progress * Math.PI * 1.2;
        this.rightLeg.rotation.x = kickAngle;

        // Plant foot (left leg) stays planted
        this.leftLeg.position.x = -0.15;
        this.leftLeg.rotation.x = 0;

        // Body rotation for shot direction
        const targetX = this.animationState.targetX || 0;
        this.body.rotation.y = (targetX / 5) * 0.3;

        // Follow-through with right arm
        const followThrough = Math.sin(progress * Math.PI) * 0.4;
        this.rightArm.rotation.z = followThrough;

        return true;
    }

    // Celebration or disappointment
    updateCelebration(deltaTime) {
        const duration = 1.0;
        this.animationState.celebrationProgress += deltaTime / duration;

        if (this.animationState.celebrationProgress >= 1) {
            this.reset();
            return false;
        }

        const progress = this.animationState.celebrationProgress;

        // Jump celebration
        const jumpHeight = Math.sin(progress * Math.PI) * 0.3;
        this.group.position.y = jumpHeight;

        // Arm raise
        this.rightArm.rotation.z = -Math.sin(progress * Math.PI * 2) * 0.5;
        this.leftArm.rotation.z = Math.sin(progress * Math.PI * 2) * 0.5;

        return true;
    }

    // Reset to idle state
    reset() {
        this.currentState = 'idle';
        this.group.position.z = -11;
        this.group.position.y = 0;

        // Reset rotations
        this.head.rotation.set(0, 0, 0);
        this.body.rotation.set(0, 0, 0);
        this.leftArm.rotation.set(0, 0, 0);
        this.rightArm.rotation.set(0, 0, 0);
        this.leftLeg.rotation.set(0, 0, 0);
        this.rightLeg.rotation.set(0, 0, 0);

        // Reset positions
        this.head.position.copy(this.partDefaults.head.pos);
        this.body.position.copy(this.partDefaults.body.pos);
        this.leftArm.position.copy(this.partDefaults.leftArm.pos);
        this.rightArm.position.copy(this.partDefaults.rightArm.pos);
        this.leftLeg.position.copy(this.partDefaults.leftLeg.pos);
        this.rightLeg.position.copy(this.partDefaults.rightLeg.pos);

        this.animationState = {
            runUpProgress: 0,
            kickProgress: 0,
            celebrationProgress: 0,
            hasShot: false
        };
    }

    // Update player animation
    update(deltaTime) {
        switch (this.currentState) {
            case 'idle':
                this.updateIdle(deltaTime);
                break;
            case 'runUp':
                this.updateRunUp(deltaTime);
                break;
            case 'kick':
                this.updateKick(deltaTime);
                break;
            case 'celebration':
                this.updateCelebration(deltaTime);
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
