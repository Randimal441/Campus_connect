import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import SignInForm from '../../components/forms/SignInForm';

export default function SignIn() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const getRedirectPath = (role) => {
    switch (role) {
      case ROLES.SUPER_ADMIN:
        return '/admin/super';
      case ROLES.COACH:
        return '/admin/coaches';
      case ROLES.RESOURCE_COORDINATOR:
        return '/admin/resources';
      case ROLES.CONSULTANT:
        return '/admin/consulting';
      case ROLES.EVENT_COORDINATOR:
        return '/admin/events';
      case ROLES.STUDENT:
      default:
        return '/user/events-chill';
    }
  };

  const handleSubmit = async (data) => {
    setLoading(true);
    setMessage('');
    try {
      const res = await login(data);
      setMessage('Login successful.');
      loginUser(res.user);
      const redirectPath = getRedirectPath(res.user.role);
      navigate(redirectPath);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-xl">
            <span className="text-white font-heading font-black text-3xl">
              CC
            </span>
          </div>
        </div>
        <div className="text-center mb-8">
          <h2 className="mb-3">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to access your Campus Connect account</p>
        </div>
        <SignInForm onSubmit={handleSubmit} loading={loading} message={message} />
        <p className="auth-switch">
          Don't have an account? <Link to="/signup" className="font-bold hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
