// storage-migration.js
// Handles localStorage data validation, versioning, and migration.

const LATEST_VERSION = 1;
const REMOVED_SITE_IDS = ['8', '10'];

/**
 * Validates and upgrades localStorage data to the latest schema version.
 * Should be called before the app initializes its state variables.
 */
export function migrateData() {
    try {
        console.log('Checking storage for migration...');

        // 1. Get current version
        let currentVersion = Number(localStorage.getItem('jejak_db_version')) || 0;

        if (currentVersion === LATEST_VERSION) {
            console.log('Storage is up to date (v' + LATEST_VERSION + ').');
            return;
        }

        console.log(`Migrating storage from v${currentVersion} to v${LATEST_VERSION}...`);

        // --- MIGRATION LOGIC ---

        // Fix: Ensure visitedSites is an array and filter removed IDs
        let visitedRaw = localStorage.getItem('jejak_visited');
        if (visitedRaw) {
            try {
                let visited = JSON.parse(visitedRaw);
                if (!Array.isArray(visited)) {
                    console.warn('Resetting corrupt visitedSites');
                    visited = [];
                }
                // Filter out deprecated IDs
                const originalLen = visited.length;
                visited = visited.map(String).filter(id => !REMOVED_SITE_IDS.includes(id));

                if (visited.length !== originalLen) {
                    console.log('Removed deprecated sites from visited list.');
                }
                localStorage.setItem('jejak_visited', JSON.stringify(visited));
            } catch (e) {
                console.error('Error parsing visitedSites, resetting.', e);
                localStorage.setItem('jejak_visited', '[]');
            }
        }

        // Fix: Ensure discoveredSites is an array and filter removed IDs
        let discoveredRaw = localStorage.getItem('jejak_discovered');
        if (discoveredRaw) {
            try {
                let discovered = JSON.parse(discoveredRaw);
                if (!Array.isArray(discovered)) {
                    console.warn('Resetting corrupt discoveredSites');
                    discovered = [];
                }
                // Filter out deprecated IDs
                discovered = discovered.map(String).filter(id => !REMOVED_SITE_IDS.includes(id));
                localStorage.setItem('jejak_discovered', JSON.stringify(discovered));
            } catch (e) {
                console.error('Error parsing discoveredSites, resetting.', e);
                localStorage.setItem('jejak_discovered', '[]');
            }
        }

        // Fix: Ensure message count is a valid number
        let msgCount = localStorage.getItem('jejak_message_count');
        if (msgCount && isNaN(parseInt(msgCount))) {
            console.warn('Resetting invalid message count');
            localStorage.setItem('jejak_message_count', '0');
        }

        // --- END MIGRATION LOGIC ---

        // Update version reference
        localStorage.setItem('jejak_db_version', LATEST_VERSION.toString());
        console.log('Migration complete.');

    } catch (err) {
        console.error('Critical error during storage migration:', err);
    }
}
