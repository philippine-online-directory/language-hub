import test from 'node:test';
import assert from 'node:assert/strict';
import translationService, { findPublicTranslationBySlug } from './translationService.js';
import translationController from '../controllers/translationController.js';

test('findPublicTranslationBySlug uses the compound language and word slug lookup', async () => {
    let translationQuery;
    const prismaClient = {
        language: {
            findUnique: async () => ({ id: 'language-1', name: 'Cebuano', isoCode: 'ceb', slug: 'cebuano' })
        },
        translation: {
            findUnique: async (args) => {
                translationQuery = args;
                return {
                    id: 'translation-1',
                    slug: 'maayo',
                    wordText: 'Maayo',
                    englishDefinition: 'Good',
                    status: 'VERIFIED',
                    audioUrl: null,
                    author: { id: 'user-1', username: 'Maria' },
                    secondaryAuthors: [{ id: 'user-2', username: 'Jose' }],
                    setWords: [{ vocabSet: { id: 'set-1', name: 'Greetings', description: 'Useful words' } }]
                };
            }
        }
    };

    const result = await findPublicTranslationBySlug('cebuano', 'maayo', prismaClient);

    assert.deepEqual(translationQuery.where, {
        languageId_slug: { languageId: 'language-1', slug: 'maayo' }
    });
    assert.deepEqual(result.contributors, [
        { id: 'user-1', username: 'Maria' },
        { id: 'user-2', username: 'Jose' }
    ]);
    assert.deepEqual(result.publicSets, [
        { id: 'set-1', name: 'Greetings', description: 'Useful words' }
    ]);
});

test('findPublicTranslationBySlug returns null for unknown languages and words', async () => {
    const missingLanguageClient = {
        language: { findUnique: async () => null },
        translation: { findUnique: async () => assert.fail('word lookup should not run') }
    };
    assert.equal(await findPublicTranslationBySlug('missing', 'word', missingLanguageClient), null);

    const missingWordClient = {
        language: { findUnique: async () => ({ id: 'language-1', slug: 'cebuano' }) },
        translation: { findUnique: async () => null }
    };
    assert.equal(await findPublicTranslationBySlug('cebuano', 'missing', missingWordClient), null);
});

test('public word controller returns 404 for an unknown word', async () => {
    const originalLookup = translationService.findPublicTranslationBySlug;
    translationService.findPublicTranslationBySlug = async () => null;

    let statusCode;
    let responseBody;
    const res = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(body) {
            responseBody = body;
            return this;
        }
    };

    try {
        await translationController.getPublicTranslation[0](
            { params: { slug: 'cebuano', wordSlug: 'missing' } },
            res,
            assert.fail
        );
    } finally {
        translationService.findPublicTranslationBySlug = originalLookup;
    }

    assert.equal(statusCode, 404);
    assert.deepEqual(responseBody, { message: 'Word not found' });
});

test('public word controller caches complete verified words', async () => {
    const originalLookup = translationService.findPublicTranslationBySlug;
    translationService.findPublicTranslationBySlug = async () => ({
        wordText: 'Maayo',
        englishDefinition: 'Good',
        status: 'VERIFIED'
    });

    let cacheControl;
    const res = {
        set(name, value) {
            if (name === 'Cache-Control') cacheControl = value;
            return this;
        },
        status() { return this; },
        json() { return this; }
    };

    try {
        await translationController.getPublicTranslation[0](
            { params: { slug: 'cebuano', wordSlug: 'maayo' } },
            res,
            assert.fail
        );
    } finally {
        translationService.findPublicTranslationBySlug = originalLookup;
    }

    assert.match(cacheControl, /s-maxage=900/);
});
