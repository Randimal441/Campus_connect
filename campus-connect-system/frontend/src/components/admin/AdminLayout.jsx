import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }) {
  const { user } = useAuth();
  const showSidebar = user?.role === ROLES.SUPER_ADMIN;

  return (
    <div className="page">
      <Navbar />
      <div className="admin-layout">
        {showSidebar && <AdminSidebar />}
        <main className={showSidebar ? 'admin-main-content' : 'main-content'}>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
