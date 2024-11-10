import * as THREE from "three";
import { PointerLockControls } from "three-stdlib";

export class Controls {
    constructor(camera, renderer) {
        this.camera = camera;
        this.controls = new PointerLockControls(camera, renderer.domElement);

        // Movement state
        this.moveSpeed = 1.0;
        this.velocity = new THREE.Vector3();
        this.onGround = false;
        this.playerHeight = 65;
        this.playerRadius = 10;

        this.movementKeys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            shift: false,
        };

        this.setupEventListeners();
        this.camera.position.set(0, this.playerHeight, 50);
    }

    setupEventListeners() {
        document.addEventListener("click", () => this.controls.lock());
        document.addEventListener("keydown", (e) => this.handleKeyDown(e));
        document.addEventListener("keyup", (e) => this.handleKeyUp(e));

        this.controls.addEventListener("lock", () => {
            document.querySelector("div").style.display = "none";
        });

        this.controls.addEventListener("unlock", () => {
            document.querySelector("div").style.display = "block";
        });
    }

    handleKeyDown(event) {
        switch (event.code) {
            case "KeyW":
                this.movementKeys.forward = true;
                break;
            case "KeyS":
                this.movementKeys.backward = true;
                break;
            case "KeyA":
                this.movementKeys.left = true;
                break;
            case "KeyD":
                this.movementKeys.right = true;
                break;
            case "ShiftLeft":
                this.movementKeys.shift = true;
                break;
        }
    }

    handleKeyUp(event) {
        switch (event.code) {
            case "KeyW":
                this.movementKeys.forward = false;
                break;
            case "KeyS":
                this.movementKeys.backward = false;
                break;
            case "KeyA":
                this.movementKeys.left = false;
                break;
            case "KeyD":
                this.movementKeys.right = false;
                break;
            case "ShiftLeft":
                this.movementKeys.shift = false;
                break;
        }
    }

    update(delta) {
        if (this.controls.isLocked) {
            const actualMoveSpeed = this.movementKeys.shift
                ? this.moveSpeed * 2
                : this.moveSpeed;
            const currentPosition = this.camera.position.clone();

            // Create movement vector
            const moveVector = new THREE.Vector3();
            const forward = new THREE.Vector3();
            this.camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();

            const right = new THREE.Vector3(-forward.z, 0, forward.x);

            if (this.movementKeys.forward)
                moveVector.add(
                    forward.multiplyScalar(actualMoveSpeed * delta * 100)
                );
            if (this.movementKeys.backward)
                moveVector.sub(
                    forward.multiplyScalar(actualMoveSpeed * delta * 100)
                );
            if (this.movementKeys.left)
                moveVector.sub(
                    right.multiplyScalar(actualMoveSpeed * delta * 100)
                );
            if (this.movementKeys.right)
                moveVector.add(
                    right.multiplyScalar(actualMoveSpeed * delta * 100)
                );

            // Apply movement
            this.camera.position.add(moveVector);
        }
    }

    dispose() {
        document.removeEventListener("click", () => this.controls.lock());
        document.removeEventListener("keydown", (e) => this.handleKeyDown(e));
        document.removeEventListener("keyup", (e) => this.handleKeyUp(e));
        this.controls.dispose();
    }
}
