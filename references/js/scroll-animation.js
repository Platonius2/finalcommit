export class ScrollAnimation {
    constructor(textManager) {
        this.textManager = textManager;
        this.lastScrollTime = 0;
        this.scrollThreshold = 500; // ms between scroll transitions
        this.isLocked = true; // Start with scroll locked
        this.setupScrollHandler();
        this.setupIntersectionObserver();
    }

    setupIntersectionObserver() {
        const options = {
            threshold: 0.2,
            rootMargin: "0px 0px -100px 0px"
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const section = entry.target;
                    this.animateSection(section);
                }
            });
        }, options);

        // Observe all sections
        document.querySelectorAll('.section').forEach(section => {
            observer.observe(section);
        });
    }

    animateSection(section) {
        const elements = section.querySelectorAll('.appear, .appear-left, .appear-right, .appear-scale');
        elements.forEach((el, i) => {
            setTimeout(() => {
                el.classList.add('active');
            }, i * 100); // Stagger animations by 100ms
        });
    }

    setupScrollHandler() {
        // Prevent default scroll and handle manually
        window.addEventListener('wheel', (e) => {
            if (this.isLocked) {
                e.preventDefault();
                
                const now = Date.now();
                if (now - this.lastScrollTime < this.scrollThreshold) return;

                const scrollingDown = e.deltaY > 0;
                
                if (scrollingDown && this.textManager.currentIndex < 2) {
                    this.textManager.currentIndex++;
                    this.textManager.updateActiveText(this.textManager.currentIndex);
                    this.lastScrollTime = now;
                    
                    if (this.textManager.currentIndex === 2) {
                        this.isLocked = false;
                        initializeScrolling();
                    }
                } else if (!scrollingDown && this.textManager.currentIndex > 0) {
                    this.textManager.currentIndex--;
                    this.textManager.updateActiveText(this.textManager.currentIndex);
                    this.lastScrollTime = now;
                }
            }
        }, { passive: false });

        // Handle touch events for mobile
        let touchStartY = 0;
        let lastTouchY = 0;
        
        window.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
            lastTouchY = touchStartY;
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (this.isLocked) {
                e.preventDefault();
                
                const touchY = e.touches[0].clientY;
                const deltaY = lastTouchY - touchY;
                const scrollingDown = deltaY > 0;
                
                const now = Date.now();
                if (now - this.lastScrollTime < this.scrollThreshold) return;

                if (Math.abs(deltaY) > 5) { // Add a small threshold for touch movement
                    if (scrollingDown && this.textManager.currentIndex < 2) {
                        this.textManager.currentIndex++;
                        this.textManager.updateActiveText(this.textManager.currentIndex);
                        this.lastScrollTime = now;
                        
                        if (this.textManager.currentIndex === 2) {
                            this.isLocked = false;
                            initializeScrolling();
                        }
                    } else if (!scrollingDown && this.textManager.currentIndex > 0) {
                        this.textManager.currentIndex--;
                        this.textManager.updateActiveText(this.textManager.currentIndex);
                        this.lastScrollTime = now;
                    }
                }
            }
            
            lastTouchY = touchY;
        }, { passive: false });
    }
}

