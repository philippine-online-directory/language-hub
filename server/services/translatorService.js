import prisma from '../prisma.js'
import { normalizePartOfSpeech } from '../utils/partOfSpeech.js'

const MAX_RESULTS = 50;

function findEnglishMatches(prismaClient, slug, word) {
    return prismaClient.$queryRaw`
        SELECT t."id", t."slug", t."wordText", t."englishDefinition", t."partOfSpeech", t."status"
        FROM "TranslationTerm" tt
        JOIN "Translation" t ON t."id" = tt."translationId"
        JOIN "Language" l ON l."id" = tt."languageId"
        WHERE l."slug" = ${slug}
          AND tt."term" = (
              SELECT q."term" FROM translation_english_terms(${word}) q ORDER BY q."position" LIMIT 1
          )
        ORDER BY tt."position", t."status" DESC, t."createdAt" DESC
        LIMIT ${MAX_RESULTS}`;
}

function findNativeMatches(prismaClient, slug, word) {
    return prismaClient.$queryRaw`
        SELECT t."id", t."slug", t."wordText", t."englishDefinition", t."partOfSpeech", t."status"
        FROM "Translation" t
        JOIN "Language" l ON l."id" = t."languageId"
        WHERE l."slug" = ${slug}
          AND lower(t."wordText") = lower(${word})
        ORDER BY t."status" DESC, t."createdAt" DESC
        LIMIT ${MAX_RESULTS}`;
}

export function groupTranslations(rows, direction) {
    const groups = new Map();

    for (const row of rows) {
        const partOfSpeech = normalizePartOfSpeech(row.partOfSpeech) ?? 'other';
        const entry = {
            id: row.id,
            slug: row.slug,
            text: direction === 'en-to-lang' ? row.wordText : row.englishDefinition,
            status: row.status
        };
        const entries = groups.get(partOfSpeech) ?? new Map();
        const key = entry.text.trim().toLowerCase();
        const existing = entries.get(key);

        if (!existing || (existing.status !== 'VERIFIED' && entry.status === 'VERIFIED')) {
            entries.set(key, entry);
        }
        groups.set(partOfSpeech, entries);
    }

    const groupList = [...groups].map(([partOfSpeech, entries]) => ({
        partOfSpeech,
        entries: [...entries.values()]
    }));
    const primary = groupList.length > 0
        ? { ...groupList[0].entries[0], partOfSpeech: groupList[0].partOfSpeech }
        : null;

    return { primary, groups: groupList };
}

async function translateWord(slug, word, direction, prismaClient = prisma) {
    if (!word || !word.trim()) {
        throw new Error('Word is required');
    }

    const trimmed = word.trim();

    if (direction !== 'en-to-lang' && direction !== 'lang-to-en') {
        throw new Error('Direction must be "en-to-lang" or "lang-to-en"');
    }

    const rows = direction === 'en-to-lang'
        ? await findEnglishMatches(prismaClient, slug, trimmed)
        : await findNativeMatches(prismaClient, slug, trimmed);

    return { query: trimmed, ...groupTranslations(rows, direction) };
}

const translatorService = {
    translateWord
};

export default translatorService;
