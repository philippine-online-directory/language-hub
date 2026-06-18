import { Link } from 'react-router-dom';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
    return (
        <main className={styles.notFoundPage}>
            <section className={styles.panel}>
                <p className={styles.kicker}>404</p>
                <h1 className={styles.title}>Page not found</h1>
                <p className={styles.text}>
                    The page you are looking for does not exist or is no longer available.
                </p>
                <Link to="/languages" className={styles.link}>
                    Explore dictionaries
                </Link>
            </section>
        </main>
    );
}
