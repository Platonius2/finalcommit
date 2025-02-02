import { SceneManager } from './scene.js';
import { ParticleSystem } from './particles.js';
import { TextManager } from './text.js';
import { ScrollAnimation } from './scroll-animation.js';
import { animationVars } from './config.js';

class App {
    constructor() {
        this.preloadResources();
    }

    async preloadResources() {
        // Show loading indicator if needed
        const loadingPromises = [];

        // Initialize Three.js components in parallel
        loadingPromises.push(this.initThreeComponents());

        // Wait for all resources to load
        await Promise.all(loadingPromises);
        
        // Initialize the rest of the application
        this.init();
    }

    async initThreeComponents() {
        // Initialize core components first
        this.sceneManager = new SceneManager();
        this.particleSystem = new ParticleSystem(this.sceneManager.scene);
        
        // Initialize text manager last (it depends on the particle system)
        this.textManager = new TextManager(this.particleSystem);
        
        // Initialize scroll animation
        this.scrollAnimation = new ScrollAnimation(this.textManager);
    }

    init() {
        // Start animation loop
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.particleSystem.update();
        this.sceneManager.render();
    }
}

// Initialize the application
new App(); 