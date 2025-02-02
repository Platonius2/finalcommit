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
                        this.initializeScrolling();
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
        let lastTouchTime = 0;
        const touchDelay = 300; // 0.3 second delay between swipes
        
        window.addEventListener('touchstart', (e) => {
            if (this.isLocked) {
                e.preventDefault();
                touchStartY = e.touches[0].clientY;
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (this.isLocked) {
                e.preventDefault();
            }
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            if (this.isLocked) {
                e.preventDefault();
                
                const now = Date.now();
                if (now - lastTouchTime < touchDelay) return;
                
                const touchEndY = e.changedTouches[0].clientY;
                const deltaY = touchStartY - touchEndY;
                
                // Only trigger if swipe is long enough
                if (Math.abs(deltaY) > 50) {
                    const scrollingDown = deltaY > 0;
                    
                    if (scrollingDown && this.textManager.currentIndex < 2) {
                        this.textManager.currentIndex++;
                        this.textManager.updateActiveText(this.textManager.currentIndex);
                        lastTouchTime = now;
                        
                        if (this.textManager.currentIndex === 2) {
                            this.isLocked = false;
                            this.initializeScrolling();
                        }
                    } else if (!scrollingDown && this.textManager.currentIndex > 0) {
                        this.textManager.currentIndex--;
                        this.textManager.updateActiveText(this.textManager.currentIndex);
                        lastTouchTime = now;
                    }
                }
            }
        }, { passive: false });
    }

    initializeScrolling() {
        const sections = document.querySelectorAll('.section');
        const navDots = document.querySelectorAll('.section-nav button');
        let isScrolling = false;
        let currentSectionIndex = 0;
        let lastScrollTime = Date.now();
        const scrollDelay = 300; // 0.3 seconds delay

        // Enable smooth scrolling container
        document.documentElement.style.scrollBehavior = 'smooth';
        document.body.style.scrollSnapType = 'y mandatory';
        sections.forEach(section => {
            section.style.scrollSnapAlign = 'start';
            section.style.scrollSnapStop = 'always';
        });

        // Function to scroll to a specific section
        function scrollToSection(index, force = false) {
            if (!force && isScrolling) return;
            
            const now = Date.now();
            if (!force && now - lastScrollTime < scrollDelay) return;
            
            isScrolling = true;
            lastScrollTime = now;
            
            const targetSection = sections[index];
            if (!targetSection) return;
            
            // Use scrollIntoView for better mobile compatibility
            targetSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            
            // Update navigation dots
            navDots.forEach((dot, i) => dot.classList.remove('active'));
            navDots[index].classList.add('active');
            
            currentSectionIndex = index;
            
            // Reset scrolling flag after animation
            setTimeout(() => {
                isScrolling = false;
            }, scrollDelay);
        }

        // Enhanced touch handling for mobile
        let touchStartY = 0;
        let touchStartX = 0;
        let lastTouchTime = 0;
        const touchDelay = 300;
        let isSwiping = false;
        let swipeThreshold = 50;
        let initialScroll = 0;

        document.addEventListener('touchstart', (e) => {
            if (isScrolling) return;
            
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
            initialScroll = window.scrollY;
            
            // Reset swipe state
            isSwiping = false;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (isScrolling || isSwiping) {
                e.preventDefault();
                return;
            }

            const touchY = e.touches[0].clientY;
            const touchX = e.touches[0].clientX;
            const deltaY = touchStartY - touchY;
            const deltaX = touchStartX - touchX;

            // Check if scrolling is more vertical than horizontal
            if (Math.abs(deltaY) > Math.abs(deltaX)) {
                e.preventDefault();
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            if (isScrolling || isSwiping) return;
            
            const now = Date.now();
            if (now - lastTouchTime < touchDelay) return;
            
            const touchEndY = e.changedTouches[0].clientY;
            const deltaY = touchStartY - touchEndY;
            
            // Only trigger if swipe is long enough and mostly vertical
            if (Math.abs(deltaY) > swipeThreshold) {
                isSwiping = true;
                const direction = deltaY > 0 ? 1 : -1;
                const nextIndex = Math.max(0, Math.min(sections.length - 1, currentSectionIndex + direction));
                
                if (nextIndex !== currentSectionIndex) {
                    scrollToSection(nextIndex);
                    lastTouchTime = now;
                    
                    // Prevent default scroll behavior
                    e.preventDefault();
                }
                
                setTimeout(() => {
                    isSwiping = false;
                }, touchDelay);
            }
        }, { passive: false });

        // Handle mouse wheel scrolling
        function handleWheel(e) {
            e.preventDefault();
            
            if (isScrolling) return;
            
            const direction = e.deltaY > 0 ? 1 : -1;
            const nextIndex = Math.max(0, Math.min(sections.length - 1, currentSectionIndex + direction));
            
            if (nextIndex !== currentSectionIndex) {
                scrollToSection(nextIndex);
            }
        }

        // Handle keyboard navigation
        function handleKeydown(e) {
            if (isScrolling) return;
            
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const direction = e.key === 'ArrowDown' ? 1 : -1;
                const nextIndex = Math.max(0, Math.min(sections.length - 1, currentSectionIndex + direction));
                
                if (nextIndex !== currentSectionIndex) {
                    scrollToSection(nextIndex);
                }
            }
        }

        // Handle navigation dot clicks
        function handleNavDotClick(index) {
            scrollToSection(index, true); // Force scroll without delay for direct navigation
        }

        // Initialize event listeners
        document.addEventListener('wheel', handleWheel, { passive: false });
        document.addEventListener('keydown', handleKeydown);

        // Set up navigation dots click handlers
        navDots.forEach((dot, index) => {
            dot.addEventListener('click', () => handleNavDotClick(index));
        });

        // Update current section on page load
        window.addEventListener('load', () => {
            currentSectionIndex = Math.floor(window.scrollY / window.innerHeight);
            scrollToSection(currentSectionIndex, true);
        });
    }
}

