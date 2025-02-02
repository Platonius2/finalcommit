document.addEventListener('DOMContentLoaded', function() {
  'use strict';
  
  // Debug: Check if elements exist
  const cards = document.querySelectorAll('.team-section .card');
  console.log('Found cards:', cards.length);

  // Debug: Check background images
  cards.forEach((card, index) => {
    const imgBox = card.querySelector('.img_box');
    const computedStyle = window.getComputedStyle(imgBox);
    const bgImage = computedStyle.backgroundImage;
    console.log(`Card ${index + 1} background:`, bgImage);

    // Try to preload the image
    if (bgImage && bgImage !== 'none') {
      const url = bgImage.slice(4, -1).replace(/"/g, "");
      const img = new Image();
      img.onload = () => console.log(`Image ${index + 1} loaded successfully:`, url);
      img.onerror = () => console.log(`Image ${index + 1} failed to load:`, url);
      img.src = url;
    }
  });

  // Wait a brief moment to ensure React has finished rendering
  setTimeout(() => {
    // Handle image loading and errors
    const teamImages = document.querySelectorAll('.team-section .card .img_box img');
    teamImages.forEach(img => {
      // Add loading class
      img.classList.add('loading');
      
      // Handle successful load
      img.onload = function() {
        this.classList.remove('loading');
        this.classList.add('loaded');
        console.log('Image loaded successfully:', this.src);
      };
      
      // Handle load errors
      img.onerror = function() {
        this.classList.remove('loading');
        // Try with a different image service as fallback
        this.src = `https://picsum.photos/seed/${Math.random()}/400/600`;
        console.log('Retrying with fallback:', this.src);
      };
    });

    // Initialize tilt effect with only glare (no actual tilt)
    if (cards.length && jQuery.fn.tilt) {
      jQuery('.team-section .card').tilt({
        maxTilt: 0,  // No tilt
        perspective: 1000,
        scale: 1,    // No scale effect
        speed: 400,
        glare: true,
        maxGlare: 0.2,
        easing: "cubic-bezier(.03,.98,.52,.99)"
      });
    }

    // Initialize Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('appear');
          // Don't unobserve to allow re-animation when scrolling back
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '50px'
    });

    cards.forEach(card => {
      observer.observe(card);
    });
  }, 100); // Small delay to ensure React has finished rendering

  // Preload images for better performance
  const preloadImages = () => {
    const imageElements = document.querySelectorAll('.team-section .img_box');
    imageElements.forEach(imgBox => {
      const style = getComputedStyle(imgBox);
      const imageUrl = style.backgroundImage.slice(4, -1).replace(/["']/g, "");
      
      if (imageUrl && imageUrl !== 'none') {
        const img = new Image();
        img.src = imageUrl;
      }
    });
  };

  // Call preload after a short delay
  setTimeout(preloadImages, 100);
});