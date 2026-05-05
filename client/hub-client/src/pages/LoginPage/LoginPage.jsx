import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import styles from './LoginPage.module.css';

export default function LoginPage(){
    const navigate = useNavigate();
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
            setErrors(err.response?.data?.message || 'Login failed. Please try again.');
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

                        <Button type="submit" fullWidth disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
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
