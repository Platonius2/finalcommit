import imagesLoaded from 'https://cdn.skypack.dev/imagesloaded';

console.clear();

// -------------------------------------------------
// ------------------ Utilities --------------------
// -------------------------------------------------

// Math utilities
const wrap = (n, max) => (n + max) % max;
const lerp = (a, b, t) => a + (b - a) * t;

// DOM utilities
const isHTMLElement = (el) => el instanceof HTMLElement;

const genId = (() => {
	let count = 0;
	return () => {
		return (count++).toString();
	};
})();

class Raf {
	constructor() {
		this.rafId = 0;
		this.raf = this.raf.bind(this);
		this.callbacks = [];

		this.start();
	}

	start() {
		this.raf();
	}

	stop() {
		cancelAnimationFrame(this.rafId);
	}

	raf() {
		this.callbacks.forEach(({ callback, id }) => callback({ id }));
		this.rafId = requestAnimationFrame(this.raf);
	}

	add(callback, id) {
		this.callbacks.push({ callback, id: id || genId() });
	}

	remove(id) {
		this.callbacks = this.callbacks.filter((callback) => callback.id !== id);
	}
}

class Vec2 {
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	set(x, y) {
		this.x = x;
		this.y = y;
	}

	lerp(v, t) {
		this.x = lerp(this.x, v.x, t);
		this.y = lerp(this.y, v.y, t);
	}
}

const vec2 = (x = 0, y = 0) => new Vec2(x, y);

export function tilt(node, options) {
	let { trigger, target } = resolveOptions(node, options);

	let lerpAmount = 0.06;
	let tiltIntensity = 1;
	let targetTiltIntensity = 1;

	const rotDeg = { current: vec2(), target: vec2() };
	const bgPos = { current: vec2(), target: vec2() };

	const update = (newOptions) => {
		destroy();
		({ trigger, target } = resolveOptions(node, newOptions));
		init();
	};

	let rafId;

	function ticker({ id }) {
		rafId = id;

		// Lerp the tilt intensity
		tiltIntensity = lerp(tiltIntensity, targetTiltIntensity, 0.1);

		rotDeg.current.lerp(rotDeg.target, lerpAmount);
		bgPos.current.lerp(bgPos.target, lerpAmount);

		for (const el of target) {
			// Apply tilt intensity to the rotation
			el.style.setProperty("--rotX", (rotDeg.current.y * tiltIntensity).toFixed(2) + "deg");
			el.style.setProperty("--rotY", (rotDeg.current.x * tiltIntensity).toFixed(2) + "deg");

			// Apply tilt intensity to the background position
			el.style.setProperty("--bgPosX", (bgPos.current.x * tiltIntensity).toFixed(2) + "%");
			el.style.setProperty("--bgPosY", (bgPos.current.y * tiltIntensity).toFixed(2) + "%");

			// Apply tilt intensity to text offset
			const textWrapper = el.querySelector('.slide-info--text__wrapper');
			if (textWrapper) {
				const zOffset = 45 * tiltIntensity;
				textWrapper.style.transform = `translateZ(${zOffset}px)`;
			}
		}
	}

	const onMouseMove = (e) => {
		lerpAmount = 0.1;

		const rect = trigger.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		
		// Calculate offset from center of element
		const offsetX = e.clientX - centerX;
		const offsetY = e.clientY - centerY;

		// Normalize the offset values
		const normalizedX = offsetX / (rect.width / 2);
		const normalizedY = offsetY / (rect.height / 2);

		for (const el of target) {
			// Reduce the rotation angles for more subtle effect
			const rotX = -normalizedY * 15; // Max 15 degrees
			const rotY = normalizedX * 15; // Max 15 degrees

			rotDeg.target.set(rotY, rotX);
			bgPos.target.set(-rotY * 0.3, rotX * 0.3);
		}
	};

	const onMouseLeave = () => {
		lerpAmount = 0.06;
		rotDeg.target.set(0, 0);
		bgPos.target.set(0, 0);
	};

	const setTiltIntensity = (intensity) => {
		targetTiltIntensity = intensity;
	};

	const addListeners = () => {
		trigger.addEventListener("mousemove", onMouseMove);
		trigger.addEventListener("mouseleave", onMouseLeave);
	};

	const removeListeners = () => {
		trigger.removeEventListener("mousemove", onMouseMove);
		trigger.removeEventListener("mouseleave", onMouseLeave);
	};

	const init = () => {
		addListeners();
		raf.add(ticker);
	};

	const destroy = () => {
		removeListeners();
		raf.remove(rafId);
	};

	init();

	return { destroy, update, setTiltIntensity };
}

