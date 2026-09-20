import test from 'node:test';
import assert from 'node:assert/strict';
import {
    getWordJsonLd,
    getWordMetadata,
    getWordPath,
    isIndexableWord
} from './wordEntry.js';

const verifiedWord = {
    slug: 'maayo',
    wordText: 'Maayo',
    englishDefinition: 'Good',
    status: 'VERIFIED',
    language: { name: 'Cebuano', slug: 'cebuano' }
};

test('word entry builds the canonical public route and unique metadata', () => {
    assert.equal(getWordPath(verifiedWord), '/languages/cebuano/words/maayo');
    assert.deepEqual(getWordMetadata(verifiedWord), {
        title: 'Maayo meaning in Cebuano | Philippine Online Dictionary',
        description: 'Maayo means “Good” in Cebuano. See its pronunciation, examples, usage notes, and contributors.',
        canonicalUrl: 'https://www.philippineonlinedictionary.com/languages/cebuano/words/maayo',
        robots: 'index,follow'
    });
});

test('only complete verified words are indexable', () => {
    assert.equal(isIndexableWord(verifiedWord), true);
    assert.equal(isIndexableWord({ ...verifiedWord, status: 'UNVERIFIED' }), false);
    assert.equal(isIndexableWord({ ...verifiedWord, englishDefinition: ' ' }), false);
});

test('word entry JSON-LD contains DefinedTerm and four-level breadcrumbs', () => {
    const graph = getWordJsonLd(verifiedWord);

    assert.equal(graph[0]['@type'], 'DefinedTerm');
    assert.equal(graph[0].name, 'Maayo');
    assert.equal(graph[1]['@type'], 'BreadcrumbList');
    assert.deepEqual(
        graph[1].itemListElement.map((item) => item.name),
        ['Home', 'Languages', 'Cebuano', 'Maayo']
    );
});
