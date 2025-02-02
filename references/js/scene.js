import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { config } from './config.js';

export class SceneManager {
    constructor() {
        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
        this.setupLighting();
        this.setupPostProcessing();
        this.setupResizeHandler();
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            premultipliedAlpha: false
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.NoToneMapping;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.setClearColor(0x000000, 0);
        document.querySelector('.three-section').appendChild(this.renderer.domElement);
    }

    setupScene() {
        this.scene = new THREE.Scene();
    }

    setupCamera() {
        const aspectRatio = window.innerWidth / window.innerHeight;
        const baseFOV = 45;
        const fov = aspectRatio < 1 ? baseFOV * 1.5 : baseFOV;
        const near = 1;
        const far = 10000;
        
        this.camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far);
        
        const baseDistance = Math.max(
            100,
            (window.innerHeight / 2) * (aspectRatio < 1 ? 1.2 : 1)
        );
        this.camera.position.z = baseDistance;
        
        this.camera.lookAt(this.scene.position);
    }

    setupLighting() {
        const light = new THREE.AmbientLight(0xFFFFFF, 1);
        this.scene.add(light);
    }

    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.2,
            0.35,
            0.15
        );

        bloomPass.threshold = 0.12;
        bloomPass.strength = 1.4;
        bloomPass.radius = 0.75;
        bloomPass.exposure = 0.9;

        this.composer.addPass(bloomPass);
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => this.handleResize(), false);
    }

    handleResize() {
        const aspectRatio = window.innerWidth / window.innerHeight;
        const baseFOV = 45;
        
        this.camera.fov = aspectRatio < 1 ? baseFOV * 1.5 : baseFOV;
        this.camera.aspect = aspectRatio;
        
        const baseDistance = Math.max(
            100,
            (window.innerHeight / 2) * (aspectRatio < 1 ? 1.2 : 1)
        );
        this.camera.position.z = baseDistance;
        
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        this.composer.render();
    }
} 