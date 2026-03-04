import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

const MENU_ITEMS = [
  { path: '/admin/super', label: 'Approvals' },
  { path: '/admin/coaches', label: 'Clubs & Sports' },
  { path: '/admin/resources', label: 'Resource Sharing' },
  { path: '/admin/consulting', label: 'Consulting' },
  { path: '/admin/events', label: 'Events & Chill Sessions' },
];

export default function AdminSidebar() {
  const { user } = useAuth();

  const menuByRole = {
    [ROLES.SUPER_ADMIN]: MENU_ITEMS,
    [ROLES.COACH]: [MENU_ITEMS[1]],
    [ROLES.RESOURCE_COORDINATOR]: [MENU_ITEMS[2]],
    [ROLES.CONSULTANT]: [MENU_ITEMS[3]],
    [ROLES.EVENT_COORDINATOR]: [MENU_ITEMS[4]],
  };

  const visibleItems = menuByRole[user?.role] || [MENU_ITEMS[4]];

  return (
    <aside className="admin-sidebar">
      <nav className="admin-sidebar-nav">
        <h3 className="admin-sidebar-title">Admin Panels</h3>
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `admin-sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
