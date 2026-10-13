import prisma from '../prisma.js'
import { normalizePartOfSpeech } from '../utils/partOfSpeech.js'

const MAX_RESULTS = 50;
const MAX_SUGGESTIONS = 3;
const MIN_SUGGESTION_LENGTH = 3;
const MAX_SUGGESTION_WORDS = 3;

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

// The term is resolved first and passed as a bound value so the planner
// can use the trigram index instead of scanning the language's terms.
async function suggestEnglishTerms(prismaClient, slug, word) {
    const [normalized] = await prismaClient.$queryRaw`
        SELECT "term" FROM translation_english_terms(${word}) ORDER BY "position" LIMIT 1`;
    if (!normalized) return [];

    return prismaClient.$queryRaw`
        SELECT DISTINCT tt."term" AS "text", similarity(tt."term", ${normalized.term}) AS "score"
        FROM "TranslationTerm" tt
        JOIN "Language" l ON l."id" = tt."languageId"
        WHERE l."slug" = ${slug}
          AND tt."term" % ${normalized.term}
          AND cardinality(string_to_array(tt."term", ' ')) <= ${MAX_SUGGESTION_WORDS}
        ORDER BY "score" DESC, "text"
        LIMIT ${MAX_SUGGESTIONS}`;
}

function suggestNativeWords(prismaClient, slug, word) {
    return prismaClient.$queryRaw`
        SELECT min(t."wordText") AS "text", max(similarity(t."wordText", ${word})) AS "score"
        FROM "Translation" t
        JOIN "Language" l ON l."id" = t."languageId"
        WHERE l."slug" = ${slug}
          AND t."wordText" % ${word}
        GROUP BY lower(t."wordText")
        ORDER BY "score" DESC, "text"
        LIMIT ${MAX_SUGGESTIONS}`;
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

    const isEnglish = direction === 'en-to-lang';
    const rows = isEnglish
        ? await findEnglishMatches(prismaClient, slug, trimmed)
        : await findNativeMatches(prismaClient, slug, trimmed);

    let suggestions = [];
    if (rows.length === 0 && trimmed.length >= MIN_SUGGESTION_LENGTH) {
        const suggestionRows = isEnglish
            ? await suggestEnglishTerms(prismaClient, slug, trimmed)
            : await suggestNativeWords(prismaClient, slug, trimmed);
        suggestions = suggestionRows.map((suggestion) => suggestion.text);
    }

    return { query: trimmed, ...groupTranslations(rows, direction), suggestions };
}

const translatorService = {
    translateWord
};

export default translatorService;
