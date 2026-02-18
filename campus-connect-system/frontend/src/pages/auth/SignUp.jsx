import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signup } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import SignUpForm from '../../components/forms/SignUpForm';

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { loginUser } = useAuth();

  const handleSubmit = async (data) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await signup(data);
      setMessage(res.message);
      if (res.token && res.user) {
        loginUser(res.user);
        window.location.href = '/';
      }
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
        <h2>Create Account</h2>
        <p className="auth-subtitle">
          Sign up as a student or section admin (coach, coordinator, consultant).
        </p>
        <SignUpForm onSubmit={handleSubmit} loading={loading} message={message} />
        <p className="auth-switch">
          Already have an account? <Link to="/signin">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
