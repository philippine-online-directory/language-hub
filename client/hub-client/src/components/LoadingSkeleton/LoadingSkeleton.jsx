import styles from './LoadingSkeleton.module.css';

function StatusLabel({ label }) {
    return <span className={styles.srOnly}>{label}</span>;
}

function LanguageCardSkeleton({ index }) {
    return (
        <div className={styles.languageCard} aria-hidden="true" key={index}>
            <div className={`${styles.languageTitle} ${styles.bone}`} />
            <div className={styles.chipRow}>
                <div className={`${styles.isoChip} ${styles.bone}`} />
                <div className={`${styles.speakerLine} ${styles.bone}`} />
            </div>
            <div className={`${styles.wordCount} ${styles.bone}`} />
            <div className={styles.progressLabels}>
                <div className={`${styles.progressText} ${styles.bone}`} />
                <div className={`${styles.progressPercent} ${styles.bone}`} />
            </div>
            <div className={`${styles.progressTrack} ${styles.bone}`} />
        </div>
    );
}

function WordRowSkeleton({ index }) {
    return (
        <div className={styles.wordRow} aria-hidden="true" key={index}>
            <div>
                <div className={`${styles.wordTitle} ${styles.bone}`} />
                <div className={`${styles.wordDefinition} ${styles.bone}`} />
            </div>
            <div className={`${styles.wordAction} ${styles.bone}`} />
        </div>
    );
}

function WordEntrySkeleton({ label }) {
    return (
        <div className={`${styles.skeleton} ${styles.wordEntry}`} role="status" aria-label={label} aria-live="polite">
            <div className={styles.wordEntryBreadcrumbs} aria-hidden="true">
                <div className={`${styles.breadcrumbShort} ${styles.bone}`} />
                <div className={`${styles.breadcrumbLong} ${styles.bone}`} />
                <div className={`${styles.breadcrumbMedium} ${styles.bone}`} />
            </div>
            <div className={`${styles.wordEntryBack} ${styles.bone}`} aria-hidden="true" />
            <div className={styles.wordEntryCard} aria-hidden="true">
                <div className={styles.wordEntryHeader}>
                    <div className={`${styles.wordEntryEyebrow} ${styles.bone}`} />
                    <div className={`${styles.wordEntryTitle} ${styles.bone}`} />
                    <div className={styles.wordEntryMeta}>
                        <div className={`${styles.wordEntryChip} ${styles.bone}`} />
                        <div className={`${styles.wordEntryStatus} ${styles.bone}`} />
                    </div>
                </div>
                <div className={styles.wordEntryDefinition}>
                    <div className={`${styles.wordEntryLabel} ${styles.bone}`} />
                    <div className={`${styles.wordEntryDefinitionLine} ${styles.bone}`} />
                    <div className={`${styles.wordEntryDefinitionShort} ${styles.bone}`} />
                </div>
                <div className={styles.wordEntryDetails}>
                    {Array.from({ length: 4 }, (_, index) => (
                        <div className={styles.wordEntryDetail} key={index}>
                            <div className={`${styles.wordEntryDetailTitle} ${styles.bone}`} />
                            <div className={`${styles.wordEntryDetailLine} ${styles.bone}`} />
                            {index === 1 && <div className={`${styles.wordEntryDetailShort} ${styles.bone}`} />}
                        </div>
                    ))}
                </div>
                <div className={styles.wordEntrySets}>
                    <div className={`${styles.wordEntryEyebrow} ${styles.bone}`} />
                    <div className={`${styles.wordEntrySetsTitle} ${styles.bone}`} />
                    <div className={`${styles.wordEntrySetCard} ${styles.bone}`} />
                </div>
            </div>
            <StatusLabel label={label} />
        </div>
    );
}

