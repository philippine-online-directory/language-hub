import styles from './LoadingSkeleton.module.css';

export default function LoadingSkeleton({ variant = 'cards', label = 'Loading content' }) {
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
                    {variant === 'game' && <div className={styles.eyebrow} />}
                    <div className={styles.heading} />
                    <div className={styles.line} />
                    <div className={styles.shortLine} />
                    {variant !== 'compact' && <div className={styles.footer} />}
                </div>
            ))}
            <span className={styles.srOnly}>{label}</span>
        </div>
    );
}
