import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import styles from './LoginPage.module.css';

export default function LoginPage(){
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const redirectTo = searchParams.get('redirect') || '/';
    const isContributeIntent = searchParams.get('intent') === 'contribute';
    const successMessage = location.state?.message;

    const handleChange = (e) => {
        setFormData({
        ...formData,
        [e.target.name]: e.target.value,
        });

        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const validate = () => {
        const newErrors = {}

        if (!formData.email){
            newErrors.email = 'Email is required'
        }
        if (!formData.password){
            newErrors.password = 'Password is required'
        }

        return newErrors
    }

    const getLoginErrorMessage = (err) => {
        const data = err.response?.data;

        if (data?.message) return data.message;
        if (data?.error) return data.error;
        if (Array.isArray(data?.errors) && data.errors[0]?.message) {
            return data.errors[0].message;
        }

        return 'Login failed. Please try again.';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);

        try {
            await login(formData);
            navigate(redirectTo);
        }
        catch (err) {
            setErrors({ submit: getLoginErrorMessage(err) });
        }
        finally {
            setLoading(false);
        }
    };

    const registerHref = isContributeIntent
        ? `/register?redirect=${encodeURIComponent(redirectTo)}&intent=contribute`
        : '/register';

    return (
        <div className={styles.loginPage}>
            <div className={styles.container}>
                <Card className={styles.loginCard}>
                    <h1 className={styles.title}>Welcome Back</h1>
                    <p className={styles.subtitle}>
                        Continue your journey in language preservation
                    </p>

                    {isContributeIntent && (
                        <div className={styles.contributeNotice}>
                            <strong>You must create an account or sign in to contribute translations.</strong>
                        </div>
                    )}

                    {errors.submit && <div className={styles.error}>{errors.submit}</div>}
                    {successMessage && <div className={styles.success}>{successMessage}</div>}

                    <form noValidate onSubmit={handleSubmit} className={styles.form}>
                        <Input
                        label="Email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="your@email.com"
                        error={errors.email}
                        />

                        <Input
                        label="Password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="Enter your password"
                        error={errors.password}
                        />

                        <div className={styles.forgotPasswordLink}>
                            <Link to="/forgot-password" className={styles.link}>
                                Forgot password?
                            </Link>
                        </div>

                        <Button type="submit" fullWidth loading={loading}>
                            Login
                        </Button>
                    </form>

                    <p className={styles.registerLink}>
                        Don't have an account?{' '}
                        <Link to={registerHref} className={styles.link}>
                            Register here
                        </Link>
                    </p>
                </Card>
            </div>
        </div>
    );
}
