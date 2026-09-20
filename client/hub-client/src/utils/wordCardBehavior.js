export function getWordCardToggleTarget(isExpanded, translationId, action) {
    if (action === 'expand' && !isExpanded) {
        return translationId;
    }

    if (action === 'collapse' && isExpanded) {
        return null;
    }

    return undefined;
}
