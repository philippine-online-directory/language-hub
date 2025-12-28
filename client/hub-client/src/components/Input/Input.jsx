import styles from './Input.module.css'

export default function Input({ label, 
    type = 'text', 
    value, 
    onChange, 
    placeholder, 
    error, 
    required = false,
    disabled = false,
    id,
    name,
    className = '' 
}){
    const inputId = id || name

    return (
        <div className={`${styles.inputWrapper} ${className}`}>
            {label && (
                <label htmlFor={inputId} className={styles.label}>
                {label}
                {required && <span className={styles.required}> *</span>}
                </label>
            )}
            <input
                id={inputId}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className={`${styles.input} ${error ? styles.error : ''}`}
            />
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    )
}