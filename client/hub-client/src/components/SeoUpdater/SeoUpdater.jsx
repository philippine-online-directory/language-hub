import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://www.philippineonlinedictionary.com';
const SITE_NAME = 'Philippine Online Dictionary';
const DEFAULT_DESCRIPTION = 'Explore community-built dictionaries for Philippine languages, contribute translations, and help preserve endangered languages.';

function titleFromSlug(slug = '') {
    return slug
        .split('-')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function getMetadata(pathname) {
    const languageMatch = pathname.match(/^\/languages\/([^/]+)$/);
    const missingWordsMatch = pathname.match(/^\/languages\/([^/]+)\/missing-words$/);
    const setMatch = pathname.match(/^\/sets\/([^/]+)$/);
    const profileMatch = pathname.match(/^\/profile\/([^/]+)$/);

    if (pathname === '/') {
        return {
            title: 'Philippine Online Dictionary | Preserve Languages',
            description: DEFAULT_DESCRIPTION,
        };
    }

    if (pathname === '/languages') {
        return {
            title: 'Philippine Language Dictionaries | POD',
            description: 'Browse dictionaries for Philippine languages, explore community translations, and help document endangered languages.',
        };
    }

    if (languageMatch) {
        const languageName = titleFromSlug(languageMatch[1]);
        return {
            title: `${languageName} Dictionary | POD`,
            description: `Browse ${languageName} words, definitions, pronunciations, and community-contributed translations.`,
        };
    }

    if (missingWordsMatch) {
        const languageName = titleFromSlug(missingWordsMatch[1]);
        return {
            title: `${languageName} Missing Common Words | POD`,
            description: `Help complete the ${languageName} dictionary by contributing missing common words and translations.`,
        };
    }

    if (pathname === '/common-words') {
        return {
            title: 'Common Words for Philippine Languages | POD',
            description: 'Browse common words used to track dictionary completion across Philippine languages.',
        };
    }

    if (pathname === '/translate') {
        return {
            title: 'Translate Philippine Language Words | POD',
            description: 'Look up words across Philippine language dictionaries using community-contributed translations.',
        };
    }

    if (pathname === '/about') {
        return {
            title: `About ${SITE_NAME}`,
            description: 'Learn how Philippine Online Dictionary helps communities preserve and share endangered Philippine languages.',
        };
    }

    if (pathname === '/site-guide') {
        return {
            title: `Site Guide | ${SITE_NAME}`,
            description: 'Learn how to browse dictionaries, contribute translations, create study sets, and use language learning games.',
        };
    }

    if (pathname === '/sets') {
        return {
            title: 'Language Learning Sets and Games | POD',
            description: 'Create, discover, and practice Philippine language vocabulary sets with flashcards, matching, and writing games.',
        };
    }

    if (setMatch) {
        return {
            title: `Vocabulary Set | ${SITE_NAME}`,
            description: 'Practice a public Philippine language vocabulary set with flashcards, matching, and writing games.',
        };
    }

    if (pathname === '/users') {
        return {
            title: `Community Contributors | ${SITE_NAME}`,
            description: 'Meet community members contributing words and translations to Philippine Online Dictionary.',
        };
    }

    if (profileMatch && profileMatch[1] !== 'me') {
        return {
            title: `Contributor Profile | ${SITE_NAME}`,
            description: 'View a community contributor profile and public Philippine language vocabulary sets.',
        };
    }

    if (pathname === '/register') {
        return {
            title: `Join ${SITE_NAME}`,
            description: 'Create an account to contribute Philippine language translations and build vocabulary sets.',
        };
    }

    if (pathname === '/login') {
        return {
            title: `Log In | ${SITE_NAME}`,
            description: 'Log in to contribute translations and manage your Philippine language learning sets.',
        };
    }

    return {
        title: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
    };
}

function upsertMeta(selector, attributes) {
    let tag = document.head.querySelector(selector);

    if (!tag) {
        tag = document.createElement('meta');
        document.head.appendChild(tag);
    }

    Object.entries(attributes).forEach(([key, value]) => {
        tag.setAttribute(key, value);
    });
}

function upsertCanonical(href) {
    let tag = document.head.querySelector('link[rel="canonical"]');

    if (!tag) {
        tag = document.createElement('link');
        tag.setAttribute('rel', 'canonical');
        document.head.appendChild(tag);
    }

    tag.setAttribute('href', href);
}

export default function SeoUpdater() {
    const location = useLocation();

    useEffect(() => {
        const pathname = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '');
        const canonicalPath = pathname === '/' ? '/' : pathname;
        const canonicalUrl = `${SITE_URL}${canonicalPath}`;
        const metadata = getMetadata(pathname);

        document.title = metadata.title;

        upsertMeta('meta[name="description"]', {
            name: 'description',
            content: metadata.description,
        });
        upsertMeta('meta[property="og:site_name"]', {
            property: 'og:site_name',
            content: SITE_NAME,
        });
        upsertMeta('meta[property="og:title"]', {
            property: 'og:title',
            content: metadata.title,
        });
        upsertMeta('meta[property="og:description"]', {
            property: 'og:description',
            content: metadata.description,
        });
        upsertMeta('meta[property="og:type"]', {
            property: 'og:type',
            content: 'website',
        });
        upsertMeta('meta[property="og:url"]', {
            property: 'og:url',
            content: canonicalUrl,
        });
        upsertMeta('meta[name="twitter:card"]', {
            name: 'twitter:card',
            content: 'summary',
        });
        upsertMeta('meta[name="twitter:title"]', {
            name: 'twitter:title',
            content: metadata.title,
        });
        upsertMeta('meta[name="twitter:description"]', {
            name: 'twitter:description',
            content: metadata.description,
        });
        upsertCanonical(canonicalUrl);
    }, [location.pathname]);

    return null;
}
