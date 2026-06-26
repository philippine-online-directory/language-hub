import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../api/authService';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import styles from '../LoginPage/LoginPage.module.css';

export default function ResetPasswordPage(){
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

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
        const newErrors = {};

        if (!token) {
            newErrors.submit = 'Password reset link is invalid or expired.';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }
        else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validate();

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            const response = await authService.resetPassword({
                token,
                password: formData.password
            });

            navigate('/login', {
                replace: true,
                state: {
                    message: response.message || 'Password has been reset. Please log in with your new password.'
                }
            });
        }
        catch (err) {
            setErrors({
                submit: err.response?.data?.message || 'Could not reset your password. Please request a new link.',
            });
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.loginPage}>
            <div className={styles.container}>
                <Card className={styles.loginCard}>
                    <h1 className={styles.title}>Create new password</h1>
                    <p className={styles.subtitle}>
                        Choose a new password for your account.
                    </p>

                    {(errors.submit || !token) && (
                        <div className={styles.error}>
                            {errors.submit || 'Password reset link is invalid or expired.'}
                        </div>
                    )}

                    <form noValidate onSubmit={handleSubmit} className={styles.form}>
                        <Input
                            label="New password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="At least 8 characters"
                            error={errors.password}
                            disabled={!token}
                        />

                        <Input
                            label="Confirm new password"
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            placeholder="Confirm your new password"
                            error={errors.confirmPassword}
                            disabled={!token}
                        />

                        <Button type="submit" fullWidth loading={loading} disabled={!token}>
                            Reset password
                        </Button>
                    </form>

                    <p className={styles.registerLink}>
                        Need a new reset link?{' '}
                        <Link to="/forgot-password" className={styles.link}>
                            Request one here
                        </Link>
                    </p>
                </Card>
            </div>
        </div>
    );
}
