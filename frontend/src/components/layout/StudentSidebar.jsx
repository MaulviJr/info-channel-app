import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart2, BookOpen, LayoutDashboard, LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/courses', label: 'My Courses', icon: BookOpen },
  { to: '/student/profile', label: 'My Profile', icon: User },
  { to: '/student/progress', label: 'Progress', icon: BarChart2 },
];

function StudentSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const linkBase = 'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-lg';

  return (
    <aside className="w-60 h-full bg-sidebar flex flex-col flex-shrink-0">
      <div className="p-5">
        <div className="text-accent font-semibold text-base">Info Channel</div>
        <div className="text-sidebar-foreground/50 text-xs mt-0.5">Student Portal</div>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? 'bg-accent/15 text-accent font-medium'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/login', { replace: true });
          }}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground w-full rounded-lg hover:bg-sidebar-accent/40"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default StudentSidebar;
