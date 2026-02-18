import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';
import AdminLayout from '../components/admin/AdminLayout';
import CoachesDashboard from '../pages/admin/CoachesDashboard';
import ResourceCoordinatorDashboard from '../pages/admin/ResourceCoordinatorDashboard';
import ConsultantDashboard from '../pages/admin/ConsultantDashboard';
import EventCoordinatorDashboard from '../pages/admin/EventCoordinatorDashboard';
import UserHome from '../pages/user/UserHome';

export default function RoleRoutes() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/signin" replace />;

  switch (user.role) {
    case ROLES.SUPER_ADMIN:
      return <Navigate to="/admin/super" replace />;
    case ROLES.COACH:
      return <AdminLayout><CoachesDashboard /></AdminLayout>;
    case ROLES.RESOURCE_COORDINATOR:
      return <AdminLayout><ResourceCoordinatorDashboard /></AdminLayout>;
    case ROLES.CONSULTANT:
      return <AdminLayout><ConsultantDashboard /></AdminLayout>;
    case ROLES.EVENT_COORDINATOR:
      return <AdminLayout><EventCoordinatorDashboard /></AdminLayout>;
    case ROLES.STUDENT:
    default:
      return <UserHome />;
  }
}
