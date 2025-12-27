import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card/Card';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard(){
    const { user } = useAuth();

    if (user?.role !== 'ADMIN') {
        return (
            <div className={styles.adminDashboard}>
                <div className={styles.container}>
                    <div className={styles.unauthorized}>
                        You do not have permission to access this page.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.adminDashboard}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Admin Dashboard</h1>
                    <p className={styles.subtitle}>
                        Manage languages and verify translations
                    </p>
                </header>

                <div className={styles.adminGrid}>
                    <Link to="/admin/languages" className={styles.adminLink}>
                        <Card hoverable className={styles.adminCard}>
                            <h2 className={styles.cardTitle}>Manage Languages</h2>
                            <p className={styles.cardDescription}>
                                Add, update, or remove languages from the platform
                            </p>
                        </Card>
                    </Link>

                    <Link to="/admin/translations" className={styles.adminLink}>
                        <Card hoverable className={styles.adminCard}>
                            <h2 className={styles.cardTitle}>Verify Translations</h2>
                            <p className={styles.cardDescription}>
                                Review and verify user-contributed translations
                            </p>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    );
}