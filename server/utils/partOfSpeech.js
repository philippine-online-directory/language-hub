export function normalizePartOfSpeech(value) {
    const normalized = String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
    return normalized || null;
}
