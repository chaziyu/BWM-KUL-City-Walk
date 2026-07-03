/* global AbortController */

/**
 * Executes a fetch request with a bounded timeout.
 * @param {string} url 
 * @param {object} options 
 * @param {number} timeoutMs 
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeoutMs) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            const timeoutError = new Error('Service took too long; please retry');
            timeoutError.name = 'TimeoutError';
            timeoutError.status = 504;
            throw timeoutError;
        }
        throw error;
    }
}

/**
 * Executes a fetch request, parses JSON, and enforces timeouts and upstream error handling.
 * @param {string} url 
 * @param {object} options 
 * @param {number} timeoutMs 
 * @returns {Promise<any>}
 */
async function fetchJsonWithTimeout(url, options = {}, timeoutMs) {
    let response;
    try {
        response = await fetchWithTimeout(url, options, timeoutMs);
    } catch (error) {
        if (error.name === 'TimeoutError' || error.status === 504) {
            const err = new Error('Service took too long; please retry');
            err.status = 504;
            throw err;
        }
        const err = new Error('Service could not complete the request');
        err.status = 502;
        throw err;
    }

    if (!response.ok) {
        const err = new Error('Service could not complete the request');
        err.status = 502;
        throw err;
    }

    try {
        return await response.json();
    } catch (error) {
        const err = new Error('Service could not complete the request');
        err.status = 502;
        throw err;
    }
}

/**
 * Wraps a promise with a timeout.
 * @param {Promise<any>} promise 
 * @param {number} timeoutMs 
 * @returns {Promise<any>}
 */
function withTimeout(promise, timeoutMs) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            const err = new Error('Service took too long; please retry');
            err.status = 504;
            reject(err);
        }, timeoutMs);
    });

    return Promise.race([
        promise.then((res) => {
            clearTimeout(timeoutId);
            return res;
        }).catch((err) => {
            clearTimeout(timeoutId);
            throw err;
        }),
        timeoutPromise
    ]);
}

module.exports = {
    fetchWithTimeout,
    fetchJsonWithTimeout,
    withTimeout
};
