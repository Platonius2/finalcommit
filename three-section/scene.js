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
            antialias: window.devicePixelRatio < 2, // Only use antialias for lower pixel ratios
            alpha: true,
            premultipliedAlpha: false,
            stencil: false,
            depth: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: false
        });

        // Optimize pixel ratio for performance
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        this.renderer.setPixelRatio(pixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Optimize renderer settings
        this.renderer.toneMapping = THREE.NoToneMapping;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.autoClear = true;
        this.renderer.autoClearColor = true;
        this.renderer.autoClearDepth = true;
        this.renderer.info.autoReset = true; // Reset renderer stats automatically
        
        const container = document.querySelector('.canvas-container');
        container.appendChild(this.renderer.domElement);
        
        // Set canvas style for transparency
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.pointerEvents = 'none';
        this.renderer.domElement.style.mixBlendMode = 'screen';
        this.renderer.domElement.style.background = 'transparent';
        
        // Clear any background color on the container
        container.style.background = 'transparent';
        container.style.backgroundColor = 'transparent';
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = null;
        this.scene.fog = null;
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
        // Create optimized render target
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        const renderTargetOptions = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            encoding: THREE.sRGBEncoding,
            type: THREE.HalfFloatType, // More efficient than full float
            stencilBuffer: false,
            depthBuffer: true,
            samples: pixelRatio < 2 ? 4 : 0, // Use MSAA only for lower pixel ratios
            alpha: true,
            premultiplyAlpha: false
        };

        const renderTarget = new THREE.WebGLRenderTarget(
            window.innerWidth * pixelRatio, 
            window.innerHeight * pixelRatio,
            renderTargetOptions
        );

        this.composer = new EffectComposer(this.renderer, renderTarget);
        this.composer.renderToScreen = true;
        
        const renderPass = new RenderPass(this.scene, this.camera);
        renderPass.clear = true;
        renderPass.clearDepth = true;
        renderPass.clearAlpha = true;
        renderPass.clearColor = new THREE.Color(0x000000);
        renderPass.clearAlpha = 0;
        this.composer.addPass(renderPass);

        // Optimize bloom pass settings
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(
                window.innerWidth * pixelRatio,
                window.innerHeight * pixelRatio
            ),
            0.5,  // Bloom strength
            0.4,  // Radius
            0.85  // Threshold
        );

        bloomPass.threshold = 0.05;
        bloomPass.strength = 0.8;
        bloomPass.radius = 1.5;
        bloomPass.exposure = 0.6;
        bloomPass.clear = true;
        bloomPass.clearAlpha = true;
        bloomPass.renderToScreen = true;

        // Enable selective bloom for better performance
        bloomPass.selectedObjects = [];
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

        // Optimize resize handling
        const pixelRatio = Math.min(window.devicePixelRatio, 2);
        const width = window.innerWidth * pixelRatio;
        const height = window.innerHeight * pixelRatio;
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(width, height);
    }

    render() {
        // Clear with specific buffers
        this.renderer.clear(true, true, true);
        
        // Ensure scene is transparent
        this.scene.background = null;
        this.renderer.setClearColor(0x000000, 0);
        
        // Render with composer
        this.composer.render();
    }
} 