function initializeScrolling() {
    const sections = document.querySelectorAll('.section');
    const navDots = document.querySelectorAll('.section-nav button');
    let isScrolling = false;
    let currentSectionIndex = 0;
    let lastScrollTime = Date.now();
    const scrollThreshold = 100;

    // Update active section on scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };

    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !document.querySelector('.overlay.active')) {
                const dots = document.querySelectorAll('.section-nav button');
                dots.forEach(dot => dot.classList.remove('active'));
                const index = Array.from(sections).indexOf(entry.target);
                if (index >= 0) {
                    dots[index].classList.add('active');
                    currentSectionIndex = index;
                }
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach(section => observer.observe(section));

    function smoothScrollToSection(index) {
        if (isScrolling) return;
        
        isScrolling = true;
        currentSectionIndex = index;

        const startPosition = window.scrollY;
        const targetPosition = sections[index].offsetTop;
        const startTime = performance.now();
        const duration = 2500; // Longer duration for smoother animation

        // Custom easing function with gradual acceleration and deceleration
        function easeInOutQuint(t) {
            return t < 0.5 
                ? 16 * t * t * t * t * t 
                : 1 - Math.pow(-2 * t + 2, 5) / 2;
        }

        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Apply easing
            const easedProgress = easeInOutQuint(progress);
            
            // Calculate intermediate position
            const currentPosition = startPosition + (targetPosition - startPosition) * easedProgress;
            
            // Perform the scroll
            window.scrollTo(0, currentPosition);

            // Update navigation dots
            navDots.forEach(dot => dot.classList.remove('active'));
            navDots[index].classList.add('active');

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Add a small delay before releasing the scroll lock
                setTimeout(() => {
                    isScrolling = false;
                }, 100);
            }
        }

        requestAnimationFrame(animate);
    }

    // Smooth scrolling with footer handling
    window.addEventListener('wheel', (e) => {
        const now = Date.now();
        if (isScrolling || document.querySelector('.overlay.active') || now - lastScrollTime < scrollThreshold) {
            e.preventDefault();
            return;
        }
        lastScrollTime = now;

        const direction = e.deltaY > 0 ? 1 : -1;
        const newIndex = Math.max(0, Math.min(sections.length - 1, currentSectionIndex + direction));

        if (newIndex !== currentSectionIndex) {
            e.preventDefault();
            smoothScrollToSection(newIndex);
        }
    }, { passive: false });

    // Handle navigation dot clicks
    navDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            if (!isScrolling) {
                smoothScrollToSection(index);
            }
        });
    });

    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (isScrolling) return;

        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const direction = e.key === 'ArrowDown' ? 1 : -1;
            const newIndex = Math.max(0, Math.min(sections.length - 1, currentSectionIndex + direction));
            
            if (newIndex !== currentSectionIndex) {
                smoothScrollToSection(newIndex);
            }
        }
    });

    // Handle touch events
    let touchStartY = 0;
    let touchStartTime = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (isScrolling) return;

        const touchEndY = e.changedTouches[0].clientY;
        const touchEndTime = Date.now();
        
        const distance = touchStartY - touchEndY;
        const duration = touchEndTime - touchStartTime;
        const velocity = Math.abs(distance / duration);

        if (velocity > 0.3 && Math.abs(distance) > 50) {
            const direction = distance > 0 ? 1 : -1;
            const newIndex = Math.max(0, Math.min(sections.length - 1, currentSectionIndex + direction));
            
            if (newIndex !== currentSectionIndex) {
                smoothScrollToSection(newIndex);
            }
        }
    }, { passive: true });
}

function handleFooterVisibility(e) {
    if (!isInContactSection) return;

    const contactRect = contactSection.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const scrollableDistance = contactRect.height - windowHeight;
    const scrollProgress = Math.abs(contactRect.top) / scrollableDistance;
    
    // Show footer when scrolled more than 80% through contact section
    if (scrollProgress > 0.8 && e.deltaY > 0) {
        if (!isFooterVisible) {
            e.preventDefault();
            footer.classList.add('visible');
            isFooterVisible = true;
            // Prevent further scrolling
            document.body.style.overflow = 'hidden';
        }
    }
    // Hide footer when scrolling up from the bottom
    else if (scrollProgress <= 0.8 && e.deltaY < 0) {
        if (isFooterVisible) {
            footer.classList.remove('visible');
            isFooterVisible = false;
            // Re-enable scrolling
            document.body.style.overflow = '';
        }
    }
}

// Initialize the scroll animation when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // The TextManager instance will be created by the particle text code
    // and will call the ScrollAnimation constructor
}); 