function resolveOptions(node, options) {
	return {
		trigger: options?.trigger ?? node,
		target: options?.target
			? Array.isArray(options.target)
				? options.target
				: [options.target]
			: [node]
	};
}

// -----------------------------------------------------

// Global Raf Instance
const raf = new Raf();

// Store tilt instances for each slide
const tiltInstances = new Map();

function init() {
	// Wait for content to be ready
	const observer = new MutationObserver((mutations, obs) => {
		const nonReactSections = document.querySelector('.page-wrapper');
		
		if (nonReactSections) {
			obs.disconnect();
			initializeScrolling();
			initializeSlider();
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true
	});
}

function initializeScrolling() {
	// Get all sections
	const nonReactSections = document.querySelectorAll('.page-wrapper .section');
	const allSections = [...nonReactSections];

	// Ensure we have sections before proceeding
	if (allSections.length === 0) {
		console.warn('No sections found for scroll initialization');
		return;
	}

	// Add navigation dots
	const nav = document.createElement('nav');
	nav.className = 'section-nav';
	const ul = document.createElement('ul');

	allSections.forEach((section, index) => {
		const li = document.createElement('li');
		const button = document.createElement('button');
		button.setAttribute('aria-label', `Scroll to section ${index + 1}`);
		button.addEventListener('click', () => {
			// Prevent scrolling if a card is expanded
			if (!document.querySelector('.overlay.active')) {
				// Validate section exists before scrolling
				if (section && typeof section.scrollIntoView === 'function') {
					section.scrollIntoView({ behavior: 'smooth' });
				}
			}
		});
		li.appendChild(button);
		ul.appendChild(li);
	});

	nav.appendChild(ul);
	document.body.appendChild(nav);

	// Update active section on scroll
	const observerOptions = {
		root: null,
		rootMargin: '0px',
		threshold: 0.5
	};

	const observerCallback = (entries) => {
		// Only update dots if no card is expanded
		if (!document.querySelector('.overlay.active')) {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					const dots = document.querySelectorAll('.section-nav button');
					dots.forEach(dot => dot.classList.remove('active'));
					const index = Array.from(allSections).indexOf(entry.target);
					if (index >= 0) {
						dots[index].classList.add('active');
					}
				}
			});
		}
	};

	const observer = new IntersectionObserver(observerCallback, observerOptions);
	
	// Observe each section after validating it exists
	allSections.forEach(section => {
		if (section) {
			observer.observe(section);
		}
	});

	// Keyboard navigation
	document.addEventListener('keydown', (e) => {
		// Prevent navigation if a card is expanded
		if (document.querySelector('.overlay.active')) {
			return;
		}

		const currentSection = Array.from(allSections).findIndex(section => {
			const rect = section.getBoundingClientRect();
			return rect.top >= 0 && rect.top <= window.innerHeight / 2;
		});

		if (e.key === 'ArrowDown' && currentSection < allSections.length - 1) {
			allSections[currentSection + 1].scrollIntoView({ behavior: 'smooth' });
		} else if (e.key === 'ArrowUp' && currentSection > 0) {
			allSections[currentSection - 1].scrollIntoView({ behavior: 'smooth' });
		}
	});

	// Smooth scrolling
	let isScrolling = false;
	window.addEventListener('wheel', (e) => {
		// Always prevent scroll if a card is expanded
		if (document.querySelector('.overlay.active')) {
			e.preventDefault();
			return;
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
			setTimeout(() => { isScrolling = false; }, 700); // Match the CSS transition duration
		} else if (e.deltaY < 0 && currentSection > 0) {
			e.preventDefault();
			allSections[currentSection - 1].scrollIntoView({ 
				behavior: 'smooth',
				block: 'start'
			});
			isScrolling = true;
			setTimeout(() => { isScrolling = false; }, 700); // Match the CSS transition duration
		}
	}, { passive: false });
}

