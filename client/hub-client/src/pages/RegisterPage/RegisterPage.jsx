import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/Input/Input';
import Button from '../../components/Button/Button';
import Card from '../../components/Card/Card';
import styles from './RegisterPage.module.css';

export default function RegisterPage(){
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: ''
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
        
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } 
        else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        
        if (!formData.username) {
            newErrors.username = 'Username is required';
        } 
        else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        }
        
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } 
        else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
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
        
        try {
            await register({
                email: formData.email,
                username: formData.username,
                password: formData.password,
            });
            navigate('/login');
        } 
        catch (err) {
            setErrors({
                submit: err.response?.data?.message || 'Registration failed. Please try again.',
            });
        } 
        finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.registerPage}>
            <div className={styles.container}>
                <Card className={styles.registerCard}>
                    <h1 className={styles.title}>Join LanguageHub</h1>
                    <p className={styles.subtitle}>
                        Help preserve endangered languages for future generations
                    </p>

                    {errors.submit && <div className={styles.error}>{errors.submit}</div>}

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <Input
                            label="Email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            required
                            placeholder="your@email.com"
                        />

                        <Input
                            label="Username"
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            error={errors.username}
                            required
                            placeholder="Choose a username"
                        />

                        <Input
                            label="Password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            error={errors.password}
                            required
                            placeholder="At least 6 characters"
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            error={errors.confirmPassword}
                            required
                            placeholder="Confirm your password"
                        />

                        <Button type="submit" fullWidth disabled={loading}>
                            {loading ? 'Creating account...' : 'Register'}
                        </Button>
                    </form>

                    <p className={styles.loginLink}>
                        Already have an account?{' '}
                        <Link to="/login" className={styles.link}>
                        Login here
                        </Link>
                    </p>
                </Card>
            </div>
        </div>
    );



}