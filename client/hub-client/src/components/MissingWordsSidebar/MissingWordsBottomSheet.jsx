import { useEffect, useRef } from 'react';
import MissingWordsSidebar from './MissingWordsSidebar';
import styles from './MissingWordsBottomSheet.module.css';

export default function MissingWordsBottomSheet({ isOpen, onClose, slug, onWordClick }) {
    const sheetRef = useRef(null);
    const triggerRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            triggerRef.current = document.activeElement;
            sheetRef.current?.focus();
        } else if (triggerRef.current) {
            triggerRef.current.focus();
            triggerRef.current = null;
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                ref={sheetRef}
                className={styles.sheet}
                role="dialog"
                aria-modal="true"
                aria-label="Words Needing Translation"
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.handle} aria-hidden="true" />
                <button
                    type="button"
                    className={styles.closeBtn}
                    onClick={onClose}
                    aria-label="Close"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>
                <MissingWordsSidebar slug={slug} onWordClick={onWordClick} defaultOpen={true} showToggle={false} />
            </div>
        </div>
    );
}
