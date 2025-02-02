import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SceneManager } from './scene.js';
import { ParticleSystem } from './particles.js';
import { TextManager } from './text.js';

export class ThreeSection {
    constructor() {
        this.sceneManager = null;
        this.particleSystem = null;
        this.textManager = null;
        this.animationFrame = null;
        this.clock = new THREE.Clock();
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        // Setup scene manager
        this.sceneManager = new SceneManager();
        
        // Setup particle system
        this.particleSystem = new ParticleSystem(this.sceneManager.scene);
        
        // Initialize text manager
        this.textManager = new TextManager(this.particleSystem);

        // Setup scroll handling
        this.setupScrollHandling();

        this.isInitialized = true;
        this.animate();
    }

    setupScrollHandling() {
        let isScrolling = false;
        let scrollTimeout;

        window.addEventListener('wheel', (e) => {
            if (!isScrolling) {
                isScrolling = true;
                if (e.deltaY > 0) {
                    this.textManager.updateActiveText((this.textManager.currentIndex + 1) % this.textManager.texts.length);
                } else {
                    this.textManager.updateActiveText((this.textManager.currentIndex - 1 + this.textManager.texts.length) % this.textManager.texts.length);
                }

                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    isScrolling = false;
                }, 1000);

                e.preventDefault();
            }
        }, { passive: false });

        // Handle touch events
        let touchStartY = 0;
        window.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            const touchEndY = e.touches[0].clientY;
            const deltaY = touchEndY - touchStartY;

            if (Math.abs(deltaY) > 50) {
                if (deltaY < 0) {
                    this.textManager.updateActiveText((this.textManager.currentIndex + 1) % this.textManager.texts.length);
                } else {
                    this.textManager.updateActiveText((this.textManager.currentIndex - 1 + this.textManager.texts.length) % this.textManager.texts.length);
                }
                touchStartY = touchEndY;
            }

            e.preventDefault();
        }, { passive: false });
    }

    animate() {
        const delta = this.clock.getElapsedTime();

        // Update particle system
        if (this.particleSystem) {
            this.particleSystem.update();
        }

        // Render scene with post-processing
        if (this.sceneManager) {
            this.sceneManager.render();
        }

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    dispose() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        if (this.particleSystem) {
            // Particle system cleanup will be handled by scene disposal
            this.particleSystem = null;
        }

        if (this.sceneManager) {
            this.sceneManager.renderer.dispose();
            this.sceneManager.composer.dispose();
            this.sceneManager = null;
        }
    }
} 