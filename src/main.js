import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Controls } from "./controls.js";
import { Interaction } from "./interaction.js";

class MuseumScene {
    constructor() {
        // Create necessary DOM elements
        this.createDOMElements();

        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            100000
        );

        // Core components
        this.renderer = this.setupRenderer();
        this.paintings = [];
        this.clock = new THREE.Clock();

        // Initialize systems
        this.setupLoadingManager();
        this.setupLighting();

        // Initialize controls and interaction
        this.controls = new Controls(this.camera, this.renderer);
        this.interaction = new Interaction(this);

        // Initialize scene
        this.init();
    }

    createDOMElements() {
        // Loading screen
        this.loadingScreen = document.createElement("div");
        this.loadingScreen.style.position = "absolute";
        this.loadingScreen.style.top = "50%";
        this.loadingScreen.style.width = "100%";
        this.loadingScreen.style.textAlign = "center";
        this.loadingScreen.style.color = "#ffffff";
        this.loadingScreen.style.fontFamily = "Arial, sans-serif";
        this.loadingScreen.textContent = "Loading...";
        document.body.appendChild(this.loadingScreen);

        // Instructions
        this.instructions = document.createElement("div");
        this.instructions.style.position = "absolute";
        this.instructions.style.top = "10px";
        this.instructions.style.width = "100%";
        this.instructions.style.textAlign = "center";
        this.instructions.style.color = "#ffffff";
        this.instructions.style.fontFamily = "Arial, sans-serif";
        this.instructions.style.fontSize = "14px";
        this.instructions.innerHTML = `
            Click to start<br>
            WASD to move<br>
            Mouse to look<br>
            Shift to run<br>
            R to randomize paintings<br>
            Click on paintings to change them
        `;
        document.body.appendChild(this.instructions);

        // Set body styles
        document.body.style.margin = "0";
        document.body.style.padding = "0";
        document.body.style.overflow = "hidden";
        document.body.style.backgroundColor = "#000";
    }

    setupRenderer() {
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.5;
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    setupLoadingManager() {
        this.loadingManager = new THREE.LoadingManager();
        this.loader = new GLTFLoader(this.loadingManager);
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);

        this.loadingManager.onProgress = (url, loaded, total) => {
            const progress = (loaded / total) * 100;
            this.loadingScreen.textContent = `Loading: ${Math.round(
                progress
            )}%`;
            if (progress === 100) {
                setTimeout(() => {
                    this.loadingScreen.style.display = "none";
                }, 1000);
            }
        };
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.5, 50);
        this.camera.add(pointLight);
        pointLight.position.set(0, 0, 1);
        this.scene.add(this.camera);
    }

    init() {
        this.scene.fog = new THREE.Fog(0x000000, 1, 1000);

        // Load museum
        this.interaction.loadModel(
            "./assets/models/museum.glb",
            new THREE.Vector3(0, 0, -5),
            new THREE.Vector3(1, 1, 1)
        );

        // Load paintings
        const paintingPositions = [
            {
                pos: new THREE.Vector3(-80, 70, -7),
                rot: new THREE.Euler(0, 0, 0),
            },
            {
                pos: new THREE.Vector3(50, 70, 70),
                rot: new THREE.Euler(0, -Math.PI / 2, 0),
            },
            {
                pos: new THREE.Vector3(-80, 70, -169),
                rot: new THREE.Euler(0, 0, 0),
            },
            {
                pos: new THREE.Vector3(-80, 70, -20),
                rot: new THREE.Euler(0, Math.PI, 0),
            },
        ];

        paintingPositions.forEach(({ pos, rot }) => {
            this.interaction.loadModel(
                "./assets/models/painting.glb",
                pos,
                new THREE.Vector3(7, 7, 7),
                rot
            );
        });
    }

    animate() {
        this.controls.update(this.clock.getDelta());
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.animate());
    }

    dispose() {
        this.controls.dispose();
        this.interaction.dispose();

        // Clean up Three.js objects
        this.scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (object.material.map) object.material.map.dispose();
                object.material.dispose();
            }
        });

        this.renderer.dispose();

        // Clean up DOM elements
        [
            this.loadingScreen,
            this.instructions,
            this.renderer.domElement,
        ].forEach((element) => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
    }
}

const museumScene = new MuseumScene();
museumScene.animate();
