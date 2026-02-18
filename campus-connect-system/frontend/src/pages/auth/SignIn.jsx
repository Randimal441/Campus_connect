import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import SignInForm from '../../components/forms/SignInForm';

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await login(data);
      setMessage('Login successful.');
      loginUser(res.user);
      navigate('/');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-heading font-bold text-xl">
              CC
            </span>
          </div>
        </div>
        <h2>Sign In</h2>
        <p className="auth-subtitle">Enter your email and password to sign in.</p>
        <SignInForm onSubmit={handleSubmit} loading={loading} message={message} />
        <p className="auth-switch">
          Don&apos;t have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
