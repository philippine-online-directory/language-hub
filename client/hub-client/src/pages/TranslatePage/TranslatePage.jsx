import { useState, useEffect } from 'react';
import Translator from '../../components/Translator/Translator';
import styles from './TranslatePage.module.css';

export default function TranslatePage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className={`${styles.translatePage} ${mounted ? styles.mounted : ''}`}>
            <div className={styles.backgroundPattern}></div>

            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Translate a Word</h1>
                    <p className={styles.subtitle}>
                        Look up words across Philippine languages. Select a language, enter a word, and discover its translation.
                    </p>
                </header>

                <div className={styles.translatorWrapper}>
                    <Translator />
                </div>

                <div className={styles.note}>
                    <svg viewBox="0 0 20 20" fill="currentColor" className={styles.noteIcon}>
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p>
                        This translator only draws from our community-contributed dictionary.
                        Can't find a word? <a href="/contribute" className={styles.noteLink}>Contribute a translation.</a>
                    </p>
                </div>
            </div>
        </div>
    );
}