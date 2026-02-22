import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '@/components/ui/button';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
          <span className="text-primary-foreground font-heading font-bold text-sm">
            CC
          </span>
        </div>
        Campus Connect
      </Link>
      <div className="navbar-menu">
        {user ? (
          <>
            <span className="navbar-user">{user.fullName}</span>
            <span className="navbar-role">{user.role}</span>
            <Button
              variant="outline"
              className="!border-white/40 !text-white hover:!bg-white/20 h-9 px-4"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link to="/signin">Sign In</Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded-lg bg-white/20 border border-white/40 hover:bg-white/30 transition-colors"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
