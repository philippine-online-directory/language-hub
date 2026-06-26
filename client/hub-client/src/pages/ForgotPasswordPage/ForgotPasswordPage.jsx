import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../api/authService';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import styles from '../LoginPage/LoginPage.module.css';

export default function ForgotPasswordPage(){
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const newErrors = {};

        if (!email) {
            newErrors.email = 'Email is required';
        }
        else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email is invalid';
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
        setMessage('');

        try {
            const response = await authService.forgotPassword(email);
            setMessage(response.message || 'If an account exists for that email, a password reset link has been sent.');
        }
        catch (err) {
            setErrors({
                submit: err.response?.data?.message || 'Could not send a reset link. Please try again.',
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
                    <h1 className={styles.title}>Reset your password</h1>
                    <p className={styles.subtitle}>
                        Enter your email and we will send you a reset link.
                    </p>

                    {errors.submit && <div className={styles.error}>{errors.submit}</div>}
                    {message && <div className={styles.success}>{message}</div>}

                    <form noValidate onSubmit={handleSubmit} className={styles.form}>
                        <Input
                            label="Email"
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) setErrors({ ...errors, email: '' });
                            }}
                            required
                            placeholder="your@email.com"
                            error={errors.email}
                        />

                        <Button type="submit" fullWidth loading={loading}>
                            Send reset link
                        </Button>
                    </form>

                    <p className={styles.registerLink}>
                        Remember your password?{' '}
                        <Link to="/login" className={styles.link}>
                            Login here
                        </Link>
                    </p>
                </Card>
            </div>
        </div>
    );
}
