export const SITE_URL = 'https://www.philippineonlinedictionary.com';
export const SITE_NAME = 'Philippine Online Dictionary';

export function getWordPath(translation) {
    const languageSlug = translation?.language?.slug;
    if (!languageSlug || !translation?.slug) return null;
    return `/languages/${languageSlug}/words/${translation.slug}`;
}

export function isIndexableWord(translation) {
    return translation?.status === 'VERIFIED'
        && Boolean(translation.wordText?.trim())
        && Boolean(translation.englishDefinition?.trim());
}

export function getWordMetadata(translation) {
    const path = getWordPath(translation);
    const title = `${translation.wordText} meaning in ${translation.language.name} | ${SITE_NAME}`;
    const description = `${translation.wordText} means “${translation.englishDefinition}” in ${translation.language.name}. See its pronunciation, examples, usage notes, and contributors.`;

    return {
        title,
        description: description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description,
        canonicalUrl: `${SITE_URL}${path}`,
        robots: isIndexableWord(translation) ? 'index,follow' : 'noindex,follow'
    };
}

export function getWordJsonLd(translation) {
    const path = getWordPath(translation);
    const canonicalUrl = `${SITE_URL}${path}`;
    const dictionaryUrl = `${SITE_URL}/languages/${translation.language.slug}`;

    return [
        {
            '@type': 'DefinedTerm',
            '@id': `${canonicalUrl}#term`,
            name: translation.wordText,
            description: translation.englishDefinition,
            url: canonicalUrl,
            inDefinedTermSet: {
                '@type': 'DefinedTermSet',
                name: `${translation.language.name} dictionary`,
                url: dictionaryUrl
            }
        },
        {
            '@type': 'BreadcrumbList',
            '@id': `${canonicalUrl}#breadcrumbs`,
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                { '@type': 'ListItem', position: 2, name: 'Languages', item: `${SITE_URL}/languages` },
                { '@type': 'ListItem', position: 3, name: translation.language.name, item: dictionaryUrl },
                { '@type': 'ListItem', position: 4, name: translation.wordText, item: canonicalUrl }
            ]
        }
    ];
}
