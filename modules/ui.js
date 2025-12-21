import { STRINGS } from '../localization.js';

// --- PREMIUM MODAL ANIMATION HELPERS ---
export function animateOpenModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden', 'modal-closing');
    modal.classList.add('modal-opening');

    // ACCESSIBILITY: Set focus to the first focusable element inside the modal
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const firstFocusableElement = modal.querySelectorAll(focusableElements)[0];
    if (firstFocusableElement) {
        setTimeout(() => firstFocusableElement.focus(), 100); // Small delay for visibility
    }
}

export function animateCloseModal(modal) {
    if (!modal || modal.classList.contains('hidden')) return;

    // Stop audio when site modal closes
    if (modal.id === 'siteModal') {
        const soundEffect2 = document.getElementById('soundEffect2');
        if (soundEffect2) {
            soundEffect2.pause();
            soundEffect2.currentTime = 0;
        }
    }

    modal.classList.remove('modal-opening');
    modal.classList.add('modal-closing');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('modal-closing');
    }, 400); // Match CSS cinematicFadeOut duration
}

// Helper for smooth screen transitions (e.g. Landing -> Gatekeeper)
export function animateScreenSwitch(fromScreen, toScreen) {
    if (!fromScreen || !toScreen) return;

    // 1. Fade out current screen
    fromScreen.classList.add('modal-closing'); // Clean fade out

    setTimeout(() => {
        fromScreen.classList.add('hidden');
        fromScreen.classList.remove('modal-closing');

        // 2. Show next screen with entry animation
        toScreen.classList.remove('hidden');
        // Re-trigger animation if class exists, or add it
        toScreen.classList.remove('animate-fade-scale');
        void toScreen.offsetWidth; // Trigger reflow
        toScreen.classList.add('animate-fade-scale');
    }, 400);
}

export function initGlobalUIListeners() {
    // ACCESSIBILITY: Global Key Listener for Escape and Tab Trapping
    document.addEventListener('keydown', (e) => {
        // 1. Close Modals on ESC
        if (e.key === 'Escape') {
            const sensitiveModals = ['#gatekeeper', '#landing-page']; // Don't close these on ESC
            const openModals = document.querySelectorAll('[role="dialog"]:not(.hidden)');

            openModals.forEach(modal => {
                if (!sensitiveModals.includes('#' + modal.id)) {
                    animateCloseModal(modal);
                    // Special case handling for overlays
                    if (modal.id === 'badgeInputModal') modal.classList.add('hidden');
                }
            });
        }

        // 2. Trap Focus in Modals
        if (e.key === 'Tab') {
            const openModal = document.querySelector('[role="dialog"]:not(.hidden)');
            if (openModal) {
                const focusableElements = openModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) { /* Shift + Tab */
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else { /* Tab */
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        }
    });

    // --- GLOBAL UI ZOOM LOGIC ---
    const btnUIZoomIn = document.getElementById('btnUIZoomIn');
    const btnUIZoomOut = document.getElementById('btnUIZoomOut');
    let currentRootFontSize = 100; // Percentage

    if (btnUIZoomIn && btnUIZoomOut) {
        btnUIZoomIn.addEventListener('click', () => {
            if (currentRootFontSize < 130) { // Max 130%
                currentRootFontSize += 10;
                document.documentElement.style.fontSize = `${currentRootFontSize}%`;
            }
        });

        btnUIZoomOut.addEventListener('click', () => {
            if (currentRootFontSize > 80) { // Min 80%
                currentRootFontSize -= 10;
                document.documentElement.style.fontSize = `${currentRootFontSize}%`;
            }
        });
    }
}
