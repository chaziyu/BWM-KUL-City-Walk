export let visitedSites = JSON.parse(localStorage.getItem('jejak_visited')) || [];
export let discoveredSites = JSON.parse(localStorage.getItem('jejak_discovered')) || [];
export let chatHistory = JSON.parse(localStorage.getItem('jejak_chat_history')) || [];
export let userMessageCount = parseInt(localStorage.getItem('jejak_message_count')) || 0;
export let solvedRiddle = JSON.parse(localStorage.getItem('jejak_solved_riddle')) || {};
export let lastActiveDay = localStorage.getItem('jejak_last_active_day');

// Get or Create a unique Device ID
export let deviceId = localStorage.getItem('bwm_device_id');
if (!deviceId) {
    deviceId = 'device-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('bwm_device_id', deviceId);
}

export function saveVisitedSites(sites) {
    visitedSites = sites;
    localStorage.setItem('jejak_visited', JSON.stringify(visitedSites));
}

export function saveDiscoveredSites(sites) {
    discoveredSites = sites;
    localStorage.setItem('jejak_discovered', JSON.stringify(discoveredSites));
}

export function saveChatHistory(history) {
    chatHistory = history;
    localStorage.setItem('jejak_chat_history', JSON.stringify(chatHistory));
}

export function saveUserMessageCount(count) {
    userMessageCount = count;
    localStorage.setItem('jejak_message_count', userMessageCount.toString());
}

export function saveSolvedRiddle(riddle) {
    solvedRiddle = riddle;
    localStorage.setItem('jejak_solved_riddle', JSON.stringify(solvedRiddle));
}

export function saveLastActiveDay(day) {
    lastActiveDay = day;
    localStorage.setItem('jejak_last_active_day', lastActiveDay);
}

export function addVisitedSite(siteId) {
    if (!visitedSites.includes(siteId)) {
        visitedSites.push(siteId);
        saveVisitedSites(visitedSites);
        return true;
    }
    return false;
}

export function addDiscoveredSite(siteId) {
    if (!discoveredSites.includes(siteId)) {
        discoveredSites.push(siteId);
        saveDiscoveredSites(discoveredSites);
        return true;
    }
    return false;
}
