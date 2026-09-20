import test from 'node:test';
import assert from 'node:assert/strict';
import {
    allocateTranslationSlugs,
    createTranslationWithSlug,
    getTranslationSlugBase
} from '../utils/translationSlug.js';

test('getTranslationSlugBase creates readable slugs and handles empty results', () => {
    assert.equal(getTranslationSlugBase('  Maáyo nga adlaw  '), 'maayo-nga-adlaw');
    assert.equal(getTranslationSlugBase('***'), 'word');
});

test('allocateTranslationSlugs safely backfills collisions within each language', () => {
    const translations = allocateTranslationSlugs([
        { id: '1', languageId: 'ceb', wordText: 'Maayo' },
        { id: '2', languageId: 'ceb', wordText: 'Maayo' },
        { id: '3', languageId: 'ceb', wordText: 'Maayo' },
        { id: '4', languageId: 'tgl', wordText: 'Maayo' }
    ]);

    assert.deepEqual(
        translations.map(({ languageId, slug }) => ({ languageId, slug })),
        [
            { languageId: 'ceb', slug: 'maayo' },
            { languageId: 'ceb', slug: 'maayo-2' },
            { languageId: 'ceb', slug: 'maayo-3' },
            { languageId: 'tgl', slug: 'maayo' }
        ]
    );
});

test('createTranslationWithSlug retries duplicate slugs', async () => {
    const attemptedSlugs = [];
    const prismaClient = {
        translation: {
            create: async (args) => {
                attemptedSlugs.push(args.data.slug);
                if (attemptedSlugs.length < 3) {
                    throw { code: 'P2002', meta: { target: ['languageId', 'slug'] } };
                }
                return args.data;
            }
        }
    };

    const result = await createTranslationWithSlug(prismaClient, {
        data: { languageId: 'ceb', wordText: 'Maayo' }
    });

    assert.deepEqual(attemptedSlugs, ['maayo', 'maayo-2', 'maayo-3']);
    assert.equal(result.slug, 'maayo-3');
});

test('createTranslationWithSlug resolves concurrent collisions through the unique constraint', async () => {
    const claimedSlugs = new Set();
    const prismaClient = {
        translation: {
            create: async (args) => {
                await Promise.resolve();
                const key = `${args.data.languageId}:${args.data.slug}`;
                if (claimedSlugs.has(key)) {
                    throw { code: 'P2002', meta: { target: ['languageId', 'slug'] } };
                }
                claimedSlugs.add(key);
                return args.data;
            }
        }
    };

    const [first, second] = await Promise.all([
        createTranslationWithSlug(prismaClient, { data: { languageId: 'ceb', wordText: 'Maayo' } }),
        createTranslationWithSlug(prismaClient, { data: { languageId: 'ceb', wordText: 'Maayo' } })
    ]);

    assert.deepEqual(new Set([first.slug, second.slug]), new Set(['maayo', 'maayo-2']));
});
