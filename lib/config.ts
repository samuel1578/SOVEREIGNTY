export const USE_MOCKS=process.env.NEXT_PUBLIC_USE_MOCKS!=='false'
// D4 — review mode is an explicit flag, independent of NODE_ENV, so production previews can be reviewed.
export const REVIEW=USE_MOCKS&&process.env.NEXT_PUBLIC_REVIEW==='1'
// F-015 — canonical origin for metadata, sitemap and robots. Never derived from the request Host header.
export const SITE_URL=(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000').replace(/\/+$/,'')
