import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../Button/Button';
import styles from './Navbar.module.css';

export default function Navbar(){
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
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
                    
                    {user ? (
                        <>
                            <Link to="/sets" className={styles.navLink}>
                                Sets
                            </Link>
                            <Link to="/contribute" className={styles.navLink}>
                                Contribute
                            </Link>
                            <Link to="/users" className={styles.navLink}>
                                Users
                            </Link>
                            <Link to="/profile/me" className={styles.navLink}>
                                My Profile
                            </Link>
                            {user.role === 'ADMIN' && (
                                <Link to="/admin" className={styles.navLink}>
                                    Admin
                                </Link>
                            )}
                        </>
                    ) : (
                        <Link to="/sets/public" className={styles.navLink}>
                            Public Sets
                        </Link>
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
    );
}