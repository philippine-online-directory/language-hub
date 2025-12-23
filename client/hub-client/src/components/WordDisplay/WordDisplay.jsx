import { useState } from 'react';
import Card from '../Card/Card';
import styles from './WordDisplay.module.css';

export default function WordDisplay({ translation }){
    return (
        <Card className={styles.wordDisplay}>
            <div className={styles.wordHeader}>
                <h2 className={styles.word}>{translation.wordText}</h2>
            </div>

            {translation.ipa && (
                <p className={styles.ipa}>{translation.ipa}</p>
            )}

            <div className={styles.divider} />

            <p className={styles.definition}>{translation.englishDefinition}</p>

            {translation.exampleSentence && (
                <>
                    <div className={styles.divider} />
                    <p className={styles.example}>{translation.exampleSentence}</p>
                </>
            )}

            {translation.status === 'VERIFIED' && (
                <div className={styles.verifiedBadge}>
                    <span>Verified Translation</span>
                </div>
            )}
        </Card>
    );
}

