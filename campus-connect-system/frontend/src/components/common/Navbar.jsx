import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '@/components/ui/button';
import { SECTIONS } from '../../utils/constants';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-md border border-white/30 transition-transform hover:scale-105">
          <span className="text-white font-heading font-black text-lg">
            CC
          </span>
        </div>
        <span className="hidden sm:inline">Campus Connect</span>
      </Link>
      
      {/* Section Navigation Links */}
      <div className="hidden lg:flex items-center gap-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.id}
            to={section.path}
            className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium text-sm text-white/90 hover:text-white"
          >
            {section.label}
          </Link>
        ))}
      </div>
      
      <div className="navbar-menu">
        {user ? (
          <>
            <span className="navbar-user hidden md:inline">👋 {user.fullName}</span>
            <span className="navbar-role">{user.role}</span>
            <Button
              variant="outline"
              size="sm"
              className="!border-white/40 !bg-white/10 !text-white hover:!bg-white/20 hover:!border-white/60 backdrop-blur-sm"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link 
              to="/signin" 
              className="hidden sm:inline px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2.5 rounded-xl bg-white/15 border border-white/30 hover:bg-white/25 transition-all backdrop-blur-sm font-bold shadow-sm hover:shadow-md"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
