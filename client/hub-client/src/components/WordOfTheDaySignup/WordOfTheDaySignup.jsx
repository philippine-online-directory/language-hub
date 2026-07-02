import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { subscribeService } from '../../api/subscribeService';
import { profileService } from '../../api/profileService';
import styles from './WordOfTheDaySignup.module.css';

export default function WordOfTheDaySignup() {
    const { user, isAuthenticated } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const alreadySubscribed = isAuthenticated && user?.reminderType === 'WORD';

    if (alreadySubscribed) {
        return (
            <div className={styles.strip}>
                <span className={styles.alreadyIcon}>✉</span>
                <span className={styles.alreadyText}>
                    You're already getting the daily word at <strong>{user.email}</strong>
                </span>
            </div>
        );
    }

    if (success) {
        return (
            <div className={`${styles.strip} ${styles.successStrip}`}>
                <div className={styles.successIcon}>✓</div>
                <div className={styles.successText}>
                    <div className={styles.successTitle}>You're on the list!</div>
                    <div className={styles.successSub}>Expect your first word tomorrow morning.</div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isAuthenticated) {
                await profileService.setMyProfile({ reminderType: 'WORD' });
            } else {
                await subscribeService.subscribeGuest(email);
            }
            setSuccess(true);
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className={styles.strip} onSubmit={handleSubmit}>
            <span className={styles.label}>Get the daily word in your inbox</span>
            {isAuthenticated ? (
                <div className={styles.row}>
                    <span className={styles.emailPill}>
                        <span className={styles.avatar}>{user.username?.[0]?.toUpperCase()}</span>
                        {user.email}
                    </span>
                    <button type="submit" className={styles.btnGhost} disabled={loading}>
                        {loading ? '…' : 'Subscribe →'}
                    </button>
                </div>
            ) : (
                <div className={styles.row}>
                    <input
                        type="email"
                        className={styles.input}
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button type="submit" className={styles.btn} disabled={loading}>
                        {loading ? '…' : 'Subscribe'}
                    </button>
                </div>
            )}
            {error && <span className={styles.errorMsg}>{error}</span>}
        </form>
    );
}
