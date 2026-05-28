import Card from '../Card/Card';
import { setsGamesSteps } from '../../data/setsGamesGuide';
import styles from './SetsGamesHelpModal.module.css';

export default function SetsGamesHelpModal({ onClose }) {
    return (
        <div className={styles.overlay} onClick={onClose}>
            <Card className={styles.modal} onClick={(e) => e.stopPropagation()} asDiv>
                <div className={styles.header}>
                    <h2 className={styles.title}>How do I use Sets &amp; Games?</h2>
                    <button className={styles.closeButton} onClick={onClose} aria-label="Close">
                        <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                <ol className={styles.steps}>
                    {setsGamesSteps.map((step) => (
                        <li key={step.number} className={styles.step}>
                            <div className={styles.stepNumber}>{step.number}</div>
                            <div className={styles.stepContent}>
                                <h3 className={styles.stepTitle}>{step.title}</h3>
                                <p className={styles.stepDescription}>{step.description}</p>
                            </div>
                        </li>
                    ))}
                </ol>

                <button className={styles.doneButton} onClick={onClose}>
                    Got it
                </button>
            </Card>
        </div>
    );
}
