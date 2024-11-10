// interaction.js
import * as THREE from "three";

export class Interaction {
    constructor(scene) {
        this.scene = scene;
        this.colliders = [];
        this.paintings = [];
        this.artworkUrls = [
            "/assets/images/artwork1.jpg",
            "/assets/images/artwork2.jpg",
            "/assets/images/artwork3.jpg",
            "/assets/images/artwork4.jpg",
            "/assets/images/artwork5.jpg",
        ];

        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener("resize", () => this.handleResize());
        window.addEventListener("click", (e) => this.handlePaintingClick(e));
        document.addEventListener("keydown", (e) => {
            if (e.code === "KeyR") this.randomizeAllPaintings();
        });
    }

    handleResize() {
        this.scene.camera.aspect = window.innerWidth / window.innerHeight;
        this.scene.camera.updateProjectionMatrix();
        this.scene.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    handlePaintingClick(event) {
        if (!this.scene.controls.controls.isLocked) return;

        const raycaster = new THREE.Raycaster();
        const center = new THREE.Vector2(0, 0);

        raycaster.setFromCamera(center, this.scene.camera);
        const intersects = raycaster.intersectObjects(this.paintings, true);

        if (intersects.length > 0) {
            const clickedPainting = intersects[0].object.parent;
            this.updatePaintingTexture(
                clickedPainting,
                this.getRandomArtworkUrl()
            );
        }
    }

    loadModel(url, position, scale, rotation = new THREE.Euler(0, 0, 0)) {
        this.scene.loader.load(
            url,
            (gltf) => {
                const model = gltf.scene;
                model.position.copy(position);
                model.scale.copy(scale);
                model.rotation.copy(rotation);

                model.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;

                        if (url.includes("museum")) {
                            this.addCollider(node);
                        }

                        if (url.includes("painting")) {
                            node.material = new THREE.MeshStandardMaterial({
                                name: "PaintingMaterial",
                                metalness: 0,
                                roughness: 0.5,
                            });
                            this.updatePaintingTexture(
                                model,
                                this.getRandomArtworkUrl()
                            );
                            this.addCollider(node);
                        }
                    }
                });

                this.scene.scene.add(model);
                if (url.includes("painting")) {
                    this.paintings.push(model);
                }
            },
            undefined,
            (error) => console.error("Model loading error:", error)
        );
    }

    updatePaintingTexture(paintingModel, imageUrl) {
        const fallbackTextureUrl = "/assets/images/fallback.jpg";

        this.scene.textureLoader.load(
            imageUrl,
            (texture) => this.applyTextureToModel(paintingModel, texture),
            undefined,
            (error) => {
                console.warn(
                    `Failed to load texture ${imageUrl}, trying fallback...`,
                    error
                );
                this.scene.textureLoader.load(
                    fallbackTextureUrl,
                    (fallbackTexture) =>
                        this.applyTextureToModel(
                            paintingModel,
                            fallbackTexture
                        ),
                    undefined,
                    (fallbackError) =>
                        console.error(
                            "Failed to load fallback texture:",
                            fallbackError
                        )
                );
            }
        );
    }

    applyTextureToModel(paintingModel, texture) {
        paintingModel.traverse((node) => {
            if (node.isMesh && node.material.name === "PaintingMaterial") {
                texture.encoding = THREE.sRGBEncoding;
                texture.flipY = false;

                const oldMaterial = node.material;
                const newMaterial = oldMaterial.clone();
                newMaterial.map = texture;
                newMaterial.transparent = true;
                newMaterial.opacity = 0;

                node.material = newMaterial;
                this.fadeInTexture(node.material);
            }
        });
    }
    fadeInTexture(material) {
        const fadeAnimation = {
            opacity: 0,
            duration: 500,
            startTime: performance.now(),
        };

        const animate = (currentTime) => {
            const elapsed = currentTime - fadeAnimation.startTime;
            const progress = Math.min(elapsed / fadeAnimation.duration, 1);

            material.opacity = progress;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                material.transparent = false;
            }
        };

        requestAnimationFrame(animate);
    }

    getRandomArtworkUrl() {
        return this.artworkUrls[
            Math.floor(Math.random() * this.artworkUrls.length)
        ];
    }

    addCollider(mesh) {
        const bbox = new THREE.Box3().setFromObject(mesh);
        this.colliders.push({
            mesh: mesh,
            bbox: bbox,
        });
    }

    checkCollision(position, direction) {
        const raycaster = new THREE.Raycaster(position, direction.normalize());

        const playerBBox = new THREE.Box3().setFromCenterAndSize(
            position,
            new THREE.Vector3(
                this.scene.controls.playerRadius * 2,
                this.scene.controls.playerHeight,
                this.scene.controls.playerRadius * 2
            )
        );

        for (const collider of this.colliders) {
            collider.bbox.setFromObject(collider.mesh);

            if (playerBBox.intersectsBox(collider.bbox)) {
                return true;
            }

            const intersects = raycaster.intersectObject(collider.mesh, true);
            if (
                intersects.length > 0 &&
                intersects[0].distance < this.scene.controls.playerRadius
            ) {
                return true;
            }
        }
        return false;
    }

    randomizeAllPaintings() {
        this.paintings.forEach((painting) => {
            this.updatePaintingTexture(painting, this.getRandomArtworkUrl());
        });
    }

    dispose() {
        window.removeEventListener("resize", () => this.handleResize());
        window.removeEventListener("click", (e) => this.handlePaintingClick(e));

        // Clear arrays
        this.colliders = [];
        this.paintings = [];
    }
}
