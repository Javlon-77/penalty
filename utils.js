// Utility Functions

class Vector3Utils {
    static randomInBox(size) {
        return new THREE.Vector3(
            (Math.random() - 0.5) * size,
            (Math.random() - 0.5) * size,
            (Math.random() - 0.5) * size
        );
    }

    static randomOnSphere(radius) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        
        return new THREE.Vector3(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi)
        );
    }

    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    static distance(v1, v2) {
        return v1.distanceTo(v2);
    }
}

// Animation Mixer Manager
class AnimationController {
    constructor(skeletalMesh) {
        this.mesh = skeletalMesh;
        this.mixer = new THREE.AnimationMixer(skeletalMesh);
        this.actions = {};
        this.currentAction = null;
        this.transitionDuration = 0.5;
    }

    addAnimation(name, animationClip) {
        this.actions[name] = this.mixer.clipAction(animationClip);
    }

    play(name, loop = true, weight = 1) {
        if (this.currentAction && this.currentAction !== this.actions[name]) {
            this.currentAction.fadeOut(this.transitionDuration);
        }

        const action = this.actions[name];
        if (!action) {
            console.warn(`Animation not found: ${name}`);
            return;
        }

        action.reset();
        action.fadeIn(this.transitionDuration);
        action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
        action.play();
        this.currentAction = action;
        
        return action;
    }

    stop() {
        if (this.currentAction) {
            this.currentAction.fadeOut(this.transitionDuration);
        }
    }

    update(deltaTime) {
        this.mixer.update(deltaTime);
    }

    dispose() {
        this.mixer.stopAllAction();
    }
}

// Procedural Model Creator
class ProceduralModels {
    static createHumanoidCharacter(scale = 1, skinColor = 0xffaa88) {
        const group = new THREE.Group();

        // Head
        const headGeometry = new THREE.SphereGeometry(0.25 * scale, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: skinColor, metalness: 0.1 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.5 * scale;
        head.castShadow = true;
        head.receiveShadow = true;
        group.add(head);

        // Body
        const bodyGeometry = new THREE.BoxGeometry(0.4 * scale, 0.7 * scale, 0.25 * scale);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff4444, metalness: 0.05 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.85 * scale;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        // Arms
        const armGeometry = new THREE.CapsuleGeometry(0.08 * scale, 0.6 * scale, 4, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ color: skinColor, metalness: 0.1 });

        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-0.3 * scale, 1.1 * scale, 0);
        leftArm.castShadow = true;
        leftArm.receiveShadow = true;
        group.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(0.3 * scale, 1.1 * scale, 0);
        rightArm.castShadow = true;
        rightArm.receiveShadow = true;
        group.add(rightArm);

