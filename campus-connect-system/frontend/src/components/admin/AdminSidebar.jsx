import { NavLink } from 'react-router-dom';

const MENU_ITEMS = [
  { path: '/admin/super', label: 'Approvals' },
  { path: '/admin/coaches', label: 'Clubs & Sports' },
  { path: '/admin/resources', label: 'Resource Sharing' },
  { path: '/admin/consulting/reviews', label: 'Consulting' },
  { path: '/admin/events', label: 'Events & Chill Sessions' },
];

export default function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <nav className="admin-sidebar-nav">
        <h3 className="admin-sidebar-title">Admin Panels</h3>
        {MENU_ITEMS.map((item) => (
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
