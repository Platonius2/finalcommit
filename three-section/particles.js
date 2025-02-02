import * as THREE from 'three';
import { config, getResponsiveConfig, animationVars } from './config.js';

// Check if GSAP plugins are available
const hasBezierPlugin = gsap && gsap.plugins && gsap.plugins.BezierPlugin;
const hasGSAPCore = typeof gsap !== 'undefined';

if (hasGSAPCore && !hasBezierPlugin) {
    console.warn('GSAP BezierPlugin not found. Using fallback animation.');
}

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
                opacity: { value: 0.8 }
            },
            vertexShader: `
                attribute float scale;
                uniform float size;
                
                void main() {
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * scale * (2000.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float opacity;
                
                float gaussian(float x, float sigma) {
                    return exp(-(x * x) / (2.0 * sigma * sigma));
                }
                
                void main() {
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    if (dist > 0.5) {
                        discard;
                    }
                    
                    // Natural light falloff using inverse square law with gaussian smoothing
                    float sigma = 0.15;  // Controls the width of the gaussian
                    float coreSize = 0.06;  // Smaller core for more intensity
                    
                    // Brighter core with sharper edge
                    float core = gaussian(dist / coreSize, 0.25) * 1.2;
                    
                    // Enhanced glow with better falloff
                    float glow = gaussian(dist, sigma) * 0.4 / (1.0 + dist * 6.0);
                    
                    // Intensified blend
                    float intensity = core + glow * (1.0 - core * 0.3);
                    
                    // Enhanced alpha for better visibility
                    float alpha = intensity * opacity * (1.0 - pow(dist * 1.6, 2.0));
                    if (alpha < 0.001) discard;
                    
                    // Increased color brightness
                    vec3 finalColor = color * (1.0 + core * 0.8 + glow * 0.2);
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            blendEquation: THREE.AddEquation,
            blendSrc: THREE.SrcAlphaFactor,
            blendDst: THREE.OneFactor,
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
        if (hasGSAPCore) {
            gsap.to(animationVars, {
                duration: 0.1,
                ease: "power4.in",
                speed: config.morphAnimationSpeed / 100,
                onComplete: () => this.slowDown()
            });

            // Change color
            gsap.to(animationVars, {
                duration: 1,
                ease: "none",
                color: color
            });
        }

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

            // Calculate radius for curved path based on distance
            const dx = targetVertex.x - currentVertex.x;
            const dy = targetVertex.y - currentVertex.y;
            const dz = targetVertex.z - currentVertex.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            // Random timing for each particle
            const delay = Math.random() * 0.3;
            const duration = 1.125 + Math.random() * 0.375;

            // Store original values
            const startX = currentVertex.x;
            const startY = currentVertex.y;
            const startZ = currentVertex.z;

            // Calculate control points for the curve
            // We'll use two control points to create a smooth S-curve
            const ctrl1 = {
                x: startX + dx * 0.25 + (Math.random() - 0.5) * distance * 0.8,
                y: startY + dy * 0.25 + (Math.random() - 0.5) * distance * 0.8,
                z: startZ + dz * 0.25 + Math.random() * distance * 6.0 // Tripled from 2.0
            };
            
            const ctrl2 = {
                x: startX + dx * 0.75 + (Math.random() - 0.5) * distance * 0.8,
                y: startY + dy * 0.75 + (Math.random() - 0.5) * distance * 0.8,
                z: startZ + dz * 0.75 - Math.random() * distance * 6.0 // Tripled from 2.0
            };

            if (hasGSAPCore) {
                const progressObj = { value: 0 };
                
                gsap.to(progressObj, {
                    value: 1,
                    duration: duration,
                    delay: delay,
                    ease: "power2.inOut", // Smooth acceleration and deceleration
                    onUpdate: () => {
                        const t = progressObj.value;
                        
                        // Quadratic Bezier curve calculation
                        // P = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
                        // Where P₀ is start, P₁ is control point, P₂ is end
                        const t1 = 1 - t;
                        const t2 = t1 * t1;
                        const t3 = 2 * t1 * t;
                        const t4 = t * t;
                        
                        // First half of the curve (start to ctrl1 to ctrl2)
                        const x1 = t2 * startX + t3 * ctrl1.x + t4 * ctrl2.x;
                        const y1 = t2 * startY + t3 * ctrl1.y + t4 * ctrl2.y;
                        const z1 = t2 * startZ + t3 * ctrl1.z + t4 * ctrl2.z;
                        
                        // Second half of the curve (ctrl1 to ctrl2 to target)
                        const x2 = t2 * ctrl1.x + t3 * ctrl2.x + t4 * targetVertex.x;
                        const y2 = t2 * ctrl1.y + t3 * ctrl2.y + t4 * targetVertex.y;
                        const z2 = t2 * ctrl1.z + t3 * ctrl2.z + t4 * targetVertex.z;
                        
                        // Blend between the two curves based on progress
                        currentVertex.x = x1 * (1 - t) + x2 * t;
                        currentVertex.y = y1 * (1 - t) + y2 * t;
                        currentVertex.z = z1 * (1 - t) + z2 * t;
                        currentVertex.scale = scales[i] + (targetVertex.scale - scales[i]) * t;
                        
                        this.updateParticle(i3, currentVertex, positions, scales);
                    }
                });
            } else {
                // Enhanced fallback animation with multiple tweens
                const midZ = startZ + (Math.random() - 0.5) * distance;
                
                // First half of the animation
                gsap.to(currentVertex, {
                    duration: duration * 0.5,
                    ease: "power2.inOut",
                    x: startX + dx * 0.5 + (Math.random() - 0.5) * distance * 0.3,
                    y: startY + dy * 0.5 + (Math.random() - 0.5) * distance * 0.3,
                    z: midZ,
                    delay: delay,
                    onUpdate: () => this.updateParticle(i3, currentVertex, positions, scales)
                });
                
                // Second half of the animation
                gsap.to(currentVertex, {
                    duration: duration * 0.5,
                    ease: "power2.inOut",
                    x: targetVertex.x,
                    y: targetVertex.y,
                    z: targetVertex.z,
                    scale: targetVertex.scale,
                    delay: delay + duration * 0.5,
                    onUpdate: () => this.updateParticle(i3, currentVertex, positions, scales)
                });
            }
        }

        // Camera rotation
        if (hasGSAPCore) {
            gsap.to(animationVars, {
                duration: 1,
                ease: "power1.inOut",
                rotation: animationVars.rotation === 45 ? -45 : 45
            });
        }
    }

    updateParticle(i3, vertex, positions, scales) {
        positions[i3] = vertex.x;
        positions[i3 + 1] = vertex.y;
        positions[i3 + 2] = vertex.z;
        scales[i3 / 3] = vertex.scale;
        this.particles.attributes.position.needsUpdate = true;
        this.particles.attributes.scale.needsUpdate = true;
    }

    slowDown() {
        gsap.to(animationVars, {
            duration: 0.3,
            ease: "power2.out",
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