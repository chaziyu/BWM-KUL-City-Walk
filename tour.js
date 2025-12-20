// ==========================================
// INTERACTIVE TOUR SYSTEM
// ==========================================

const tourSteps = [
    {
        target: '#map',
        title: 'Welcome to KUL City Walk! 🎉',
        description: 'Discover 11 heritage sites around Kuala Lumpur. Let\'s take a quick 30-second tour to show you around!',
        position: 'center'
    },
    {
        target: '.leaflet-control-zoom',
        title: 'Map Controls 🗺️',
        description: 'Use these buttons to zoom in/out and interact with the map. You can also pinch to zoom on mobile!',
        position: 'right'
    },
    {
        target: '#progress-container',
        title: 'Track Your Progress 📊',
        description: 'See how many heritage sites you\'ve collected here. Your goal is to visit all 11 sites!',
        position: 'bottom'
    },
    {
        target: '#btnPassport',
        title: 'Your Digital Passport 📖',
        description: 'View all your collected stamps and badges in your beautiful digital passport.',
        position: 'left'
    },
    {
        target: '#btnChat',
        title: 'AI Tour Guide 💬',
        description: 'Have questions? Ask our friendly AI assistant anything about the heritage sites!',
        position: 'left'
    },
    {
        target: null, // Will be set dynamically when showing site modal
        title: 'Explore Heritage Sites 🏛️',
        description: 'Tap any site marker on the map to learn more, check in, get directions, and find nearby food & hotels!',
        position: 'center'
    },
    {
        target: null,
        title: 'You\'re All Set! 🎊',
        description: 'Need help again? Just tap the purple ? button anytime. Happy exploring!',
        position: 'center'
    }
];

let currentTourStep = 0;
let tourActive = false;

function initTourSystem() {
    console.log('🎓 Initializing Tour System');
    const tourOverlay = document.getElementById('tourOverlay');
    const tourNext = document.getElementById('tourNext');
    const tourBack = document.getElementById('tourBack');
    const tourSkip = document.getElementById('tourSkip');

    if (!tourOverlay) {
        console.error('❌ Tour overlay not found - tour system disabled');
        return;
    }

    console.log('✅ Tour overlay found');

    // Setup help button if it exists
    function setupHelpButton() {
        const helpBtn = document.getElementById('btnHelp');

        if (!helpBtn) {
            console.log('⏳ Help button not found yet, will retry...');
            return false;
        }

        if (helpBtn.dataset.tourSetup === 'true') {
            console.log('ℹ️ Help button already setup');
            return true;
        }

        // Mark as setup to avoid duplicates
        helpBtn.dataset.tourSetup = 'true';

        // Add click handler
        helpBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Help button clicked - starting tour');
            startTour();
        }, { passive: false });

        console.log('✅ Help button tour listener attached successfully');
        return true;
    }

    // Try to setup immediately
    const initialSetup = setupHelpButton();

    // If not found immediately, watch for it to appear
    if (!initialSetup) {
        console.log('👀 Setting up MutationObserver to watch for help button');
        const observer = new MutationObserver((mutations) => {
            if (setupHelpButton()) {
                console.log('✅ Help button found and setup via MutationObserver');
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Tour navigation
    if (tourNext) {
        tourNext.addEventListener('click', () => {
            if (currentTourStep < tourSteps.length - 1) {
                currentTourStep++;
                showTourStep(currentTourStep);
            } else {
                endTour();
            }
        });
    }

    if (tourBack) {
        tourBack.addEventListener('click', () => {
            if (currentTourStep > 0) {
                currentTourStep--;
                showTourStep(currentTourStep);
            }
        });
    }

    if (tourSkip) {
        tourSkip.addEventListener('click', () => {
            endTour();
        });
    }

    // Auto-start tour for first-time users
    checkFirstTimeUser();
}

function checkFirstTimeUser() {
    const userProgress = JSON.parse(localStorage.getItem('userProgress') || '{}');

    // If tutorial never completed and user logged in
    if (!userProgress.tutorialCompleted) {
        // Show tour after 2 seconds (give time to see the app first)
        setTimeout(() => {
            const sessionData = JSON.parse(localStorage.getItem('jejak_session'));
            if (sessionData && sessionData.valid) {
                startTour();
            }
        }, 2000);
    }
}

function startTour() {
    tourActive = true;
    currentTourStep = 0;
    const tourOverlay = document.getElementById('tourOverlay');
    tourOverlay.classList.remove('hidden');
    showTourStep(0);
}

function endTour() {
    tourActive = false;
    const tourOverlay = document.getElementById('tourOverlay');
    tourOverlay.classList.add('hidden');

    // Mark tutorial as completed
    const userProgress = JSON.parse(localStorage.getItem('userProgress') || '{}');
    userProgress.tutorialCompleted = true;
    localStorage.setItem('userProgress', JSON.stringify(userProgress));

    // Remove pulse animation from help button
    const btnHelp = document.getElementById('btnHelp');
    if (btnHelp) {
        btnHelp.classList.remove('animate-pulse-once');
    }
}

function showTourStep(stepIndex) {
    const step = tourSteps[stepIndex];
    const spotlight = document.getElementById('tourSpotlight');
    const tooltip = document.getElementById('tourTooltip');
    const title = document.getElementById('tourTitle');
    const description = document.getElementById('tourDescription');
    const stepCounter = document.getElementById('tourStep');
    const backBtn = document.getElementById('tourBack');
    const nextBtn = document.getElementById('tourNext');

    // Update content
    title.textContent = step.title;
    description.textContent = step.description;
    stepCounter.textContent = `${stepIndex + 1} of ${tourSteps.length}`;

    // Update button states
    backBtn.disabled = stepIndex === 0;
    nextBtn.textContent = stepIndex === tourSteps.length - 1 ? 'Got it!' : 'Next →';

    // Position spotlight and tooltip
    if (step.target) {
        const targetElement = document.querySelector(step.target);
        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();

            // Position spotlight
            spotlight.style.left = `${rect.left - 10}px`;
            spotlight.style.top = `${rect.top - 10}px`;
            spotlight.style.width = `${rect.width + 20}px`;
            spotlight.style.height = `${rect.height + 20}px`;
            spotlight.style.opacity = '1';

            // Position tooltip based on position preference
            positionTooltip(tooltip, rect, step.position);
        }
    } else {
        // Center-positioned step (no specific target)
        spotlight.style.opacity = '0';
        tooltip.style.left = '50%';
        tooltip.style.top = '50%';
        tooltip.style.transform = 'translate(-50%, -50%)';
    }
}

function positionTooltip(tooltip, targetRect, position) {
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 20;

    switch (position) {
        case 'right':
            tooltip.style.left = `${targetRect.right + padding}px`;
            tooltip.style.top = `${targetRect.top}px`;
            tooltip.style.transform = 'none';
            break;
        case 'left':
            tooltip.style.left = `${targetRect.left - tooltipRect.width - padding}px`;
            tooltip.style.top = `${targetRect.top}px`;
            tooltip.style.transform = 'none';
            break;
        case 'bottom':
            tooltip.style.left = `${targetRect.left}px`;
            tooltip.style.top = `${targetRect.bottom + padding}px`;
            tooltip.style.transform = 'none';
            break;
        case 'center':
        default:
            tooltip.style.left = '50%';
            tooltip.style.top = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            break;
    }
}

// Initialize tour system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTourSystem);
} else {
    initTourSystem();
}
