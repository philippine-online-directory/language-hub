import { useEffect, useRef, useCallback } from 'react';
import styles from './IntellectualPropertyModal.module.css';
import { createPortal } from 'react-dom';

export default function IntellectualPropertyModal({ isOpen, onClose }) {
    const modalRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleBackdropClick = useCallback((e) => {
        if (e.target === e.currentTarget) onClose();
    }, [onClose]);

    if (!isOpen) return null;

 return createPortal(
        <div className={styles.backdrop} onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-labelledby="ip-modal-title">
            <div className={styles.modal} ref={modalRef}>
                <div className={styles.modalHeader}>
                    <div>
                        <h2 id="ip-modal-title" className={styles.modalTitle}>Intellectual Property Rights</h2>
                        <p className={styles.modalSubtitle}>What this means for you and your contribution</p>
                    </div>
                    <button className={styles.closeButton} onClick={onClose} aria-label="Close">
                        <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                <div className={styles.body}>
                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>What are Intellectual Property Rights?</h3>
                        <p className={styles.sectionText}>
                            Intellectual property (IP) rights are legal protections granted to creators for their original works.
                            In the context of language contributions, this refers to your ownership over the specific content
                            you provide — such as original example sentences, personal definitions, and recorded pronunciations.
                        </p>
                    </section>

                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>What does checking this box mean?</h3>
                        <ul className={styles.list}>
                            <li className={styles.listItem}>
                                <span className={styles.listIcon}>
                                    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </span>
                                <span><strong>You are the original author</strong> of the content you are submitting, or you have the right to share it (e.g., it is in the public domain or you hold a license).</span>
                            </li>
                            <li className={styles.listItem}>
                                <span className={styles.listIcon}>
                                    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </span>
                                <span><strong>Words and phrases themselves are not copyrightable</strong> — only the creative expression around them (like your example sentences or recorded audio) may be protected.</span>
                            </li>
                            <li className={styles.listItem}>
                                <span className={styles.listIcon}>
                                    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </span>
                                <span><strong>You grant us a license</strong> to use, store, display, and share your contribution for language preservation and education on this platform.</span>
                            </li>
                            <li className={styles.listItem}>
                                <span className={styles.listIcon}>
                                    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </span>
                                <span><strong>You retain your rights</strong> — this license does not transfer ownership. You still own your original creative content.</span>
                            </li>
                            <li className={styles.listItem}>
                                <span className={styles.listIcon}>
                                    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </span>
                                <span><strong>You are not submitting content</strong> that infringes on someone else's copyright or is otherwise restricted from public sharing.</span>
                            </li>
                        </ul>
                    </section>

                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>How we use your contribution</h3>
                        <p className={styles.sectionText}>
                            Your contributed words, definitions, and recordings will be used solely to build and enrich our
                            language preservation database. Contributions may be reviewed by moderators before publication
                            and may be edited for clarity or accuracy, with attribution maintained.
                        </p>
                    </section>

                    <div className={styles.note}>
                        <svg className={styles.noteIcon} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <p className={styles.noteText}>
                            If you have questions about IP rights or believe a contribution violates your rights, please contact our support team.
                        </p>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.closeFooterButton} onClick={onClose}>
                        Got it, close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}