import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import SignIn from '../pages/auth/SignIn';
import SignUp from '../pages/auth/SignUp';
import RoleRoutes from './RoleRoutes';
import UserHome from '../pages/user/UserHome';
import ClubsSports from '../pages/user/ClubsSports';
import ResourceSharing from '../pages/user/ResourceSharing';
import Consulting from '../pages/user/Consulting';
import EventsChill from '../pages/user/EventsChill';
import SuperAdminDashboard from '../pages/admin/SuperAdminDashboard';
import CoachesDashboard from '../pages/admin/CoachesDashboard';
import ResourceCoordinatorDashboard from '../pages/admin/ResourceCoordinatorDashboard';
import ConsultantDashboard from '../pages/admin/ConsultantDashboard';
import EventCoordinatorDashboard from '../pages/admin/EventCoordinatorDashboard';
import NotFound from '../pages/notFound/NotFound';
import ProtectedRoute from '../components/protected/ProtectedRoute';
import AdminLayout from '../components/admin/AdminLayout';
import { ROLES } from '../utils/constants';

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;

  return (
    <Routes>
      <Route path="/signin" element={user ? <Navigate to="/" replace /> : <SignIn />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <SignUp />} />

      <Route
        path="/user"
        element={
          <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
            <Routes>
              <Route index element={<UserHome />} />
              <Route path="clubs-sports" element={<ClubsSports />} />
              <Route path="resource-sharing" element={<ResourceSharing />} />
              <Route path="consulting" element={<Consulting />} />
              <Route path="events-chill" element={<EventsChill />} />
            </Routes>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/super"
        element={
          <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <AdminLayout>
              <SuperAdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/coaches"
        element={
          <ProtectedRoute allowedRoles={[ROLES.COACH, ROLES.SUPER_ADMIN]}>
            <AdminLayout>
              <CoachesDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/resources"
        element={
          <ProtectedRoute allowedRoles={[ROLES.RESOURCE_COORDINATOR, ROLES.SUPER_ADMIN]}>
            <AdminLayout>
              <ResourceCoordinatorDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/consulting"
        element={
          <ProtectedRoute allowedRoles={[ROLES.CONSULTANT, ROLES.SUPER_ADMIN]}>
            <AdminLayout>
              <ConsultantDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events"
        element={
          <ProtectedRoute allowedRoles={[ROLES.EVENT_COORDINATOR, ROLES.SUPER_ADMIN]}>
            <AdminLayout>
              <EventCoordinatorDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          user ? (
            <RoleRoutes />
          ) : (
            <div className="page">
              <nav className="navbar">
                <Link to="/" className="navbar-brand">Campus Connect</Link>
                <div className="navbar-menu">
                  <Link to="/signin">Sign In</Link>
                  <Link to="/signup" className="btn-nav-signup">Sign Up</Link>
                </div>
              </nav>
              <div className="landing">
                <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-foreground font-heading font-bold text-2xl">
                    CC
                  </span>
                </div>
                <h1>Campus Connect</h1>
                <p>Your campus community hub — clubs, resources, consulting & events.</p>
                <div className="landing-actions">
                  <Link to="/signin">Sign In</Link>
                  <Link to="/signup">Sign Up</Link>
                </div>
              </div>
              <footer className="footer">
                <p>&copy; {new Date().getFullYear()} Campus Connect. All rights reserved.</p>
              </footer>
            </div>
          )
        }
      />

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
