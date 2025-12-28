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
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AdminLanguagesPage from './pages/AdminLanguagesPage/AdminLanguagesPage';
import AdminTranslationsPage from './pages/AdminTranslationsPage/AdminTranslationsPage';
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
                
                {/* Language Routes - Protected */}
                <Route
                    path="/languages"
                    element={
                        <ProtectedRoute>
                            <LanguagesPage />
                        </ProtectedRoute>
                    }
                />
                
                <Route
                    path="/languages/:isoCode"
                    element={
                        <ProtectedRoute>
                            <LanguageDetailPage />
                        </ProtectedRoute>
                    }
                />
                
                {/* Set Routes - Protected */}
                <Route
                    path="/sets"
                    element={
                        <ProtectedRoute>
                            <SetsPage />
                        </ProtectedRoute>
                    }
                />
                
                <Route
                    path="/sets/create"
                    element={
                        <ProtectedRoute>
                            <CreateEditSetPage />
                        </ProtectedRoute>
                    }
                />
                
                <Route
                    path="/sets/:setId"
                    element={
                        <ProtectedRoute>
                            <SetDetailPage />
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
                
                {/* Game Routes - Protected */}
                <Route
                    path="/sets/:setId/games/flashcard"
                    element={
                        <ProtectedRoute>
                            <FlashcardGame />
                        </ProtectedRoute>
                    }
                />
                
                <Route
                    path="/sets/:setId/games/matching"
                    element={
                        <ProtectedRoute>
                            <MatchingGame />
                        </ProtectedRoute>
                    }
                />
                
                <Route
                    path="/sets/:setId/games/writing"
                    element={
                        <ProtectedRoute>
                            <WritingGame />
                        </ProtectedRoute>
                    }
                />
                
                {/* User Routes - Protected */}
                <Route
                    path="/users"
                    element={
                        <ProtectedRoute>
                            <UsersPage />
                        </ProtectedRoute>
                    }
                />
                
                <Route
                    path="/profile/me"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />
                
                <Route
                    path="/profile/:userId"
                    element={
                        <ProtectedRoute>
                            <PublicProfilePage />
                        </ProtectedRoute>
                    }
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