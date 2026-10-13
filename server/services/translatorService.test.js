import test from 'node:test';
import assert from 'node:assert/strict';
import translatorService, { groupTranslations } from './translatorService.js';

function row(overrides) {
    return {
        id: overrides.id,
        slug: overrides.slug ?? overrides.id,
        wordText: overrides.wordText ?? 'word',
        englishDefinition: overrides.englishDefinition ?? 'light',
        partOfSpeech: overrides.partOfSpeech ?? null,
        status: overrides.status ?? 'VERIFIED'
    };
}

function fakePrisma(...responses) {
    const calls = [];
    return {
        calls,
        $queryRaw: async (strings, ...values) => {
            calls.push({ sql: strings.join('?'), values });
            return responses.shift() ?? [];
        }
    };
}

test('groupTranslations groups by normalized part of speech in rank order', () => {
    const result = groupTranslations([
        row({ id: '1', wordText: 'lanyag', partOfSpeech: 'noun' }),
        row({ id: '2', wordText: 'hawang', partOfSpeech: 'Adjective' }),
        row({ id: '3', wordText: 'dêkêt', partOfSpeech: 'Noun' }),
        row({ id: '4', wordText: 'ilaw', partOfSpeech: null })
    ], 'en-to-lang');

    assert.deepEqual(
        result.groups.map((group) => [group.partOfSpeech, group.entries.map((entry) => entry.text)]),
        [['noun', ['lanyag', 'dêkêt']], ['adjective', ['hawang']], ['other', ['ilaw']]]
    );
});

test('groupTranslations merges duplicate words within a group and prefers verified entries', () => {
    const result = groupTranslations([
        row({ id: '1', wordText: 'atang', partOfSpeech: 'verb', status: 'UNVERIFIED' }),
        row({ id: '2', wordText: 'Atang', partOfSpeech: 'verb', status: 'VERIFIED' }),
        row({ id: '3', wordText: 'atang', partOfSpeech: 'noun' })
    ], 'en-to-lang');

    assert.deepEqual(result.groups, [
        { partOfSpeech: 'verb', entries: [{ id: '2', slug: '2', text: 'Atang', status: 'VERIFIED' }] },
        { partOfSpeech: 'noun', entries: [{ id: '3', slug: '3', text: 'atang', status: 'VERIFIED' }] }
    ]);
});

test('groupTranslations shows english definitions when translating to english', () => {
    const result = groupTranslations([
        row({ id: '1', wordText: 'pinu', englishDefinition: 'fine in texture', partOfSpeech: 'adjective' })
    ], 'lang-to-en');

    assert.equal(result.groups[0].entries[0].text, 'fine in texture');
});

test('groupTranslations exposes the top ranked entry as primary', () => {
    const result = groupTranslations([
        row({ id: '1', wordText: 'lanyag', partOfSpeech: 'Noun' }),
        row({ id: '2', wordText: 'hawang', partOfSpeech: 'adjective' })
    ], 'en-to-lang');

    assert.deepEqual(result.primary, {
        id: '1', slug: '1', text: 'lanyag', status: 'VERIFIED', partOfSpeech: 'noun'
    });
    assert.equal(groupTranslations([], 'en-to-lang').primary, null);
});

test('translateWord matches english queries against normalized definition terms', async () => {
    const prismaClient = fakePrisma([row({ id: '1', wordText: 'lanyag', partOfSpeech: 'noun' })]);

    const result = await translatorService.translateWord('tagbanua', '  Light ', 'en-to-lang', prismaClient);

    assert.equal(prismaClient.calls.length, 1);
    assert.match(prismaClient.calls[0].sql, /"TranslationTerm"/);
    assert.match(prismaClient.calls[0].sql, /translation_english_terms/);
    assert.deepEqual(prismaClient.calls[0].values.slice(0, 2), ['tagbanua', 'Light']);
    assert.equal(result.query, 'Light');
    assert.equal(result.primary.text, 'lanyag');
});

test('translateWord matches native queries against the word text', async () => {
    const prismaClient = fakePrisma([row({ id: '1', wordText: 'pinu', englishDefinition: 'fine' })]);

    const result = await translatorService.translateWord('tagbanua', 'Pinu', 'lang-to-en', prismaClient);

    assert.match(prismaClient.calls[0].sql, /lower\(t\."wordText"\) = lower\(/);
    assert.equal(result.primary.text, 'fine');
});

test('translateWord suggests similar english terms when nothing matches', async () => {
    const prismaClient = fakePrisma([], [{ term: 'ruun' }], [{ text: 'run' }, { text: 'rune' }]);

    const result = await translatorService.translateWord('sgb', 'To Ruun', 'en-to-lang', prismaClient);

    assert.equal(prismaClient.calls.length, 3);
    assert.match(prismaClient.calls[1].sql, /translation_english_terms/);
    assert.match(prismaClient.calls[2].sql, /tt\."term" %/);
    assert.ok(prismaClient.calls[2].values.includes('ruun'));
    assert.deepEqual(result.suggestions, ['run', 'rune']);
    assert.equal(result.primary, null);
});

test('translateWord suggests similar native words when nothing matches', async () => {
    const prismaClient = fakePrisma([], [{ text: 'pinu' }]);

    const result = await translatorService.translateWord('tagbanua', 'pinuu', 'lang-to-en', prismaClient);

    assert.match(prismaClient.calls[1].sql, /t\."wordText" %/);
    assert.deepEqual(result.suggestions, ['pinu']);
});

test('translateWord skips suggestions when results exist or the query is too short', async () => {
    const withResults = fakePrisma([row({ id: '1' })]);
    const shortQuery = fakePrisma([]);

    const found = await translatorService.translateWord('sgb', 'light', 'en-to-lang', withResults);
    const short = await translatorService.translateWord('sgb', 'ru', 'en-to-lang', shortQuery);

    assert.equal(withResults.calls.length, 1);
    assert.equal(shortQuery.calls.length, 1);
    assert.deepEqual(found.suggestions, []);
    assert.deepEqual(short.suggestions, []);
});

test('translateWord rejects invalid input', async () => {
    const prismaClient = fakePrisma();

    await assert.rejects(translatorService.translateWord('tagbanua', '  ', 'en-to-lang', prismaClient), /Word is required/);
    await assert.rejects(translatorService.translateWord('tagbanua', 'light', 'sideways', prismaClient), /Direction must be/);
    assert.equal(prismaClient.calls.length, 0);
});
