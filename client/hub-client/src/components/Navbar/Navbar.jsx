import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../Button/Button';
import styles from './Navbar.module.css';

function ContributeModal({ onClose, onLogin, onRegister }) {
    const ref = useRef(null);

    useEffect(() => {
        const handleKey = (event) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="contribute-modal-title">
            <div className={styles.modal} ref={ref}>
                <button className={styles.modalClose} onClick={onClose} aria-label="Close">✕</button>
                <div className={styles.modalIcon}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                </div>
                <h2 id="contribute-modal-title" className={styles.modalTitle}>Sign in to contribute</h2>
                <p className={styles.modalText}>
                    You must log in or create an account before contributing translations.
                </p>
                <div className={styles.modalActions}>
                    <Button variant="primary" onClick={onLogin}>Log in</Button>
                    <Button variant="secondary" onClick={onRegister}>Create account</Button>
                </div>
            </div>
        </div>
    );
}

function NavItem({ to, title, description, onClick }) {
    const content = (
        <>
            <span className={styles.itemCopy}>
                <span className={styles.itemTitle}>{title}</span>
                <span className={styles.itemDescription}>{description}</span>
            </span>
            <svg className={styles.itemArrow} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                <path d="M4 10h11M11 6l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </>
    );

    if (to) {
        return (
            <Link to={to} className={styles.dropdownLink} onClick={onClick}>
                {content}
            </Link>
        );
    }

    return (
        <button type="button" className={styles.dropdownLink} onClick={onClick}>
            {content}
        </button>
    );
}

function NavMenu({
    id,
    label,
    description,
    active,
    open,
    onOpen,
    onClose,
    onToggle,
    triggerRef,
    children,
}) {
    const handleMouseEnter = () => {
        if (window.matchMedia('(hover: hover)').matches) onOpen();
    };

    const handleMouseLeave = (event) => {
        if (!event.currentTarget.contains(document.activeElement)) onClose();
    };

    const handleBlur = (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onClose();
    };

    return (
        <li
            className={`${styles.menu} ${open ? styles.menuOpen : ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onBlur={handleBlur}
        >
            <button
                ref={triggerRef}
                type="button"
                className={`${styles.menuTrigger} ${active ? styles.active : ''}`}
                aria-expanded={open}
                aria-controls={`nav-${id}-panel`}
                onClick={onToggle}
            >
                <span>{label}</span>
                <svg className={styles.chevron} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                    <path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            <div
                id={`nav-${id}-panel`}
                className={styles.dropdown}
                aria-hidden={!open}
            >
                <div className={styles.dropdownHeading}>
                    <span>{label}</span>
                    <p>{description}</p>
                </div>
                <div className={styles.dropdownLinks}>
                    {children}
                </div>
            </div>
        </li>
    );
}

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading: authLoading, logout } = useAuth();
    const navRef = useRef(null);
    const triggerRefs = useRef({});
    const [openMenuState, setOpenMenuState] = useState(null);
    const [contributeModalPath, setContributeModalPath] = useState(null);
    const openMenu = openMenuState?.path === location.pathname ? openMenuState.id : null;
    const showContributeModal = contributeModalPath === location.pathname;

    useEffect(() => {
        if (!openMenu) return undefined;

        const handlePointerDown = (event) => {
            if (navRef.current && !navRef.current.contains(event.target)) {
                setOpenMenuState(null);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key !== 'Escape') return;
            const trigger = triggerRefs.current[openMenu];
            setOpenMenuState(null);
            trigger?.focus();
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [openMenu]);

    const closeMenu = () => setOpenMenuState(null);
    const openCategory = (id) => setOpenMenuState({ id, path: location.pathname });
    const toggleCategory = (id) => {
        setOpenMenuState(openMenu === id ? null : { id, path: location.pathname });
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        closeMenu();
    };

    const handleContributeClick = (event) => {
        event.preventDefault();
        if (authLoading) return;

        if (user) {
            navigate('/contribute');
        } else {
            setContributeModalPath(location.pathname);
        }
        closeMenu();
    };

    const isSectionActive = (...paths) => paths.some((path) => (
        location.pathname === path || location.pathname.startsWith(`${path}/`)
    ));

    return (
        <>
            <nav className={styles.navbar} aria-label="Primary navigation" ref={navRef}>
                <div className={styles.container}>
                    <Link to="/" className={styles.logo} onClick={closeMenu}>
                        <span className={styles.logoText}>Philippine Online</span>
                        <span className={styles.logoAccent}>Dictionary</span>
                    </Link>

                    <ul className={styles.navLinks}>
                        <NavMenu
                            id="explore"
                            label="Explore"
                            description="Learn, practise, and meet the community."
                            active={isSectionActive('/sets', '/users', '/site-guide', '/about')}
                            open={openMenu === 'explore'}
                            onOpen={() => openCategory('explore')}
                            onClose={closeMenu}
                            onToggle={() => toggleCategory('explore')}
                            triggerRef={(node) => { triggerRefs.current.explore = node; }}
                        >
                            <NavItem to="/sets" title="Sets & games" description="Build vocabulary through study sets and games." onClick={closeMenu} />
                            <NavItem to="/users" title="Community" description="Find learners and language contributors." onClick={closeMenu} />
                            <NavItem to="/site-guide" title="Site guide" description="See how each part of the dictionary works." onClick={closeMenu} />
                            <NavItem to="/about" title="About" description="Read about the project and its purpose." onClick={closeMenu} />
                        </NavMenu>

                        <NavMenu
                            id="dictionaries"
                            label="Dictionaries"
                            description="Browse Philippine languages and look up words."
                            active={isSectionActive('/languages', '/translate', '/common-words')}
                            open={openMenu === 'dictionaries'}
                            onOpen={() => openCategory('dictionaries')}
                            onClose={closeMenu}
                            onToggle={() => toggleCategory('dictionaries')}
                            triggerRef={(node) => { triggerRefs.current.dictionaries = node; }}
                        >
                            <NavItem to="/languages" title="Browse dictionaries" description="Choose a language and search its entries." onClick={closeMenu} />
                            <NavItem to="/translate" title="Translator" description="Translate words between available languages." onClick={closeMenu} />
                            <NavItem to="/common-words" title="Common words" description="Compare everyday words across languages." onClick={closeMenu} />
                        </NavMenu>

                        <NavMenu
                            id="contribute"
                            label="Contribute"
                            description="Help make the dictionaries more complete."
                            active={isSectionActive('/contribute', '/contributions', '/admin')}
                            open={openMenu === 'contribute'}
                            onOpen={() => openCategory('contribute')}
                            onClose={closeMenu}
                            onToggle={() => toggleCategory('contribute')}
                            triggerRef={(node) => { triggerRefs.current.contribute = node; }}
                        >
                            <NavItem title="Add translations" description="Share words and definitions you know." onClick={handleContributeClick} />
                            {!authLoading && user && (
                                <>
                                    <NavItem to="/contributions" title="My words" description="Review the translations you have submitted." onClick={closeMenu} />
                                    <NavItem to="/contribute/bulk" title="Bulk upload" description="Add several translations from one file." onClick={closeMenu} />
                                    {user.role === 'ADMIN' && (
                                        <NavItem to="/admin" title="Admin tools" description="Manage languages, entries, and imports." onClick={closeMenu} />
                                    )}
                                </>
                            )}
                        </NavMenu>
                    </ul>

                    {!authLoading && user && (
                        <div className={styles.actions}>
                            <Link to="/profile/me" className={styles.profileButton} onClick={closeMenu} aria-label={`Open ${user.username}'s account`}>
                                <span className={styles.avatar} aria-hidden="true">
                                    {user.username.charAt(0).toUpperCase()}
                                </span>
                                <span className={styles.username}>{user.username}</span>
                            </Link>
                            <button
                                type="button"
                                className={styles.logoutButton}
                                onClick={handleLogout}
                                aria-label="Log out"
                                title="Log out"
                            >
                                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M8 4H4.75A1.75 1.75 0 003 5.75v8.5A1.75 1.75 0 004.75 16H8" />
                                    <path d="M12.5 6.5L16 10l-3.5 3.5M7 10h9" />
                                </svg>
                                <span>Log out</span>
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {showContributeModal && (
                <ContributeModal
                    onClose={() => setContributeModalPath(null)}
                    onLogin={() => {
                        setContributeModalPath(null);
                        navigate('/login?redirect=/contribute&intent=contribute');
                    }}
                    onRegister={() => {
                        setContributeModalPath(null);
                        navigate('/register?redirect=/contribute&intent=contribute');
                    }}
                />
            )}
        </>
    );
}
