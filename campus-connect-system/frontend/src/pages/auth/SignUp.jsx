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
      <div className="auth-card">
        <div className="flex justify-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-xl">
            <span className="text-white font-heading font-black text-3xl">
              CC
            </span>
          </div>
        </div>
        <div className="text-center mb-8">
          <h2 className="mb-3">Join Campus Connect</h2>
          <p className="auth-subtitle">
            Create your account to connect with campus life
          </p>
        </div>
        <SignUpForm onSubmit={handleSubmit} loading={loading} message={message} />
        <p className="auth-switch">
          Already have an account? <Link to="/signin" className="font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