function initializeSlider() {
	const slides = [...document.querySelectorAll(".slide")];
	const slidesInfo = [...document.querySelectorAll(".slide-info")];
	let overlay = document.querySelector(".overlay");

	// Create overlay if it doesn't exist
	if (!overlay) {
		overlay = document.createElement('div');
		overlay.className = 'overlay';
		document.body.appendChild(overlay);
	}

	const buttons = {
		prev: document.querySelector(".slider--btn__prev"),
		next: document.querySelector(".slider--btn__next")
	};

	function initializeTilt(slide, index) {
		const slideInner = slide.querySelector(".slide__inner");
		const slideInfoInner = slidesInfo[index].querySelector(".slide-info__inner");
		
		// Remove existing tilt instance if it exists
		if (tiltInstances.has(slide)) {
			tiltInstances.get(slide).destroy();
			tiltInstances.delete(slide);
		}
		
		// Add new tilt instance
		const tiltInstance = tilt(slide, { 
			target: [slideInner, slideInfoInner]
		});
		tiltInstances.set(slide, tiltInstance);
	}

	// Set initial z-indexes and initialize tilt
	slides.forEach((slide, index) => {
		if (slide.hasAttribute('data-current')) {
			slide.style.zIndex = "30";
		} else if (slide.hasAttribute('data-next')) {
			slide.style.zIndex = "10";
		} else if (slide.hasAttribute('data-previous')) {
			slide.style.zIndex = "20";
		} else {
			slide.style.zIndex = "0";
		}

		initializeTilt(slide, index);

		const expandBtn = slide.querySelector(".slide--expand-btn");
		expandBtn.addEventListener("click", (e) => {
			e.stopPropagation();
			if (slide.classList.contains("expanded")) {
				collapseSlide(slide, overlay, index);
			} else {
				expandSlide(slide, overlay);
			}
		});
	});

	buttons.prev.addEventListener("click", change(-1));
	buttons.next.addEventListener("click", change(1));

	// Add escape key handler with null check for overlay
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			const expandedSlide = document.querySelector(".slide.expanded");
			if (expandedSlide) {
				collapseSlide(expandedSlide, overlay, slides.indexOf(expandedSlide));
			}
		}
	});

	// Optional: Keyboard navigation
	document.addEventListener('keydown', (e) => {
		const currentSection = Array.from(slides).findIndex(section => {
			const rect = section.getBoundingClientRect();
			return rect.top >= 0 && rect.top <= window.innerHeight / 2;
		});

		if (e.key === 'ArrowDown' && currentSection < slides.length - 1) {
			slides[currentSection + 1].scrollIntoView({ behavior: 'smooth' });
		} else if (e.key === 'ArrowUp' && currentSection > 0) {
			slides[currentSection - 1].scrollIntoView({ behavior: 'smooth' });
		}
	});
}

function expandSlide(slide, overlay) {
	if (!slide) return;
	
	const tiltInstance = tiltInstances.get(slide);
	if (tiltInstance) {
		tiltInstance.setTiltIntensity(0);
	}
	
	const video = slide.querySelector('video');
	const mainSlider = slide.closest('.main-slider');
	
	// Ensure overlay exists
	if (!overlay) {
		overlay = document.querySelector('.overlay');
		if (!overlay) {
			overlay = document.createElement('div');
			overlay.className = 'overlay';
			document.body.appendChild(overlay);
		}
	}
	
	requestAnimationFrame(() => {
		// Add expanded class to trigger animations
		slide.classList.add("expanded");
		if (mainSlider) mainSlider.classList.add("has-expanded-slide");
		if (overlay) overlay.classList.add("active");
		document.body.style.overflow = "hidden";
		
		// Initialize video after slide is expanded
		if (video) {
			video.muted = false; // Unmute to allow volume control
			video.volume = 0; // Set volume to 0
			initVideoControls(slide, true);
		}
	});
}

