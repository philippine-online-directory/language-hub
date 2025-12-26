import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import LanguagesPage from './pages/LanguagesPage/LanguagesPage';
import LanguageDetailPage from './pages/LanguageDetailPage/LanguageDetailPage';
import ContributePage from './pages/ContributePage/ContributePage';
import SetsPage from './pages/SetsPage/SetsPage';
import SetDetailPage from './pages/SetDetailPage/SetDetailPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import HomePage from './pages/HomePage/HomePage';
import './App.css';

function ProtectedRoute({ children }){
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '48px' }}>Loading...</div>;
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
}



export default function App(){
    const { user } = useAuth();

    return (
        <BrowserRouter>
            <AuthProvider>
                <>
                    <Navbar user={user} />
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/languages" element={<LanguagesPage />} />
                            <Route path="/languages/:isoCode" element={<LanguageDetailPage />} />
                            <Route
                                path="/contribute"
                                element={
                                    <ProtectedRoute>
                                    <ContributePage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/sets"
                                element={
                                    <ProtectedRoute>
                                    <SetsPage />
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
                                path="/profile/me"
                                element={
                                    <ProtectedRoute>
                                    <ProfilePage />
                                    </ProtectedRoute>
                                }
                            />
                    </Routes>
                </>
            </AuthProvider>
        </BrowserRouter>
    )
    
}


