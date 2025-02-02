import { config, animationVars } from './config.js';

export class GUI {
    constructor(particleSystem, textManager) {
        this.gui = new dat.GUI();
        this.particleSystem = particleSystem;
        this.textManager = textManager;
        
        // Particle appearance
        const particleFolder = this.gui.addFolder('Particle Appearance');
        particleFolder.add(config, 'particleSize', 0.1, 2.0).onChange(() => {
            this.particleSystem.system.material.size = config.particleSize;
        });
        particleFolder.addColor(animationVars, 'color').onChange(() => {
            this.particleSystem.system.material.color.set(animationVars.color);
        });
        particleFolder.add(this.particleSystem.system.material, 'opacity', 0, 1);
        
        // Grid controls
        const gridFolder = this.gui.addFolder('Grid Settings');
        this.gridControls = {
            gridDensity: Math.sqrt(config.particleCount),
            spacing: 1.0,
            refreshGrid: () => {
                config.particleCount = Math.pow(this.gridControls.gridDensity, 2);
                Array.from(this.textManager.triggers).forEach((trigger, idx) => {
                    this.textManager.createText(trigger, idx, this.textManager.currentFont);
                });
            }
        };
        
        gridFolder.add(this.gridControls, 'gridDensity', 10, 100, 1).onChange(() => {
            this.gridControls.refreshGrid();
        });
        gridFolder.add(this.gridControls, 'spacing', 0.5, 2).onChange(() => {
            this.gridControls.refreshGrid();
        });
        
        // Animation controls
        const animationFolder = this.gui.addFolder('Animation');
        this.animationControls = {
            transitionSpeed: 2.0,
            elasticity: 0.1,
            damping: 0.3
        };
        
        animationFolder.add(this.animationControls, 'transitionSpeed', 0.5, 5);
        animationFolder.add(this.animationControls, 'elasticity', 0.01, 1);
        animationFolder.add(this.animationControls, 'damping', 0.1, 1);
        
        // Open folders by default
        particleFolder.open();
        gridFolder.open();
        animationFolder.open();
    }
} 