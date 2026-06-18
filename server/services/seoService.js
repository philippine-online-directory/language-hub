import prisma from '../prisma.js';

const SITE_URL = (process.env.SITE_URL || 'https://www.philippineonlinedictionary.com').replace(/\/$/, '');
const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
const INDEXNOW_ENDPOINT = process.env.INDEXNOW_ENDPOINT || 'https://api.indexnow.org/indexnow';
const INDEXNOW_KEY_PATH = '/indexnow-key.txt';

const STATIC_ROUTES = [
    '/',
    '/languages',
    '/common-words',
    '/about',
    '/site-guide',
    '/translate',
    '/sets',
    '/users',
];

function absoluteUrl(path) {
    return `${SITE_URL}${path}`;
}

function getSiteHost() {
    return new URL(SITE_URL).host;
}

function getIndexNowKey() {
    return INDEXNOW_KEY || null;
}

function getIndexNowKeyLocation() {
    return absoluteUrl(INDEXNOW_KEY_PATH);
}

function normalizeSubmittedUrl(value) {
    let url;

    try {
        url = value.startsWith('/')
            ? new URL(value, SITE_URL)
            : new URL(value);
    } catch (err) {
        const invalidUrlError = new Error(`Invalid IndexNow URL: ${value}`);
        invalidUrlError.statusCode = 400;
        throw invalidUrlError;
    }

    if (!['http:', 'https:'].includes(url.protocol) || url.host !== getSiteHost()) {
        const invalidHostError = new Error(`Invalid IndexNow URL: ${value}`);
        invalidHostError.statusCode = 400;
        throw invalidHostError;
    }

    return url.href;
}

function escapeXml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');
}

function formatDate(date) {
    if (!date) return null;
    return new Date(date).toISOString().split('T')[0];
}

function renderUrl({ loc, lastmod }) {
    const lastmodTag = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : '';

    return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodTag}\n  </url>`;
}

async function getSitemapXml() {
    const [languages, sets, profiles] = await Promise.all([
        prisma.language.findMany({
            select: {
                slug: true,
            },
            orderBy: {
                name: 'asc',
            },
        }),
        prisma.vocabSet.findMany({
            where: {
                isPublic: true,
            },
            select: {
                id: true,
                updatedAt: true,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        }),
        prisma.user.findMany({
            where: {
                OR: [
                    { contributions: { some: { status: 'VERIFIED' } } },
                    { createdSets: { some: { isPublic: true } } },
                ],
            },
            select: {
                id: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        }),
    ]);

    const urls = [
        ...STATIC_ROUTES.map((route) => ({ loc: absoluteUrl(route) })),
        ...languages.flatMap((language) => [
            { loc: absoluteUrl(`/languages/${language.slug}`) },
            { loc: absoluteUrl(`/languages/${language.slug}/missing-words`) },
        ]),
        ...sets.map((set) => ({
            loc: absoluteUrl(`/sets/${set.id}`),
            lastmod: formatDate(set.updatedAt),
        })),
        ...profiles.map((profile) => ({
            loc: absoluteUrl(`/profile/${profile.id}`),
            lastmod: formatDate(profile.createdAt),
        })),
    ];

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        urls.map(renderUrl).join('\n'),
        '</urlset>',
    ].join('\n');
}

async function submitIndexNowUrls(urls) {
    if (!INDEXNOW_KEY) {
        const err = new Error('INDEXNOW_KEY is not configured');
        err.statusCode = 400;
        throw err;
    }

    const urlList = [...new Set(urls.map(normalizeSubmittedUrl))];

    const response = await fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({
            host: getSiteHost(),
            key: INDEXNOW_KEY,
            keyLocation: getIndexNowKeyLocation(),
            urlList,
        }),
    });

    if (!response.ok && response.status !== 202) {
        const err = new Error(`IndexNow submission failed with status ${response.status}`);
        err.statusCode = 502;
        throw err;
    }

    return {
        status: response.status,
        submitted: urlList.length,
    };
}

const seoService = {
    getSitemapXml,
    getIndexNowKey,
    submitIndexNowUrls,
};

export default seoService;
