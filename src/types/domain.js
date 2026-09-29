/**
 * @typedef {'guest' | 'demo' | 'visitor' | 'admin'} SessionRole
 */

/**
 * @typedef {'must_visit' | 'recommended'} SiteCategory
 */

/**
 * @typedef {{
 *   marker: [number, number]
 * }} SiteCoordinates
 */

/**
 * @typedef {{
 *   id: string | number,
 *   name: string,
 *   category: SiteCategory,
 *   coordinates?: SiteCoordinates
 * }} HeritageSite
 */

/**
 * @typedef {{
 *   authenticated: boolean,
 *   role: SessionRole,
 *   accessType: string,
 *   progressNamespace: string | null,
 *   chatLimit: number,
 *   remainingQuota?: number | null,
 *   allowedUI: string[],
 *   expiresAt?: number,
 *   localOnly?: boolean
 * }} AppSession
 */

/**
 * @typedef {{
 *   visitedSites: string[],
 *   discoveredSites: string[],
 *   completedIds: string[],
 *   count: number,
 *   total: number,
 *   isComplete: boolean
 * }} ProgressState
 */

/**
 * @typedef {{ type: 'general' } | { type: 'site', siteId: string }} ChatContext
 */

/**
 * @typedef {{
 *   reply: string,
 *   sourceSiteIds?: string[],
 *   notFound?: boolean,
 *   confidence?: 'high' | 'medium' | 'low',
 *   remainingQuota?: number | null
 * }} ChatResponse
 */

export {};
