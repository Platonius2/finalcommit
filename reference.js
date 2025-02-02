import { config, getResponsiveConfig, animationVars } from './config.js';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = new THREE.BufferGeometry();
        this.positions = new Float32Array(config.particleCount * 3);
        this.scales = new Float32Array(config.particleCount);
        this.setupParticles();
        this.setupResizeHandler();
    }

    setupParticles() {
        // Initialize all particles at origin with zero scale
        for (let i = 0; i < config.particleCount; i++) {
            const i3 = i * 3;
            this.positions[i3] = 0;     // x
            this.positions[i3 + 1] = 0; // y
            this.positions[i3 + 2] = 0; // z
            this.scales[i] = 0;         // start invisible
        }

        this.particles.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        this.particles.setAttribute('scale', new THREE.BufferAttribute(this.scales, 1));

        // Create shader material for scale support
        const pMaterial = new THREE.ShaderMaterial({
            uniforms: {
                size: { value: config.particleSize },
                color: { value: new THREE.Color(0xFFFFFF) },
                opacity: { value: 1.0 }
            },
            vertexShader: `
                attribute float scale;
                uniform float size;
                
                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * scale * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float opacity;
                
                void main() {
                    // Calculate distance from center of point
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    // Discard pixels outside circle
                    if (dist > 0.5) {
                        discard;
                    }
                    
                    // Create three-layered effect: core, inner glow, and outer glow
                    float core = 1.0 - smoothstep(0.0, 0.15, dist);
                    float innerGlow = 1.0 - smoothstep(0.15, 0.35, dist);
                    float outerGlow = 1.0 - smoothstep(0.35, 0.5, dist);
                    
                    // Combine layers with different intensities
                    float intensity = core * 1.0 + innerGlow * 0.5 + outerGlow * 0.2;
                    intensity = pow(intensity, 1.5); // Slightly sharper falloff
                    
                    // Add subtle variation to prevent banding
                    float noise = fract(sin(dot(gl_PointCoord, vec2(12.9898, 78.233))) * 43758.5453);
                    intensity += noise * 0.015 - 0.0075;
                    
                    // Create a brighter core
                    vec3 finalColor = color * (1.0 + core * 0.5); // Boost core brightness
                    
                    // Output color with enhanced definition
                    gl_FragColor = vec4(finalColor, opacity * intensity);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: true
        });

        this.system = new THREE.Points(this.particles, pMaterial);
        this.system.sortParticles = false;
        this.scene.add(this.system);
    }

    createVertices(emptyArray, points) {
        if (!points || points.length === 0) return null;
        
        const positions = new Float32Array(config.particleCount * 3);
        const scales = new Float32Array(config.particleCount);
        
        for (let i = 0; i < config.particleCount && i < points.length; i++) {
            const i3 = i * 3;
            if (points[i]) {
                positions[i3] = points[i].x || 0;
                positions[i3 + 1] = points[i].y || 0;
                positions[i3 + 2] = points[i].z || 0;
                scales[i] = 1;  // visible when positioned
            }
        }
        
        emptyArray.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        emptyArray.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
        return true;
    }

    morphTo(newParticles, color = '#FFFFFF') {
        if (!newParticles || !newParticles.attributes || !newParticles.attributes.position || !newParticles.attributes.scale) return;
        
        // Speed up rotation during morph
        TweenMax.to(animationVars, 0.1, {
            ease: Power4.easeIn,
            speed: config.morphAnimationSpeed / 100,
            onComplete: () => this.slowDown()
        });

        // Change color
        TweenMax.to(animationVars, 1, {
            ease: Linear.easeNone,
            color: color
        });

        // Morph particles with scale and curved animation
        const positions = this.particles.attributes.position.array;
        const scales = this.particles.attributes.scale.array;
        const newPositions = newParticles.attributes.position.array;
        const newScales = newParticles.attributes.scale.array;
        
        for (let i = 0; i < positions.length / 3; i++) {
            const i3 = i * 3;
            const currentVertex = {
                x: positions[i3],
                y: positions[i3 + 1],
                z: positions[i3 + 2],
                scale: scales[i]
            };

            const targetVertex = {
                x: newPositions[i3],
                y: newPositions[i3 + 1],
                z: newPositions[i3 + 2],
                scale: newScales[i]
            };

            // Calculate radius for circular movement based on distance
            const dx = targetVertex.x - currentVertex.x;
            const dy = targetVertex.y - currentVertex.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const radius = distance * 0.8;

            // Random timing for each particle
            const delay = Math.random() * 0.2;
            const duration = 1.0 + Math.random() * 0.25;

            // Create timeline for curved movement
            const timeline = new TimelineMax();
            
            // Store original values for bezier calculation
            const startX = currentVertex.x;
            const startY = currentVertex.y;
            const startZ = currentVertex.z;

            timeline.to(currentVertex, duration, {
                ease: Power1.easeInOut,
                scale: targetVertex.scale,
                delay: delay,
                bezier: {
                    type: "thru",
                    curviness: 1,
                    values: [
                        { x: startX, y: startY, z: startZ },
                        { 
                            x: startX + (dx * 0.25) + (Math.random() - 0.5) * (radius * 0.2),
                            y: startY + (dy * 0.25) + Math.sin(Math.PI * 0.25) * radius,
                            z: startZ + Math.cos(Math.PI * 0.25) * (radius * 0.5)
                        },
                        { 
                            x: startX + (dx * 0.5) + (Math.random() - 0.5) * (radius * 0.2),
                            y: startY + (dy * 0.5) + Math.sin(Math.PI * 0.5) * radius,
                            z: startZ + Math.cos(Math.PI * 0.5) * (radius * 0.5)
                        },
                        { 
                            x: startX + (dx * 0.75) + (Math.random() - 0.5) * (radius * 0.2),
                            y: startY + (dy * 0.75) + Math.sin(Math.PI * 0.75) * radius,
                            z: startZ + Math.cos(Math.PI * 0.75) * (radius * 0.5)
                        },
                        { x: targetVertex.x, y: targetVertex.y, z: targetVertex.z }
                    ]
                },
                onUpdate: () => {
                    positions[i3] = currentVertex.x;
                    positions[i3 + 1] = currentVertex.y;
                    positions[i3 + 2] = currentVertex.z;
                    scales[i] = currentVertex.scale;
                    this.particles.attributes.position.needsUpdate = true;
                    this.particles.attributes.scale.needsUpdate = true;
                }
            });
        }

        // Camera rotation
        TweenMax.to(animationVars, 1, {
            ease: Power1.easeInOut,
            rotation: animationVars.rotation === 45 ? -45 : 45
        });
    }

    slowDown() {
        TweenMax.to(animationVars, 0.3, {
            ease: Power2.easeOut,
            speed: config.defaultAnimationSpeed / 100,
            delay: 0.2
        });
    }

    update() {
        if (this.system && this.system.material) {
            this.system.material.uniforms.color.value.set(animationVars.color);
        }
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            const newConfig = getResponsiveConfig();
            if (this.system && this.system.material) {
                this.system.material.uniforms.size.value = newConfig.particleSize;
            }
        });
    }
} 