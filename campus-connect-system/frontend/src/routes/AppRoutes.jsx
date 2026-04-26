import { Routes, Route, Link } from 'react-router-dom';
import SignIn from '../pages/auth/SignIn';
import SignUp from '../pages/auth/SignUp';
import UserHome from '../pages/user/UserHome';
import UserProfile from '../pages/user/UserProfile';
import ClubsSports from '../pages/user/ClubsSports';
import MedicleSupport from '../pages/user/MedicleSupport';
import ResourceSharing from '../pages/user/ResourceSharing';
import Consulting from '../pages/user/Consulting';
import EventsChill from '../pages/user/EventsChill';
import EventDetails from '../pages/user/EventDetails';
import SuperAdminDashboard from '../pages/admin/SuperAdminDashboard';
import CoachesDashboard from '../pages/admin/CoachesDashboard';
import ResourceCoordinatorDashboard from '../pages/admin/ResourceCoordinatorDashboard';
import ConsultantDashboard from '../pages/admin/ConsultantDashboard';
import EventCoordinatorDashboard from '../pages/admin/EventCoordinatorDashboard';
import CoachProfile from '../pages/admin/CoachProfile';
import AdminLayout from '../components/admin/AdminLayout';
import ProtectedRoute from '../components/protected/ProtectedRoute';
import { ROLES } from '../utils/constants';
import ConsultantDetails from '../pages/user/ConsultingDetails';
import ConsultingReviewDashboard from '../pages/admin/ConsultingReviewDasboard';
import CouncellingHistory from '../pages/user/CouncellingHistory';


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      <Route path="/user" element={<UserHome />} />
      <Route path="/user/home" element={<UserHome />} />
      <Route path="/user/profile" element={<UserProfile />} />
      <Route path="/user/clubs-sports" element={<ClubsSports />} />
      <Route path="/user/clubs-sports/medicle-support" element={<MedicleSupport />} />
      <Route path="/user/resource-sharing" element={<ResourceSharing />} />
      <Route path="/user/consulting" element={<Consulting />} />
      <Route path="/user/events" element={<EventsChill />} />
      <Route path="/user/events-chill" element={<EventsChill />} />
      <Route path="/user/events/:id" element={<EventDetails />} />
      <Route path="/user/events-chill/:id" element={<EventDetails />} />
      <Route path="/user/consulting/:id" element={<ConsultantDetails />}/>
      <Route path="/user/councelling-history" element={<CouncellingHistory />} />

      <Route
        path="/admin/super"
        element={
          <AdminLayout>
            <SuperAdminDashboard />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/coaches"
        element={
          <AdminLayout>
            <CoachesDashboard />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <AdminLayout>
            <CoachProfile />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/resources"
        element={
          <AdminLayout>
            <ResourceCoordinatorDashboard />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/consulting"
        element={
          <AdminLayout>
            <ConsultantDashboard />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/events"
        element={
          <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.EVENT_COORDINATOR]}>
            <AdminLayout>
              <EventCoordinatorDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/consulting/reviews"
        element={
          <AdminLayout>
            <ConsultingReviewDashboard />
          </AdminLayout>
        }
      />
      <Route
        path="/"
        element={
          <div className="page">
              <nav className="navbar">
                <Link to="/" className="navbar-brand flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-md border border-white/30">
                    <span className="text-white font-heading font-black text-lg">
                      CC
                    </span>
                  </div>
                  Campus Connect
                </Link>
                <div className="navbar-menu">
                  <Link to="/signin" className="hidden sm:inline px-4 py-2 rounded-lg hover:bg-white/10 transition-colors font-medium">Sign In</Link>
                  <Link to="/signup" className="px-4 py-2.5 rounded-xl bg-white/15 border border-white/30 hover:bg-white/25 transition-all backdrop-blur-sm font-bold shadow-sm">Sign Up</Link>
                </div>
              </nav>
              <div className="landing">
                <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mx-auto mb-8 shadow-2xl border-4 border-white/20 animate-fade-in">
                  <span className="text-white font-heading font-black text-5xl">
                    CC
                  </span>
                </div>
                <h1 className="landing-content">Campus Connect</h1>
                <p className="max-w-2xl mx-auto">Your all-in-one platform for campus life. Connect with clubs, share resources, book consulting sessions, and discover exciting events all in one place.</p>
                <div className="landing-actions">
                  <Link to="/signin" className="btn-primary">Get Started</Link>
                  <Link to="/signup" className="btn-secondary">Create Account</Link>
                </div>
              </div>
              <footer className="footer">
                <div className="max-w-7xl mx-auto">
                  <p className="font-medium">
                    &copy; {new Date().getFullYear()} <span className="font-bold">Campus Connect</span>. All rights reserved.
                  </p>
                  <p className="text-sm text-white/70 mt-1">
                    Connecting campus life, one click at a time
                  </p>
                </div>
              </footer>
            </div>
        }
      />
    </Routes>
  );
}
