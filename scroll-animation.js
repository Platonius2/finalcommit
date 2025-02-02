function initializeScrolling() {
    // Wait for React root to be populated
    const waitForReactRoot = () => {
        // Get all sections including React sections
        const reactRoot = document.querySelector('#root');
        const nonReactSections = Array.from(document.querySelectorAll('.page-wrapper .section'));
        
        // If React root exists but its content isn't ready, wait and try again
        if (reactRoot && (!reactRoot.children.length || !reactRoot.firstElementChild)) {
            setTimeout(waitForReactRoot, 100);
            return;
        }

        // Get the React section if it exists
        const reactSection = reactRoot ? reactRoot.firstElementChild : null;
        
        // Combine all sections in the correct order
        const sections = nonReactSections.reduce((acc, section) => {
            if (section.classList.contains('three-section')) {
                acc.push(section);
            } else if (reactSection && !acc.includes(reactSection)) {
                acc.push(reactSection);
                acc.push(section);
            } else {
                acc.push(section);
            }
            return acc;
        }, []);

        const navDots = document.querySelectorAll('.section-nav button');
        let currentSectionIndex = 0;

        // Add strict scroll lock
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        // Watch for Three.js completion
        const checkThreeJsComplete = () => {
            if (window.threeJsComplete) {
                document.body.style.overflow = '';
                document.documentElement.style.overflow = '';
            } else {
                requestAnimationFrame(checkThreeJsComplete);
            }
        };
        checkThreeJsComplete();

        function updateActiveDot(index) {
            if (index < 0 || index >= sections.length) return;
            navDots.forEach(dot => dot.classList.remove('active'));
            navDots[index].classList.add('active');
            currentSectionIndex = index;
        }

        function getCurrentSectionIndex() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const sectionHeight = window.innerHeight;
            return Math.round(scrollTop / sectionHeight);
        }

        function scrollToSection(index) {
            if (!window.threeJsComplete && index > 0) return;

            if (index < 0 || index >= sections.length || !sections[index]) return;
            
            const targetPosition = sections[index].offsetTop;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
            
            updateActiveDot(index);
        }

        // Handle navigation dot clicks
        navDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                if (!window.threeJsComplete && index > 0) return;
                scrollToSection(index);
            });
        });

        // Handle keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (!window.threeJsComplete && e.key === 'ArrowDown') return;
                
                const direction = e.key === 'ArrowDown' ? 1 : -1;
                const newIndex = Math.max(0, Math.min(sections.length - 1, currentSectionIndex + direction));
                
                if (newIndex !== currentSectionIndex) {
                    scrollToSection(newIndex);
                }
            }
        });

        // Simple wheel event handler
        window.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (!window.threeJsComplete && e.deltaY > 0) return;
            
            const direction = e.deltaY > 0 ? 1 : -1;
            const newIndex = Math.max(0, Math.min(sections.length - 1, currentSectionIndex + direction));
            
            if (newIndex !== currentSectionIndex) {
                scrollToSection(newIndex);
            }
        }, { passive: false });

        // Add scroll event listener to update active dot during manual scrolling
        window.addEventListener('scroll', () => {
            if (!window.threeJsComplete) {
                window.scrollTo(0, 0);
                return;
            }
            const index = getCurrentSectionIndex();
            if (index !== currentSectionIndex) {
                updateActiveDot(index);
            }
        }, { passive: true });

        // Initial dot update and scroll position
        updateActiveDot(0);
        window.scrollTo(0, 0);
    };

    // Start the initialization process
    waitForReactRoot();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeScrolling);
} else {
    initializeScrolling();
} 