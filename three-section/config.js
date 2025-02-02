export const getResponsiveConfig = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isPortrait = screenHeight > screenWidth;
    
    // Reference sizes for scaling calculations
    const referenceWidth = 1920;
    const referenceHeight = 1080;
    
    // Calculate scale factor based on both width and height
    const baseScaleFactor = Math.min(screenWidth / referenceWidth, screenHeight / referenceHeight);
    const scaleFactor = screenWidth <= 1250 
        ? Math.min(1.4, Math.max(0.4, Math.pow(baseScaleFactor, 0.4)))  // Larger scale for small screens
        : Math.min(1, Math.max(0.3, Math.pow(baseScaleFactor, 0.45))); // Normal scale for large screens
    
    // Text size calculations based on screen dimensions
    const textConfig = {
        baseSize: Math.min(screenWidth * 0.05, screenHeight * 0.08) * scaleFactor,
        maxWidth: screenWidth * 0.85,
        maxHeight: screenHeight * 0.25,
        depth: 0,
        curveSegments: 4,
        bevelEnabled: false,
        bevelThickness: 0,
        bevelSize: 0,
        bevelOffset: 0,
        bevelSegments: 0
    };
    
    // Particle configuration with responsive sizing
    const baseParticleCount = 4000;
    const particleScaleFactor = Math.max(0.3, Math.min(1, Math.min(screenWidth / referenceWidth, screenHeight / referenceHeight)));
    const particleSize = screenWidth <= 1250 
        ? Math.min(screenWidth, screenHeight) * 0.01  // Slightly larger particles for more blur area
        : Math.min(screenWidth, screenHeight) * 0.012; // Slightly larger particles for more blur area
    
    return {
        // Text configuration
        textConfig,
        
        // Particle configuration with improved scaling
        particleCount: Math.floor(baseParticleCount * particleScaleFactor),
        particleSize,
        particleSpacing: Math.min(screenWidth, screenHeight) * 0.001,
        
        // Animation configuration
        defaultAnimationSpeed: 1,
        morphAnimationSpeed: 18,
        
        // Post-processing configuration
        bloomStrength: 0.8,    // Reduced strength for more subtle glow
        bloomRadius: 1.5,      // Increased radius for wider, more diffused spread
        bloomThreshold: 0.05,  // Lower threshold for more subtle effect
        
        // Resources
        typeface: 'https://threejs.org/examples/fonts/droid/droid_sans_bold.typeface.json'
    };
};

export const config = getResponsiveConfig();

export const animationVars = {
    color: '#FFFFFF',
    speed: 0.01,
    rotation: -45,
    particleScale: 0
}; 