function collapseSlide(slide, overlay, index) {
	if (!slide) return;
	
	const video = slide.querySelector('video');
	const mainSlider = slide.closest('.main-slider');
	
	if (video) {
		video.pause();
		video.muted = true;
		video.currentTime = 1; // Reset to 1 second mark
	}

	// Ensure overlay exists
	if (!overlay) {
		overlay = document.querySelector('.overlay');
	}
	
	// Remove expanded class to trigger reverse animations
	slide.classList.remove("expanded");
	if (mainSlider) mainSlider.classList.remove("has-expanded-slide");
	if (overlay) overlay.classList.remove("active");
	document.body.style.overflow = "";

	// Get the current slide index if not provided
	if (typeof index === 'undefined') {
		const slides = [...document.querySelectorAll(".slide")];
		index = slides.indexOf(slide);
	}

	// Reinitialize tilt with a delay to allow for transition
	requestAnimationFrame(() => {
		setTimeout(() => {
			const slideInner = slide.querySelector(".slide__inner");
			const slideInfo = document.querySelector(`.slide-info[data-current]`);
			const slideInfoInner = slideInfo ? slideInfo.querySelector(".slide-info__inner") : null;

			// Remove old tilt instance
			if (tiltInstances.has(slide)) {
				tiltInstances.get(slide).destroy();
				tiltInstances.delete(slide);
			}

			// Create new tilt instance with proper targets
			if (slideInner && slideInfoInner) {
				const newTiltInstance = tilt(slide, {
					target: [slideInner, slideInfoInner]
				});
				tiltInstances.set(slide, newTiltInstance);
			}
		}, 300); // Increased delay to ensure transitions complete
	});
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

function change(direction) {
	return () => {
		const slides = [...document.querySelectorAll('.slide')];
		const slidesInfo = [...document.querySelectorAll('.slide-info')];
		const slidesBg = [...document.querySelectorAll('.slide__bg')];
		
		// Find current indices
		const currentIndex = slides.findIndex(slide => slide.hasAttribute('data-current'));
		const totalSlides = slides.length;
		
		// Calculate new indices
		const newCurrentIndex = wrap(currentIndex + direction, totalSlides);
		const newNextIndex = wrap(newCurrentIndex + 1, totalSlides);
		const newPrevIndex = wrap(newCurrentIndex - 1, totalSlides);

		// Reset all z-indexes first
		slides.forEach(slide => {
			slide.style.zIndex = "0";
			slide.removeAttribute('data-current');
			slide.removeAttribute('data-next');
			slide.removeAttribute('data-previous');
		});
		slidesInfo.forEach(info => {
			info.removeAttribute('data-current');
			info.removeAttribute('data-next');
			info.removeAttribute('data-previous');
		});
		slidesBg.forEach(bg => {
			bg.removeAttribute('data-current');
			bg.removeAttribute('data-next');
			bg.removeAttribute('data-previous');
		});

		// Set new attributes and z-indexes
		slides[newCurrentIndex].setAttribute('data-current', '');
		slides[newNextIndex].setAttribute('data-next', '');
		slides[newPrevIndex].setAttribute('data-previous', '');

		slidesInfo[newCurrentIndex].setAttribute('data-current', '');
		slidesInfo[newNextIndex].setAttribute('data-next', '');
		slidesInfo[newPrevIndex].setAttribute('data-previous', '');

		slidesBg[newCurrentIndex].setAttribute('data-current', '');
		slidesBg[newNextIndex].setAttribute('data-next', '');
		slidesBg[newPrevIndex].setAttribute('data-previous', '');

		// Always ensure current slide is on top
		slides[newCurrentIndex].style.zIndex = "30";
		
		// Set z-indexes for next and previous slides
		if (direction === 1) {
			slides[newPrevIndex].style.zIndex = "20";
			slides[newNextIndex].style.zIndex = "10";
		} else {
			slides[newPrevIndex].style.zIndex = "10";
			slides[newNextIndex].style.zIndex = "20";
		}
	}
}

function initVideoControls(slide, isInitialExpand = false) {
	const video = slide.querySelector('video');
	const controls = slide.querySelector('.video-controls');
	if (!video || !controls) return;

	// Set up initial video state
	const setInitialPosition = () => {
		// If slide is expanded, play the video
		if (slide.classList.contains('expanded')) {
			video.currentTime = 1;
			const playPromise = video.play();
			if (playPromise !== undefined) {
				playPromise.catch(error => {
					console.log("Video play failed:", error);
				});
			}
		} else {
			video.currentTime = 1;
			video.pause();
		}
	};

	// Handle video load
	if (video.readyState >= 2) {
		setInitialPosition();
	} else {
		video.addEventListener('loadeddata', setInitialPosition, { once: true });
	}

	// Clean up existing event listeners
	if (video.dataset.controlsInitialized === 'true') {
		const oldPlayPauseBtn = controls.querySelector('.play-pause');
		const oldVolumeBtn = controls.querySelector('.volume-btn');
		const oldVolumeSlider = controls.querySelector('.volume-slider input');
		const oldProgressSlider = controls.querySelector('.progress-slider input');

		oldPlayPauseBtn.replaceWith(oldPlayPauseBtn.cloneNode(true));
		oldVolumeBtn.replaceWith(oldVolumeBtn.cloneNode(true));
		oldVolumeSlider.replaceWith(oldVolumeSlider.cloneNode(true));
		oldProgressSlider.replaceWith(oldProgressSlider.cloneNode(true));

		video.removeEventListener('play', updatePlayPauseButton);
		video.removeEventListener('pause', updatePlayPauseButton);
		video.removeEventListener('ended', updatePlayPauseButton);
		video.removeEventListener('timeupdate', handleTimeUpdate);
	}

	const playPauseBtn = controls.querySelector('.play-pause');
	const timeDisplay = controls.querySelector('.video-time');
	const progressSlider = controls.querySelector('.progress-slider input');
	const progressFill = controls.querySelector('.progress-slider .slider-fill');
	const volumeBtn = controls.querySelector('.volume-btn');
	const volumeSlider = controls.querySelector('.volume-slider input');
	const volumeFill = controls.querySelector('.volume-slider .slider-fill');

	// Mark controls as initialized
	video.dataset.controlsInitialized = 'true';

	// Set initial volume state
	if (isInitialExpand) {
		video.volume = 0;
		volumeSlider.value = 0;
	}
	updateVolumeIcon(video.volume);
	volumeFill.style.setProperty('--volume', `${video.volume * 100}%`);

	// Update play/pause button state based on video state
	function updatePlayPauseButton() {
		if (video.paused) {
			playPauseBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
		} else {
			playPauseBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
		}
	}

	// Play/Pause with error handling
	const handlePlayPause = () => {
		console.log('Play/Pause clicked');
		if (video.paused) {
			const playPromise = video.play();
			if (playPromise !== undefined) {
				playPromise.catch(error => {
					console.log("Video play failed:", error);
				});
			}
		} else {
			video.pause();
		}
		updatePlayPauseButton();
	};

	playPauseBtn.addEventListener('click', handlePlayPause);

	// Update button state on video events
	video.addEventListener('play', updatePlayPauseButton);
	video.addEventListener('pause', updatePlayPauseButton);
	video.addEventListener('ended', updatePlayPauseButton);

	// Initial button state
	updatePlayPauseButton();

	// Time update handler
	function handleTimeUpdate() {
		const current = formatTime(video.currentTime);
		const duration = formatTime(video.duration);
		timeDisplay.textContent = `${current} / ${duration}`;
		
		const percent = (video.currentTime / video.duration) * 100;
		progressSlider.value = percent;
		progressFill.style.setProperty('--progress', `${percent}%`);
	}

	video.addEventListener('timeupdate', handleTimeUpdate);

	// Progress control
	progressSlider.addEventListener('input', (e) => {
		const time = (video.duration / 100) * e.target.value;
		video.currentTime = time;
		progressFill.style.setProperty('--progress', `${e.target.value}%`);
	});

	// Volume control
	volumeSlider.addEventListener('input', (e) => {
		const volume = e.target.value / 100;
		video.volume = volume;
		volumeFill.style.setProperty('--volume', `${e.target.value}%`);
		updateVolumeIcon(volume);
	});

	// Volume button
	let lastVolume = 1;
	volumeBtn.addEventListener('click', () => {
		if (video.volume > 0) {
			lastVolume = video.volume;
			video.volume = 0;
			volumeSlider.value = 0;
		} else {
			video.volume = lastVolume;
			volumeSlider.value = lastVolume * 100;
		}
		volumeFill.style.setProperty('--volume', `${volumeSlider.value}%`);
		updateVolumeIcon(video.volume);
	});

	function updateVolumeIcon(volume) {
		if (volume === 0) {
			volumeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
		} else if (volume < 0.5) {
			volumeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
		} else {
			volumeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>`;
		}
	}

	function formatTime(seconds) {
		const minutes = Math.floor(seconds / 60);
		seconds = Math.floor(seconds % 60);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
	// Initialize tilt effect after cards are visible
	const cards = document.querySelectorAll('.team-row .card');
	
	// Add appear class to trigger animation
	cards.forEach((card, index) => {
		setTimeout(() => {
			card.classList.add('appear');
			// Initialize tilt only after card appears
			if (typeof jQuery !== 'undefined' && jQuery.fn.tilt) {
				jQuery(card).tilt({
					maxTilt: 5,
					scale: 1.02,
					speed: 300,
					transition: true,
					perspective: 1000,
					glare: true,
					maxGlare: 0.1
				});
			}
		}, index * 100);
	});
});

// Cleanup function for tilt effect
window.addEventListener('unload', function() {
	if (typeof jQuery !== 'undefined' && jQuery.fn.tilt) {
		jQuery('.team-row .card').tilt.destroy();
	}
});

// Appear animations
const appearElements = document.querySelectorAll('.appear, .appear-left, .appear-right, .appear-scale');

const appearOptions = {
	threshold: 0.2,
	rootMargin: "0px 0px -100px 0px"
};

const appearOnScroll = new IntersectionObserver((entries, appearOnScroll) => {
	entries.forEach(entry => {
		if (!entry.isIntersecting) return;
		entry.target.classList.add('active');
		appearOnScroll.unobserve(entry.target);
	});
}, appearOptions);

appearElements.forEach(element => {
	appearOnScroll.observe(element);
});

// Appear animations for contact section
const contactElements = document.querySelectorAll('.contact-inquiry-text, .contact-email, .contact-button, .contact-logo');

const contactObserver = new IntersectionObserver((entries) => {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			entry.target.classList.add('active');
			// Don't unobserve to allow re-animation when scrolling back
		} else {
			entry.target.classList.remove('active');
		}
	});
}, {
	threshold: 0.5,
	rootMargin: "0px"
});

contactElements.forEach(element => {
	contactObserver.observe(element);
});

// Footer functionality
const footerWrapper = document.querySelector('.footer-wrapper');
const contactSection = document.querySelector('.contact-section');
let isFooterVisible = false;
let hasReachedBottom = false;
let lastWheelTime = 0;

// Handle footer visibility
function handleFooterVisibility(event) {
	// Only handle wheel/scroll events
	if (!event.deltaY) return;

	const currentTime = Date.now();
	const contactRect = contactSection.getBoundingClientRect();
	const isAtBottom = contactRect.bottom <= window.innerHeight;

	// First time reaching bottom
	if (isAtBottom && !hasReachedBottom) {
		hasReachedBottom = true;
		return;
	}

	// Show footer only if we're at bottom and user attempts to scroll down again
	if (hasReachedBottom && !isFooterVisible && event.deltaY > 0 && 
		currentTime - lastWheelTime > 100) { // Debounce wheel events
		footerWrapper.classList.add('visible');
		isFooterVisible = true;
		document.body.style.overflow = 'hidden';
	}

	// Hide footer on scroll up
	if (isFooterVisible && event.deltaY < 0) {
		footerWrapper.classList.remove('visible');
		isFooterVisible = false;
		document.body.style.overflow = '';
		hasReachedBottom = false;
	}

	lastWheelTime = currentTime;
}

// Event listeners
window.addEventListener('wheel', handleFooterVisibility, { passive: true });

// Reset state when leaving contact section
const contactObserverReset = new IntersectionObserver((entries) => {
	entries.forEach(entry => {
		if (!entry.isIntersecting) {
			hasReachedBottom = false;
			if (isFooterVisible) {
				footerWrapper.classList.remove('visible');
				isFooterVisible = false;
				document.body.style.overflow = '';
			}
		}
	});
}, {
	threshold: 0.5
});

contactObserverReset.observe(contactSection);

// Handle escape key to close footer
document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape' && isFooterVisible) {
		footerWrapper.classList.remove('visible');
		isFooterVisible = false;
		document.body.style.overflow = '';
		hasReachedBottom = false;
	}
});