function initializeScrolling() {
    // Get all sections including React sections
    const reactSection = document.querySelector('#root > div');
    const nonReactSections = document.querySelectorAll('.page-wrapper .section');
    const allSections = [reactSection, ...nonReactSections];
    const footer = document.getElementById('footer');
    const contactSection = document.querySelector('.contact-section');
    let isFooterVisible = false;
    let lastScrollY = window.scrollY;
    let isInContactSection = false;

    // Add test button handler
    const footerTrigger = document.querySelector('.footer-trigger');
    if (footerTrigger) {
        footerTrigger.addEventListener('click', () => {
            footer.classList.toggle('visible');
            isFooterVisible = !isFooterVisible;
        });
    }

    // Handle footer visibility
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

    // Update active section on scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
    };

    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (entry.target === contactSection) {
                isInContactSection = entry.isIntersecting;
            }
            
            if (entry.isIntersecting && !document.querySelector('.overlay.active')) {
                const dots = document.querySelectorAll('.section-nav button');
                dots.forEach(dot => dot.classList.remove('active'));
                const index = Array.from(allSections).indexOf(entry.target);
                if (index >= 0) {
                    dots[index].classList.add('active');
                }
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    allSections.forEach(section => observer.observe(section));

    // Smooth scrolling with footer handling
    let isScrolling = false;
    window.addEventListener('wheel', (e) => {
        // Always prevent scroll if a card is expanded
        if (document.querySelector('.overlay.active')) {
            e.preventDefault();
            return;
        }

        // Handle footer visibility first
        if (isInContactSection) {
            handleFooterVisibility(e);
            if (isFooterVisible) {
                e.preventDefault();
                return;
            }
        }

        if (isScrolling) {
            e.preventDefault();
            return;
        }

        const currentSection = Array.from(allSections).findIndex(section => {
            const rect = section.getBoundingClientRect();
            return rect.top >= -window.innerHeight / 2 && rect.top <= window.innerHeight / 2;
        });

        if (e.deltaY > 0 && currentSection < allSections.length - 1) {
            e.preventDefault();
            allSections[currentSection + 1].scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            isScrolling = true;
            setTimeout(() => { isScrolling = false; }, 700);
        } else if (e.deltaY < 0 && currentSection > 0) {
            e.preventDefault();
            allSections[currentSection - 1].scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            isScrolling = true;
            setTimeout(() => { isScrolling = false; }, 700);
        }
    }, { passive: false });

    // Handle escape key to close footer
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isFooterVisible) {
            footer.classList.remove('visible');
            isFooterVisible = false;
        }
    });
} 