import { createPortal } from 'react-dom';
import Button from '../Button/Button';
import styles from './ConfirmDeleteModal.module.css';

export default function ConfirmDeleteModal({ itemType, itemName, warning, onConfirm, onCancel, isDeleting = false }) {
  return createPortal(
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.icon}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="28" height="28" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <h3 className={styles.title}>Delete {itemType}?</h3>

        <p className={styles.body}>
          Would you like to delete <strong>"{itemName}"</strong>? This action cannot be undone.
        </p>

        {warning && (
          <div className={styles.warning}>
            <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" className={styles.warningIcon} aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            <span>{warning}</span>
          </div>
        )}

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={isDeleting}>
            Delete
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
