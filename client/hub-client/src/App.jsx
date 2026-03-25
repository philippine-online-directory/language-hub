import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import LanguagesPage from './pages/LanguagesPage/LanguagesPage';
import LanguageDetailPage from './pages/LanguageDetailPage/LanguageDetailPage';
import ContributePage from './pages/ContributePage/ContributePage';
import UserContributionsPage from './pages/UserContributionsPage/UserContributionsPage';
import SetsPage from './pages/SetsPage/SetsPage';
import SetDetailPage from './pages/SetDetailPage/SetDetailPage';
import CreateEditSetPage from './pages/CreateEditSetPage/CreateEditSetPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import PublicProfilePage from './pages/PublicProfilePage/PublicProfilePage';
import UsersPage from './pages/UsersPage/UsersPage';
import HomePage from './pages/HomePage/HomePage';
import FlashcardGame from './pages/FlashcardGame/FlashcardGame';
import MatchingGame from './pages/MatchingGame/MatchingGame';
import WritingGame from './pages/WritingGame/WritingGame';
import GameSessionsPage from './pages/GameSessionsPage/GameSessionsPage';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AdminLanguagesPage from './pages/AdminLanguagesPage/AdminLanguagesPage';
import AdminTranslationsPage from './pages/AdminTranslationsPage/AdminTranslationsPage';
import TranslatePage from './pages/TranslatePage/TranslatePage';
import './App.css';

function ProtectedRoute({ children }){
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ 
                textAlign: 'center', 
                padding: '48px',
                color: '#6B7280',
                fontSize: '16px'
            }}>
                Loading...
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
}

function AdminRoute({ children }){
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ 
                textAlign: 'center', 
                padding: '48px',
                color: '#6B7280',
                fontSize: '16px'
            }}>
                Loading...
            </div>
        );
    }

    if (!user || user.role !== 'ADMIN') {
        return <Navigate to="/" />;
    }

    return children;
}

function AppContent(){
    return (
        <>
            <Navbar />
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/translate" element={<TranslatePage />} />
                
                {/* Language Routes */}
                <Route path="/languages" element={<LanguagesPage />} />
                <Route path="/languages/:isoCode" element={<LanguageDetailPage />} />
                
                {/* Set Routes */}
                <Route path="/sets" element={<SetsPage />} />
                <Route path="/sets/:setId" element={<SetDetailPage />} />
                
                {/* Set Routes - Protected */}
                <Route
                    path="/sets/create"
                    element={
                        <ProtectedRoute>
                            <CreateEditSetPage />
                        </ProtectedRoute>
                    }
                />
                
                <Route
                    path="/sets/:setId/edit"
                    element={
                        <ProtectedRoute>
                            <CreateEditSetPage />
                        </ProtectedRoute>
                    }
                />
                
                {/* Game Routes */}
                <Route path="/sets/:setId/games/flashcard" element={<FlashcardGame />} />
                <Route path="/sets/:setId/games/matching" element={<MatchingGame />} />
                <Route path="/sets/:setId/games/writing" element={<WritingGame />} />
                <Route
                    path="/sets/:setId/sessions"
                    element={
                        <ProtectedRoute>
                            <GameSessionsPage />
                        </ProtectedRoute>
                    }
                />
                
                {/* User Routes */}
                <Route path="/users" element={<UsersPage />} />
                <Route path="/profile/:userId" element={<PublicProfilePage />} />
                
                {/* User Routes - Protected */}
                <Route
                    path="/profile/me"
                    element={<ProfilePage />}
                />
                
                {/* Contribution Routes - Protected */}
                <Route
                    path="/contribute"
                    element={
                        <ProtectedRoute>
                            <ContributePage />
                        </ProtectedRoute>
                    }
                />
                
                <Route
                    path="/contributions"
                    element={
                        <ProtectedRoute>
                            <UserContributionsPage />
                        </ProtectedRoute>
                    }
                />
                
                {/* Admin Routes */}
                <Route
                    path="/admin"
                    element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />
                
                <Route
                    path="/admin/languages"
                    element={
                        <AdminRoute>
                            <AdminLanguagesPage />
                        </AdminRoute>
                    }
                />
                
                <Route
                    path="/admin/translations"
                    element={
                        <AdminRoute>
                            <AdminTranslationsPage />
                        </AdminRoute>
                    }
                />
            </Routes>
        </>
    );
}

export default function App(){
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}