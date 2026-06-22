// storage-migration.js
// Handles localStorage data validation, versioning, and migration.

const LATEST_VERSION = 3;
const REMOVED_SITE_IDS = [];
const PROGRESS_NAMESPACES = ['demo', 'visitor'];

function scopedKey(name, namespace) {
    return `jejak_${namespace}_${name}`;
}

function migrateLegacyKey(name, fallback) {
    const legacyKey = `jejak_${name}`;
    const visitorKey = scopedKey(name, 'visitor');
    const legacyValue = localStorage.getItem(legacyKey);

    if (legacyValue !== null && localStorage.getItem(visitorKey) === null) {
        localStorage.setItem(visitorKey, legacyValue);
    } else if (legacyValue === null && localStorage.getItem(visitorKey) === null && fallback !== undefined) {
        localStorage.setItem(visitorKey, fallback);
    }

    localStorage.removeItem(legacyKey);
}

function validateArrayKey(keyName, namespace) {
    const key = scopedKey(keyName, namespace);
    const raw = localStorage.getItem(key);
    if (!raw) return;

    try {
        let values = JSON.parse(raw);
        if (!Array.isArray(values)) {
            console.warn(`Resetting corrupt ${key}`);
            values = [];
        }
        values = values.map(String).filter(id => !REMOVED_SITE_IDS.includes(id));
        localStorage.setItem(key, JSON.stringify(values));
    } catch (e) {
        console.error(`Error parsing ${key}, resetting.`, e);
        localStorage.setItem(key, '[]');
    }
}

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

        // Move old unscoped visitor progress into the visitor namespace.
        migrateLegacyKey('visited', '[]');
        migrateLegacyKey('discovered', '[]');
        migrateLegacyKey('chat_history', '[]');
        migrateLegacyKey('message_count', '0');
        migrateLegacyKey('last_active_day');
        migrateLegacyKey('solved_riddle', '{}');

        // Remove obsolete auth state. Local storage is no longer trusted for roles.
        localStorage.removeItem('jejak_session');
        localStorage.removeItem('jejak_interview_access');

        PROGRESS_NAMESPACES.forEach(namespace => {
            validateArrayKey('visited', namespace);
            validateArrayKey('discovered', namespace);

            const msgKey = scopedKey('message_count', namespace);
            let msgCount = localStorage.getItem(msgKey);
            if (msgCount && isNaN(parseInt(msgCount, 10))) {
                console.warn(`Resetting invalid message count for ${namespace}`);
                localStorage.setItem(msgKey, '0');
            }
        });

        // --- END MIGRATION LOGIC ---

        // Update version reference
        localStorage.setItem('jejak_db_version', LATEST_VERSION.toString());
        console.log('Migration complete.');

    } catch (err) {
        console.error('Critical error during storage migration:', err);
    }
}
