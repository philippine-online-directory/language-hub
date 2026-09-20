import test from 'node:test';
import assert from 'node:assert/strict';
import { getSitemapXml } from './seoService.js';

test('sitemap includes only complete verified word records returned by its filtered query', async () => {
    let translationQuery;
    const prismaClient = {
        language: { findMany: async () => [] },
        vocabSet: { findMany: async () => [] },
        user: { findMany: async () => [] },
        translation: {
            findMany: async (args) => {
                translationQuery = args;
                return [{
                    slug: 'maayo',
                    wordText: 'Maayo',
                    englishDefinition: 'Good',
                    publishedAt: new Date('2026-09-18T00:00:00Z'),
                    createdAt: new Date('2026-09-17T00:00:00Z'),
                    language: { slug: 'cebuano' }
                }, {
                    slug: 'incomplete-word',
                    wordText: 'Incomplete',
                    englishDefinition: ' ',
                    publishedAt: new Date('2026-09-18T00:00:00Z'),
                    createdAt: new Date('2026-09-17T00:00:00Z'),
                    language: { slug: 'cebuano' }
                }];
            }
        }
    };

    const sitemap = await getSitemapXml(prismaClient);

    assert.deepEqual(translationQuery.where, {
        status: 'VERIFIED',
        wordText: { not: '' },
        englishDefinition: { not: '' }
    });
    assert.match(sitemap, /\/languages\/cebuano\/words\/maayo/);
    assert.match(sitemap, /<lastmod>2026-09-18<\/lastmod>/);
    assert.doesNotMatch(sitemap, /incomplete-word/);
});
