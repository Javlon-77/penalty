// Stadium Creation and Management

class Stadium {
    constructor(scene, scale = 1) {
        this.scene = scene;
        this.scale = scale;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.create();
    }

    create() {
        this.createPitch();
        this.createGoals();
        this.createAdvertisingBoards();
        this.createStands();
        this.createFloodlights();
        this.createPenaltyAreas();
    }

    createPitch() {
        // Main pitch surface
        const pitchGeometry = new THREE.PlaneGeometry(68 * this.scale, 105 * this.scale, 32, 48);
        
        // Create grass texture procedurally
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Base grass color
        ctx.fillStyle = '#1a4d2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add mowing pattern (stripes)
        ctx.fillStyle = '#165c35';
        for (let i = 0; i < canvas.height; i += 20) {
            ctx.fillRect(0, i, canvas.width, 10);
        }

        // Add grass texture details
        for (let i = 0; i < 5000; i++) {
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.1})`;
            ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 6);

        const pitchMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            metalness: 0.0,
            roughness: 0.9,
            side: THREE.FrontSide
        });

        const pitch = new THREE.Mesh(pitchGeometry, pitchMaterial);
        pitch.rotation.x = -Math.PI / 2;
        pitch.receiveShadow = true;
        pitch.castShadow = false;
        this.group.add(pitch);

        this.pitch = pitch;

        // Create pitch lines (markings)
        this.createPitchLines();
    }

    createPitchLines() {
        const lineWidth = 0.15 * this.scale;
        const lineMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.0,
            roughness: 0.8
        });

        // Center line
        this.createLine(-34 * this.scale, 0, -52.5 * this.scale, 34 * this.scale, 0, -52.5 * this.scale, lineWidth, lineMaterial);
        this.createLine(0, 0, -52.5 * this.scale, 0, 0, 52.5 * this.scale, lineWidth, lineMaterial);

        // Penalty area
        this.createLine(-20.16 * this.scale, 0, -40.32 * this.scale, 20.16 * this.scale, 0, -40.32 * this.scale, lineWidth, lineMaterial);
        this.createLine(-20.16 * this.scale, 0, -52.5 * this.scale, -20.16 * this.scale, 0, -40.32 * this.scale, lineWidth, lineMaterial);
        this.createLine(20.16 * this.scale, 0, -52.5 * this.scale, 20.16 * this.scale, 0, -40.32 * this.scale, lineWidth, lineMaterial);

        // Goal area
        this.createLine(-9.16 * this.scale, 0, -47.5 * this.scale, 9.16 * this.scale, 0, -47.5 * this.scale, lineWidth, lineMaterial);
        this.createLine(-9.16 * this.scale, 0, -52.5 * this.scale, -9.16 * this.scale, 0, -47.5 * this.scale, lineWidth, lineMaterial);
        this.createLine(9.16 * this.scale, 0, -52.5 * this.scale, 9.16 * this.scale, 0, -47.5 * this.scale, lineWidth, lineMaterial);

        // Penalty mark
        const spotGeometry = new THREE.CircleGeometry(0.3 * this.scale, 16);
        const spotMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const penaltySpot = new THREE.Mesh(spotGeometry, spotMaterial);
        penaltySpot.position.set(0, 0.01, -11 * this.scale);
        penaltySpot.rotation.x = -Math.PI / 2;
        this.group.add(penaltySpot);

        // Center circle
        const circleGeometry = new THREE.BufferGeometry();
        const points = [];
        for (let i = 0; i <= 64; i++) {
            const angle = (i / 64) * Math.PI * 2;
            points.push(
                Math.cos(angle) * 9.15 * this.scale,
                0.01,
                Math.sin(angle) * 9.15 * this.scale
            );
        }
        circleGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
        const circleLine = new THREE.LineSegments(circleGeometry, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 }));
        this.group.add(circleLine);
    }

    createLine(x1, y1, z1, x2, y2, z2, width, material) {
        const direction = new THREE.Vector3(x2 - x1, y2 - y1, z2 - z1);
        const length = direction.length();
        direction.normalize();

        const geometry = new THREE.PlaneGeometry(width, length);
        const line = new THREE.Mesh(geometry, material);

        line.position.set((x1 + x2) / 2, 0.01, (z1 + z2) / 2);
        line.rotation.x = -Math.PI / 2;
        
        const angle = Math.atan2(direction.z, direction.x);
        line.rotation.z = angle;

        line.receiveShadow = true;
        this.group.add(line);
    }

    createGoals() {
        // Left goal
        this.createGoal(-3.66 * this.scale, 2.44 * this.scale, 7.32 * this.scale);
        // Right goal
        this.createGoal(3.66 * this.scale, 2.44 * this.scale, 7.32 * this.scale);

        // Actually, single goal at the end - correct positions
        // Back goal
        this.createGoal(0, 2.44 * this.scale, 7.32 * this.scale, -52.5 * this.scale);
    }

    createGoal(centerX, height, width, zPos = -52.5 * this.scale) {
        const group = new THREE.Group();

        // Goal posts (vertical cylinders)
        const postGeometry = new THREE.CylinderGeometry(0.15 * this.scale, 0.15 * this.scale, height);
        const postMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.8,
            roughness: 0.2
        });

        const leftPost = new THREE.Mesh(postGeometry, postMaterial);
        leftPost.position.set(-width / 2, height / 2, 0);
        leftPost.castShadow = true;
        leftPost.receiveShadow = true;
        group.add(leftPost);

        const rightPost = new THREE.Mesh(postGeometry, postMaterial);
        rightPost.position.set(width / 2, height / 2, 0);
        rightPost.castShadow = true;
        rightPost.receiveShadow = true;
        group.add(rightPost);

        // Crossbar
        const barGeometry = new THREE.CylinderGeometry(0.15 * this.scale, 0.15 * this.scale, width);
        const crossbar = new THREE.Mesh(barGeometry, postMaterial);
        crossbar.position.set(0, height, 0);
        crossbar.rotation.z = Math.PI / 2;
        crossbar.castShadow = true;
        crossbar.receiveShadow = true;
        group.add(crossbar);

        // Goal net
        const net = this.createGoalNet(width, height);
        group.add(net);

        group.position.set(centerX, 0, zPos);
        this.group.add(group);

        this.goalNet = net;
        return group;
    }

    createGoalNet(width, height) {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const indices = [];

        const widthSegments = 20;
        const heightSegments = 12;
        const depthSegments = 8;
        const depth = 2 * this.scale;

        // Create net vertices
        for (let x = 0; x <= widthSegments; x++) {
            for (let y = 0; y <= heightSegments; y++) {
                for (let z = 0; z <= depthSegments; z++) {
                    positions.push(
                        (-width / 2) + (x / widthSegments) * width,
                        (y / heightSegments) * height,
                        -(z / depthSegments) * depth
                    );
                }
            }
        }

        // Create indices for the mesh
        const hd = heightSegments + 1;
        const dd = depthSegments + 1;

        for (let x = 0; x < widthSegments; x++) {
            for (let y = 0; y < heightSegments; y++) {
                for (let z = 0; z < depthSegments; z++) {
                    const a = x * hd * dd + y * dd + z;
                    const b = a + 1;
                    const c = a + hd * dd;
                    const d = c + 1;

                    if (x < widthSegments - 1 || y < heightSegments - 1) {
                        indices.push(a, b, c);
                        if (z < depthSegments - 1) {
                            indices.push(b, d, c);
                        }
                    }
                }
            }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        if (indices.length > 0) {
            geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
        }
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

        // Store physics data
        mesh.netVertices = new Float32Array(positions);
        mesh.netPositions = new Map();

        return mesh;
    }

    createAdvertisingBoards() {
        const boardMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a4d2e,
            metalness: 0.1,
            roughness: 0.4
        });

        const boardGeometry = new THREE.PlaneGeometry(30 * this.scale, 4 * this.scale);

        // Create boards along the sidelines
        const positions = [
            [-40 * this.scale, 2 * this.scale, -30 * this.scale],
            [40 * this.scale, 2 * this.scale, -30 * this.scale],
            [-40 * this.scale, 2 * this.scale, 30 * this.scale],
            [40 * this.scale, 2 * this.scale, 30 * this.scale]
        ];

        positions.forEach((pos, i) => {
            const board = new THREE.Mesh(boardGeometry, boardMaterial);
            board.position.set(pos[0], pos[1], pos[2]);
            
            if (i < 2) {
                board.rotation.y = Math.PI / 2;
            }

            board.castShadow = true;
            board.receiveShadow = true;
            this.group.add(board);
        });
    }

    createStands() {
        const standMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.1,
            roughness: 0.6
        });

        // Back stand
        const backStandGeometry = new THREE.BoxGeometry(68 * this.scale, 25 * this.scale, 15 * this.scale);
        const backStand = new THREE.Mesh(backStandGeometry, standMaterial);
        backStand.position.set(0, 12.5 * this.scale, -65 * this.scale);
        backStand.castShadow = true;
        backStand.receiveShadow = true;
        this.group.add(backStand);

        // Front stand
        const frontStand = new THREE.Mesh(backStandGeometry, standMaterial);
        frontStand.position.set(0, 12.5 * this.scale, 65 * this.scale);
        frontStand.castShadow = true;
        frontStand.receiveShadow = true;
        this.group.add(frontStand);

        // Side stands
        const sideStandGeometry = new THREE.BoxGeometry(15 * this.scale, 25 * this.scale, 105 * this.scale);
        
        const leftStand = new THREE.Mesh(sideStandGeometry, standMaterial);
        leftStand.position.set(-42 * this.scale, 12.5 * this.scale, 0);
        leftStand.castShadow = true;
        leftStand.receiveShadow = true;
        this.group.add(leftStand);

        const rightStand = new THREE.Mesh(sideStandGeometry, standMaterial);
        rightStand.position.set(42 * this.scale, 12.5 * this.scale, 0);
        rightStand.castShadow = true;
        rightStand.receiveShadow = true;
        this.group.add(rightStand);
    }

    createFloodlights() {
        const polePositions = [
            [-35 * this.scale, 0, -55 * this.scale],
            [35 * this.scale, 0, -55 * this.scale],
            [-35 * this.scale, 0, 55 * this.scale],
            [35 * this.scale, 0, 55 * this.scale]
        ];

        polePositions.forEach(pos => {
            this.createFloodlight(pos[0], pos[1], pos[2]);
        });
    }

    createFloodlight(x, y, z) {
        // Pole
        const poleGeometry = new THREE.CylinderGeometry(0.6 * this.scale, 0.6 * this.scale, 35 * this.scale);
        const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(x, 17.5 * this.scale, z);
        pole.castShadow = true;
        pole.receiveShadow = true;
        this.group.add(pole);

        // Light fixture box
        const fixtureGeometry = new THREE.BoxGeometry(3 * this.scale, 3 * this.scale, 2 * this.scale);
        const fixtureMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
        fixture.position.set(x, 35 * this.scale, z);
        fixture.castShadow = true;
        fixture.receiveShadow = true;
        this.group.add(fixture);
    }

    createPenaltyAreas() {
        // Penalty area marking
        const penaltyMarkGeometry = new THREE.CircleGeometry(0.2 * this.scale, 16);
        const penaltyMarkMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

        const penaltyMark = new THREE.Mesh(penaltyMarkGeometry, penaltyMarkMaterial);
        penaltyMark.position.set(0, 0.01, -11 * this.scale);
        penaltyMark.rotation.x = -Math.PI / 2;
        this.group.add(penaltyMark);
    }

    getGoalNetMesh() {
        return this.goalNet;
    }

    dispose() {
        // Clean up resources
        this.group.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }
}
