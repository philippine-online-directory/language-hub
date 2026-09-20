import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { languageService } from '../../api/languageService';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import {
    clearJsonLd,
    setCanonicalUrl,
    setJsonLd,
    setRobotsDirective,
    upsertMeta
} from '../../utils/seoMeta';
import { getWordJsonLd, getWordMetadata } from '../../utils/wordEntry';
import styles from './WordPage.module.css';

function updateMetadata(word) {
    const metadata = getWordMetadata(word);
    document.title = metadata.title;
    setRobotsDirective(metadata.robots);
    setCanonicalUrl(metadata.canonicalUrl);
    upsertMeta('meta[name="description"]', { name: 'description', content: metadata.description });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: metadata.title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: metadata.description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: metadata.canonicalUrl });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'article' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: metadata.title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: metadata.description });
    setJsonLd('pod-page-jsonld', getWordJsonLd(word));
}

export default function WordPage() {
    const { languageSlug, wordSlug } = useParams();
    const [word, setWord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchWord() {
            setLoading(true);
            setError(null);

            try {
                const result = await languageService.getWordBySlug(
                    languageSlug,
                    wordSlug,
                    controller.signal
                );
                setWord(result);
            } catch (requestError) {
                if (requestError.name === 'CanceledError') return;
                setError(requestError.response?.status === 404 ? 'not-found' : 'load-failed');
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        fetchWord();
        return () => controller.abort();
    }, [languageSlug, wordSlug]);

    useEffect(() => {
        if (!word) {
            setRobotsDirective('noindex,follow');
            return undefined;
        }

        updateMetadata(word);
        return () => clearJsonLd('pod-page-jsonld');
    }, [word]);

    if (loading) {
        return (
            <main className={styles.page}>
                <div className={styles.container}>
                    <LoadingSkeleton label="Loading word entry" />
                </div>
            </main>
        );
    }

    if (error || !word) {
        const notFound = error === 'not-found';
        return (
            <main className={styles.page}>
                <div className={styles.container}>
                    <section className={styles.errorPanel}>
                        <p className={styles.eyebrow}>{notFound ? '404' : 'Dictionary unavailable'}</p>
                        <h1>{notFound ? 'Word not found' : 'We could not load this word'}</h1>
                        <p>
                            {notFound
                                ? 'This entry may not exist, or its link may be incorrect.'
                                : 'Please try again in a moment.'}
                        </p>
                        <Link to={`/languages/${languageSlug}`} className={styles.primaryLink}>
                            Back to the dictionary
                        </Link>
                    </section>
                </div>
            </main>
        );
    }

    const dictionaryPath = `/languages/${word.language.slug}`;

    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
                    <Link to="/">Home</Link>
                    <span aria-hidden="true">›</span>
                    <Link to="/languages">Languages</Link>
                    <span aria-hidden="true">›</span>
                    <Link to={dictionaryPath}>{word.language.name}</Link>
                    <span aria-hidden="true">›</span>
                    <span aria-current="page">{word.wordText}</span>
                </nav>

                <Link to={dictionaryPath} className={styles.backLink}>
                    <span aria-hidden="true">←</span>
                    Back to the {word.language.name} dictionary
                </Link>

                <article className={styles.entry}>
                    <header className={styles.header}>
                        <p className={styles.eyebrow}>{word.language.name} dictionary</p>
                        <h1 className={styles.word}>{word.wordText}</h1>
                        <div className={styles.entryMeta}>
                            {word.partOfSpeech && (
                                <span className={styles.partOfSpeech}>{word.partOfSpeech}</span>
                            )}
                            <span className={word.status === 'VERIFIED' ? styles.verified : styles.unverified}>
                                {word.status === 'VERIFIED' ? 'Verified entry' : 'Awaiting verification'}
                            </span>
                        </div>
                    </header>

                    <section className={styles.definitionSection} aria-labelledby="definition-heading">
                        <h2 id="definition-heading">English definition</h2>
                        <p className={styles.definition}>{word.englishDefinition}</p>
                    </section>

                    <div className={styles.detailGrid}>
                        <section className={styles.detailSection} aria-labelledby="pronunciation-heading">
                            <h2 id="pronunciation-heading">Pronunciation</h2>
                            {word.audioUrl ? (
                                <audio controls preload="none" src={word.audioUrl} className={styles.audio}>
                                    Your browser does not support the audio element.
                                </audio>
                            ) : (
                                <p className={styles.muted}>No pronunciation recording has been added yet.</p>
                            )}
                        </section>

                        <section className={styles.detailSection} aria-labelledby="example-heading">
                            <h2 id="example-heading">Example</h2>
                            {word.exampleSentence ? (
                                <div className={styles.example}>
                                    <blockquote>{word.exampleSentence}</blockquote>
                                    {word.englishExampleSentence && (
                                        <p><span>English:</span> {word.englishExampleSentence}</p>
                                    )}
                                </div>
                            ) : (
                                <p className={styles.muted}>No example sentence has been added yet.</p>
                            )}
                        </section>

                        <section className={styles.detailSection} aria-labelledby="usage-heading">
                            <h2 id="usage-heading">Usage note</h2>
                            <p className={word.usageComment ? styles.bodyText : styles.muted}>
                                {word.usageComment || 'No usage note has been added yet.'}
                            </p>
                        </section>

                        <section className={styles.detailSection} aria-labelledby="contributors-heading">
                            <h2 id="contributors-heading">Contributors</h2>
                            <ul className={styles.linkList}>
                                {word.contributors.map((contributor) => (
                                    <li key={contributor.id}>
                                        <Link to={`/profile/${contributor.id}`}>@{contributor.username}</Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>

                    <section className={styles.setsSection} aria-labelledby="sets-heading">
                        <div>
                            <p className={styles.eyebrow}>Keep learning</p>
                            <h2 id="sets-heading">Public sets containing this word</h2>
                        </div>
                        {word.publicSets.length > 0 ? (
                            <ul className={styles.setList}>
                                {word.publicSets.map((set) => (
                                    <li key={set.id}>
                                        <Link to={`/sets/${set.id}`}>
                                            <span>{set.name}</span>
                                            {set.description && <small>{set.description}</small>}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className={styles.muted}>This word is not in a public vocabulary set yet.</p>
                        )}
                    </section>
                </article>
            </div>
        </main>
    );
}
