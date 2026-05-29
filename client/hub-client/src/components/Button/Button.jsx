import styles from './Button.module.css';

export default function Button({ children, variant = 'primary', onClick, type, disabled = false, fullWidth = false, className = '', loading = false }) {
    const classes = [
        styles.button,
        styles[variant],
        fullWidth ? styles.fullWdith : '',
        loading ? styles.loading : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={classes}
        >
            <span className={styles.t}>{children}</span>
            <span className={styles.blob} />
        </button>
    );
}
