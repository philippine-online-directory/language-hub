import test from 'node:test';
import assert from 'node:assert/strict';
import { getWordCardToggleTarget } from './wordCardBehavior.js';

test('collapsed card empty space and Quick view both expand the word', () => {
    assert.equal(getWordCardToggleTarget(false, 'word-1', 'card'), 'word-1');
    assert.equal(getWordCardToggleTarget(false, 'word-1', 'expand'), 'word-1');
});

test('expanded card empty space does nothing and Collapse closes it', () => {
    assert.equal(getWordCardToggleTarget(true, 'word-1', 'card'), undefined);
    assert.equal(getWordCardToggleTarget(true, 'word-1', 'collapse'), null);
});
