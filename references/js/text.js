import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { config, getResponsiveConfig } from './config.js';

export class TextManager {
    constructor(particleSystem) {
        this.particleSystem = particleSystem;
        this.texts = [];
        this.triggers = document.getElementsByTagName('span');
        this.currentFont = null;
        this.currentIndex = 0;
        this.loadFont();
        this.setupResizeHandler();
    }

    setupResizeHandler() {
        let resizeTimeout;
        let lastWidth = window.innerWidth;
        
        window.addEventListener('resize', () => {
            // Debounce resize event
            clearTimeout(resizeTimeout);
            const currentWidth = window.innerWidth;
            const crossingBreakpoint = (currentWidth < 768 && lastWidth >= 768) || 
                                     (currentWidth >= 768 && lastWidth < 768);
            resizeTimeout = setTimeout(() => {
                // Only recreate text if crossing breakpoint or significant size change
                if (crossingBreakpoint || Math.abs(currentWidth - lastWidth) > 50) {
                    if (this.currentFont) {
                        Array.from(this.triggers).forEach((trigger, idx) => {
                            this.createText(trigger, idx, this.currentFont);
                        });
                        // Update current text
                        this.updateActiveText(this.currentIndex);
                    }
                }
                lastWidth = currentWidth;
            }, 250); // Wait for resize to finish
        });
    }

    loadFont() {
        const loader = new FontLoader();
        
        loader.load(config.typeface, 
            (font) => {
                console.log('Font loaded successfully');
                this.currentFont = font;
                
                requestAnimationFrame(() => {
                    Array.from(this.triggers).forEach((trigger, idx) => {
                        this.createText(trigger, idx, font);
                    });
                    // Set initial state
                    this.updateActiveText(0);
                });
            },
            undefined,
            (error) => {
                console.error('Error loading font:', error);
            }
        );
    }

    updateActiveText(index) {
        // Remove active class from all triggers
        Array.from(this.triggers).forEach(trigger => {
            trigger.classList.remove('active');
        });
        
        // Add active class to current trigger
        this.triggers[index].classList.add('active');
        
        // Morph to new text
        if (this.texts[index] && this.texts[index].particles) {
            this.particleSystem.morphTo(this.texts[index].particles, this.triggers[index].dataset.color);
        }
    }

    processTexts(font) {
        requestAnimationFrame(() => {
            Array.from(this.triggers).forEach((trigger, idx) => {
                this.createText(trigger, idx, font);
            });
        });
    }

    createText(trigger, idx, font) {
        try {
            if (!font) return;

            this.texts[idx] = {};
            
            // Get current responsive configuration
            const responsiveConfig = getResponsiveConfig();
            const { textConfig } = responsiveConfig;
            
            // Create geometry with optimized settings
            const geometry = new TextGeometry(trigger.textContent, {
                font: font,
                size: textConfig.baseSize,
                height: 0,
                curveSegments: 4,
                bevelEnabled: false
            });
            
            // Center the geometry
            geometry.computeBoundingBox();
            const box = geometry.boundingBox;
            const centerOffset = new THREE.Vector3();
            box.getCenter(centerOffset);
            geometry.translate(-centerOffset.x, -centerOffset.y, -centerOffset.z);
            
            this.texts[idx].geometry = geometry;
            this.texts[idx].particles = new THREE.BufferGeometry();
            
            // Generate points asynchronously
            requestAnimationFrame(() => {
                const points = this.generateGridPoints(geometry);
                if (points && points.length > 0) {
                    this.particleSystem.createVertices(this.texts[idx].particles, points);
                    this.enableTrigger(trigger, idx);
                }
            });
            
        } catch (error) {
            console.error('Error in createText:', error);
        }
    }

    generateGridPoints(geometry) {
        const points = [];
        const box = geometry.boundingBox;
        const width = box.max.x - box.min.x;
        const height = box.max.y - box.min.y;

        // Calculate grid dimensions with higher density
        const aspectRatio = width / height;
        const baseGridSize = Math.sqrt(config.particleCount);
        const particlesPerRow = Math.ceil(baseGridSize * Math.sqrt(aspectRatio) * 1.2);
        const particlesPerCol = Math.ceil(baseGridSize / Math.sqrt(aspectRatio) * 1.2);
        
        const stepX = width / (particlesPerRow - 1);
        const stepY = height / (particlesPerCol - 1);

        // Optimize raycasting by using a single reusable vector
        const raycaster = new THREE.Raycaster();
        const direction = new THREE.Vector3(0, 0, 1);
        const origin = new THREE.Vector3();
        
        // Convert BufferGeometry to Mesh for raycasting
        const tempGeometry = geometry.clone();
        const material = new THREE.MeshBasicMaterial();
        const mesh = new THREE.Mesh(tempGeometry, material);

        // Pre-calculate grid positions for better performance
        const gridPositions = [];
        for (let i = 0; i < particlesPerRow; i++) {
            for (let j = 0; j < particlesPerCol; j++) {
                const x = box.min.x + (i * stepX);
                const y = box.min.y + (j * stepY);
                gridPositions.push([x, y]);
            }
        }

        // Shuffle grid positions for better distribution
        for (let i = gridPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gridPositions[i], gridPositions[j]] = [gridPositions[j], gridPositions[i]];
        }

        // Generate points using shuffled positions
        let totalPoints = 0;
        for (const [x, y] of gridPositions) {
            if (totalPoints >= config.particleCount) break;

            origin.set(x, y, -1);
            raycaster.set(origin, direction);
            const intersects = raycaster.intersectObject(mesh);

            if (intersects.length > 0) {
                points.push(new THREE.Vector3(x, y, 0));
                totalPoints++;
            }
        }

        // Cleanup
        material.dispose();
        tempGeometry.dispose();

        return points;
    }

    enableTrigger(trigger, idx) {
        if (!this.texts[idx] || !this.texts[idx].particles) return;
        
        if (idx === 0) {
            this.particleSystem.morphTo(this.texts[idx].particles, trigger.dataset.color);
        }
    }
} 