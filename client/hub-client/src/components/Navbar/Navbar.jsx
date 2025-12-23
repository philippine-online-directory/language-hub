import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../api/authService';
import Button from '../Button/Button';
import styles from './Navbar.module.css';

export default function Navbar({ user }){
    const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
    <nav className={styles.navbar}>
        <div className={styles.container}>
            <Link to="/" className={styles.logo}>
                LanguageHub
            </Link>

            <div className={styles.navLinks}>
                <Link to="/languages" className={styles.navLink}>
                Languages
                </Link>
                {user && (
                <>
                    <Link to="/contribute" className={styles.navLink}>
                        Contribute
                    </Link>
                    <Link to="/sets" className={styles.navLink}>
                        My Sets
                    </Link>
                    <Link to="/profile/me" className={styles.navLink}>
                        Profile
                    </Link>
                </>
                )}
            </div>

            <div className={styles.actions}>
                {user ? (
                <Button variant="secondary" onClick={handleLogout}>
                    Logout
                </Button>
                ) : (
                <>
                    <Link to="/login">
                        <Button variant="secondary">Login</Button>
                    </Link>
                    <Link to="/register">
                        <Button variant="primary">Register</Button>
                    </Link>
                </>
                )}
            </div>
        </div>
    </nav>
  )
}