import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../Button/Button';
import styles from './Navbar.module.css';

function ContributeModal({ onClose, onLogin, onRegister }) {
    const ref = useRef(null);

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
            <div className={styles.modal} ref={ref}>
                <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
                <div className={styles.modalIcon}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                </div>
                <h2 className={styles.modalTitle}>Sign in to Contribute</h2>
                <p className={styles.modalText}>
                    You must log in or create an account before contributing translations.
                </p>
                <div className={styles.modalActions}>
                    <Button variant="primary" onClick={onLogin}>Log In</Button>
                    <Button variant="secondary" onClick={onRegister}>Create Account</Button>
                </div>
            </div>
        </div>
    );
}

export default function Navbar(){
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading: authLoading, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showContributeModal, setShowContributeModal] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
        setShowContributeModal(false);
    }, [location]);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setMobileMenuOpen(false);
    };

    const handleContributeClick = (e) => {
        e.preventDefault();
        if (authLoading) {
            return;
        }

        if (user) {
            navigate('/contribute');
        } else {
            setShowContributeModal(true);
        }
        setMobileMenuOpen(false);
    };

    const isActive = (path) => location.pathname === path;
    const isSectionActive = (path) => (
        location.pathname === path || location.pathname.startsWith(`${path}/`)
    );

    return (
        <>
            <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
                <div className={styles.container}>
                    <Link to="/" className={styles.logo}>
                        <span className={styles.logoText}>Philippine Online</span>
                        <span className={styles.logoAccent}>Dictionary</span>
                    </Link>

                    {/* Mobile Menu Button */}
                    <button
                        className={`${styles.mobileMenuButton} ${mobileMenuOpen ? styles.open : ''}`}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                    {/* Desktop Navigation */}
                    <div className={`${styles.navLinks} ${mobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
                        {/* Dictionaries — show for all users */}
                        <Link
                            to="/languages"
                            className={`${styles.navLink} ${isActive('/languages') ? styles.active : ''}`}
                        >
                            <svg className={styles.linkIcon} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
                            </svg>
                            <span>Dictionaries</span>
                        </Link>

                        {/* Contribute — always visible, behavior depends on auth state */}
                        <button
                            className={`${styles.navLink} ${styles.navLinkButton} ${isActive('/contribute') ? styles.active : ''}`}
                            onClick={handleContributeClick}
                        >
                            <svg className={styles.linkIcon} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                            </svg>
                            <span>Contribute</span>
                        </button>

                        {/* Sets tab — visible to all users */}
                        <Link
                            to="/sets"
                            className={`${styles.navLink} ${isSectionActive('/sets') ? styles.active : ''}`}
                        >
                            <svg className={styles.linkIcon} viewBox="0 0 20 20" fill="currentColor">
                                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                            </svg>
                            <span>Sets &amp; Games</span>
                        </Link>

                        {/* Community tab — visible to all users */}
                        <Link
                            to="/users"
                            className={`${styles.navLink} ${isActive('/users') ? styles.active : ''}`}
                        >
                            <svg className={styles.linkIcon} viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                            <span>Community</span>
                        </Link>

                        {/* Authenticated-only tabs */}
                        {!authLoading && user && (
                            <>
                                <Link
                                    to="/contributions"
                                    className={`${styles.navLink} ${isActive('/contributions') ? styles.active : ''}`}
                                >
                                    <svg className={styles.linkIcon} viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                    </svg>
                                    <span>My Words</span>
                                </Link>
                                {user.role === 'ADMIN' && (
                                    <Link
                                        to="/admin"
                                        className={`${styles.navLink} ${styles.adminLink} ${isActive('/admin') ? styles.active : ''}`}
                                    >
                                        <svg className={styles.linkIcon} viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Admin</span>
                                    </Link>
                                )}
                            </>
                        )}

                        {/* Site Guide — visible to all users */}
                        <Link
                            to="/site-guide"
                            className={`${styles.navLink} ${isActive('/site-guide') ? styles.active : ''}`}
                        >
                            <svg className={styles.linkIcon} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" clipRule="evenodd" />
                            </svg>
                            <span>Site Guide</span>
                        </Link>

                        {/* About — visible to all users */}
                        <Link
                            to="/about"
                            className={`${styles.navLink} ${isActive('/about') ? styles.active : ''}`}
                        >
                            <svg className={styles.linkIcon} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>About</span>
                        </Link>
                    </div>

                    <div className={styles.actions}>
                        {!authLoading && user && (
                            <>
                                <Link to="/profile/me" className={styles.profileButton}>
                                    <div className={styles.avatar}>
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span className={styles.username}>{user.username}</span>
                                </Link>
                                <Button variant="secondary" onClick={handleLogout}>
                                    Logout
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {showContributeModal && (
                <ContributeModal
                    onClose={() => setShowContributeModal(false)}
                    onLogin={() => {
                        setShowContributeModal(false);
                        navigate('/login?redirect=/contribute&intent=contribute');
                    }}
                    onRegister={() => {
                        setShowContributeModal(false);
                        navigate('/register?redirect=/contribute&intent=contribute');
                    }}
                />
            )}
        </>
    );
}
