export const getResponsiveConfig = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isPortrait = screenHeight > screenWidth;
    
    // Reference sizes for scaling calculations
    const referenceWidth = 1920;
    const referenceHeight = 1080;
    
    // Calculate scale factor based only on width
    const baseScaleFactor = screenWidth / referenceWidth;
    const scaleFactor = screenWidth <= 1250 
        ? Math.min(1.4, Math.max(0.4, Math.pow(baseScaleFactor, 0.4)))  // Larger scale for small screens
        : Math.min(1, Math.max(0.3, Math.pow(baseScaleFactor, 0.45))); // Normal scale for large screens
    
    // Text size calculations based purely on width
    const textConfig = {
        baseSize: screenWidth <= 1250
            ? screenWidth * 0.1 * scaleFactor  // Much larger text for mobile screens
            : screenWidth * 0.05 * scaleFactor, // Normal size for larger screens
        maxWidth: screenWidth * 0.85,
        maxHeight: screenHeight * 0.25
    };
    
    // Particle configuration with width-based sizing
    const baseParticleCount = 15000;
    const particleScaleFactor = Math.max(0.2, Math.min(1, screenWidth / referenceWidth));
    
    return {
        // Text configuration
        textConfig,
        
        // Particle configuration with improved scaling
        particleCount: Math.floor(baseParticleCount * particleScaleFactor),
        particleSize: screenWidth <= 1250 
            ? 0.03  // Much larger particles for small screens
            : 0.01, // Normal size for large screens
        
        // Animation configuration
        defaultAnimationSpeed: 1,
        morphAnimationSpeed: 18,
        
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