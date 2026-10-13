import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePartOfSpeech } from '../utils/partOfSpeech.js';

test('normalizePartOfSpeech lowercases and collapses whitespace', () => {
    assert.equal(normalizePartOfSpeech('Verb'), 'verb');
    assert.equal(normalizePartOfSpeech('  Stative   Verb '), 'stative verb');
});

test('normalizePartOfSpeech returns null for missing values', () => {
    assert.equal(normalizePartOfSpeech(null), null);
    assert.equal(normalizePartOfSpeech(undefined), null);
    assert.equal(normalizePartOfSpeech('   '), null);
});