        // Legs
        const legGeometry = new THREE.CapsuleGeometry(0.1 * scale, 0.75 * scale, 4, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.1 });

        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.15 * scale, 0.25 * scale, 0);
        leftLeg.castShadow = true;
        leftLeg.receiveShadow = true;
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.15 * scale, 0.25 * scale, 0);
        rightLeg.castShadow = true;
        rightLeg.receiveShadow = true;
        group.add(rightLeg);

        // Store references for animation
        group.parts = {
            head,
            body,
            leftArm,
            rightArm,
            leftLeg,
            rightLeg
        };

        return group;
    }

    static createFootball(radius = 0.22) {
        const group = new THREE.Group();

        // Main sphere
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.2,
            roughness: 0.4,
            map: this.createFootballTexture()
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);

        // Add seams (black pentagon pattern)
        const seams = this.createFootballSeams(radius);
        group.add(seams);

        group.mesh = mesh;
        return group;
    }

    static createFootballTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Black seams
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(128, 0);
        ctx.lineTo(120, 60);
        ctx.lineTo(70, 70);
        ctx.lineTo(100, 128);
        ctx.lineTo(70, 186);
        ctx.lineTo(120, 196);
        ctx.lineTo(128, 256);
        ctx.fill();

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    static createFootballSeams(radius) {
        const group = new THREE.Group();
        const seamGeometry = new THREE.TorusGeometry(radius * 0.95, radius * 0.05, 16, 32);
        const seamMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            metalness: 0.3,
            roughness: 0.6
        });

        const seam1 = new THREE.Mesh(seamGeometry, seamMaterial);
        seam1.rotation.x = Math.PI / 2;
        group.add(seam1);

        return group;
    }

    static createStadium(scale = 1) {
        const group = new THREE.Group();

        // Pitch
        const pitchGeometry = new THREE.PlaneGeometry(68 * scale, 105 * scale);
        const pitchMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a4d2e,
            metalness: 0.0,
            roughness: 0.8
        });
        const pitch = new THREE.Mesh(pitchGeometry, pitchMaterial);
        pitch.receiveShadow = true;
        pitch.rotation.x = -Math.PI / 2;
        group.add(pitch);

        // Pitch lines
        const lineGroup = this.createPitchLines(scale);
        group.add(lineGroup);

        // Goal structure
        const goalGroup = this.createGoalStructure(scale);
        group.add(goalGroup);

        // Stands (simplified)
        const standsGroup = this.createStands(scale);
        group.add(standsGroup);

        // Floodlights
        const lightsGroup = this.createFloodlights(scale);
        group.add(lightsGroup);

        group.pitch = pitch;
        return group;
    }

    static createPitchLines(scale) {
        const group = new THREE.Group();
        const lineGeometry = new THREE.BufferGeometry();
        const positions = [];
        const lineWidth = 0.3 * scale;

        // Center line
        positions.push(-34 * scale, 0.01, -52.5 * scale);
        positions.push(34 * scale, 0.01, -52.5 * scale);
        positions.push(34 * scale, 0.01, 52.5 * scale);
        positions.push(-34 * scale, 0.01, 52.5 * scale);

        // Goal areas
        positions.push(-20.16 * scale, 0.01, -52.5 * scale);
        positions.push(-20.16 * scale, 0.01, -40.32 * scale);
        positions.push(20.16 * scale, 0.01, -40.32 * scale);
        positions.push(20.16 * scale, 0.01, -52.5 * scale);

        const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));

        return group;
    }

    static createGoalStructure(scale) {
        const group = new THREE.Group();

        // Posts
        const postGeometry = new THREE.CylinderGeometry(0.15 * scale, 0.15 * scale, 2.44 * scale);
        const postMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.8,
            roughness: 0.2
        });

        const leftPost = new THREE.Mesh(postGeometry, postMaterial);
        leftPost.position.set(-3.66 * scale, 1.22 * scale, -52.5 * scale);
        leftPost.castShadow = true;
        leftPost.receiveShadow = true;
        group.add(leftPost);

        const rightPost = new THREE.Mesh(postGeometry, postMaterial);
        rightPost.position.set(3.66 * scale, 1.22 * scale, -52.5 * scale);
        rightPost.castShadow = true;
        rightPost.receiveShadow = true;
        group.add(rightPost);

        // Crossbar
        const barGeometry = new THREE.CylinderGeometry(0.15 * scale, 0.15 * scale, 7.32 * scale);
        const crossbar = new THREE.Mesh(barGeometry, postMaterial);
        crossbar.position.set(0, 2.44 * scale, -52.5 * scale);
        crossbar.rotation.z = Math.PI / 2;
        crossbar.castShadow = true;
        crossbar.receiveShadow = true;
        group.add(crossbar);

        // Net (cloth mesh)
        const netMesh = this.createGoalNet(scale);
        group.add(netMesh);

        group.goalNet = netMesh;
        return group;
    }

    static createGoalNet(scale) {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const indices = [];

        const netWidth = 7.32 * scale;
        const netHeight = 2.44 * scale;
        const netDepth = 2 * scale;
        const widthSegments = 12;
        const heightSegments = 8;
        const depthSegments = 6;

        // Create vertices
        for (let x = 0; x <= widthSegments; x++) {
            for (let y = 0; y <= heightSegments; y++) {
                for (let z = 0; z <= depthSegments; z++) {
                    positions.push(
                        (-netWidth / 2) + (x / widthSegments) * netWidth,
                        y / heightSegments * netHeight,
                        -52.5 * scale - (z / depthSegments) * netDepth
                    );
                }
            }
        }

        // Create indices
        for (let x = 0; x < widthSegments; x++) {
            for (let y = 0; y < heightSegments; y++) {
                for (let z = 0; z < depthSegments; z++) {
                    const a = (x * (heightSegments + 1) * (depthSegments + 1)) + (y * (depthSegments + 1)) + z;
                    const b = a + 1;
                    const c = a + (heightSegments + 1) * (depthSegments + 1);
                    const d = c + 1;

                    indices.push(a, b, c);
                    indices.push(b, d, c);
                }
            }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.0,
            roughness: 0.7,
            side: THREE.DoubleSide,
            wireframe: false
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.receiveShadow = true;
        mesh.castShadow = false;

        return mesh;
    }

    static createStands(scale) {
        const group = new THREE.Group();

        // Back stands (simplified cubes)
        const standGeometry = new THREE.BoxGeometry(40 * scale, 20 * scale, 15 * scale);
        const standMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

        const backStand = new THREE.Mesh(standGeometry, standMaterial);
        backStand.position.set(0, 10 * scale, -60 * scale);
        backStand.castShadow = true;
        group.add(backStand);

        const frontStand = new THREE.Mesh(standGeometry, standMaterial);
        frontStand.position.set(0, 10 * scale, 60 * scale);
        frontStand.castShadow = true;
        group.add(frontStand);

        return group;
    }

    static createFloodlights(scale) {
        const group = new THREE.Group();

        const positions = [
            [-30 * scale, 30 * scale, -50 * scale],
            [30 * scale, 30 * scale, -50 * scale],
            [-30 * scale, 30 * scale, 50 * scale],
            [30 * scale, 30 * scale, 50 * scale]
        ];

        positions.forEach(pos => {
            const poleGeometry = new THREE.CylinderGeometry(0.5 * scale, 0.5 * scale, 30 * scale);
            const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(pos[0], pos[1], pos[2]);
            pole.castShadow = true;
            group.add(pole);

            // Light fixture
            const fixtureGeometry = new THREE.SphereGeometry(2 * scale, 16, 16);
            const fixtureMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
            const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
            fixture.position.set(pos[0], pos[1], pos[2]);
            fixture.castShadow = true;
            group.add(fixture);
        });

        return group;
    }
}
