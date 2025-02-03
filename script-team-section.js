document.addEventListener('DOMContentLoaded', function() {
  'use strict';
  
  // Get all team members and title
  const teamMembers = document.querySelectorAll('.team-member');
  const teamTitle = document.querySelector('.team-title');

  // Initialize Intersection Observer for animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, {
    threshold: 0.2,
    rootMargin: '50px'
  });

  // Observe team title
  if (teamTitle) {
    observer.observe(teamTitle);
  }

  // Observe each team member
  teamMembers.forEach(member => {
    observer.observe(member);
  });

  // Preload images for better performance
  const preloadImages = () => {
    const imageElements = document.querySelectorAll('.member-image img');
    imageElements.forEach(img => {
      const src = img.getAttribute('src');
      if (src) {
        const preloadImg = new Image();
        preloadImg.src = src;
      }
    });
  };

  // Call preload after a short delay
  setTimeout(preloadImages, 100);
});