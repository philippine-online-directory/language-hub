import styles from './Button.module.css';

export default function Button({ children, variant = 'primary', onClick, type, disabled = false, fullWidth = false, className = ''}){
    const classes = [
        styles.button,
        styles[variant],
        fullWidth ? styles.fullWdith : '',
        className
    ].filter(Boolean).join(' ')

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={classes}
        >
            {children}
        </button>
    )
}
