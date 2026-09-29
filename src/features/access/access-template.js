export function createLandingTemplate() {
  return `<div id="landing-page" class="ui-screen fixed inset-0 z-[6000] overflow-y-auto">
        <main class="landing-shell">
            <header class="landing-hero animate-fade-in">
                <div class="brand-lockup" aria-label="BWM KUL City Walk">
                    <span class="brand-mark" aria-hidden="true">BWM</span>
                    <span class="ui-kicker">Kuala Lumpur Heritage Walk</span>
                </div>
                <h1 class="ui-title">BWM KUL City Walk</h1>
                <p class="landing-lead">Explore the stories, architecture, and places that shape Kuala Lumpur's historic heart.</p>
                <div class="landing-meta" aria-label="Trail highlights">
                    <span>11 heritage stops</span>
                    <span>Self-guided</span>
                    <span>Mobile friendly</span>
                </div>
            </header>

            <section class="landing-actions ui-surface animate-slide-up" aria-label="Choose how to enter">
                <div class="landing-actions__header">
                    <p class="ui-kicker">Start your walk</p>
                    <p>Choose the option that matches your visit.</p>
                </div>

                <button id="btnVisitor" class="ui-button ui-button--primary">
                    <span class="access-action-icon" aria-hidden="true">01</span>
                    <span class="ui-button__copy">
                        <span class="ui-button__title">Enter Visitor Passkey</span>
                        <span class="ui-button__hint">I have an organiser-issued code</span>
                    </span>
                    <span class="access-action-arrow" aria-hidden="true">→</span>
                </button>

                <button id="btnExploreDemo" class="ui-button ui-button--secondary">
                    <span class="access-action-icon access-action-icon--soft" aria-hidden="true">02</span>
                    <span class="ui-button__copy">
                        <span class="ui-button__title">Explore Demo</span>
                        <span class="ui-button__hint">Preview the heritage trail instantly</span>
                    </span>
                    <span class="access-action-arrow" aria-hidden="true">→</span>
                </button>

                <button id="btnPreLoginHelp" class="ui-button ui-button--quiet">
                    <span aria-hidden="true">?</span>
                    <span>How to use this app</span>
                </button>

                <div class="landing-admin-row">
                    <button id="btnStaff" class="landing-admin-link">
                        Project Admin <span aria-hidden="true">·</span> Prototype
                    </button>
                </div>
            </section>

            <footer class="landing-footer">
                <div class="ui-notice prototype-notice">
                    <strong>Project prototype</strong>
                    Developed for Badan Warisan Malaysia. The admin workflow demonstrates a proposed organiser experience and is not currently operated by BWM.
                </div>
                <p>A SULAM Project by Universiti Malaya &amp; BWM</p>
            </footer>
        </main>
    </div>`;
}

export function createVisitorGateTemplate() {
  return `<div id="gatekeeper" class="ui-screen access-screen fixed inset-0 z-[7000] hidden overflow-y-auto">
        <main class="access-shell">
            <section class="ui-surface access-card animate-fade-scale" aria-labelledby="visitorAccessTitle">
                <button id="backToHome" type="button" class="access-back-button" aria-label="Back to start">
                    <span aria-hidden="true">←</span> Back
                </button>

                <div class="access-card__header">
                    <p class="ui-kicker">Visitor access</p>
                    <h2 id="visitorAccessTitle" class="ui-title">Enter your passkey</h2>
                    <p class="ui-copy">Use the code provided by the organiser to unlock the heritage walk on this device.</p>
                </div>

                <div class="access-form">
                    <label for="passcodeInput" class="ui-field-label">Visitor passkey</label>
                    <input
                        type="text"
                        id="passcodeInput"
                        placeholder="AB-12345"
                        autocomplete="one-time-code"
                        autocapitalize="characters"
                        spellcheck="false"
                        class="ui-field access-code-input"
                    >
                    <p class="ui-helper">Codes are case-insensitive and usually include a hyphen.</p>

                    <button id="unlockBtn" class="ui-button ui-button--primary">
                        Verify and continue
                        <span aria-hidden="true">→</span>
                    </button>
                    <p id="errorMsg" class="access-error hidden" role="alert">Invalid passkey.</p>
                </div>

                <div class="ui-notice">
                    <strong>Why a passkey?</strong>
                    It helps the organiser control access to the event experience and AI usage.
                </div>
            </section>
        </main>
    </div>`;
}

