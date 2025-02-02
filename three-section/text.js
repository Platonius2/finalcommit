import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { config, getResponsiveConfig } from './config.js';

export class TextManager {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
        this.texts = [];
        this.triggers = document.querySelectorAll('.triggers span');
        this.currentFont = null;
        this.currentIndex = 0;
        this.initialMorphDone = false;
        this.currentConfig = config;
        this.loadFont();
        this.setupResizeHandler();
    }

    setupResizeHandler() {
        let resizeTimeout;
        let lastWidth = window.innerWidth;
        let lastHeight = window.innerHeight;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            const currentWidth = window.innerWidth;
            const currentHeight = window.innerHeight;
            
            const crossingBreakpoint = (currentWidth < 768 && lastWidth >= 768) || 
                                     (currentWidth >= 768 && lastWidth < 768);
            const significantSizeChange = 
                Math.abs(currentWidth - lastWidth) > 50 || 
                Math.abs(currentHeight - lastHeight) > 50;
                
            resizeTimeout = setTimeout(() => {
                if (crossingBreakpoint || significantSizeChange) {
                    // Update configuration with new dimensions
                    this.currentConfig = getResponsiveConfig();
                    
                    if (this.currentFont) {
                        Array.from(this.triggers).forEach((trigger, idx) => {
                            this.createText(trigger, idx, this.currentFont);
                        });
                        this.updateActiveText(this.currentIndex);
                    }
                }
                lastWidth = currentWidth;
                lastHeight = currentHeight;
            }, 250);
        });
    }

    loadFont() {
        const loader = new FontLoader();
        
        return new Promise((resolve, reject) => {
            loader.load(config.typeface, 
                (font) => {
                    console.log('Font loaded successfully');
                    this.currentFont = font;
                    
                    // Process texts after font is loaded
                    this.processTexts(font);
                    resolve(font);
                },
                undefined,
                (error) => {
                    console.error('Error loading font:', error);
                    reject(error);
                }
            );
        });
    }

    processTexts(font) {
        if (!font) return;
        
        // Create texts for all triggers
        Array.from(this.triggers).forEach((trigger, idx) => {
            this.createText(trigger, idx, font);
        });

        // Set initial state after all texts are created
        requestAnimationFrame(() => {
            if (this.texts[0] && this.texts[0].particles) {
                this.updateActiveText(0);
            }
        });
    }

    updateActiveText(index) {
        // Remove active class from all triggers
        Array.from(this.triggers).forEach(trigger => {
            trigger.classList.remove('active');
        });

        // Validate text and particles exist
        if (!this.texts[index]) {
            console.warn(`Text at index ${index} not found`);
            return;
        }

        if (!this.texts[index].particles || !this.texts[index].particles.attributes) {
            console.warn(`Particles for text at index ${index} not properly initialized`);
            return;
        }

        // Add active class to current trigger
        this.triggers[index].classList.add('active');
        
        // Morph to new text
        this.particleSystem.morphTo(
            this.texts[index].particles, 
            this.triggers[index].dataset.color || '#FFFFFF'
        );
    }

    createText(trigger, idx, font) {
        try {
            if (!font || !trigger) return;

            this.texts[idx] = {};
            
            // Use current config for text geometry
            const geometry = new TextGeometry(trigger.textContent, {
                font: font,
                size: this.currentConfig.textConfig.baseSize,
                depth: this.currentConfig.textConfig.depth,
                curveSegments: this.currentConfig.textConfig.curveSegments,
                bevelEnabled: this.currentConfig.textConfig.bevelEnabled,
                bevelThickness: this.currentConfig.textConfig.bevelThickness,
                bevelSize: this.currentConfig.textConfig.bevelSize,
                bevelOffset: this.currentConfig.textConfig.bevelOffset,
                bevelSegments: this.currentConfig.textConfig.bevelSegments
            });
            
            // Center and scale the geometry
            geometry.computeBoundingBox();
            const box = geometry.boundingBox;
            const centerOffset = new THREE.Vector3();
            box.getCenter(centerOffset);
            
            // Scale text to fit within max dimensions if needed
            const width = box.max.x - box.min.x;
            const height = box.max.y - box.min.y;
            const scaleX = this.currentConfig.textConfig.maxWidth / width;
            const scaleY = this.currentConfig.textConfig.maxHeight / height;
            const scale = Math.min(scaleX, scaleY, 1);
            
            geometry.translate(-centerOffset.x, -centerOffset.y, -centerOffset.z);
            if (scale < 1) {
                geometry.scale(scale, scale, 1);
            }
            
            this.texts[idx].geometry = geometry;
            this.texts[idx].particles = new THREE.BufferGeometry();
            
            const points = this.generateGridPoints(geometry);
            if (!points || points.length === 0) {
                console.warn(`No points generated for text: ${trigger.textContent}`);
                return;
            }

            const success = this.particleSystem.createVertices(this.texts[idx].particles, points);
            if (!success) {
                console.warn(`Failed to create vertices for text: ${trigger.textContent}`);
                return;
            }

            if (idx === 0 && !this.initialMorphDone) {
                this.particleSystem.morphTo(this.texts[idx].particles, trigger.dataset.color || '#FFFFFF');
                this.initialMorphDone = true;
            }
            
        } catch (error) {
            console.error('Error in createText:', error);
        }
    }

    generateGridPoints(geometry) {
        const points = [];
        const box = geometry.boundingBox;
        const width = box.max.x - box.min.x;
        const height = box.max.y - box.min.y;

        // Calculate grid dimensions with higher density and proper spacing
        const aspectRatio = width / height;
        const baseGridSize = Math.sqrt(this.currentConfig.particleCount);
        const particlesPerRow = Math.ceil(baseGridSize * Math.sqrt(aspectRatio));
        const particlesPerCol = Math.ceil(baseGridSize / Math.sqrt(aspectRatio));
        
        const stepX = Math.max(width / (particlesPerRow - 1), this.currentConfig.particleSpacing);
        const stepY = Math.max(height / (particlesPerCol - 1), this.currentConfig.particleSpacing);

        // Raycaster setup
        const raycaster = new THREE.Raycaster();
        const direction = new THREE.Vector3(0, 0, 1);
        const origin = new THREE.Vector3();
        const material = new THREE.MeshBasicMaterial();
        const mesh = new THREE.Mesh(geometry, material);

        // Sample points with proper spacing
        for (let i = 0; i < particlesPerRow && points.length < this.currentConfig.particleCount; i++) {
            for (let j = 0; j < particlesPerCol && points.length < this.currentConfig.particleCount; j++) {
                const x = box.min.x + (i * stepX);
                const y = box.min.y + (j * stepY);
                origin.set(x, y, -10);
                raycaster.set(origin, direction);
                
                const intersects = raycaster.intersectObject(mesh);
                if (intersects.length > 0) {
                    points.push(new THREE.Vector3(x, y, 0));
                }
            }
        }

        material.dispose();
        return points;
    }
} 