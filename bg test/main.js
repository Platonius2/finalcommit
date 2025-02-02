import { NeatGradient } from "./node_modules/@firecms/neat/dist/index.es.js";

// Define the gradient configuration
const config = {
    colors: [
        {
            color: '#000000',
            alpha: 0,
            enabled: true,
        },
        {
            color: '#020D18',
            alpha: 0,
            enabled: true,
        },
        {
            color: '#1f1147',
            alpha: 0,
            enabled: true,
        },
        {
            color: '#020210',
            alpha: 0,
            enabled: true,
        },
        {
            color: '#02152A',
            alpha: 0,
            enabled: true,
        },
    ],
    speed: 0, // Keep at 0 for scroll-based animation
    horizontalPressure: 3,
    verticalPressure: 5,
    waveFrequencyX: 3,
    waveFrequencyY: 5,
    waveAmplitude: 8,
    shadows: 7,
    highlights: 1,
    colorBrightness: 0.8,
    colorSaturation: 0,
    wireframe: false,
    colorBlending: 7,
    backgroundColor: '#000000',
    backgroundAlpha: 0,
    grainScale: 2,
    grainSparsity: 0.04,
    grainIntensity: 0.1,
    grainSpeed: 1.5,
    resolution: 0.35,
};

// Initialize the gradient
const neat = new NeatGradient({
    ref: document.getElementById("gradient"),
    ...config
});

class ScrollAnimationManager {
    constructor() {
        this.lastScrollY = window.scrollY;
        this.maxSpeed = 8;
        this.scrollMultiplier = 0.3;
        this.animationDuration = 700; // Duration in ms
        this.animationStartTime = 0;
        this.targetSpeed = 0;
        this.isAnimating = false;
        this.setupScrollHandling();
        this.startAnimationLoop();
    }

    setupScrollHandling() {
        // Handle wheel events
        window.addEventListener('wheel', (e) => {
            const delta = Math.abs(e.deltaY);
            this.handleScroll(delta);
        }, { passive: true });

        // Handle scroll events
        window.addEventListener('scroll', () => {
            const delta = Math.abs(window.scrollY - this.lastScrollY);
            this.handleScroll(delta);
            this.lastScrollY = window.scrollY;
        }, { passive: true });

        // Handle touch events
        let lastTouchY = 0;
        
        window.addEventListener('touchstart', (e) => {
            lastTouchY = e.touches[0].clientY;
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            const touchY = e.touches[0].clientY;
            const delta = Math.abs(touchY - lastTouchY);
            this.handleScroll(delta);
            lastTouchY = touchY;
        }, { passive: true });
    }

    handleScroll(delta) {
        // Calculate target speed based on scroll delta
        this.targetSpeed = Math.min(this.maxSpeed, delta * this.scrollMultiplier);
        this.animationStartTime = performance.now();
        this.isAnimating = true;
    }

    easeOutQuad(t) {
        return 1 - (1 - t) * (1 - t);
    }

    startAnimationLoop() {
        const animate = () => {
            if (this.isAnimating) {
                const currentTime = performance.now();
                const elapsed = currentTime - this.animationStartTime;
                const progress = Math.min(elapsed / this.animationDuration, 1);
                
                // Use easing function for smooth animation
                const eased = this.easeOutQuad(progress);
                
                if (progress < 1) {
                    // During animation, interpolate speed
                    neat.speed = this.targetSpeed * (1 - eased);
                } else {
                    // Animation complete
                    neat.speed = 0;
                    this.isAnimating = false;
                }
            }
            
            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }
}

// Initialize scroll animation manager
const scrollManager = new ScrollAnimationManager();

// Handle page visibility
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        neat.speed = 0;
    }
});

// Cleanup on page unload
window.addEventListener('unload', () => {
    neat.speed = 0;
}); 