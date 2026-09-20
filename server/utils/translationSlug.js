import { slugify } from './slugify.js';

const MAX_SLUG_ATTEMPTS = 10000;

export function getTranslationSlugBase(wordText) {
    return slugify(wordText) || 'word';
}

export function allocateTranslationSlugs(translations) {
    const usedByLanguage = new Map();

    return translations.map((translation) => {
        const used = usedByLanguage.get(translation.languageId) ?? new Set();
        const baseSlug = getTranslationSlugBase(translation.wordText);
        let slug = baseSlug;
        let suffix = 2;

        while (used.has(slug)) {
            slug = `${baseSlug}-${suffix}`;
            suffix += 1;
        }

        used.add(slug);
        usedByLanguage.set(translation.languageId, used);

        return { ...translation, slug };
    });
}

function isSlugCollision(error) {
    if (error?.code !== 'P2002') return false;

    const target = error.meta?.target;
    if (!target) return true;

    const targetText = Array.isArray(target) ? target.join(',') : String(target);
    return targetText.includes('slug') && targetText.includes('languageId');
}

export async function createTranslationWithSlug(prismaClient, createArgs) {
    const baseSlug = getTranslationSlugBase(createArgs.data.wordText);

    for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt += 1) {
        const slug = attempt === 1 ? baseSlug : `${baseSlug}-${attempt}`;

        try {
            return await prismaClient.translation.create({
                ...createArgs,
                data: {
                    ...createArgs.data,
                    slug
                }
            });
        } catch (error) {
            if (!isSlugCollision(error) || attempt === MAX_SLUG_ATTEMPTS) {
                throw error;
            }
        }
    }
}
