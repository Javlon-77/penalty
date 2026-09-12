// Football Model with Physics

class Football {
    constructor(scene) {
        this.scene = scene;
        this.active = false;
        this.group = new THREE.Group();

        // Physics properties
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3();
        this.angularVelocity = new THREE.Vector3();
        this.spin = new THREE.Vector3();

        // Physics constants
        this.mass = 0.43; // kg (official football mass)
        this.radius = 0.22 / 2; // radius in meters
        this.drag = 0.47; // drag coefficient
        this.friction = 0.85; // rolling resistance
        this.bounceFactor = 0.6;
        this.spinFactor = 0.05;

        this.createModel();
    }

    createModel() {
        // Main ball sphere
        const ballGeometry = new THREE.SphereGeometry(0.22, 32, 32);
        
        // Create football texture with pentagon pattern
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Black panels and seams
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(256, 0);
        ctx.lineTo(256, 512);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 256);
        ctx.lineTo(512, 256);
        ctx.stroke();

        // Draw some pentagon patterns
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const x = (i + 0.5) * (512 / 3);
                const y = (j + 0.5) * (512 / 3);
                this.drawPentagon(ctx, x, y, 40);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;

        const material = new THREE.MeshStandardMaterial({
            map: texture,
            metalness: 0.15,
            roughness: 0.35
        });

        this.mesh = new THREE.Mesh(ballGeometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.group.add(this.mesh);

        this.scene.add(this.group);
    }

    drawPentagon(ctx, x, y, size) {
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const px = x + Math.cos(angle) * size;
            const py = y + Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
    }

    // Shoot the ball
    shoot(origin, direction, power, shotType = 'normal') {
        this.active = true;
        this.position.copy(origin);
        this.group.position.copy(origin);

        // Calculate velocity based on power and direction
        const speed = power * 25;
        this.velocity.copy(direction).normalize().multiplyScalar(speed);

        // Add spin based on shot type
        switch (shotType) {
            case 'curve':
                this.spin.set(
                    (Math.random() - 0.5) * 30,
                    (Math.random() - 0.5) * 20,
                    power * 25
                );
                break;
            case 'chip':
                this.velocity.y *= 1.5; // Higher arc
                this.spin.set(0, 0, -power * 30);
                break;
            case 'power':
                this.spin.set(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 5,
                    power * 15
                );
                break;
            case 'finesse':
                this.spin.set(
                    (Math.random() - 0.5) * 35,
                    (Math.random() - 0.5) * 25,
                    power * 20
                );
                break;
            default:
                this.spin.set(
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 15,
                    power * 18
                );
        }

        this.shotType = shotType;
    }

    // Update physics each frame
    update(deltaTime) {
        if (!this.active) return;

        // Gravity
        this.acceleration.y = -9.81;

        // Drag force (air resistance)
        const speedSquared = this.velocity.lengthSq();
        const dragForce = this.velocity.clone().normalize().multiplyScalar(
            -this.drag * speedSquared * 0.1
        );
        this.acceleration.add(dragForce);

        // Magnus force (spin effect/curve)
        const crossProduct = new THREE.Vector3();
        crossProduct.crossVectors(this.spin.clone().multiplyScalar(0.1), this.velocity);
        this.acceleration.add(crossProduct.multiplyScalar(this.spinFactor));

        // Update velocity
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));

        // Apply friction to spin
        this.spin.multiplyScalar(1 - this.friction * deltaTime * 0.5);

        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // Rotate mesh based on spin
        const spinAmount = this.spin.length() * deltaTime * 0.002;
        if (spinAmount > 0) {
            const spinAxis = this.spin.clone().normalize();
            const quaternion = new THREE.Quaternion();
            quaternion.setFromAxisAngle(spinAxis, spinAmount);
            this.mesh.quaternion.multiplyQuaternions(
                quaternion,
                this.mesh.quaternion
            );
        }

        // Update mesh position
        this.group.position.copy(this.position);

        // Reset acceleration for next frame
        this.acceleration.set(0, 0, 0);

        // Check if ball is out of play
        if (this.position.y < -10 || this.position.z > 60 || this.position.z < -80 ||
            Math.abs(this.position.x) > 50) {
            this.active = false;
        }
    }

    // Check collision with goal net
    checkNetCollision(netMesh) {
        if (!this.active) return false;

        // Simple bounding box check for goal area
        if (Math.abs(this.position.x) < 3.8 &&
            this.position.y < 2.5 &&
            this.position.z < -50) {
            return true;
        }
        return false;
    }

    // Check collision with goal posts/crossbar
    checkGoalStructureCollision() {
        if (!this.active) return null;

        const postPositions = [
            { x: -3.66, name: 'leftPost' },
            { x: 3.66, name: 'rightPost' },
            { x: 0, y: 2.44, name: 'crossbar' }
        ];

        for (let post of postPositions) {
            const dx = Math.abs(this.position.x - post.x);
            const dy = Math.abs(this.position.y - (post.y || 1.22));
            const dz = Math.abs(this.position.z + 52.5);

            if (dx < 0.3 && dy < 0.3 && dz < 0.5) {
                // Bounce off post
                this.bounce(post.name);
                return post.name;
            }
        }

        return null;
    }

    // Bounce physics
    bounce(objectType) {
        if (objectType === 'leftPost' || objectType === 'rightPost') {
            this.velocity.x *= -this.bounceFactor;
        } else if (objectType === 'crossbar') {
            this.velocity.y *= -this.bounceFactor;
        }

        this.velocity.multiplyScalar(0.85); // Energy loss

        if (AudioSystem) {
            AudioSystem.playImpactSound(objectType === 'crossbar' ? 'crossbar' : 'post', 
                Math.min(1, this.velocity.length() / 20));
        }
    }

    // Get ball trajectory info
    getTrajectory() {
        return {
            position: this.position.clone(),
            velocity: this.velocity.clone(),
            speed: this.velocity.length(),
            direction: this.velocity.clone().normalize()
        };
    }

    // Check if ball is in goal
    isGoal() {
        return Math.abs(this.position.x) < 3.66 &&
               this.position.y < 2.44 &&
               this.position.z < -50 &&
               this.position.z > -54;
    }

    // Reset ball
    reset() {
        this.active = false;
        this.position.set(0, 0.22, -11);
        this.velocity.set(0, 0, 0);
        this.acceleration.set(0, 0, 0);
        this.spin.set(0, 0, 0);
        this.mesh.quaternion.set(0, 0, 0, 1);
        this.group.position.copy(this.position);
    }

    dispose() {
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.scene.remove(this.group);
    }
}