export function createPlatformWarningTemplate() {
  return `<div id="platformWarningModal" class="classic-modal-backdrop fixed inset-0 z-[8000] hidden" role="dialog" aria-modal="true" aria-labelledby="warningTitle">
        <div class="ui-surface access-dialog animate-fade-scale">
            <div class="access-dialog__header">
                <p class="ui-kicker">Before you continue</p>
                <h2 id="warningTitle" class="ui-title">Keep your passkey handy</h2>
                <p class="ui-copy">You can continue in your browser. Installing the app is optional.</p>
            </div>

            <div id="warningContent" class="ui-notice ui-notice--accent">
                <p></p>
            </div>

            <div class="ui-notice">
                <strong>Device validation</strong>
                This app sends a local device identifier with your passkey so the organiser validation service can apply its access policy. Clearing browser data can change that identifier.
            </div>

            <div class="passkey-copy-card">
                <label for="passkeyDisplay" class="ui-field-label">Your passkey</label>
                <div class="passkey-copy-row">
                    <input id="passkeyDisplay" type="text" readonly class="ui-field access-code-input">
                    <button id="copyPasskeyBtn" class="ui-button ui-button--secondary passkey-copy-button">
                        Copy
                    </button>
                </div>
                <p id="copySuccess" class="access-success hidden" role="status">Copied to clipboard.</p>
            </div>

            <div class="access-dialog__actions">
                <button id="continueLoginBtn" class="ui-button ui-button--primary">
                    Continue to the walk
                    <span aria-hidden="true">→</span>
                </button>
                <button id="cancelLoginBtn" class="ui-button ui-button--secondary">Cancel</button>
                <button id="whatIsPWABtn" class="ui-button ui-button--quiet">What is a PWA?</button>
            </div>
        </div>
    </div>`;
}

export function createMapErrorTemplate() {
  return `<div id="map-error-screen" class="ui-screen access-screen fixed inset-0 z-[7000] hidden overflow-y-auto">
        <main class="access-shell">
            <section class="ui-surface access-card access-card--compact">
                <div class="status-symbol" aria-hidden="true">!</div>
                <div class="access-card__header">
                    <p class="ui-kicker">Map unavailable</p>
                    <h2 class="ui-title">We couldn't load the heritage map</h2>
                    <p id="mapErrorMessage" class="ui-copy">Check your connection and try again.</p>
                </div>
                <div class="access-dialog__actions">
                    <button id="retryMapBtn" class="ui-button ui-button--primary">Retry map</button>
                    <button id="mapErrorBackBtn" class="ui-button ui-button--secondary">Back</button>
                </div>
            </section>
        </main>
    </div>`;
}

export function createAdminTemplate() {
  return `<div id="staff-screen" class="ui-screen access-screen fixed inset-0 z-[7000] hidden overflow-y-auto">
        <main class="access-shell">
            <section class="ui-surface access-card animate-fade-scale" aria-labelledby="adminTitle">
                <button id="closeStaffScreen" type="button" class="access-back-button" aria-label="Back to start">
                    <span aria-hidden="true">←</span> Back
                </button>

                <div class="access-card__header">
                    <p class="ui-kicker">Project admin · prototype</p>
                    <h2 id="adminTitle" class="ui-title">Organiser tools</h2>
                    <p class="ui-copy">Protected access for demonstrating the proposed visitor-passkey workflow.</p>
                </div>

                <div id="adminLoginForm" class="access-form">
                    <label for="adminPasswordInput" class="ui-field-label">Admin password</label>
                    <input
                        type="password"
                        id="adminPasswordInput"
                        autocomplete="current-password"
                        placeholder="Enter admin password"
                        class="ui-field"
                    >
                    <button id="adminLoginBtn" class="ui-button ui-button--primary">Sign in</button>
                    <p id="adminErrorMsg" class="access-error hidden" role="alert">Wrong password.</p>
                </div>

                <div id="adminResult" class="hidden">
                    <div class="ui-notice prototype-notice">
                        <strong>Prototype workflow</strong>
                        This interface demonstrates issuing visitor passkeys and managing event access. It is maintained for project demonstration and is not currently operated by BWM.
                    </div>

                    <p class="admin-date" id="passkeyDate"></p>
                    <div class="passkey-result-card">
                        <p id="passkeyResult">Click “Generate New Passkey” to create a code</p>
                        <p id="adminStatusMsg" class="hidden" role="status">New code generated</p>
                    </div>

                    <div class="access-dialog__actions">
                        <button id="adminGenerateBtn" class="ui-button ui-button--primary">Generate new passkey</button>
                        <button id="adminShareBtn" class="ui-button ui-button--secondary hidden">Share via email</button>
                        <button id="adminSwitchToMapBtn" class="ui-button ui-button--secondary">Switch to map</button>
                        <button id="adminLogoutBtn" class="ui-button ui-button--quiet">Log out</button>
                    </div>

                    <p class="admin-footnote">
                        AI API usage can be reviewed in the
                        <a href="https://console.cloud.google.com/apis/dashboard" target="_blank" rel="noopener noreferrer">Google Cloud API Dashboard</a>.
                    </p>
                </div>
            </section>
        </main>
    </div>`;
}

export function createAccessTemplate() {
  return [
    createLandingTemplate(),
    createVisitorGateTemplate(),
    createPlatformWarningTemplate(),
    createMapErrorTemplate(),
    createAdminTemplate(),
  ].join('\n');
}
