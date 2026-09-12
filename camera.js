// Cinematic Camera System

class CinematicCamera {
    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.camera = new THREE.PerspectiveCamera(
            75,
            renderer.domElement.clientWidth / renderer.domElement.clientHeight,
            0.1,
            1000
        );

        this.cameras = {
            wide: this.createWideCamera(),
            penaltyMarker: this.createPenaltyMarkerCamera(),
            goalkeeper: this.createGoalkeeperCamera(),
            ballTracker: this.createBallTrackerCamera(),
            replayGoal: this.createReplayGoalCamera(),
            preMatch: this.createPreMatchCamera()
        };

        this.currentCamera = 'wide';
        this.camera = this.cameras.wide;
        this.transitionDuration = 1;
        this.isTransitioning = false;
        this.transitionProgress = 0;

        // Default position
        this.setWideCamera();
    }

    createWideCamera() {
        const cam = new THREE.PerspectiveCamera(
            60,
            this.renderer.domElement.clientWidth / this.renderer.domElement.clientHeight,
            0.1,
            1000
        );
        cam.position.set(0, 8, 12);
        cam.lookAt(0, 1.5, -20);
        return cam;
    }

    createPenaltyMarkerCamera() {
        const cam = new THREE.PerspectiveCamera(
            65,
            this.renderer.domElement.clientWidth / this.renderer.domElement.clientHeight,
            0.1,
            1000
        );
        cam.position.set(-5, 3, -2);
        cam.lookAt(0, 1, -11);
        return cam;
    }

    createGoalkeeperCamera() {
        const cam = new THREE.PerspectiveCamera(
            75,
            this.renderer.domElement.clientWidth / this.renderer.domElement.clientHeight,
            0.1,
            1000
        );
        cam.position.set(0, 1.5, -45);
        cam.lookAt(0, 1, -11);
        return cam;
    }

    createBallTrackerCamera() {
        const cam = new THREE.PerspectiveCamera(
            70,
            this.renderer.domElement.clientWidth / this.renderer.domElement.clientHeight,
            0.1,
            1000
        );
        cam.position.set(3, 5, -5);
        cam.lookAt(0, 1, -30);
        return cam;
    }

    createReplayGoalCamera() {
        const cam = new THREE.PerspectiveCamera(
            80,
            this.renderer.domElement.clientWidth / this.renderer.domElement.clientHeight,
            0.1,
            1000
        );
        cam.position.set(0, 2, -42);
        cam.lookAt(0, 1.2, -52);
        return cam;
    }

    createPreMatchCamera() {
        const cam = new THREE.PerspectiveCamera(
            70,
            this.renderer.domElement.clientWidth / this.renderer.domElement.clientHeight,
            0.1,
            1000
        );
        cam.position.set(0, 15, 0);
        cam.lookAt(0, 0, 0);
        return cam;
    }

    // Transition between cameras
    transitionToCamera(cameraName, duration = 1) {
        if (!this.cameras[cameraName]) {
            console.warn(`Camera ${cameraName} not found`);
            return;
        }

        this.targetCamera = this.cameras[cameraName];
        this.sourceCamera = this.camera;
        this.transitionDuration = duration;
        this.transitionProgress = 0;
        this.isTransitioning = true;
    }

    // Update camera transition
    updateTransition(deltaTime) {
        if (!this.isTransitioning) return;

        this.transitionProgress += deltaTime / this.transitionDuration;

        if (this.transitionProgress >= 1) {
            this.camera = this.targetCamera;
            this.isTransitioning = false;
            this.transitionProgress = 1;
            return;
        }

        const t = this.easeInOutCubic(this.transitionProgress);

        // Interpolate position
        this.camera.position.lerpVectors(
            this.sourceCamera.position,
            this.targetCamera.position,
            t
        );

        // Interpolate look target
        const sourceTarget = new THREE.Vector3();
        const targetTarget = new THREE.Vector3();
        this.sourceCamera.getWorldDirection(sourceTarget);
        this.targetCamera.getWorldDirection(targetTarget);

        const lookTarget = new THREE.Vector3().lerpVectors(
            this.sourceCamera.position.clone().add(sourceTarget),
            this.targetCamera.position.clone().add(targetTarget),
            t
        );

        this.camera.lookAt(lookTarget);
    }

    // Easing function
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    // Set camera modes
    setWideCamera() {
        this.camera = this.cameras.wide;
        this.currentCamera = 'wide';
    }

    setPenaltyMarkerCamera() {
        this.transitionToCamera('penaltyMarker', 0.5);
    }

    setGoalkeeperCamera() {
        this.transitionToCamera('goalkeeper', 0.5);
    }

    setBallTrackerCamera() {
        this.transitionToCamera('ballTracker', 0.3);
    }

    setReplayGoalCamera() {
        this.transitionToCamera('replayGoal', 1.5);
    }

    setPreMatchCamera() {
        this.transitionToCamera('preMatch', 2);
    }

    // Track ball with camera
    trackBall(ballPosition) {
        if (this.currentCamera === 'ballTracker') {
            // Smoothly follow the ball
            const targetPos = ballPosition.clone().add(new THREE.Vector3(3, 3, 5));
            this.camera.position.lerp(targetPos, 0.02);
            this.camera.lookAt(ballPosition);
        }
    }

    // Apply camera shake
    applyShake(intensity = 0.1, duration = 0.3) {
        const originalPos = this.camera.position.clone();
        let shakeTime = 0;

        const shakeInterval = setInterval(() => {
            shakeTime += 0.016;

            if (shakeTime > duration) {
                this.camera.position.copy(originalPos);
                clearInterval(shakeInterval);
                return;
            }

            const shakeX = (Math.random() - 0.5) * intensity;
            const shakeY = (Math.random() - 0.5) * intensity;
            const shakeZ = (Math.random() - 0.5) * intensity;

            this.camera.position.set(
                originalPos.x + shakeX,
                originalPos.y + shakeY,
                originalPos.z + shakeZ
            );
        }, 16);
    }

    // Slow motion effect
    setSlowMotion(factor = 0.3, duration = 1) {
        // This affects game time, not camera directly
        // Implemented in game.js
    }

    // Update viewport on window resize
    updateViewport() {
        const width = this.renderer.domElement.clientWidth;
        const height = this.renderer.domElement.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);

        // Update all cameras
        Object.values(this.cameras).forEach(cam => {
            cam.aspect = width / height;
            cam.updateProjectionMatrix();
        });
    }

    // Play cinematic sequence
    playGoalReplay() {
        this.setReplayGoalCamera();
    }

    // Get current camera
    getCurrentCamera() {
        return this.camera;
    }

    // Update camera
    update(deltaTime, player = null, goalkeeper = null, ball = null) {
        this.updateTransition(deltaTime);

        // Subtle camera breathing/movement in ready state
        if (this.currentCamera === 'wide' && !this.isTransitioning) {
            const breathAmount = Math.sin(Date.now() * 0.001) * 0.02;
            this.camera.position.y = 8 + breathAmount;
        }

        // Track ball if active
        if (ball && ball.active) {
            this.trackBall(ball.position);
        }
    }
}
