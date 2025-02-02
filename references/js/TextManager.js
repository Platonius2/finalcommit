import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';

export class TextManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.font = null;
        this.particles = [];
        this.texts = [];
        this.textMeshes = new Map();
        this.particleGroups = new Map();
        this.currentIndex = 0;
        this.isLocked = true;
    }

    async loadFont(fontPath) {
        return new Promise((resolve, reject) => {
            const loader = new FontLoader();
            loader.load('https://threejs.org/examples/fonts/droid/droid_sans_regular.typeface.json', (font) => {
                this.font = font;
                resolve(font);
            }, undefined, reject);
        });
    }

    createText(text, position = { x: 0, y: 0, z: 0 }, options = {}) {
        const {
            size = 0.5,
            height = 0.2,
            curveSegments = 12,
            bevelEnabled = true,
            bevelThickness = 0.03,
            bevelSize = 0.02,
            bevelOffset = 0,
            bevelSegments = 5,
            color = 0xffffff
        } = options;

        if (!this.font) {
            console.error('Font not loaded');
            return;
        }

        const geometry = new TextGeometry(text, {
            font: this.font,
            size,
            height,
            curveSegments,
            bevelEnabled,
            bevelThickness,
            bevelSize,
            bevelOffset,
            bevelSegments
        });

        geometry.computeBoundingBox();
        geometry.center();

        const material = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(position.x, position.y, position.z);
        this.scene.add(mesh);
        this.textMeshes.set(text, mesh);

        // Create particles
        const particles = this.createParticlesFromGeometry(geometry, color);
        this.particleGroups.set(text, particles);
        
        return { mesh, particles };
    }

    createParticlesFromGeometry(geometry, color) {
        const particlesGeometry = new THREE.BufferGeometry();
        const particleCount = 15000;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        // Create a grid of points that form the text shape
        const tempGeometry = geometry.clone();
        const tempMesh = new THREE.Mesh(tempGeometry);
        const box = new THREE.Box3().setFromObject(tempMesh);
        const size = box.getSize(new THREE.Vector3());

        // Create a grid of points
        const gridSize = Math.ceil(Math.pow(particleCount, 1/3));
        const spacing = Math.min(size.x, size.y, size.z) / gridSize;

        let particleIndex = 0;
        for (let x = 0; x < gridSize && particleIndex < particleCount; x++) {
            for (let y = 0; y < gridSize && particleIndex < particleCount; y++) {
                for (let z = 0; z < gridSize && particleIndex < particleCount; z++) {
                    const px = (x / gridSize - 0.5) * size.x * 1.5;
                    const py = (y / gridSize - 0.5) * size.y * 1.5;
                    const pz = (z / gridSize - 0.5) * size.z * 1.5;

                    positions[particleIndex * 3] = px;
                    positions[particleIndex * 3 + 1] = py;
                    positions[particleIndex * 3 + 2] = pz;

                    const colorRGB = new THREE.Color(color);
                    colors[particleIndex * 3] = colorRGB.r;
                    colors[particleIndex * 3 + 1] = colorRGB.g;
                    colors[particleIndex * 3 + 2] = colorRGB.b;

                    particleIndex++;
                }
            }
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMaterial = new THREE.PointsMaterial({
            size: 0.015,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        const particleSystem = new THREE.Points(particlesGeometry, particleMaterial);
        this.scene.add(particleSystem);
        
        return particleSystem;
    }

    animateParticles(delta) {
        this.particleGroups.forEach((particles) => {
            const positions = particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += Math.sin(delta + i) * 0.01;
                positions[i + 1] += Math.cos(delta + i) * 0.01;
                positions[i + 2] += Math.sin(delta + i) * 0.01;
            }
            particles.geometry.attributes.position.needsUpdate = true;
        });
    }

    showNextText() {
        if (!this.isLocked) return;
        // Implementation for showing next text will go here
    }

    showPreviousText() {
        if (!this.isLocked) return;
        // Implementation for showing previous text will go here
    }

    unlock() {
        this.isLocked = false;
    }

    dispose() {
        this.textMeshes.forEach((mesh) => {
            mesh.geometry.dispose();
            mesh.material.dispose();
            this.scene.remove(mesh);
        });

        this.particleGroups.forEach((particles) => {
            particles.geometry.dispose();
            particles.material.dispose();
            this.scene.remove(particles);
        });

        this.textMeshes.clear();
        this.particleGroups.clear();
    }
} 