export default function LoadingSkeleton({ variant = 'cards', label = 'Loading content' }) {
    if (variant === 'wordEntry') {
        return <WordEntrySkeleton label={label} />;
    }

    if (variant === 'languages') {
        return (
            <div className={`${styles.skeleton} ${styles.languages}`} role="status" aria-label={label} aria-live="polite">
                {Array.from({ length: 6 }, (_, index) => <LanguageCardSkeleton key={index} index={index} />)}
                <StatusLabel label={label} />
            </div>
        );
    }

    if (variant === 'dictionary') {
        return (
            <div className={`${styles.skeleton} ${styles.dictionary}`} role="status" aria-label={label} aria-live="polite">
                <div className={styles.dictionaryHeader} aria-hidden="true">
                    <div className={styles.dictionaryHeaderCopy}>
                        <div className={`${styles.dictionaryTitle} ${styles.bone}`} />
                        <div className={styles.chipRow}>
                            <div className={`${styles.isoChip} ${styles.bone}`} />
                            <div className={`${styles.speakerLine} ${styles.bone}`} />
                        </div>
                        <div className={`${styles.noteLine} ${styles.bone}`} />
                        <div className={`${styles.noteLineShort} ${styles.bone}`} />
                    </div>
                    <div className={`${styles.headerButton} ${styles.bone}`} />
                </div>
                <div className={`${styles.sectionHeading} ${styles.bone}`} aria-hidden="true" />
                <div className={styles.controlPanel} aria-hidden="true">
                    <div className={`${styles.searchField} ${styles.bone}`} />
                    <div className={styles.filterRow}>
                        <div className={`${styles.filterField} ${styles.bone}`} />
                        <div className={`${styles.filterField} ${styles.bone}`} />
                        <div className={`${styles.filterToggle} ${styles.bone}`} />
                    </div>
                </div>
                <div className={styles.dictionaryBody}>
                    <div className={styles.wordRows}>
                        {Array.from({ length: 4 }, (_, index) => <WordRowSkeleton key={index} index={index} />)}
                    </div>
                    <div className={styles.sidebarSkeleton} aria-hidden="true">
                        <div className={`${styles.sidebarTitle} ${styles.bone}`} />
                        <div className={`${styles.sidebarLine} ${styles.bone}`} />
                        <div className={`${styles.sidebarLine} ${styles.bone}`} />
                        <div className={`${styles.sidebarLineShort} ${styles.bone}`} />
                    </div>
                </div>
                <StatusLabel label={label} />
            </div>
        );
    }

    if (variant === 'contributions') {
        return (
            <div className={`${styles.skeleton} ${styles.contributions}`} role="status" aria-label={label} aria-live="polite">
                <div className={styles.statSkeletons} aria-hidden="true">
                    {Array.from({ length: 3 }, (_, index) => (
                        <div className={styles.statSkeleton} key={index}>
                            <div className={`${styles.statValue} ${styles.bone}`} />
                            <div className={`${styles.statLabel} ${styles.bone}`} />
                        </div>
                    ))}
                </div>
                <div className={styles.contributionRows}>
                    {Array.from({ length: 4 }, (_, index) => <WordRowSkeleton key={index} index={index} />)}
                </div>
                <StatusLabel label={label} />
            </div>
        );
    }

    const itemCount = variant === 'compact' ? 3 : variant === 'game' ? 1 : 6;

    return (
        <div
            className={`${styles.skeleton} ${styles[variant]}`}
            role="status"
            aria-label={label}
            aria-live="polite"
        >
            {Array.from({ length: itemCount }, (_, index) => (
                <div className={styles.item} key={index} aria-hidden="true">
                    {variant === 'game' && <div className={`${styles.eyebrow} ${styles.bone}`} />}
                    <div className={`${styles.heading} ${styles.bone}`} />
                    <div className={`${styles.line} ${styles.bone}`} />
                    <div className={`${styles.shortLine} ${styles.bone}`} />
                    {variant !== 'compact' && <div className={`${styles.footer} ${styles.bone}`} />}
                </div>
            ))}
            <StatusLabel label={label} />
        </div>
    );
}
