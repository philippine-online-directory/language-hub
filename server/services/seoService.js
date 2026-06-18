import prisma from '../prisma.js';

const SITE_URL = process.env.SITE_URL || 'https://www.philippineonlinedictionary.com';

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

const seoService = {
    getSitemapXml,
};

export default seoService;
