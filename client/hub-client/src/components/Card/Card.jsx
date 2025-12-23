import styles from './Card.module.css'

export default function Card({ children, onClick, hoverable = false, className = ''}){
    const classes = [
        styles.card,
        onClick ? styles.clickable : '',
        hoverable ? styles.hoverable : '',
        className
    ].filter(Boolean).join(' ')

    const Component = onClick ? button : div;

    return (
        <Component className={classes} onClick={onClick}>
            {children}
        </Component>
    )
}