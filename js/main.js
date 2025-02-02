import { SceneManager } from './scene.js';
import { ParticleSystem } from './particles.js';
import { TextManager } from './text.js';
import { ScrollAnimation } from './scroll-animation.js';

class App {
    constructor() {
        this.preloadResources();
    }

    async preloadResources() {
        try {
            // Initialize Three.js components in parallel
            await this.initThreeComponents();
            
            // Initialize the rest of the application
            this.init();
        } catch (error) {
            console.error('Error initializing application:', error);
        }
    }

    async initThreeComponents() {
        try {
            // Initialize core components first
            this.sceneManager = new SceneManager();
            this.particleSystem = new ParticleSystem(this.sceneManager.scene);
            
            // Initialize text manager and wait for font to load
            this.textManager = new TextManager(this.particleSystem);
            await this.textManager.loadFont();
            
            // Initialize scroll animation after text is ready
            this.scrollAnimation = new ScrollAnimation(this.textManager);
        } catch (error) {
            console.error('Error initializing Three.js components:', error);
            throw error;
        }
    }

    init() {
        // Start animation loop
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        if (this.particleSystem) {
            this.particleSystem.update();
        }
        if (this.sceneManager) {
            this.sceneManager.render();
        }
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
}); 